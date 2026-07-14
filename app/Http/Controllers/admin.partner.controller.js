const PartnerService = require('../../Services/Api/partner.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm đối tác.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const items = toPlain(await PartnerService.getAll());
    res.render('admin/partners', {pageTitle: 'Đối tác hợp tác', section: 'partners', items, flash: flashText(req.query.msg)});
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const p = await PartnerService.getById(parseInt(req.params.id, 10));
        if (!p) return res.redirect('/admin/partners?msg=notfound');
        item = p.get({plain: true});
    }
    res.render('admin/partner-form', {
        pageTitle: item ? 'Sửa đối tác' : 'Thêm đối tác',
        section: 'partners', item,
        action: item ? `/admin/partners/${item.id}` : '/admin/partners',
    });
}

async function create(req, res) {
    try { await PartnerService.create(req.body); res.redirect('/admin/partners?msg=created'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await PartnerService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/partners?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await PartnerService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/partners?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
