const GalleryService = require('../../Services/Api/gallery.service');

const flashText = (k) => ({updated: 'Đã cập nhật.', notfound: 'Khe ảnh không tồn tại.'}[k] || '');

// Nhãn hiển thị cho từng khe — admin cần biết ảnh này rơi vào ĐÂU trên trang chủ.
const SLOT_LABELS = {1: 'Ô lớn 1 (bên trái)', 2: 'Ô lớn 2 (ở giữa)', 3: 'Ô lớn 3 (bên phải)'};

async function index(req, res) {
    const items = (await GalleryService.getSlots()).map((s) => ({...s, label: SLOT_LABELS[s.slot]}));
    res.render('admin/gallery', {
        pageTitle: 'Lưới ảnh trang chủ',
        section: 'gallery',
        items,
        flash: flashText(req.query.msg),
    });
}

async function form(req, res) {
    const slot = parseInt(req.params.slot, 10);
    if (!GalleryService.isValidSlot(slot)) return res.redirect('/admin/gallery?msg=notfound');

    const [item] = (await GalleryService.getSlots()).filter((s) => s.slot === slot);
    res.render('admin/gallery-form', {
        pageTitle: 'Sửa ' + SLOT_LABELS[slot],
        section: 'gallery',
        item,
        label: SLOT_LABELS[slot],
        action: `/admin/gallery/${slot}`,
    });
}

async function update(req, res) {
    try {
        await GalleryService.saveSlot(req.params.slot, req.body);
        res.redirect('/admin/gallery?msg=updated');
    } catch (e) {
        res.status(e.status || 400).send('Lỗi: ' + e.message);
    }
}

module.exports = {index, form, update};
