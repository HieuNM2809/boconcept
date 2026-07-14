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

-- API client mẫu để test /api/auth/login
INSERT INTO `api_clients` (`service_name`, `client_id`, `client_secret`, `is_active`, `created_at`, `updated_at`)
VALUES ('demo', 'demo-client', 'demo-secret', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();
