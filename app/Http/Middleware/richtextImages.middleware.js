/**
 * Gộp "kho ảnh" của ô soạn thảo về lại đúng trường nội dung.
 *
 * BỐI CẢNH: ảnh trong bài lưu base64 (Railway xoá filesystem mỗi lần redeploy),
 * một tấm JPEG 300KB thành chuỗi ~400 nghìn ký tự. Để admin còn đọc được ô soạn
 * thảo, public/js/admin.js gỡ hết các dòng định nghĩa `[nhãn]: data:image/…` ra
 * khỏi textarea và nhét vào một input ẩn cùng tên + hậu tố `__imgs`. Middleware
 * này nối chúng lại trước khi controller nhìn thấy `req.body`.
 *
 * VÌ SAO GỘP Ở SERVER chứ không để JS ghép lại vào textarea ngay trước lúc submit:
 * ghép ở client nghĩa là giá trị thật chỉ tồn tại sau khi một handler `submit`
 * chạy xong. Bất kỳ đường submit nào không đi qua handler đó — trình duyệt tự
 * gửi form khi bấm Enter trong ô input, tiện ích bên thứ ba, hoặc chính admin.js
 * ném lỗi ở dòng trên — sẽ lưu bài với toàn bộ ảnh biến mất, âm thầm. Ở đây thì
 * ngược lại: input ẩn luôn có mặt trong form từ lúc dựng, đường nào cũng gửi kèm.
 *
 * KHÔNG CHẠY JS THÌ SAO: admin.js không chạy -> nó không gỡ gì khỏi textarea,
 * textarea vẫn mang nguyên văn cả phần định nghĩa như server đã render ra, và
 * cũng không có input ẩn nào -> middleware này không làm gì. Lưu vẫn đúng.
 */

const SUFFIX = '__imgs';

module.exports = function mergeRichtextImages(req, res, next) {
    const body = req.body;
    if (!body || typeof body !== 'object') return next();

    for (const key of Object.keys(body)) {
        if (!key.endsWith(SUFFIX) || key === SUFFIX) continue;

        // hpp có thể biến giá trị trùng tên thành mảng — chỉ nhận chuỗi, còn lại bỏ.
        const defs = typeof body[key] === 'string' ? body[key].trim() : '';
        const target = key.slice(0, -SUFFIX.length);
        delete body[key]; // xoá LUÔN, kể cả khi không dùng: controller không được thấy trường lạ

        // Trường nội dung không có trong form này (hoặc không phải chuỗi) -> bỏ
        // qua thay vì tự tạo ra nó. Tạo mới đồng nghĩa ghi đè một cột mà form
        // vốn không định đụng tới.
        if (!defs || typeof body[target] !== 'string') continue;

        // Ngăn cách bằng một dòng trống: dòng định nghĩa phải đứng riêng, dính
        // vào cuối đoạn văn cuối là nó thành chữ trong đoạn đó.
        body[target] = `${body[target].replace(/\s+$/, '')}\n\n${defs}\n`;
    }

    next();
};
