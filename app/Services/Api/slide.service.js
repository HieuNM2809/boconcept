const {Slide} = require('../../Models/index.model');

class SlideService {
    // Cho trang chủ: chỉ slide đang bật, theo thứ tự
    static async getActiveOrdered() {
        return Slide.findAll({where: {status: 1}, order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    // Cho admin: tất cả
    static async getAll() {
        return Slide.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return Slide.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            title_vi: str(d.title_vi),
            title_en: str(d.title_en),
            badge_vi: str(d.badge_vi),
            badge_en: str(d.badge_en),
            link: str(d.link),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static async create(d) {
        const n = SlideService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh (image) là bắt buộc'), {status: 400});
        return Slide.create(n);
    }

    static async update(id, d) {
        const s = await Slide.findByPk(id);
        if (!s) throw Object.assign(new Error('Slide not found'), {status: 404});
        const n = SlideService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh (image) là bắt buộc'), {status: 400});
        return s.update(n);
    }

    static async delete(id) {
        const s = await Slide.findByPk(id);
        if (!s) throw Object.assign(new Error('Slide not found'), {status: 404});
        await s.destroy();
    }
}

module.exports = SlideService;
