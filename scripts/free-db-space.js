#!/usr/bin/env node
/**
 * GIẢI PHÓNG dung lượng cho MySQL đang báo lỗi 1114 "The table 'X' is full".
 *
 * MẶC ĐỊNH CHỈ CHẠY THỬ (dry-run) — in ra sẽ thu lại được bao nhiêu, KHÔNG sửa gì.
 * Muốn thực thi thật thì thêm cờ --apply.
 *
 *   node scripts/free-db-space.js                  # xem trước, an toàn tuyệt đối
 *   node scripts/free-db-space.js --apply          # thực thi
 *   node scripts/free-db-space.js --apply --purge-orphans   # + xoá ảnh mồ côi
 *
 * Trên Railway:
 *   railway run --service MySQL node scripts/free-db-space.js --apply
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THỨ TỰ CÁC BƯỚC LÀ CÓ CHỦ Ý, ĐỪNG ĐẢO:
 *
 *   1) PURGE BINARY LOGS trước tiên. Đây là bước DUY NHẤT không cần sẵn chỗ
 *      trống để chạy — nó chỉ xoá file. Khi đĩa đã đầy 100% thì mọi bước sau
 *      (kể cả OPTIMIZE TABLE) đều fail nếu chưa có bước này.
 *   2) Xoá nội dung ảnh thừa -> dòng ngắn lại, nhưng file .ibd VẪN GIỮ NGUYÊN
 *      kích thước. InnoDB không bao giờ tự trả chỗ lại cho hệ điều hành.
 *   3) OPTIMIZE TABLE -> dựng lại bảng, lúc này .ibd mới thật sự co lại.
 *      Bước này CẦN chỗ trống cỡ bằng chính bảng đó để dựng bản sao.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VÌ SAO XOÁ NỘI DUNG ẢNH CHỨ KHÔNG XOÁ DÒNG:
 *
 *   `fk_products_category` và `fk_categories_parent` đều là ON DELETE SET NULL.
 *   Xoá cứng một category đã soft-delete sẽ âm thầm set category_id = NULL cho
 *   những SẢN PHẨM ĐANG SỐNG vẫn trỏ vào nó — mất dữ liệu mà không báo gì.
 *   Đặt cột ảnh về NULL thu lại >90% số byte với rủi ro tham chiếu bằng 0.
 */

const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../.env')});
const mysql = require('mysql2/promise');

const APPLY = process.argv.includes('--apply');
const PURGE_ORPHANS = process.argv.includes('--purge-orphans');

const URL =
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    '';

const mb = (bytes) => (Number(bytes || 0) / 1024 / 1024).toFixed(1) + ' MB';

function connectionConfig() {
    if (URL) return {uri: URL, charset: 'utf8mb4'};
    const {DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS} = process.env;
    if (!DB_HOST || !DB_NAME) {
        console.error('❌ Thiếu thông tin kết nối. Xem hướng dẫn ở đầu file.');
        process.exit(1);
    }
    return {
        host: DB_HOST, port: Number(DB_PORT || 3306), database: DB_NAME,
        user: DB_USER, password: DB_PASS, charset: 'utf8mb4',
    };
}

async function tryQuery(conn, sql, label) {
    try {
        const [rows] = await conn.query(sql);
        return rows;
    } catch (e) {
        console.log(`   ⚠️  ${label || 'truy vấn'} thất bại: ${e.message}`);
        return null;
    }
}

/** Chỉ chạy khi có --apply; ngược lại in ra câu lệnh sẽ chạy. */
async function run(conn, sql, label) {
    if (!APPLY) {
        console.log(`   [thử] sẽ chạy: ${sql.replace(/\s+/g, ' ').trim().slice(0, 90)}`);
        return null;
    }
    return tryQuery(conn, sql, label);
}

