const SettingService = require('../../Services/Api/setting.service');

const K = SettingService.KEYS;
const CAT_KEYS = [
    K.CAT_TITLE_VI, K.CAT_TITLE_EN, K.CAT_DESC_VI, K.CAT_DESC_EN,
    K.NEWS_TITLE_VI, K.NEWS_TITLE_EN, K.NEWS_DESC_VI, K.NEWS_DESC_EN,
    K.NEWS_CTA_VI, K.NEWS_CTA_EN, K.NEWS_CTA_LINK,
];

const flashText = (k) => ({saved: 'Đã lưu nội dung.'}[k] || '');

async function index(req, res) {
    const values = await SettingService.getMany(CAT_KEYS);
    res.render('admin/content', {
        pageTitle: 'Nội dung trang chủ',
        section: 'content',
        keys: K,
        values,
        flash: flashText(req.query.msg),
    });
}

async function save(req, res) {
    try {
        // Chỉ ghi đúng 4 khoá đã khai báo — không đổ thẳng req.body vào settings,
        // nếu không bất kỳ field nào người dùng thêm vào form cũng thành setting.
        const pairs = {};
        CAT_KEYS.forEach((k) => { pairs[k] = req.body[k]; });
        await SettingService.setMany(pairs);
        res.redirect('/admin/content?msg=saved');
    } catch (e) {
        res.status(e.status || 400).send('Lỗi: ' + e.message);
    }
}

module.exports = {index, save};
