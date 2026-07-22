const richtext = require('../../Helpers/richtext.helper');

// Trần độ dài cho một lần xem trước. Không phải để chặn tấn công (body đã bị
// BODY_LIMIT chặn trên), mà để một cú dán nhầm 10MB không kéo cả tiến trình
// Node đi dựng HTML trong khi các request khác phải chờ.
const MAX_CHARS = 200_000;

/**
 * Dựng thử nội dung soạn thảo -> HTML cho nút "xem trước" trên thanh công cụ.
 *
 * VÌ SAO DỰNG Ở SERVER chứ không dịch Markdown ngay trong trình duyệt: chỉ có
 * app/Helpers/richtext.helper.js mới biết chính xác cú pháp nào được nhận và
 * link nào bị loại. Viết lại bộ dịch bằng JS phía client là tự tạo ra một bản
 * thứ hai chắc chắn sẽ lệch dần — admin xem trước thấy một đằng, trang public
 * hiện một nẻo, và tệ hơn là bản client dễ quên escape -> XSS ngay trên màn
 * admin. Ở đây trả về CHÍNH chuỗi HTML mà trang public sẽ dùng.
 */
function render(req, res) {
    const src = typeof req.body.text === 'string' ? req.body.text : '';
    res.json({html: richtext.render(src.slice(0, MAX_CHARS))});
}

module.exports = {render};
