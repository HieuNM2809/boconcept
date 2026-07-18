const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Trang nội dung tĩnh (Giới thiệu công ty, Tuyển dụng, ...). Truy cập theo `slug`.
// `body_*` là Markdown rút gọn — dựng HTML qua app/Helpers/richtext.helper.js,
// KHÔNG lưu HTML thô (repo không có thư viện sanitize).
const Page = sequelize.define('Page', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    slug: {type: DataTypes.STRING(120), allowNull: false, unique: true},
    title_vi: {type: DataTypes.STRING(255), allowNull: false},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    excerpt_vi: {type: DataTypes.STRING(800), allowNull: true},
    excerpt_en: {type: DataTypes.STRING(800), allowNull: true},
    body_vi: {type: DataTypes.TEXT('medium'), allowNull: true},
    body_en: {type: DataTypes.TEXT('medium'), allowNull: true},
    image: {type: DataTypes.TEXT('medium'), allowNull: true},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'pages',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Page;
