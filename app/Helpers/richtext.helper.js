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
 *   KHỐI
 *     # .. #### Tiêu đề          (h1–h4)
 *     - gạch đầu dòng   /   * gạch đầu dòng
 *     1. danh sách đánh số
 *     > trích dẫn
 *     ``` khối mã ```            (giữ nguyên xuống dòng, không định dạng bên trong)
 *     ---                        đường kẻ ngang
 *     | bảng | hai cột |         (dòng thứ 2 phải là | --- | --- |)
 *     Dòng trống ngăn đoạn văn; xuống dòng đơn thành <br>
 *   TRONG DÒNG
 *     **đậm**   *nghiêng* hoặc _nghiêng_   ~~gạch ngang~~   `mã`   ^mũ^
 *     [chữ](https://…)           chỉ nhận http/https, đường dẫn nội bộ /… và neo #…
 *     ![mô tả](https://…)        ảnh — thêm cả data:image/… vì ảnh của web này lưu base64
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

/**
 * Nguồn ảnh: như safeHref nhưng CHO THÊM data:image/… — ảnh của web này được mã
 * hoá base64 ngay ở trình duyệt rồi lưu thẳng vào DB (Railway xoá filesystem mỗi
 * lần redeploy), nên chặn data: là chặn luôn đường chèn ảnh duy nhất.
 * KHÔNG nhận data:image/svg+xml: file SVG là XML, chứa được <script>; các định
 * dạng ảnh nhị phân bên dưới thì không.
 */
function safeImageSrc(raw) {
    const url = String(raw).trim();
    if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(url)) return url;
    return safeHref(url);
}

// Chỗ giữ tạm cho `mã trong dòng`: nội dung bên trong dấu ` không được đem đi
// định dạng tiếp (gõ `**x**` là muốn thấy đúng hai dấu sao), nên cất ra rồi trả
// lại ở bước cuối. Ký tự NUL đã bị render() lọc sạch nên không ai giả được.
const STASH_OPEN = '\u0000';

// Định dạng trong dòng — chạy SAU khi đã escape nên chỉ thấy chuỗi vô hại.
function inline(text) {
    const stash = [];
    const keep = (html) => {
        stash.push(html);
        return `${STASH_OPEN}${stash.length - 1}${STASH_OPEN}`;
    };

    let s = String(text).replace(/`([^`\n]+)`/g, (m, code) => keep(`<code>${code}</code>`));

    s = s
        // Ảnh PHẢI xử lý trước link: ![x](y) chứa sẵn [x](y) bên trong.
        // Cho một lớp ngoặc lồng như link, nếu không "javascript:alert(1)" bị cắt
        // ở dấu ) đầu tiên -> ảnh bị loại nhưng còn sót lại một ")" ngoài chữ.
        .replace(/!\[([^\]\n]*)\]\(([^()\s]*(?:\([^()]*\)[^()\s]*)*)\)/g, (m, alt, src) => {
            const safe = safeImageSrc(src);
            return safe ? keep(`<img src="${safe}" alt="${alt}" loading="lazy">`) : alt;
        })
        // Địa chỉ cho phép MỘT lớp ngoặc lồng: nếu không, "javascript:alert(1)" bị
        // cắt ở dấu ) đầu tiên, link bị loại nhưng còn sót lại một ")" ngoài chữ.
        .replace(/\[([^\]\n]+)\]\(([^()\s]*(?:\([^()]*\)[^()\s]*)*)\)/g, (m, label, href) => {
            const safe = safeHref(href);
            return safe ? `<a href="${safe}" rel="noopener">${label}</a>` : label;
        })
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
        .replace(/\^([^\s^]+)\^/g, '<sup>$1</sup>')
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
        .replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>');

    return s.replace(new RegExp(`${STASH_OPEN}(\\d+)${STASH_OPEN}`, 'g'), (m, n) => stash[n]);
}

// Các mẫu mở đầu một KHỐI mới. Đoạn văn đang gom gặp dòng khớp mẫu nào ở đây thì
// phải dừng lại, nếu không "chữ<br>## Tiêu đề" sẽ nằm chung một thẻ <p>.
const RE_FENCE = /^```/;
const RE_HR = /^(-{3,}|\*{3,}|_{3,})$/;
const RE_HEAD = /^(#{1,4})\s+(.+)$/;
// Dấu > đã bị escapeHtml đổi thành &gt; TRƯỚC khi tách khối, nên mẫu phải bắt
// &gt; chứ không phải >. (Người dùng gõ thẳng "&gt;" thì thành "&amp;gt;", không đụng.)
const RE_QUOTE = /^&gt;\s?/;
const RE_UL = /^[-*]\s+/;
const RE_OL = /^\d+[.)]\s+/;
const RE_ROW = /^\|.*\|$/;

function startsBlock(t) {
    return RE_FENCE.test(t) || RE_HR.test(t) || RE_HEAD.test(t)
        || RE_QUOTE.test(t) || RE_UL.test(t) || RE_OL.test(t) || RE_ROW.test(t);
}

// Dòng ngăn cách của bảng: | --- | :--: | — dấu : là canh lề của Markdown chuẩn,
// nhận cho khỏi báo lỗi nhưng không dùng tới.
const isTableSep = (t) => /^\|[\s:|-]+\|$/.test(t) && t.includes('-');
const splitRow = (t) => t.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function render(src) {
    if (!src) return '';
    const lines = escapeHtml(src)
        .replace(/\r\n/g, '\n')
        .replace(/\u0000/g, '') // dọn ký tự NUL để không giả được chỗ giữ tạm của inline()
        .split('\n');

    const out = [];
    let i = 0;

    while (i < lines.length) {
        const t = lines[i].trim();

        if (!t) { i++; continue; }

        // ``` khối mã ``` — phải xét TRƯỚC mọi thứ khác và gom nguyên văn, kể cả
        // dòng trống, kể cả dòng trông như tiêu đề hay danh sách.
        if (RE_FENCE.test(t)) {
            const body = [];
            i++;
            while (i < lines.length && !RE_FENCE.test(lines[i].trim())) { body.push(lines[i]); i++; }
            i++; // bỏ qua dấu ``` đóng (hoặc chạm cuối chuỗi thì thôi)
            out.push(`<pre><code>${body.join('\n')}</code></pre>`);
            continue;
        }

        if (RE_HR.test(t)) { out.push('<hr>'); i++; continue; }

        const h = t.match(RE_HEAD);
        if (h) {
            const level = h[1].length; // 1..4
            out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
            i++;
            continue;
        }

        if (RE_QUOTE.test(t)) {
            const body = [];
            while (i < lines.length && RE_QUOTE.test(lines[i].trim())) {
                body.push(inline(lines[i].trim().replace(RE_QUOTE, '')));
                i++;
            }
            out.push(`<blockquote>${body.join('<br>')}</blockquote>`);
            continue;
        }

        // Bảng: chỉ nhận khi dòng NGAY SAU là dòng ngăn cách. Thiếu nó thì một
        // câu có dấu | ở hai đầu sẽ bị hiểu nhầm thành bảng một ô.
        if (RE_ROW.test(t) && i + 1 < lines.length && isTableSep(lines[i + 1].trim())) {
            const head = splitRow(t).map((c) => `<th>${inline(c)}</th>`).join('');
            i += 2;
            const body = [];
            while (i < lines.length && RE_ROW.test(lines[i].trim())) {
                body.push(`<tr>${splitRow(lines[i].trim()).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
                i++;
            }
            out.push(`<table><thead><tr>${head}</tr></thead><tbody>${body.join('')}</tbody></table>`);
            continue;
        }

        if (RE_UL.test(t) || RE_OL.test(t)) {
            const ordered = RE_OL.test(t);
            const re = ordered ? RE_OL : RE_UL;
            const items = [];
            // Dừng khi gặp dòng không còn thuộc kiểu danh sách ĐANG gom -> gạch
            // đầu dòng nối ngay sau danh sách đánh số vẫn ra hai thẻ riêng.
            while (i < lines.length && re.test(lines[i].trim())) {
                items.push(`<li>${inline(lines[i].trim().replace(re, ''))}</li>`);
                i++;
            }
            const tag = ordered ? 'ol' : 'ul';
            out.push(`<${tag}>${items.join('')}</${tag}>`);
            continue;
        }

        // Đoạn văn: gom tới dòng trống hoặc tới dòng mở đầu một khối khác.
        // Dòng ĐẦU luôn được ăn vô điều kiện — bắt buộc, không phải cho gọn: một
        // dòng "| a |" thiếu dòng ngăn cách sẽ rớt xuống tận đây mà startsBlock()
        // vẫn đúng, vòng while không chạy lần nào và `i` đứng yên -> lặp vô hạn.
        const para = [inline(t)];
        i++;
        while (i < lines.length && lines[i].trim() && !startsBlock(lines[i].trim())) {
            para.push(inline(lines[i].trim()));
            i++;
        }
        out.push(`<p>${para.join('<br>')}</p>`);
    }

    return out.join('\n');
}

// Rút gọn thành chữ thuần (dùng cho meta description / trích đoạn tự động)
function toPlainText(src, maxLen = 200) {
    const flat = String(src || '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // ảnh -> chỉ giữ mô tả
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[#*_>`~^|-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return flat.length > maxLen ? `${flat.slice(0, maxLen - 1)}…` : flat;
}

module.exports = {render, toPlainText, escapeHtml, safeHref, safeImageSrc};
