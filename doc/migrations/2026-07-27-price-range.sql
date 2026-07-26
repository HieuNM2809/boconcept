-- ============================================================================
-- Migration: price-range (2026-07-27)
--
-- VÌ SAO CẦN FILE NÀY:
-- `products.price` và `product_variants.price` đang là DECIMAL(12,2) -> trần chỉ
-- 9.999.999.999,99 ₫ (~10 tỷ). Nhập giá từ 10 tỷ trở lên là MySQL ném
-- "Out of range value for column 'price' at row 1" — lỗi SQL thô hiện thẳng lên
-- toast admin, và bản ghi KHÔNG được lưu.
--
-- Nới lên DECIMAL(15,2) -> trần 9.999.999.999.999,99 ₫ (~10 nghìn tỷ). Song song
-- đó app chặn ở 999.999.999.999 ₫ (app/Helpers/price.helper.js — MAX_PRICE) nên
-- người dùng luôn nhận thông báo tiếng Việt TRƯỚC khi chạm trần cột.
--
-- AN TOÀN: nới rộng cột số là thao tác không mất dữ liệu (giá trị cũ nằm gọn
-- trong miền mới). Chạy lại nhiều lần vô hại — kiểm tra information_schema
-- trước, đã đúng kiểu thì bỏ qua.
--
-- Chạy local:
--   docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 \
--     -uroot -proot app_db < doc/migrations/2026-07-27-price-range.sql
-- Chạy Railway: xem scripts/push-schema-railway.sh
-- ============================================================================
SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS _mig_price_col;

DELIMITER //

CREATE PROCEDURE _mig_price_col(IN p_table VARCHAR(64), IN p_def TEXT)
BEGIN
    -- Chỉ ALTER khi kiểu hiện tại KHÁC decimal(15,2). Bảng giá có thể rất nhiều
    -- hàng; ALTER lại lần hai không thêm giá trị gì mà vẫn khoá bảng.
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = 'price'
          AND COLUMN_TYPE <> 'decimal(15,2)'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` MODIFY COLUMN `price` ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //

DELIMITER ;

CALL _mig_price_col('products', 'DECIMAL(15,2) NOT NULL DEFAULT 0');
-- Biến thể: NULL nghĩa là "dùng giá của sản phẩm cha", nên giữ nguyên NULL-able.
CALL _mig_price_col('product_variants', 'DECIMAL(15,2) NULL');

DROP PROCEDURE IF EXISTS _mig_price_col;
