const FeatureService = require('../../Services/Api/feature.service');
const SettingService = require('../../Services/Api/setting.service');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));
const flashText = (k) => ({
    created: 'Đã thêm mục công năng.',
    updated: 'Đã cập nhật.',
    deleted: 'Đã xóa.',
    notfound: 'Không tìm thấy.',
    shown: 'Đã BẬT khối Công năng trên trang chủ.',
    hidden: 'Đã TẮT khối Công năng trên trang chủ.',
}[k] || '');

async function index(req, res) {
    const [items, blockEnabled] = await Promise.all([
        FeatureService.getAll().then(toPlain),
        SettingService.getBool(SettingService.KEYS.FEATURES_BLOCK),
    ]);
    res.render('admin/features', {
        pageTitle: 'Khối Công năng',
        section: 'features',
        items,
        blockEnabled,
        maxItems: FeatureService.MAX_ITEMS,
        activeCount: items.filter((i) => i.status).length,
        flash: flashText(req.query.msg),
    });
}

async function form(req, res) {
    let item = null;
    if (req.params.id) {
        const f = await FeatureService.getById(parseInt(req.params.id, 10));
        if (!f) return res.redirect('/admin/features?msg=notfound');
        item = f.get({plain: true});
    }
    res.render('admin/feature-form', {
        pageTitle: item ? 'Sửa mục công năng' : 'Thêm mục công năng',
        section: 'features', item,
        action: item ? `/admin/features/${item.id}` : '/admin/features',
    });
}

async function create(req, res) {
    try { await FeatureService.create(req.body); res.redirect('/admin/features?msg=created'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function update(req, res) {
    try { await FeatureService.update(parseInt(req.params.id, 10), req.body); res.redirect('/admin/features?msg=updated'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

async function destroy(req, res) {
    try { await FeatureService.delete(parseInt(req.params.id, 10)); res.redirect('/admin/features?msg=deleted'); }
    catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

// Công tắc bật/tắt CẢ KHỐI — độc lập với trạng thái ẩn/hiện của từng mục,
// nên tắt rồi bật lại vẫn giữ nguyên mục nào đang ẩn.
async function toggleBlock(req, res) {
    try {
        const on = String(req.body.enabled) === '1';
        await SettingService.setBool(SettingService.KEYS.FEATURES_BLOCK, on);
        res.redirect(`/admin/features?msg=${on ? 'shown' : 'hidden'}`);
    } catch (e) { res.status(e.status || 400).send('Lỗi: ' + e.message); }
}

module.exports = {index, form, create, update, destroy, toggleBlock};
