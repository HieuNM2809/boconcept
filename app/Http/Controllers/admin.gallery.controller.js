const GalleryService = require('../../Services/Api/gallery.service');

const flashText = (k) => ({updated: 'Đã cập nhật.', notfound: 'Khe ảnh không tồn tại.'}[k] || '');

// Nhãn hiển thị cho từng khe — admin cần biết ảnh này rơi vào ĐÂU trên trang chủ.
// Số khe khớp với .collage-slot-N trong style.css và mảng SLOTS của service.
const SLOT_LABELS = {
    1: 'Khe 1 — slider, ô lớn dưới-trái',
    2: 'Khe 2 — slider, ô lớn ở giữa',
    3: 'Khe 3 — slider, ô lớn bên phải',
    4: 'Khe 4 — ảnh tĩnh, trên · giữa',
    5: 'Khe 5 — ảnh tĩnh, trên · phải',
    6: 'Khe 6 — ảnh tĩnh, bên trái',
    7: 'Khe 7 — ảnh tĩnh, dưới · giữa-trái',
    8: 'Khe 8 — ảnh tĩnh, dưới · giữa-phải',
};

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
        isSlider: GalleryService.isSliderSlot(slot),
        action: `/admin/gallery/${slot}`,
    });
}

/**
 * Form gửi lên ba mảng SONG SONG cùng độ dài: slot_image[], slot_alt_vi[],
 * slot_alt_en[]. Gom lại thành mảng object theo chỉ số. Khe tĩnh chỉ có một dòng
 * nên các trường về dạng chuỗi đơn chứ không phải mảng — `[].concat()` san phẳng
 * cả hai kiểu.
 *
 * Tiền tố `slot_` KHÔNG phải để cho đẹp: ba tên này phải nằm trong whitelist của
 * hpp (app/Http/Middleware/index.middleware.js), nếu không hpp gộp mảng về giá
 * trị CUỐI và admin lưu 5 ảnh xong chỉ thấy 1, không có lỗi nào báo ra.
 */
function collectImages(body = {}) {
    const images = [].concat(body.slot_image || []);
    const altVi = [].concat(body.slot_alt_vi || []);
    const altEn = [].concat(body.slot_alt_en || []);
    return images.map((image, i) => ({image, alt_vi: altVi[i], alt_en: altEn[i]}));
}

async function update(req, res) {
    try {
        await GalleryService.saveSlot(req.params.slot, collectImages(req.body));
        res.redirect('/admin/gallery?msg=updated');
    } catch (e) {
        res.status(e.status || 400).send('Lỗi: ' + e.message);
    }
}

module.exports = {index, form, update};
