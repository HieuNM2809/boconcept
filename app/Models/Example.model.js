const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Model mẫu — copy file này và đổi tên khi tạo entity mới.
const Example = sequelize.define('Example', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    status: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'examples',
    underscored: true,
    timestamps: true,
    paranoid: true, // xóa mềm: tự thêm cột deleted_at
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

module.exports = Example;
