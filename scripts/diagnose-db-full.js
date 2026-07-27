#!/usr/bin/env node
/**
 * CHẨN ĐOÁN lỗi MySQL 1114 — "The table '<tên>' is full".
 *
 * VÌ SAO CẦN SCRIPT NÀY: mã lỗi 1114 KHÔNG có nghĩa "bảng đó đầy". Với InnoDB nó
 * gần như luôn có nghĩa "InnoDB không xin thêm được dung lượng ổ đĩa", và MySQL
 * đặt tên bảng mà câu lệnh đang chạm vào lúc hết chỗ. Đó là lý do cùng lúc thấy
 * partners / certificates / news / products / categories đều "full": không phải
 * 5 lỗi, mà là 1 lỗi — hết ổ đĩa của service MySQL.
 *
 * Script CHỈ ĐỌC, không sửa gì. Nó trả lời đúng một câu hỏi: chỗ trống đã đi đâu
 * — vào dữ liệu bảng, vào binary log, hay vào phần .ibd phình mà chưa trả lại?
 *
 * CÁCH CHẠY
 *   railway run --service MySQL node scripts/diagnose-db-full.js
 * hoặc tự dán URL public của service MySQL:
 *   MYSQL_PUBLIC_URL="mysql://root:xxx@yyy.proxy.rlwy.net:12345/railway" \
 *     node scripts/diagnose-db-full.js
 */

const path = require('path');
// Nạp .env như config/*.js để chạy được cả trên máy cá nhân (không có biến Railway).
require('dotenv').config({path: path.resolve(__dirname, '../.env')});
const mysql = require('mysql2/promise');

const URL =
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    '';

// Các cột đang chứa ảnh dạng data URI base64 (xem doc/schema.sql).
const IMAGE_COLUMNS = [
    ['categories', 'image'],
    ['products', 'thumbnail'],
    ['product_images', 'url'],
    ['product_variants', 'image'],
    ['slides', 'image'],
    ['partners', 'logo'],
    ['certificates', 'image'],
    ['features', 'icon'],
    ['news', 'image'],
    ['gallery', 'image'],
    ['pages', 'image'],
];

// Cột nội dung richtext có thể nhúng base64 trong thân bài.
const RICHTEXT_COLUMNS = [
    ['news', 'body_vi'], ['news', 'body_en'],
    ['pages', 'body_vi'], ['pages', 'body_en'],
    ['products', 'extra_vi'], ['products', 'extra_en'],
    ['products', 'shipping_vi'], ['products', 'shipping_en'],
];

const mb = (bytes) => (Number(bytes || 0) / 1024 / 1024).toFixed(1).padStart(9) + ' MB';

function connectionConfig() {
    if (URL) return {uri: URL, charset: 'utf8mb4'};
    const {DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS} = process.env;
    if (!DB_HOST || !DB_NAME) {
        console.error(
            '❌ Không có thông tin kết nối.\n' +
            '   Chạy:  railway run --service MySQL node scripts/diagnose-db-full.js\n' +
            '   hoặc:  MYSQL_PUBLIC_URL="mysql://..." node scripts/diagnose-db-full.js',
        );
        process.exit(1);
    }
    return {
        host: DB_HOST, port: Number(DB_PORT || 3306), database: DB_NAME,
        user: DB_USER, password: DB_PASS, charset: 'utf8mb4',
    };
}

/** Chạy truy vấn có thể bị từ chối quyền -> trả null thay vì làm hỏng cả báo cáo. */
async function tryQuery(conn, sql) {
    try {
        const [rows] = await conn.query(sql);
        return rows;
    } catch (e) {
        console.log(`   (bỏ qua: ${sql.split('\n')[0].slice(0, 48)}… -> ${e.message})`);
        return null;
    }
}

/** Danh sách bảng thật sự tồn tại — schema mỗi môi trường một khác. */
async function existingColumns(conn, pairs) {
    const rows = await tryQuery(
        conn,
        'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
    );
    if (!rows) return [];
    const have = new Set(rows.map((r) => `${r.TABLE_NAME}.${r.COLUMN_NAME}`));
    return pairs.filter(([t, c]) => have.has(`${t}.${c}`));
}

