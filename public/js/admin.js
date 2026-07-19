(function () {
    'use strict';
    // Xác nhận trước khi submit form có data-confirm (vd: xóa slide)
    document.querySelectorAll('form[data-confirm]').forEach(function (f) {
        f.addEventListener('submit', function (e) {
            if (!window.confirm(f.dataset.confirm)) e.preventDefault();
        });
    });

    // ── Bộ sưu tập ảnh sản phẩm: thêm/xóa dòng động ───────────────────────────
    var galleryRows = document.getElementById('galleryRows');
    var addRowBtn = document.getElementById('addGalleryRow');
    if (galleryRows && addRowBtn) {
        // Đếm từ số dòng có sẵn để id không đụng nhau khi sửa sản phẩm đã có ảnh
        var galSeq = galleryRows.querySelectorAll('.gallery-row').length;

        addRowBtn.addEventListener('click', function () {
            var id = 'gal_new' + (galSeq++);
            var row = document.createElement('div');
            row.className = 'gallery-row';
            row.innerHTML =
                '<img class="gallery-row-thumb" alt="" hidden data-preview-for="' + id + '">' +
                '<input type="file" accept="image/*" data-encode-to="' + id + '">' +
                '<input type="text" id="' + id + '" name="gallery[]" placeholder="https://...">' +
                '<button type="button" class="btn-sm danger" data-remove-row>Xóa</button>';
            galleryRows.appendChild(row);
            bindEncoders(row); // dòng mới cũng phải nhận được nút chọn file
        });

        galleryRows.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-remove-row]');
            if (btn) btn.closest('.gallery-row').remove();
        });
    }

    // ── Thanh công cụ soạn nội dung (Markdown rút gọn) ────────────────────────
    // Chèn cú pháp vào textarea thay vì dùng contenteditable: nội dung lưu xuống
    // luôn là chữ thuần, không bao giờ là HTML — khớp với cách server dựng lại
    // (escape trước, sinh thẻ sau) nên không có đường chèn mã độc.
    document.querySelectorAll('.editor-toolbar').forEach(function (bar) {
        var ta = document.getElementById(bar.dataset.editorFor);
        if (!ta) return;

        function apply(fn) {
            var s = ta.selectionStart, e = ta.selectionEnd;
            var before = ta.value.slice(0, s), sel = ta.value.slice(s, e), after = ta.value.slice(e);
            var r = fn(sel);
            ta.value = before + r.text + after;
            ta.focus();
            ta.setSelectionRange(s + r.caret, s + r.caret + (r.select == null ? sel.length : r.select));
        }

        bar.addEventListener('click', function (ev) {
            var btn = ev.target.closest('button');
            if (!btn) return;

            if (btn.dataset.wrap) {
                var w = btn.dataset.wrap;
                apply(function (sel) { return {text: w + (sel || 'chữ') + w, caret: w.length}; });
            } else if (btn.dataset.prefix) {
                var p = btn.dataset.prefix;
                // Áp cho TỪNG dòng đang chọn, không phải chỉ dòng đầu
                apply(function (sel) {
                    var body = (sel || 'nội dung').split('\n').map(function (l) { return p + l; }).join('\n');
                    return {text: body, caret: p.length};
                });
            } else if (btn.dataset.link) {
                var url = window.prompt('Địa chỉ liên kết (https://... hoặc /duong-dan)');
                if (!url) return;
                apply(function (sel) {
                    var label = sel || 'chữ hiển thị';
                    return {text: '[' + label + '](' + url + ')', caret: 1, select: label.length};
                });
            }
        });
    });

    bindEncoders(document);
})();

var IMG_MAX_PIXELS = 5000000;   // 5 megapixel — trần độ phân giải sau khi thu
var IMG_TARGET_BYTES = 1500000; // file nặng hơn mức này thì nén lại dù đã đủ nhỏ về pixel
var IMG_JPEG_QUALITY = 0.85;
// SVG KHÔNG đi qua canvas nên không được thu nhỏ -> đây là đường duy nhất một
// file lớn có thể chui thẳng vào thân POST và ăn lỗi 413. SVG là chữ, file thật
// hiếm khi quá 100KB; vượt ngưỡng này thì rasterise như ảnh thường.
var SVG_PASSTHROUGH_MAX_BYTES = 2 * 1024 * 1024;

function readAsDataURL(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(null, reader.result); };
    reader.onerror = function () { cb(new Error('Không đọc được file.')); };
    reader.readAsDataURL(file);
}

/**
 * Thu ảnh về tối đa 5 megapixel rồi trả data URI.
 *
 * Vì sao phải thu: ảnh gốc được nhúng thẳng vào MySQL dạng base64. Base64 phình
 * ~33%, mã hoá URL trong thân form phình thêm ~6%. Ảnh điện thoại 12MP/8MB sẽ
 * thành thân POST ~11MB — vượt BODY_LIMIT, và form sản phẩm có tới 9 ô ảnh.
 * Thu về 5MP rồi xuất JPEG cho ra ~800KB, thân POST ~1.1MB mỗi ảnh.
 */
