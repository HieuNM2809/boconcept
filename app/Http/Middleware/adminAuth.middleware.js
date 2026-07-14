// Bảo vệ khu vực /admin bằng HTTP Basic Auth (đơn giản, không thêm dependency).
// Dev only qua HTTP; production nên đặt sau HTTPS. Nâng cấp lên session login nếu cần.
module.exports = function adminAuth(req, res, next) {
    const user = process.env.ADMIN_USER || 'admin';
    const pass = process.env.ADMIN_PASS || 'admin';

    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        const idx = decoded.indexOf(':');
        const u = decoded.slice(0, idx);
        const p = decoded.slice(idx + 1);
        if (u === user && p === pass) {
            return next();
        }
    }

    res.set('WWW-Authenticate', 'Basic realm="Admin", charset="UTF-8"');
    return res.status(401).send('Cần đăng nhập quản trị.');
};
