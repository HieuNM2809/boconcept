const {Gallery} = require('../../Models/index.model');

// 3 khe cố định cho 3 ô lớn của lưới collage trang chủ (trái · giữa · phải).
const SLOTS = [1, 2, 3];

// Ảnh dự phòng khi khe chưa có hàng trong DB (database mới tinh, hoặc admin
// chưa chạy migration). Trang chủ vẫn phải ra đủ 3 ô chứ không được vỡ lưới.
const SLOT_FALLBACK = {
    1: {image: 'https://picsum.photos/seed/insp-sofa/900/700', alt_vi: 'Sofa ngoài trời bên hồ bơi', alt_en: 'Outdoor sofa by the pool'},
    2: {image: 'https://picsum.photos/seed/insp-dining/900/700', alt_vi: 'Bàn ăn ngoài trời view biển', alt_en: 'Outdoor dining with sea view'},
    3: {image: 'https://picsum.photos/seed/insp-garden/900/700', alt_vi: 'Góc vườn với chậu hoa', alt_en: 'Garden corner with planters'},
};

class GalleryService {
    static isValidSlot(slot) {
        return SLOTS.includes(parseInt(slot, 10));
    }

    static async getBySlot(slot) {
        return Gallery.findOne({where: {slot: parseInt(slot, 10)}});
    }

    /** 3 khe toàn ảnh dự phòng — dùng khi không đọc nổi DB. Đồng bộ, không throw. */
    static fallbackSlots() {
        return SLOTS.map((slot) => ({id: null, slot, ...SLOT_FALLBACK[slot]}));
    }

    /**
     * Luôn trả ĐÚNG 3 phần tử theo thứ tự khe 1,2,3 — khe nào chưa có hàng thì
     * lấp bằng SLOT_FALLBACK. Nhờ vậy view chỉ cần lặp, không phải kiểm tra rỗng.
     */
    static async getSlots() {
        const rows = await Gallery.findAll({where: {slot: SLOTS}, order: [['slot', 'ASC']]});
        const bySlot = new Map(rows.map((r) => [r.slot, r.get({plain: true})]));
        return SLOTS.map((slot) => bySlot.get(slot) || {id: null, slot, ...SLOT_FALLBACK[slot]});
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            alt_vi: str(d.alt_vi),
            alt_en: str(d.alt_en),
        };
    }

    /**
     * Ghi ảnh cho một khe. Upsert chứ không phải update: khe có thể chưa tồn tại
     * hàng nào (đang chạy bằng ảnh dự phòng), lần lưu đầu tiên phải tạo được.
     */
    static async saveSlot(slot, d) {
        const s = parseInt(slot, 10);
        if (!GalleryService.isValidSlot(s)) {
            throw Object.assign(new Error('Khe ảnh không hợp lệ'), {status: 400});
        }
        const n = GalleryService._normalize(d);
        if (!n.image) throw Object.assign(new Error('Ảnh là bắt buộc'), {status: 400});

        const row = await GalleryService.getBySlot(s);
        if (row) return row.update(n);
        return Gallery.create({...n, slot: s, sort_order: s, status: 1});
    }
}

GalleryService.SLOTS = SLOTS;

module.exports = GalleryService;
