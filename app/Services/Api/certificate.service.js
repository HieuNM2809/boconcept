const {Certificate} = require('../../Models/index.model');

class CertificateService {
    static async getActiveOrdered() {
        return Certificate.findAll({where: {status: 1}, order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getAll() {
        return Certificate.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return Certificate.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            title_vi: str(d.title_vi),
            title_en: str(d.title_en),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static async create(d) {
        const n = CertificateService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh (image) là bắt buộc'), {status: 400});
        return Certificate.create(n);
    }

    static async update(id, d) {
        const c = await Certificate.findByPk(id);
        if (!c) throw Object.assign(new Error('Certificate not found'), {status: 404});
        const n = CertificateService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh (image) là bắt buộc'), {status: 400});
        return c.update(n);
    }

    static async delete(id) {
        const c = await Certificate.findByPk(id);
        if (!c) throw Object.assign(new Error('Certificate not found'), {status: 404});
        await c.destroy();
    }
}

module.exports = CertificateService;
