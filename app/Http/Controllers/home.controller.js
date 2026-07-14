const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const {logger} = require('../../../config/log4js');

// Dữ liệu KHÔNG dịch (ảnh/icon/tên thương hiệu) — phần chữ lấy từ resources/lang.
// TODO: chuyển hero/partners/certs sang bảng DB (content module) khi cần admin sửa.
const HERO_IMAGES = [
    'https://picsum.photos/seed/hero-danish/1600/720',
    'https://picsum.photos/seed/hero-living/1600/720',
    'https://picsum.photos/seed/hero-bed/1600/720',
];
const WHY_ICONS = ['🏅', '🌐', '⏱️', '📈'];
const CERT_IMAGES = [
    'https://picsum.photos/seed/cert1/400/560',
    'https://picsum.photos/seed/cert2/400/560',
    'https://picsum.photos/seed/cert3/400/560',
];
const PARTNERS = ['Auchan', 'matelpro', 'OTTO', 'wayfair', 'DMORA', 'produceshop'];

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

async function index(req, res) {
    // lang, t, pick, money đã được locale.middleware gắn vào res.locals
    const home = res.locals.t.home;

    try {
        const [cats, featured] = await Promise.all([
            CategoryService.getAll({status: 1}),      // danh mục từ DB
            ProductService.getFeatured({limit: 8}),   // sản phẩm nổi bật từ DB
        ]);

        res.render('home', {
            pageTitle: home.meta.title,
            categories: toPlain(cats).filter((c) => !c.parent_id),
            featuredProducts: toPlain(featured),
            // ghép ảnh/icon (data) với chữ đã dịch (từ resources/lang)
            heroSlides: home.hero.map((s, i) => ({...s, image: HERO_IMAGES[i % HERO_IMAGES.length]})),
            whyUs: home.why.items.map((it, i) => ({...it, icon: WHY_ICONS[i % WHY_ICONS.length]})),
            partners: PARTNERS,
            certificates: home.certs.items.map((c, i) => ({...c, image: CERT_IMAGES[i % CERT_IMAGES.length]})),
        });
    } catch (err) {
        logger.error('Home render error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang chủ. Kiểm tra kết nối MySQL (docker compose up -d).');
    }
}

module.exports = {index};
