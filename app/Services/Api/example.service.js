const {Op} = require('sequelize');
const {Example} = require('../../Models/index.model');

class ExampleService {
    /**
     * Danh sách có phân trang + tìm kiếm theo name.
     * @param {object} filters - { page, per_page, q }
     */
    static async getAll({page = 1, per_page = 20, q = null} = {}) {
        const _page = Math.max(parseInt(page, 10) || 1, 1);
        const _perPage = Math.min(Math.max(parseInt(per_page, 10) || 20, 1), 100);

        const where = {};
        if (q) {
            where.name = {[Op.like]: `%${q}%`};
        }

        const {rows, count} = await Example.findAndCountAll({
            where,
            order: [['id', 'DESC']],
            limit: _perPage,
            offset: (_page - 1) * _perPage,
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
        return Example.findByPk(id);
    }

    static async create(data) {
        return Example.create({
            name: data.name,
            description: data.description ?? null,
            status: data.status ?? 1,
        });
    }

    static async update(id, data) {
        const item = await Example.findByPk(id);
        if (!item) {
            throw Object.assign(new Error('Example not found'), {status: 404});
        }
        return item.update(data);
    }

    /**
     * Xóa mềm (paranoid) — bản ghi được đánh dấu deleted_at, không mất khỏi DB.
     */
    static async delete(id) {
        const item = await Example.findByPk(id);
        if (!item) {
            throw Object.assign(new Error('Example not found'), {status: 404});
        }
        await item.destroy();
    }
}

module.exports = ExampleService;
