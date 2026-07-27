#!/usr/bin/env node
/**
 * SO SÁNH SCHEMA production với DB local, tìm cột bị lệch kiểu.
 *
 * VÌ SAO CẦN: `doc/schema.sql` chỉ dùng CREATE TABLE IF NOT EXISTS, còn việc nới
 * kiểu cột nằm trong `doc/migrations/*.sql`. Quên chạy migration trên production
 * thì bảng vẫn tồn tại, trang vẫn chạy, chỉ tới lúc admin upload ảnh mới nổ:
 *
 *     Data too long for column 'logo' at row 1     (MySQL 1406)
 *
 * Ảnh lưu base64 (~2MB chuỗi) mà cột còn là VARCHAR(500) thì không nhét vừa.
 * Lỗi này KHÔNG liên quan gì tới lỗi 1114 "table is full" (hết đĩa) — khác hẳn.
 *
 * Lấy local làm chuẩn vì local dựng từ schema.sql + TẤT CẢ migration, nên nó
 * phản ánh đúng trạng thái mà code đang mong đợi. So kiểu này bắt được mọi lệch,
 * không chỉ mấy cột ảnh mà tôi nghĩ ra được.
 *
 * CÁCH CHẠY
 *   MYSQL_PUBLIC_URL="mysql://root:xxx@yyy.proxy.rlwy.net:12345/railway" \
 *     node scripts/check-schema-drift.js            # chỉ báo cáo
 *
 *   MYSQL_PUBLIC_URL="..." node scripts/check-schema-drift.js --apply
 *     # chạy các lệnh ALTER để kéo production về khớp local
 *
 * AN TOÀN: chỉ NỚI RỘNG (varchar -> text/mediumtext, varchar ngắn -> dài hơn) và
 * THÊM cột còn thiếu. Không bao giờ thu hẹp, không bao giờ xoá cột hay bảng —
 * những thao tác đó làm mất dữ liệu nên phải do người quyết định, không phải script.
 */

const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../.env')});
const mysql = require('mysql2/promise');

const APPLY = process.argv.includes('--apply');

const PROD_URL =
    process.env.MYSQL_PUBLIC_URL ||
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    '';

// Thứ tự "sức chứa" để biết một thay đổi là nới rộng hay thu hẹp.
const TEXT_RANK = {varchar: 1, tinytext: 1, text: 2, mediumtext: 3, longtext: 4};

async function connect(cfg) {
    return mysql.createConnection({...cfg, charset: 'utf8mb4'});
}

async function columnsOf(conn) {
    const [rows] = await conn.query(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE,
               CHARACTER_MAXIMUM_LENGTH AS len, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()`);
    const map = new Map();
    for (const r of rows) map.set(`${r.TABLE_NAME}.${r.COLUMN_NAME}`, r);
    return map;
}

/** Thay đổi này có làm mất dữ liệu không? */
function isWidening(local, prod) {
    const lr = TEXT_RANK[local.DATA_TYPE];
    const pr = TEXT_RANK[prod.DATA_TYPE];
    if (lr && pr) {
        if (lr !== pr) return lr > pr;                       // text-family: hạng cao hơn = rộng hơn
        return Number(local.len || 0) >= Number(prod.len || 0); // cùng hạng: dài hơn = rộng hơn
    }
    return false; // kiểu không cùng họ chữ -> không tự động đụng vào
}

(async () => {
    if (!PROD_URL) {
        console.error(
            '❌ Thiếu MYSQL_PUBLIC_URL (URL public của service MySQL trên Railway).\n' +
            '   Lấy ở: Railway -> service MySQL -> tab Variables.',
        );
        process.exit(1);
    }

    const local = await connect({
        host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS,
    });
    const prod = await connect({uri: PROD_URL});

    const [[l]] = await local.query('SELECT DATABASE() db, VERSION() v');
    const [[p]] = await prod.query('SELECT DATABASE() db, VERSION() v');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(` CHUẨN (local): ${l.db} — MySQL ${l.v}`);
    console.log(` ĐÍCH  (prod):  ${p.db} — MySQL ${p.v}`);
    console.log(` Chế độ: ${APPLY ? 'THỰC THI (--apply)' : 'chỉ báo cáo'}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const localCols = await columnsOf(local);
    const prodCols = await columnsOf(prod);

    const missing = [];   // prod thiếu cột
    const widen = [];     // prod có nhưng hẹp hơn
    const other = [];     // lệch kiểu nhưng không phải nới rộng -> chỉ báo

    for (const [key, lcol] of localCols) {
        const pcol = prodCols.get(key);
        if (!pcol) { missing.push({key, lcol}); continue; }
        if (lcol.COLUMN_TYPE === pcol.COLUMN_TYPE) continue;
        (isWidening(lcol, pcol) ? widen : other).push({key, lcol, pcol});
    }

    if (!missing.length && !widen.length && !other.length) {
        console.log('✅ Không lệch gì. Schema production khớp local.');
        await local.end(); await prod.end();
        return;
    }

    const statements = [];

    if (widen.length) {
        console.log('── CỘT HẸP HƠN CHUẨN (đây là thứ gây "Data too long") ─────────');
        for (const {key, lcol, pcol} of widen) {
            const [table, col] = key.split('.');
            console.log(`   ${key.padEnd(30)} prod: ${pcol.COLUMN_TYPE.padEnd(14)} -> cần: ${lcol.COLUMN_TYPE}`);
            const nullSql = lcol.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
            statements.push(`ALTER TABLE \`${table}\` MODIFY \`${col}\` ${lcol.COLUMN_TYPE.toUpperCase()} ${nullSql}`);
        }
        console.log('');
    }

    if (missing.length) {
        console.log('── CỘT PRODUCTION CHƯA CÓ ─────────────────────────────────────');
        for (const {key, lcol} of missing) {
            const [table, col] = key.split('.');
            console.log(`   ${key.padEnd(30)} cần thêm: ${lcol.COLUMN_TYPE}`);
            // Cột mới luôn thêm dạng NULL: bảng đang có dữ liệu mà ép NOT NULL
            // thì MySQL nhét giá trị mặc định câm vào mọi dòng cũ.
            statements.push(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${lcol.COLUMN_TYPE.toUpperCase()} NULL`);
        }
        console.log('');
    }

    if (other.length) {
        console.log('── LỆCH KHÁC (KHÔNG tự sửa — có thể mất dữ liệu) ──────────────');
        for (const {key, lcol, pcol} of other) {
            console.log(`   ${key.padEnd(30)} prod: ${pcol.COLUMN_TYPE.padEnd(14)} local: ${lcol.COLUMN_TYPE}`);
        }
        console.log('   -> Xem từng cái rồi quyết định thủ công.\n');
    }

    if (!statements.length) {
        console.log('Không có lệnh nào an toàn để tự chạy.');
        await local.end(); await prod.end();
        return;
    }

    console.log('── LỆNH SẼ CHẠY ───────────────────────────────────────────────');
    for (const s of statements) console.log(`   ${s};`);
    console.log('');

    if (!APPLY) {
        console.log('Đây mới là bản xem trước. Thêm --apply để thực thi.');
        await local.end(); await prod.end();
        return;
    }

    for (const s of statements) {
        try {
            await prod.query(s);
            console.log(`   ✅ ${s}`);
        } catch (e) {
            console.log(`   ❌ ${s}\n      ${e.message}`);
        }
    }
    console.log('\nXong. Chạy lại script (không kèm --apply) để xác nhận đã hết lệch.');

    await local.end(); await prod.end();
})().catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
});
