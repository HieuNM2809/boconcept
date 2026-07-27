/**
 * ProductService._syncImages — chỉ ghi phần THAY ĐỔI của bộ sưu tập ảnh.
 *
 * VÌ SAO CÓ BÀI TEST NÀY: bản cũ xoá sạch `product_images` rồi chèn lại toàn bộ
 * mỗi lần lưu. Ảnh nằm trong DB dạng base64 (~2MB/tấm), nên sửa mỗi cái tên sản
 * phẩm cũng ghi lại vài chục MB vào bảng VÀ vào binary log. Đó là thứ làm đầy
 * volume MySQL trên Railway -> lỗi 1114 "The table 'products' is full".
 *
 * Nên các khẳng định ở đây soi vào ĐÚNG những lệnh ghi được phát ra: đó chính là
 * hành vi cần sửa, không phải chi tiết nội bộ.
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
}));

const {ProductImage} = require('../../app/Models/index.model');
const ProductService = require('../../app/Services/Api/product.service');

const A = 'data:image/jpeg;base64,AAAA';
const B = 'data:image/jpeg;base64,BBBB';
const C = 'data:image/jpeg;base64,CCCC';

/** Giả lập các dòng đang có trong DB cho sản phẩm #1. */
const existing = (...rows) => {
    ProductImage.findAll.mockResolvedValue(
        rows.map((r, i) => ({id: r.id ?? i + 100, url: r.url, sort_order: r.sort_order ?? i})),
    );
};

const inserted = () =>
    (ProductImage.bulkCreate.mock.calls[0] ? ProductImage.bulkCreate.mock.calls[0][0] : []);

beforeEach(() => {
    jest.clearAllMocks();
    ProductImage.findAll.mockResolvedValue([]);
});

describe('_syncImages — không ghi lại thứ không đổi', () => {
    it('danh sách y hệt -> KHÔNG phát ra lệnh ghi nào', async () => {
        existing({url: A, sort_order: 0}, {url: B, sort_order: 1});

        await ProductService._syncImages(1, [A, B], 'tx');

        expect(ProductImage.destroy).not.toHaveBeenCalled();
        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
        expect(ProductImage.update).not.toHaveBeenCalled();
    });

    it('thêm 1 ảnh -> chỉ chèn ảnh mới, không đụng ảnh cũ', async () => {
        existing({url: A, sort_order: 0});

        await ProductService._syncImages(1, [A, B], 'tx');

        expect(inserted()).toHaveLength(1);
        expect(inserted()[0]).toMatchObject({url: B, sort_order: 1});
        expect(ProductImage.destroy).not.toHaveBeenCalled();
    });

    it('bỏ 1 ảnh -> chỉ xoá đúng dòng đó, không xoá cả sản phẩm', async () => {
        existing({id: 10, url: A, sort_order: 0}, {id: 11, url: B, sort_order: 1});

        await ProductService._syncImages(1, [A], 'tx');

        expect(ProductImage.destroy).toHaveBeenCalledTimes(1);
        const where = ProductImage.destroy.mock.calls[0][0].where;
        // Bản cũ xoá theo product_id -> cuốn theo cả ảnh đang giữ.
        expect(where.product_id).toBeUndefined();
        expect(JSON.stringify(where)).toContain('11');
        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
    });

    it('đổi thứ tự -> chỉ cập nhật sort_order, KHÔNG ghi lại chuỗi base64', async () => {
        existing({id: 10, url: A, sort_order: 0}, {id: 11, url: B, sort_order: 1});

        await ProductService._syncImages(1, [B, A], 'tx');

        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
        expect(ProductImage.update).toHaveBeenCalledTimes(2);
        for (const [values] of ProductImage.update.mock.calls) {
            // Đây là điểm mấu chốt: payload chỉ được chứa sort_order. Có `url`
            // trong đó là 2MB base64 lại chui vào binlog thêm một lần nữa.
            expect(Object.keys(values)).toEqual(['sort_order']);
        }
    });
});

describe('_syncImages — kết quả cuối vẫn đúng', () => {
    it('thay toàn bộ -> xoá hết cũ, chèn hết mới', async () => {
        existing({id: 10, url: A, sort_order: 0});

        await ProductService._syncImages(1, [B, C], 'tx');

        expect(ProductImage.destroy).toHaveBeenCalledTimes(1);
        expect(inserted().map((r) => r.url)).toEqual([B, C]);
        expect(inserted().map((r) => r.sort_order)).toEqual([0, 1]);
    });

    it('danh sách rỗng -> xoá sạch ảnh của sản phẩm', async () => {
        existing({id: 10, url: A, sort_order: 0});

        await ProductService._syncImages(1, [], 'tx');

        expect(ProductImage.destroy).toHaveBeenCalledTimes(1);
        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
    });

    it('không gửi field gallery -> giữ nguyên, không đọc cũng không ghi', async () => {
        await ProductService._syncImages(1, undefined, 'tx');

        expect(ProductImage.destroy).not.toHaveBeenCalled();
        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
        expect(ProductImage.update).not.toHaveBeenCalled();
    });

    it('url rỗng/khoảng trắng bị loại trước khi so sánh', async () => {
        existing({url: A, sort_order: 0});

        await ProductService._syncImages(1, [A, '   ', '', null], 'tx');

        expect(ProductImage.bulkCreate).not.toHaveBeenCalled();
        expect(ProductImage.destroy).not.toHaveBeenCalled();
    });

    it('hai ảnh trùng nhau vẫn giữ đủ hai dòng', async () => {
        existing({id: 10, url: A, sort_order: 0});

        await ProductService._syncImages(1, [A, A], 'tx');

        // Một dòng cũ khớp, dòng thứ hai phải được chèn mới — không phải bỏ qua.
        expect(inserted()).toHaveLength(1);
        expect(inserted()[0]).toMatchObject({url: A, sort_order: 1});
    });
});
