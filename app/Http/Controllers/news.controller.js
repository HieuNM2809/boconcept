const NewsService = require('../../Services/Api/news.service');
const richtext = require('../../Helpers/richtext.helper');
const {logger} = require('../../../config/log4js');

const toPlain = (rows) => rows.map((r) => (r && typeof r.get === 'function' ? r.get({plain: true}) : r));

// Danh sách số trang có rút gọn bằng dấu "…" (giống catalog.controller)
function buildPageList(cur, last) {
    const out = [];
    for (let p = 1; p <= last; p++) {
        if (p === 1 || p === last || (p >= cur - 2 && p <= cur + 2)) out.push(p);
        else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
}

// GET /news — danh sách bài viết
async function index(req, res) {
    const t = res.locals.t;
    try {
        const result = await NewsService.getPaginated({page: req.query.page || 1, per_page: 9});
        const {current_page, last_page} = result.meta;

        res.render('news', {
            pageTitle: `${t.news.title} — ${t.common.brand}`,
            posts: toPlain(result.data),
            meta: result.meta,
            pages: buildPageList(current_page, last_page),
            linkFor: (page) => `/news?page=${page}`,
        });
    } catch (err) {
        logger.error('News list error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được trang tin tức. Kiểm tra kết nối MySQL.');
    }
}

// GET /news/:id — chi tiết bài viết
async function detail(req, res) {
    const t = res.locals.t;
    const id = parseInt(req.params.id, 10);

    const notFound = () => res.status(404).render('news-detail', {
        pageTitle: t.news.notFound,
        post: null, bodyHtml: '', related: [],
    });

    if (!Number.isInteger(id) || id < 1) return notFound();

    try {
        const found = await NewsService.getById(id);
        if (!found || !found.status) return notFound();
        const post = found.get ? found.get({plain: true}) : found;

        // Markdown rút gọn -> HTML. Escape trước, dựng lại thẻ sau (xem helper),
        // nên nội dung admin nhập KHÔNG thể chèn script vào trang.
        const bodyHtml = richtext.render(res.locals.pick(post, 'body'));

        // Bài khác để đọc tiếp — bỏ chính nó ra
        const others = toPlain(await NewsService.getActiveOrdered({limit: 4}))
            .filter((p) => p.id !== post.id)
            .slice(0, 3);

        res.render('news-detail', {
            pageTitle: `${res.locals.pick(post, 'title')} — ${t.common.brand}`,
            post,
            bodyHtml,
            related: others,
        });
    } catch (err) {
        logger.error('News detail error', {error: {message: err.message, stack: err.stack}});
        res.status(500).send('Không tải được bài viết. Kiểm tra kết nối MySQL.');
    }
}

module.exports = {index, detail};
