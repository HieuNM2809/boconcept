-- Schema khởi tạo cho project base + catalog nội thất.
-- Chạy: mysql -u root -p app_db < doc/schema.sql   (idempotent, chạy lại được)
SET NAMES utf8mb4;

-- ── Auth ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `api_clients` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `service_name`  VARCHAR(255) NOT NULL,
    `client_id`     VARCHAR(100) NOT NULL,
    `client_secret` VARCHAR(255) NOT NULL,
    `is_active`     TINYINT      NOT NULL DEFAULT 1,
    `created_at`    DATETIME     NULL,
    `updated_at`    DATETIME     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_api_clients_service_name` (`service_name`),
    UNIQUE KEY `uq_api_clients_client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `examples` (
    `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `name`        VARCHAR(255)  NOT NULL,
    `description` VARCHAR(1000) NULL,
    `status`      TINYINT       NOT NULL DEFAULT 1,
    `created_at`  DATETIME      NULL,
    `updated_at`  DATETIME      NULL,
    `deleted_at`  DATETIME      NULL,
    PRIMARY KEY (`id`),
    KEY `idx_examples_status` (`status`),
    KEY `idx_examples_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Catalog ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `categories` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id`  INT UNSIGNED NULL,
    `name_vi`    VARCHAR(255) NOT NULL,
    `name_en`    VARCHAR(255) NULL,
    `slug`       VARCHAR(255) NULL,
    `image`      VARCHAR(500) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    `deleted_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_categories_parent_id` (`parent_id`),
    KEY `idx_categories_status` (`status`),
    CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`)
        REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `products` (
    `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `category_id`    INT UNSIGNED  NULL,
    `name_vi`        VARCHAR(255)  NOT NULL,
    `name_en`        VARCHAR(255)  NULL,
    `slug`           VARCHAR(255)  NULL,
    `description_vi` TEXT          NULL,
    `description_en` TEXT          NULL,
    `price`          DECIMAL(12,2) NOT NULL DEFAULT 0,
    -- Thuộc tính lọc ở trang danh sách (/categories/:id)
    `material_vi`    VARCHAR(255)  NULL,
    `material_en`    VARCHAR(255)  NULL,
    `color_vi`       VARCHAR(255)  NULL,
    `color_en`       VARCHAR(255)  NULL,
    -- Kích thước là chuỗi TỰ DO, không tách D×R×C: một sản phẩm có thể gồm
    -- nhiều món ("Ghế: 10x30x60 · Bàn: 60x70x80"). Lọc bằng khớp chuỗi con.
    `dimensions_vi`  VARCHAR(500)  NULL,
    `dimensions_en`  VARCHAR(500)  NULL,
    `weight`         DECIMAL(10,2) NULL,   -- kg, lọc theo khoảng min/max
    `thumbnail`      VARCHAR(500)  NULL,
    `is_featured`    TINYINT       NOT NULL DEFAULT 0,
    `priority`       INT           NOT NULL DEFAULT 0,
    `status`         TINYINT       NOT NULL DEFAULT 1,
    `created_at`     DATETIME      NULL,
    `updated_at`     DATETIME      NULL,
    `deleted_at`     DATETIME      NULL,
    PRIMARY KEY (`id`),
    KEY `idx_products_category_id` (`category_id`),
    KEY `idx_products_is_featured` (`is_featured`),
    KEY `idx_products_status` (`status`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`)
        REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product_variants` (
    `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `product_id` INT UNSIGNED  NOT NULL,
    `name`       VARCHAR(255)  NOT NULL,
    `sku`        VARCHAR(100)  NULL,
    `price`      DECIMAL(12,2) NULL,
    `stock`      INT           NOT NULL DEFAULT 0,
    `image`      VARCHAR(500)  NULL,
    `status`     TINYINT       NOT NULL DEFAULT 1,
    `created_at` DATETIME      NULL,
    `updated_at` DATETIME      NULL,
    PRIMARY KEY (`id`),
    KEY `idx_product_variants_product_id` (`product_id`),
    CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product_images` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` INT UNSIGNED NOT NULL,
    `url`        VARCHAR(500) NOT NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_product_images_product_id` (`product_id`),
    CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Slideshow (hero trang chủ, quản lý ở /admin/slides) ───────────────────────
CREATE TABLE IF NOT EXISTS `slides` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `image`      VARCHAR(500) NOT NULL,
    `title_vi`   VARCHAR(255) NULL,
    `title_en`   VARCHAR(255) NULL,
    `badge_vi`   VARCHAR(255) NULL,
    `badge_en`   VARCHAR(255) NULL,
    `link`       VARCHAR(500) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_slides_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Đối tác hợp tác (quản lý ở /admin/partners) ───────────────────────────────
CREATE TABLE IF NOT EXISTS `partners` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name`       VARCHAR(255) NOT NULL,
    `logo`       VARCHAR(500) NULL,
    `link`       VARCHAR(500) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_partners_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Giấy chứng nhận công ty (quản lý ở /admin/certificates) ───────────────────
