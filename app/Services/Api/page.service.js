const {Page} = require('../../Models/index.model');

// Slug được coi là "hệ thống": xoá đi là trang /about chết. Admin sửa nội dung
// được nhưng không xoá được hàng này.
const PROTECTED_SLUGS = ['about'];

class PageService {
    static async getBySlug(slug) {
        return Page.findOne({where: {slug: String(slug || '').trim(), status: 1}});
    }

    static async getAll() {
        return Page.findAll({order: [['id', 'ASC']]});
    }

    static async getById(id) {
        return Page.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            // Chuẩn hoá slug: chỉ chữ thường, số và gạch ngang — tránh slug có
            // dấu cách hay ký tự lạ làm URL không mở được.
            slug: String(d.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
            title_vi: (d.title_vi || '').trim(),
            title_en: str(d.title_en),
            excerpt_vi: str(d.excerpt_vi),
            excerpt_en: str(d.excerpt_en),
            body_vi: str(d.body_vi),
            body_en: str(d.body_en),
            image: str(d.image),
            status: String(d.status) === '0' ? 0 : 1,
        };
    }

    static _validate(n) {
        if (!n.slug) throw Object.assign(new Error('Slug là bắt buộc'), {status: 400});
        if (!n.title_vi) throw Object.assign(new Error('Tiêu đề (VI) là bắt buộc'), {status: 400});
    }

    static async create(d) {
        const n = PageService._normalize(d);
        PageService._validate(n);
        const dup = await Page.findOne({where: {slug: n.slug}});
        if (dup) throw Object.assign(new Error(`Slug "${n.slug}" đã tồn tại`), {status: 400});
        return Page.create(n);
    }

    static async update(id, d) {
        const row = await Page.findByPk(id);
        if (!row) throw Object.assign(new Error('Page not found'), {status: 404});
        const n = PageService._normalize(d);
        PageService._validate(n);
        // Không cho đổi slug của trang hệ thống — đổi là /about trả 404.
        if (PROTECTED_SLUGS.includes(row.slug) && n.slug !== row.slug) {
            throw Object.assign(new Error(`Không thể đổi slug của trang hệ thống "${row.slug}"`), {status: 400});
        }
        const dup = await Page.findOne({where: {slug: n.slug}});
        if (dup && dup.id !== row.id) throw Object.assign(new Error(`Slug "${n.slug}" đã tồn tại`), {status: 400});
        return row.update(n);
    }

    static async delete(id) {
        const row = await Page.findByPk(id);
        if (!row) throw Object.assign(new Error('Page not found'), {status: 404});
        if (PROTECTED_SLUGS.includes(row.slug)) {
            throw Object.assign(new Error(`Không thể xóa trang hệ thống "${row.slug}"`), {status: 400});
        }
        await row.destroy();
    }
}

PageService.PROTECTED_SLUGS = PROTECTED_SLUGS;

module.exports = PageService;
