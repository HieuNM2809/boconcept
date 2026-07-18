const PageService = require('../../Services/Api/page.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm trang.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const items = toPlain(await PageService.getAll());
    res.render('admin/pages', {
        pageTitle: 'Trang nội dung',
        section: 'pages',
        items,
        protectedSlugs: PageService.PROTECTED_SLUGS,
        flash: flashText(req.query.msg),
    });
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const p = await PageService.getById(parseInt(req.params.id, 10));
        if (!p) return res.redirect('/admin/pages?msg=notfound');
        item = p.get({plain: true});
    }
    res.render('admin/page-form', {
        pageTitle: item ? 'Sửa trang' : 'Thêm trang',
        section: 'pages', item,
        protectedSlugs: PageService.PROTECTED_SLUGS,
        action: item ? `/admin/pages/${item.id}` : '/admin/pages',
    });
}

async function create(req, res) {
    try { await PageService.create(req.body); res.redirect('/admin/pages?msg=created'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await PageService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/pages?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await PageService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/pages?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
