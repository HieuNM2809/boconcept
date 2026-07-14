const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const SlideService = require('../../Services/Api/slide.service');
const PartnerService = require('../../Services/Api/partner.service');
const CertificateService = require('../../Services/Api/certificate.service');
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
const WHY_IMAGE = 'https://picsum.photos/seed/why-business/760/620'; // ảnh minh họa (placeholder, có thể thay)
// Fallback khi DB chưa có chứng nhận (quản lý ở /admin/certificates)
const FALLBACK_CERTS = [
    {image: 'https://picsum.photos/seed/cert1/400/560', title_vi: 'Giấy phép kinh doanh', title_en: 'Business license'},
    {image: 'https://picsum.photos/seed/cert2/400/560', title_vi: 'Chứng nhận chất lượng', title_en: 'Quality certificate'},
    {image: 'https://picsum.photos/seed/cert3/400/560', title_vi: 'Chứng nhận xuất xứ', title_en: 'Certificate of origin'},
];
// Fallback khi DB chưa có đối tác (quản lý ở /admin/partners)
const FALLBACK_PARTNERS = ['Auchan', 'matelpro', 'OTTO', 'wayfair', 'DMORA', 'produceshop']
    .map((name) => ({name, logo: null, link: null}));

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

async function index(req, res) {
    // lang, t, pick, money đã được locale.middleware gắn vào res.locals
    const home = res.locals.t.home;

    try {
        const [cats, featuredCats, slides, partnersRows, certRows] = await Promise.all([
            CategoryService.getAll({status: 1}),      // danh mục từ DB
            CategoryService.getWithProductCounts(),   // loại sản phẩm + số lượng (mục "nổi bật")
            SlideService.getActiveOrdered(),          // slide hero từ DB (quản lý ở /admin/slides)
            PartnerService.getActiveOrdered(),        // đối tác từ DB (quản lý ở /admin/partners)
            CertificateService.getActiveOrdered(),    // chứng nhận từ DB (quản lý ở /admin/certificates)
        ]);

        const heroSlides = slides.length ? toPlain(slides) : FALLBACK_SLIDES;
        const partners = partnersRows.length ? toPlain(partnersRows) : FALLBACK_PARTNERS;
        const certificates = certRows.length ? toPlain(certRows) : FALLBACK_CERTS;

        res.render('home', {
            pageTitle: home.meta.title,
            categories: toPlain(cats).filter((c) => !c.parent_id),
            featuredCategories: featuredCats,
            heroSlides,
            whyUs: home.why.items.map((it, i) => ({...it, icon: WHY_ICONS[i % WHY_ICONS.length]})),
            whyImage: WHY_IMAGE,
            partners,
            certificates,
        });
    } catch (err) {
        logger.error('Home render error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang chủ. Kiểm tra kết nối MySQL (docker compose up -d).');
    }
}

module.exports = {index};
