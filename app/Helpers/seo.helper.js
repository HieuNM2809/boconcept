/**
 * Tiện ích dựng nội dung thẻ SEO từ dữ liệu trang.
 *
 * `metaDescription`: cắt gọn văn bản cho <meta name="description"> / og:description.
 * Google hiển thị ~155–160 ký tự nên mặc định cắt 160, bỏ HTML + ký hiệu Markdown
 * rút gọn (nội dung sản phẩm/bài viết lưu dạng markdown, xem richtext.helper).
 */
function metaDescription(input, max = 160) {
    let s = String(input == null ? '' : input);
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');   // ảnh markdown ![alt](url)
    s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');  // link markdown [text](url) -> text
    s = s.replace(/<[^>]*>/g, ' ');                 // thẻ HTML (nếu có)
    s = s.replace(/[#*_`>~|]/g, ' ');               // ký hiệu markdown còn lại
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    return s.slice(0, max - 1).replace(/\s+\S*$/, '').trim() + '…';
}

/** Gộp danh sách từ khoá -> chuỗi "a, b, c" (bỏ rỗng, khử trùng, giữ thứ tự). */
function keywords(list) {
    const seen = new Set();
    const out = [];
    (list || []).forEach((x) => {
        const s = String(x == null ? '' : x).trim();
        if (s && !seen.has(s.toLowerCase())) { seen.add(s.toLowerCase()); out.push(s); }
    });
    return out.join(', ');
}

/** Chỉ nhận URL ảnh tuyệt đối http(s) cho og:image (bỏ data URI base64/relative). */
function httpImages(urls) {
    return (urls || []).filter((u) => /^https?:\/\//i.test(String(u || '')));
}

module.exports = {metaDescription, keywords, httpImages};
