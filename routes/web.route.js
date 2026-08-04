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
const adminSloganController = require('../app/Http/Controllers/admin.slogan.controller');
const adminPreviewController = require('../app/Http/Controllers/admin.preview.controller');
const adminAuthController = require('../app/Http/Controllers/admin.auth.controller');
const adminUserController = require('../app/Http/Controllers/admin.user.controller');
const adminAccountController = require('../app/Http/Controllers/admin.account.controller');
const adminAuth = require('../app/Http/Middleware/adminAuth.middleware');
const requireRole = require('../app/Http/Middleware/requireRole.middleware');
const navigation = require('../app/Http/Middleware/navigation.middleware');
const mergeRichtextImages = require('../app/Http/Middleware/richtextImages.middleware');

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

// Trang "Tất cả sản phẩm" — phải khai TRƯỚC /products/:id, nếu không "/products"
// sẽ không có route riêng. (Express vẫn phân biệt được, nhưng để cạnh nhau cho rõ.)
router.get('/products', (req, res) => catalogController.products(req, res));

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
// Đặt ở CẤP ROUTER, không rắc vào từng route: mọi form admin đều có thể có ô
// soạn thảo, và thêm route mới mà quên gắn thì lỗi biểu hiện là "lưu xong ảnh
// trong bài biến mất" — rất khó lần ra.
adminRouter.use(mergeRichtextImages);
// Chặn id không hợp lệ (vd /admin/products/abc/edit) -> 404 thay vì 500
adminRouter.param('id', (req, res, next, id) => {
    if (!/^[1-9][0-9]*$/.test(id)) return res.status(404).send('ID không hợp lệ.');
    next();
});

// ───── Đăng nhập / đăng xuất ──────────────────────────────────────────────────
// PHẢI khai TRƯỚC adminAuth: người chưa đăng nhập vẫn phải vào được trang này,
// nếu không sẽ bị đá về /admin/login thành vòng lặp vô hạn.
adminRouter.get('/login', (req, res) => adminAuthController.showLogin(req, res));
adminRouter.post('/login', (req, res) => adminAuthController.login(req, res));
adminRouter.get('/logout', (req, res) => adminAuthController.logout(req, res));
adminRouter.post('/logout', (req, res) => adminAuthController.logout(req, res));

// ───── Từ đây trở xuống YÊU CẦU đăng nhập ─────────────────────────────────────
// Trước đây dòng này bị comment nên cả khu /admin mở toang. Giờ bật lại bằng
// phiên đăng nhập (adminAuth.middleware) để gắn được danh tính + vai trò.
adminRouter.use(adminAuth);

adminRouter.get('/', (req, res) => res.redirect('/admin/slides'));

// ───── Tài khoản của tôi (tự phục vụ — MỌI người đã đăng nhập, KHÔNG requireRole) ─
adminRouter.get('/account', (req, res) => adminAccountController.show(req, res));
adminRouter.post('/account', (req, res) => adminAccountController.updateProfile(req, res));
adminRouter.post('/account/password', (req, res) => adminAccountController.changePassword(req, res));

// Xem trước nội dung soạn thảo (nút hình con mắt trên thanh công cụ) -> trả JSON,
// không phải trang. Đặt ở đây, TRƯỚC crudRoutes: tên `preview` không trùng base
// nào nên không có đường đụng POST /admin/:base.
adminRouter.post('/preview', (req, res) => adminPreviewController.render(req, res));
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
// Slogan đè lên slideshow: đúng 2 khoá VI/EN trong bảng `settings`, chỉ sửa.
adminRouter.get('/slogan', (req, res) => adminSloganController.form(req, res));
adminRouter.post('/slogan', (req, res) => adminSloganController.update(req, res));

// ───── Quản lý tài khoản (CHỈ admin) ──────────────────────────────────────────
// Kích hoạt mục "Nhân viên" vốn đã có sẵn trong views/admin/_nav.ejs. requireRole
// chặn staff ở tầng route; _nav cũng ẩn link này với staff cho khỏi thấy.
const onlyAdmin = requireRole('admin');
adminRouter.get('/staff', onlyAdmin, (req, res) => adminUserController.index(req, res));
adminRouter.get('/staff/new', onlyAdmin, (req, res) => adminUserController.form(req, res));
adminRouter.post('/staff', onlyAdmin, (req, res) => adminUserController.create(req, res));
adminRouter.get('/staff/:id/edit', onlyAdmin, (req, res) => adminUserController.form(req, res));
adminRouter.post('/staff/:id/delete', onlyAdmin, (req, res) => adminUserController.destroy(req, res));
adminRouter.post('/staff/:id', onlyAdmin, (req, res) => adminUserController.update(req, res));

router.use('/admin', adminRouter);

// Health check — READINESS chứ không phải liveness.
//
// railway.json trỏ healthcheckPath vào đây, nên endpoint này chính là thứ quyết
// định bản deploy mới có được thay bản đang chạy hay không. Trả 200 trong lúc DB
// còn chưa nối được nghĩa là đưa một site 500 toàn tập lên sóng VÀ vứt mất bản
// cũ đang chạy tốt — nên phải soi cờ dbReady do index.js đặt.
//
// Cờ chỉ bật MỘT chiều (xem index.js): DB rớt giữa chừng sẽ không kéo nó về
// false, vì restartPolicy ON_FAILURE gặp 503 sẽ restart container — một cú chớp
// mạng của MySQL đủ thành vòng lặp restart.
const health = (req, res) => {
    const dbReady = req.app.locals.dbReady === true;
    res.status(dbReady ? 200 : 503).json({
        status: dbReady ? 'ok' : 'db_unavailable',
        db: dbReady ? 'up' : 'down',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};
router.get('/health', health);
router.get('/web/health', health);

module.exports = router;
