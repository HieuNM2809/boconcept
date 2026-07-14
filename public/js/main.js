(function () {
    'use strict';

    // ── Hero slideshow (auto + arrows + dots) ──────────────────────────────────
    const track = document.getElementById('heroTrack');
    if (track) {
        const slides = track.children.length;
        const dots = Array.from(document.querySelectorAll('#heroDots .dot'));
        let idx = 0;
        let timer = null;

        const go = (i) => {
            idx = (i + slides) % slides;
            track.style.transform = `translateX(-${idx * 100}%)`;
            dots.forEach((d, k) => d.classList.toggle('active', k === idx));
        };
        const start = () => { timer = setInterval(() => go(idx + 1), 5000); };
        const stop = () => clearInterval(timer);
        const restart = () => { stop(); start(); };

        document.querySelectorAll('.hero-arrow').forEach((btn) => {
            btn.addEventListener('click', () => { go(idx + Number(btn.dataset.dir)); restart(); });
        });
        dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.idx)); restart(); }));

        const hero = document.querySelector('.hero');
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);

        if (slides > 1) start();
    }

    // ── Horizontal scroll (categories) ─────────────────────────────────────────
    document.querySelectorAll('[data-scroll]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const el = document.getElementById(btn.dataset.scroll);
            if (el) el.scrollBy({left: Number(btn.dataset.dir) * 260, behavior: 'smooth'});
        });
    });

    // ── Mobile menu ────────────────────────────────────────────────────────────
    const toggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('open'));
    }

    // ── Auto-navigate selects (sort giá / mỗi trang ở trang danh sách) ──────────
    document.querySelectorAll('select[data-nav]').forEach((s) => {
        s.addEventListener('change', () => { if (s.value) window.location.href = s.value; });
    });

    // ── Product detail: gallery + variants + tabs ──────────────────────────────
    const gMain = document.getElementById('galleryMain');
    if (gMain) {
        const setMain = (src) => { if (src) gMain.style.backgroundImage = `url('${src}')`; };

        document.querySelectorAll('.g-thumb').forEach((th) => th.addEventListener('click', () => {
            setMain(th.dataset.image);
            document.querySelectorAll('.g-thumb').forEach((x) => x.classList.remove('active'));
            th.classList.add('active');
        }));
        document.querySelectorAll('[data-gdir]').forEach((btn) => btn.addEventListener('click', () => {
            const track = document.getElementById('gThumbs');
            if (track) track.scrollBy({left: Number(btn.dataset.gdir) * 120, behavior: 'smooth'});
        }));

        const priceEl = document.getElementById('pdPrice');
        const skuEl = document.getElementById('pdSku');
        document.querySelectorAll('.variant').forEach((v) => v.addEventListener('click', () => {
            document.querySelectorAll('.variant').forEach((x) => x.classList.remove('active'));
            v.classList.add('active');
            if (v.dataset.image) setMain(v.dataset.image);
            if (priceEl && v.dataset.price) priceEl.textContent = v.dataset.price;
            if (skuEl && v.dataset.sku) skuEl.textContent = v.dataset.sku;
        }));
    }

    document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((x) => x.classList.toggle('active', x === btn));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + id));
    }));
})();
