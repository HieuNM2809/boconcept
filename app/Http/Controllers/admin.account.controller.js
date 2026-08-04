const UserService = require('../../Services/Api/user.service');
const {backWithError} = require('../../Helpers/adminFlash.helper');

// Trang "Tài khoản của tôi" — KHÁC /admin/staff (quản lý người khác, chỉ admin).
// Đây là tự phục vụ: MỌI người đã đăng nhập (admin hoặc staff) tự sửa hồ sơ + đổi
// mật khẩu CHÍNH MÌNH. Vì vậy route KHÔNG gắn requireRole; id luôn là req.adminUser.id.
const flashText = (k) => ({
    updated: 'Đã cập nhật thông tin tài khoản.',
    pwchanged: 'Đã đổi mật khẩu.',
}[k] || '');

async function show(req, res) {
    const u = await UserService.getById(req.adminUser.id); // đã loại cột password
    const item = u && u.get ? u.get({plain: true}) : u;
    res.render('admin/account', {
        pageTitle: 'Tài khoản',
        section: 'account',
        item,
        // Mở sẵn hộp đổi mật khẩu khi quay lại kèm lỗi (?openpw=1) để admin thấy
        // ngay thông báo thay vì phải bấm lại nút.
        openPw: req.query.openpw === '1',
        flash: flashText(req.query.msg),
    });
}

async function updateProfile(req, res) {
    try {
        await UserService.updateProfile(req.adminUser.id, req.body);
        res.redirect('/admin/account?msg=updated');
    } catch (e) { backWithError(req, res, '/admin/account', e); }
}

async function changePassword(req, res) {
    try {
        await UserService.changePassword(req.adminUser.id, {
            current: req.body.current_password,
            newPassword: req.body.new_password,
            confirm: req.body.confirm_password,
        });
        res.redirect('/admin/account?msg=pwchanged');
    } catch (e) {
        // Lỗi đổi mật khẩu -> quay lại và MỞ sẵn hộp thoại để hiện toast tại chỗ.
        backWithError(req, res, '/admin/account?openpw=1', e);
    }
}

module.exports = {show, updateProfile, changePassword};
