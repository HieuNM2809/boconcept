const {Router} = require('express');
const router = Router();
const homeController = require('../app/Http/Controllers/home.controller');
const catalogController = require('../app/Http/Controllers/catalog.controller');
const newsController = require('../app/Http/Controllers/news.controller');
const pageController = require('../app/Http/Controllers/page.controller');
const adminController = require('../app/Http/Controllers/admin.controller');
const adminCategoryController = require('../app/Http/Controllers/admin.category.controller');
const adminPartnerController = require('../app/Http/Controllers/admin.partner.controller');
const adminProductController = require('../app/Http/Controllers/admin.product.controller');
const adminCertificateController = require('../app/Http/Controllers/admin.certificate.controller');
const adminFeatureController = require('../app/Http/Controllers/admin.feature.controller');
const adminNewsController = require('../app/Http/Controllers/admin.news.controller');
const adminGalleryController = require('../app/Http/Controllers/admin.gallery.controller');
const adminPageController = require('../app/Http/Controllers/admin.page.controller');
const adminAuth = require('../app/Http/Middleware/adminAuth.middleware');
const navigation = require('../app/Http/Middleware/navigation.middleware');

// Danh mục cho header (partial dùng chung) -> res.locals.navCategories.
// Đặt ở đây (không phải app-level) nên không bao giờ chạm /api — router đó được
// mount riêng ở routes/index
// .route.js — và /static đã do express.static xử lý trước.
router.use(navigation);

// Trang HTML phải REVALIDATE mỗi lần tải. Không có dòng này, trình duyệt dùng lại
// HTML cũ trong cache -> HTML đó trỏ tới style.css?v=<phiên bản cũ> -> người dùng
// thấy giao diện cũ dù server đã đổi, và Ctrl+F5 mới chịu cập nhật.
// Chỉ đặt cho HTML; /static vẫn do express.static xử lý với ETag riêng.
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache');
    next();
});

// Trang chủ (render EJS, load dữ liệu từ DB)
router.get('/', (req, res) => homeController.index(req, res));

// Trang danh sách sản phẩm theo loại
router.get('/categories/:id', (req, res) => catalogController.category(req, res));

// Trang chi tiết sản phẩm
router.get('/products/:id', (req, res) => catalogController.product(req, res));

// Trang kết quả tìm kiếm (ô tìm kiếm trên header)
router.get('/search', (req, res) => catalogController.search(req, res));

// Tin tức — danh sách + chi tiết
router.get('/news', (req, res) => newsController.index(req, res));
router.get('/news/:id', (req, res) => newsController.detail(req, res));

// Trang nội dung tĩnh — /about là trang hệ thống, phần còn lại admin tự tạo
router.get('/about', (req, res) => pageController.about(req, res));
router.get('/pages/:slug', (req, res) => pageController.bySlug(req, res));

// ───── Admin (Basic Auth) — quản lý slideshow ────────────────────────────────
const adminRouter = Router();
// adminRouter.use(adminAuth);
// Chặn id không hợp lệ (vd /admin/products/abc/edit) -> 404 thay vì 500
adminRouter.param('id', (req, res, next, id) => {
    if (!/^[1-9][0-9]*$/.test(id)) return res.status(404).send('ID không hợp lệ.');
    next();
});
adminRouter.get('/', (req, res) => res.redirect('/admin/slides'));
adminRouter.get('/slides', (req, res) => adminController.slidesIndex(req, res));
adminRouter.get('/slides/new', (req, res) => adminController.slideNew(req, res));
adminRouter.post('/slides', (req, res) => adminController.slideCreate(req, res));
adminRouter.get('/slides/:id/edit', (req, res) => adminController.slideEdit(req, res));
adminRouter.post('/slides/:id/delete', (req, res) => adminController.slideDelete(req, res));
adminRouter.post('/slides/:id', (req, res) => adminController.slideUpdate(req, res));

// CRUD chung cho category / partner / product (form dùng cho cả thêm & sửa)
function crudRoutes(base, ctrl) {
    adminRouter.get(`/${base}`, (req, res) => ctrl.index(req, res));
    adminRouter.get(`/${base}/new`, (req, res) => ctrl.form(req, res));
    adminRouter.post(`/${base}`, (req, res) => ctrl.create(req, res));
    adminRouter.get(`/${base}/:id/edit`, (req, res) => ctrl.form(req, res));
    adminRouter.post(`/${base}/:id/delete`, (req, res) => ctrl.destroy(req, res));
    adminRouter.post(`/${base}/:id`, (req, res) => ctrl.update(req, res));
}
crudRoutes('categories', adminCategoryController);
crudRoutes('partners', adminPartnerController);
crudRoutes('products', adminProductController);
crudRoutes('certificates', adminCertificateController);
// Công tắc bật/tắt cả khối — phải khai TRƯỚC crudRoutes('features'), nếu không
// POST /admin/features/toggle sẽ khớp vào POST /admin/features/:id (update).
adminRouter.post('/features/toggle', (req, res) => adminFeatureController.toggleBlock(req, res));
crudRoutes('features', adminFeatureController);
crudRoutes('news', adminNewsController);
// Trang giới thiệu KHÔNG theo contract crudRoutes: chỉ có đúng một bản ghi hệ
// thống (slug `about`), admin sửa chứ không thêm/xoá được — giống gallery ở dưới.
// Không nhận :id từ URL nên không thể sửa nhầm bản ghi khác.
adminRouter.get('/pages', (req, res) => adminPageController.form(req, res));
adminRouter.post('/pages', (req, res) => adminPageController.update(req, res));

// Lưới ảnh trang chủ KHÔNG theo contract crudRoutes: chỉ có 3 khe cố định
// (slot 1|2|3), admin sửa chứ không thêm/xoá được.
adminRouter.get('/gallery', (req, res) => adminGalleryController.index(req, res));
adminRouter.get('/gallery/:slot/edit', (req, res) => adminGalleryController.form(req, res));
adminRouter.post('/gallery/:slot', (req, res) => adminGalleryController.update(req, res));

// Nội dung trang chủ (settings key/value) — không theo contract crudRoutes.

router.use('/admin', adminRouter);

// Health check
const health = (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};
router.get('/health', health);
router.get('/web/health', health);

module.exports = router;
