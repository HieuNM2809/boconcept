const {Gallery} = require('../../Models/index.model');

const MAX_ITEMS = 8; // spec: admin cấu hình từ 1 đến 8 ảnh cho khu vực này

class GalleryService {
    static async getActiveOrdered() {
        return Gallery.findAll({
            where: {status: 1},
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            limit: MAX_ITEMS,
        });
    }

    static async getAll() {
        return Gallery.findAll({order: [['sort_order', 'ASC'], ['id', 'ASC']]});
    }

    static async getById(id) {
        return Gallery.findByPk(id);
    }

    static async countActive() {
        return Gallery.count({where: {status: 1}});
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            alt_vi: str(d.alt_vi),
            alt_en: str(d.alt_en),
            sort_order: parseInt(d.sort_order, 10) || 0,
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static async create(d) {
        const n = GalleryService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh là bắt buộc'), {status: 400});
        // Chặn lúc TẠO chứ không cắt lúc đọc: cắt lúc đọc thì admin thấy 9 dòng
        // "Hiện" mà ảnh thứ 9 không bao giờ lên site, không hiểu vì sao.
        if (n.status === 1 && (await GalleryService.countActive()) >= MAX_ITEMS) {
            throw Object.assign(
                new Error(`Tối đa ${MAX_ITEMS} ảnh đang hiện. Hãy ẩn bớt một ảnh trước khi thêm.`),
                {status: 400},
            );
        }
        return Gallery.create(n);
    }

    static async update(id, d) {
        const row = await Gallery.findByPk(id);
        if (!row) throw Object.assign(new Error('Gallery item not found'), {status: 404});
        const n = GalleryService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh là bắt buộc'), {status: 400});
        // Chỉ tính lại khi chuyển ẩn -> hiện; sửa ảnh vốn đã hiện thì không chặn.
        if (n.status === 1 && row.status === 0 && (await GalleryService.countActive()) >= MAX_ITEMS) {
            throw Object.assign(
                new Error(`Tối đa ${MAX_ITEMS} ảnh đang hiện. Hãy ẩn bớt một ảnh trước.`),
                {status: 400},
            );
        }
        return row.update(n);
    }

    static async delete(id) {
        const row = await Gallery.findByPk(id);
        if (!row) throw Object.assign(new Error('Gallery item not found'), {status: 404});
        await row.destroy();
    }
}

GalleryService.MAX_ITEMS = MAX_ITEMS;

module.exports = GalleryService;
