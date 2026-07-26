/**
 * Áp cột `news.is_featured` lên MySQL Railway — bản Node của
 * doc/migrations/2026-07-24-news-featured.sql.
 *
 * VÌ SAO CẦN BẢN NÀY: file .sql gốc dùng DELIMITER + CREATE PROCEDURE để mô phỏng
 * "ADD COLUMN IF NOT EXISTS". `DELIMITER` là lệnh của mysql CLI, driver mysql2
 * KHÔNG hiểu -> nạp thẳng file .sql bằng Node là lỗi cú pháp. Ở đây kiểm tra
 * information_schema bằng JS rồi mới ALTER, khỏi cần stored procedure lẫn docker.
 *
 * An toàn khi chạy lại: cột/index đã có thì bỏ qua; phần backfill chỉ chạy khi
 * CHƯA bài nào được tick nổi bật, nên không ghi đè lựa chọn của admin.
 *
 * Chạy (dùng MYSQL_PUBLIC_URL của service MySQL trên Railway):
 *   MYSQL_PUBLIC_URL="mysql://root:***@xxx.proxy.rlwy.net:PORT/railway" node scripts/fix-news-featured.js
 */
const mysql = require('mysql2/promise');

const URL = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;

(async () => {
    if (!URL) throw new Error('Thiếu MYSQL_PUBLIC_URL');
    const conn = await mysql.createConnection({uri: URL, charset: 'utf8mb4'});

    const exists = async (sql, params) => (await conn.query(sql, params))[0][0].c > 0;

    const hasCol = await exists(
        "SELECT COUNT(*) c FROM information_schema.COLUMNS " +
        "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='news' AND COLUMN_NAME='is_featured'");
    if (hasCol) {
        console.log('• cột is_featured: đã có, bỏ qua');
    } else {
        await conn.query('ALTER TABLE `news` ADD COLUMN `is_featured` TINYINT NOT NULL DEFAULT 0');
        console.log('✓ cột is_featured: đã thêm');
    }

    const hasIdx = await exists(
        "SELECT COUNT(*) c FROM information_schema.STATISTICS " +
        "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='news' AND INDEX_NAME='idx_news_is_featured'");
    if (hasIdx) {
        console.log('• index idx_news_is_featured: đã có, bỏ qua');
    } else {
        await conn.query('ALTER TABLE `news` ADD KEY `idx_news_is_featured` (`is_featured`)');
        console.log('✓ index idx_news_is_featured: đã thêm');
    }

    // Backfill: cột DEFAULT 0 nghĩa là khối Tin tức ngoài trang chủ sẽ trống trơn
    // sau khi vá. Bật cờ cho tối đa 4 bài đang hiện (đúng thứ tự trang chủ vẫn
    // dùng trước đây) để giao diện không đổi.
    const [[{c: already}]] = await conn.query('SELECT COUNT(*) c FROM `news` WHERE `is_featured`=1');
    if (already > 0) {
        console.log(`• backfill: bỏ qua (đã có ${already} bài được tick nổi bật)`);
    } else {
        const [ids] = await conn.query(
            'SELECT `id` FROM `news` WHERE `status`=1 ORDER BY `sort_order` ASC, `id` ASC LIMIT 4');
        if (!ids.length) {
            console.log('• backfill: không có bài nào đang hiện');
        } else {
            const list = ids.map(r => r.id);
            await conn.query(
                'UPDATE `news` SET `is_featured`=1, `updated_at`=NOW() WHERE `id` IN (?)', [list]);
            console.log(`✓ backfill: bật cờ nổi bật cho bài id ${list.join(', ')}`);
        }
    }

    await conn.end();
    console.log('\n✅ XONG — vào lại /news và trang chủ để kiểm tra.');
})().catch(e => { console.error('❌', e.code || '', e.message); process.exit(1); });
