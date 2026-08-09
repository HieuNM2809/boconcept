/**
 * Bơm dữ liệu SEO dùng chung vào res.locals.seo cho MỌI request (partials/head.ejs
 * đọc từ đây). Chạy SAU locale.middleware (cần res.locals.lang) — xem index.js.
 *
 * URL gốc: ưu tiên env SITE_URL (đáng tin nhất sau proxy/CDN); nếu không có thì
 * dựng từ request. Cần app.set('trust proxy', 1) để req.protocol ra 'https' khi
 * đứng sau proxy của Railway/dev tunnel — nếu không canonical/og:url sẽ ra http.
 */
module.exports = function seo(req, res, next) {
    const fromReq = `${req.protocol}://${req.get('host') || 'localhost'}`;
    const base = String(process.env.SITE_URL || fromReq).replace(/\/+$/, '');
    const path = String(req.originalUrl || '/').split('#')[0];
    const lang = res.locals.lang || 'vi';

    // Link hreflang: giữ nguyên query khác, chỉ ép ?lang=<l>.
    const urlForLang = (l) => {
        try {
            const params = new URLSearchParams();
            Object.keys(req.query || {}).forEach((k) => {
                if (k === 'lang') return;
                const v = req.query[k];
                if (typeof v === 'string') params.set(k, v);
            });
            params.set('lang', l);
            const qs = params.toString();
            return base + req.path + (qs ? `?${qs}` : '');
        } catch (_) {
            return `${base}${req.path}?lang=${l}`;
        }
    };

    res.locals.seo = {
        siteUrl: base,
        canonical: base + path,
        defaultImage: `${base}/static/images/logo.png`,
        urlForLang,
        locale: lang === 'en' ? 'en_US' : 'vi_VN',
        altLocale: lang === 'en' ? 'vi_VN' : 'en_US',
        // Khu quản trị + health không được lập chỉ mục.
        noindex: req.path.startsWith('/admin') || req.path === '/health' || req.path === '/web/health',
        isHome: req.path === '/',
    };
    next();
};
