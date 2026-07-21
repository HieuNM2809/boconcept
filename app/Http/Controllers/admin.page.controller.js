const PageService = require('../../Services/Api/page.service');

// Màn này chỉ quản đúng MỘT bản ghi: trang giới thiệu công ty. Slug đóng cứng ở
// đây chứ không lấy từ URL — không có đường nào sửa sang bản ghi khác, và cũng
// không còn thêm/xoá trang (xem routes/web.route.js).
const SLUG = 'about';

const flashText = (k) => ({updated: 'Đã cập nhật.', missing: 'Chưa có dữ liệu trang giới thiệu trong database.'}[k] || '');

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
        flash: flashText(req.query.msg) || (item ? '' : flashText('missing')),
    });
}

async function update(req, res) {
    try {
        const found = await PageService.getBySlugAny(SLUG);
        if (!found) throw Object.assign(new Error(`Không tìm thấy trang "${SLUG}"`), {status: 404});
        await PageService.update(found.id, req.body);
        res.redirect('/admin/pages?msg=updated');
    } catch (e) {
        res.status(e.status || 400).send('Lỗi: ' + e.message);
    }
}

module.exports = {form, update};
