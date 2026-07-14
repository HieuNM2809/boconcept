const {Router} = require('express');
const router = Router();
const homeController = require('../app/Http/Controllers/home.controller');
const catalogController = require('../app/Http/Controllers/catalog.controller');
const adminController = require('../app/Http/Controllers/admin.controller');
const adminCategoryController = require('../app/Http/Controllers/admin.category.controller');
const adminPartnerController = require('../app/Http/Controllers/admin.partner.controller');
const adminProductController = require('../app/Http/Controllers/admin.product.controller');
const adminAuth = require('../app/Http/Middleware/adminAuth.middleware');

// Trang chủ (render EJS, load dữ liệu từ DB)
router.get('/', (req, res) => homeController.index(req, res));

// Trang danh sách sản phẩm theo loại
router.get('/categories/:id', (req, res) => catalogController.category(req, res));

// Trang chi tiết sản phẩm
router.get('/products/:id', (req, res) => catalogController.product(req, res));

// ───── Admin (Basic Auth) — quản lý slideshow ────────────────────────────────
const adminRouter = Router();
adminRouter.use(adminAuth);
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
