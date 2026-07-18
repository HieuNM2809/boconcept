const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Đối tác hợp tác (logo hoặc tên chữ) hiển thị ở trang chủ.
const Partner = sequelize.define('Partner', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING(255), allowNull: false},
    logo: {type: DataTypes.TEXT('medium'), allowNull: true}, // URL logo (tùy chọn)
    link: {type: DataTypes.STRING(500), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'partners',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_partners_status', fields: ['status']}],
});

module.exports = Partner;
