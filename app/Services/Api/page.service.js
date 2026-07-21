const {Page} = require('../../Models/index.model');

// Trang nội dung giờ CHỈ còn sửa, không thêm/xoá: màn /admin/pages quản đúng một
// bản ghi hệ thống (slug `about`). Vì vậy service không còn create/delete/getAll
// — và `slug` không bao giờ đổi, nên cũng không cần danh sách slug được bảo vệ.
class PageService {
    /** Trang đang hiện — dùng cho phía công khai (/about, /pages/:slug, trang chủ). */
    static async getBySlug(slug) {
        return Page.findOne({where: {slug: String(slug || '').trim(), status: 1}});
    }

    /** Bỏ qua status — dùng cho admin, để trang đang ẩn vẫn mở ra sửa được. */
    static async getBySlugAny(slug) {
        return Page.findOne({where: {slug: String(slug || '').trim()}});
    }

    static async getById(id) {
        return Page.findByPk(id);
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
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

    static async update(id, d) {
        const row = await Page.findByPk(id);
        if (!row) throw Object.assign(new Error('Page not found'), {status: 404});
        const n = PageService._normalize(d);
        // title_vi là chỗ duy nhất bắt buộc: nó vừa là H1 trang /about vừa là tiêu
        // đề khối giới thiệu ngoài trang chủ, để trống là thủng cả hai chỗ.
        if (!n.title_vi) throw Object.assign(new Error('Tiêu đề (VI) là bắt buộc'), {status: 400});
        // `slug` cố tình KHÔNG nằm trong _normalize: form không gửi nó nữa, và đổi
        // slug là địa chỉ /about chết.
        return row.update(n);
    }
}

module.exports = PageService;
