(function () {
    'use strict';
    // Xác nhận trước khi submit form có data-confirm (vd: xóa sản phẩm).
    // Thay window.confirm bằng hộp thoại riêng: hộp mặc định của trình duyệt không
    // tô đỏ được hành động xoá, không kèm được tên món đang xoá, và Chrome sẽ hiện
    // ô "chặn hộp thoại" nếu admin xoá liên tiếp vài lần.
    document.querySelectorAll('form[data-confirm]').forEach(function (f) {
        f.addEventListener('submit', function (e) {
            if (f.dataset.confirmed === '1') return; // đã xác nhận -> cho đi thẳng
            e.preventDefault();
            var btn = f.querySelector('[type=submit]');
            openConfirmModal({
                title: f.dataset.confirmTitle || 'Xác nhận xóa',
                message: f.dataset.confirm,
                name: f.dataset.confirmName || '',
                okLabel: f.dataset.confirmOk || 'Xóa',
                onOk: function () {
                    // Khoá nút lại: xoá là POST, bấm hai lần sẽ bắn hai request và
                    // lần thứ hai ăn 404 vì hàng đã biến mất.
                    f.dataset.confirmed = '1';
                    if (btn) { btn.disabled = true; btn.textContent = 'Đang xóa…'; }
                    if (f.requestSubmit) f.requestSubmit(); else f.submit();
                },
            });
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
        var slotCount = document.getElementById('slotRowsCount');
        var slotSeq = slotRows.querySelectorAll('.slot-row').length;
        // Trần do view khai (data-max-rows) — phải khớp GalleryService.MAX_IMAGES_PER_SLOT.
        // Đây chỉ là hàng rào cho dễ dùng; server mới là chỗ chặn thật.
        var slotMax = parseInt(slotRows.dataset.maxRows, 10) || 10;

        function slotRowCount() { return slotRows.querySelectorAll('.slot-row').length; }

        function syncSlotWarn() {
            var n = slotRowCount();
            // Tắt nút thay vì để bấm rồi báo lỗi: dòng thứ 11 mà thêm được thì admin
            // ngồi chọn ảnh xong mới ăn lỗi lúc lưu — mất công vô ích.
            addSlotBtn.disabled = n >= slotMax;
            if (slotCount) slotCount.textContent = n + '/' + slotMax + ' ảnh';
            if (slotWarn) slotWarn.hidden = n < slotMax;
        }

        addSlotBtn.addEventListener('click', function () {
            if (slotRowCount() >= slotMax) return; // chặn cả khi nút bị bật lại bằng devtools
            var id = 'slotimg_new' + (slotSeq++);
            var row = document.createElement('div');
            row.className = 'gallery-row slot-row';
            // Cấu trúc phải khớp Y HỆT dòng render sẵn trong gallery-form.ejs —
            // lệch một thẻ bọc là dòng mới thêm hiển thị khác hẳn dòng đã có.
            row.innerHTML =
                '<img class="gallery-row-thumb" alt="" hidden data-preview-for="' + id + '">' +
                '<div class="slot-row-fields">' +
                    '<label class="slot-field">Ảnh từ máy' +
                        '<input type="file" accept="image/*" data-encode-to="' + id + '">' +
                    '</label>' +
                    // Tên phải khớp whitelist hpp — xem admin.gallery.controller.js
                    '<label class="slot-field">Đường dẫn ảnh' +
                        '<input type="text" id="' + id + '" name="slot_image[]" placeholder="https://...">' +
                    '</label>' +
                    '<div class="slot-row-alts">' +
                        '<label class="slot-field">Mô tả ảnh (VI)' +
                            '<input type="text" name="slot_alt_vi[]" placeholder="Dùng cho trình đọc màn hình">' +
                        '</label>' +
                        '<label class="slot-field">Mô tả ảnh (EN)' +
                            '<input type="text" name="slot_alt_en[]">' +
                        '</label>' +
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

        // ── Kho ảnh: giấu chuỗi base64 khỏi ô soạn thảo ───────────────────────
        // Một tấm ảnh nhúng dài ~400 nghìn ký tự. Để nguyên giữa bài thì admin
        // phải cuộn hàng chục màn hình chữ rác mới tới đoạn kế tiếp. Nên trong
        // ô soạn thảo chỉ để lại ![mô tả][anh-1], còn địa chỉ thật nằm ở đây và
        // đi kèm form qua một input ẩn — server nối lại
        // (app/Http/Middleware/richtextImages.middleware.js).
        var RE_DEF = /^\[([^\]\s]{1,64})\]:\s*(\S+)$/;
        var imgDefs = [];   // [{id, url}] — giữ đúng thứ tự đã chèn
        var store = null;   // input ẩn, chỉ tạo khi thật sự có ảnh

        function defsText() {
            return imgDefs.map(function (d) { return '[' + d.id + ']: ' + d.url; }).join('\n');
        }

        /** Nội dung ĐẦY ĐỦ như lúc sẽ lưu — dùng cho xem trước. */
        function fullText() {
            var defs = defsText();
            return defs ? ta.value.replace(/\s+$/, '') + '\n\n' + defs + '\n' : ta.value;
        }

        /**
         * Đồng bộ input ẩn, đồng thời DỌN các định nghĩa không còn ai dùng: admin
         * xoá ![x][anh-2] khỏi bài mà giữ lại định nghĩa thì trường nội dung cứ
         * phình mãi, mỗi lần lưu lại kéo theo một tấm ảnh chết.
         */
        function syncStore() {
            var txt = ta.value;
            imgDefs = imgDefs.filter(function (d) { return txt.indexOf('][' + d.id + ']') !== -1; });
            if (!store) {
                var form = ta.form;
                if (!form) return;
                store = document.createElement('input');
                store.type = 'hidden';
                store.name = ta.name + '__imgs';
                form.appendChild(store);
            }
            store.value = defsText();
        }

        function nextImgId() {
            var taken = {};
            imgDefs.forEach(function (d) { taken[d.id.toLowerCase()] = 1; });
            // Dò cả nội dung đang có: bài cũ có thể tham chiếu nhãn mà định nghĩa
            // đã bị xoá — trùng lại nhãn đó là ảnh mới nhảy vào đúng chỗ ảnh cũ.
            var n = 1;
            while (taken['anh-' + n] || ta.value.indexOf('][anh-' + n + ']') !== -1) n++;
            return 'anh-' + n;
        }

        // Lúc mở form: bóc định nghĩa ra khỏi textarea (server render nguyên văn
        // cả hai phần). Chạy một lần, trước khi admin kịp gõ gì.
        (function hoistDefs() {
            var body = [];
            ta.value.split('\n').forEach(function (l) {
                var m = l.trim().match(RE_DEF);
                if (m) imgDefs.push({id: m[1], url: m[2]});
                else body.push(l);
            });
            var text = body.join('\n');
            var had = imgDefs.length;

            // Bài lưu TRƯỚC khi có kho ảnh còn nhúng thẳng ![x](data:image/…) vào
            // giữa câu. Gom nốt về kho ngay khi mở form, nếu không admin vẫn phải
            // nhìn đúng đống chữ rác cũ trên mọi bài đã có. Kết quả dựng ra HTML
            // y hệt, nên đây là đổi cách lưu chứ không đổi nội dung.
            var moved = 0;
            text = text.replace(/!\[([^\]\n]*)\]\((data:[^()\s]+)\)/g, function (m, alt, url) {
                var id = nextImgId();
                imgDefs.push({id: id, url: url});
                moved++;
                return '![' + alt + '][' + id + ']';
            });

            if (!had && !moved) return;
            ta.value = text.replace(/\n+$/, '\n');
            syncStore();
        })();

        // Chốt lần cuối ngay trước khi gửi: bắt được cả trường hợp admin xoá thẻ
        // ảnh bằng tay rồi bấm Lưu mà không chèn thêm ảnh nào.
        if (ta.form) ta.form.addEventListener('submit', function () { if (store) syncStore(); });

        function apply(fn) {
            var s = ta.selectionStart, e = ta.selectionEnd;
            var sel = ta.value.slice(s, e);
            var r = fn(sel);

            ta.focus();
            ta.setSelectionRange(s, e);
            // execCommand('insertText') GIỮ ĐƯỢC ngăn xếp hoàn tác của trình duyệt;
            // gán thẳng ta.value thì xoá sạch nó — bấm Đậm xong Ctrl+Z không quay
            // lại được, mà thanh công cụ lại có nút Hoàn tác. execCommand tuy đã
            // deprecated nhưng đây là cách DUY NHẤT làm được việc này trên textarea.
            var ok = false;
            try { ok = document.execCommand('insertText', false, r.text); } catch (err) { ok = false; }
            if (!ok) ta.value = ta.value.slice(0, s) + r.text + ta.value.slice(e);

            ta.setSelectionRange(s + r.caret, s + r.caret + (r.select == null ? sel.length : r.select));
            // Chế độ chia đôi phải vẽ lại: input event không bắn khi sửa bằng script
            ta.dispatchEvent(new Event('input', {bubbles: true}));
        }

        // Khối nhiều dòng: phải nằm trên dòng riêng và cách đoạn trên bằng một
        // dòng trống, không thì renderer gom nó vào <p> của đoạn đang gõ dở.
        var BLOCKS = {
            table: '| Cột 1 | Cột 2 |\n|---|---|\n| Nội dung | Nội dung |',
            hr: '---',
        };

        function insertBlock(text) {
            var before = ta.value.slice(0, ta.selectionStart);
            var lead = !before ? '' : (/\n\n$/.test(before) ? '' : (/\n$/.test(before) ? '\n' : '\n\n'));
            apply(function () {
                return {text: lead + text + '\n\n', caret: lead.length + text.length + 2, select: 0};
            });
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
        var wrap = bar.closest('.editor');
        var pane = document.querySelector('[data-preview-pane="' + bar.dataset.editorFor + '"]');
        var previewBtn = bar.querySelector('[data-preview]');
        var splitBtn = bar.querySelector('[data-split]');
        var fullBtn = bar.querySelector('[data-full]');
        var previewOn = false;
        var splitOn = false;
        var fullOn = false;

        function renderPreview() {
            pane.innerHTML = '<p class="editor-preview-empty">Đang dựng…</p>';
            fetch('/admin/preview', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                // fullText() chứ không phải ta.value: định nghĩa ảnh đã bị bóc ra
                // khỏi textarea, gửi thiếu là xem trước mất sạch ảnh.
                body: JSON.stringify({text: fullText()}),
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

        function setPreview(on) {
            previewOn = on;
            if (on && splitOn) setSplit(false); // hai chế độ loại trừ nhau
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
            renderPreview();
        }

        // Chia đôi: gõ bên trái, kết quả bên phải, cập nhật sau khi ngừng gõ.
        function setSplit(on) {
            splitOn = on;
            if (on && previewOn) setPreview(false);
            wrap.classList.toggle('is-split', on);
            if (splitBtn) {
                splitBtn.classList.toggle('is-on', on);
                splitBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
            ta.hidden = false;
            pane.hidden = !on;
            if (on) { pane.style.minHeight = ''; renderPreview(); }
        }

        // Gọi /admin/preview sau mỗi lần gõ sẽ bắn hàng chục request một câu ->
        // chỉ dựng lại khi đã ngừng gõ 400ms.
        var typeTimer = null;
        ta.addEventListener('input', function () {
            if (!splitOn) return;
            clearTimeout(typeTimer);
            typeTimer = setTimeout(renderPreview, 400);
        });

        function setFull(on) {
            fullOn = on;
            wrap.classList.toggle('is-full', on);
            // Khoá cuộn trang nền, nếu không cuộn chuột trong ô sẽ kéo cả trang phía sau
            document.body.classList.toggle('editor-full-open', on);
            if (fullBtn) {
                fullBtn.classList.toggle('is-on', on);
                fullBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }
            if (on) ta.focus();
        }

        if (pane && previewBtn) {
            previewBtn.addEventListener('click', function () { setPreview(!previewOn); });
        }
        // Phím tắt gắn trên CẢ khung .editor chứ không riêng textarea: lúc đang
        // xem trước textarea bị ẩn nên không nhận được phím nào, và người dùng sẽ
        // không tắt lại được bằng bàn phím.
        wrap.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && fullOn) { ev.preventDefault(); setFull(false); return; }
            if (!(ev.ctrlKey || ev.metaKey) || !ev.shiftKey) return;
            var k = String(ev.key).toLowerCase();
            if (k === 'p') { ev.preventDefault(); setPreview(!previewOn); }
            else if (k === 's' && splitBtn) { ev.preventDefault(); setSplit(!splitOn); }
        });

        bar.addEventListener('click', function (ev) {
            var btn = ev.target.closest('button');
            if (!btn || btn.dataset.preview) return;

            if (btn.dataset.block) {
                insertBlock(BLOCKS[btn.dataset.block] || '');
            } else if (btn.dataset.history) {
                // Hoàn tác/Làm lại của CHÍNH trình duyệt — dùng được vì mọi thao
                // tác chèn ở trên đều đi qua execCommand nên nằm trong ngăn xếp đó.
                ta.focus();
                try { document.execCommand(btn.dataset.history); } catch (err) { /* trình duyệt không cho thì thôi */ }
            } else if (btn.dataset.split) {
                setSplit(!splitOn);
            } else if (btn.dataset.full) {
                setFull(!fullOn);
            } else if (btn.dataset.help) {
                openHelpModal();
            } else if (btn.dataset.image) {
                // Chốt vùng chọn TRƯỚC khi mở hộp thoại, như nút Link
                var is0 = ta.selectionStart, ie0 = ta.selectionEnd;
                var restoreImg = function () { ta.focus(); ta.setSelectionRange(is0, ie0); };
                openImageModal(ta.value.slice(is0, ie0), function (src, alt) {
                    restoreImg();
                    // CHỈ ảnh nhúng base64 mới đẩy vào kho. Địa chỉ http bình
                    // thường dài vài chục ký tự, giấu đi chỉ làm admin khó sửa
                    // hơn — cứ để thẳng trong bài như cũ.
                    var ref = null;
                    if (/^data:/i.test(src)) {
                        ref = nextImgId();
                        imgDefs.push({id: ref, url: src});
                    }
                    apply(function (sel) {
                        var text = alt || sel || 'mô tả ảnh';
                        var tail = ref ? '][' + ref + ']' : '](' + src + ')';
                        return {text: '![' + text + tail, caret: 2, select: text.length};
                    });
                    // Sau apply: syncStore lọc theo nội dung textarea, gọi trước
                    // thì thẻ ảnh chưa có trong bài và định nghĩa vừa thêm bị dọn ngay.
                    if (ref) syncStore();
                }, restoreImg);
            } else if (btn.dataset.wrap) {
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

    // ── Nhóm ô ẩn/hiện theo một công tắc ──────────────────────────────────────
    // Dùng ở form slide ("Thêm chữ lên ảnh"). Khi tắt, các ô con bị `disabled` chứ
    // không chỉ `hidden`: ô ẩn VẪN được gửi lên server, nên chỉ ẩn thôi thì tắt
    // công tắc xong bấm Lưu, chữ cũ vẫn nằm nguyên trong DB. `disabled` -> trường
    // không có trong req.body -> service ghi null -> chữ biến mất khỏi trang chủ.
    document.querySelectorAll('[data-toggle-fields]').forEach(function (cb) {
        var box = document.getElementById(cb.dataset.toggleFields);
        if (!box) return;

        function sync() {
            box.hidden = !cb.checked;
            box.querySelectorAll('input, textarea, select').forEach(function (f) {
                f.disabled = !cb.checked;
            });
        }

        cb.addEventListener('change', sync);
        sync();
    });

    bindEncoders(document);
    bindDropzones(document);
})();

/* ── Hộp thoại xác nhận (xóa) ─────────────────────────────────────────────────
   Dùng chung cho mọi form có data-confirm nên cả 8 màn danh sách admin đều được,
   không phải sửa từng view. Thuộc tính đọc trên form:
     data-confirm       nội dung câu hỏi (bắt buộc — có nó mới bật xác nhận)
     data-confirm-name  tên món đang xoá, hiện đậm để admin đối chiếu
     data-confirm-title tiêu đề, mặc định "Xác nhận xóa"
     data-confirm-ok    chữ trên nút đỏ, mặc định "Xóa" */
var confirmModal = null;

function buildConfirmModal() {
    var el = document.createElement('div');
    el.className = 'modal modal-confirm';
    el.hidden = true;
    el.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        // alertdialog (không phải dialog): báo cho trình đọc màn hình đây là cảnh
        // báo cần trả lời ngay, nội dung được đọc lên khi hộp mở.
        '<div class="modal-card" role="alertdialog" aria-modal="true" ' +
             'aria-labelledby="confirmModalTitle" aria-describedby="confirmModalMsg">' +
            '<div class="modal-head">' +
                '<h2 id="confirmModalTitle">Xác nhận xóa</h2>' +
                '<button type="button" class="modal-x" data-modal-close aria-label="Đóng">&times;</button>' +
            '</div>' +
            '<div class="modal-body confirm-body">' +
                '<span class="confirm-icon" aria-hidden="true">' +
                    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
                         'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>' +
                    '</svg>' +
                '</span>' +
                '<div class="confirm-text">' +
                    '<p id="confirmModalMsg" class="confirm-msg"></p>' +
                    '<p class="confirm-name" hidden></p>' +
                    '<p class="confirm-note">Sau khi xóa, mục này biến mất khỏi website và khỏi trang quản trị.</p>' +
                '</div>' +
            '</div>' +
            '<div class="modal-foot">' +
                '<button type="button" class="btn-sm" data-modal-close>Hủy</button>' +
                '<button type="button" class="btn-sm modal-ok is-danger">Xóa</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(el);
    return el;
}

function openConfirmModal(opts) {
    if (!confirmModal) confirmModal = buildConfirmModal();

    var titleEl = confirmModal.querySelector('#confirmModalTitle');
    var msgEl = confirmModal.querySelector('.confirm-msg');
    var nameEl = confirmModal.querySelector('.confirm-name');
    var okBtn = confirmModal.querySelector('.modal-ok');
    var cancelBtn = confirmModal.querySelector('.modal-foot [data-modal-close]');
    // Trả con trỏ về đúng nút vừa bấm khi đóng, nếu không tiêu điểm rơi về đầu
    // trang và người dùng bàn phím phải Tab lại từ đầu bảng.
    var opener = document.activeElement;

    titleEl.textContent = opts.title || 'Xác nhận xóa';
    msgEl.textContent = opts.message || 'Bạn có chắc chắn?';
    // textContent chứ KHÔNG innerHTML: tên sản phẩm do người dùng nhập, ghép
    // thẳng vào HTML là mở đường XSS ngay trong trang quản trị.
    nameEl.textContent = opts.name || '';
    nameEl.hidden = !opts.name;
    okBtn.textContent = opts.okLabel || 'Xóa';

    confirmModal.hidden = false;
    document.body.classList.add('modal-open');
    // Tiêu điểm đặt ở "Hủy", không phải "Xóa": gõ Enter theo quán tính ngay sau
    // khi bấm nút xóa thì không được xóa mất hàng.
    cancelBtn.focus();

    function close() {
        confirmModal.hidden = true;
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', onKey);
        confirmModal.removeEventListener('click', onClick);
        okBtn.removeEventListener('click', ok);
        if (opener && opener.focus) opener.focus();
    }

    function ok() {
        close();
        opts.onOk();
    }

    function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    }

    function onClick(ev) {
        if (ev.target.closest('[data-modal-close]')) close();
    }

    document.addEventListener('keydown', onKey);
    confirmModal.addEventListener('click', onClick);
    okBtn.addEventListener('click', ok);
}

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

/* ── Hộp thoại "Chèn ảnh" ─────────────────────────────────────────────────────
   Có cả ô chọn file: ảnh của web này được mã hoá base64 ngay tại trình duyệt rồi
   lưu vào DB (Railway xoá filesystem mỗi lần redeploy), nên "chọn từ máy" phải
   dùng lại đúng đường bindEncoders + shrinkImage như các ô ảnh khác. */
var imageModal = null;

// Bản sao của safeImageSrc trong richtext.helper.js — server vẫn là nơi quyết
// định, kiểm ở đây chỉ để admin biết NGAY thay vì lưu xong mới thấy ảnh biến mất.
function isSafeImageSrc(raw) {
    var url = String(raw).trim();
    if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return true;
    return isSafeHref(url);
}

function buildImageModal() {
    var el = document.createElement('div');
    el.className = 'modal';
    el.hidden = true;
    el.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="imgModalTitle">' +
            '<div class="modal-head">' +
                '<h2 id="imgModalTitle">Chèn ảnh</h2>' +
                '<button type="button" class="modal-x" data-modal-close aria-label="Đóng">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<label for="imgModalFile">Chọn từ máy</label>' +
                '<input type="file" id="imgModalFile" accept="image/*" data-encode-to="imgModalSrc">' +
                '<span class="admin-hint upload-note" data-note-for="imgModalSrc"></span>' +
                '<img class="modal-img-preview" id="imgModalSrcPreview" alt="" hidden>' +
                '<label for="imgModalSrc">Hoặc dán đường dẫn</label>' +
                '<input type="text" id="imgModalSrc" autocomplete="off" spellcheck="false" placeholder="https://…">' +
                '<p class="modal-error" hidden></p>' +
                '<label for="imgModalAlt">Mô tả ảnh</label>' +
                '<input type="text" id="imgModalAlt" autocomplete="off" placeholder="Trình đọc màn hình đọc dòng này">' +
            '</div>' +
            '<div class="modal-foot">' +
                '<button type="button" class="btn-sm" data-modal-close>Hủy</button>' +
                '<button type="button" class="btn-sm modal-ok">Chèn ảnh</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(el);
    bindEncoders(el); // ô chọn file dùng chung đường thu nhỏ + mã hoá base64
    return el;
}

function openImageModal(selected, onSubmit, onClose) {
    if (!imageModal) imageModal = buildImageModal();

    var src = imageModal.querySelector('#imgModalSrc');
    var alt = imageModal.querySelector('#imgModalAlt');
    var file = imageModal.querySelector('#imgModalFile');
    var img = imageModal.querySelector('#imgModalSrcPreview');
    var note = imageModal.querySelector('[data-note-for="imgModalSrc"]');
    var error = imageModal.querySelector('.modal-error');
    var okBtn = imageModal.querySelector('.modal-ok');

    src.value = '';
    alt.value = selected || '';
    file.value = '';
    note.textContent = '';
    img.hidden = true;
    img.removeAttribute('src'); // src="" bị hiểu là tải lại chính trang này
    error.hidden = true;
    src.classList.remove('is-error');
    imageModal.hidden = false;
    document.body.classList.add('modal-open');
    src.focus();

    function close() {
        imageModal.hidden = true;
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', onKey);
        imageModal.removeEventListener('click', onClick);
        okBtn.removeEventListener('click', submit);
        src.removeEventListener('input', clearError);
        if (onClose) onClose();
    }

    function clearError() { error.hidden = true; src.classList.remove('is-error'); }

    function submit() {
        var v = src.value.trim();
        if (!v) return fail('Hãy chọn ảnh từ máy hoặc dán đường dẫn.');
        if (!isSafeImageSrc(v)) return fail('Chỉ nhận http://…, https://…, đường dẫn nội bộ bắt đầu bằng / hoặc ảnh nhúng base64 (không nhận SVG).');
        // Ngoặc và dấu cách làm vỡ cú pháp ![](…) -> mã hoá lại thay vì để hỏng âm thầm
        var out = v.replace(/ /g, '%20').replace(/\)/g, '%29');
        var label = alt.value.trim().replace(/[[\]]/g, '');
        close();
        onSubmit(out, label);
    }

    function fail(msg) {
        error.textContent = msg;
        error.hidden = false;
        src.classList.add('is-error');
        src.focus();
    }

    function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); close(); }
        else if (ev.key === 'Enter' && (ev.target === src || ev.target === alt)) { ev.preventDefault(); submit(); }
    }

    function onClick(ev) { if (ev.target.closest('[data-modal-close]')) close(); }

    document.addEventListener('keydown', onKey);
    imageModal.addEventListener('click', onClick);
    okBtn.addEventListener('click', submit);
    src.addEventListener('input', clearError);
}

/* ── Hộp thoại "Cú pháp hỗ trợ" ───────────────────────────────────────────────
   Danh sách này phải khớp với app/Helpers/richtext.helper.js. Thêm cú pháp ở
   helper thì nhớ thêm một dòng ở đây, không thì admin không có cách nào biết. */
var helpModal = null;

var HELP_ROWS = [
    ['**đậm**', 'đậm'],
    ['*nghiêng*', 'nghiêng'],
    ['~~gạch ngang~~', 'gạch ngang'],
    ['`mã`', 'mã trong dòng'],
    ['x^2^', 'chỉ số trên (mũ)'],
    ['# … #### Tiêu đề', 'tiêu đề 4 mức'],
    ['- mục', 'gạch đầu dòng'],
    ['1. mục', 'danh sách đánh số'],
    ['&gt; câu', 'trích dẫn'],
    ['---', 'đường kẻ ngang'],
    ['``` … ```', 'khối mã (giữ nguyên xuống dòng)'],
    ['| A | B |', 'bảng — dòng 2 phải là |---|---|'],
    ['[chữ](https://…)', 'liên kết'],
    ['![mô tả](https://…)', 'ảnh theo đường dẫn'],
    ['![mô tả][anh-1]', 'ảnh tải từ máy — nút Ảnh tự đặt nhãn, chuỗi dữ liệu được cất riêng nên không làm rối ô soạn thảo'],
];

function openHelpModal() {
    if (!helpModal) {
        var rows = HELP_ROWS.map(function (r) {
            return '<tr><td><code>' + r[0] + '</code></td><td>' + r[1] + '</td></tr>';
        }).join('');
        helpModal = document.createElement('div');
        helpModal.className = 'modal';
        helpModal.hidden = true;
        helpModal.innerHTML =
            '<div class="modal-backdrop" data-modal-close></div>' +
            '<div class="modal-card modal-help" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">' +
                '<div class="modal-head">' +
                    '<h2 id="helpModalTitle">Cú pháp hỗ trợ</h2>' +
                    '<button type="button" class="modal-x" data-modal-close aria-label="Đóng">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<table class="help-table"><tbody>' + rows + '</tbody></table>' +
                    '<p class="admin-hint">Thẻ HTML gõ vào sẽ hiện ra thành chữ, không chạy.</p>' +
                '</div>' +
                '<div class="modal-foot"><button type="button" class="btn-sm modal-ok" data-modal-close>Đóng</button></div>' +
            '</div>';
        document.body.appendChild(helpModal);
        helpModal.addEventListener('click', function (ev) {
            if (ev.target.closest('[data-modal-close]')) closeHelp();
        });
    }
    helpModal.hidden = false;
    document.body.classList.add('modal-open');
    helpModal.querySelector('.modal-ok').focus();
    document.addEventListener('keydown', helpKey);
}

function helpKey(ev) { if (ev.key === 'Escape') { ev.preventDefault(); closeHelp(); } }

function closeHelp() {
    helpModal.hidden = true;
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', helpKey);
}

/* ── Hộp "Điều chỉnh ảnh" ─────────────────────────────────────────────────────
   Kéo để dời, lăn chuột / thanh trượt để phóng — đúng thao tác đổi ảnh đại diện
   hay ảnh bìa Facebook. Khung cắt lấy tỉ lệ từ `data-crop` của vùng kéo–thả.

   Cắt THẬT (ghi ra ảnh mới qua canvas) chứ không lưu toạ độ tiêu điểm: ảnh nằm
   trong DB dạng data URI và trang chủ vẽ slide bằng `background-image` + `cover`,
   nên lưu toạ độ sẽ phải thêm 2 cột DB + sửa home.ejs mà vẫn không phóng to được.
   Cắt thẳng còn làm ảnh nhẹ đi vì phần thừa bị bỏ luôn.

   Bù lại cho tính "một chiều" đó: bản GỐC trước khi cắt được giữ trong
   `cropOriginals` suốt phiên làm việc, nên bấm "Điều chỉnh ảnh" nhiều lần vẫn cắt
   từ ảnh gốc chứ không cắt chồng lên ảnh đã cắt. Tải lại trang thì mất bản gốc
   (nó không được lưu xuống server) và lần chỉnh sau sẽ cắt từ ảnh đang có. */
var cropModal = null;
var cropOriginals = Object.create(null); // id ô ảnh -> data URI trước khi cắt

var CROP_OUT_MAX_W = 1920;  // trần bề ngang ảnh xuất ra — hero rộng nhất cũng chỉ cần ngần này
var CROP_MIN_GOOD_W = 1400; // hẹp hơn mức này thì cảnh báo "sẽ hơi mờ"
var CROP_ZOOM_MAX = 4;      // phóng tối đa 4× so với mức vừa khít khung
// Tỉ lệ khung hero trên điện thoại (~390×460 ở breakpoint 560px) — dùng để vẽ
// đường nét đứt "vùng luôn hiện", vì màn dọc cắt bớt hai bên của ảnh ngang.
var CROP_MOBILE_RATIO = 0.85;

function buildCropModal() {
    var el = document.createElement('div');
    el.className = 'modal modal-crop';
    el.hidden = true;
    el.innerHTML =
        '<div class="modal-backdrop" data-modal-close></div>' +
        '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cropModalTitle">' +
            '<div class="modal-head">' +
                '<h2 id="cropModalTitle">Điều chỉnh ảnh</h2>' +
                '<button type="button" class="modal-x" data-modal-close aria-label="Đóng">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<p class="admin-hint crop-help">Kéo ảnh để chọn phần muốn hiện · lăn chuột hoặc kéo thanh bên dưới để phóng to.</p>' +
                // role="application" + tabindex: người dùng bàn phím Tab vào được
                // rồi dùng phím mũi tên, vì kéo chuột thì họ không thao tác được.
                '<div class="crop-frame" tabindex="0" role="application" ' +
                     'aria-label="Khung cắt ảnh. Dùng phím mũi tên để dời ảnh, phím + và − để phóng to thu nhỏ.">' +
                    '<img class="crop-img" alt="" draggable="false">' +
                    '<span class="crop-safe" aria-hidden="true">' +
                        '<span class="crop-safe-tag">Vùng luôn hiện trên điện thoại</span>' +
                    '</span>' +
                '</div>' +
                '<div class="crop-tools">' +
                    '<button type="button" class="crop-zoom-btn" data-zoom="-1" aria-label="Thu nhỏ">&minus;</button>' +
                    '<input type="range" class="crop-zoom" min="0" max="1000" value="0" step="1" aria-label="Mức phóng to">' +
                    '<button type="button" class="crop-zoom-btn" data-zoom="1" aria-label="Phóng to">+</button>' +
                    '<button type="button" class="btn-sm crop-reset">Đặt lại</button>' +
                '</div>' +
                '<p class="admin-hint crop-note"></p>' +
                '<p class="modal-error" hidden></p>' +
            '</div>' +
            '<div class="modal-foot">' +
                '<button type="button" class="btn-sm" data-modal-close>Hủy</button>' +
                '<button type="button" class="btn-sm modal-ok">Áp dụng</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(el);
    return el;
}

/**
 * Mở hộp điều chỉnh ảnh.
 * @param src      data URI hoặc đường dẫn ảnh cần cắt
 * @param ratioStr tỉ lệ khung dạng "21/9"
 * @param onApply  gọi với data URI đã cắt khi bấm "Áp dụng"
 */
function openCropModal(src, ratioStr, onApply) {
    if (!cropModal) cropModal = buildCropModal();

    var frame = cropModal.querySelector('.crop-frame');
    var img = cropModal.querySelector('.crop-img');
    var safe = cropModal.querySelector('.crop-safe');
    var zoom = cropModal.querySelector('.crop-zoom');
    var note = cropModal.querySelector('.crop-note');
    var error = cropModal.querySelector('.modal-error');
    var okBtn = cropModal.querySelector('.modal-ok');
    var tools = cropModal.querySelector('.crop-tools');
    var opener = document.activeElement;

    var parts = String(ratioStr || '21/9').split('/');
    var ratio = (parseFloat(parts[0]) || 21) / (parseFloat(parts[1]) || 9);

    // st.dx/dy = tâm ảnh lệch bao nhiêu pixel so với tâm khung (đơn vị pixel KHUNG).
    // st.scale = số pixel khung trên mỗi pixel ảnh gốc. min = mức vừa khít khung.
    var st = {fw: 0, fh: 0, scale: 1, min: 1, dx: 0, dy: 0};
    var nat = {w: 0, h: 0};
    var ready = false;
    // Giữ PNG là PNG: đổi sang JPEG sẽ biến nền trong suốt thành đen (cùng quy
    // tắc với shrinkImage bên dưới).
    var mime = /^data:image\/png/i.test(String(src)) ? 'image/png' : 'image/jpeg';

    frame.style.aspectRatio = String(ratio);
    // Ảnh ngang bị màn dọc cắt bớt hai bên: phần chắc chắn còn lại là dải giữa
    // rộng bằng (tỉ lệ điện thoại / tỉ lệ khung).
    safe.style.width = (100 * Math.min(1, CROP_MOBILE_RATIO / ratio)) + '%';

    error.hidden = true;
    note.textContent = '';
    note.classList.remove('is-warn');
    cropModal.hidden = false;
    document.body.classList.add('modal-open');

    function clamp() {
        // Không cho hở mép: tâm ảnh chỉ được lệch tối đa nửa phần ảnh dôi ra ngoài khung.
        var maxX = Math.max(0, (nat.w * st.scale - st.fw) / 2);
        var maxY = Math.max(0, (nat.h * st.scale - st.fh) / 2);
        st.dx = Math.min(maxX, Math.max(-maxX, st.dx));
        st.dy = Math.min(maxY, Math.max(-maxY, st.dy));
    }

    function render() {
        clamp();
        // Thứ tự quan trọng: scale chạy trước quanh tâm ảnh, hai translate sau đó
        // dời tâm đã phóng ấy về đúng chỗ. Đảo lại là ảnh nhảy khi phóng.
        img.style.transform = 'translate(-50%, -50%) translate(' + st.dx + 'px, ' + st.dy + 'px) scale(' + st.scale + ')';
        zoom.value = String(Math.round(1000 * (st.scale / st.min - 1) / (CROP_ZOOM_MAX - 1)));

        var outW = Math.min(CROP_OUT_MAX_W, Math.round(st.fw / st.scale));
        var outH = Math.max(1, Math.round(outW / ratio));
        var poor = outW < CROP_MIN_GOOD_W;
        note.textContent = 'Ảnh sau khi cắt: ' + outW + ' × ' + outH + ' px'
            + (poor ? ' — hơi nhỏ so với màn hình rộng, ảnh sẽ trông mềm nét. Bớt phóng to hoặc dùng ảnh gốc lớn hơn.' : '.');
        note.classList.toggle('is-warn', poor);
    }

    function fit() {
        st.fw = frame.clientWidth;
        st.fh = frame.clientHeight;
        st.min = Math.max(st.fw / nat.w, st.fh / nat.h);
    }

    function reset() {
        fit();
        st.scale = st.min;
        st.dx = 0;
        st.dy = 0;
        render();
    }

    // Phóng to/thu nhỏ luôn neo vào TÂM KHUNG: nhân dx/dy theo cùng hệ số thì
    // điểm ảnh đang nằm giữa khung vẫn đứng yên, không bị trôi đi mỗi lần chỉnh.
    function setScale(next) {
        var s = Math.min(st.min * CROP_ZOOM_MAX, Math.max(st.min, next));
        if (s === st.scale) return;
        var k = s / st.scale;
        st.dx *= k;
        st.dy *= k;
        st.scale = s;
        render();
    }

    function onLoad() {
        if (ready) return;
        ready = true;
        nat.w = img.naturalWidth || 1;
        nat.h = img.naturalHeight || 1;
        // Kích thước THẬT đặt bằng px để phép tính scale ở trên là tuyệt đối,
        // không phụ thuộc kiểu dáng ảnh kế thừa từ CSS admin.
        img.style.width = nat.w + 'px';
        img.style.height = nat.h + 'px';
        reset();
    }

    function onLoadError() {
        error.textContent = 'Không tải được ảnh để chỉnh. Thử chọn lại ảnh từ máy.';
        error.hidden = false;
    }

    // ── Kéo bằng chuột / ngón tay ─────────────────────────────────────────────
    var drag = null;

    function onDown(ev) {
        if (!ready || ev.button > 0) return;
        drag = {x: ev.clientX, y: ev.clientY, dx: st.dx, dy: st.dy};
        frame.classList.add('is-drag');
        if (frame.setPointerCapture) frame.setPointerCapture(ev.pointerId);
        ev.preventDefault();
    }

    function onMove(ev) {
        if (!drag) return;
        st.dx = drag.dx + (ev.clientX - drag.x);
        st.dy = drag.dy + (ev.clientY - drag.y);
        render();
    }

    function onUp() {
        drag = null;
        frame.classList.remove('is-drag');
    }

    function onWheel(ev) {
        if (!ready) return;
        ev.preventDefault();
        setScale(st.scale * (ev.deltaY < 0 ? 1.12 : 1 / 1.12));
    }

    function onFrameKey(ev) {
        if (!ready) return;
        var step = ev.shiftKey ? 30 : 8;
        if (ev.key === 'ArrowLeft') { st.dx += step; }
        else if (ev.key === 'ArrowRight') { st.dx -= step; }
        else if (ev.key === 'ArrowUp') { st.dy += step; }
        else if (ev.key === 'ArrowDown') { st.dy -= step; }
        else if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); return setScale(st.scale * 1.12); }
        else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); return setScale(st.scale / 1.12); }
        else return;
        ev.preventDefault();
        render();
    }

    function onZoomInput() {
        if (!ready) return;
        var t = (parseFloat(zoom.value) || 0) / 1000;
        setScale(st.min * (1 + t * (CROP_ZOOM_MAX - 1)));
    }

    function onToolClick(ev) {
        var b = ev.target.closest('[data-zoom]');
        if (b) return setScale(st.scale * (b.dataset.zoom === '1' ? 1.15 : 1 / 1.15));
        if (ev.target.closest('.crop-reset')) reset();
    }

    // Khung co theo bề rộng cửa sổ -> đổi kích thước là mọi con số pixel khung ở
    // trên hết đúng, phải tính lại chứ không thì ảnh hở mép.
    function onResize() {
        if (!ready) return;
        var before = st.scale / st.min;
        fit();
        st.scale = Math.max(st.min, st.min * before);
        render();
    }

    function apply() {
        if (!ready) return;
        // Quy đổi khung nhìn về toạ độ ảnh GỐC: đây là vùng sẽ được vẽ ra canvas.
        var sw = st.fw / st.scale;
        var sh = st.fh / st.scale;
        var sx = nat.w / 2 - st.dx / st.scale - sw / 2;
        var sy = nat.h / 2 - st.dy / st.scale - sh / 2;

        // Ở mức thu nhỏ hết cỡ, sai số dấu phẩy động đẩy vùng lấy ra ngoài mép ảnh
        // vài phần nghìn pixel — drawImage sẽ vẽ đúng chỗ đó thành sọc trong suốt
        // (ảnh JPEG thì ra sọc đen). Kẹp lại trong đúng khổ ảnh gốc.
        sw = Math.min(sw, nat.w);
        sh = Math.min(sh, nat.h);
        sx = Math.min(Math.max(0, sx), nat.w - sw);
        sy = Math.min(Math.max(0, sy), nat.h - sh);

        var outW = Math.max(1, Math.min(CROP_OUT_MAX_W, Math.round(sw)));
        var canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = Math.max(1, Math.round(outW / ratio));

        var out;
        try {
            canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            out = canvas.toDataURL(mime, 0.88);
        } catch (e) {
            // Gần như luôn là SecurityError: ảnh dán từ web ngoài làm "nhiễm bẩn"
            // canvas, trình duyệt cấm đọc ngược lại. Không có cách vòng ở phía
            // trình duyệt — phải tải ảnh về máy rồi chọn lại.
            error.textContent = 'Ảnh lấy từ địa chỉ web ngoài không cắt được (trình duyệt chặn). Hãy tải ảnh về máy rồi bấm chọn từ máy.';
            error.hidden = false;
            return;
        }
        close();
        onApply(out);
    }

    function onKey(ev) {
        if (ev.key === 'Escape') { ev.preventDefault(); close(); }
    }

    function onClick(ev) {
        if (ev.target.closest('[data-modal-close]')) close();
    }

    function close() {
        cropModal.hidden = true;
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
        cropModal.removeEventListener('click', onClick);
        okBtn.removeEventListener('click', apply);
        zoom.removeEventListener('input', onZoomInput);
        frame.removeEventListener('pointerdown', onDown);
        frame.removeEventListener('pointermove', onMove);
        frame.removeEventListener('pointerup', onUp);
        frame.removeEventListener('pointercancel', onUp);
        frame.removeEventListener('wheel', onWheel);
        frame.removeEventListener('keydown', onFrameKey);
        tools.removeEventListener('click', onToolClick);
        img.onload = img.onerror = null;
        drag = null;
        frame.classList.remove('is-drag');
        if (opener && opener.focus) opener.focus();
    }

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    cropModal.addEventListener('click', onClick);
    okBtn.addEventListener('click', apply);
    zoom.addEventListener('input', onZoomInput);
    frame.addEventListener('pointerdown', onDown);
    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerup', onUp);
    frame.addEventListener('pointercancel', onUp);
    // passive:false — mặc định của wheel là passive, preventDefault() sẽ bị bỏ qua
    // và lăn chuột trong khung sẽ cuộn cả trang phía sau thay vì phóng ảnh.
    frame.addEventListener('wheel', onWheel, {passive: false});
    frame.addEventListener('keydown', onFrameKey);
    // Nút "Đặt lại" nằm trong .crop-tools nên đi chung uỷ nhiệm này — gắn thêm
    // listener riêng cho nó sẽ tích luỹ qua mỗi lần mở hộp (close() không gỡ nổi
    // vì hàm reset là closure mới mỗi lượt) và lần mở sau sẽ chạy cả bản cũ.
    tools.addEventListener('click', onToolClick);

    // Gán src SAU khi gắn onload. Xoá src cũ trước: gán lại đúng chuỗi cũ thì
    // trình duyệt coi như không đổi và `load` không bao giờ bắn -> hộp đứng im.
    img.onload = onLoad;
    img.onerror = onLoadError;
    ready = false;
    img.removeAttribute('src');
    img.src = src;
    if (img.complete && img.naturalWidth) onLoad(); // ảnh sẵn trong bộ nhớ đệm

    frame.focus({preventScroll: true});
}

