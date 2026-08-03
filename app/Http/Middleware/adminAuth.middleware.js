const UserService = require('../../Services/Api/user.service');

// Tên cookie chứa token phiên (JWT httpOnly). Xuất ra để controller đăng
// nhập/đăng xuất ghi/xoá đúng cùng một tên.
const COOKIE_NAME = 'admin_session';

// Đọc cookie thủ công — repo không dùng cookie-parser (locale.middleware cũng tự
// đọc như vầy). Giữ nguyên cách đó cho nhất quán, khỏi thêm dependency.
function readCookie(req, name) {
    const raw = req.headers.cookie || '';
    const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Bảo vệ khu /admin bằng phiên đăng nhập (thay cho HTTP Basic Auth cũ, vốn không
 * phân biệt được người dùng nên không gắn vai trò được).
 *
 * Nạp LẠI user từ DB mỗi request (loadActiveById) chứ không tin mỗi token: tài
 * khoản bị xoá/ẩn/đổi vai trò có hiệu lực ngay, không phải chờ token hết hạn.
 * Gắn req.adminUser + res.locals.adminUser (để _nav.ejs ẩn/hiện mục theo quyền).
 *
 * Đặt SAU các route /admin/login, /admin/logout trong web.route.js — những route
 * đó phải vào được khi CHƯA đăng nhập.
 */
module.exports = async function adminAuth(req, res, next) {
    const toLogin = () => {
        // Giữ đường đang muốn tới để đăng nhập xong quay lại đúng chỗ.
        const target = req.originalUrl;
        const keep = target && target.startsWith('/admin') && !target.startsWith('/admin/login')
            ? '?next=' + encodeURIComponent(target)
            : '';
        res.clearCookie(COOKIE_NAME);
        return res.redirect('/admin/login' + keep);
    };

    const token = readCookie(req, COOKIE_NAME);
    if (!token) return toLogin();

    try {
        const payload = UserService.verifySession(token);
        const user = await UserService.loadActiveById(payload.uid);
        if (!user) return toLogin(); // bị xoá/ẩn sau khi token phát hành

        req.adminUser = {
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name,
        };
        res.locals.adminUser = req.adminUser;
        next();
    } catch (_) {
        // Token hỏng/hết hạn -> quay về đăng nhập, KHÔNG để rơi vào error handler
        // JSON (sẽ biến trang admin thành cục JSON 500).
        return toLogin();
    }
};

module.exports.COOKIE_NAME = COOKIE_NAME;
