const {Op} = require('sequelize');
const jwt = require('jsonwebtoken');
const {User} = require('../../Models/index.model');
const passwords = require('../../Helpers/password.helper');
const {logger} = require('../../../config/log4js');

// Phiên đăng nhập admin ký bằng JWT, cất trong cookie httpOnly (xem
// admin.auth.controller.js). Dài hơn token API (24h) vì đây là người ngồi quản
// trị, không phải service gọi máy-máy. Đổi được qua env khi cần.
const SESSION_TTL = process.env.ADMIN_SESSION_TTL || '7d';

const ROLES = ['admin', 'staff'];
const PER_PAGE_DEFAULT = 20;

const badReq = (msg) => Object.assign(new Error(msg), {status: 400});

class UserService {
    // ── Xác thực & phiên ──────────────────────────────────────────────────────

    /**
     * Kiểm tra đăng nhập. Cùng một thông báo cho MỌI lý do trượt (sai tên, sai
     * mật khẩu, tài khoản bị ẩn) — không để lộ tài khoản nào có thật.
     * @returns {Promise<User>} bản ghi user khi hợp lệ
     */
    static async authenticate(username, password) {
        const uname = String(username || '').trim();
        const generic = Object.assign(
            new Error('Tên đăng nhập hoặc mật khẩu không đúng.'), {status: 401});
        if (!uname || !password) throw generic;

        const user = await User.findOne({where: {username: uname}});
        if (!user || user.status !== 1) throw generic;
        if (!passwords.verify(password, user.password)) throw generic;

        await user.update({last_login_at: new Date()});
        return user;
    }

    /** Ký token phiên + tính maxAge để cookie hết hạn ĐÚNG lúc token hết hạn. */
    static issueSession(user) {
        const token = jwt.sign(
            {
                uid: user.id,
                username: user.username,
                role: user.role,
                name: user.full_name || user.username,
            },
            process.env.JWT_SECRET,
            {expiresIn: SESSION_TTL},
        );
        const decoded = jwt.decode(token);
        const maxAge = Math.max(decoded.exp * 1000 - Date.now(), 0);
        return {token, maxAge};
    }

