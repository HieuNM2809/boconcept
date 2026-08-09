const {Category, Product, News, Page} = require('../../Models/index.model');
const {logger} = require('../../../config/log4js');

const baseUrl = (req, res) => (res.locals.seo && res.locals.seo.siteUrl)
    || `${req.protocol}://${req.get('host')}`;

function xmlEscape(s) {
    return String(s == null ? '' : s).replace(/[&<>'"]/g, (c) => (
        {'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;'}[c]));
}
function iso(d) { try { return new Date(d).toISOString(); } catch (_) { return null; } }

// GET /sitemap.xml — dựng từ DB (danh mục, sản phẩm, tin tức, trang) + trang tĩnh.
// Chỉ lấy bản ghi status=1 (sản phẩm/danh mục còn tự loại soft-delete nhờ paranoid).
async function sitemap(req, res) {
    const base = baseUrl(req, res);
    const urls = [];
    const add = (loc, lastmod, changefreq, priority) =>
        urls.push({loc: base + loc, lastmod, changefreq, priority});

    add('/', null, 'daily', '1.0');
    add('/products', null, 'daily', '0.9');
    add('/news', null, 'weekly', '0.6');
    add('/about', null, 'monthly', '0.5');

    try {
        const [cats, prods, news, pages] = await Promise.all([
            Category.findAll({where: {status: 1}, attributes: ['id', 'updated_at']}),
            Product.findAll({where: {status: 1}, attributes: ['id', 'updated_at']}),
            News.findAll({where: {status: 1}, attributes: ['id', 'updated_at']}),
            Page.findAll({where: {status: 1}, attributes: ['slug', 'updated_at']}),
        ]);
        cats.forEach((c) => add(`/categories/${c.id}`, iso(c.updated_at), 'weekly', '0.7'));
        prods.forEach((p) => add(`/products/${p.id}`, iso(p.updated_at), 'weekly', '0.8'));
        news.forEach((n) => add(`/news/${n.id}`, iso(n.updated_at), 'monthly', '0.5'));
        // /about đã thêm ở trên -> tránh trùng.
        pages.forEach((pg) => { if (pg.slug !== 'about') add(`/pages/${pg.slug}`, iso(pg.updated_at), 'monthly', '0.4'); });
    } catch (err) {
        // DB trục trặc: vẫn trả sitemap các URL tĩnh thay vì 500.
        logger.error('Sitemap DB error', {error: {message: err.message}});
    }

    const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls.map((u) => '  <url><loc>' + xmlEscape(u.loc) + '</loc>'
            + (u.lastmod ? '<lastmod>' + u.lastmod + '</lastmod>' : '')
            + (u.changefreq ? '<changefreq>' + u.changefreq + '</changefreq>' : '')
            + (u.priority ? '<priority>' + u.priority + '</priority>' : '')
            + '</url>').join('\n')
        + '\n</urlset>\n';

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(body);
}

// GET /robots.txt — cho bọ index toàn site trừ khu quản trị + API; trỏ tới sitemap.
function robots(req, res) {
    const base = baseUrl(req, res);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send([
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /api',
        '',
        'Sitemap: ' + base + '/sitemap.xml',
        '',
    ].join('\n'));
}

module.exports = {sitemap, robots};
