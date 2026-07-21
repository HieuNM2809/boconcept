const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// 8 ô của lưới collage "Style advice" ở trang chủ, khoá theo `slot` (1..8).
// Khe 1-3 là 3 ô LỚN và chứa được NHIỀU hàng (slider); khe 4-8 mỗi khe một hàng.
const Gallery = sequelize.define('Gallery', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    // NULL = hàng cũ từ thời bảng này còn là "kho ảnh", không hiển thị ở đâu cả.
    //
    // TUYỆT ĐỐI KHÔNG đặt lại `unique: true` ở đây. DB đã gỡ uk_gallery_slot
    // (doc/migrations/2026-07-20-gallery-multi.sql) để một khe chứa nhiều ảnh;
    // để sót `unique` ở tầng model thì Sequelize tự gộp các bản ghi cùng slot
    // trong bulkCreate và chỉ còn LẠI ẢNH CUỐI — lưu 3 ảnh vào khe chỉ ra 1,
    // mà không có lỗi nào được ném ra.
    slot: {type: DataTypes.TINYINT.UNSIGNED, allowNull: true},
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
    indexes: [
        {name: 'idx_gallery_slot_order', fields: ['slot', 'sort_order']},
        {name: 'idx_gallery_status', fields: ['status']},
    ],
});

module.exports = Gallery;
