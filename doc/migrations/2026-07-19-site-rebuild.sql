-- ============================================================================
-- Migration: site-rebuild (2026-07-19)
--
-- VÌ SAO CẦN FILE NÀY:
-- doc/schema.sql chỉ dùng CREATE TABLE IF NOT EXISTS, nên trên một database ĐÃ
-- CÓ SẴN các bảng cũ, nó KHÔNG thêm cột mới vào những bảng đó. Chạy mỗi
-- schema.sql lên production sẽ tạo được 5 bảng mới nhưng thiếu toàn bộ cột mới
-- của `products` / `categories`, khiến Sequelize ném "Unknown column ... in
-- field list" và làm 500 trang chủ, trang danh sách, trang chi tiết, tìm kiếm.
--
-- CÁCH CHẠY (chạy SAU schema.sql, TRƯỚC khi deploy code mới):
--   mysql -h <host> -P <port> -u <user> -p <db> < doc/migrations/2026-07-19-site-rebuild.sql
--
-- File này AN TOÀN KHI CHẠY LẠI: mỗi thao tác đều kiểm tra information_schema
-- trước, cột đã có thì bỏ qua. MySQL 8 không hỗ trợ ADD COLUMN IF NOT EXISTS
-- nên phải làm bằng thủ tục.
-- ============================================================================

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_mod_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;

DELIMITER //

-- Thêm cột nếu chưa có
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

-- Đổi kiểu cột nếu kiểu hiện tại khác mong muốn
CREATE PROCEDURE _mig_mod_col(IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_type VARCHAR(64), IN p_def TEXT)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_col AND DATA_TYPE <> p_type
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY `', p_col, '` ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

-- Thêm chỉ mục nếu chưa có
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

-- ── products: thuộc tính lọc + nội dung soạn thảo ───────────────────────────
CALL _mig_add_col('products', 'material_vi',   'VARCHAR(255) NULL');
CALL _mig_add_col('products', 'material_en',   'VARCHAR(255) NULL');
CALL _mig_add_col('products', 'color_vi',      'VARCHAR(255) NULL');
CALL _mig_add_col('products', 'color_en',      'VARCHAR(255) NULL');
CALL _mig_add_col('products', 'dimensions_vi', 'VARCHAR(500) NULL');
CALL _mig_add_col('products', 'dimensions_en', 'VARCHAR(500) NULL');
CALL _mig_add_col('products', 'weight',        'DECIMAL(10,2) NULL');
CALL _mig_add_col('products', 'extra_vi',      'MEDIUMTEXT NULL');
CALL _mig_add_col('products', 'extra_en',      'MEDIUMTEXT NULL');
CALL _mig_add_col('products', 'shipping_vi',   'MEDIUMTEXT NULL');
CALL _mig_add_col('products', 'shipping_en',   'MEDIUMTEXT NULL');

-- ── categories: tiêu đề + mô tả riêng cho trang danh sách ───────────────────
CALL _mig_add_col('categories', 'title_vi',       'VARCHAR(255) NULL');
CALL _mig_add_col('categories', 'title_en',       'VARCHAR(255) NULL');
CALL _mig_add_col('categories', 'description_vi', 'VARCHAR(1000) NULL');
CALL _mig_add_col('categories', 'description_en', 'VARCHAR(1000) NULL');
-- Ghim danh mục lên đầu khối "Loại sản phẩm" ở trang chủ.
-- DEFAULT 0 -> hàng cũ tự nhận 0, trang chủ giữ nguyên thứ tự cho tới khi admin
-- đánh dấu mục đầu tiên.
CALL _mig_add_col('categories', 'is_featured',    'TINYINT NOT NULL DEFAULT 0');

-- ── news: nội dung bài viết + tác giả + ngày đăng ────────────────────────────
-- (bảng `news` do schema.sql tạo mới nên thường đã đủ cột; giữ ở đây phòng
--  trường hợp DB đã có bảng news từ lần chạy schema.sql cũ hơn)
CALL _mig_add_col('news', 'body_vi',      'MEDIUMTEXT NULL');
CALL _mig_add_col('news', 'body_en',      'MEDIUMTEXT NULL');
CALL _mig_add_col('news', 'author',       'VARCHAR(120) NULL');
CALL _mig_add_col('news', 'published_at', 'DATETIME NULL');

