const {DataTypes} = require('sequelize');
const sequelize = require('../../lib/database');

const ApiClient = sequelize.define('ApiClient', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    service_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    client_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    client_secret: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    is_active: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    tableName: 'api_clients',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = ApiClient;
