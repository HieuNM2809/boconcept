const sequelize = require('../../../lib/database');
const {Gallery} = require('../../Models/index.model');

// 8 khe cố định của lưới collage trang chủ, khớp 1-1 với .collage-slot-N trong
// style.css và với nhãn SLOT_LABELS ở admin.gallery.controller.js. Đổi số ở một
// nơi mà quên hai nơi kia là admin sửa khe này nhưng ô khác đổi ảnh.
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

// Ba ô LỚN được phép chứa nhiều ảnh (tự chuyển ở trang chủ). Năm khe còn lại chỉ
// một ảnh. Ràng buộc này nằm ở đây chứ KHÔNG ở schema: bảng gallery cho phép mọi
// khe có nhiều dòng, khe tĩnh chỉ tình cờ có đúng một.
const SLIDER_SLOTS = [1, 2, 3];

// Ảnh dự phòng khi khe chưa có hàng trong DB (database mới tinh, hoặc admin chưa
// chạy migration). Trang chủ vẫn phải ra đủ 8 ô chứ không được vỡ lưới.
const SLOT_FALLBACK = {
    1: {image: 'https://picsum.photos/seed/insp-sofa/900/700', alt_vi: 'Sofa ngoài trời bên hồ bơi', alt_en: 'Outdoor sofa by the pool'},
    2: {image: 'https://picsum.photos/seed/insp-dining/900/700', alt_vi: 'Bàn ăn ngoài trời view biển', alt_en: 'Outdoor dining with sea view'},
    3: {image: 'https://picsum.photos/seed/insp-garden/900/700', alt_vi: 'Góc vườn với chậu hoa', alt_en: 'Garden corner with planters'},
    4: {image: 'https://picsum.photos/seed/insp-bath/700/900', alt_vi: 'Góc phòng tắm', alt_en: 'Bathroom corner'},
    5: {image: 'https://picsum.photos/seed/insp-chair/700/700', alt_vi: 'Ghế thư giãn cạnh cửa sổ', alt_en: 'Lounge chair by the window'},
    6: {image: 'https://picsum.photos/seed/insp-patio/800/700', alt_vi: 'Bộ bàn ghế sân vườn', alt_en: 'Patio furniture set'},
    7: {image: 'https://picsum.photos/seed/insp-chairs/700/900', alt_vi: 'Ghế ăn gỗ tự nhiên', alt_en: 'Natural wood dining chairs'},
    8: {image: 'https://picsum.photos/seed/insp-lounger/800/700', alt_vi: 'Ghế nằm cạnh hồ bơi', alt_en: 'Sun loungers by the pool'},
};

class GalleryService {
    static isValidSlot(slot) {
        return SLOTS.includes(parseInt(slot, 10));
    }

    static isSliderSlot(slot) {
        return SLIDER_SLOTS.includes(parseInt(slot, 10));
    }

    /** Khung một khe kèm ảnh dự phòng — dùng chung cho fallbackSlots và chỗ lấp khe rỗng. */
    static _emptySlot(slot) {
        return {
            slot,
            isSlider: GalleryService.isSliderSlot(slot),
            images: [{id: null, ...SLOT_FALLBACK[slot]}],
        };
    }

    /** 8 khe toàn ảnh dự phòng — dùng khi không đọc nổi DB. Đồng bộ, không throw. */
    static fallbackSlots() {
        return SLOTS.map((slot) => GalleryService._emptySlot(slot));
    }

    /**
     * Luôn trả ĐÚNG 8 phần tử theo thứ tự khe 1..8, mỗi phần tử có mảng `images`
     * không bao giờ rỗng (khe chưa có hàng thì lấp bằng SLOT_FALLBACK). Nhờ vậy
     * view chỉ cần lặp hai vòng, không phải kiểm tra rỗng ở đâu cả.
     */
    static async getSlots() {
        const rows = await Gallery.findAll({
            where: {slot: SLOTS},
            order: [['slot', 'ASC'], ['sort_order', 'ASC'], ['id', 'ASC']],
        });

        const bySlot = new Map();
        rows.forEach((r) => {
            const p = r.get({plain: true});
            if (!bySlot.has(p.slot)) bySlot.set(p.slot, []);
            bySlot.get(p.slot).push({id: p.id, image: p.image, alt_vi: p.alt_vi, alt_en: p.alt_en});
        });

        return SLOTS.map((slot) => {
            const images = bySlot.get(slot);
            if (!images || !images.length) return GalleryService._emptySlot(slot);
            return {slot, isSlider: GalleryService.isSliderSlot(slot), images};
        });
    }

    static _normalizeOne(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            image: (d.image || '').trim(),
            alt_vi: str(d.alt_vi),
            alt_en: str(d.alt_en),
        };
    }

    /**
     * Ghi ĐÈ toàn bộ nhóm ảnh của một khe: xoá sạch dòng cũ rồi chèn lại theo
     * đúng thứ tự mảng truyền vào (sort_order = chỉ số). Thêm/xoá/đổi thứ tự vì
     * vậy gói gọn trong một lần lưu, không cần theo dõi id nào còn id nào mất.
     *
     * Bọc transaction là bắt buộc: xoá xong mà chèn lỗi thì khe trắng vĩnh viễn.
     */
    static async saveSlot(slot, images) {
        const s = parseInt(slot, 10);
        if (!GalleryService.isValidSlot(s)) {
            throw Object.assign(new Error('Khe ảnh không hợp lệ'), {status: 400});
        }

        let list = (Array.isArray(images) ? images : [])
            .map(GalleryService._normalizeOne)
            .filter((x) => x.image); // dòng admin bỏ trống -> bỏ qua, không tạo lỗ hổng

        if (!list.length) {
            throw Object.assign(new Error('Khe ảnh phải có ít nhất một ảnh'), {status: 400});
        }
        // Khe tĩnh: form chỉ gửi một ảnh, nhưng cắt ở đây để dù POST bị sửa tay
        // cũng không nhét được nhiều ảnh vào ô không có slider.
        if (!GalleryService.isSliderSlot(s)) list = list.slice(0, 1);

        return sequelize.transaction(async (tx) => {
            await Gallery.destroy({where: {slot: s}, transaction: tx});
            return Gallery.bulkCreate(
                list.map((x, i) => ({...x, slot: s, sort_order: i, status: 1})),
                {transaction: tx}
            );
        });
    }
}

GalleryService.SLOTS = SLOTS;
GalleryService.SLIDER_SLOTS = SLIDER_SLOTS;

module.exports = GalleryService;
