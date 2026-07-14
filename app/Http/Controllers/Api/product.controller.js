const BaseController = require('../BaseController');
const ProductService = require('../../../Services/Api/product.service');
const messages = require('../../../../resources/lang/vi/messages').product;
const {logRequestResponse} = require('../../../Helpers/base.helper');

class ProductController extends BaseController {
    // GET /api/products  (?page&per_page&q&category_id&is_featured&min_price&max_price&sort&status)
    async getAll(req, res) {
        try {
            const result = await ProductService.getAll(req.query);
            logRequestResponse('ProductController.getAll', req.query, {count: result?.data?.length, total: result?.meta?.total});
            this.sendSuccessResponse(res, result.data, messages.retrieved_all_success, {meta: result.meta});
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_all);
        }
    }

    // GET /api/products/featured  (?limit=6)
    async featured(req, res) {
        try {
            const data = await ProductService.getFeatured(req.query);
            this.sendSuccessResponse(res, data, messages.retrieved_all_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_all);
        }
    }

    // GET /api/products/:id
    async getById(req, res) {
        try {
            const item = await ProductService.getById(req.params.id);
            if (!item) return this.sendErrorResponse(res, messages.not_found, messages.not_found, 404);
            this.sendSuccessResponse(res, item, messages.retrieved_one_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_one);
        }
    }

    // POST /api/products
    async create(req, res) {
        try {
            const created = await ProductService.create(req.body);
            this.sendSuccessResponse(res, created, messages.created_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_create, err.status || 400);
        }
    }

    // PUT /api/products/:id
    async update(req, res) {
        try {
            const updated = await ProductService.update(req.params.id, req.body);
            this.sendSuccessResponse(res, updated, messages.updated_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_update, err.status || 400);
        }
    }

    // DELETE /api/products/:id
    async delete(req, res) {
        try {
            await ProductService.delete(req.params.id);
            this.sendSuccessResponse(res, null, messages.deleted_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_delete, err.status || 400);
        }
    }
}

module.exports = new ProductController();
