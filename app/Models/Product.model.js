const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    category_id: {
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
    description_vi: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description_en: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    // Markdown rút gọn — dựng HTML qua app/Helpers/richtext.helper.js
    extra_vi: {type: DataTypes.TEXT('medium'), allowNull: true},
    extra_en: {type: DataTypes.TEXT('medium'), allowNull: true},
    shipping_vi: {type: DataTypes.TEXT('medium'), allowNull: true},
    shipping_en: {type: DataTypes.TEXT('medium'), allowNull: true},
    // ── Thuộc tính lọc ở trang danh sách theo loại (/categories/:id) ──────────
    material_vi: {type: DataTypes.STRING(255), allowNull: true},
    material_en: {type: DataTypes.STRING(255), allowNull: true},
    color_vi: {type: DataTypes.STRING(255), allowNull: true},
    color_en: {type: DataTypes.STRING(255), allowNull: true},
    // Chuỗi TỰ DO, không tách D×R×C: một sản phẩm có thể gồm nhiều món
    // ("Ghế: 10x30x60 · Bàn: 60x70x80"). Lọc bằng khớp chuỗi con.
    dimensions_vi: {type: DataTypes.STRING(500), allowNull: true},
    dimensions_en: {type: DataTypes.STRING(500), allowNull: true},
    weight: {type: DataTypes.DECIMAL(10, 2), allowNull: true}, // kg
    thumbnail: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
    },
    is_featured: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
    },
    // Độ ưu tiên hiển thị (spec: "set độ ưu tiên từng sản phẩm từ 1 đến n")
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'products',
    underscored: true,
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
        {name: 'idx_products_category_id', fields: ['category_id']},
        {name: 'idx_products_is_featured', fields: ['is_featured']},
        {name: 'idx_products_status', fields: ['status']},
    ],
});

module.exports = Product;
