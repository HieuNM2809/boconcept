const UserService = require('../../Services/Api/user.service');
const {backWithError} = require('../../Helpers/adminFlash.helper');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({created: 'Đã thêm tài khoản.', updated: 'Đã cập nhật.', deleted: 'Đã xoá tài khoản.', notfound: 'Không tìm thấy.'}[k] || '');

function readFilters(q = {}) {
    const str = (v) => (v == null ? '' : String(v).trim());
    const oneOf = (v, allowed) => (allowed.includes(str(v)) ? str(v) : '');
    return {
        q: str(q.q),
        role: oneOf(q.role, ['admin', 'staff']),
        status: oneOf(q.status, ['0', '1']),
        page: Math.max(parseInt(q.page, 10) || 1, 1),
    };
}

async function index(req, res) {
    const filters = readFilters(req.query);
    const result = await UserService.getAll(filters);
    res.render('admin/users', {
        pageTitle: 'Nhân viên',
        section: 'staff',
        items: toPlain(result.data),
        meta: result.meta,
        filters,
        flash: flashText(req.query.msg),
    });
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const u = await UserService.getById(parseInt(req.params.id, 10));
        if (!u) return res.redirect('/admin/staff?msg=notfound');
        item = u.get ? u.get({plain: true}) : u;
    }
    res.render('admin/user-form', {
        pageTitle: item ? 'Sửa tài khoản' : 'Thêm tài khoản',
        section: 'staff',
        item,
        action: item ? `/admin/staff/${item.id}` : '/admin/staff',
    });
}

async function create(req, res) {
    try {
        await UserService.create(req.body);
        res.redirect('/admin/staff?msg=created');
    } catch (e) { backWithError(req, res, '/admin/staff', e); }
}

async function update(req, res) {
    try {
        await UserService.update(parseInt(req.params.id, 10), req.body, {currentUserId: req.adminUser.id});
        res.redirect('/admin/staff?msg=updated');
    } catch (e) { backWithError(req, res, '/admin/staff', e); }
}

async function destroy(req, res) {
    try {
        await UserService.delete(parseInt(req.params.id, 10), {currentUserId: req.adminUser.id});
        res.redirect('/admin/staff?msg=deleted');
    } catch (e) { backWithError(req, res, '/admin/staff', e); }
}

module.exports = {index, form, create, update, destroy};
