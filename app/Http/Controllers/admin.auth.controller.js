const UserService = require('../../Services/Api/user.service');
const {COOKIE_NAME} = require('../Middleware/adminAuth.middleware');
const {logger} = require('../../../config/log4js');

// Đích quay lại sau đăng nhập: CHỈ nhận đường trong /admin và không phải chính
// trang login (tránh vòng lặp) -> chặn open-redirect qua ?next=.
function safeNext(next) {
    const s = String(next || '');
    if (s.startsWith('/admin') && !s.startsWith('/admin/login')) return s;
    return '/admin';
}

// GET /admin/login — đã có phiên hợp lệ thì vào thẳng, khỏi bắt đăng nhập lại.
function showLogin(req, res) {
    const token = req.headers.cookie
        && (req.headers.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]*)')) || [])[1];
    if (token) {
        try {
            UserService.verifySession(decodeURIComponent(token));
            return res.redirect(safeNext(req.query.next));
        } catch (_) { /* token hỏng/hết hạn -> cứ hiện form đăng nhập */ }
    }
    res.render('admin/login', {
        pageTitle: 'Đăng nhập quản trị',
        error: '',
        username: '',
        next: safeNext(req.query.next),
    });
}

// POST /admin/login
async function login(req, res) {
    const nextUrl = safeNext(req.body.next);
    try {
        const user = await UserService.authenticate(req.body.username, req.body.password);
        const {token, maxAge} = UserService.issueSession(user);
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,                              // JS trang không đọc được -> giảm rủi ro XSS chiếm phiên
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // sau HTTPS (Railway) thì bật; local http vẫn chạy
            maxAge,
        });
        res.redirect(nextUrl);
    } catch (err) {
        logger.warn('Đăng nhập admin thất bại', {error: {message: err.message}});
        // Render LẠI form (không redirect) để giữ tên đã gõ và hiện lỗi ngay tại chỗ.
        res.status(err.status || 401).render('admin/login', {
            pageTitle: 'Đăng nhập quản trị',
            error: err.message || 'Đăng nhập không thành công.',
            username: String(req.body.username || '').trim(),
            next: nextUrl,
        });
    }
}

// GET|POST /admin/logout
function logout(req, res) {
    res.clearCookie(COOKIE_NAME);
    res.redirect('/admin/login');
}

module.exports = {showLogin, login, logout};
