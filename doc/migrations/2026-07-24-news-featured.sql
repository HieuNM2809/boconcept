-- ============================================================================
-- Migration: news-featured (2026-07-24)
--
-- VÌ SAO CẦN FILE NÀY:
-- Trước đây trang chủ lấy 4 bài tin tức đầu tiên đang Hiện (sắp theo sort_order),
-- tức là "bài nào lên trang chủ" bị quyết định gián tiếp bởi ô Thứ tự — admin
-- muốn đẩy một bài lên trang chủ thì phải chỉnh số thứ tự của cả loạt bài khác.
--
-- Nay bảng `news` có cờ `is_featured` (giống `products`/`categories`) và trang
-- chủ CHỈ lấy bài có cờ này. Không bài nào được tick thì cả khối Tin tức tự ẩn.
--
-- CỘT MỚI DEFAULT 0 -> nếu chỉ ALTER mà không UPDATE, khối Tin tức ngoài trang
-- chủ sẽ biến mất ngay sau khi deploy. Nên file này bật cờ cho đúng 4 bài ĐANG
-- hiển thị trên trang chủ hiện tại (status=1, sort_order ASC, id ASC, LIMIT 4)
-- để giao diện không đổi gì; sau đó admin tự tick lại ở /admin/news.
--
-- AN TOÀN: chạy lại lần hai không ghi đè — phần UPDATE chỉ chạy khi CHƯA có bài
-- nào được đánh nổi bật, nên lựa chọn của admin về sau luôn được giữ nguyên.
--
-- Chạy: docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--         -uroot -proot app_db < doc/migrations/2026-07-24-news-featured.sql
-- ============================================================================
SET NAMES utf8mb4;

-- ── Thêm cột/index kiểu "chạy lại được" ─────────────────────────────────────
-- MySQL không có ADD COLUMN IF NOT EXISTS, nên phải hỏi information_schema rồi
-- dựng câu ALTER động. Thủ tục là tạm: DROP ở cuối file.
DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;

DELIMITER //

CREATE PROCEDURE _mig_add_col(IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

CREATE PROCEDURE _mig_add_idx(IN p_table VARCHAR(64), IN p_idx VARCHAR(64), IN p_def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

DELIMITER ;

CALL _mig_add_col('news', 'is_featured', 'TINYINT NOT NULL DEFAULT 0');
CALL _mig_add_idx('news', 'idx_news_is_featured', 'KEY `idx_news_is_featured` (`is_featured`)');

-- ── Giữ nguyên giao diện: bật cờ cho 4 bài đang nằm trên trang chủ ──────────
-- Đếm TRƯỚC rồi mới UPDATE: nếu admin đã tick tay thì @already > 0 và câu
-- UPDATE bên dưới không đụng hàng nào.
SET @already := (SELECT COUNT(*) FROM `news` WHERE `is_featured` = 1);

-- Bọc thêm một lớp bảng dẫn xuất (SELECT ... FROM (...) t) vì MySQL không cho
-- subquery đọc thẳng chính bảng đang UPDATE, và cũng không nhận LIMIT trong IN.
UPDATE `news`
SET `is_featured` = 1,
    `updated_at`  = NOW()
WHERE @already = 0
  AND `id` IN (
    SELECT `id` FROM (
        SELECT `id` FROM `news`
        WHERE `status` = 1
        ORDER BY `sort_order` ASC, `id` ASC
        LIMIT 4
    ) AS t
);

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;
