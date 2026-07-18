const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Khối Công năng dưới slideshow (song ngữ). Mô tả chỉ hiện khi hover ở frontend.
// icon: TEXT vì có thể là đường dẫn ('/static/icons/x.svg') HOẶC data URI base64
// khi admin upload file — xem app/Services/Api/feature.service.js.
const Feature = sequelize.define('Feature', {
    id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
    icon: {type: DataTypes.TEXT('medium'), allowNull: false},
    title_vi: {type: DataTypes.STRING(255), allowNull: false},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    description_vi: {type: DataTypes.STRING(500), allowNull: true},
    description_en: {type: DataTypes.STRING(500), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'features',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_features_status', fields: ['status']}],
});

module.exports = Feature;
