(function () {
    'use strict';

    // ── Drawer menu (☰ + "Xem thêm") ───────────────────────────────────────────
    // Đăng ký TRƯỚC khối hero: hero deref `.hero` không guard ở dưới, nếu nó ném
    // thì mọi listener đăng ký SAU sẽ chết theo — kể cả drawer này.
    const drawer = document.getElementById('navPanel');
    const scrim = document.getElementById('drawerScrim');
    const drawerTriggers = Array.from(document.querySelectorAll('[data-nav-toggle]'));

    if (drawer && scrim && drawerTriggers.length) {
        const sub = document.getElementById('drawerSub');
        const subLevels = sub ? Array.from(sub.querySelectorAll('.drawer-sub-level')) : [];
        const catTriggers = Array.from(drawer.querySelectorAll('[data-drawer-to]'));
        const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
        let lastTrigger = null;

        // Mở cột phải cho 1 danh mục. name = null -> đóng cột phải.
        const openSub = (name) => {
            if (!sub) return;
            sub.hidden = !name;
            drawer.classList.toggle('has-sub', !!name); // ≤1024: cột phải thay cột trái
            subLevels.forEach((l) => { l.hidden = l.dataset.level !== name; });
            // aria-expanded chỉ đúng ở nút đang mở — các nút còn lại phải trả về false.
            catTriggers.forEach((t) => t.setAttribute('aria-expanded', String(t.dataset.drawerTo === name)));
            if (name) {
                const active = subLevels.find((l) => l.dataset.level === name);
                const f = active && active.querySelector(FOCUSABLE);
                if (f) f.focus(); // người dùng bàn phím không bị lạc sang cột mới
            }
        };

        const setDrawer = (open) => {
            drawer.hidden = !open; // `hidden` là nguồn sự thật, không phải class
            scrim.hidden = !open;
            document.body.classList.toggle('drawer-open', open); // khóa cuộn nền
            drawerTriggers.forEach((t) => t.setAttribute('aria-expanded', String(open)));
            openSub(null); // mở/đóng lại đều bắt đầu từ trạng thái chỉ có cột trái
            if (!open && lastTrigger) lastTrigger.focus(); // trả focus về đúng nút đã mở
        };

        drawerTriggers.forEach((t) => t.addEventListener('click', () => {
            lastTrigger = t;
            setDrawer(drawer.hidden);
        }));

        drawer.addEventListener('click', (e) => {
            const to = e.target.closest('[data-drawer-to]');
            // Bấm lại chính mục đang mở -> đóng cột phải
            if (to) return openSub(to.getAttribute('aria-expanded') === 'true' ? null : to.dataset.drawerTo);
            if (e.target.closest('[data-drawer-back]')) {
                const reopen = catTriggers.find((t) => t.getAttribute('aria-expanded') === 'true');
                openSub(null);
                if (reopen) reopen.focus();
                return;
            }
            if (e.target.closest('[data-drawer-close]')) return setDrawer(false);
        });

        scrim.addEventListener('click', () => setDrawer(false));

        document.addEventListener('keydown', (e) => {
            if (drawer.hidden) return;
            if (e.key === 'Escape') return setDrawer(false);
            if (e.key !== 'Tab') return;
            // Bẫy focus: drawer là dialog modal (aria-modal="true") nên tab phải
            // quẩn trong nó, không được rơi ra trang nền đang bị scrim che.
            const items = Array.from(drawer.querySelectorAll(FOCUSABLE))
                .filter((el) => el.offsetParent !== null);
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    // ── Hero slideshow (auto + arrows + dots) ──────────────────────────────────
    const track = document.getElementById('heroTrack');
    if (track && track.children.length) {
        const dots = Array.from(document.querySelectorAll('#heroDots .dot'));
        const real = track.children.length;   // số slide THẬT (chưa tính bản sao)
        let pos = 0;                          // vị trí trong track (ĐÃ tính bản sao)
        let timer = null;
        let busy = false;                     // đang chạy hiệu ứng -> chặn bấm dồn

        // Đặt transform mà KHÔNG chạy hiệu ứng (dùng lúc khởi tạo và lúc nhảy ngầm).
        const snapTo = (p) => {
            pos = p;
            track.style.transition = 'none';
            track.style.transform = `translateX(-${pos * 100}%)`;
            void track.offsetWidth;           // ép vẽ lại trước khi bật transition
            track.style.transition = '';      // trả về transition khai báo trong CSS
        };

        // Chạy vòng vô tận: nhân bản 2 đầu -> [sn'] s1 s2 … sn [s1']
        // Tới cuối thì trượt tiếp sang bản sao của s1 (mắt thấy liền mạch), xong
        // hiệu ứng mới nhảy ngầm về s1 thật. Không còn cảnh tua ngược về đầu.
        if (real > 1) {
            const headClone = track.children[0].cloneNode(true);
            const tailClone = track.children[real - 1].cloneNode(true);
            // Bản sao chỉ để nhìn -> giấu khỏi trình đọc màn hình, tránh đọc lặp tiêu đề.
            headClone.setAttribute('aria-hidden', 'true');
            tailClone.setAttribute('aria-hidden', 'true');
            track.appendChild(headClone);
            track.insertBefore(tailClone, track.firstElementChild);
            snapTo(1);                        // s1 thật nằm ở vị trí 1
        }

        const paint = () => {
            const active = ((pos - 1) % real + real) % real;
            dots.forEach((d, k) => d.classList.toggle('active', k === active));
        };

        const go = (next) => {
            // `next === pos` phải chặn ở đây: bấm lại đúng dấu chấm đang active sẽ
            // KHÔNG sinh transition -> transitionend không bao giờ chạy -> `busy`
            // kẹt true và slideshow đứng hình vĩnh viễn.
            if (real < 2 || busy || next === pos) return;
            busy = true;
            pos = next;
            track.style.transform = `translateX(-${pos * 100}%)`;
            paint();
        };

        track.addEventListener('transitionend', (e) => {
            if (e.target !== track || e.propertyName !== 'transform') return;
            busy = false;
            if (pos > real) snapTo(1);        // vừa tới bản sao của s1 -> về s1 thật
            else if (pos < 1) snapTo(real);   // vừa tới bản sao của sn -> về sn thật
        });

        const stop = () => clearInterval(timer);
        // stop() trước: chuột rê ra/vào liên tục sẽ chồng nhiều interval, ảnh chạy giật.
        const start = () => { if (real > 1) { stop(); timer = setInterval(() => go(pos + 1), 5000); } };
        const restart = () => { stop(); start(); };

        document.querySelectorAll('.hero-arrow').forEach((btn) => {
            btn.addEventListener('click', () => { go(pos + Number(btn.dataset.dir)); restart(); });
        });
        dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.idx) + 1); restart(); }));

        const hero = document.querySelector('.hero');
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);

        paint();
        start();
    }

    // ── Lưới ảnh trang chủ: các ô nhiều ảnh tự chuyển ─────────────────────────
    // Ảnh trong ô đã chồng khít lên nhau bằng CSS (position:absolute), việc ở đây
    // chỉ là gạt .is-active sang ảnh kế. Không đụng gì tới kích thước ô nên lưới
    // không thể xô lệch khi ảnh đổi.
    //
    // Ô nào chỉ có 1 ảnh thì bỏ qua hẳn — khe tĩnh và khe slider mới thêm 1 ảnh
    // đều rơi vào nhánh này, không tốn timer nào.
    const collageCells = document.querySelectorAll('.collage-cell');
    if (collageCells.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const timers = [];
        let phase = 0; // thứ tự ô CÓ slider, để các ô lệch pha chứ không đổi cùng lúc

        collageCells.forEach((cell) => {
            const imgs = cell.querySelectorAll('.collage-img');
            if (imgs.length < 2) return;

            let cur = 0;
            const delay = phase++ * 600;

            const advance = () => {
                const next = (cur + 1) % imgs.length;
                imgs[cur].classList.remove('is-active');
                imgs[cur].setAttribute('aria-hidden', 'true');
                imgs[next].classList.add('is-active');
                imgs[next].removeAttribute('aria-hidden');
                cur = next;
            };

            // Giữ handle của cả setTimeout lẫn setInterval: dừng giữa lúc còn đang
            // chờ lệch pha mà chỉ clearInterval thì timeout vẫn nổ và đẻ interval mới.
            timers.push({
                start() {
                    this.stop();
                    this.t = setTimeout(() => { this.i = setInterval(advance, 5000); }, delay);
                },
                stop() {
                    clearTimeout(this.t);
                    clearInterval(this.i);
                    this.t = this.i = null;
                },
            });
        });

        timers.forEach((t) => t.start());

        // Tab bị ẩn thì ngừng hẳn: chạy nền chỉ tốn pin, và khi quay lại người ta
        // gặp một ô đã nhảy vài chục ảnh chứ không phải ảnh kế tiếp.
        document.addEventListener('visibilitychange', () => {
            timers.forEach((t) => (document.hidden ? t.stop() : t.start()));
        });
    }

    // ── Categories: chọn loại cấp 1 -> đổi ảnh lớn + hàng danh mục con ─────────
    // Bộ chọn, ảnh lớn và track cấp 2 đều mang data-cat trùng nhau nên chỉ cần
    // gạt .is-active theo id là ba chỗ khớp nhau, không phải giữ state riêng.
    document.querySelectorAll('.categories').forEach((sec) => {
        const items = sec.querySelectorAll('.cat-picker-item');
        if (!items.length) return;

        const setActive = (id) => {
            sec.querySelectorAll('[data-cat]').forEach((el) => {
                const on = el.dataset.cat === id;
                el.classList.toggle('is-active', on);
                if (el.matches('.cat-picker-item')) el.setAttribute('aria-selected', String(on));
            });
        };

        // Rê chuột ra ngoài khối rồi đứng yên 5s -> hàng ảnh cấp 2 tự thu lại
        // (CSS .cat-subs-row.is-idle). Quay vào là bung ra ngay, loại đang chọn
        // giữ nguyên nên không phải dò lại từ đầu.
        const subsRow = sec.querySelector('.cat-subs-row');
        const IDLE_MS = 5000;
        let idleTimer;
        const wake = () => {
            clearTimeout(idleTimer);
            if (subsRow) subsRow.classList.remove('is-idle');
        };
        const sleepLater = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => subsRow.classList.add('is-idle'), IDLE_MS);
        };

        // Chuột thật: rê tới đâu đổi tới đó. Màn cảm ứng không hover được nên
        // click mới là lối vào duy nhất — gắn cả hai, chúng không loại trừ nhau.
        const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        items.forEach((btn) => {
            if (hoverable) btn.addEventListener('mouseenter', () => setActive(btn.dataset.cat));
            // wake() ở đây là cho BÀN PHÍM: tab tới nút mà hàng cấp 2 đang ẩn
            // thì bấm xong chẳng thấy gì đổi.
            btn.addEventListener('focus', () => { wake(); setActive(btn.dataset.cat); });
            btn.addEventListener('click', () => { wake(); setActive(btn.dataset.cat); });
        });

        // Chỉ hẹn giờ khi có chuột thật. Màn cảm ứng KHÔNG sinh mouseleave đáng
        // tin: chạm xong hàng sẽ ẩn và không còn cách nào gọi lại ngoài chạm
        // trúng nút cấp 1 — nên ở đó cứ để hiện thường trực.
        if (hoverable && subsRow) {
            sec.addEventListener('mouseenter', wake);
            sec.addEventListener('mouseleave', sleepLater);
        }
        // Loại cấp 1 đang chọn KHÔNG reset khi rời chuột — chỉ hàng cấp 2 ẩn đi.
    });

    // ── Horizontal scroll (categories) ─────────────────────────────────────────
    document.querySelectorAll('[data-scroll]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const el = document.getElementById(btn.dataset.scroll);
            if (!el) return;
            // Mặc định giữ nguyên 260px cho scroller danh mục cũ (#cats).
            // Showcase gắn data-scroll-by-item -> cuộn đúng bề ngang 1 ảnh, vì ảnh
            // rộng theo vw nên số cứng 260px sẽ lệch nửa vời ở mọi kích thước màn.
            let step = 260;
            if (btn.hasAttribute('data-scroll-by-item') && el.firstElementChild) {
                const item = el.firstElementChild;
                const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
                step = item.getBoundingClientRect().width + gap;
            }
            el.scrollBy({left: Number(btn.dataset.dir) * step, behavior: 'smooth'});
        });
    });

    // ── Dải "Nội thất thiết kế": mờ nút khi đã trượt hết đường ─────────────────
    // Không có phần này thì tới đầu/cuối dải, nút vẫn sáng như thường nhưng bấm
    // không nhúc nhích — người dùng tưởng hỏng.
    document.querySelectorAll('.design-rail').forEach((rail) => {
        const track = rail.querySelector('.design-track');
        const prev = rail.querySelector('.design-arrow.prev');
        const next = rail.querySelector('.design-arrow.next');
        if (!track || !prev || !next) return;

        const sync = () => {
            // -1 chứ không phải 0: bề rộng cuộn hay lẻ vài phần trăm pixel nên
            // scrollLeft không bao giờ chạm đúng giá trị lớn nhất.
            const max = track.scrollWidth - track.clientWidth;
            prev.classList.toggle('is-off', track.scrollLeft <= 1);
            next.classList.toggle('is-off', track.scrollLeft >= max - 1);
        };

        track.addEventListener('scroll', sync, {passive: true});
        window.addEventListener('resize', sync);
        sync();
    });

    // ── Auto-navigate selects (sort giá / mỗi trang ở trang danh sách) ──────────
    document.querySelectorAll('select[data-nav]').forEach((s) => {
        s.addEventListener('change', () => { if (s.value) window.location.href = s.value; });
    });

    // ── Chi tiết sản phẩm: nút "Xem thêm ảnh" ─────────────────────────────────
    const pdgMore = document.getElementById('pdgMore');
    if (pdgMore) {
        pdgMore.addEventListener('click', () => {
            document.querySelectorAll('.pdg-extra').forEach((el) => { el.hidden = false; });
            // Ảnh cuối hết vai trò "nhá hàng" -> bỏ mờ, và nút tự ẩn đi.
            const teaser = document.querySelector('.pdg-cell.is-teaser');
            if (teaser) teaser.classList.remove('is-teaser');
            pdgMore.setAttribute('aria-expanded', 'true');
            pdgMore.hidden = true;
        });
    }

    // ── Chi tiết sản phẩm: biến thể + tabs ────────────────────────────────────
    {
        // Không còn tra #pdPrice: giá đã bỏ khỏi trang, biến thể chỉ đổi ảnh + mã SKU.
        const skuEl = document.getElementById('pdSku');
        // Gallery mới là lưới tĩnh, không còn "ảnh chính" để hoán đổi như bản cũ.
        // Đổi ảnh ĐẦU TIÊN của lưới để vẫn phản hồi khi chọn biến thể.
        // `.is-lead` chứ không `.is-wide`: product.ejs gán lớp `is-lead` cho ảnh đầu.
        // Selector cũ không khớp phần tử nào nên chọn biến thể KHÔNG hề đổi ảnh.
        const firstImg = document.querySelector('.pdg-cell.is-lead img');

        document.querySelectorAll('.variant').forEach((v) => v.addEventListener('click', () => {
            document.querySelectorAll('.variant').forEach((x) => x.classList.remove('active'));
            v.classList.add('active');
            if (firstImg && v.dataset.image) firstImg.src = v.dataset.image;
            if (skuEl && v.dataset.sku) skuEl.textContent = v.dataset.sku;
        }));
    }

    document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((x) => x.classList.toggle('active', x === btn));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + id));
    }));
})();