function shrinkImage(file, cb) {
    // SVG là vector: vẽ lên canvas sẽ rasterise thành ảnh bệt, mất hết độ nét.
    // Giữ nguyên khi còn nhẹ; quá lớn thì rơi xuống nhánh canvas bên dưới để
    // vẫn gửi đi được thay vì chết ở 413.
    if (file.type === 'image/svg+xml' && file.size <= SVG_PASSTHROUGH_MAX_BYTES) {
        return readAsDataURL(file, cb);
    }

    var url = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var pixels = w * h;

        // Đã nhỏ về cả pixel lẫn dung lượng -> giữ nguyên file gốc, không nén lại
        // để khỏi làm giảm chất lượng logo/icon một cách vô ích.
        if (pixels <= IMG_MAX_PIXELS && file.size <= IMG_TARGET_BYTES) {
            URL.revokeObjectURL(url);
            return readAsDataURL(file, cb);
        }

        var ratio = pixels > IMG_MAX_PIXELS ? Math.sqrt(IMG_MAX_PIXELS / pixels) : 1;
        var nw = Math.max(1, Math.round(w * ratio));
        var nh = Math.max(1, Math.round(h * ratio));

        var canvas = document.createElement('canvas');
        canvas.width = nw;
        canvas.height = nh;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, nw, nh);
        URL.revokeObjectURL(url);

        // PNG giữ PNG: đổi sang JPEG sẽ biến nền trong suốt thành đen.
        var mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        var out;
        try {
            out = canvas.toDataURL(mime, IMG_JPEG_QUALITY);
        } catch (e) {
            // Canvas "nhiễm bẩn" hoặc hết bộ nhớ -> vẫn nhúng ảnh gốc, không chặn.
            return readAsDataURL(file, cb);
        }
        cb(null, out, {from: w + '×' + h, to: nw + '×' + nh, resized: ratio < 1});
    };

    // KHÔNG báo lỗi và KHÔNG chặn: đọc không được thì nhúng thẳng file gốc.
    // Trình duyệt từ chối giải mã vì nhiều lý do ngoài tầm kiểm soát (định dạng lạ
    // như HEIC, CSP chặn blob:, ảnh hỏng một phần) — chặn ở đây là người dùng
    // không upload được gì mà cũng không hiểu vì sao.
    img.onerror = function () {
        URL.revokeObjectURL(url);
        readAsDataURL(file, cb);
    };
    img.src = url;
}

/**
 * Gắn xử lý "chọn ảnh từ máy" cho mọi <input type=file data-encode-to> trong `root`.
 *
 * Cố ý KHÔNG upload multipart lên server: railway.json không khai báo volume nên
 * Railway xoá sạch filesystem mỗi lần redeploy — file ghi ra đĩa sẽ lặng lẽ mất.
 * Mã hoá base64 tại trình duyệt rồi lưu vào MySQL thì sống sót redeploy.
 *
 * Tách thành hàm toàn cục vì dòng ảnh trong bộ sưu tập được thêm ĐỘNG sau khi
 * trang đã tải — querySelectorAll một lần lúc khởi động sẽ bỏ sót chúng.
 */
function bindEncoders(root) {
    root.querySelectorAll('input[type="file"][data-encode-to]').forEach(function (picker) {
        if (picker.dataset.bound === '1') return; // tránh gắn 2 lần -> đọc file 2 lượt
        picker.dataset.bound = '1';

        var key = picker.dataset.encodeTo;

        picker.addEventListener('change', function () {
            var target = document.getElementById(key);
            // Ảnh xem trước: ô cố định dùng "<key>Preview", dòng bộ sưu tập dùng
            // data-preview-for vì nó nằm cùng dòng chứ không có id riêng.
            var preview = document.getElementById(key + 'Preview')
                || document.querySelector('[data-preview-for="' + key + '"]');

            var file = picker.files && picker.files[0];
            if (!file || !target) return;

            // Không chặn theo dung lượng nữa: shrinkImage luôn đưa kết quả về
            // ≤5MP nên thân POST bị chặn trên bất kể file gốc nặng bao nhiêu.
            picker.disabled = true; // ảnh lớn mất vài trăm ms -> chặn bấm lại giữa chừng
            shrinkImage(file, function (err, dataUrl, info) {
                picker.disabled = false;
                var note = function (text) {
                    var hint = picker.parentNode.querySelector('.upload-note');
                    if (!hint) {
                        hint = document.createElement('span');
                        hint.className = 'admin-hint upload-note';
                        picker.parentNode.appendChild(hint);
                    }
                    hint.textContent = text;
                };
                // Không dùng popup nữa. Đây là lỗi ĐỌC ĐĨA thật (file bị khoá, ổ
                // rút ra giữa chừng) — không thể im lặng, vì im lặng thì người
                // dùng bấm Lưu và tưởng ảnh đã vào.
                if (err) {
                    note('Không đọc được file, thử chọn lại.');
                    picker.value = '';
                    return;
                }
                target.value = dataUrl;
                if (preview) { preview.src = dataUrl; preview.hidden = false; }
                if (info && info.resized) {
                    var hint = picker.parentNode.querySelector('.upload-note');
                    if (!hint) {
                        hint = document.createElement('span');
                        hint.className = 'admin-hint upload-note';
                        picker.parentNode.appendChild(hint);
                    }
                    hint.textContent = 'Đã thu ' + info.from + ' → ' + info.to
                        + ' (' + Math.round(dataUrl.length / 1024) + 'KB).';
                }
            });
        });
    });
}
