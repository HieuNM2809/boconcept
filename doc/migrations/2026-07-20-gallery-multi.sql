-- ============================================================================
-- Migration: gallery-multi (2026-07-20)
--
-- VÌ SAO CẦN FILE NÀY:
-- Lưới ảnh "Tư vấn phong cách" ở trang chủ đổi mô hình lần nữa:
--   · 3 ô LỚN (khe 1|2|3) không còn 1 ảnh mà thành SLIDER — mỗi khe chứa nhiều
--     ảnh, trang chủ tự chuyển 5 giây một lần.
--   · 5 ô NHỎ trước đây đóng cứng trong mã nguồn (home.controller.js ·
--     SMALL_TILES) nay thành khe 4..8 trong DB để admin sửa được.
--
-- Hai thay đổi lược đồ:
--   1. BỎ `uk_gallery_slot`. UNIQUE trên `slot` chính là thứ khoá "1 khe ↔ 1
--      hàng" mà migration 2026-07-19-gallery-slots.sql dựng lên; giờ một khe
--      phải chứa được nhiều hàng nên nó phải đi.
--   2. Thêm INDEX (`slot`, `sort_order`) — mọi truy vấn đều lọc theo slot rồi
--      sắp theo sort_order.
--
-- CÁCH CHẠY:
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--     -uroot -proot app_db < doc/migrations/2026-07-20-gallery-multi.sql
--
-- AN TOÀN KHI CHẠY LẠI: kiểm tra information_schema trước mỗi thao tác lược đồ,
-- và phần seed khe 4..8 chỉ chèn khi khe đó CHƯA có hàng nào. Chạy lần hai —
-- hoặc chạy sau khi admin đã tự upload ảnh — đều không đè dữ liệu người dùng.
-- ============================================================================

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS _mig_drop_idx;
DROP PROCEDURE IF EXISTS _mig_add_idx;

DELIMITER //

CREATE PROCEDURE _mig_drop_idx(IN p_table VARCHAR(64), IN p_idx VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` DROP INDEX `', p_idx, '`');
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

CREATE PROCEDURE _mig_add_idx(IN p_table VARCHAR(64), IN p_idx VARCHAR(64), IN p_cols VARCHAR(255))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_idx
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_idx, '` (', p_cols, ')');
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

DELIMITER ;

-- ── 1. Gỡ UNIQUE để một khe chứa được nhiều ảnh ──────────────────────────────
CALL _mig_drop_idx('gallery', 'uk_gallery_slot');

-- ── 2. Index phục vụ truy vấn "lấy ảnh của khe N theo thứ tự" ────────────────
CALL _mig_add_idx('gallery', 'idx_gallery_slot_order', '`slot`, `sort_order`');

-- ── 3. Bảo đảm đủ 8 khe trong DB ─────────────────────────────────────────────
-- WHERE NOT EXISTS là điểm an toàn: khe nào đã có ảnh thì bỏ qua hoàn toàn.
--
-- Khe 1..3 cũng nằm ở đây chứ không chỉ 4..8: database hiện trường có thể thiếu
-- một vài khe lớn (ứng dụng vẫn chạy nhờ SLOT_FALLBACK nên không ai nhận ra).
-- Thiếu hàng thì admin bấm Sửa vẫn được, nhưng DB không phản ánh đúng cái đang
-- hiển thị — dựng lại đủ cho khỏi lệch.
INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 1, 'https://picsum.photos/seed/insp-sofa/900/700', 'Sofa ngoài trời bên hồ bơi', 'Outdoor sofa by the pool', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 1) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 2, 'https://picsum.photos/seed/insp-dining/900/700', 'Bàn ăn ngoài trời view biển', 'Outdoor dining with sea view', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 2) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 3, 'https://picsum.photos/seed/insp-garden/900/700', 'Góc vườn với chậu hoa', 'Garden corner with planters', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 3) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 4, 'https://picsum.photos/seed/insp-bath/700/900', 'Góc phòng tắm', 'Bathroom corner', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 4) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 5, 'https://picsum.photos/seed/insp-chair/700/700', 'Ghế thư giãn cạnh cửa sổ', 'Lounge chair by the window', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 5) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 6, 'https://picsum.photos/seed/insp-patio/800/700', 'Bộ bàn ghế sân vườn', 'Patio furniture set', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 6) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 7, 'https://picsum.photos/seed/insp-chairs/700/900', 'Ghế ăn gỗ tự nhiên', 'Natural wood dining chairs', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 7) x);

INSERT INTO `gallery` (`slot`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
SELECT 8, 'https://picsum.photos/seed/insp-lounger/800/700', 'Ghế nằm cạnh hồ bơi', 'Sun loungers by the pool', 0, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM (SELECT 1 FROM `gallery` WHERE `slot` = 8) x);

-- ── 4. Chuẩn hoá sort_order của 3 khe cũ ─────────────────────────────────────
-- Migration trước ghi sort_order = 1|2|3 (số khe). Với slider, sort_order là thứ
-- tự ẢNH TRONG khe nên khe một-ảnh phải bắt đầu từ 0. Chỉ đụng vào khe nào đang
-- có đúng 1 hàng — khe admin đã thêm ảnh thì để nguyên.
UPDATE `gallery` g
    JOIN (SELECT `slot` FROM `gallery` WHERE `slot` IN (1, 2, 3) GROUP BY `slot` HAVING COUNT(*) = 1) one
        ON one.`slot` = g.`slot`
SET g.`sort_order` = 0
WHERE g.`sort_order` <> 0;

DROP PROCEDURE IF EXISTS _mig_drop_idx;
DROP PROCEDURE IF EXISTS _mig_add_idx;
