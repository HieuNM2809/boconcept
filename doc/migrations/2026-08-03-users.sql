-- Tài khoản đăng nhập khu quản trị + vai trò (admin | staff).
-- Áp lên DB đã tồn tại (schema.sql chỉ tự chạy khi volume docker còn trắng):
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < doc/migrations/2026-08-03-users.sql
--
-- Tài khoản admin ĐẦU TIÊN không tạo ở đây (không băm được mật khẩu bằng SQL) —
-- app tự tạo lúc khởi động từ ADMIN_USER/ADMIN_PASS nếu bảng còn trống
-- (xem UserService.ensureDefaultAdmin + index.js).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED          NOT NULL AUTO_INCREMENT,
    `username`      VARCHAR(100)          NOT NULL,
    `password`      VARCHAR(255)          NOT NULL,   -- "scrypt$<salt>$<hash>", không bao giờ mật khẩu thô
    `full_name`     VARCHAR(255)          NULL,
    `role`          ENUM('admin','staff') NOT NULL DEFAULT 'staff',
    `status`        TINYINT               NOT NULL DEFAULT 1,
    `last_login_at` DATETIME              NULL,
    `created_at`    DATETIME              NULL,
    `updated_at`    DATETIME              NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_username` (`username`),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
