const {body, query, param, validationResult} = require('express-validator');
const BaseController = require('../Controllers/BaseController');

const listProduct = [
    query('page').optional().isInt({min: 1}).withMessage('page phải là số nguyên >= 1'),
    query('per_page').optional().isInt({min: 1, max: 100}).withMessage('per_page phải từ 1 đến 100'),
    query('q').optional().isString().trim(),
    query('category_id').optional().isInt({gt: 0}).withMessage('category_id phải là số nguyên > 0'),
    query('is_featured').optional().isInt({min: 0, max: 1}).withMessage('is_featured phải là 0 hoặc 1'),
    query('min_price').optional().isFloat({min: 0}).withMessage('min_price không hợp lệ'),
    query('max_price').optional().isFloat({min: 0}).withMessage('max_price không hợp lệ'),
    query('status').optional().isInt({min: 0, max: 2}),
    query('sort').optional().isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'priority'])
        .withMessage('sort không hợp lệ'),
];

const featuredProduct = [
    query('limit').optional().isInt({min: 1, max: 50}).withMessage('limit phải từ 1 đến 50'),
];

const idParam = [
    param('id').isInt({gt: 0}).withMessage('id phải là số nguyên > 0'),
];

const createProduct = [
    body('name_vi')
        .exists().withMessage('name_vi là bắt buộc')
        .isString().notEmpty().withMessage('name_vi không được để trống'),
    body('name_en').optional().isString(),
    body('slug').optional().isString(),
    body('description_vi').optional().isString(),
    body('description_en').optional().isString(),
    body('category_id').optional({nullable: true}).isInt({gt: 0}).withMessage('category_id phải là số nguyên > 0'),
    body('price').optional().isFloat({min: 0}).withMessage('price phải là số >= 0'),
    body('thumbnail').optional().isString(),
    body('is_featured').optional().isInt({min: 0, max: 1}),
    body('priority').optional().isInt(),
    body('status').optional().isInt({min: 0, max: 1}),
    body('variants').optional().isArray().withMessage('variants phải là mảng'),
    body('variants.*.name').optional().isString().notEmpty().withMessage('variant.name không được để trống'),
    body('images').optional().isArray().withMessage('images phải là mảng'),
];

const updateProduct = [
    ...idParam,
    body('name_vi').optional().isString().notEmpty(),
    body('name_en').optional().isString(),
    body('slug').optional().isString(),
    body('description_vi').optional().isString(),
    body('description_en').optional().isString(),
    body('category_id').optional({nullable: true}).isInt({gt: 0}),
    body('price').optional().isFloat({min: 0}),
    body('thumbnail').optional().isString(),
    body('is_featured').optional().isInt({min: 0, max: 1}),
    body('priority').optional().isInt(),
    body('status').optional().isInt({min: 0, max: 1}),
];

const baseController = new BaseController();
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return baseController.sendErrorResponse(res, errors.array(), 'Validation failed', 422);
    }
    next();
};

module.exports = {
    listProduct,
    featuredProduct,
    idParam,
    createProduct,
    updateProduct,
    handleValidation,
};
