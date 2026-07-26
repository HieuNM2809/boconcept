const {MAX_PRICE, parsePrice} = require('../../app/Helpers/price.helper');

describe('price.helper', () => {
    describe('parsePrice — ô bắt buộc (giá sản phẩm)', () => {
        it('nhận số thường', () => {
            expect(parsePrice('1000000')).toBe(1000000);
            expect(parsePrice(2500.5)).toBe(2500.5);
        });

        it('ô trống / thiếu -> 0 (giữ nguyên hành vi cũ của form)', () => {
            expect(parsePrice('')).toBe(0);
            expect(parsePrice(null)).toBe(0);
            expect(parsePrice(undefined)).toBe(0);
        });

        it('bỏ dấu phân cách nghìn kiểu VN và khoảng trắng', () => {
            expect(parsePrice('12.000.000')).toBe(12000000);
            expect(parsePrice('12,000,000')).toBe(12000000);
            expect(parsePrice(' 1 000 000 ')).toBe(1000000);
        });

        it('làm tròn về 2 chữ số thập phân — cột DECIMAL(_,2) không giữ hơn', () => {
            expect(parsePrice('10.4567')).toBe(10.46);
        });

        it('đầu vào KIỂU SỐ không bị bộ đoán dấu phân cách đụng vào', () => {
            // Đường API (express.json) gửi số thật. Luật "dấu rồi 3 chữ số =
            // phân cách nghìn" mà áp vào đây thì 1234.567 hoá 1.234.567 — sai
            // gấp nghìn lần và không ai phát hiện ra.
            expect(parsePrice(1234.567)).toBe(1234.57);
            expect(parsePrice(99.999)).toBe(100);
        });

        it('chuỗi có cả chấm lẫn phẩy: dấu sau cùng là dấu thập phân', () => {
            expect(parsePrice('1.250,50')).toBe(1250.5);  // kiểu VN
            expect(parsePrice('1,250.50')).toBe(1250.5);  // kiểu Mỹ
        });

        it('"99.999" là 99.999 ₫ chứ không phải 99,999 ₫ — nhập nhằng giải theo kiểu VN', () => {
            // Đúng 3 chữ số sau dấu chấm/phẩy => hiểu là phân cách nghìn. Với tiền
            // VNĐ đây gần như luôn là ý người nhập; giá lẻ tới phần nghìn của đồng
            // không tồn tại trên thực tế.
            expect(parsePrice('99.999')).toBe(99999);
            expect(parsePrice('1.250.000')).toBe(1250000);
        });

        it('CHẶN giá vượt trần thay vì để MySQL ném "Out of range"', () => {
            expect(() => parsePrice(MAX_PRICE + 1)).toThrow(/vượt mức tối đa/i);
            expect(() => parsePrice('99999999999999')).toThrow(/vượt mức tối đa/i);
        });

        it('đúng bằng trần thì vẫn cho qua', () => {
            expect(parsePrice(MAX_PRICE)).toBe(MAX_PRICE);
        });

        it('chặn giá âm', () => {
            expect(() => parsePrice('-1')).toThrow(/không được âm/i);
        });

        it('chặn chữ / rác — không âm thầm hoá 0', () => {
            expect(() => parsePrice('abc')).toThrow(/không hợp lệ/i);
            expect(() => parsePrice('1e999')).toThrow(/không hợp lệ/i);
        });

        it('lỗi mang status 400 để controller trả về toast, không phải 500', () => {
            expect.assertions(1);
            try { parsePrice('-5'); } catch (e) { expect(e.status).toBe(400); }
        });
    });

    describe('parsePrice — ô tuỳ chọn (giá biến thể)', () => {
        it('ô trống -> null chứ không 0: null nghĩa là "dùng giá sản phẩm cha"', () => {
            expect(parsePrice('', {optional: true})).toBeNull();
            expect(parsePrice(null, {optional: true})).toBeNull();
        });

        it('có giá trị thì kiểm tra như thường', () => {
            expect(parsePrice('500000', {optional: true})).toBe(500000);
            expect(() => parsePrice(MAX_PRICE + 1, {optional: true})).toThrow(/vượt mức tối đa/i);
        });
    });

    describe('MAX_PRICE', () => {
        it('phải nằm DƯỚI trần cột DECIMAL(15,2) = 9.999.999.999.999,99', () => {
            // Nếu hằng số này vượt trần cột thì app hết chặn được và lỗi SQL thô
            // quay lại đúng như bug ban đầu.
            expect(MAX_PRICE).toBeLessThan(10 ** 13);
        });
    });
});
