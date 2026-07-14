const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const {logger} = require('../../../config/log4js');

// UI sort (theo spec) -> sort của ProductService
const SORT_UI_TO_SERVICE = {
    popular: 'priority',
    bestseller: 'priority', // TODO: cần dữ liệu lượt bán mới sắp đúng "bán chạy"
    newest: 'newest',
    price_asc: 'price_asc',
    price_desc: 'price_desc',
};

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

// Danh sách số trang có rút gọn bằng dấu "…"
function buildPageList(cur, last) {
    const out = [];
    for (let p = 1; p <= last; p++) {
        if (p === 1 || p === last || (p >= cur - 2 && p <= cur + 2)) {
            out.push(p);
        } else if (out[out.length - 1] !== '…') {
            out.push('…');
        }
    }
    return out;
}

async function category(req, res) {
    const id = parseInt(req.params.id, 10);
    const t = res.locals.t;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).render('category', {
            pageTitle: t.catalog.notFound,
            category: null, breadcrumb: [], children: [],
            products: [], meta: null, pages: [], filters: {}, linkFor: () => '#',
        });
    }

    try {
        const {current, chain} = await CategoryService.getBreadcrumb(id);
        if (!current) {
            return res.status(404).render('category', {
                pageTitle: t.catalog.notFound,
                category: null, breadcrumb: [], children: [],
                products: [], meta: null, pages: [], filters: {}, linkFor: () => '#',
            });
        }

        const children = await CategoryService.getChildrenWithCounts(current.id);

        const uiSort = SORT_UI_TO_SERVICE[req.query.sort] ? req.query.sort : 'popular';
        const q = (req.query.q || '').trim();

        const result = await ProductService.getAll({
            category_id: current.id,
            sort: SORT_UI_TO_SERVICE[uiSort],
            per_page: req.query.per_page || 12,
            page: req.query.page || 1,
            q: q || null,
            status: 1,
        });

        const {current_page, per_page, last_page} = result.meta;
        const base = {sort: uiSort, per_page, q: q || undefined};
        const linkFor = (over = {}) => {
            const merged = {...base, page: current_page, ...over};
            const parts = Object.entries(merged)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
            return `/categories/${current.id}?${parts.join('&')}`;
        };

        res.render('category', {
            pageTitle: `${res.locals.pick(current, 'name')} — webFurniture`,
            category: current,
            breadcrumb: chain,
            children,
            products: toPlain(result.data),
            meta: result.meta,
            pages: buildPageList(current_page, last_page),
            filters: {sort: uiSort, per_page, q},
            linkFor,
        });
    } catch (err) {
        logger.error('Category page error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang loại sản phẩm. Kiểm tra kết nối MySQL.');
    }
}

// Trang chi tiết sản phẩm — GET /products/:id
async function product(req, res) {
    const id = parseInt(req.params.id, 10);
    const t = res.locals.t;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(404).render('product', {
            pageTitle: t.product.notFound,
            product: null, breadcrumb: [], gallery: [],
        });
    }

    try {
        const found = await ProductService.getById(id);
        if (!found) {
            return res.status(404).render('product', {
                pageTitle: t.product.notFound,
                product: null, breadcrumb: [], gallery: [],
            });
        }
        const prod = found.get ? found.get({plain: true}) : found;

        let breadcrumb = [];
        if (prod.category_id) {
            const {chain} = await CategoryService.getBreadcrumb(prod.category_id);
            breadcrumb = chain;
        }

        // Gallery: hình gốc (thumbnail) + ảnh phụ (ProductImage), khử trùng lặp
        const imgs = (prod.images || [])
            .slice()
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .map((i) => i.url);
        const gallery = [...new Set([prod.thumbnail, ...imgs].filter(Boolean))];
        if (!gallery.length) gallery.push(`https://picsum.photos/seed/p${prod.id}/800`);

        res.render('product', {
            pageTitle: `${res.locals.pick(prod, 'name')} — webFurniture`,
            product: prod,
            breadcrumb,
            gallery,
        });
    } catch (err) {
        logger.error('Product page error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang chi tiết sản phẩm. Kiểm tra kết nối MySQL.');
    }
}

module.exports = {category, product};
