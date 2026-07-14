const BaseController = require('../BaseController');
const ExampleService = require('../../../Services/Api/example.service');
const messages = require('../../../../resources/lang/vi/messages').example;
const {logRequestResponse} = require('../../../Helpers/base.helper');

class ExampleController extends BaseController {
    // GET /api/examples
    async getAll(req, res) {
        try {
            const result = await ExampleService.getAll(req.query);
            logRequestResponse('ExampleController.getAll', req.query, {count: result?.data?.length});
            this.sendSuccessResponse(res, result.data, messages.retrieved_all_success, {meta: result.meta});
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_all);
        }
    }

    // GET /api/examples/:id
    async getById(req, res) {
        try {
            const item = await ExampleService.getById(req.params.id);
            if (!item) {
                return this.sendErrorResponse(res, messages.not_found, messages.not_found, 404);
            }
            this.sendSuccessResponse(res, item, messages.retrieved_one_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_get_one);
        }
    }

    // POST /api/examples
    async create(req, res) {
        try {
            const created = await ExampleService.create(req.body);
            this.sendSuccessResponse(res, created, messages.created_success);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.failed_create, 400);
        }
    }

    // PUT /api/examples/:id
    async update(req, res) {
        try {
            const updated = await ExampleService.update(req.params.id, req.body);
            this.sendSuccessResponse(res, updated, messages.updated_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_update, err.status || 400);
        }
    }

    // DELETE /api/examples/:id
    async delete(req, res) {
        try {
            await ExampleService.delete(req.params.id);
            this.sendSuccessResponse(res, null, messages.deleted_success);
        } catch (err) {
            this.sendErrorResponse(res, err, err.message || messages.failed_delete, err.status || 400);
        }
    }
}

module.exports = new ExampleController();
