const sequelize = require('../../../lib/database');
const {News} = require('../../Models/index.model');

class NewsService {
    static async getActiveOrdered({limit = 4} = {}) {
        return News.findAll({
            where: {status: 1},
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            limit: Math.min(Math.max(parseInt(limit, 10) || 4, 1), 20),
        });
    }

    /** Trang tin tức: bài mới nhất trước, phân trang. */
    static async getPaginated({page = 1, per_page = 9} = {}) {
        const _page = Math.max(parseInt(page, 10) || 1, 1);
        const _perPage = Math.min(Math.max(parseInt(per_page, 10) || 9, 1), 48);
        const {rows, count} = await News.findAndCountAll({
            where: {status: 1},
            // Bài chưa đặt ngày (published_at NULL) xuống cuối thay vì lên đầu:
            // MySQL xếp NULL trước khi DESC, khiến bài chưa có ngày chiếm trang 1.
            order: [
                [sequelize.literal('`published_at` IS NULL'), 'ASC'],
                ['published_at', 'DESC'],
                ['id', 'DESC'],
            ],
            limit: _perPage,
            offset: (_page - 1) * _perPage,
        });
        return {
            data: rows,
            meta: {
                total: count,
                per_page: _perPage,
                current_page: _page,
                last_page: Math.max(Math.ceil(count / _perPage), 1),
            },
        };
    }

    static async getAll() {
        return News.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return News.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            title_vi: (d.title_vi || '').trim(),
            title_en: str(d.title_en),
            excerpt_vi: str(d.excerpt_vi),
            excerpt_en: str(d.excerpt_en),
            body_vi: str(d.body_vi),
            body_en: str(d.body_en),
            author: str(d.author),
            // Ô trống -> null chứ không Invalid Date (Sequelize sẽ ném lỗi khó hiểu)
            published_at: d.published_at ? new Date(d.published_at) : null,
            cta_vi: str(d.cta_vi),
            cta_en: str(d.cta_en),
            link: str(d.link),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static _validate(n) {
        if (!n.image) throw Object.assign(new Error('Ảnh là bắt buộc'), {status: 400});
        if (!n.title_vi) throw Object.assign(new Error('Tiêu đề (VI) là bắt buộc'), {status: 400});
    }

    static async create(d) {
        const n = NewsService._normalize(d);
        NewsService._validate(n);
        return News.create(n);
    }

    static async update(id, d) {
        const row = await News.findByPk(id);
        if (!row) throw Object.assign(new Error('News not found'), {status: 404});
        const n = NewsService._normalize(d);
        NewsService._validate(n);
        return row.update(n);
    }

    static async delete(id) {
        const row = await News.findByPk(id);
        if (!row) throw Object.assign(new Error('News not found'), {status: 404});
        await row.destroy();
    }
}

module.exports = NewsService;
