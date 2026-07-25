/**
 * Chuyển hướng sau thao tác admin, kèm thông báo để client hiện dạng TOAST.
 *
 * Trước đây lỗi trả `res.status(400).send('Lỗi: ...')` -> một trang chữ trơn cụt,
 * mất sạch màn admin, phải bấm Back. Giờ ta quay lại ĐÚNG trang vừa đứng (form
 * đang sửa, hoặc danh sách kèm bộ lọc) và nhét `?err=` vào URL; admin.js đọc tham
 * số đó rồi bật toast đỏ ở góc màn hình, không cắt ngang thao tác.
 */

// Thêm/ghi đè một tham số vào path mà GIỮ nguyên query cũ (vd bộ lọc của danh sách).
function appendFlash(path, key, value) {
    const [base, qs] = String(path).split('?');
    const usp = new URLSearchParams(qs || '');
    usp.set(key, value);
    return base + '?' + usp.toString();
}

// Referer trỏ đúng trang admin vừa gửi form -> quay lại chính chỗ đó cho khỏi mất
// ngữ cảnh. CHỈ nhận cùng host và trong /admin để không biến thành open-redirect
// (referer rác/khác miền -> dùng `fallback`).
function safeBack(req, fallback) {
    const ref = req.get('Referer');
    if (ref) {
        try {
            const u = new URL(ref);
            if (u.host === req.get('host') && u.pathname.startsWith('/admin')) {
                return u.pathname + u.search;
            }
        } catch (_) { /* referer hỏng -> fallback */ }
    }
    return fallback;
}

// Dùng trong catch của controller admin: quay lại trang trước kèm toast lỗi.
function backWithError(req, res, fallback, err) {
    const msg = (err && err.message) || 'Có lỗi xảy ra.';
    res.redirect(appendFlash(safeBack(req, fallback), 'err', msg));
}

module.exports = {appendFlash, safeBack, backWithError};