var IMG_MAX_PIXELS = 12000000;  // 12 megapixel — trần độ phân giải sau khi thu (nâng
                                // từ 5MP để ảnh nét hơn; 12MP base64 vẫn < 16MB của MEDIUMTEXT)

// TRẦN ĐỘ DÀI CHUỖI data URI ĐẦU RA — không phải ngưỡng "giữ nguyên file gốc"
// như bản trước. Đây là điểm sửa cốt lõi: trước đây mọi ảnh dưới 10MB được nhúng
// NGUYÊN XI, nên một ảnh PNG 9MB thành ~12MB base64. Form sản phẩm gửi lại TOÀN
// BỘ ảnh cũ mỗi lần lưu (ô gallery[] chứa cả data URI), nên chỉ vài ảnh như vậy
// là thân POST vượt BODY_LIMIT -> lỗi 413 "request entity too large".
// 2MB/ảnh: 10 ảnh vẫn chỉ ~21MB thân POST, nằm dưới BODY_LIMIT mặc định 25mb.
var IMG_TARGET_BYTES = 2 * 1024 * 1024;

// Nấc chất lượng JPEG thử lần lượt cho tới khi lọt trần. Bắt đầu cao để ảnh nào
// nhẹ sẵn thì không bị nén oan; chỉ ảnh nặng mới tụt xuống các nấc dưới.
var IMG_QUALITY_STEPS = [0.92, 0.85, 0.78, 0.7, 0.62, 0.55];
// Hết nấc chất lượng mà vẫn quá trần thì thu nhỏ kích thước rồi thử lại.
var IMG_DOWNSCALE_STEP = 0.8;
var IMG_MAX_ATTEMPTS = 8;
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
 * Kiểm tra ảnh trên canvas có điểm ảnh trong suốt nào không.
 *
 * Dùng để quyết định giữ PNG hay đổi sang JPEG. Quét kênh alpha của ảnh ĐÃ THU
 * NHỎ nên chỉ một lượt qua mảng, đủ nhanh.
 *
 * Lỗi -> trả true (coi như CÓ trong suốt) là hướng an toàn: cùng lắm giữ PNG nặng
 * hơn, còn đoán nhầm chiều kia thì logo nền trong suốt bị JPEG hoá nền đen.
 */
