const GalleryService = require('../../Services/Api/gallery.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm ảnh.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const items = toPlain(await GalleryService.getAll());
    res.render('admin/gallery', {
        pageTitle: 'Lưới ảnh trang chủ',
        section: 'gallery',
        items,
        maxItems: GalleryService.MAX_ITEMS,
        activeCount: items.filter((i) => i.status).length,
        flash: flashText(req.query.msg),
    });
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const g = await GalleryService.getById(parseInt(req.params.id, 10));
        if (!g) return res.redirect('/admin/gallery?msg=notfound');
        item = g.get({plain: true});
    }
    res.render('admin/gallery-form', {
        pageTitle: item ? 'Sửa ảnh' : 'Thêm ảnh',
        section: 'gallery', item,
        action: item ? `/admin/gallery/${item.id}` : '/admin/gallery',
    });
}

async function create(req, res) {
    try { await GalleryService.create(req.body); res.redirect('/admin/gallery?msg=created'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await GalleryService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/gallery?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await GalleryService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/gallery?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
