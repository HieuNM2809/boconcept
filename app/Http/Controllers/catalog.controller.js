const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const richtext = require('../../Helpers/richtext.helper');
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
            category: null, breadcrumb: [], children: [], descriptionHtml: '',
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
        // String(...) ở mọi query: ?q[a]=b làm req.query.q thành object -> .trim() ném TypeError
        const str = (v) => String(v ?? '').trim();
        const q = str(req.query.q);
        const material = str(req.query.material);
        const dimensions = str(req.query.dimensions);
        const minW = str(req.query.min_weight);
        const maxW = str(req.query.max_weight);

        // Lưới CỐ ĐỊNH 4 cột × 3 dòng -> đúng 12 sản phẩm mỗi trang, không cho
        // người dùng đổi per_page (đổi là vỡ bố cục 4×3 theo spec).
        const PER_PAGE = 12;

        const result = await ProductService.getAll({
            category_id: current.id,
            sort: SORT_UI_TO_SERVICE[uiSort],
            per_page: PER_PAGE,
            page: req.query.page || 1,
            q: q || null,
            material: material || null,
            dimensions: dimensions || null,
            min_weight: minW || null,
            max_weight: maxW || null,
            status: 1,
        });

        const {current_page, per_page, last_page} = result.meta;
        // Mọi bộ lọc phải nằm trong link phân trang, nếu không sang trang 2 là
        // mất lọc và người dùng thấy cả loại sản phẩm chứ không phải kết quả lọc.
        const base = {
            sort: uiSort,
            q: q || undefined,
            material: material || undefined,
            dimensions: dimensions || undefined,
            min_weight: minW || undefined,
            max_weight: maxW || undefined,
        };
        const linkFor = (over = {}) => {
            const merged = {...base, page: current_page, ...over};
            const parts = Object.entries(merged)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
            return `/categories/${current.id}?${parts.join('&')}`;
        };

        res.render('category', {
            pageTitle: `${res.locals.pick(current, 'name')} — ${res.locals.t.common.brand}`,
            category: current,
            breadcrumb: chain,
            children,
            descriptionHtml: richtext.render(res.locals.pick(current, 'description')),
            products: toPlain(result.data),
            meta: result.meta,
            pages: buildPageList(current_page, last_page),
            filters: {sort: uiSort, per_page, q, material, dimensions, min_weight: minW, max_weight: maxW},
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
            product: null, breadcrumb: [], gallery: [], related: [],
            extraHtml: '', shippingHtml: '',
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

        // Sản phẩm liên quan ngẫu nhiên cùng danh mục. Tự nuốt lỗi: đây là mục
        // phụ ở cuối trang, hỏng nó không được kéo sập cả trang chi tiết.
        const related = toPlain(
            await ProductService.getRelated(prod.category_id, prod.id, {limit: 4}).catch((e) => {
                logger.error('Related products error', {error: {message: e.message}});
                return [];
            }),
        );

        res.render('product', {
            pageTitle: `${res.locals.pick(prod, 'name')} — ${res.locals.t.common.brand}`,
            product: prod,
            breadcrumb,
            gallery,
            related,
            // Markdown rút gọn -> HTML (helper escape trước, dựng thẻ sau)
            extraHtml: richtext.render(res.locals.pick(prod, 'extra')),
            shippingHtml: richtext.render(res.locals.pick(prod, 'shipping')),
        });
    } catch (err) {
        logger.error('Product page error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang chi tiết sản phẩm. Kiểm tra kết nối MySQL.');
    }
}

// Trang kết quả tìm kiếm — GET /search?q=
async function search(req, res) {
    const t = res.locals.t;
    // String(...) là BẮT BUỘC, không phải phòng xa: express parse query bằng qs ở
    // chế độ extended, nên /search?q[a]=b cho req.query.q là OBJECT. `|| ''` không
    // bắt được (object là truthy) -> .trim() ném TypeError. Dòng này nằm NGOÀI
    // try/catch nên lỗi rơi vào error handler JSON: trang HTML thành 500 JSON và
    // lộ nguyên stack trace ra ngoài khi NODE_ENV=development.
    const q = String(req.query.q ?? '').trim();

    // Ô trống -> báo "nhập từ khóa", KHÔNG đổ nguyên catalog ra (ProductService
    // với q=null trả về toàn bộ sản phẩm, người dùng sẽ tưởng là lỗi).
    if (!q) {
        return res.render('search', {
            pageTitle: `${t.search.title} — ${res.locals.t.common.brand}`,
            q: '', products: [], meta: null, pages: [], filters: {}, linkFor: () => '#',
        });
    }

    try {
        const uiSort = SORT_UI_TO_SERVICE[req.query.sort] ? req.query.sort : 'newest';

        const result = await ProductService.getAll({
            sort: SORT_UI_TO_SERVICE[uiSort],
            per_page: req.query.per_page || 12,
            page: req.query.page || 1,
            q,
            status: 1,
        });

        const {current_page, per_page, last_page} = result.meta;
        // q luôn nằm trong link phân trang — bỏ nó là trang 2 biến thành cả catalog.
        const linkFor = (over = {}) => {
            const merged = {q, sort: uiSort, per_page, page: current_page, ...over};
            const parts = Object.entries(merged)
                .filter(([, v]) => v !== undefined && v !== null && v !== '')
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
            return `/search?${parts.join('&')}`;
        };

        res.render('search', {
            pageTitle: `${t.search.title}: ${q} — ${res.locals.t.common.brand}`,
            q,
            products: toPlain(result.data),
            meta: result.meta,
            pages: buildPageList(current_page, last_page),
            filters: {sort: uiSort, per_page, q},
            linkFor,
        });
    } catch (err) {
        logger.error('Search page error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang tìm kiếm. Kiểm tra kết nối MySQL.');
    }
}

module.exports = {category, product, search};
