const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Màu sản phẩm cho khách chọn ở trang chi tiết (ô vuông màu, không hiện chữ).
//
// `image_index` là VỊ TRÍ của một ảnh trong gallery sản phẩm, không phải id và
// cũng không phải bản thân ảnh — xem doc/migrations/2026-07-27-product-colors.sql
// để biết vì sao (tóm tắt: ảnh là base64 ~2MB/tấm nằm trong DB, nhân theo số màu
// là quay lại sự cố hết dung lượng).
const ProductColor = sequelize.define('ProductColor', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    // '#RRGGBB' — thứ duy nhất vẽ ra ô vuông trên trang khách.
    hex: {
        type: DataTypes.CHAR(7),
        allowNull: false,
    },
    // Tên màu chỉ dùng cho title/aria-label, KHÔNG vẽ thành chữ trên giao diện.
    name_vi: {type: DataTypes.STRING(120), allowNull: true},
    name_en: {type: DataTypes.STRING(120), allowNull: true},
    // NULL = màu này không gắn ảnh -> bấm vào chỉ đổi trạng thái chọn.
    image_index: {type: DataTypes.INTEGER, allowNull: true},
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'product_colors',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {name: 'idx_product_colors_product_id', fields: ['product_id']},
    ],
});

module.exports = ProductColor;
