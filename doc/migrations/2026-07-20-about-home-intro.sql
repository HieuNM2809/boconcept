-- ============================================================================
-- Migration: about-home-intro (2026-07-20)
--
-- VÌ SAO CẦN FILE NÀY:
-- Khối giới thiệu doanh nghiệp ngoài trang chủ trước đây đóng cứng trong
-- resources/lang/{vi,en}/home.js (t.home.why). Nay nó đọc từ trang hệ thống
-- `about` trong bảng `pages`: title_* -> tiêu đề, excerpt_* -> đoạn văn.
--
-- Hàng `about` do migration 2026-07-19-site-rebuild.sql chèn chỉ là khung rỗng
-- ('Giới thiệu về công ty', không có excerpt). Nếu không chạy file này, trang chủ
-- sẽ hiện đúng chuỗi "Giới thiệu về công ty" thay vì tiêu đề marketing, và đoạn
-- văn rơi về bản mặc định trong mã nguồn.
--
-- File này chép nội dung đang hiển thị từ resources/lang vào DB, để sau khi đổi
-- code trang chủ trông y hệt trước đó — rồi admin sửa lại ở /admin/pages.
--
-- AN TOÀN: chỉ UPDATE đúng hàng slug='about', và chỉ khi excerpt_vi còn TRỐNG.
-- Chạy lại lần hai (hoặc chạy sau khi admin đã tự soạn) sẽ không ghi đè gì.
--
-- Chạy: docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--         -uroot -proot app_db < doc/migrations/2026-07-20-about-home-intro.sql
-- ============================================================================
SET NAMES utf8mb4;

-- Phòng trường hợp DB chưa từng chạy site-rebuild: dựng hàng `about` trước.
INSERT INTO `pages` (`slug`, `title_vi`, `title_en`, `status`, `created_at`, `updated_at`)
SELECT 'about', 'Giới thiệu về công ty', 'About our company', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `pages` WHERE `slug` = 'about');

UPDATE `pages`
SET `title_vi`   = 'Chúng tôi chuyên về Nội thất và Chậu gốm',
    `title_en`   = 'We Specialize in Furniture and Pottery Planter',
    `excerpt_vi` = 'Công ty TNHH Quốc tế Hương Sơn là nhà sản xuất và xuất khẩu tại Việt Nam, chuyên về nội thất và gốm sứ. Chúng tôi cam kết mang đến những sản phẩm chất lượng cao, kết hợp tay nghề thủ công tinh xảo, thiết kế hiện đại và độ bền lâu dài. Phục vụ khách hàng trên toàn thế giới, chúng tôi cung cấp dịch vụ sản xuất tin cậy, kiểm soát chất lượng nghiêm ngặt và dịch vụ xuất khẩu chuyên nghiệp, đáp ứng nhu cầu đa dạng của thị trường quốc tế. Sứ mệnh của chúng tôi là tạo ra sản phẩm giàu giá trị, đồng thời xây dựng quan hệ hợp tác lâu dài dựa trên sự tin cậy, chất lượng và tính bền vững.',
    `excerpt_en` = 'Huong Son International Co., Ltd. is a Vietnam-based manufacturer and exporter specializing in furniture and ceramic pottery. We are committed to delivering high-quality products that combine excellent craftsmanship, modern design, and lasting durability. Serving customers worldwide, we offer reliable manufacturing, strict quality control, and professional export services to meet the diverse needs of global markets. Our mission is to provide value-driven products while building long-term partnerships based on trust, quality, and sustainability.',
    `updated_at` = NOW()
WHERE `slug` = 'about'
  AND (`excerpt_vi` IS NULL OR `excerpt_vi` = '');
