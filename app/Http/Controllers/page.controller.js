const PageService = require('../../Services/Api/page.service');
const richtext = require('../../Helpers/richtext.helper');
const {logger} = require('../../../config/log4js');

/** Render một trang tĩnh theo slug. Dùng cho /about và /pages/:slug. */
async function showSlug(slug, req, res) {
    const t = res.locals.t;

    const notFound = () => res.status(404).render('page', {
        pageTitle: t.page.notFound,
        page: null, bodyHtml: '',
    });

    try {
        const found = await PageService.getBySlug(slug);
        if (!found) return notFound();
        const page = found.get ? found.get({plain: true}) : found;

        // Markdown rút gọn -> HTML. Helper escape toàn bộ trước rồi mới dựng thẻ,
        // nên nội dung admin nhập không thể chèn script.
        const bodyHtml = richtext.render(res.locals.pick(page, 'body'));

        res.render('page', {
            pageTitle: `${res.locals.pick(page, 'title')} — ${t.common.brand}`,
            page,
            bodyHtml,
        });
    } catch (err) {
        logger.error('Page render error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang. Kiểm tra kết nối MySQL.');
    }
}

// GET /about — giới thiệu công ty
const about = (req, res) => showSlug('about', req, res);

// GET /pages/:slug — các trang tĩnh khác admin tự tạo
const bySlug = (req, res) => showSlug(req.params.slug, req, res);

module.exports = {about, bySlug};
