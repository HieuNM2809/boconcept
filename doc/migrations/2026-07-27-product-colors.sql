-- ============================================================================
-- Migration: product-colors (2026-07-27)
--
-- VÌ SAO CẦN FILE NÀY:
-- Trang chi tiết sản phẩm phải cho khách CHỌN MÀU bằng ô vuông màu thay vì đọc
-- dòng chữ "Màu sắc: Nâu cognac". `products.color_vi` là chuỗi tự do, một giá
-- trị duy nhất, không có mã màu -> không vẽ ra ô vuông được. Cần bảng riêng.
--
-- VÌ SAO MỖI MÀU KHÔNG CÓ ẢNH RIÊNG:
-- Ảnh trong dự án này lưu base64 thẳng trong DB (~2MB/tấm). Cho mỗi màu một cột
-- ảnh riêng thì 5 màu x 100 sản phẩm ~ 1GB — đúng cơ chế đã làm đầy volume MySQL
-- và gây sự cố "1114 The table is full". Nên `image_index` chỉ TRỎ tới một ảnh
-- đã có sẵn trong gallery của chính sản phẩm đó: tốn 0 byte ảnh mới.
--
-- VÌ SAO LÀ `image_index` CHỨ KHÔNG PHẢI KHOÁ NGOẠI TỚI product_images.id:
-- Lúc tạo sản phẩm mới, ảnh chưa tồn tại nên chưa có id để tham chiếu. Vị trí
-- trong gallery thì xác định được ngay trong chính lần submit đó, dùng chung một
-- đường cho cả tạo mới lẫn sửa.
--
-- AN TOÀN: chỉ TẠO BẢNG MỚI, không đụng bảng nào đang có. Chạy lại nhiều lần vô
-- hại (CREATE TABLE IF NOT EXISTS).
--
-- Chạy local:
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--     -uroot -proot app_db < doc/migrations/2026-07-27-product-colors.sql
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `product_colors` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id`  INT UNSIGNED NOT NULL,
    -- '#RRGGBB'. Đây là thứ duy nhất vẽ ra ô vuông trên trang khách.
    `hex`         CHAR(7)      NOT NULL,
    -- Tên màu KHÔNG hiện thành chữ trên giao diện (khách yêu cầu "ko phải chữ").
    -- Chỉ dùng cho title/aria-label: người dùng trình đọc màn hình và người mù
    -- màu không còn cách nào khác để biết ô đó là màu gì.
    `name_vi`     VARCHAR(120) NULL,
    `name_en`     VARCHAR(120) NULL,
    -- Vị trí ảnh trong gallery sản phẩm (0-based). NULL = màu không đổi ảnh.
    `image_index` INT          NULL,
    `sort_order`  INT          NOT NULL DEFAULT 0,
    `created_at`  DATETIME     NULL,
    `updated_at`  DATETIME     NULL,
    PRIMARY KEY (`id`),
    KEY `idx_product_colors_product_id` (`product_id`),
    CONSTRAINT `fk_colors_product` FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
