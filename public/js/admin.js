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

    // ── Khe slider của lưới ảnh trang chủ: thêm/xóa dòng động ─────────────────
    // Giống galleryRows ở trên nhưng mỗi dòng mang THÊM alt_vi[]/alt_en[]. Ba mảng
    // đi song song theo thứ tự DOM, controller ghép theo chỉ số — nên mỗi dòng
    // phải luôn đóng góp đủ cả ba ô, kể cả khi admin để trống.
    var slotRows = document.getElementById('slotRows');
    var addSlotBtn = document.getElementById('addSlotRow');
    if (slotRows && addSlotBtn) {
        var slotWarn = document.getElementById('slotRowsWarn');
        var slotSeq = slotRows.querySelectorAll('.slot-row').length;

        function syncSlotWarn() {
            if (slotWarn) slotWarn.hidden = slotRows.querySelectorAll('.slot-row').length <= 8;
        }

        addSlotBtn.addEventListener('click', function () {
            var id = 'slotimg_new' + (slotSeq++);
            var row = document.createElement('div');
            row.className = 'gallery-row slot-row';
            // Cấu trúc phải khớp Y HỆT dòng render sẵn trong gallery-form.ejs —
            // lệch một thẻ bọc là dòng mới thêm hiển thị khác hẳn dòng đã có.
            row.innerHTML =
                '<img class="gallery-row-thumb" alt="" hidden data-preview-for="' + id + '">' +
                '<div class="slot-row-fields">' +
                    '<input type="file" accept="image/*" data-encode-to="' + id + '">' +
                    // Tên phải khớp whitelist hpp — xem admin.gallery.controller.js
                    '<input type="text" id="' + id + '" name="slot_image[]" placeholder="https://...">' +
                    '<div class="slot-row-alts">' +
                        '<input type="text" name="slot_alt_vi[]" placeholder="Mô tả VI">' +
                        '<input type="text" name="slot_alt_en[]" placeholder="Mô tả EN">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="btn-sm danger" data-remove-row>Xóa</button>';
            slotRows.appendChild(row);
            bindEncoders(row); // dòng mới cũng phải nhận được nút chọn file
            syncSlotWarn();
        });

        slotRows.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-remove-row]');
            if (!btn) return;
            // Chặn xoá dòng cuối: khe rỗng bị service từ chối, admin sẽ nhận
            // trang lỗi thay vì hiểu ra là phải còn ít nhất một ảnh.
            if (slotRows.querySelectorAll('.slot-row').length <= 1) {
                window.alert('Khe phải còn ít nhất một ảnh. Hãy thay ảnh thay vì xoá dòng cuối.');
                return;
            }
            btn.closest('.slot-row').remove();
            syncSlotWarn();
        });

        syncSlotWarn();
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

        // Ctrl/Cmd+B, Ctrl/Cmd+I — gõ tới đâu định dạng tới đó, khỏi rời tay khỏi
        // bàn phím. Chỉ hai phím này: các nút còn lại là định dạng theo DÒNG nên
        // phím tắt dễ đụng với phím tắt sẵn có của trình duyệt.
        ta.addEventListener('keydown', function (ev) {
            if (!(ev.ctrlKey || ev.metaKey) || ev.altKey || ev.shiftKey) return;
            var k = String(ev.key || '').toLowerCase();
            var mark = k === 'b' ? '**' : (k === 'i' ? '*' : null);
            if (!mark) return;
            ev.preventDefault();
            apply(function (sel) { return {text: mark + (sel || 'chữ') + mark, caret: mark.length}; });
        });

        // ── Xem trước ─────────────────────────────────────────────────────────
        // HTML do SERVER dựng (POST /admin/preview) bằng đúng richtext.helper mà
        // trang public dùng — xem trước và trang thật không thể lệch nhau.
        var pane = document.querySelector('[data-preview-pane="' + bar.dataset.editorFor + '"]');
        var previewBtn = bar.querySelector('[data-preview]');
        var previewOn = false;

        function setPreview(on) {
            previewOn = on;
            ta.hidden = on;
            pane.hidden = !on;
            previewBtn.classList.toggle('is-on', on);
            previewBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            // Textarea bị ẩn thì tiêu điểm rơi ra ngoài -> dời sang chính nút,
            // để phím tắt bật/tắt vẫn nhận được và Tab không nhảy về đầu trang.
            if (!on) { ta.focus(); return; }
            previewBtn.focus();

            // Chiều cao tối thiểu bằng đúng textarea đang có: không thì bấm xem
            // trước là cả form giật lên vài trăm pixel rồi lại tụt xuống.
            pane.style.minHeight = ta.offsetHeight + 'px';
            pane.innerHTML = '<p class="editor-preview-empty">Đang dựng…</p>';

            fetch('/admin/preview', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: ta.value}),
            })
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
                .then(function (d) {
                    // Chuỗi này là output của richtext.helper: nó escape sạch đầu
                    // vào rồi mới sinh thẻ, nên gán innerHTML ở đây không mở đường
                    // XSS. Tuyệt đối không gán innerHTML bằng ta.value thô.
                    pane.innerHTML = d.html || '<p class="editor-preview-empty">Chưa có nội dung.</p>';
                })
                .catch(function () {
                    pane.innerHTML = '<p class="editor-preview-empty">Không dựng được bản xem trước. Kiểm tra kết nối rồi thử lại.</p>';
                });
        }

        if (pane && previewBtn) {
            previewBtn.addEventListener('click', function () { setPreview(!previewOn); });
            // Ctrl/Cmd+Shift+P — gắn trên CẢ khung .editor chứ không riêng
            // textarea: lúc đang xem trước textarea bị ẩn nên không nhận được
            // phím nào, và người dùng sẽ không tắt lại được bằng bàn phím.
            bar.closest('.editor').addEventListener('keydown', function (ev) {
                if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && String(ev.key).toLowerCase() === 'p') {
                    ev.preventDefault();
                    setPreview(!previewOn);
                }
            });
        }

        bar.addEventListener('click', function (ev) {
            var btn = ev.target.closest('button');
            if (!btn || btn.dataset.preview) return;

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
                // Vùng chọn phải chốt lại TRƯỚC khi mở hộp thoại: đưa con trỏ sang
                // ô nhập của hộp thoại là textarea mất tiêu điểm, selectionStart/End
                // không còn đáng tin lúc người dùng bấm "Chèn".
                var s0 = ta.selectionStart, e0 = ta.selectionEnd;
                var restore = function () { ta.focus(); ta.setSelectionRange(s0, e0); };
                openLinkModal(ta.value.slice(s0, e0), function (url, label) {
                    restore();
                    apply(function (sel) {
                        var text = label || sel || 'chữ hiển thị';
                        return {text: '[' + text + '](' + url + ')', caret: 1, select: text.length};
                    });
                }, restore); // đóng bằng Esc/Hủy cũng phải trả con trỏ về đúng chỗ cũ
            }
        });
    });

    bindEncoders(document);
    bindDropzones(document);
})();

