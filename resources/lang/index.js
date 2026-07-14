const fs = require('fs');
const path = require('path');

const SUPPORTED = ['vi', 'en'];
const DEFAULT_LANG = 'vi';

const cache = {};

// Gộp tất cả file .js trong 1 thư mục locale thành 1 bundle theo namespace (tên file)
function loadRaw(lang) {
    const dir = path.join(__dirname, lang);
    const bundle = {};
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.js')) continue;
        const ns = path.basename(file, '.js'); // 'common' | 'home' | 'messages' | ...
        bundle[ns] = require(path.join(dir, file));
    }
    return bundle;
}

function load(lang) {
    if (cache[lang]) return cache[lang];
    const base = loadRaw(DEFAULT_LANG);
    const bundle = lang === DEFAULT_LANG ? base : loadRaw(lang);
    // Namespace thiếu ở ngôn ngữ này -> fallback về ngôn ngữ mặc định
    if (lang !== DEFAULT_LANG) {
        for (const ns of Object.keys(base)) {
            if (!bundle[ns]) bundle[ns] = base[ns];
        }
    }
    cache[lang] = bundle;
    return bundle;
}

// Chuẩn hóa input (query, header Accept-Language, cookie...) về mã ngôn ngữ hợp lệ
function resolveLang(input) {
    const l = String(input || '').trim().toLowerCase().slice(0, 2);
    return SUPPORTED.includes(l) ? l : DEFAULT_LANG;
}

function trans(lang) {
    return load(resolveLang(lang));
}

module.exports = {SUPPORTED, DEFAULT_LANG, resolveLang, load, trans};
