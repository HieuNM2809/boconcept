const {Router} = require('express');
const authController = require('../app/Http/Controllers/Api/auth.controller');
const exampleController = require('../app/Http/Controllers/Api/example.controller');
const categoryController = require('../app/Http/Controllers/Api/category.controller');
const productController = require('../app/Http/Controllers/Api/product.controller');
const authenticate = require('../app/Http/Middleware/auth.middleware');
const ev = require('../app/Http/Requests/example.validation');
const cv = require('../app/Http/Requests/category.validation');
const pv = require('../app/Http/Requests/product.validation');

const router = Router();

// ───── Auth ──────────────────────────────────────────────────────────────────
const authRouter = Router();
authRouter
    .route('/login')
    .post(ev.login, ev.handleValidation, (req, res) => authController.login(req, res));
router.use('/auth', authRouter);

// ───── Example CRUD (yêu cầu token) ───────────────────────────────────────────
const exampleRouter = Router();
exampleRouter.use(authenticate);
exampleRouter
    .route('/')
    .get(ev.listExample, ev.handleValidation, (req, res) => exampleController.getAll(req, res))
    .post(ev.createExample, ev.handleValidation, (req, res) => exampleController.create(req, res));
exampleRouter
    .route('/:id')
    .get(ev.idParam, ev.handleValidation, (req, res) => exampleController.getById(req, res))
    .put(ev.updateExample, ev.handleValidation, (req, res) => exampleController.update(req, res))
    .delete(ev.idParam, ev.handleValidation, (req, res) => exampleController.delete(req, res));
router.use('/examples', exampleRouter);

// ───── Categories (GET public · ghi cần token) ────────────────────────────────
const categoryRouter = Router();
categoryRouter
    .route('/')
    .get(cv.listCategory, cv.handleValidation, (req, res) => categoryController.getAll(req, res))
    .post(authenticate, cv.createCategory, cv.handleValidation, (req, res) => categoryController.create(req, res));
categoryRouter
    .route('/:id')
    .get(cv.idParam, cv.handleValidation, (req, res) => categoryController.getById(req, res))
    .put(authenticate, cv.updateCategory, cv.handleValidation, (req, res) => categoryController.update(req, res))
    .delete(authenticate, cv.idParam, cv.handleValidation, (req, res) => categoryController.delete(req, res));
router.use('/categories', categoryRouter);

// ───── Products (GET public · ghi cần token) ──────────────────────────────────
const productRouter = Router();
productRouter
    .route('/')
    .get(pv.listProduct, pv.handleValidation, (req, res) => productController.getAll(req, res))
    .post(authenticate, pv.createProduct, pv.handleValidation, (req, res) => productController.create(req, res));
// /featured phải đặt TRƯỚC /:id để không bị bắt nhầm là id
productRouter
    .route('/featured')
    .get(pv.featuredProduct, pv.handleValidation, (req, res) => productController.featured(req, res));
productRouter
    .route('/:id')
    .get(pv.idParam, pv.handleValidation, (req, res) => productController.getById(req, res))
    .put(authenticate, pv.updateProduct, pv.handleValidation, (req, res) => productController.update(req, res))
    .delete(authenticate, pv.idParam, pv.handleValidation, (req, res) => productController.delete(req, res));
router.use('/products', productRouter);

module.exports = router;
