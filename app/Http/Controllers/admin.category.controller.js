const CategoryService = require('../../Services/Api/category.service');
const navigation = require('../Middleware/navigation.middleware');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm loại sản phẩm.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

function normalize(b = {}) {
    const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
    return {
        name_vi: (b.name_vi || '').trim(),
        name_en: str(b.name_en),
        title_vi: str(b.title_vi),
        title_en: str(b.title_en),
        description_vi: str(b.description_vi),
        description_en: str(b.description_en),
        slug: str(b.slug),
        image: str(b.image),
        parent_id: b.parent_id ? parseInt(b.parent_id, 10) : null,
        sort_order: parseInt(b.sort_order, 10) || 0,
        is_featured: String(b.is_featured) === '1' ? 1 : 0,
        status: String(b.status) === '0' ? 0 : 1,
    };
}

async function index(req, res) {
    const cats = toPlain(await CategoryService.getAll());
    const nameById = new Map(cats.map((c) => [c.id, c.name_vi]));
    cats.forEach((c) => { c.parent_name = c.parent_id ? (nameById.get(c.parent_id) || '') : ''; });
    res.render('admin/categories', {pageTitle: 'Loại sản phẩm', section: 'categories', items: cats, flash: flashText(req.query.msg)});
}

async function form(req, res) {
    const cats = toPlain(await CategoryService.getAll());
    let item = null;
    if (req.params.id) {
        const c = await CategoryService.getById(parseInt(req.params.id, 10));
        if (!c) return res.redirect('/admin/categories?msg=notfound');
        item = c.get ? c.get({plain: true}) : c;
    }
    // Không cho chọn chính nó làm cha
    const parents = cats.filter((c) => !item || c.id !== item.id);
    res.render('admin/category-form', {
        pageTitle: item ? 'Sửa loại sản phẩm' : 'Thêm loại sản phẩm',
        section: 'categories', item, parents,
        action: item ? `/admin/categories/${item.id}` : '/admin/categories',
    });
}

async function create(req, res) {
    try {
        const data = normalize(req.body);
        if (!data.name_vi) throw Object.assign(new Error('Tên (VI) là bắt buộc'), {status: 400});
        await CategoryService.create(data);
        navigation.invalidate(); // menu header phải thấy ngay, không đợi hết TTL
        res.redirect('/admin/categories?msg=created');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try {
        const data = normalize(req.body);
        if (!data.name_vi) throw Object.assign(new Error('Tên (VI) là bắt buộc'), {status: 400});
        await CategoryService.update(parseInt(req.params.id, 10), data);
        navigation.invalidate();
        res.redirect('/admin/categories?msg=updated');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try {
        await CategoryService.delete(parseInt(req.params.id, 10));
        navigation.invalidate();
        res.redirect('/admin/categories?msg=deleted');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
