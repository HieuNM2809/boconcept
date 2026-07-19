const {Op} = require('sequelize');
const {Category, Product} = require('../../Models/index.model');

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
