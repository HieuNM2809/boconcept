const NewsService = require('../../Services/Api/news.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm bài viết.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

async function index(req, res) {
    const items = toPlain(await NewsService.getAll());
    res.render('admin/news', {pageTitle: 'Tin tức', section: 'news', items, flash: flashText(req.query.msg)});
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const n = await NewsService.getById(parseInt(req.params.id, 10));
        if (!n) return res.redirect('/admin/news?msg=notfound');
        item = n.get({plain: true});
    }
    res.render('admin/news-form', {
        pageTitle: item ? 'Sửa bài viết' : 'Thêm bài viết',
        section: 'news', item,
        action: item ? `/admin/news/${item.id}` : '/admin/news',
    });
}

async function create(req, res) {
    try { await NewsService.create(req.body); res.redirect('/admin/news?msg=created'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await NewsService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/news?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await NewsService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/news?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
