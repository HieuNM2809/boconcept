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

// Bộ lọc màn danh sách — cùng quy ước với admin.product.controller: '' = KHÔNG
// lọc theo trường đó, và `status` mặc định '' (không phải 1) vì admin cần thấy
// cả loại đang ẩn.
const PER_PAGE_CHOICES = [20, 50, 100];

function readFilters(q = {}) {
    const str = (v) => (v == null ? '' : String(v).trim());
    const oneOf = (v, allowed, fallback) => (allowed.includes(str(v)) ? str(v) : fallback);
    const perPage = parseInt(q.per_page, 10);
    return {
        q: str(q.q),
        // 'root' = chỉ danh mục gốc; ngoài ra chỉ nhận id dương
        parent_id: str(q.parent_id) === 'root' ? 'root'
            : (/^[1-9][0-9]*$/.test(str(q.parent_id)) ? str(q.parent_id) : ''),
        status: oneOf(q.status, ['0', '1'], ''),
        is_featured: oneOf(q.is_featured, ['0', '1'], ''),
        sort: oneOf(q.sort, ['oldest', 'newest', 'sort_order', 'name_asc', 'name_desc'], 'oldest'),
        per_page: PER_PAGE_CHOICES.includes(perPage) ? perPage : PER_PAGE_CHOICES[0],
        page: Math.max(parseInt(q.page, 10) || 1, 1),
    };
}

async function index(req, res) {
    const filters = readFilters(req.query);
    // Vẫn nạp TOÀN BỘ danh mục song song: cần cho ô chọn "Danh mục cha" của bộ
    // lọc và để tra tên cha của những hàng có cha nằm ngoài trang hiện tại.
    const [result, all] = await Promise.all([
        CategoryService.getPaged(filters),
        CategoryService.getAll(),
    ]);
    const allCats = toPlain(all);
    const nameById = new Map(allCats.map((c) => [c.id, c.name_vi]));
    const items = toPlain(result.data);
    items.forEach((c) => { c.parent_name = c.parent_id ? (nameById.get(c.parent_id) || '') : ''; });
    res.render('admin/categories', {
        pageTitle: 'Loại sản phẩm',
        section: 'categories',
        items,
        meta: result.meta,
        categories: allCats,
        filters,
        flash: flashText(req.query.msg),
    });
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
