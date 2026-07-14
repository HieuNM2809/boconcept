const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

// Slide cho hero slideshow trang chủ (song ngữ).
const Slide = sequelize.define('Slide', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    image: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    title_vi: {type: DataTypes.STRING(255), allowNull: true},
    title_en: {type: DataTypes.STRING(255), allowNull: true},
    badge_vi: {type: DataTypes.STRING(255), allowNull: true},
    badge_en: {type: DataTypes.STRING(255), allowNull: true},
    link: {type: DataTypes.STRING(500), allowNull: true},
    sort_order: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
    status: {type: DataTypes.TINYINT, allowNull: false, defaultValue: 1},
}, {
    tableName: 'slides',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{name: 'idx_slides_status', fields: ['status']}],
});

module.exports = Slide;
