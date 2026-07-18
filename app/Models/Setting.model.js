const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Cấu hình site dạng key/value (công tắc bật/tắt khối, ...).
// `key` là khoá chính -> không có cột id, và timestamps vẫn theo chuẩn chung.
const Setting = sequelize.define('Setting', {
    key: {type: DataTypes.STRING(100), primaryKey: true},
    value: {type: DataTypes.STRING(500), allowNull: true},
}, {
    tableName: 'settings',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Setting;
