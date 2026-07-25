const PageService = require('../../Services/Api/page.service');
const {backWithError} = require('../../Helpers/adminFlash.helper');

// Màn này chỉ quản đúng MỘT bản ghi: trang giới thiệu công ty. Slug đóng cứng ở
// đây chứ không lấy từ URL — không có đường nào sửa sang bản ghi khác, và cũng
// không còn thêm/xoá trang (xem routes/web.route.js).
const SLUG = 'about';

// Chỉ còn cảnh báo TRẠNG THÁI "chưa có dữ liệu" (hiện dạng banner cố định); các
// thông báo sau thao tác (đã cập nhật / lỗi) giờ do toast lo qua ?msg / ?err.
const flashText = (k) => ({missing: 'Chưa có dữ liệu trang giới thiệu trong database.'}[k] || '');

async function form(req, res) {
    // Cố ý KHÔNG lọc status: trang đang ẩn vẫn phải mở ra sửa được, không thì
    // bấm "Ẩn" một lần là mất luôn lối vào màn này.
    const found = await PageService.getBySlugAny(SLUG);
    const item = found ? found.get({plain: true}) : null;
    res.render('admin/page-form', {
        pageTitle: 'Giới thiệu công ty',
        section: 'pages',
        item,
        action: '/admin/pages',
        flash: item ? '' : flashText('missing'),
    });
}

async function update(req, res) {
    try {
        const found = await PageService.getBySlugAny(SLUG);
        if (!found) throw Object.assign(new Error(`Không tìm thấy trang "${SLUG}"`), {status: 404});
        await PageService.update(found.id, req.body);
        res.redirect('/admin/pages?msg=updated');
    } catch (e) {
        backWithError(req, res, '/admin/pages', e);
    }
}

module.exports = {form, update};
