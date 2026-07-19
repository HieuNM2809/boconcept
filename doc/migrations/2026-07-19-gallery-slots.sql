-- ============================================================================
-- Migration: gallery-slots (2026-07-19)
--
-- VÌ SAO CẦN FILE NÀY:
-- Lưới ảnh "Style advice" ở trang chủ đổi mô hình: trước đây bảng `gallery` là
-- một KHO 1–8 ảnh, frontend tự phân bổ (3 ô lớn xoay vòng mỗi 5s, phần còn lại
-- vào ô nhỏ). Giờ chỉ còn ĐÚNG 3 KHE CỐ ĐỊNH cho 3 ô lớn — admin sửa ảnh của
-- từng khe; 5 ô nhỏ đóng cứng trong code (home.controller.js · SMALL_TILES).
--
-- Cần cột `slot` chứ không dựa vào `sort_order`: `sort_order` cho phép trùng và
-- cho phép rỗng, nên không có gì đảm bảo "ô lớn 2" luôn trỏ về đúng một hàng.
-- UNIQUE KEY trên `slot` mới là thứ khoá chặt quan hệ 1 khe ↔ 1 hàng.
--
-- CÁCH CHẠY (chạy SAU schema.sql):
--   mysql -h <host> -P <port> -u <user> -p <db> < doc/migrations/2026-07-19-gallery-slots.sql
--
-- File này AN TOÀN KHI CHẠY LẠI: kiểm tra information_schema trước mỗi thao tác.
--
-- LƯU Ý DỮ LIỆU: các hàng gallery từ thứ 4 trở đi (theo sort_order, id) KHÔNG
-- còn khe nào để hiển thị. File này KHÔNG xoá chúng — chỉ để slot = 0 và ứng
-- dụng bỏ qua. Muốn dọn hẳn thì tự chạy: DELETE FROM `gallery` WHERE `slot` = 0;
-- ============================================================================

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_add_uniq;

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

CREATE PROCEDURE _mig_add_uniq(IN p_table VARCHAR(64), IN p_idx VARCHAR(64), IN p_cols VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD UNIQUE KEY `', p_idx, '` (', p_cols, ')');
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

DELIMITER ;

-- ── 1. Cột `slot`: 1|2|3 = ô lớn tương ứng, 0 = hàng cũ không còn dùng ────────
CALL _mig_add_col('gallery', 'slot', 'TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER `id`');

-- ── 2. Gán khe cho 3 hàng đầu theo đúng thứ tự đang hiển thị trên site ────────
-- Chỉ chạy khi CHƯA hàng nào có khe, để lần chạy lại không ghi đè khe admin đã sửa.
SET @has_slot := (SELECT COUNT(*) FROM `gallery` WHERE `slot` > 0);

SET @r := 0;
UPDATE `gallery`
SET `slot` = IF(@has_slot > 0, `slot`, IF((@r := @r + 1) <= 3, @r, 0))
ORDER BY `sort_order` ASC, `id` ASC;

-- ── 3. Khoá quan hệ 1 khe ↔ 1 hàng bằng UNIQUE ───────────────────────────────
-- Các hàng ngoài khe phải mang NULL chứ KHÔNG phải 0: UNIQUE chỉ cho phép lặp
-- lại NULL, nhiều hàng cùng slot = 0 sẽ bị chặn. Nên đổi cột sang NULL-able và
-- quy 0 về NULL trước khi tạo index.
ALTER TABLE `gallery` MODIFY COLUMN `slot` TINYINT UNSIGNED NULL DEFAULT NULL;
UPDATE `gallery` SET `slot` = NULL WHERE `slot` = 0;

CALL _mig_add_uniq('gallery', 'uk_gallery_slot', '`slot`');

-- ── 4. Đảm bảo luôn tồn tại đủ 3 khe (database trống thì trang chủ vẫn có ảnh) ─
INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 1, 'https://picsum.photos/seed/insp-sofa/900/700', 'Sofa ngoài trời bên hồ bơi', 'Outdoor sofa by the pool', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 1) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 2, 'https://picsum.photos/seed/insp-dining/900/700', 'Bàn ăn ngoài trời view biển', 'Outdoor dining with sea view', 2, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 2) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 3, 'https://picsum.photos/seed/insp-garden/900/700', 'Góc vườn với chậu hoa', 'Garden corner with planters', 3, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 3) x);

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_add_uniq;
