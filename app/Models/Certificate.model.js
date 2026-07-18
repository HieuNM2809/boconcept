const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Giấy chứng nhận công ty (hiển thị ở trang chủ, song ngữ).
const Certificate = sequelize.define('Certificate', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    image: {type: DataTypes.TEXT('medium'), allowNull: false},
    title_vi: {type: DataTypes.STRING(255), allowNull: true},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'certificates',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_certificates_status', fields: ['status']}],
});

module.exports = Certificate;
