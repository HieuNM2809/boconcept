const ProductService = require('../../Services/Api/product.service');
const CategoryService = require('../../Services/Api/category.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm sản phẩm.', updated: 'Đã cập nhật.', deleted: 'Đã xóa.', notfound: 'Không tìm thấy.'}[k] || '');

function normalize(b = {}) {
    const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
    return {
        category_id: b.category_id ? parseInt(b.category_id, 10) : null,
        name_vi: (b.name_vi || '').trim(),
        name_en: str(b.name_en),
        slug: str(b.slug),
        description_vi: str(b.description_vi),
        description_en: str(b.description_en),
        price: parseFloat(b.price) || 0,
        thumbnail: str(b.thumbnail),
        is_featured: String(b.is_featured) === '1' ? 1 : 0,
        priority: parseInt(b.priority, 10) || 0,
        status: String(b.status) === '0' ? 0 : 1,
    };
}

async function index(req, res) {
    const result = await ProductService.getAll({per_page: 100, status: ''}); // '' = mọi trạng thái
    res.render('admin/products', {pageTitle: 'Sản phẩm', section: 'products', items: toPlain(result.data), meta: result.meta, flash: flashText(req.query.msg)});
}

async function form(req, res) {
    const categories = toPlain(await CategoryService.getAll());
    let item = null;
    if (req.params.id) {
        const p = await ProductService.getById(parseInt(req.params.id, 10));
        if (!p) return res.redirect('/admin/products?msg=notfound');
        item = p.get ? p.get({plain: true}) : p;
    }
    res.render('admin/product-form', {
        pageTitle: item ? 'Sửa sản phẩm' : 'Thêm sản phẩm',
        section: 'products', item, categories,
        action: item ? `/admin/products/${item.id}` : '/admin/products',
    });
}

async function create(req, res) {
    try {
        const data = normalize(req.body);
        if (!data.name_vi) throw Object.assign(new Error('Tên (VI) là bắt buộc'), {status: 400});
        await ProductService.create(data);
        res.redirect('/admin/products?msg=created');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try {
        const data = normalize(req.body);
        if (!data.name_vi) throw Object.assign(new Error('Tên (VI) là bắt buộc'), {status: 400});
        await ProductService.update(parseInt(req.params.id, 10), data);
        res.redirect('/admin/products?msg=updated');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try {
        await ProductService.delete(parseInt(req.params.id, 10));
        res.redirect('/admin/products?msg=deleted');
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy};