function hasTransparency(ctx, w, h) {
    try {
        var data = ctx.getImageData(0, 0, w, h).data;
        for (var i = 3; i < data.length; i += 4) {
            if (data[i] < 255) return true;
        }
        return false;
    } catch (e) {
        return true;
    }
}

/**
 * Mã hoá canvas sao cho chuỗi data URI KHÔNG vượt `budget`, hạ dần chất lượng.
 *
 * PNG không nhận tham số chất lượng (toDataURL bỏ qua) nên chỉ mã hoá một lần —
 * muốn nhỏ hơn thì phải thu kích thước, việc đó do vòng ngoài lo.
 */
function encodeWithin(canvas, mime, budget) {
    if (mime !== 'image/jpeg') return canvas.toDataURL(mime);
    var out = '';
    for (var i = 0; i < IMG_QUALITY_STEPS.length; i++) {
        out = canvas.toDataURL(mime, IMG_QUALITY_STEPS[i]);
        if (out.length <= budget) return out;
    }
    return out; // hết nấc — vòng ngoài sẽ thu nhỏ rồi gọi lại
}

/**
 * Nén ảnh về data URI có độ dài ≤ IMG_TARGET_BYTES rồi trả về.
 *
 * Vì sao phải nén: ảnh được nhúng thẳng vào MySQL dạng base64 (không upload
 * multipart — xem chú thích ở bindEncoders). Base64 phình ~33%, mã hoá URL trong
 * thân form phình thêm ~6%. Form sản phẩm còn gửi lại TOÀN BỘ ảnh cũ mỗi lần lưu,
 * nên dung lượng mỗi ảnh phải bị chặn cứng, không chỉ chặn độ phân giải.
 *
 * Cách làm: thu về ≤12MP, chọn định dạng (JPEG trừ khi ảnh thật sự có vùng trong
 * suốt), rồi hạ chất lượng dần; vẫn quá trần thì thu nhỏ thêm 20% và lặp lại. Nhờ
 * vậy đầu ra LUÔN dưới trần bất kể ảnh gốc nặng bao nhiêu — khác bản trước, vốn
 * nhúng nguyên xi mọi ảnh dưới 10MB.
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

        // Ảnh đã nhẹ sẵn -> nhúng nguyên xi, không mã hoá lại để khỏi làm mờ
        // logo/icon một cách vô ích. Ngưỡng tính NGƯỢC từ trần đầu ra: base64
        // phình 4/3, nên file gốc phải dưới 3/4 trần thì chuỗi mới lọt.
        if (pixels <= IMG_MAX_PIXELS && file.size * 4 / 3 <= IMG_TARGET_BYTES) {
            URL.revokeObjectURL(url);
            // Vẫn kèm w/h: đây CHÍNH LÀ nhánh mà ảnh nhỏ đi qua, mà luật "ảnh quá
            // nhỏ" ở bindEncoders lại đọc kích thước từ `info`. Trả rỗng ở đây là
            // luật đó không bao giờ có dữ liệu để chặn.
            return readAsDataURL(file, function (err, dataUrl) {
                cb(err, dataUrl, err ? null : {w: w, h: h, from: w + '×' + h, resized: false});
            });
        }

        var ratio = pixels > IMG_MAX_PIXELS ? Math.sqrt(IMG_MAX_PIXELS / pixels) : 1;
        var canvas = document.createElement('canvas');
        var nw = w;
        var nh = h;
        var out = null;

        for (var attempt = 0; attempt < IMG_MAX_ATTEMPTS; attempt++) {
            nw = Math.max(1, Math.round(w * ratio));
            nh = Math.max(1, Math.round(h * ratio));
            canvas.width = nw;
            canvas.height = nh;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, nw, nh);

            try {
                // Ảnh chụp/ảnh sản phẩm xuất ra PNG là thủ phạm chính của lỗi 413:
                // PNG không mất dữ liệu nên nặng gấp nhiều lần JPEG cùng nội dung.
                // Chỉ giữ PNG khi ảnh THẬT SỰ có vùng trong suốt.
                var mime = hasTransparency(ctx, nw, nh) ? 'image/png' : 'image/jpeg';
                out = encodeWithin(canvas, mime, IMG_TARGET_BYTES);
            } catch (e) {
                // Canvas "nhiễm bẩn" hoặc hết bộ nhớ -> vẫn nhúng ảnh gốc, không chặn.
                URL.revokeObjectURL(url);
                return readAsDataURL(file, cb);
            }

            if (out.length <= IMG_TARGET_BYTES) break;
            ratio *= IMG_DOWNSCALE_STEP;
        }

        URL.revokeObjectURL(url);
        cb(null, out, {
            w: nw, h: nh,
            from: w + '×' + h,
            to: nw + '×' + nh,
            resized: nw !== w || nh !== h,
        });
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
/**
 * Đọc khai báo cỡ ảnh dạng "900x600" thành {w, h}. Trả null nếu không có/hỏng —
 * gọi nơi nào không khai thì luật kích thước tự tắt, đúng ý: chỉ lưới ảnh trang
 * chủ mới có ô đủ lớn để đòi hỏi độ phân giải.
 */
