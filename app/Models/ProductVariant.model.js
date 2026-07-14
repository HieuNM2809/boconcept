const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Biến thể sản phẩm (item con "giống shopee": màu/size/...).
const ProductVariant = sequelize.define('ProductVariant', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    product_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    // Giá riêng của biến thể; null = dùng giá của product cha
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'product_variants',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {name: 'idx_product_variants_product_id', fields: ['product_id']},
    ],
});

module.exports = ProductVariant;