/* ── Hộp thoại "Chèn liên kết" ────────────────────────────────────────────────
   Thay cho window.prompt: prompt không tạo kiểu được, không kiểm tra được địa
   chỉ trước khi chèn, và trên vài trình duyệt còn kèm ô "chặn hộp thoại khác"
   làm admin mất luôn nút chèn link.

   Dựng bằng JS thay vì thêm partial EJS vào từng form: hộp thoại phải nằm NGOÀI
   <form> (nút bên trong form dễ vô tình submit), và form admin nào thêm sau này
   cũng có ngay mà không phải nhớ include. */
var linkModal = null;

// Bản sao của safeHref trong app/Helpers/richtext.helper.js. Server vẫn là nơi
// quyết định (link sai bị bỏ, chỉ còn lại chữ) — kiểm ở đây chỉ để admin biết
// NGAY là địa chỉ sai, thay vì lưu xong mới phát hiện link biến mất.
function isSafeHref(raw) {
    var url = String(raw).trim();
    return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || /^#[\w-]*$/.test(url);
}

function buildLinkModal() {
    var el = document.createElement('div');
    el.className = 'modal';
    el.hidden = true;
    el.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="linkModalTitle">' +
            '<div class="modal-head">' +
                '<h2 id="linkModalTitle">Chèn liên kết</h2>' +
                '<button type="button" class="modal-x" data-modal-close aria-label="Đóng">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<label for="linkModalUrl">Địa chỉ</label>' +
                '<input type="text" id="linkModalUrl" autocomplete="off" spellcheck="false" ' +
                       'placeholder="https://... hoặc /duong-dan-trong-web">' +
                '<p class="modal-error" hidden></p>' +
                '<label for="linkModalText">Chữ hiển thị</label>' +
                '<input type="text" id="linkModalText" autocomplete="off" ' +
                       'placeholder="Để trống thì lấy chữ đang bôi đen">' +
            '</div>' +
            '<div class="modal-foot">' +
                '<button type="button" class="btn-sm" data-modal-close>Hủy</button>' +
                '<button type="button" class="btn-sm modal-ok">Chèn liên kết</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(el);
    return el;
}

