-- ============================================================================
-- Migration: drop-content-settings (2026-07-20)
--
-- VÌ SAO CẦN FILE NÀY:
-- Màn quản trị /admin/content ("Nội dung khối") đã gỡ theo yêu cầu. Chữ của hai
-- khối "Loại sản phẩm" và "Tin tức" nay nằm cố định trong
-- resources/lang/{vi,en}/home.js chứ không đọc từ bảng `settings` nữa.
--
-- Các hàng dưới đây vì thế thành dữ liệu mồ côi: không code nào đọc, không màn
-- nào sửa được. Xoá đi cho bảng `settings` chỉ còn đúng khoá đang dùng.
--
-- AN TOÀN: nội dung của 4 hàng `categories_*` đã được chép nguyên văn vào
-- resources/lang trước khi xoá, nên trang chủ hiển thị y hệt trước và sau. Các
-- hàng `news_*` vốn đang NULL (chưa ai nhập), không mất gì.
--
-- KHÔNG xoá `features_block_enabled` — khoá này vẫn đang được
-- app/Services/Api/setting.service.js dùng cho công tắc khối Công năng.
--
-- CÁCH CHẠY:
--   mysql -h <host> -P <port> -u <user> -p <db> < doc/migrations/2026-07-20-drop-content-settings.sql
-- Docker cục bộ:
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--       -uroot -proot app_db < doc/migrations/2026-07-20-drop-content-settings.sql
--
-- Chạy lại nhiều lần vô hại (DELETE trên hàng đã mất là no-op).
-- ============================================================================

SET NAMES utf8mb4;

DELETE FROM `settings` WHERE `key` IN (
    'categories_title_vi',
    'categories_title_en',
    'categories_desc_vi',
    'categories_desc_en',
    'news_title_vi',
    'news_title_en',
    'news_desc_vi',
    'news_desc_en',
    'news_cta_vi',
    'news_cta_en',
    'news_cta_link'
);
