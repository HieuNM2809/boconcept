const {body, query, param, validationResult} = require('express-validator');
const BaseController = require('../Controllers/BaseController');

const listCategory = [
    query('tree').optional().isIn(['0', '1', 'true', 'false']).withMessage('tree phải là 0/1/true/false'),
    query('parent_id').optional(),
    query('status').optional().isInt({min: 0, max: 2}).withMessage('status không hợp lệ'),
    query('q').optional().isString().trim(),
];

const idParam = [
    param('id').isInt({gt: 0}).withMessage('id phải là số nguyên > 0'),
];

const createCategory = [
    body('name_vi')
        .exists().withMessage('name_vi là bắt buộc')
        .isString().notEmpty().withMessage('name_vi không được để trống'),
    body('name_en').optional().isString(),
    body('slug').optional().isString(),
    body('image').optional().isString(),
    body('parent_id').optional({nullable: true}).isInt({gt: 0}).withMessage('parent_id phải là số nguyên > 0'),
    body('sort_order').optional().isInt().withMessage('sort_order phải là số nguyên'),
    body('status').optional().isInt({min: 0, max: 1}).withMessage('status phải là 0 hoặc 1'),
];

const updateCategory = [
    ...idParam,
    body('name_vi').optional().isString().notEmpty(),
    body('name_en').optional().isString(),
    body('slug').optional().isString(),
    body('image').optional().isString(),
    body('parent_id').optional({nullable: true}).isInt({gt: 0}).withMessage('parent_id phải là số nguyên > 0'),
    body('sort_order').optional().isInt(),
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
    listCategory,
    idParam,
    createCategory,
    updateCategory,
    handleValidation,
};
