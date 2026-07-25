const merge = require('../../app/Http/Middleware/richtextImages.middleware');

// Middleware chỉ đọc/ghi req.body nên không cần req/res thật.
const run = (body) => {
    const req = {body};
    let called = 0;
    merge(req, {}, () => { called++; });
    expect(called).toBe(1); // không được nuốt request trong bất kỳ nhánh nào
    return req.body;
};

const URI = 'data:image/jpeg;base64,/9j/4AAQ=';

describe('mergeRichtextImages', () => {
    test('nối kho ảnh vào cuối trường nội dung, ngăn bằng một dòng trống', () => {
        const out = run({content: 'Bài viết ![a][anh-1].', content__imgs: `[anh-1]: ${URI}`});
        expect(out.content).toBe(`Bài viết ![a][anh-1].\n\n[anh-1]: ${URI}\n`);
    });

    test('luôn xoá trường __imgs khỏi body', () => {
        // Controller nào cũng đọc thẳng req.body -> để sót là ghi một cột lạ
        expect(run({content: 'x', content__imgs: `[a]: ${URI}`})).not.toHaveProperty('content__imgs');
        expect(run({content__imgs: `[a]: ${URI}`})).not.toHaveProperty('content__imgs');
    });

    test('kho rỗng -> nội dung giữ nguyên, không thêm dòng trống thừa', () => {
        expect(run({content: 'x', content__imgs: ''}).content).toBe('x');
        expect(run({content: 'x', content__imgs: '   '}).content).toBe('x');
    });

    test('KHÔNG tự tạo trường nội dung khi form không gửi nó', () => {
        // Tạo mới = ghi đè một cột mà form vốn không định đụng tới
        expect(run({content__imgs: `[a]: ${URI}`})).not.toHaveProperty('content');
    });

    test('bỏ qua khi __imgs bị hpp gộp thành mảng', () => {
        expect(run({content: 'x', content__imgs: ['a', 'b']}).content).toBe('x');
    });

    test('nhiều ô soạn thảo trong cùng một form, mỗi ô một kho riêng', () => {
        const out = run({
            description: 'A ![x][anh-1]', description__imgs: '[anh-1]: /a.png',
            shipping: 'B ![y][anh-1]', shipping__imgs: '[anh-1]: /b.png',
        });
        expect(out.description).toContain('[anh-1]: /a.png');
        expect(out.shipping).toContain('[anh-1]: /b.png');
    });

    test('body rỗng hoặc không phải object -> đi tiếp, không nổ', () => {
        expect(() => run({})).not.toThrow();
        [null, undefined, 'chuỗi'].forEach((b) => {
            const req = {body: b};
            let called = 0;
            merge(req, {}, () => { called++; });
            expect(called).toBe(1);
        });
    });
});
