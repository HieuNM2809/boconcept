const BaseController = require('../BaseController');
const AuthService = require('../../../Services/Api/auth.service');
const messages = require('../../../../resources/lang/vi/messages').auth;

class AuthController extends BaseController {
    // POST /api/auth/login
    async login(req, res) {
        try {
            const {client_id, client_secret} = req.body;

            const client = await AuthService.validateClient(client_id, client_secret);
            const token = AuthService.issueToken(client);
            this.sendSuccessResponse(res, {token}, messages.token_issued);
        } catch (err) {
            this.sendErrorResponse(res, err, messages.invalid_credentials, err.status || 401);
        }
    }
}

module.exports = new AuthController();
