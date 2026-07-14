-- Dữ liệu mẫu cho catalog nội thất (idempotent — chạy lại được).
-- Chạy: mysql -u root -p app_db < doc/seed.sql
SET NAMES utf8mb4;

-- Danh mục
INSERT INTO `categories` (`id`, `parent_id`, `name_vi`, `name_en`, `slug`, `image`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, NULL, 'Ghế Sofa',   'Sofas',        'sofa',        'https://picsum.photos/seed/cat-sofa/500/600',    1, 1, NOW(), NOW()),
    (2, NULL, 'Bàn',        'Tables',       'ban',         'https://picsum.photos/seed/cat-table/500/600',   2, 1, NOW(), NOW()),
    (5, NULL, 'Tủ & Kệ',    'Storage',      'tu-ke',       'https://picsum.photos/seed/cat-storage/500/600', 3, 1, NOW(), NOW()),
    (6, NULL, 'Giường',     'Beds',         'giuong',      'https://picsum.photos/seed/cat-bed/500/600',     4, 1, NOW(), NOW()),
    (7, NULL, 'Đèn',        'Lighting',     'den',         'https://picsum.photos/seed/cat-light/500/600',   5, 1, NOW(), NOW()),
    (3, 1,    'Sofa Góc',   'Corner Sofas', 'sofa-goc',    'https://picsum.photos/seed/cat-corner/500/600',  1, 1, NOW(), NOW()),
    (4, 2,    'Bàn Trà',    'Coffee Tables','ban-tra',     'https://picsum.photos/seed/cat-coffee/500/600',  1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name_vi` = VALUES(`name_vi`), `image` = VALUES(`image`), `updated_at` = NOW();

-- Sản phẩm
INSERT INTO `products` (`id`, `category_id`, `name_vi`, `name_en`, `slug`, `description_vi`, `description_en`, `price`, `thumbnail`, `is_featured`, `priority`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 1, 'Sofa Da Cognac',       'Cognac Leather Sofa', 'sofa-da-cognac',       'Sofa da thật màu cognac sang trọng.', 'Genuine cognac leather sofa.', 25000000, 'https://picsum.photos/seed/sofa1/600', 1, 1, 1, NOW(), NOW()),
    (2, 4, 'Bàn Trà Gỗ Sồi',       'Oak Coffee Table',    'ban-tra-go-soi',       'Bàn trà gỗ sồi tự nhiên.',            'Natural oak coffee table.',    8000000,  'https://picsum.photos/seed/table1/600', 1, 2, 1, NOW(), NOW()),
    (3, 3, 'Sofa Góc Chữ L',       'L-Shaped Corner Sofa','sofa-goc-chu-l',       'Sofa góc chữ L cho phòng khách rộng.','L-shaped corner sofa.',        32000000, 'https://picsum.photos/seed/sofa2/600', 0, 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name_vi` = VALUES(`name_vi`), `updated_at` = NOW();

-- Biến thể (item con giống shopee)
INSERT INTO `product_variants` (`id`, `product_id`, `name`, `sku`, `price`, `stock`, `image`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 1, 'Màu Cognac', 'SF-CGN', NULL,     5, 'https://picsum.photos/seed/cgn/200', 1, NOW(), NOW()),
    (2, 1, 'Màu Đen',    'SF-BLK', 26000000, 3, 'https://picsum.photos/seed/blk/200', 1, NOW(), NOW()),
    (3, 2, 'Gỗ Tự Nhiên','TB-NAT', NULL,    10, 'https://picsum.photos/seed/nat/200', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = NOW();

-- Ảnh gallery
INSERT INTO `product_images` (`id`, `product_id`, `url`, `sort_order`, `created_at`, `updated_at`)
VALUES
    (1, 1, 'https://picsum.photos/seed/sofa1a/800', 0, NOW(), NOW()),
    (2, 1, 'https://picsum.photos/seed/sofa1b/800', 1, NOW(), NOW()),
    (3, 2, 'https://picsum.photos/seed/table1a/800', 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE `url` = VALUES(`url`), `updated_at` = NOW();

-- Slideshow trang chủ
INSERT INTO `slides` (`id`, `image`, `title_vi`, `title_en`, `badge_vi`, `badge_en`, `link`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 'https://picsum.photos/seed/hero-danish/1600/720', 'Ưu đãi cuối mùa: Đang diễn ra', 'End Season Sale: Now On', 'Thiết kế Đan Mạch', 'Danish design', '#featured', 1, 1, NOW(), NOW()),
    (2, 'https://picsum.photos/seed/hero-living/1600/720', 'Không gian sống hiện đại', 'Modern Living Spaces', 'Bộ sưu tập mới', 'New collection', '#featured', 2, 1, NOW(), NOW()),
    (3, 'https://picsum.photos/seed/hero-bed/1600/720', 'Giấc ngủ trọn vẹn mỗi ngày', 'Rest, Redefined', 'Phòng ngủ', 'Bedroom', '#featured', 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title_vi` = VALUES(`title_vi`), `image` = VALUES(`image`), `updated_at` = NOW();

-- Đối tác hợp tác (logo để trống → hiển thị bằng chữ)
INSERT INTO `partners` (`id`, `name`, `logo`, `link`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 'Auchan',      NULL, NULL, 1, 1, NOW(), NOW()),
    (2, 'matelpro',    NULL, NULL, 2, 1, NOW(), NOW()),
    (3, 'OTTO',        NULL, NULL, 3, 1, NOW(), NOW()),
    (4, 'wayfair',     NULL, NULL, 4, 1, NOW(), NOW()),
    (5, 'DMORA',       NULL, NULL, 5, 1, NOW(), NOW()),
    (6, 'produceshop', NULL, NULL, 6, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = NOW();

-- Giấy chứng nhận công ty
INSERT INTO `certificates` (`id`, `image`, `title_vi`, `title_en`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 'https://picsum.photos/seed/cert1/400/560', 'Giấy phép kinh doanh', 'Business license', 1, 1, NOW(), NOW()),
    (2, 'https://picsum.photos/seed/cert2/400/560', 'Chứng nhận chất lượng', 'Quality certificate', 2, 1, NOW(), NOW()),
    (3, 'https://picsum.photos/seed/cert3/400/560', 'Chứng nhận xuất xứ', 'Certificate of origin', 3, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title_vi` = VALUES(`title_vi`), `image` = VALUES(`image`), `updated_at` = NOW();
