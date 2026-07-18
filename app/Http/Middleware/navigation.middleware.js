const NodeCache = require('node-cache');
const CategoryService = require('../../Services/Api/category.service');
const menuLinks = require('../../../config/menu');
const {logger} = require('../../../config/log4js');

// TTL 60s: danh mục đổi rất ít, nhưng admin sửa xong phải thấy ngay -> có invalidate() ở dưới.
const cache = new NodeCache({stdTTL: 60, checkperiod: 120, useClones: false});
const KEY = 'nav:categories';

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

/**
 * Lấy danh mục cho header (đã cache).
 * Dùng getAll dạng PHẲNG rồi tự lọc gốc bằng `parent_id === null`.
 * KHÔNG dùng tree=true: ở chế độ cây, danh mục con có cha đang ẩn (status=0) bị đẩy
 * lên thành gốc (category.service.js:30) -> lọt vào menu như một danh mục cấp 1.
 */
async function loadNav() {
    const hit = cache.get(KEY);
    if (hit) return hit;

    const all = toPlain(await CategoryService.getAll({status: 1}));
    const roots = all.filter((c) => c.parent_id === null || c.parent_id === undefined);
    const childrenOf = new Map();
    for (const c of all) {
        if (c.parent_id == null) continue;
        if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
        childrenOf.get(c.parent_id).push(c);
    }
    // Chỉ giữ con có cha thật sự hiển thị -> con mồ côi bị bỏ, không leo lên cấp 1.
    const nav = roots.map((r) => ({...r, children: childrenOf.get(r.id) || []}));

    cache.set(KEY, nav);
    return nav;
}

/**
 * Bơm dữ liệu điều hướng vào res.locals cho MỌI trang web (header là partial dùng chung).
 *
 * HỢP ĐỒNG QUAN TRỌNG: middleware này KHÔNG BAO GIỜ được throw.
 * header.ejs được render từ 8 chỗ, trong đó có 4 nhánh 404 với locals tối thiểu
 * (catalog.controller.js:34,44,98,107). Một lỗi ở đây sẽ bị express-async-errors
 * đẩy vào error handler JSON (index.middleware.js) và biến MỌI trang HTML thành JSON.
 * Vì vậy: lỗi -> log, đặt mảng rỗng, vẫn next().
 */
module.exports = async function navigation(req, res, next) {
    // /admin có thanh nav riêng (views/admin/_nav.ejs), /health trả JSON -> không cần query.
    if (req.path.startsWith('/admin') || req.path === '/health' || req.path === '/web/health') {
        return next();
    }

    // Ô tìm kiếm trên header echo lại từ khóa hiện tại. Phải lấy từ res.locals,
    // KHÔNG được đọc local của trang (vd `filters.q`) — nhánh 404 của product.ejs
    // không truyền `filters`, EJS sẽ ném ReferenceError và 500 cả trang.
    res.locals.searchQuery = String(req.query.q ?? '').trim();
    res.locals.menuLinks = menuLinks; // nhóm link phụ trong drawer (tĩnh)

    try {
        res.locals.navCategories = await loadNav();
    } catch (err) {
        logger.error('Navigation middleware error', {error: {message: err.message, stack: err.stack}});
        res.locals.navCategories = []; // degrade: header vẫn render, chỉ trống menu
    }
    next();
};

// Admin CRUD danh mục là NGUỒN GHI DUY NHẤT -> gọi hàm này sau create/update/destroy.
module.exports.invalidate = () => cache.del(KEY);
