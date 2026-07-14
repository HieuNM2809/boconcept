const BaseController = require('../BaseController');
const CategoryService = require('../../../Services/Api/category.service');
const messages = require('../../../../resources/lang/vi/messages').category;

class CategoryController extends BaseController {
    // GET /api/categories  (?tree=1&parent_id=&status=&q=)
    async getAll(req, res) {
        try {
            const data = await CategoryService.getAll(req.query);
            this.sendSuccessResponse(res, data, messages.retrieved_all_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_all);
        }
    }

    // GET /api/categories/:id
    async getById(req, res) {
        try {
            const item = await CategoryService.getById(req.params.id);
            if (!item) return this.sendErrorResponse(res, messages.not_found, messages.not_found, 404);
            this.sendSuccessResponse(res, item, messages.retrieved_one_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_one);
        }
    }

    // POST /api/categories
    async create(req, res) {
        try {
            const created = await CategoryService.create(req.body);
            this.sendSuccessResponse(res, created, messages.created_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_create, err.status || 400);
        }
    }

    // PUT /api/categories/:id
    async update(req, res) {
        try {
            const updated = await CategoryService.update(req.params.id, req.body);
            this.sendSuccessResponse(res, updated, messages.updated_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_update, err.status || 400);
        }
    }

    // DELETE /api/categories/:id
    async delete(req, res) {
        try {
            await CategoryService.delete(req.params.id);
            this.sendSuccessResponse(res, null, messages.deleted_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_delete, err.status || 400);
        }
    }
}

module.exports = new CategoryController();
