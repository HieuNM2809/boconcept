/**
 * ProductService._syncColors — lưu danh sách màu cho khách chọn ở trang chi tiết.
 *
 * Khác `_syncImages` ở chỗ hàm này XOÁ HẾT RỒI CHÈN LẠI. Cố ý: một dòng màu chỉ
 * vài chục byte (hex + tên + số), còn một dòng ảnh là chuỗi base64 ~2MB. Cái đắt
 * đỏ ở `_syncImages` không tồn tại ở đây, và không có gì tham chiếu tới id của
 * màu nên id đổi cũng vô hại.
 */

jest.mock('../../lib/database', () => ({
    transaction: jest.fn(async (fn) => fn('tx')),
}));
jest.mock('../../app/Models/index.model', () => ({
    Product: {},
    Category: {},
    ProductVariant: {},
    ProductImage: {
        findAll: jest.fn(async () => []),
        destroy: jest.fn(async () => 0),
        update: jest.fn(async () => [1]),
        bulkCreate: jest.fn(async (rows) => rows),
    },
    ProductColor: {
        destroy: jest.fn(async () => 0),
        bulkCreate: jest.fn(async (rows) => rows),
    },
}));

const {ProductColor} = require('../../app/Models/index.model');
const ProductService = require('../../app/Services/Api/product.service');

const saved = () =>
    (ProductColor.bulkCreate.mock.calls[0] ? ProductColor.bulkCreate.mock.calls[0][0] : []);

beforeEach(() => jest.clearAllMocks());

describe('_syncColors — ghi dữ liệu', () => {
    it('không gửi field colors -> giữ nguyên, không ghi gì', async () => {
        await ProductService._syncColors(1, undefined, 'tx');

        expect(ProductColor.destroy).not.toHaveBeenCalled();
        expect(ProductColor.bulkCreate).not.toHaveBeenCalled();
    });

    it('mảng rỗng -> xoá hết màu của sản phẩm', async () => {
        await ProductService._syncColors(1, [], 'tx');

        expect(ProductColor.destroy).toHaveBeenCalledTimes(1);
        expect(ProductColor.destroy.mock.calls[0][0].where).toMatchObject({product_id: 1});
        expect(ProductColor.bulkCreate).not.toHaveBeenCalled();
    });

    it('lưu đúng hex, tên và thứ tự gửi lên', async () => {
        await ProductService._syncColors(1, [
            {hex: '#8b5a2b', name_vi: 'Nâu óc chó', name_en: 'Walnut', image_index: 2},
            {hex: '#2b2b2b', name_vi: 'Đen mờ', name_en: 'Matte black'},
        ], 'tx');

        expect(saved()).toEqual([
            {product_id: 1, hex: '#8b5a2b', name_vi: 'Nâu óc chó', name_en: 'Walnut', image_index: 2, sort_order: 0},
            {product_id: 1, hex: '#2b2b2b', name_vi: 'Đen mờ', name_en: 'Matte black', image_index: null, sort_order: 1},
        ]);
    });

    it('hex viết hoa -> chuẩn hoá về chữ thường', async () => {
        await ProductService._syncColors(1, [{hex: '#8B5A2B'}], 'tx');

        expect(saved()[0].hex).toBe('#8b5a2b');
    });

    it('tên để trống -> lưu null chứ không lưu chuỗi rỗng', async () => {
        await ProductService._syncColors(1, [{hex: '#000000', name_vi: '   ', name_en: ''}], 'tx');

        expect(saved()[0].name_vi).toBeNull();
        expect(saved()[0].name_en).toBeNull();
    });
});

describe('_syncColors — dữ liệu hỏng', () => {
    it('hàng không có hex -> bỏ qua, các hàng còn lại vẫn lưu', async () => {
        await ProductService._syncColors(1, [
            {name_vi: 'thiếu mã màu'},
            {hex: '  '},
            {hex: '#2b2b2b'},
        ], 'tx');

        expect(saved()).toHaveLength(1);
        expect(saved()[0].hex).toBe('#2b2b2b');
    });

    it('hex sai định dạng -> lỗi 400 và KHÔNG động vào dữ liệu cũ', async () => {
        await expect(ProductService._syncColors(1, [{hex: 'đỏ'}], 'tx'))
            .rejects.toMatchObject({status: 400});

        // Quan trọng hơn cả mã lỗi: destroy chạy trước bulkCreate, nên chặn muộn
        // là màu cũ bị xoá sạch rồi mới báo lỗi -> mất trắng.
        expect(ProductColor.destroy).not.toHaveBeenCalled();
        expect(ProductColor.bulkCreate).not.toHaveBeenCalled();
    });

    it('image_index không phải số hoặc âm -> lưu null', async () => {
        await ProductService._syncColors(1, [
            {hex: '#111111', image_index: 'abc'},
            {hex: '#222222', image_index: -1},
            {hex: '#333333', image_index: ''},
        ], 'tx');

        expect(saved().map((r) => r.image_index)).toEqual([null, null, null]);
    });

    it('image_index dạng chuỗi số -> lưu thành số', async () => {
        await ProductService._syncColors(1, [{hex: '#111111', image_index: '3'}], 'tx');

        expect(saved()[0].image_index).toBe(3);
    });
});
