const CategoryService = require('../../Services/Api/category.service');
const ProductService = require('../../Services/Api/product.service');
const SlideService = require('../../Services/Api/slide.service');
const PartnerService = require('../../Services/Api/partner.service');
const CertificateService = require('../../Services/Api/certificate.service');
const FeatureService = require('../../Services/Api/feature.service');
const NewsService = require('../../Services/Api/news.service');
const GalleryService = require('../../Services/Api/gallery.service');
const SettingService = require('../../Services/Api/setting.service');
const {logger} = require('../../../config/log4js');

// Dữ liệu KHÔNG dịch (ảnh/icon/tên thương hiệu) — phần chữ lấy từ resources/lang.
// TODO: chuyển hero/partners/certs sang bảng DB (content module) khi cần admin sửa.
// Fallback khi DB chưa có slide nào (slide được quản lý ở /admin/slides)
const FALLBACK_SLIDES = [
    {image: 'https://picsum.photos/seed/hero-danish/1600/720', title_vi: 'Ưu đãi cuối mùa: Đang diễn ra', title_en: 'End Season Sale: Now On', badge_vi: 'Thiết kế Đan Mạch', badge_en: 'Danish design'},
    {image: 'https://picsum.photos/seed/hero-living/1600/720', title_vi: 'Không gian sống hiện đại', title_en: 'Modern Living Spaces', badge_vi: 'Bộ sưu tập mới', badge_en: 'New collection'},
    {image: 'https://picsum.photos/seed/hero-bed/1600/720', title_vi: 'Giấc ngủ trọn vẹn mỗi ngày', title_en: 'Rest, Redefined', badge_vi: 'Phòng ngủ', badge_en: 'Bedroom'},
];
// 5 ô NHỎ của lưới collage "Style advice" — ĐÓNG CỨNG theo yêu cầu, admin không
// sửa được. Chỉ 3 ô lớn lấy từ DB (/admin/gallery). Thứ tự ở đây khớp .small-1
// .. .small-5 trong style.css, đổi thứ tự là đổi vị trí ảnh trên lưới.
const SMALL_TILES = [
    {image: 'https://picsum.photos/seed/insp-bath/700/900', alt_vi: 'Góc phòng tắm', alt_en: 'Bathroom corner'},
    {image: 'https://picsum.photos/seed/insp-chair/700/700', alt_vi: 'Ghế thư giãn cạnh cửa sổ', alt_en: 'Lounge chair by the window'},
    {image: 'https://picsum.photos/seed/insp-patio/800/700', alt_vi: 'Bộ bàn ghế sân vườn', alt_en: 'Patio furniture set'},
    {image: 'https://picsum.photos/seed/insp-chairs/700/900', alt_vi: 'Ghế ăn gỗ tự nhiên', alt_en: 'Natural wood dining chairs'},
    {image: 'https://picsum.photos/seed/insp-lounger/800/700', alt_vi: 'Ghế nằm cạnh hồ bơi', alt_en: 'Sun loungers by the pool'},
];
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
        // CẢNH BÁO: cả Promise.all này nằm trong MỘT try/catch, nên bất kỳ query nào
        // ném lỗi là hạ nguyên trang chủ (hero, danh mục, sản phẩm...) kèm thông báo
        // "Kiểm tra kết nối MySQL" — sai hướng hoàn toàn khi nguyên nhân là thiếu bảng.
        // Bảng `features`/`settings` là bảng MỚI, mà doc/schema.sql chỉ tự chạy khi
        // volume docker còn trắng và production không có migration runner. Vì vậy hai
        // query dưới tự nuốt lỗi và degrade, giống navigation.middleware.js đang làm.
        const softFail = (label, fallback) => (err) => {
            logger.error(`Home: ${label} lỗi, bỏ qua`, {error: {message: err.message}});
            return fallback;
        };

        const [cats, slides, partnersRows, certRows, featureRows, featuresOn, showcaseRows,
            catContent, newsRows, galleryRows] = await Promise.all([
            CategoryService.getAll({status: 1}),      // danh mục từ DB
            SlideService.getActiveOrdered(),          // slide hero từ DB (quản lý ở /admin/slides)
            PartnerService.getActiveOrdered(),        // đối tác từ DB (quản lý ở /admin/partners)
            CertificateService.getActiveOrdered(),    // chứng nhận từ DB (quản lý ở /admin/certificates)
            FeatureService.getActiveOrdered().catch(softFail('features', [])),
            SettingService.getBool(SettingService.KEYS.FEATURES_BLOCK).catch(softFail('settings', true)),
            // Lấy 8 để nút qua/lại có việc làm: showcase hiện 4 ảnh cùng lúc.
            ProductService.getFeatured({limit: 8}).catch(softFail('showcase', [])),
            // Nội dung khối "Loại sản phẩm" + "Tin tức" (sửa ở /admin/content)
            SettingService.getMany(Object.values(SettingService.KEYS)).catch(softFail('content', {})),
            NewsService.getActiveOrdered({limit: 4}).catch(softFail('news', [])),
            // Luôn trả đúng 3 khe (tự lấp ảnh dự phòng), nên softFail cũng phải
            // trả 3 phần tử — [] sẽ làm lưới collage mất hẳn 3 ô lớn.
            GalleryService.getSlots().catch(softFail('gallery', GalleryService.fallbackSlots())),
        ]);

        const heroSlides = slides.length ? toPlain(slides) : FALLBACK_SLIDES;
        const partners = partnersRows.length ? toPlain(partnersRows) : FALLBACK_PARTNERS;
        const certificates = certRows.length ? toPlain(certRows) : FALLBACK_CERTS;

        // Gắn danh mục con cấp 2 vào từng danh mục gốc để card hover xổ ra được.
        // Lọc `parent_id === null` trên danh sách PHẲNG chứ không dùng getAll({tree:true}):
        // ở chế độ cây, con có cha đang ẩn sẽ bị đẩy lên thành danh mục gốc.
        const allCats = toPlain(cats);
        const childrenOf = new Map();
        allCats.forEach((c) => {
            if (c.parent_id == null) return;
            if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
            childrenOf.get(c.parent_id).push(c);
        });
        // Danh mục "nổi bật" (đánh dấu ở /admin/categories) được GHIM lên đầu khối,
        // các mục còn lại giữ nguyên phía sau — cố ý KHÔNG lọc bỏ, để khi chưa ai
        // đánh dấu gì thì trang chủ trông y như cũ thay vì trống trơn.
        // sort ổn định: trong cùng nhóm vẫn theo sort_order/id mà service đã xếp.
        const rootCats = allCats
            .filter((c) => c.parent_id == null)
            .map((c) => ({...c, children: childrenOf.get(c.id) || []}))
            .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

        const lang = res.locals.lang;
        const K = SettingService.KEYS;
        // Admin bỏ trống -> quay về chữ mặc định trong resources/lang.
        const pickContent = (viKey, enKey, fallback) =>
            (catContent[lang === 'en' ? enKey : viKey] || catContent[viKey] || fallback);

        res.render('home', {
            pageTitle: home.meta.title,
            categories: rootCats,
            categoriesTitle: pickContent(K.CAT_TITLE_VI, K.CAT_TITLE_EN, home.categories.title),
            categoriesDesc: pickContent(K.CAT_DESC_VI, K.CAT_DESC_EN, home.categories.sub),
            news: toPlain(newsRows),
            newsTitle: pickContent(K.NEWS_TITLE_VI, K.NEWS_TITLE_EN, home.news.title),
            newsDesc: pickContent(K.NEWS_DESC_VI, K.NEWS_DESC_EN, home.news.sub),
            newsCta: pickContent(K.NEWS_CTA_VI, K.NEWS_CTA_EN, home.news.cta),
            newsCtaLink: catContent[K.NEWS_CTA_LINK] || '#news',
            // Lưới collage: 3 ô lớn từ DB (khe cố định), 5 ô nhỏ đóng cứng.
            galleryBig: galleryRows,
            gallerySmall: SMALL_TILES,
            heroSlides,
            // Khối Công năng: rỗng khi công tắc tổng tắt HOẶC không có mục nào hiện.
            // View chỉ cần kiểm tra features.length, không phải hai điều kiện.
            features: featuresOn ? toPlain(featureRows) : [],
            showcase: toPlain(showcaseRows),
            partners,
            certificates,
        });
    } catch (err) {
        logger.error('Home render error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang chủ. Kiểm tra kết nối MySQL (docker compose up -d).');
    }
}

module.exports = {index};