CREATE TABLE IF NOT EXISTS `certificates` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `image`      VARCHAR(500) NOT NULL,
    `title_vi`   VARCHAR(255) NULL,
    `title_en`   VARCHAR(255) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_certificates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Khối Công năng dưới slideshow (quản lý ở /admin/features) ─────────────────
-- `icon` là MEDIUMTEXT vì file admin upload được lưu thành data URI base64 NGAY
-- TRONG DB. Cố tình không ghi ra ổ đĩa: railway.json không khai báo volume nên
-- Railway xoá sạch filesystem mỗi lần redeploy — icon upload lên sẽ lặng lẽ mất.
CREATE TABLE IF NOT EXISTS `features` (
    `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `icon`           MEDIUMTEXT   NOT NULL,
    `title_vi`       VARCHAR(255) NOT NULL,
    `title_en`       VARCHAR(255) NULL,
    `description_vi` VARCHAR(500) NULL,
    `description_en` VARCHAR(500) NULL,
    `sort_order`     INT          NOT NULL DEFAULT 0,
    `status`         TINYINT      NOT NULL DEFAULT 1,
    `created_at`     DATETIME     NULL,
    `updated_at`     DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_features_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tin tức / bài viết trên trang chủ (quản lý ở /admin/news) ────────────────
CREATE TABLE IF NOT EXISTS `news` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    -- MEDIUMTEXT: form admin upload file -> lưu data URI base64 (xem features/gallery)
    `image`      MEDIUMTEXT   NOT NULL,
    `title_vi`   VARCHAR(255) NOT NULL,
    `title_en`   VARCHAR(255) NULL,
    `excerpt_vi` VARCHAR(800) NULL,
    `excerpt_en` VARCHAR(800) NULL,
    -- Nội dung bài viết: Markdown rút gọn, dựng HTML ở app/Helpers/richtext.helper.js.
    -- KHÔNG lưu HTML thô — repo không có thư viện sanitize, xem chú thích trong helper.
    `body_vi`      MEDIUMTEXT   NULL,
    `body_en`      MEDIUMTEXT   NULL,
    `author`       VARCHAR(120) NULL,
    `published_at` DATETIME     NULL,
    `cta_vi`     VARCHAR(255) NULL,
    `cta_en`     VARCHAR(255) NULL,
    `link`       VARCHAR(500) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_news_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Trang nội dung tĩnh: Giới thiệu công ty, ... (quản lý ở /admin/pages) ────
-- Bảng CHUNG chứ không phải bảng riêng cho mỗi trang: thêm "Tuyển dụng" hay
-- "Chính sách" về sau chỉ là thêm một hàng, không phải viết thêm code.
-- `body_*` là Markdown rút gọn, dựng HTML ở app/Helpers/richtext.helper.js.
CREATE TABLE IF NOT EXISTS `pages` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug`       VARCHAR(120) NOT NULL,
    `title_vi`   VARCHAR(255) NOT NULL,
    `title_en`   VARCHAR(255) NULL,
    `excerpt_vi` VARCHAR(800) NULL,
    `excerpt_en` VARCHAR(800) NULL,
    `body_vi`    MEDIUMTEXT   NULL,
    `body_en`    MEDIUMTEXT   NULL,
    `image`      MEDIUMTEXT   NULL,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_pages_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Kho ảnh lưới collage "Style advice" (quản lý ở /admin/gallery) ───────────
-- Admin up 1–8 ảnh vào ĐÂY; frontend tự phân bổ: 3 ô lớn xoay vòng mỗi 5 giây,
-- các ô nhỏ lấy phần còn lại và đứng yên. `image` là MEDIUMTEXT vì file upload
-- được lưu dạng data URI base64 (Railway xoá filesystem mỗi lần redeploy).
CREATE TABLE IF NOT EXISTS `gallery` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `image`      MEDIUMTEXT   NOT NULL,
    `alt_vi`     VARCHAR(255) NULL,
    `alt_en`     VARCHAR(255) NULL,
    `sort_order` INT          NOT NULL DEFAULT 0,
    `status`     TINYINT      NOT NULL DEFAULT 1,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_gallery_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Cấu hình site dạng key/value (công tắc bật/tắt cả khối, ...) ──────────────
-- Cần bảng riêng chứ không bulk-update `features.status`: tắt cả khối bằng cách
-- set status=0 hàng loạt sẽ XOÁ MẤT trạng thái ẩn/hiện của từng mục, bật lại
-- không biết mục nào vốn đang ẩn.
CREATE TABLE IF NOT EXISTS `settings` (
    `key`        VARCHAR(100) NOT NULL,
    `value`      VARCHAR(500) NULL,
    `created_at` DATETIME     NULL,
    `updated_at` DATETIME     NULL,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API client mẫu để test /api/auth/login
INSERT INTO `api_clients` (`service_name`, `client_id`, `client_secret`, `is_active`, `created_at`, `updated_at`)
VALUES ('demo', 'demo-client', 'demo-secret', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
