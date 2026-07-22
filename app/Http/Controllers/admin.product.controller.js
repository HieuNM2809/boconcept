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
        extra_vi: str(b.extra_vi),
        extra_en: str(b.extra_en),
        shipping_vi: str(b.shipping_vi),
        shipping_en: str(b.shipping_en),
        price: parseFloat(b.price) || 0,
        material_vi: str(b.material_vi),
        material_en: str(b.material_en),
        color_vi: str(b.color_vi),
        color_en: str(b.color_en),
        dimensions_vi: str(b.dimensions_vi),
        dimensions_en: str(b.dimensions_en),
        // Ô trống -> null chứ không 0: 0kg là một giá trị hợp lệ nhưng vô nghĩa,
        // và nó sẽ lọt vào bộ lọc "khối lượng từ 0".
        weight: b.weight === '' || b.weight == null ? null : (parseFloat(b.weight) || null),
        thumbnail: str(b.thumbnail),
        is_featured: String(b.is_featured) === '1' ? 1 : 0,
        priority: parseInt(b.priority, 10) || 0,
        status: String(b.status) === '0' ? 0 : 1,
        // Form gửi tên `gallery[]`, nhưng express dùng qs (extended: true) nên nó
        // BỎ dấu ngoặc -> đọc ở `b.gallery`, không phải `b['gallery[]']`.
        // Một ô duy nhất cho ra CHUỖI chứ không phải mảng, phải bọc lại kẻo
        // Array.isArray sai và toàn bộ ảnh bị bỏ qua khi lưu.
        gallery: b.gallery == null
            ? undefined
            : (Array.isArray(b.gallery) ? b.gallery : [b.gallery]),
    };
}

// Bộ lọc màn danh sách. Giá trị '' = KHÔNG lọc theo trường đó; riêng `status`
// phải là '' mặc định (không phải 1) vì admin cần thấy cả sản phẩm đang ẩn —
// mặc định của service là status=1, để nguyên thì hàng ẩn biến mất khỏi màn quản trị.
const PER_PAGE_CHOICES = [20, 50, 100];

function readFilters(q = {}) {
    const str = (v) => (v == null ? '' : String(v).trim());
    const oneOf = (v, allowed, fallback) => (allowed.includes(str(v)) ? str(v) : fallback);
    const perPage = parseInt(q.per_page, 10);
    return {
        q: str(q.q),
        category_id: /^[1-9][0-9]*$/.test(str(q.category_id)) ? str(q.category_id) : '',
        status: oneOf(q.status, ['0', '1'], ''),
        is_featured: oneOf(q.is_featured, ['0', '1'], ''),
        // Số âm/chữ -> bỏ qua thay vì đẩy NaN xuống service (NaN vào WHERE là 0 hàng)
        min_price: Number.isFinite(parseFloat(q.min_price)) && parseFloat(q.min_price) >= 0 ? str(q.min_price) : '',
        max_price: Number.isFinite(parseFloat(q.max_price)) && parseFloat(q.max_price) >= 0 ? str(q.max_price) : '',
        material: str(q.material),
        sort: oneOf(q.sort, ['newest', 'oldest', 'price_asc', 'price_desc', 'priority'], 'newest'),
        per_page: PER_PAGE_CHOICES.includes(perPage) ? perPage : PER_PAGE_CHOICES[0],
        page: Math.max(parseInt(q.page, 10) || 1, 1),
    };
}

async function index(req, res) {
    const filters = readFilters(req.query);
    const [result, categories] = await Promise.all([
        ProductService.getAll(filters),
        CategoryService.getAll(),
    ]);
    res.render('admin/products', {
        pageTitle: 'Sản phẩm',
        section: 'products',
        items: toPlain(result.data),
        meta: result.meta,
        categories: toPlain(categories),
        filters,
        flash: flashText(req.query.msg),
    });
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
