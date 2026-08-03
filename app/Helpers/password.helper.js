/**
 * Băm & kiểm tra mật khẩu cho tài khoản quản trị (bảng `users`).
 *
 * VÌ SAO DÙNG crypto.scrypt (built-in) THAY VÌ bcrypt: repo này cố tình giữ số
 * dependency ở mức tối thiểu (xem CLAUDE.md — nhiều helper tự viết: đọc cookie,
 * parse giá, richtext...). `bcrypt` còn cần biên dịch native (đau trên Windows),
 * còn `scrypt` có sẵn trong Node, mạnh và không thêm gói nào.
 *
 * ĐỊNH DẠNG LƯU: "scrypt$<salt hex>$<hash hex>" — tự mang salt theo, nên đổi
 * tham số về sau vẫn kiểm được mật khẩu cũ (chỉ cần thêm nhánh theo `scheme`).
 */
const crypto = require('crypto');

const KEYLEN = 64;   // độ dài khoá dẫn xuất (byte)
const SALTLEN = 16;  // độ dài salt ngẫu nhiên (byte)
const SCHEME = 'scrypt';

// Độ dài tối thiểu — chặn ở service/controller, để đây một hằng dùng chung.
const MIN_PASSWORD_LENGTH = 6;

/**
 * Băm mật khẩu thô -> chuỗi lưu vào cột `users.password`.
 * @param {string} plain
 * @returns {string} "scrypt$<salt>$<hash>"
 */
function hash(plain) {
    const salt = crypto.randomBytes(SALTLEN).toString('hex');
    const derived = crypto.scryptSync(String(plain), salt, KEYLEN).toString('hex');
    return `${SCHEME}$${salt}$${derived}`;
}

/**
 * So khớp mật khẩu thô với chuỗi đã lưu. KHÔNG bao giờ ném — giá trị hỏng/định
 * dạng lạ đều trả false, để đường đăng nhập chỉ có đúng/sai chứ không 500.
 * Dùng timingSafeEqual để không lộ thông tin qua thời gian so sánh.
 * @returns {boolean}
 */
function verify(plain, stored) {
    if (typeof stored !== 'string') return false;
    const [scheme, salt, hashHex] = stored.split('$');
    if (scheme !== SCHEME || !salt || !hashHex) return false;

    let derived;
    try {
        derived = crypto.scryptSync(String(plain), salt, KEYLEN);
    } catch (_) {
        return false;
    }
    const expected = Buffer.from(hashHex, 'hex');
    // timingSafeEqual ném nếu khác độ dài -> chặn trước bằng so sánh độ dài.
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
}

module.exports = {hash, verify, MIN_PASSWORD_LENGTH};