-- ── Mọi cột ảnh -> MEDIUMTEXT ───────────────────────────────────────────────
-- Admin giờ upload ảnh từ máy, file được mã hoá thành data URI base64. Ảnh chỉ
-- ~370 byte đã vượt VARCHAR(500), nên để nguyên là MỌI lần upload đều đổ lỗi
-- SQL "Data too long" và mất trắng form đã điền.
CALL _mig_mod_col('slides',         'image',     'mediumtext', 'MEDIUMTEXT NOT NULL');
CALL _mig_mod_col('categories',     'image',     'mediumtext', 'MEDIUMTEXT NULL');
CALL _mig_mod_col('partners',       'logo',      'mediumtext', 'MEDIUMTEXT NULL');
CALL _mig_mod_col('certificates',   'image',     'mediumtext', 'MEDIUMTEXT NOT NULL');
CALL _mig_mod_col('products',       'thumbnail', 'mediumtext', 'MEDIUMTEXT NULL');
CALL _mig_mod_col('product_images', 'url',       'mediumtext', 'MEDIUMTEXT NOT NULL');
CALL _mig_mod_col('news',           'image',     'mediumtext', 'MEDIUMTEXT NOT NULL');
-- Biến thể chưa sửa được trong admin nên chưa ai vấp, nhưng để nguyên VARCHAR(500)
-- là mìn chờ: ngày thêm form sửa biến thể, mọi lần upload sẽ chết y như news.image.
CALL _mig_mod_col('product_variants','image',    'mediumtext', 'MEDIUMTEXT NULL');

-- ── Mô tả loại sản phẩm: VARCHAR(1000) -> TEXT ──────────────────────────────
-- Ô này giờ soạn bằng trình định dạng (**đậm**, - danh sách...), phần đánh dấu
-- ăn thêm ký tự nên 1000 hết rất nhanh.
CALL _mig_mod_col('categories', 'description_vi', 'text', 'TEXT NULL');
CALL _mig_mod_col('categories', 'description_en', 'text', 'TEXT NULL');

-- ── gallery: khe ảnh cố định cho lưới "Style advice" ────────────────────────
-- Bảng `gallery` có từ trước thời có khe, nên trên DB cũ CREATE TABLE IF NOT
-- EXISTS bỏ qua nó và cột `slot` không bao giờ được tạo -> /admin/gallery chết
-- với "Unknown column 'slot' in 'field list'".
-- UNIQUE nhưng NULL-able: MySQL cho phép nhiều NULL trong khoá UNIQUE, nên các
-- hàng cũ (đều nhận NULL) không xung đột; mỗi khe 1|2|3 vẫn chỉ giữ được 1 hàng.
CALL _mig_add_col('gallery', 'slot', 'TINYINT UNSIGNED NULL DEFAULT NULL');
CALL _mig_add_idx('gallery', 'uk_gallery_slot', 'UNIQUE KEY `uk_gallery_slot` (`slot`)');

DROP PROCEDURE IF EXISTS _mig_add_col;
DROP PROCEDURE IF EXISTS _mig_mod_col;
DROP PROCEDURE IF EXISTS _mig_add_idx;

-- ── Trang "Giới thiệu" là trang HỆ THỐNG: /about phụ thuộc vào hàng slug='about'
-- Chỉ chèn khung rỗng, admin tự soạn nội dung ở /admin/pages.
INSERT INTO `pages` (`slug`, `title_vi`, `title_en`, `status`, `created_at`, `updated_at`)
SELECT 'about', 'Giới thiệu về công ty', 'About our company', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `pages` WHERE `slug` = 'about');

-- ── Công tắc hiển thị khối Công năng (mặc định bật) ──────────────────────────
INSERT INTO `settings` (`key`, `value`, `created_at`, `updated_at`)
SELECT 'features_block_enabled', '1', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'features_block_enabled');
