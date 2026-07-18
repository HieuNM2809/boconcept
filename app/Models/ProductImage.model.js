const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Ảnh gallery của sản phẩm (trang chi tiết: 1 hình gốc + nhiều ảnh phụ).
const ProductImage = sequelize.define('ProductImage', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    url: {
        type: DataTypes.TEXT('medium'),
        allowNull: false,
    },
    sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    tableName: 'product_images',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {name: 'idx_product_images_product_id', fields: ['product_id']},
    ],
});

module.exports = ProductImage;
