const {Partner} = require('../../Models/index.model');

class PartnerService {
    static async getActiveOrdered() {
        return Partner.findAll({where: {status: 1}, order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getAll() {
        return Partner.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return Partner.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            name: (d.name || '').trim(),
            logo: str(d.logo),
            link: str(d.link),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static async create(d) {
        const n = PartnerService._normalize(d);
        if (!n.name) throw Object.assign(new Error('Tên đối tác là bắt buộc'), {status: 400});
        return Partner.create(n);
    }

    static async update(id, d) {
        const p = await Partner.findByPk(id);
        if (!p) throw Object.assign(new Error('Partner not found'), {status: 404});
        const n = PartnerService._normalize(d);
        if (!n.name) throw Object.assign(new Error('Tên đối tác là bắt buộc'), {status: 400});
        return p.update(n);
    }

    static async delete(id) {
        const p = await Partner.findByPk(id);
        if (!p) throw Object.assign(new Error('Partner not found'), {status: 404});
        await p.destroy();
    }
}

module.exports = PartnerService;
