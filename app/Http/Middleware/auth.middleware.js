const BaseController = require('../Controllers/BaseController');
const AuthService = require('../../Services/Api/auth.service');
const messages = require('../../../resources/lang/vi/messages').auth;

module.exports = async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.replace(/^Bearer\s+/, '');
        if (!token) throw Object.assign(new Error('Missing token'), {status: 401});

        const payload = AuthService.verifyToken(token);
        req.client = payload; // gắn client_id, service vào req
        next();
    } catch (err) {
        new BaseController().sendErrorResponse(res, err, messages.unauthorized, 401);
    }
};
