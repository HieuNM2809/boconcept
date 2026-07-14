const jwt = require('jsonwebtoken');
const moment = require('moment');

class AuthService {
    // 1. Kiểm tra client_id & client_secret
    static async validateClient(clientId, clientSecret) {
        // Require lazy để các hàm token (issue/verify) không kéo theo kết nối DB
        const ApiClient = require('../../Models/ApiClient.model');

        const client = await ApiClient.findOne({
            where: {client_id: clientId, is_active: 1},
        });
        if (!client || client.client_secret !== clientSecret) {
            const err = new Error('Invalid credentials');
            err.status = 401;
            throw err;
        }
        return client;
    }

    // 2. Phát hành JWT
    static issueToken(client) {
        const payload = {
            client_id: client.client_id,
            service: client.service_name,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.TOKEN_EXPIRES_IN || '24h',
        });

        const decoded = jwt.decode(accessToken);
        const expiresIn = decoded.exp;
        const expiresAt = moment.unix(expiresIn).format('YYYY-MM-DD HH:mm:ss');

        return {accessToken, expiresIn, expiresAt};
    }

    // 3. Verify JWT (throw nếu không hợp lệ)
    static verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
}

module.exports = AuthService;
