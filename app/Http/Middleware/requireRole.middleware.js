const {backWithError} = require('../../Helpers/adminFlash.helper');

/**
 * Chặn theo vai trò cho khu /admin. Dùng SAU adminAuth.middleware (đã gắn
 * req.adminUser). Ví dụ mục quản lý user chỉ cho 'admin':
 *   adminRouter.get('/staff', requireRole('admin'), ctrl.index)
 *
 * Không có quyền -> quay lại trang trước kèm toast đỏ (backWithError), KHÔNG trả
 * trang trắng 403: staff bấm nhầm link vẫn ở nguyên màn quản trị, chỉ thấy báo
 * "không đủ quyền". adminAuth luôn chạy trước nên tới đây chắc chắn đã đăng nhập.
 */
module.exports = function requireRole(...roles) {
    return function (req, res, next) {
        const role = req.adminUser && req.adminUser.role;
        if (role && roles.includes(role)) return next();
        return backWithError(req, res, '/admin', Object.assign(
            new Error('Bạn không có quyền truy cập mục này.'),
            {status: 403},
        ));
    };
};