(async () => {
    const conn = await mysql.createConnection(connectionConfig());

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(APPLY
        ? ' CHẾ ĐỘ THỰC THI (--apply) — sẽ thay đổi dữ liệu'
        : ' CHẾ ĐỘ CHẠY THỬ — không thay đổi gì. Thêm --apply để thực thi.');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // ── BƯỚC 1: binary log ───────────────────────────────────────────────────
    console.log('── BƯỚC 1: BINARY LOG ─────────────────────────────────────────');
    const binlogs = await tryQuery(conn, 'SHOW BINARY LOGS', 'SHOW BINARY LOGS');
    if (binlogs && binlogs.length) {
        const total = binlogs.reduce((s, b) => s + Number(b.File_size || 0), 0);
        console.log(`   ${binlogs.length} file, tổng ${mb(total)} — thu lại được gần hết.`);
        // FLUSH TRƯỚC, KHÔNG BỎ ĐƯỢC: PURGE chỉ xoá các file đã đóng, còn file
        // đang ghi thì không đụng tới. Nếu phần lớn dung lượng nằm trong chính
        // file đang mở (rất thường gặp sau một đợt lưu ảnh lớn) thì PURGE sẽ báo
        // thành công mà chẳng giải phóng byte nào. FLUSH đẩy nó thành file đã
        // đóng và mở một file mới để MySQL ghi tiếp.
        await run(conn, 'FLUSH BINARY LOGS', 'FLUSH BINARY LOGS');

        // Dùng `PURGE ... TO <file>` chứ KHÔNG dùng `BEFORE NOW()`: mốc so sánh
        // của dạng BEFORE là thời điểm của chính file, mà file vừa flush xong
        // mang mốc "bây giờ" -> nằm ngoài lát cắt và sống sót. Dạng TO nói thẳng
        // "xoá mọi file đứng trước file này", không phụ thuộc đồng hồ.
        if (APPLY) {
            const list = await tryQuery(conn, 'SHOW BINARY LOGS', 'SHOW BINARY LOGS');
            const current = list && list.length ? list[list.length - 1].Log_name : null;
            if (current) await run(conn, `PURGE BINARY LOGS TO '${current}'`, 'PURGE BINARY LOGS');
        } else {
            console.log("   [thử] sẽ chạy: PURGE BINARY LOGS TO '<file mới nhất sau khi flush>'");
        }
        // Giữ 1 ngày thay vì 30. Đây là biến động (mất khi restart) — muốn bền
        // thì đặt binlog_expire_logs_seconds trong config service MySQL.
        await run(conn, 'SET GLOBAL binlog_expire_logs_seconds = 86400', 'SET GLOBAL expire');
        if (APPLY) {
            const after = await tryQuery(conn, 'SHOW BINARY LOGS', 'SHOW BINARY LOGS');
            if (after) {
                const t2 = after.reduce((s, b) => s + Number(b.File_size || 0), 0);
                console.log(`   ✅ còn lại ${after.length} file, ${mb(t2)} (đã thu ${mb(total - t2)})`);
            }
        }
    } else {
        console.log('   Không có binlog (hoặc không đủ quyền đọc) — bỏ qua.');
    }
    console.log('');

    // ── BƯỚC 2: xoá nội dung ảnh thừa ────────────────────────────────────────
    console.log('── BƯỚC 2: ẢNH KHÔNG CÒN HIỂN THỊ Ở ĐÂU ───────────────────────');

    // 2a. Ảnh của dòng đã xoá mềm: người dùng không bao giờ thấy lại, nhưng vẫn
    //     ăn đủ số byte trong .ibd.
    for (const [table, col] of [['products', 'thumbnail'], ['categories', 'image']]) {
        const rows = await tryQuery(conn, `
            SELECT COUNT(*) AS n, COALESCE(SUM(CHAR_LENGTH(\`${col}\`)), 0) AS bytes
            FROM \`${table}\` WHERE deleted_at IS NOT NULL AND \`${col}\` IS NOT NULL`);
        if (!rows || !Number(rows[0].n)) { console.log(`   ${table}: không có gì để dọn.`); continue; }
        console.log(`   ${table}: ${rows[0].n} dòng đã xoá mềm giữ ${mb(rows[0].bytes)} ảnh`);
        await run(conn,
            `UPDATE \`${table}\` SET \`${col}\` = NULL WHERE deleted_at IS NOT NULL AND \`${col}\` IS NOT NULL`,
            `dọn ${table}.${col}`);
    }

    // 2b. Ảnh gallery của sản phẩm đã xoá mềm. ON DELETE CASCADE KHÔNG chạy vì
    //     sản phẩm chưa bị xoá thật -> chúng nằm lại vĩnh viễn.
    //     Xoá hẳn: nếu sau này khôi phục sản phẩm thì gallery mất -> cần cờ riêng.
    const orphan = await tryQuery(conn, `
        SELECT COUNT(*) AS n, COALESCE(SUM(CHAR_LENGTH(pi.url)), 0) AS bytes
        FROM product_images pi JOIN products p ON p.id = pi.product_id
        WHERE p.deleted_at IS NOT NULL`);
    if (orphan && Number(orphan[0].n)) {
        console.log(`   product_images mồ côi: ${orphan[0].n} ảnh, ${mb(orphan[0].bytes)}`);
        if (PURGE_ORPHANS) {
            await run(conn, `
                DELETE pi FROM product_images pi JOIN products p ON p.id = pi.product_id
                WHERE p.deleted_at IS NOT NULL`, 'xoá ảnh mồ côi');
        } else {
            console.log('      (bỏ qua — thêm --purge-orphans nếu chấp nhận mất gallery');
            console.log('       của sản phẩm đã xoá khi khôi phục lại)');
        }
    } else {
        console.log('   product_images: không có ảnh mồ côi.');
    }
    console.log('');

    // ── BƯỚC 3: trả chỗ lại cho ổ đĩa ────────────────────────────────────────
    // .ibd không tự co. Chỉ OPTIMIZE (= ALTER TABLE ... FORCE) mới dựng lại file.
    console.log('── BƯỚC 3: OPTIMIZE TABLE (trả chỗ về ổ đĩa) ──────────────────');
    const big = await tryQuery(conn, `
        SELECT TABLE_NAME, DATA_LENGTH + INDEX_LENGTH AS sz, DATA_FREE
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND ENGINE = 'InnoDB'
          AND (DATA_FREE > 1048576 OR DATA_LENGTH > 1048576)
        ORDER BY sz DESC`);
    if (big && big.length) {
        for (const t of big) {
            console.log(`   ${t.TABLE_NAME}: ${mb(t.sz)} (trống trong file ${mb(t.DATA_FREE)})`);
            // Non-fatal: đĩa còn quá ít thì OPTIMIZE fail — bước 1 đã cứu phần lớn rồi.
            await run(conn, `OPTIMIZE TABLE \`${t.TABLE_NAME}\``, `OPTIMIZE ${t.TABLE_NAME}`);
        }
    } else {
        console.log('   Không bảng nào đáng optimize.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (APPLY) {
        console.log(' XONG. Chạy lại scripts/diagnose-db-full.js để đối chiếu,');
        console.log(' rồi thử sửa/xoá lại trong /admin.');
    } else {
        console.log(' Đây mới là bản xem trước. Chạy lại với --apply để thực thi.');
    }
    console.log('═══════════════════════════════════════════════════════════════');

    await conn.end();
})().catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
});
