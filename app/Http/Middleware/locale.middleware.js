const {resolveLang, trans} = require('../../../resources/lang');

function readCookie(req, name) {
    const raw = req.headers.cookie || '';
    const m = raw.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Gắn ngôn ngữ + bộ dịch vào res.locals cho MỌI request (áp dụng toàn bộ pages).
 * Thứ tự ưu tiên: ?lang= (người dùng chọn) > cookie > Accept-Language > mặc định.
 * Khi chọn qua ?lang=, lưu cookie để giữ ngôn ngữ khi chuyển trang.
 */
module.exports = function locale(req, res, next) {
    const source = req.query.lang || readCookie(req, 'lang') || req.headers['accept-language'];
    const lang = resolveLang(source);

    if (req.query.lang) {
        res.cookie('lang', lang, {maxAge: 365 * 24 * 60 * 60 * 1000, sameSite: 'lax'});
    }

    req.lang = lang;
    res.locals.lang = lang;
    res.locals.altLang = lang === 'en' ? 'vi' : 'en';
    res.locals.t = trans(lang); // { common, home, messages, ... }
    res.locals.pick = (o, field) => (o && (o[`${field}_${lang}`] || o[`${field}_vi`])) || '';
    res.locals.money = (v) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;

    next();
};
