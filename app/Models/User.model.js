const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Tài khoản đăng nhập khu quản trị /admin. Hai vai trò:
//   - 'admin': toàn quyền, KÈM quản lý user (thêm/sửa/xoá tài khoản, đặt vai trò).
//   - 'staff': mọi thao tác quản trị KHÁC, nhưng KHÔNG vào được mục quản lý user.
// Phân quyền cưỡng chế ở tầng route (requireRole.middleware.js), không ở đây.
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    // Chuỗi "scrypt$<salt>$<hash>" do app/Helpers/password.helper.js sinh —
    // KHÔNG bao giờ là mật khẩu thô.
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('admin', 'staff'),
        allowNull: false,
        defaultValue: 'staff',
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    // CỐ Ý KHÔNG paranoid (khác chuẩn chung của repo): username là UNIQUE, mà
    // soft-delete vẫn giữ hàng nên tên cũ bị chiếm chỗ -> không tạo lại được tài
    // khoản cùng tên sau khi xoá. Tài khoản quản trị thì xoá hẳn là đúng ý hơn.
    paranoid: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {name: 'idx_users_role', fields: ['role']},
        {name: 'idx_users_status', fields: ['status']},
    ],
});

module.exports = User;