    static verifySession(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    /**
     * Nạp lại user từ DB theo id trong token, CHỈ khi còn hoạt động.
     * Gọi mỗi request admin (adminAuth.middleware) nên khoá/xoá/đổi vai trò có
     * hiệu lực NGAY ở request kế tiếp, không phải chờ token hết hạn.
     */
    static async loadActiveById(id) {
        const user = await User.findByPk(id);
        if (!user || user.status !== 1) return null;
        return user;
    }

    /**
     * Tạo tài khoản admin đầu tiên khi bảng còn trống. Gọi lúc app khởi động
     * (index.js). Dùng lại ADMIN_USER/ADMIN_PASS — hai biến vốn có sẵn từ thời
     * Basic Auth cũ — nên không phát sinh cấu hình mới.
     */
    static async ensureDefaultAdmin() {
        const total = await User.count();
        if (total > 0) return null;

        const username = (process.env.ADMIN_USER || 'admin').trim() || 'admin';
        const password = process.env.ADMIN_PASS || 'admin';
        const user = await User.create({
            username,
            password: passwords.hash(password),
            full_name: 'Quản trị viên',
            role: 'admin',
            status: 1,
        });
        logger.warn(`Đã tạo tài khoản admin mặc định "${username}". `
            + 'Hãy ĐĂNG NHẬP và ĐỔI MẬT KHẨU ngay.');
        return user;
    }

    // Số admin đang hoạt động — dùng cho các chốt chặn "không được mất admin cuối".
    static countActiveAdmins() {
        return User.count({where: {role: 'admin', status: 1}});
    }

    // ── CRUD (chỉ admin gọi được — cưỡng chế ở route bằng requireRole) ─────────

    static async getAll(filters = {}) {
        const {q = '', role = '', status = '', page = 1, per_page = PER_PAGE_DEFAULT} = filters;
        const _page = Math.max(parseInt(page, 10) || 1, 1);
        const _perPage = Math.min(Math.max(parseInt(per_page, 10) || PER_PAGE_DEFAULT, 1), 100);

        const where = {};
        if (q) {
            where[Op.or] = [
                {username: {[Op.like]: `%${q}%`}},
                {full_name: {[Op.like]: `%${q}%`}},
            ];
        }
        if (ROLES.includes(role)) where.role = role;
        if (status === '0' || status === '1') where.status = parseInt(status, 10);

        const {rows, count} = await User.findAndCountAll({
            where,
            order: [['id', 'ASC']],
            limit: _perPage,
            offset: (_page - 1) * _perPage,
            // Không kéo cột `password` (hash) ra khỏi DB dù chỉ để liệt kê.
            attributes: {exclude: ['password']},
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

    static getById(id) {
        return User.findByPk(id, {attributes: {exclude: ['password']}});
    }

    static _normalize(d = {}) {
        const str = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
        return {
            username: (d.username || '').trim(),
            full_name: str(d.full_name),
            role: ROLES.includes(d.role) ? d.role : 'staff',
            status: String(d.status) === '0' ? 0 : 1,
            // Mật khẩu để nguyên chuỗi thô ở đây; băm sau khi đã xác thực độ dài.
            password: d.password == null ? '' : String(d.password),
        };
    }

    // Chặn trùng tên đăng nhập kèm thông báo tử tế (thay vì để lỗi UNIQUE thô của
    // MySQL nổi lên toast). excludeId: bỏ qua chính bản ghi đang sửa.
    static async _assertUsernameFree(username, excludeId = null) {
        const where = {username};
        if (excludeId) where.id = {[Op.ne]: excludeId};
        const existed = await User.findOne({where});
        if (existed) throw badReq('Tên đăng nhập đã tồn tại. Hãy chọn tên khác.');
    }

    static async create(data) {
        const n = UserService._normalize(data);
        if (!n.username) throw badReq('Tên đăng nhập là bắt buộc.');
        if (!n.password || n.password.length < passwords.MIN_PASSWORD_LENGTH) {
            throw badReq(`Mật khẩu tối thiểu ${passwords.MIN_PASSWORD_LENGTH} ký tự.`);
        }
        await UserService._assertUsernameFree(n.username);

        return User.create({
            username: n.username,
            password: passwords.hash(n.password),
            full_name: n.full_name,
            role: n.role,
            status: n.status,
        });
    }

    /**
     * @param {number} id
     * @param {object} data payload từ form
     * @param {{currentUserId?: number}} ctx tài khoản đang đăng nhập (để chốt chặn)
     */
    static async update(id, data, ctx = {}) {
        const user = await User.findByPk(id);
        if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản.'), {status: 404});

        const n = UserService._normalize(data);
        if (!n.username) throw badReq('Tên đăng nhập là bắt buộc.');
        await UserService._assertUsernameFree(n.username, user.id);

        // CHỐT CHẶN "admin cuối cùng": hạ vai trò HOẶC ẩn tài khoản admin đang
        // hoạt động cuối cùng sẽ khoá cả hệ thống ra ngoài. Kiểm khi bản ghi này
        // hiện là admin đang bật, mà thay đổi làm nó thôi-là-admin-đang-bật.
        const wasActiveAdmin = user.role === 'admin' && user.status === 1;
        const staysActiveAdmin = n.role === 'admin' && n.status === 1;
        if (wasActiveAdmin && !staysActiveAdmin) {
            const admins = await UserService.countActiveAdmins();
            if (admins <= 1) {
                throw badReq('Phải còn ít nhất một quản trị viên đang hoạt động. '
                    + 'Hãy cấp quyền admin cho tài khoản khác trước.');
            }
        }

        const patch = {
            username: n.username,
            full_name: n.full_name,
            role: n.role,
            status: n.status,
        };
        // Mật khẩu chỉ đổi khi có nhập — ô trống = giữ nguyên mật khẩu cũ.
        if (n.password) {
            if (n.password.length < passwords.MIN_PASSWORD_LENGTH) {
                throw badReq(`Mật khẩu tối thiểu ${passwords.MIN_PASSWORD_LENGTH} ký tự.`);
            }
            patch.password = passwords.hash(n.password);
        }

        return user.update(patch);
    }

    static async delete(id, ctx = {}) {
        const targetId = parseInt(id, 10);
        // Tự xoá mình = tự khoá phiên đang chạy, và nếu là admin cuối thì mất
        // luôn lối vào. Chặn thẳng cho rõ ràng.
        if (ctx.currentUserId && targetId === parseInt(ctx.currentUserId, 10)) {
            throw badReq('Không thể tự xoá tài khoản bạn đang đăng nhập.');
        }

        const user = await User.findByPk(targetId);
        if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản.'), {status: 404});

        if (user.role === 'admin' && user.status === 1) {
            const admins = await UserService.countActiveAdmins();
            if (admins <= 1) {
                throw badReq('Phải còn ít nhất một quản trị viên đang hoạt động.');
            }
        }
        await user.destroy();
    }
}

module.exports = UserService;
module.exports.ROLES = ROLES;
