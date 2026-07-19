const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// 3 ô LỚN của lưới collage "Style advice" ở trang chủ — mỗi hàng khoá vào một
// khe cố định qua `slot` (1|2|3 = trái|giữa|phải). 5 ô nhỏ KHÔNG ở đây: chúng
// đóng cứng trong home.controller.js (SMALL_TILES).
const Gallery = sequelize.define('Gallery', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    // NULL = hàng cũ từ thời bảng này còn là "kho ảnh", không hiển thị ở đâu cả.
    slot: {type: DataTypes.TINYINT.UNSIGNED, allowNull: true, unique: true},
    image: {type: DataTypes.TEXT('medium'), allowNull: false},
    alt_vi: {type: DataTypes.STRING(255), allowNull: true},
    alt_en: {type: DataTypes.STRING(255), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'gallery',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_gallery_status', fields: ['status']}],
});

module.exports = Gallery;
