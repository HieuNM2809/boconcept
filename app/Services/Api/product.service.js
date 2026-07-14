const {Op} = require('sequelize');
const sequelize = require('../../../lib/database');
const {Product, Category, ProductVariant, ProductImage} = require('../../Models/index.model');

const SORT_MAP = {
    newest: [['id', 'DESC']],
    oldest: [['id', 'ASC']],
    price_asc: [['price', 'ASC']],
    price_desc: [['price', 'DESC']],
    priority: [['priority', 'ASC'], ['id', 'DESC']],
};

class ProductService {
    /**
     * Danh sách sản phẩm + bộ lọc + tìm kiếm + phân trang (spec mục 4).
     * @param {object} filters - { page, per_page, q, category_id, is_featured,
     *                             min_price, max_price, status, sort }
     */
    static async getAll(filters = {}) {
        const {
            page = 1,
            per_page = 20,
            q = null,
            category_id = null,
            is_featured = null,
            min_price = null,
            max_price = null,
            status = 1,
            sort = 'newest',
        } = filters;

        const _page = Math.max(parseInt(page, 10) || 1, 1);
        const _perPage = Math.min(Math.max(parseInt(per_page, 10) || 20, 1), 100);

        const where = {};
        if (status !== undefined && status !== '' && status !== null) where.status = parseInt(status, 10);
        if (category_id) where.category_id = parseInt(category_id, 10);
        if (is_featured !== null && is_featured !== undefined && is_featured !== '') {
            where.is_featured = parseInt(is_featured, 10);
        }
        if (q) {
            where[Op.or] = [
                {name_vi: {[Op.like]: `%${q}%`}},
                {name_en: {[Op.like]: `%${q}%`}},
            ];
        }
        const priceWhere = {};
        if (min_price !== null && min_price !== '') priceWhere[Op.gte] = parseFloat(min_price);
        if (max_price !== null && max_price !== '') priceWhere[Op.lte] = parseFloat(max_price);
        if (Object.getOwnPropertySymbols(priceWhere).length) where.price = priceWhere;

        const order = SORT_MAP[sort] || SORT_MAP.newest;

        const {rows, count} = await Product.findAndCountAll({
            where,
            order,
            limit: _perPage,
            offset: (_page - 1) * _perPage,
            include: [
                {model: Category, as: 'category', attributes: ['id', 'name_vi', 'name_en', 'slug']},
            ],
            distinct: true,
        });

        return {
            data: rows,
            meta: {
                total: count,
                per_page: _perPage,
                current_page: _page,
                last_page: Math.max(Math.ceil(count / _perPage), 1),
            },
        };
    }

    static async getById(id) {
        return Product.findByPk(id, {
            include: [
                {model: Category, as: 'category', attributes: ['id', 'name_vi', 'name_en', 'slug']},
                {model: ProductVariant, as: 'variants'},
                {model: ProductImage, as: 'images', separate: true, order: [['sort_order', 'ASC']]},
            ],
        });
    }

    /**
     * Sản phẩm nổi bật cho trang chủ (spec 3.2: group theo loại, ưu tiên, hiện 6 item).
     */
    static async getFeatured({limit = 6} = {}) {
        const _limit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 50);
        return Product.findAll({
            where: {is_featured: 1, status: 1},
            order: SORT_MAP.priority,
            limit: _limit,
            include: [
                {model: Category, as: 'category', attributes: ['id', 'name_vi', 'name_en', 'slug']},
            ],
        });
    }

    /**
     * Tạo sản phẩm kèm variants + images lồng trong 1 payload (transaction).
     */
    static async create(data) {
        const productId = await sequelize.transaction(async (t) => {
            const product = await Product.create({
                category_id: data.category_id ?? null,
                name_vi: data.name_vi,
                name_en: data.name_en ?? null,
                slug: data.slug ?? null,
                description_vi: data.description_vi ?? null,
                description_en: data.description_en ?? null,
                price: data.price ?? 0,
                thumbnail: data.thumbnail ?? null,
                is_featured: data.is_featured ?? 0,
                priority: data.priority ?? 0,
                status: data.status ?? 1,
            }, {transaction: t});

            if (Array.isArray(data.variants) && data.variants.length) {
                await ProductVariant.bulkCreate(
                    data.variants.map((v) => ({
                        product_id: product.id,
                        name: v.name,
                        sku: v.sku ?? null,
                        price: v.price ?? null,
                        stock: v.stock ?? 0,
                        image: v.image ?? null,
                        status: v.status ?? 1,
                    })),
                    {transaction: t}
                );
            }

            if (Array.isArray(data.images) && data.images.length) {
                await ProductImage.bulkCreate(
                    data.images.map((img, idx) => ({
                        product_id: product.id,
                        url: typeof img === 'string' ? img : img.url,
                        sort_order: typeof img === 'string' ? idx : (img.sort_order ?? idx),
                    })),
                    {transaction: t}
                );
            }

            return product.id;
        });

        // getById phải chạy SAU khi transaction commit để thấy dữ liệu vừa insert
        return ProductService.getById(productId);
    }

    static async update(id, data) {
        const item = await Product.findByPk(id);
        if (!item) throw Object.assign(new Error('Product not found'), {status: 404});
        await item.update(data);
        return ProductService.getById(id);
    }

    static async delete(id) {
        const item = await Product.findByPk(id);
        if (!item) throw Object.assign(new Error('Product not found'), {status: 404});
        await item.destroy(); // soft delete (paranoid)
    }
}

module.exports = ProductService;
