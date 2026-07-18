const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Bài viết Tin tức hiển thị ở trang chủ (song ngữ).
// `cta_*` là nhãn link cuối bài ("Khám phá ..."), `link` là nơi nó trỏ tới.
const News = sequelize.define('News', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    // MEDIUMTEXT chứ không STRING(500): form admin có nút upload, file được mã hoá
    // thành data URI base64 nên chuỗi dài hàng chục KB. VARCHAR(500) làm MỌI lần
    // upload ảnh đổ lỗi SQL "Data too long" (ảnh chỉ ~370 byte đã vượt 500 ký tự).
    image: {type: DataTypes.TEXT('medium'), allowNull: false},
    title_vi: {type: DataTypes.STRING(255), allowNull: false},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    excerpt_vi: {type: DataTypes.STRING(800), allowNull: true},
    excerpt_en: {type: DataTypes.STRING(800), allowNull: true},
    // Markdown rút gọn — dựng HTML qua app/Helpers/richtext.helper.js, KHÔNG lưu HTML thô
    body_vi: {type: DataTypes.TEXT('medium'), allowNull: true},
    body_en: {type: DataTypes.TEXT('medium'), allowNull: true},
    author: {type: DataTypes.STRING(120), allowNull: true},
    published_at: {type: DataTypes.DATE, allowNull: true},
    cta_vi: {type: DataTypes.STRING(255), allowNull: true},
    cta_en: {type: DataTypes.STRING(255), allowNull: true},
    link: {type: DataTypes.STRING(500), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'news',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_news_status', fields: ['status']}],
});

module.exports = News;
