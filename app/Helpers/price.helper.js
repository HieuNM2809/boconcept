/**
 * Đọc & kiểm tra giá tiền cho MỌI đường ghi vào cột DECIMAL (products.price,
 * product_variants.price).
 *
 * VÌ SAO CẦN FILE NÀY: trước đây controller admin chỉ làm `parseFloat(b.price) || 0`
 * rồi đẩy thẳng xuống Sequelize. Hệ quả:
 *   1. Giá vượt trần cột -> MySQL ném "Out of range value for column 'price'",
 *      lỗi SQL thô hiện lên toast, admin không hiểu gì.
 *   2. Gõ nhầm chữ -> `parseFloat('abc') || 0` âm thầm LƯU 0 đồng, không ai biết.
 * Ở đây chặn trước, kèm status 400 để controller trả toast tiếng Việt tử tế.
 *
 * TRẦN: cột là DECIMAL(15,2) -> chứa tối đa 9.999.999.999.999,99. MAX_PRICE đặt
 * thấp hơn hẳn một bậc để app luôn là nơi từ chối, KHÔNG bao giờ để MySQL từ chối
 * (xem test price.helper.test.js). 999 tỷ đã thừa sức cho nội thất tính bằng VNĐ.
 */
const MAX_PRICE = 999_999_999_999; // 999.999.999.999 ₫

const err = (msg) => Object.assign(new Error(msg), {status: 400});

// Trình bày lại cho thông báo lỗi dễ đọc: 999999999999 -> "999.999.999.999"
const format = (n) => Number(n).toLocaleString('vi-VN');

/**
 * Quy chuỗi có dấu phân cách về dạng Number() đọc được.
 *
 * Admin hay dán giá từ bảng tính/website: "1.250.000", "12,000,000", "1,250.00".
 * Quy tắc:
 *   - Có CẢ dấu chấm lẫn phẩy -> dấu xuất hiện SAU CÙNG là dấu thập phân, dấu
 *     còn lại là phân cách nghìn ("1.250,00" kiểu VN và "1,250.00" kiểu Mỹ đều đúng).
 *   - Chỉ một loại dấu, và chuỗi khớp ĐÚNG dạng nhóm nghìn đều đặn (1-3 chữ số
 *     rồi từng nhóm 3) -> đó là phân cách nghìn, bỏ hết.
 *   - Còn lại -> coi là dấu thập phân.
 *
 * Điều kiện "khớp ĐÚNG cả chuỗi" là điểm mấu chốt: một luật lỏng hơn (chỉ cần
 * thấy dấu rồi 3 chữ số) sẽ nuốt luôn "1234.567" thành 1234567.
 */
function readSeparators(raw) {
    const dot = raw.lastIndexOf('.');
    const comma = raw.lastIndexOf(',');

    if (dot >= 0 && comma >= 0) {
        const decimal = dot > comma ? '.' : ',';
        const group = decimal === '.' ? ',' : '.';
        return raw.split(group).join('').replace(decimal, '.');
    }

    if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return raw.replace(/[.,]/g, '');

    return raw.replace(',', '.');
}

/**
 * @param {*} value giá thô từ form/API
 * @param {{optional?: boolean, label?: string}} [opts]
 *        optional: ô trống trả `null` (giá biến thể — null = dùng giá sản phẩm cha)
 *                  thay vì `0` (giá sản phẩm — cột NOT NULL DEFAULT 0).
 * @returns {number|null}
 */
function parsePrice(value, opts = {}) {
    const {optional = false, label = 'Giá'} = opts;

    if (value == null || String(value).trim() === '') return optional ? null : 0;

    // Đầu vào ĐÃ là số (đường API qua express.json) thì không nhập nhằng gì cả —
    // dùng thẳng. Cho nó chạy qua readSeparators là sai nặng: 1234.567 sẽ thành
    // 1.234.567.
    // Với CHUỖI thì KHÔNG dùng parseFloat: nó đọc "12abc" thành 12 và "1e999"
    // thành Infinity. Number() nghiêm hơn — rác thành NaN, Infinity chặn bằng
    // isFinite ngay dưới. Mọi khoảng trắng (kể cả non-breaking space U+00A0 mà
    // Excel/Word chèn vào) bỏ hết trước khi đọc.
    const n = typeof value === 'number'
        ? value
        : Number(readSeparators(String(value).replace(/[\s ]/g, '')));

    if (!Number.isFinite(n)) throw err(`${label} không hợp lệ — chỉ nhập số.`);
    if (n < 0) throw err(`${label} không được âm.`);
    if (n > MAX_PRICE) throw err(`${label} vượt mức tối đa ${format(MAX_PRICE)} ₫.`);

    // Cột chỉ giữ 2 chữ số thập phân; làm tròn ở đây để giá trị lưu xuống DB
    // khớp đúng cái admin thấy, thay vì bị MySQL cắt đuôi âm thầm.
    return Math.round(n * 100) / 100;
}

module.exports = {MAX_PRICE, parsePrice};
