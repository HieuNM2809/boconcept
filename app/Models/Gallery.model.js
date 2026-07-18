const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Kho ảnh cho lưới collage "Style advice" ở trang chủ.
// Không có cột nào phân biệt "ô lớn"/"ô nhỏ": vị trí do frontend quyết định theo
// sort_order, nên admin đổi thứ tự là đổi được ảnh nào vào ô lớn.
const Gallery = sequelize.define('Gallery', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
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
