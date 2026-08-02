const CertificateService = require('../../Services/Api/certificate.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const {backWithError} = require('../../Helpers/adminFlash.helper');
const flashText = (k) => ({created: 'Đã thêm chứng nhận.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const filters = {q: req.query.q ? String(req.query.q).trim() : ''};
    const items = toPlain(await CertificateService.getAll(filters));
    res.render('admin/certificates', {pageTitle: 'Giấy chứng nhận công ty', section: 'certificates', items, filters, flash: flashText(req.query.msg)});
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const c = await CertificateService.getById(parseInt(req.params.id, 10));
        if (!c) return res.redirect('/admin/certificates?msg=notfound');
        item = c.get({plain: true});
    }
    res.render('admin/certificate-form', {
        pageTitle: item ? 'Sửa chứng nhận' : 'Thêm chứng nhận',
        section: 'certificates', item,
        action: item ? `/admin/certificates/${item.id}` : '/admin/certificates',
    });
}

async function create(req, res) {
    try { await CertificateService.create(req.body); res.redirect('/admin/certificates?msg=created'); }
    catch (e) { backWithError(req, res, '/admin/certificates', e); }
}

async function update(req, res) {
    try { await CertificateService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/certificates?msg=updated'); }
    catch (e) { backWithError(req, res, '/admin/certificates', e); }
}

async function destroy(req, res) {
    try { await CertificateService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/certificates?msg=deleted'); }
    catch (e) { backWithError(req, res, '/admin/certificates', e); }
}

module.exports = {index, form, create, update, destroy};