function parseSizeRule(str) {
    var m = /^(\d+)\s*[x×]\s*(\d+)$/i.exec(String(str || '').trim());
    return m ? {w: parseInt(m[1], 10), h: parseInt(m[2], 10)} : null;
}

function bindEncoders(root) {
    root.querySelectorAll('input[type="file"][data-encode-to]').forEach(function (picker) {
        if (picker.dataset.bound === '1') return; // tránh gắn 2 lần -> đọc file 2 lượt
        picker.dataset.bound = '1';

        var key = picker.dataset.encodeTo;

        // Chỗ ghi thông báo: vùng kéo–thả đặt sẵn một ô [data-note-for] NGOÀI
        // khung (chèn vào trong sẽ nằm dưới lớp phủ của ô file); dòng bộ sưu tập
        // không có nên vẫn tự tạo cạnh ô chọn file như trước.
        function note(text, isError) {
            var hint = document.querySelector('[data-note-for="' + key + '"]')
                || picker.parentNode.querySelector('.upload-note');
            if (!hint) {
                hint = document.createElement('span');
                hint.className = 'admin-hint upload-note';
                picker.parentNode.appendChild(hint);
            }
            hint.textContent = text;
            // Ảnh bị TỪ CHỐI mà chữ báo vẫn xám nhạt như dòng "Đã chọn ảnh (…)"
            // thì admin lướt qua, bấm Lưu và tưởng ảnh đã vào.
            hint.classList.toggle('is-error', !!isError);
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
                    note('Không đọc được file, thử chọn lại.', true);
                    picker.value = '';
                    return;
                }

                // ── Luật độ phân giải ─────────────────────────────────────────
                // Chỉ áp cho ô nào có tổ tiên khai [data-min-size] (lưới ảnh trang
                // chủ). Ảnh 150×100 kéo vào ô lớn ~460×390 CSS px sẽ vỡ nhoè —
                // chặn tại đây, lúc admin còn đang nhìn ảnh, chứ để tới khi xem
                // trang chủ mới phát hiện thì đã lưu vào DB rồi.
                // SVG và ảnh trình duyệt không giải mã được -> `info` rỗng -> bỏ
                // qua luật, không chặn oan.
                var sizeZone = picker.closest && picker.closest('[data-min-size]');
                var lowRes = false;
                if (sizeZone && info && info.w) {
                    var min = parseSizeRule(sizeZone.dataset.minSize);
                    var good = parseSizeRule(sizeZone.dataset.goodSize);
                    if (min && (info.w < min.w || info.h < min.h)) {
                        note('Ảnh ' + info.w + '×' + info.h + ' quá nhỏ, ô này cần tối thiểu '
                            + min.w + '×' + min.h + '. Hãy chọn ảnh lớn hơn.', true);
                        picker.value = '';
                        return; // KHÔNG ghi vào ô đường dẫn -> ảnh cũ giữ nguyên
                    }
                    if (good && (info.w < good.w || info.h < good.h)) {
                        // Cảnh báo chứ không chặn: ảnh 600×450 vẫn dùng tạm được,
                        // cấm luôn thì admin không đăng nổi ảnh mình đang có.
                        lowRes = true;
                        note('Ảnh ' + info.w + '×' + info.h + ' hơi nhỏ, nên dùng từ '
                            + good.w + '×' + good.h + ' để không bị mờ.', true);
                    }
                }

                target.value = dataUrl;
                if (preview) { preview.src = dataUrl; preview.hidden = false; }
                showImage(picker, true);
                var size = Math.round(dataUrl.length / 1024) + 'KB';
                // `lowRes` chặn hai dòng này GHI ĐÈ lời cảnh báo vừa đặt ở trên —
                // cùng một ô chữ, viết sau thắng, và "Đã chọn ảnh (…)" thì nghe
                // như mọi thứ đều ổn.
                if (lowRes) { /* giữ nguyên cảnh báo ảnh nhỏ */ }
                else if (info && info.resized) note('Đã thu ' + info.from + ' → ' + info.to + ' (' + size + ').');
                else if (document.querySelector('[data-note-for="' + key + '"]')) note('Đã chọn ảnh (' + size + '). Bấm Lưu để áp dụng.');

                // Ô ảnh có khai báo tỉ lệ khung (vd slide) -> mở luôn hộp điều
                // chỉnh, không bắt admin phải biết là có nút đó. Bấm Hủy thì ảnh
                // vừa chọn vẫn được giữ nguyên như trước, chỉ là không cắt.
                var zone = picker.closest && picker.closest('[data-crop]');
                if (!zone) return;
                cropOriginals[key] = dataUrl;
                openCropModal(dataUrl, zone.dataset.crop, function (out) {
                    target.value = out;
                    if (preview) { preview.src = out; preview.hidden = false; }
                    note('Đã cắt ảnh (' + Math.round(out.length / 1024) + 'KB). Bấm Lưu để áp dụng.');
                });
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
                delete cropOriginals[key]; // ảnh đã bỏ -> bản gốc giữ lại cũng vô nghĩa
                zone.classList.remove('has-image');
            });
        }

        // Mở lại hộp điều chỉnh cho ảnh đang có. Ưu tiên bản GỐC trong phiên này
        // để chỉnh lần hai không cắt chồng lên phần đã cắt lần một; sau khi tải
        // lại trang thì không còn bản gốc nữa, chỉnh tiếp từ ảnh đang lưu.
        var adjustBtn = zone.querySelector('.dropzone-adjust');
        if (adjustBtn && zone.dataset.crop && target) {
            adjustBtn.addEventListener('click', function () {
                var cur = cropOriginals[key] || target.value.trim();
                if (!cur) return;
                openCropModal(cur, zone.dataset.crop, function (out) {
                    target.value = out;
                    if (preview) { preview.src = out; preview.hidden = false; }
                    if (note) note.textContent = 'Đã cắt ảnh (' + Math.round(out.length / 1024) + 'KB). Bấm Lưu để áp dụng.';
                    zone.classList.add('has-image');
                });
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

/* ── Toast: thông báo góc màn hình sau thao tác admin ─────────────────────────
   Controller chuyển hướng kèm ?msg (thành công) hoặc ?err=<lời lỗi> (thất bại).
   Đọc tham số -> bật toast -> gỡ tham số khỏi URL để F5/chia sẻ link không lặp
   lại thông báo cũ. Thay cho: banner xanh cũ (thành công) và trang chữ trơn cụt
   (lỗi). IIFE riêng, không dính vào khối phía trên. */
(function () {
    'use strict';

    var MSG_MAP = {
        created:  {text: 'Đã thêm.', type: 'ok'},
        updated:  {text: 'Đã cập nhật.', type: 'ok'},
        deleted:  {text: 'Đã xóa.', type: 'ok'},
        shown:    {text: 'Đã bật khối trên trang chủ.', type: 'ok'},
        hidden:   {text: 'Đã tắt khối trên trang chủ.', type: 'ok'},
        notfound: {text: 'Không tìm thấy mục cần thao tác.', type: 'err'},
    };
    var ICON = {ok: '✓', err: '!', warn: '!'};

    function stack() {
        var el = document.getElementById('toastStack');
        if (!el) { // phòng khi trang admin nào đó thiếu _nav
            el = document.createElement('div');
            el.className = 'toast-stack';
            el.id = 'toastStack';
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        return el;
    }

    function dismiss(t) {
        if (t.dataset.closing === '1') return;
        t.dataset.closing = '1';
        t.classList.add('is-out');
        // Chờ hết animation rồi mới bỏ; setTimeout dự phòng khi animationend không
        // bắn (prefers-reduced-motion tắt animation -> không có sự kiện).
        var done = function () { if (t.parentNode) t.parentNode.removeChild(t); };
        t.addEventListener('animationend', done, {once: true});
        setTimeout(done, 260);
    }

    function showToast(message, type, timeout) {
        if (!message) return null;
        type = type || 'ok';
        var t = document.createElement('div');
        t.className = 'toast toast-' + type;
        t.setAttribute('role', type === 'err' ? 'alert' : 'status');

        var icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = ICON[type] || '•';

        var msg = document.createElement('span');
        msg.className = 'toast-msg';
        msg.textContent = message; // textContent: ?err là chữ tự do -> chặn XSS

        var close = document.createElement('span');
        close.className = 'toast-close';
        close.setAttribute('aria-hidden', 'true');
        close.textContent = '×';

        t.appendChild(icon);
        t.appendChild(msg);
        t.appendChild(close);
        stack().appendChild(t);

        t.addEventListener('click', function () { dismiss(t); });

        // Lỗi giữ lâu hơn cho admin kịp đọc; thành công tự ẩn nhanh.
        var ms = timeout || (type === 'err' ? 6000 : 3500);
        setTimeout(function () { dismiss(t); }, ms);
        return t;
    }
    window.showToast = showToast; // để nơi khác gọi tay nếu cần

    function consumeFlash() {
        var params = new URLSearchParams(location.search);
        var msg = params.get('msg');
        var err = params.get('err');
        if (err) showToast(err, 'err');
        if (msg && MSG_MAP[msg]) showToast(MSG_MAP[msg].text, MSG_MAP[msg].type);

        if (msg || err) {
            params.delete('msg');
            params.delete('err');
            var qs = params.toString();
            history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', consumeFlash);
    } else {
        consumeFlash();
    }
})();
