const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const SlideService = require('../../Services/Api/slide.service');
const {logger} = require('../../../config/log4js');

// Dữ liệu KHÔNG dịch (ảnh/icon/tên thương hiệu) — phần chữ lấy từ resources/lang.
// TODO: chuyển hero/partners/certs sang bảng DB (content module) khi cần admin sửa.
// Fallback khi DB chưa có slide nào (slide được quản lý ở /admin/slides)
const FALLBACK_SLIDES = [
    {image: 'https://picsum.photos/seed/hero-danish/1600/720', title_vi: 'Ưu đãi cuối mùa: Đang diễn ra', title_en: 'End Season Sale: Now On', badge_vi: 'Thiết kế Đan Mạch', badge_en: 'Danish design', link: '#featured'},
    {image: 'https://picsum.photos/seed/hero-living/1600/720', title_vi: 'Không gian sống hiện đại', title_en: 'Modern Living Spaces', badge_vi: 'Bộ sưu tập mới', badge_en: 'New collection', link: '#featured'},
    {image: 'https://picsum.photos/seed/hero-bed/1600/720', title_vi: 'Giấc ngủ trọn vẹn mỗi ngày', title_en: 'Rest, Redefined', badge_vi: 'Phòng ngủ', badge_en: 'Bedroom', link: '#featured'},
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
        const [cats, featured, slides] = await Promise.all([
            CategoryService.getAll({status: 1}),      // danh mục từ DB
            ProductService.getFeatured({limit: 8}),   // sản phẩm nổi bật từ DB
            SlideService.getActiveOrdered(),          // slide hero từ DB (quản lý ở /admin/slides)
        ]);

        const heroSlides = slides.length ? toPlain(slides) : FALLBACK_SLIDES;

        res.render('home', {
            pageTitle: home.meta.title,
            categories: toPlain(cats).filter((c) => !c.parent_id),
            featuredProducts: toPlain(featured),
            heroSlides,
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
