const path = require('path');
require('dotenv').config({path: path.resolve(__dirname, '../.env')});

module.exports.option = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    // Bắt buộc utf8mb4 cho kết nối để tiếng Việt không bị lỗi mã hóa
    dialectOptions: {
        charset: 'utf8mb4',
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
    },
    pool: {
        max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
        min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
        acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
        idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
    retry: {
        max: parseInt(process.env.DB_RETRY_MAX, 10) || 3,
    },
    timezone: '+07:00',
    logging: false,
};

module.exports.DATABASE = process.env.DB_NAME;
module.exports.USERNAME = process.env.DB_USER;
module.exports.PASSWORD = process.env.DB_PASS;
