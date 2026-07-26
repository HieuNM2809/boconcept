const SettingService = require('../../Services/Api/setting.service');
const {trans} = require('../../../resources/lang');
const {backWithError} = require('../../Helpers/adminFlash.helper');

// Màn này quản đúng HAI khoá trong bảng `settings` (VI + EN) của dòng slogan đè
// lên slideshow. Không theo contract crudRoutes: không có :id, không thêm/xoá —
// giống /admin/pages và /admin/gallery.
const {HERO_SLOGAN_VI, HERO_SLOGAN_EN} = SettingService.KEYS;

const flashText = (k) => ({updated: 'Đã cập nhật slogan.'}[k] || '');

async function form(req, res) {
    const values = await SettingService.getMany([HERO_SLOGAN_VI, HERO_SLOGAN_EN]);
    res.render('admin/slogan-form', {
        pageTitle: 'Slogan slideshow',
        section: 'slogan',
        // Chưa có hàng trong DB -> null -> ô để trống, và trang chủ vẫn hiện chữ
        // mặc định trong resources/lang. Cố ý KHÔNG điền sẵn chữ mặc định vào ô:
        // làm vậy thì lần lưu đầu tiên sẽ "đóng băng" nó vào DB, và người dùng
        // không còn cách nào quay về mặc định ngoài việc tự xoá tay.
        sloganVi: values[HERO_SLOGAN_VI] || '',
        sloganEn: values[HERO_SLOGAN_EN] || '',
        // Chữ mặc định hiện dạng gợi ý (placeholder) để biết đang thay thế cái gì.
        // Lấy thẳng từ resources/lang theo TỪNG ngôn ngữ, không dùng res.locals.t:
        // bộ dịch đó theo ngôn ngữ admin đang xem, nên ô EN sẽ gợi ý chữ VI khi
        // admin đang mở bản tiếng Việt.
        defaultVi: trans('vi').home.hero.brand,
        defaultEn: trans('en').home.hero.brand,
        action: '/admin/slogan',
        flash: flashText(req.query.msg),
    });
}

async function update(req, res) {
    try {
        // setMany -> set(): chuỗi rỗng được ghi thành NULL, nên xoá trắng ô là
        // trở về chữ mặc định trong resources/lang chứ không phải hero mất chữ.
        await SettingService.setMany({
            [HERO_SLOGAN_VI]: req.body.slogan_vi,
            [HERO_SLOGAN_EN]: req.body.slogan_en,
        });
        res.redirect('/admin/slogan?msg=updated');
    } catch (e) {
        backWithError(req, res, '/admin/slogan', e);
    }
}

module.exports = {form, update};
