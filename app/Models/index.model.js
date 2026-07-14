// Nơi tập trung khai báo model + quan hệ (associations) giữa chúng.
const ApiClient = require('./ApiClient.model');
const Example = require('./Example.model');
const Category = require('./Category.model');
const Product = require('./Product.model');
const ProductVariant = require('./ProductVariant.model');
const ProductImage = require('./ProductImage.model');
const Slide = require('./Slide.model');
const Partner = require('./Partner.model');

// ── Category (cây danh mục) ───────────────────────────────────────────────────
Category.hasMany(Category, {foreignKey: 'parent_id', as: 'children'});
Category.belongsTo(Category, {foreignKey: 'parent_id', as: 'parent'});

// ── Category ⇄ Product ────────────────────────────────────────────────────────
Category.hasMany(Product, {foreignKey: 'category_id', as: 'products'});
Product.belongsTo(Category, {foreignKey: 'category_id', as: 'category'});

// ── Product ⇄ Variant / Image ─────────────────────────────────────────────────
Product.hasMany(ProductVariant, {foreignKey: 'product_id', as: 'variants'});
ProductVariant.belongsTo(Product, {foreignKey: 'product_id', as: 'product'});

Product.hasMany(ProductImage, {foreignKey: 'product_id', as: 'images'});
ProductImage.belongsTo(Product, {foreignKey: 'product_id', as: 'product'});

module.exports = {
    ApiClient,
    Example,
    Category,
    Product,
    ProductVariant,
    ProductImage,
    Slide,
    Partner,
};
