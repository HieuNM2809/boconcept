const {render, toPlainText, safeImageSrc} = require('../../app/Helpers/richtext.helper');

describe('richtext render — định dạng trong dòng', () => {
    test('đậm, nghiêng, gạch ngang, mũ', () => {
        expect(render('**a**')).toBe('<p><strong>a</strong></p>');
        expect(render('*a*')).toBe('<p><em>a</em></p>');
        expect(render('~~a~~')).toBe('<p><del>a</del></p>');
        expect(render('x^2^')).toBe('<p>x<sup>2</sup></p>');
    });

    test('mã trong dòng KHÔNG bị định dạng tiếp', () => {
        // Gõ `**x**` là muốn thấy đúng hai dấu sao, không phải chữ đậm
        expect(render('`**x**`')).toBe('<p><code>**x**</code></p>');
    });

    test('link hợp lệ giữ nguyên, link xấu chỉ còn chữ và KHÔNG sót dấu )', () => {
        expect(render('[a](https://x.com)')).toBe('<p><a href="https://x.com" rel="noopener">a</a></p>');
        expect(render('[a](/noi-bo)')).toBe('<p><a href="/noi-bo" rel="noopener">a</a></p>');
        // Lỗi cũ: regex cắt ở dấu ) đầu tiên -> ra "a)" thừa một ngoặc
        expect(render('[a](javascript:alert(1))')).toBe('<p>a</p>');
        expect(render('[a](//evil.com)')).toBe('<p>a</p>');
    });

    test('ảnh: nhận http và data:image nhị phân, loại svg và javascript', () => {
        expect(render('![mèo](https://x.com/a.png)'))
            .toBe('<p><img src="https://x.com/a.png" alt="mèo" loading="lazy"></p>');
        const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
        expect(render(`![a](${dataUri})`)).toContain(`src="${dataUri}"`);
        // SVG là XML, chứa được <script> -> không cho qua đường data:
        expect(safeImageSrc('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
        expect(safeImageSrc('javascript:alert(1)')).toBeNull();
        // Ảnh javascript: có ngoặc lồng -> bị loại và KHÔNG sót dấu )
        expect(render('![y](javascript:alert(1))')).toBe('<p>y</p>');
    });
});

describe('richtext render — khối', () => {
    test('tiêu đề h1..h4', () => {
        expect(render('# A')).toBe('<h1>A</h1>');
        expect(render('## A')).toBe('<h2>A</h2>');
        expect(render('#### A')).toBe('<h4>A</h4>');
        // 5 dấu # không còn là tiêu đề -> phải ra đoạn văn thường
        expect(render('##### A')).toBe('<p>##### A</p>');
    });

    test('danh sách gạch đầu dòng và đánh số tách thành hai thẻ', () => {
        expect(render('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>');
        expect(render('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>');
        expect(render('1. a\n- b')).toBe('<ol><li>a</li></ol>\n<ul><li>b</li></ul>');
    });

    test('trích dẫn gom nhiều dòng liền nhau', () => {
        expect(render('> a\n> b')).toBe('<blockquote>a<br>b</blockquote>');
    });

    test('đường kẻ ngang', () => {
        expect(render('---')).toBe('<hr>');
    });

    test('khối mã giữ nguyên văn, kể cả dòng trông như tiêu đề', () => {
        expect(render('```\n## a\n\n- b\n```')).toBe('<pre><code>## a\n\n- b</code></pre>');
    });

    test('bảng cần dòng ngăn cách; thiếu nó thì vẫn là đoạn văn', () => {
        expect(render('| A | B |\n|---|---|\n| 1 | 2 |'))
            .toBe('<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>');
        expect(render('| chỉ là câu có gạch đứng |')).toBe('<p>| chỉ là câu có gạch đứng |</p>');
    });

    test('đoạn văn dừng lại khi gặp dòng mở khối mới', () => {
        // Lỗi kinh điển: "chữ<br>## Tiêu đề" nằm chung một thẻ <p>
        expect(render('chữ\n## Tiêu đề')).toBe('<p>chữ</p>\n<h2>Tiêu đề</h2>');
    });
});

describe('richtext render — an toàn', () => {
    test('mọi thẻ HTML người dùng gõ vào đều thành chữ', () => {
        expect(render('<script>alert(1)</script>'))
            .toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
        expect(render('<img src=x onerror=alert(1)>'))
            .toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    test('không giả được chỗ giữ tạm bằng ký tự NUL', () => {
        const out = render(`${String.fromCharCode(0)}0${String.fromCharCode(0)} \`x\``);
        expect(out).toBe('<p>0 <code>x</code></p>');
    });

    test('nội dung rỗng', () => {
        expect(render('')).toBe('');
        expect(render(null)).toBe('');
    });
});

describe('toPlainText', () => {
    test('bỏ ký hiệu định dạng, giữ chữ của link và mô tả ảnh', () => {
        expect(toPlainText('## Tiêu đề **đậm** [chữ](https://x.com) ![ảnh](https://x.com/a.png)'))
            .toBe('Tiêu đề đậm chữ ảnh');
    });

    test('cắt theo độ dài', () => {
        expect(toPlainText('a'.repeat(300), 10)).toHaveLength(10);
    });
});