(async () => {
    const conn = await mysql.createConnection(connectionConfig());

    const [[info]] = await conn.query(
        'SELECT DATABASE() AS db, VERSION() AS version, @@innodb_file_per_table AS per_table',
    );
    console.log('════════════════════════════════════════════════════════════════');
    console.log(` DB: ${info.db}   MySQL ${info.version}   file_per_table=${info.per_table}`);
    console.log('════════════════════════════════════════════════════════════════\n');

    // ── 1. Dung lượng từng bảng ──────────────────────────────────────────────
    // data_free = phần .ibd đã cấp phát nhưng đang trống bên trong (đã xoá/sửa
    // dữ liệu nhưng file KHÔNG tự co lại). Con số này lớn = OPTIMIZE TABLE sẽ
    // trả lại được ngần đó cho ổ đĩa.
    console.log('── 1. DUNG LƯỢNG BẢNG ─────────────────────────────────────────');
    const tables = await tryQuery(conn, `
        SELECT TABLE_NAME, ENGINE, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH, DATA_FREE
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC`);
    let totData = 0, totFree = 0;
    if (tables) {
        console.log('   bảng                     dòng        dữ liệu     chỉ mục   trống-trong-file');
        for (const t of tables) {
            totData += Number(t.DATA_LENGTH || 0) + Number(t.INDEX_LENGTH || 0);
            totFree += Number(t.DATA_FREE || 0);
            console.log(
                `   ${String(t.TABLE_NAME).padEnd(22)} ${String(t.TABLE_ROWS ?? '?').padStart(8)}` +
                ` ${mb(t.DATA_LENGTH)} ${mb(t.INDEX_LENGTH)} ${mb(t.DATA_FREE)}`,
            );
        }
    }
    console.log(`\n   TỔNG dữ liệu+chỉ mục: ${mb(totData)}`);
    console.log(`   TỔNG trống-trong-file: ${mb(totFree)}  ← lấy lại được bằng OPTIMIZE TABLE\n`);

    // ── 2. Binary log ────────────────────────────────────────────────────────
    // Thủ phạm hay bị bỏ sót nhất. MySQL 8 bật log_bin MẶC ĐỊNH và giữ 30 ngày.
    // Mỗi lần lưu form sản phẩm gửi lại TOÀN BỘ ảnh base64 -> mỗi lần lưu ghi
    // thêm vài chục MB vào binlog, dù dữ liệu bảng gần như không đổi.
    console.log('── 2. BINARY LOG ──────────────────────────────────────────────');
    const logBin = await tryQuery(conn, "SHOW VARIABLES LIKE 'log_bin'");
    const expire = await tryQuery(conn, "SHOW VARIABLES LIKE 'binlog_expire_logs_seconds'");
    if (logBin) console.log(`   log_bin = ${logBin[0] ? logBin[0].Value : '?'}`);
    if (expire && expire[0]) {
        const days = Number(expire[0].Value) / 86400;
        console.log(`   binlog_expire_logs_seconds = ${expire[0].Value} (${days.toFixed(1)} ngày)`);
    }
    const binlogs = await tryQuery(conn, 'SHOW BINARY LOGS');
    if (binlogs) {
        const total = binlogs.reduce((s, b) => s + Number(b.File_size || 0), 0);
        console.log(`   số file binlog: ${binlogs.length}`);
        console.log(`   TỔNG binlog:  ${mb(total)}  ← KHÔNG nằm trong tổng ở mục 1`);
        if (total > 200 * 1024 * 1024) {
            console.log('   ⚠️  binlog đang chiếm nhiều hơn 200MB — nhiều khả năng đây là thứ làm đầy ổ.');
        }
    }
    console.log('');

    // ── 3. Ảnh base64 chiếm bao nhiêu ────────────────────────────────────────
    console.log('── 3. ẢNH BASE64 TRONG DB ─────────────────────────────────────');
    const imgCols = await existingColumns(conn, IMAGE_COLUMNS);
    let imgTotal = 0;
    for (const [table, col] of imgCols) {
        const rows = await tryQuery(conn, `
            SELECT COUNT(*) AS n,
                   COALESCE(SUM(CHAR_LENGTH(\`${col}\`)), 0) AS bytes,
                   COALESCE(MAX(CHAR_LENGTH(\`${col}\`)), 0) AS biggest
            FROM \`${table}\`
            WHERE \`${col}\` LIKE 'data:image/%'`);
        if (!rows) continue;
        const r = rows[0];
        imgTotal += Number(r.bytes);
        if (Number(r.n) > 0) {
            console.log(
                `   ${`${table}.${col}`.padEnd(28)} ${String(r.n).padStart(5)} ảnh  ` +
                `${mb(r.bytes)}   lớn nhất ${mb(r.biggest)}`,
            );
        }
    }
    const rtCols = await existingColumns(conn, RICHTEXT_COLUMNS);
    let rtTotal = 0;
    for (const [table, col] of rtCols) {
        const rows = await tryQuery(conn, `
            SELECT COALESCE(SUM(CHAR_LENGTH(\`${col}\`)), 0) AS bytes
            FROM \`${table}\` WHERE \`${col}\` LIKE '%data:image/%'`);
        if (rows) rtTotal += Number(rows[0].bytes);
    }
    console.log(`\n   TỔNG cột ảnh:        ${mb(imgTotal)}`);
    console.log(`   TỔNG ảnh nhúng trong richtext: ${mb(rtTotal)}\n`);

    // ── 4. Dòng đã xoá mềm vẫn giữ ảnh ───────────────────────────────────────
    // products/categories dùng paranoid: DELETE chỉ set deleted_at, ảnh base64
    // của dòng đó vẫn nằm nguyên trong .ibd và vẫn ăn ổ đĩa.
    console.log('── 4. DÒNG ĐÃ XOÁ MỀM (vẫn chiếm chỗ) ─────────────────────────');
    for (const [table, col] of [['products', 'thumbnail'], ['categories', 'image']]) {
        const rows = await tryQuery(conn, `
            SELECT COUNT(*) AS n, COALESCE(SUM(CHAR_LENGTH(\`${col}\`)), 0) AS bytes
            FROM \`${table}\` WHERE deleted_at IS NOT NULL`);
        if (rows) console.log(`   ${table.padEnd(14)} ${String(rows[0].n).padStart(5)} dòng   ${mb(rows[0].bytes)}`);
    }
    console.log('');

    // ── 5. Ảnh mồ côi ────────────────────────────────────────────────────────
    // product_images trỏ tới sản phẩm đã xoá mềm: FK ON DELETE CASCADE không
    // kích hoạt vì sản phẩm chưa bị xoá thật -> ảnh nằm lại vĩnh viễn.
    console.log('── 5. ẢNH MỒ CÔI (thuộc sản phẩm đã xoá mềm) ──────────────────');
    const orphan = await tryQuery(conn, `
        SELECT COUNT(*) AS n, COALESCE(SUM(CHAR_LENGTH(pi.url)), 0) AS bytes
        FROM product_images pi
        JOIN products p ON p.id = pi.product_id
        WHERE p.deleted_at IS NOT NULL`);
    if (orphan) console.log(`   product_images: ${String(orphan[0].n).padStart(5)} ảnh   ${mb(orphan[0].bytes)}`);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(' Đối chiếu TỔNG ở mục 1 + TỔNG binlog ở mục 2 với dung lượng');
    console.log(' volume của service MySQL trên Railway (tab Metrics → Disk Usage).');
    console.log(' Sát trần = xác nhận nguyên nhân gốc là HẾT Ổ ĐĨA.');
    console.log('════════════════════════════════════════════════════════════════');

    await conn.end();
})().catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
});