function openLinkModal(selected, onSubmit, onClose) {
    if (!linkModal) linkModal = buildLinkModal();

    var url = linkModal.querySelector('#linkModalUrl');
    var text = linkModal.querySelector('#linkModalText');
    var error = linkModal.querySelector('.modal-error');
    var okBtn = linkModal.querySelector('.modal-ok');

    url.value = '';
    text.value = selected || '';
    error.hidden = true;
    url.classList.remove('is-error');
    linkModal.hidden = false;
    // Chặn trang nền cuộn sau lưng hộp thoại
    document.body.classList.add('modal-open');
    url.focus();

    function close() {
        linkModal.hidden = true;
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', onKey);
        linkModal.removeEventListener('click', onClick);
        okBtn.removeEventListener('click', submit);
        url.removeEventListener('input', clearError);
        if (onClose) onClose();
    }

    function clearError() { error.hidden = true; url.classList.remove('is-error'); }

    function submit() {
        var v = url.value.trim();
        if (!v) return fail('Hãy nhập địa chỉ liên kết.');
        if (!isSafeHref(v)) return fail('Chỉ nhận http://…, https://…, đường dẫn nội bộ bắt đầu bằng / hoặc neo #.');

        // Cú pháp [chữ](địa chỉ) vỡ nếu địa chỉ có dấu cách hay ')' — mã hoá lại
        // thay vì để link hỏng âm thầm sau khi lưu.
        var href = v.replace(/ /g, '%20').replace(/\)/g, '%29');
        // Tương tự: ']' trong chữ hiển thị sẽ cắt cụt nhãn.
        var label = text.value.trim().replace(/[[\]]/g, '');
        close();
        onSubmit(href, label);
    }

    function fail(msg) {
        error.textContent = msg;
        error.hidden = false;
        url.classList.add('is-error');
        url.focus();
    }

    function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); close(); }
        else if (ev.key === 'Enter' && (ev.target === url || ev.target === text)) { ev.preventDefault(); submit(); }
    }

    function onClick(ev) {
        if (ev.target.closest('[data-modal-close]')) close();
    }

    document.addEventListener('keydown', onKey);
    linkModal.addEventListener('click', onClick);
    okBtn.addEventListener('click', submit);
    url.addEventListener('input', clearError);
}

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

        // Chỗ ghi thông báo: vùng kéo–thả đặt sẵn một ô [data-note-for] NGOÀI
        // khung (chèn vào trong sẽ nằm dưới lớp phủ của ô file); dòng bộ sưu tập
        // không có nên vẫn tự tạo cạnh ô chọn file như trước.
        function note(text) {
            var hint = document.querySelector('[data-note-for="' + key + '"]')
                || picker.parentNode.querySelector('.upload-note');
            if (!hint) {
                hint = document.createElement('span');
                hint.className = 'admin-hint upload-note';
                picker.parentNode.appendChild(hint);
            }
            hint.textContent = text;
        }

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
            // Chỉ báo tiến trình ở vùng kéo–thả (có sẵn ô hiển thị). Dòng bộ sưu
            // tập là lưới cột cố định — chèn thêm chữ vào đó sẽ đội thêm một hàng.
            if (document.querySelector('[data-note-for="' + key + '"]')) note('Đang xử lý ảnh…');
            shrinkImage(file, function (err, dataUrl, info) {
                picker.disabled = false;
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
                showImage(picker, true);
                var size = Math.round(dataUrl.length / 1024) + 'KB';
                if (info && info.resized) note('Đã thu ' + info.from + ' → ' + info.to + ' (' + size + ').');
                else if (document.querySelector('[data-note-for="' + key + '"]')) note('Đã chọn ảnh (' + size + '). Bấm Lưu để áp dụng.');
            });
        });
    });
}

/** Bật/tắt trạng thái "đã có ảnh" của vùng kéo–thả chứa `el` (nếu có). */
function showImage(el, on) {
    var zone = el.closest ? el.closest('.dropzone') : null;
    if (zone) zone.classList.toggle('has-image', on);
}

/**
 * Vùng kéo–thả ảnh: chỉ lo phần "nhìn thấy được".
 *
 * Việc nhận file khi thả đã do chính <input type=file> phủ kín khung đảm nhiệm —
 * ở đây chỉ tô viền lúc kéo qua, xử lý nút "Xoá ảnh", và đồng bộ ảnh xem trước
 * khi admin dán thẳng đường dẫn vào ô text.
 */
function bindDropzones(root) {
    root.querySelectorAll('[data-dropzone]').forEach(function (zone) {
        if (zone.dataset.bound === '1') return;
        zone.dataset.bound = '1';

        var picker = zone.querySelector('.dropzone-input');
        var key = picker && picker.dataset.encodeTo;
        var target = key && document.getElementById(key);
        var preview = key && document.getElementById(key + 'Preview');
        var clearBtn = zone.querySelector('.dropzone-clear');
        var note = document.querySelector('[data-note-for="' + key + '"]');

        // dragenter/dragover bắn liên tục trên từng thẻ con -> đếm thay vì
        // bật/tắt trực tiếp, không thì viền nhấp nháy khi rê qua chữ bên trong.
        var depth = 0;
        zone.addEventListener('dragenter', function () { if (++depth === 1) zone.classList.add('is-drag'); });
        zone.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; zone.classList.remove('is-drag'); } });
        zone.addEventListener('drop', function () { depth = 0; zone.classList.remove('is-drag'); });

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                if (target) target.value = '';
                if (picker) picker.value = '';
                if (preview) { preview.removeAttribute('src'); preview.hidden = true; }
                if (note) note.textContent = '';
                zone.classList.remove('has-image');
            });
        }

        // Dán URL vào ô text cũng phải hiện ảnh xem trước — nếu không, ô vẫn báo
        // "kéo thả ảnh vào đây" trong khi form đã có ảnh, trông như chưa nhận.
        if (target) {
            target.addEventListener('input', function () {
                var v = target.value.trim();
                if (v && preview) { preview.src = v; preview.hidden = false; }
                zone.classList.toggle('has-image', !!v);
            });
        }
    });
}
