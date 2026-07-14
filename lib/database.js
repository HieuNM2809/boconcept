const {Sequelize} = require('sequelize');
const mysqlConfig = require('../config/mysql');

const sequelize = new Sequelize(
    mysqlConfig.DATABASE,
    mysqlConfig.USERNAME,
    mysqlConfig.PASSWORD,
    mysqlConfig.option
);

// Tự kết nối lại khi khởi động gặp lỗi (fail-soft)
async function reconnect() {
    try {
        await sequelize.authenticate();
        console.log('MySQL connected');
    } catch (error) {
        console.error('Unable to connect to MySQL:', error.message);
        setTimeout(reconnect, 5000);
    }
}

async function shutdownAndExit(code = 0) {
    try {
        await sequelize.close();
        console.log('Sequelize pool closed.');
    } catch (err) {
        console.error('Error closing Sequelize pool:', err.message);
    }
    process.exit(code);
}

if (require.main !== module && process.env.NODE_ENV !== 'test') {
    reconnect();
}

process.on('SIGINT', () => shutdownAndExit(0));
process.on('SIGTERM', () => shutdownAndExit(0));

module.exports = sequelize;
