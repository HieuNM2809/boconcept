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
                '<input type="file" accept="image/png,image/jpeg,image/webp" data-encode-to="' + id + '" data-max-kb="600">' +
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
        var maxKb = parseInt(picker.dataset.maxKb, 10) || 200;

        picker.addEventListener('change', function () {
            var target = document.getElementById(key);
            // Ảnh xem trước: ô cố định dùng "<key>Preview", dòng bộ sưu tập dùng
            // data-preview-for vì nó nằm cùng dòng chứ không có id riêng.
            var preview = document.getElementById(key + 'Preview')
                || document.querySelector('[data-preview-for="' + key + '"]');

            var file = picker.files && picker.files[0];
            if (!file || !target) return;

            // Chặn tại client: body parser giới hạn 1MB mà base64 phình ~33%.
            if (file.size > maxKb * 1024) {
                window.alert('File nặng ' + Math.round(file.size / 1024) + 'KB, vượt giới hạn ' + maxKb + 'KB.');
                picker.value = '';
                return;
            }

            var reader = new FileReader();
            reader.onload = function () {
                target.value = reader.result;
                if (preview) { preview.src = reader.result; preview.hidden = false; }
            };
            reader.onerror = function () { window.alert('Không đọc được file.'); };
            reader.readAsDataURL(file);
        });
    });
}
