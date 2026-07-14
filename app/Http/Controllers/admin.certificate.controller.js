const CertificateService = require('../../Services/Api/certificate.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm chứng nhận.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const items = toPlain(await CertificateService.getAll());
    res.render('admin/certificates', {pageTitle: 'Giấy chứng nhận công ty', section: 'certificates', items, flash: flashText(req.query.msg)});
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
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await CertificateService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/certificates?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await CertificateService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/certificates?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
