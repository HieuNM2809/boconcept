const {Op} = require('sequelize');
const {Category, Product} = require('../../Models/index.model');

// Sắp xếp cho màn danh sách quản trị (getPaged). Tên khoá trùng với giá trị
// trong ô <select> của views/admin/categories.ejs.
const CATEGORY_SORT_MAP = {
    oldest: [['id', 'ASC']],
    newest: [['id', 'DESC']],
    sort_order: [['sort_order', 'ASC'], ['id', 'ASC']],
    name_asc: [['name_vi', 'ASC']],
    name_desc: [['name_vi', 'DESC']],
};

class CategoryService {
    /**
     * Danh sách danh mục.
     * @param {object} filters - { tree, parent_id, status, q }
     *   tree=true  -> trả về cây lồng nhau (children)
     *   tree=false -> danh sách phẳng, sắp theo sort_order
     */
    static async getAll({tree = false, parent_id, status, q} = {}) {
        const where = {};
        if (status !== undefined && status !== '') where.status = parseInt(status, 10);
        if (q) where.name_vi = {[Op.like]: `%${q}%`};

        const asTree = tree === true || tree === 'true' || tree === '1' || tree === 1;

        if (!asTree) {
            if (parent_id !== undefined && parent_id !== '') {
                where.parent_id = parent_id === 'null' ? null : parseInt(parent_id, 10);
            }
            return Category.findAll({where, order: [['sort_order', 'ASC'], ['id', 'ASC']]});
        }

        // Build cây từ toàn bộ danh mục (1 query)
        const all = await Category.findAll({where, order: [['sort_order', 'ASC'], ['id', 'ASC']], raw: true});
        const byId = new Map(all.map((c) => [c.id, {...c, children: []}]));
        const roots = [];
        for (const node of byId.values()) {
            if (node.parent_id && byId.has(node.parent_id)) {
                byId.get(node.parent_id).children.push(node);
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    /**
     * Danh sách danh mục CÓ PHÂN TRANG + bộ lọc — dùng cho màn quản trị.
     * Tách khỏi getAll() thay vì thêm tham số: getAll() đang được menu header,
     * ô chọn danh mục ở form sản phẩm và form danh mục gọi, tất cả đều cần TOÀN
     * BỘ danh sách — cắt trang ở đó là menu mất mục.
     * @param {object} filters - { page, per_page, q, parent_id, status, is_featured, sort }
     *   parent_id = 'root' -> chỉ danh mục gốc (parent_id IS NULL)
     * @returns {{data: object[], meta: {total, per_page, current_page, last_page}}}
     */
    static async getPaged(filters = {}) {
        const {
            page = 1, per_page = 20, q = null,
            parent_id = '', status = '', is_featured = '', sort = 'oldest',
        } = filters;

        const _page = Math.max(parseInt(page, 10) || 1, 1);
        const _perPage = Math.min(Math.max(parseInt(per_page, 10) || 20, 1), 100);

        const where = {};
        if (status !== undefined && status !== '' && status !== null) where.status = parseInt(status, 10);
        if (is_featured !== undefined && is_featured !== '' && is_featured !== null) {
            where.is_featured = parseInt(is_featured, 10);
        }
        if (parent_id === 'root') where.parent_id = null;
        else if (parent_id !== '' && parent_id !== null && parent_id !== undefined) {
            where.parent_id = parseInt(parent_id, 10);
        }
        // Tìm trên CẢ HAI ngôn ngữ (getAll cũ chỉ tìm name_vi): admin gõ "sofa"
        // phải ra được mục chỉ đặt tên EN.
        if (q) {
            where[Op.or] = [
                {name_vi: {[Op.like]: `%${q}%`}},
                {name_en: {[Op.like]: `%${q}%`}},
            ];
        }

        const order = CATEGORY_SORT_MAP[sort] || CATEGORY_SORT_MAP.oldest;

        const {rows, count} = await Category.findAndCountAll({
            where, order, limit: _perPage, offset: (_page - 1) * _perPage, raw: true,
        });

        return {
            data: rows,
            meta: {
                total: count,
                per_page: _perPage,
                current_page: _page,
                last_page: Math.max(Math.ceil(count / _perPage), 1),
            },
        };
    }

    static async getById(id) {
        return Category.findByPk(id, {
            include: [{model: Category, as: 'children'}],
        });
    }

    static async create(data) {
        return Category.create({
            parent_id: data.parent_id ?? null,
            name_vi: data.name_vi,
            name_en: data.name_en ?? null,
            slug: data.slug ?? null,
            image: data.image ?? null,
            // Bốn trường này TỪNG BỊ BỎ SÓT ở đây: form admin gửi lên đủ, `update`
            // nhận đủ (nó truyền thẳng `data`), riêng `create` liệt kê cứng từng
            // trường nên khi THÊM MỚI thì tiêu đề/mô tả bị vứt im lặng — người
            // dùng nhập xong, lưu, quay lại sửa mới thấy trống.
            title_vi: data.title_vi ?? null,
            title_en: data.title_en ?? null,
            description_vi: data.description_vi ?? null,
            description_en: data.description_en ?? null,
            sort_order: data.sort_order ?? 0,
            is_featured: data.is_featured ?? 0,
            status: data.status ?? 1,
        });
    }

    static async update(id, data) {
        const item = await Category.findByPk(id);
        if (!item) throw Object.assign(new Error('Category not found'), {status: 404});
        return item.update(data);
    }

    static async delete(id) {
        const item = await Category.findByPk(id);
        if (!item) throw Object.assign(new Error('Category not found'), {status: 404});

        // Chặn xóa khi còn danh mục con hoặc còn sản phẩm
        const childCount = await Category.count({where: {parent_id: id}});
        if (childCount > 0) {
            throw Object.assign(new Error('Không thể xóa: danh mục còn danh mục con'), {status: 400});
        }
        const productCount = await Product.count({where: {category_id: id}});
        if (productCount > 0) {
            throw Object.assign(new Error('Không thể xóa: danh mục còn sản phẩm'), {status: 400});
        }
        await item.destroy();
    }

    /**
     * Breadcrumb: đi ngược lên theo parent_id. Trả {current, chain}.
     */
    static async getBreadcrumb(id) {
        const chain = [];
        const guard = new Set();
        let cur = await Category.findByPk(id, {raw: true});
        const current = cur;
        while (cur && !guard.has(cur.id)) {
            guard.add(cur.id);
            chain.unshift(cur);
            cur = cur.parent_id ? await Category.findByPk(cur.parent_id, {raw: true}) : null;
        }
        return {current, chain};
    }

    /**
     * Danh mục con của parentId kèm số sản phẩm (product_count).
     */
    static async getChildrenWithCounts(parentId) {
        const children = await Category.findAll({
            where: {parent_id: parentId, status: 1},
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            raw: true,
        });
        await Promise.all(children.map(async (c) => {
            c.product_count = await Product.count({where: {category_id: c.id, status: 1}});
        }));
        return children;
    }

    /**
     * Danh sách loại sản phẩm (status=1) kèm số sản phẩm, sắp theo sort_order.
     * Dùng cho mục "Thông tin sản phẩm nổi bật" ở trang chủ.
     */
    static async getWithProductCounts({limit = null} = {}) {
        const opts = {
            where: {status: 1},
            order: [['sort_order', 'ASC'], ['id', 'ASC']],
            raw: true,
        };
        if (limit) opts.limit = parseInt(limit, 10);
        const cats = await Category.findAll(opts);
        await Promise.all(cats.map(async (c) => {
            c.product_count = await Product.count({where: {category_id: c.id, status: 1}});
        }));
        return cats;
    }
}

module.exports = CategoryService;
