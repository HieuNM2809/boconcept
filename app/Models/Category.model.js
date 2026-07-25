const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Danh mục sản phẩm — hỗ trợ danh mục con qua parent_id (cây danh mục).
const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    parent_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    name_vi: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    name_en: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    // Tiêu đề + mô tả riêng cho trang danh sách (để trống thì dùng `name`)
    title_vi: {type: DataTypes.STRING(255), allowNull: true},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    // TEXT chứ không VARCHAR(1000): mô tả giờ soạn bằng trình định dạng
    // (**đậm**, - danh sách...), phần đánh dấu ăn thêm ký tự nên 1000 hết rất nhanh.
    description_vi: {type: DataTypes.TEXT, allowNull: true},
    description_en: {type: DataTypes.TEXT, allowNull: true},
    image: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Cờ nổi bật: trang chủ CHỈ hiện các danh mục cấp 1 (parent_id NULL) có cờ này
    // ở khối "Loại sản phẩm" (home.controller.js). Không mục nào bật -> khối ẩn hẳn.
    is_featured: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'categories',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

module.exports = Category;
