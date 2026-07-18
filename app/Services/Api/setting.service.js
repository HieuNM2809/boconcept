const {Setting} = require('../../Models/index.model');

// Khoá cấu hình đang dùng. Khai báo tập trung để không rải chuỗi ma thuật khắp code.
const KEYS = {
    FEATURES_BLOCK: 'features_block_enabled',
    // Khối "Loại sản phẩm" — tiêu đề + mô tả, sửa trong /admin/content
    CAT_TITLE_VI: 'categories_title_vi',
    CAT_TITLE_EN: 'categories_title_en',
    CAT_DESC_VI: 'categories_desc_vi',
    CAT_DESC_EN: 'categories_desc_en',
    // Khối "Tin tức" — tiêu đề + mô tả + nhãn/link nút, sửa trong /admin/content
    NEWS_TITLE_VI: 'news_title_vi',
    NEWS_TITLE_EN: 'news_title_en',
    NEWS_DESC_VI: 'news_desc_vi',
    NEWS_DESC_EN: 'news_desc_en',
    NEWS_CTA_VI: 'news_cta_vi',
    NEWS_CTA_EN: 'news_cta_en',
    NEWS_CTA_LINK: 'news_cta_link',
};

class SettingService {
    /**
     * Đọc 1 setting dạng boolean.
     * Chưa có hàng trong DB -> trả về `fallback` (mặc định bật) thay vì false,
     * để lần đầu deploy chưa seed thì khối vẫn hiện chứ không im lặng biến mất.
     */
    static async getBool(key, fallback = true) {
        const row = await Setting.findByPk(key);
        if (!row || row.value == null) return fallback;
        return String(row.value) === '1';
    }

    static async setBool(key, on) {
        return SettingService.set(key, on ? '1' : '0');
    }

    static async set(key, value) {
        const v = value == null || String(value).trim() === '' ? null : String(value).trim();
        const row = await Setting.findByPk(key);
        if (row) return row.update({value: v});
        return Setting.create({key, value: v});
    }

    /**
     * Đọc nhiều khoá một lượt -> { key: value }. Khoá chưa có trả về null.
     * Một query thay vì N query, vì trang chủ cần 4 khoá cùng lúc.
     */
    static async getMany(keys) {
        const rows = await Setting.findAll({where: {key: keys}});
        const out = Object.fromEntries(keys.map((k) => [k, null]));
        rows.forEach((r) => { out[r.key] = r.value; });
        return out;
    }

    static async setMany(pairs) {
        for (const [key, value] of Object.entries(pairs)) {
            await SettingService.set(key, value);
        }
    }
}

SettingService.KEYS = KEYS;

module.exports = SettingService;
