const {Feature} = require('../../Models/index.model');

const MAX_ITEMS = 4; // spec: dải Công năng hiển thị tối đa 4 mục

class FeatureService {
    static async getActiveOrdered() {
        return Feature.findAll({
            where: {status: 1},
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            limit: MAX_ITEMS,
        });
    }

    static async getAll() {
        return Feature.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return Feature.findByPk(id);
    }

    static async countActive() {
        return Feature.count({where: {status: 1}});
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            icon: (d.icon || '').trim(),
            title_vi: (d.title_vi || '').trim(),
            title_en: str(d.title_en),
            description_vi: str(d.description_vi),
            description_en: str(d.description_en),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static _validate(n) {
        if (!n.icon) throw Object.assign(new Error('Icon là bắt buộc'), {status: 400});
        if (!n.title_vi) throw Object.assign(new Error('Tiêu đề (VI) là bắt buộc'), {status: 400});
    }

    static async create(d) {
        const n = FeatureService._normalize(d);
        FeatureService._validate(n);
        // Chặn NGAY LÚC TẠO chứ không cắt lúc đọc: nếu chỉ slice(0,4) khi render thì
        // admin thấy 5 dòng "Hiện" mà mục thứ 5 không bao giờ lên site, không hiểu vì sao.
        if (n.status === 1 && (await FeatureService.countActive()) >= MAX_ITEMS) {
            throw Object.assign(
                new Error(`Tối đa ${MAX_ITEMS} mục đang hiện. Hãy ẩn bớt một mục trước khi thêm.`),
                {status: 400},
            );
        }
        return Feature.create(n);
    }

    static async update(id, d) {
        const f = await Feature.findByPk(id);
        if (!f) throw Object.assign(new Error('Feature not found'), {status: 404});
        const n = FeatureService._normalize(d);
        FeatureService._validate(n);
        // Chỉ chặn khi đang chuyển từ ẩn -> hiện (sửa mục vốn đã hiện thì không tính lại).
        if (n.status === 1 && f.status === 0 && (await FeatureService.countActive()) >= MAX_ITEMS) {
            throw Object.assign(
                new Error(`Tối đa ${MAX_ITEMS} mục đang hiện. Hãy ẩn bớt một mục trước.`),
                {status: 400},
            );
        }
        return f.update(n);
    }

    static async delete(id) {
        const f = await Feature.findByPk(id);
        if (!f) throw Object.assign(new Error('Feature not found'), {status: 404});
        await f.destroy();
    }
}

FeatureService.MAX_ITEMS = MAX_ITEMS;

module.exports = FeatureService;
