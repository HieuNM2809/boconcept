-- Thêm hồ sơ liên hệ cho tài khoản quản trị (trang /admin/account tự sửa được).
-- Áp lên DB đã tồn tại:
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < doc/migrations/2026-08-04-user-profile.sql
-- LƯU Ý: MySQL không có "ADD COLUMN IF NOT EXISTS" — chạy lại lần 2 sẽ báo lỗi
-- "Duplicate column"; bỏ qua lỗi đó là được (cột đã có).
SET NAMES utf8mb4;

ALTER TABLE `users`
    ADD COLUMN `email` VARCHAR(255) NULL AFTER `full_name`,
    ADD COLUMN `phone` VARCHAR(30)  NULL AFTER `email`;
