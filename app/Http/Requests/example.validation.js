const {body, query, param, validationResult} = require('express-validator');
const BaseController = require('../Controllers/BaseController');

// ───── Rule cho từng endpoint ─────────────────────────────────────────────────
const login = [
    body('client_id')
        .exists().withMessage('client_id là bắt buộc')
        .isString().withMessage('client_id phải là chuỗi')
        .notEmpty().withMessage('client_id không được để trống'),
    body('client_secret')
        .exists().withMessage('client_secret là bắt buộc')
        .isString().withMessage('client_secret phải là chuỗi')
        .notEmpty().withMessage('client_secret không được để trống'),
];

const listExample = [
    query('page').optional().isInt({min: 1}).withMessage('page phải là số nguyên >= 1'),
    query('per_page').optional().isInt({min: 1, max: 100}).withMessage('per_page phải từ 1 đến 100'),
    query('q').optional().isString().withMessage('q phải là chuỗi').trim(),
];

const idParam = [
    param('id').isInt({gt: 0}).withMessage('id phải là số nguyên > 0'),
];

const createExample = [
    body('name')
        .exists().withMessage('name là bắt buộc')
        .isString().withMessage('name phải là chuỗi')
        .notEmpty().withMessage('name không được để trống'),
    body('description').optional().isString().withMessage('description phải là chuỗi'),
    body('status').optional().isInt({min: 0, max: 1}).withMessage('status phải là 0 hoặc 1'),
];

const updateExample = [
    ...idParam,
    body('name').optional().isString().notEmpty().withMessage('name không được để trống'),
    body('description').optional().isString().withMessage('description phải là chuỗi'),
    body('status').optional().isInt({min: 0, max: 1}).withMessage('status phải là 0 hoặc 1'),
];

// ───── Middleware tổng xử lý kết quả validation ───────────────────────────────
const baseController = new BaseController();
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return baseController.sendErrorResponse(res, errors.array(), 'Validation failed', 422);
    }
    next();
};

module.exports = {
    login,
    listExample,
    idParam,
    createExample,
    updateExample,
    handleValidation,
};
