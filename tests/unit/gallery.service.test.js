// Service kéo theo Sequelize singleton ngay khi require -> mock hai module đó để
// bài test chạy được không cần MySQL (giống cách auth.service.test.js tránh DB).
jest.mock('../../lib/database', () => ({
    // saveSlot bọc mọi thứ trong transaction; giả lập bằng cách gọi thẳng callback.
    transaction: jest.fn(async (fn) => fn('tx')),
}));
jest.mock('../../app/Models/index.model', () => ({
    Gallery: {
        findAll: jest.fn(async () => []),
        destroy: jest.fn(async () => 0),
        bulkCreate: jest.fn(async (rows) => rows),
    },
}));

const {Gallery} = require('../../app/Models/index.model');
const GalleryService = require('../../app/Services/Api/gallery.service');

const MAX = GalleryService.MAX_IMAGES_PER_SLOT;
const rows = (n) => Array.from({length: n}, (_, i) => ({image: 'data:image/png;base64,AAA' + i}));
const savedRows = () => Gallery.bulkCreate.mock.calls[0][0];

describe('GalleryService.saveSlot — trần số ảnh mỗi khe', () => {
    beforeEach(() => jest.clearAllMocks());

    it('trần là 10 ảnh', () => {
        expect(MAX).toBe(10);
    });

    it('khe slider lưu đủ 10 ảnh', async () => {
        await GalleryService.saveSlot(1, rows(MAX));
        expect(savedRows()).toHaveLength(MAX);
    });

    it('11 ảnh -> lỗi 400 và KHÔNG động vào dữ liệu cũ', async () => {
        await expect(GalleryService.saveSlot(1, rows(MAX + 1))).rejects.toMatchObject({status: 400});
        // Quan trọng hơn cả mã lỗi: destroy chạy trước bulkCreate, nên nếu chặn
        // muộn thì khe bị xoá sạch rồi mới báo lỗi -> mất trắng ảnh đang có.
        expect(Gallery.destroy).not.toHaveBeenCalled();
        expect(Gallery.bulkCreate).not.toHaveBeenCalled();
    });

    it('dòng bỏ trống không bị tính vào trần', async () => {
        await GalleryService.saveSlot(2, rows(MAX).concat([{image: '   '}, {image: ''}]));
        expect(savedRows()).toHaveLength(MAX);
    });

    it('khe tĩnh vẫn chỉ giữ 1 ảnh dù POST bị sửa tay gửi thừa', async () => {
        await GalleryService.saveSlot(5, rows(MAX + 1));
        expect(savedRows()).toHaveLength(1);
    });
});
