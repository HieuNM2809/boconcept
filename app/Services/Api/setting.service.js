const {Setting} = require('../../Models/index.model');

// Khoá cấu hình đang dùng. Khai báo tập trung để không rải chuỗi ma thuật khắp code.
const KEYS = {
    FEATURES_BLOCK: 'features_block_enabled',
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
