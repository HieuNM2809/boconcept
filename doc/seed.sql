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
    (7, 1, 'Đèn',        'Lighting',     'den',         'https://picsum.photos/seed/cat-light/500/600',   5, 1, NOW(), NOW()),
    (3, 1,    'Sofa Góc',   'Corner Sofas', 'sofa-goc',    'https://picsum.photos/seed/cat-corner/500/600',  1, 1, NOW(), NOW()),
    (4, 2,    'Bàn Trà',    'Coffee Tables','ban-tra',     'https://picsum.photos/seed/cat-coffee/500/600',  1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name_vi` = VALUES(`name_vi`), `image` = VALUES(`image`), `updated_at` = NOW();

-- Sản phẩm
INSERT INTO `products` (`id`, `category_id`, `name_vi`, `name_en`, `slug`, `description_vi`, `description_en`, `price`, `thumbnail`, `is_featured`, `priority`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 1, 'Sofa Da Cognac',       'Cognac Leather Sofa', 'sofa-da-cognac',       'Sofa da thật màu cognac sang trọng.', 'Genuine cognac leather sofa.', 25000000, 'https://picsum.photos/seed/sofa1/600', 1, 1, 1, NOW(), NOW()),
    (2, 4, 'Bàn Trà Gỗ Sồi',       'Oak Coffee Table',    'ban-tra-go-soi',       'Bàn trà gỗ sồi tự nhiên.',            'Natural oak coffee table.',    8000000,  'https://picsum.photos/seed/table1/600', 1, 2, 1, NOW(), NOW()),
    (3, 3, 'Sofa Góc Chữ L',       'L-Shaped Corner Sofa','sofa-goc-chu-l',       'Sofa góc chữ L cho phòng khách rộng.','L-shaped corner sofa.',        32000000, 'https://picsum.photos/seed/sofa2/600', 1, 3, 1, NOW(), NOW()),
    (4, 4, 'Bàn Trà Mặt Đá',       'Stone Top Coffee Table','ban-tra-mat-da',      'Bàn trà mặt đá cẩm thạch, chân kim loại.','Marble top coffee table with metal legs.', 12500000, 'https://picsum.photos/seed/table2/600/750', 1, 4, 1, NOW(), NOW()),
    (5, 5, 'Tủ Kệ Trang Trí',      'Display Cabinet',      'tu-ke-trang-tri',      'Tủ kệ gỗ óc chó, cửa kính khung mảnh.',   'Walnut display cabinet with slim glass doors.', 18900000, 'https://picsum.photos/seed/cab1/600/750',  1, 5, 1, NOW(), NOW()),
    (6, 6, 'Giường Bọc Nỉ',        'Upholstered Bed',      'giuong-boc-ni',        'Giường bọc nỉ đầu giường cao, khung gỗ.', 'Upholstered bed with tall headboard.',    27500000, 'https://picsum.photos/seed/bed1/600/750',  1, 6, 1, NOW(), NOW()),
    (7, 7, 'Đèn Sàn Vòm',          'Arc Floor Lamp',       'den-san-vom',          'Đèn sàn dáng vòm, chụp kim loại mờ.',     'Arc floor lamp with matte metal shade.',   6400000,  'https://picsum.photos/seed/lamp1/600/750', 1, 7, 1, NOW(), NOW()),
    (8, 1, 'Ghế Bành Bọc Vải',     'Fabric Armchair',      'ghe-banh-boc-vai',     'Ghế bành bọc vải, chân gỗ sồi vát.',      'Fabric armchair on tapered oak legs.',     9800000,  'https://picsum.photos/seed/chair1/600/750',1, 8, 1, NOW(), NOW()),
    (9, 2, 'Bàn Ăn Gỗ Sồi 6 Chỗ',  'Oak Dining Table 6',   'ban-an-go-soi-6',      'Bàn ăn gỗ sồi nguyên tấm, 6 chỗ ngồi.',   'Solid oak dining table, seats six.',      21000000, 'https://picsum.photos/seed/dining1/600/750',1, 9, 1, NOW(), NOW())
-- `is_featured` nằm trong danh sách UPDATE để chạy lại seed là cờ nổi bật được
-- đồng bộ theo file, không mắc kẹt ở giá trị cũ trong DB.
ON DUPLICATE KEY UPDATE `name_vi` = VALUES(`name_vi`), `is_featured` = VALUES(`is_featured`),
    `thumbnail` = VALUES(`thumbnail`), `updated_at` = NOW();

-- Thuộc tính lọc (chất liệu / màu / kích thước / khối lượng) cho sản phẩm mẫu.
-- Tách UPDATE riêng để không phải viết lại cả khối INSERT ở trên.
UPDATE `products` SET `material_vi`='Da thật · Gỗ sồi', `material_en`='Genuine leather · Oak', `color_vi`='Nâu cognac',    `color_en`='Cognac brown', `dimensions_vi`='Sofa: 220x95x85', `dimensions_en`='Sofa: 220x95x85', `weight`=58.00 WHERE `id`=1;
UPDATE `products` SET `material_vi`='Gỗ sồi',          `material_en`='Oak',                   `color_vi`='Vân gỗ tự nhiên',`color_en`='Natural wood',  `dimensions_vi`='Bàn: 110x60x45', `dimensions_en`='Table: 110x60x45', `weight`=22.50 WHERE `id`=2;
UPDATE `products` SET `material_vi`='Vải bố · Kim loại',`material_en`='Canvas · Metal',        `color_vi`='Xám tro',        `color_en`='Ash grey',      `dimensions_vi`='Sofa: 280x180x85', `dimensions_en`='Sofa: 280x180x85', `weight`=74.00 WHERE `id`=3;
UPDATE `products` SET `material_vi`='Đá cẩm thạch · Kim loại',`material_en`='Marble · Metal',  `color_vi`='Trắng vân xám',  `color_en`='White/grey',    `dimensions_vi`='Bàn: 120x60x42', `dimensions_en`='Table: 120x60x42', `weight`=41.00 WHERE `id`=4;
UPDATE `products` SET `material_vi`='Gỗ óc chó · Kính', `material_en`='Walnut · Glass',        `color_vi`='Nâu óc chó',     `color_en`='Walnut',        `dimensions_vi`='Tủ: 90x40x180', `dimensions_en`='Cabinet: 90x40x180', `weight`=66.00 WHERE `id`=5;
UPDATE `products` SET `material_vi`='Nỉ · Gỗ',          `material_en`='Felt · Wood',           `color_vi`='Be sữa',         `color_en`='Cream beige',   `dimensions_vi`='Giường: 200x180x110', `dimensions_en`='Bed: 200x180x110', `weight`=88.00 WHERE `id`=6;
UPDATE `products` SET `material_vi`='Kim loại sơn mờ',  `material_en`='Matte metal',           `color_vi`='Đen mờ',         `color_en`='Matte black',   `dimensions_vi`='Đèn: 180x40x200', `dimensions_en`='Lamp: 180x40x200', `weight`=9.80 WHERE `id`=7;
UPDATE `products` SET `material_vi`='Vải · Gỗ sồi',     `material_en`='Fabric · Oak',          `color_vi`='Xanh rêu',       `color_en`='Moss green',    `dimensions_vi`='Ghế: 75x80x82', `dimensions_en`='Chair: 75x80x82', `weight`=14.20 WHERE `id`=8;
UPDATE `products` SET `material_vi`='Gỗ sồi nguyên tấm',`material_en`='Solid oak',             `color_vi`='Vân gỗ sáng',    `color_en`='Light oak',     `dimensions_vi`='Bàn: 180x90x75 · Ghế: 45x50x88', `dimensions_en`='Table: 180x90x75 · Chair: 45x50x88', `weight`=52.00 WHERE `id`=9;

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
    (3, 2, 'https://picsum.photos/seed/table1a/800', 0, NOW(), NOW()),
    -- Sản phẩm 1 có >7 ảnh để thấy được cơ chế: ảnh thứ 7 bị làm mờ + nút "Xem thêm"
    (4,  1, 'https://picsum.photos/seed/sofa1c/800', 2, NOW(), NOW()),
    (5,  1, 'https://picsum.photos/seed/sofa1d/800', 3, NOW(), NOW()),
    (6,  1, 'https://picsum.photos/seed/sofa1e/800', 4, NOW(), NOW()),
    (7,  1, 'https://picsum.photos/seed/sofa1f/800', 5, NOW(), NOW()),
    (8,  1, 'https://picsum.photos/seed/sofa1g/800', 6, NOW(), NOW()),
    (9,  1, 'https://picsum.photos/seed/sofa1h/800', 7, NOW(), NOW()),
    (10, 1, 'https://picsum.photos/seed/sofa1i/800', 8, NOW(), NOW())
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

-- Khối Công năng (dải 4 mục dưới slideshow)
-- Icon trỏ tới file thật trong public/icons/ — commit vào repo nên sống sót mọi
-- lần redeploy. Admin upload file mới thì cột này thành data URI base64.
INSERT INTO `features` (`id`, `icon`, `title_vi`, `title_en`, `description_vi`, `description_en`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, '/static/icons/leaf.svg',    'Gỗ bền vững',             'Sustainable wood',  'Nguồn gỗ khai thác có trách nhiệm, vì một tương lai xanh hơn.', 'Responsibly sourced timber, crafted for a better future.', 1, 1, NOW(), NOW()),
    (2, '/static/icons/weather.svg', 'Chịu mọi thời tiết',      'Weather resistant', 'Bền bỉ trước nắng mưa và nhịp sống thường ngày.',               'Built to withstand the elements and everyday life.',      2, 1, NOW(), NOW()),
    (3, '/static/icons/diamond.svg', 'Thiết kế vượt thời gian', 'Timeless design',   'Kiểu dáng thanh lịch, linh hoạt, không bao giờ lỗi mốt.',       'Elegant, versatile pieces that never go out of style.',    3, 1, NOW(), NOW()),
    (4, '/static/icons/shield.svg',  'Chất lượng cao cấp',      'Premium quality',   'Tay nghề thủ công tỉ mỉ trong từng chi tiết.',                  'Exceptional craftsmanship in every detail.',              4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `icon` = VALUES(`icon`), `title_vi` = VALUES(`title_vi`), `updated_at` = NOW();

-- Tin tức trang chủ (2 bài, bố cục 2 cột)
INSERT INTO `news` (`id`, `image`, `title_vi`, `title_en`, `excerpt_vi`, `excerpt_en`, `cta_vi`, `cta_en`, `link`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 'https://picsum.photos/seed/news-colour/900/675', 'Sắc màu của mùa', 'Colours of the season',
     'Mùa này mời gọi sắc màu vào ngôi nhà theo cách tinh tế và giàu biểu cảm. Tông màu đậm và sắc trung tính nhẹ kết hợp tạo nên không gian tươi mới, cân bằng và đậm dấu ấn cá nhân.',
     'This season invites colour into the home in a refined and expressive way. Rich tones and soft neutrals work together to create interiors that feel fresh, balanced and personal.',
     'Khám phá sắc màu của mùa', 'Discover the colours of the season', '#news', 1, 1, NOW(), NOW()),
    (2, 'https://picsum.photos/seed/news-modern/900/675', 'Hiện đại ấm áp', 'Warm modernism',
     'Hiện đại ấm áp kết hợp sự mạch lạc của thiết kế đương đại với cảm giác dễ chịu của vật liệu tự nhiên. Đường nét gọn gàng gặp gỡ tông màu mộc, tạo nên không gian điềm tĩnh và tinh tế.',
     'Warm modernism blends the clarity of modern design with the comfort of natural materials and inviting textures. Clean lines meet earthy tones, creating interiors that feel calm and sophisticated.',
     'Khám phá Hiện đại ấm áp', 'Explore Warm Modernism', '#news', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `title_vi` = VALUES(`title_vi`), `image` = VALUES(`image`), `updated_at` = NOW();

-- Kho ảnh lưới collage "Style advice" (tối đa 8; 3 ảnh đầu vào 3 ô lớn xoay vòng)
INSERT INTO `gallery` (`id`, `image`, `alt_vi`, `alt_en`, `sort_order`, `status`, `created_at`, `updated_at`)
VALUES
    (1, 'https://picsum.photos/seed/insp-sofa/900/700',    'Sofa ngoài trời bên hồ bơi', 'Outdoor sofa by the pool',   1, 1, NOW(), NOW()),
    (2, 'https://picsum.photos/seed/insp-dining/900/700',  'Bàn ăn ngoài trời view biển','Outdoor dining with sea view',2, 1, NOW(), NOW()),
    (3, 'https://picsum.photos/seed/insp-garden/900/700',  'Góc vườn với chậu hoa',      'Garden corner with planters',3, 1, NOW(), NOW()),
    (4, 'https://picsum.photos/seed/insp-bath/700/900',    'Góc phòng tắm',              'Bathroom corner',            4, 1, NOW(), NOW()),
    (5, 'https://picsum.photos/seed/insp-chair/700/700',   'Ghế thư giãn cạnh cửa sổ',   'Lounge chair by the window', 5, 1, NOW(), NOW()),
    (6, 'https://picsum.photos/seed/insp-patio/800/700',   'Bộ bàn ghế sân vườn',        'Patio furniture set',        6, 1, NOW(), NOW()),
    (7, 'https://picsum.photos/seed/insp-chairs/700/900',  'Ghế ăn gỗ tự nhiên',         'Natural wood dining chairs', 7, 1, NOW(), NOW()),
    (8, 'https://picsum.photos/seed/insp-lounger/800/700', 'Ghế nằm cạnh hồ bơi',        'Sun loungers by the pool',   8, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `image` = VALUES(`image`), `alt_vi` = VALUES(`alt_vi`), `updated_at` = NOW();

-- Cấu hình site: công tắc khối Công năng + nội dung khối "Loại sản phẩm".
-- Bốn khoá nội dung để trống thì trang chủ tự quay về chữ trong resources/lang.
INSERT INTO `settings` (`key`, `value`, `created_at`, `updated_at`)
VALUES
    ('features_block_enabled', '1', NOW(), NOW()),
    ('categories_title_vi', 'Chất lượng thấy được, sự thoải mái cảm nhận được.', NOW(), NOW()),
    ('categories_title_en', 'Quality You Can See, Comfort You Can Feel.', NOW(), NOW()),
    ('categories_desc_vi', 'Chúng tôi kết hợp vật liệu tự nhiên, tay nghề thủ công và thiết kế chỉn chu để tạo nên những món nội thất nâng tầm không gian sống của bạn.', NOW(), NOW()),
    ('categories_desc_en', 'We blend natural materials, expert craftsmanship, and thoughtful design to create furniture that enhances the way you live.', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW();
