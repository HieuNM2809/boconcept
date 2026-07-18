/**
 * Trình dựng nội dung bài viết (Markdown rút gọn) -> HTML.
 *
 * VÌ SAO KHÔNG CHO ADMIN NHẬP HTML THẲNG:
 * repo không có thư viện sanitize (sanitize-html/DOMPurify/xss đều không có), mà
 * tự viết bộ lọc HTML bằng regex là cách kinh điển để dính stored XSS. Ở đây làm
 * ngược lại và an toàn theo thiết kế: ESCAPE TOÀN BỘ trước, rồi mới dựng lại một
 * tập thẻ cố định do CHÍNH file này sinh ra. Không một ký tự nào của người dùng
 * đi vào output dưới dạng HTML, nên không có đường nào chèn <script> hay onerror=.
 *
 * Cú pháp hỗ trợ:
 *   ## Tiêu đề 2     ### Tiêu đề 3
 *   **đậm**          *nghiêng*  hoặc  _nghiêng_
 *   [chữ](https://…) — chỉ nhận http/https và đường dẫn nội bộ bắt đầu bằng /
 *   - gạch đầu dòng
 *   Dòng trống ngăn đoạn văn; xuống dòng đơn thành <br>
 */

const ESCAPE_MAP = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);

// Chỉ cho http(s) và đường dẫn nội bộ. Chặn javascript:, data:, vbscript:...
function safeHref(raw) {
    const url = String(raw).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/(?!\/)/.test(url)) return url; // "/abc" nhưng KHÔNG "//evil.com"
    if (/^#[\w-]*$/.test(url)) return url;
    return null;
}

// Định dạng trong dòng — chạy SAU khi đã escape nên chỉ thấy chuỗi vô hại.
function inline(text) {
    return text
        .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
            const safe = safeHref(href);
            return safe ? `<a href="${safe}" rel="noopener">${label}</a>` : label;
        })
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
        .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>');
}

function render(src) {
    if (!src) return '';
    const escaped = escapeHtml(src).replace(/\r\n/g, '\n');
    const blocks = escaped.split(/\n{2,}/);
    const out = [];

    for (const raw of blocks) {
        const block = raw.trim();
        if (!block) continue;

        const lines = block.split('\n');

        // Khối danh sách: MỌI dòng đều bắt đầu bằng "- "
        if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
            const items = lines.map((l) => `<li>${inline(l.trim().replace(/^[-*]\s+/, ''))}</li>`);
            out.push(`<ul>${items.join('')}</ul>`);
            continue;
        }

        const h = block.match(/^(#{2,3})\s+(.*)$/);
        if (h && lines.length === 1) {
            const level = h[1].length; // 2 hoặc 3
            out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
            continue;
        }

        out.push(`<p>${lines.map((l) => inline(l)).join('<br>')}</p>`);
    }

    return out.join('\n');
}

// Rút gọn thành chữ thuần (dùng cho meta description / trích đoạn tự động)
function toPlainText(src, maxLen = 200) {
    const flat = String(src || '')
        .replace(/[#*_>`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    return flat.length > maxLen ? `${flat.slice(0, maxLen - 1)}…` : flat;
}

module.exports = {render, toPlainText, escapeHtml, safeHref};
