// Test kết nối MySQL thật. Chỉ chạy khi bật RUN_DB_TESTS=1 (cần DB đang chạy):
//   RUN_DB_TESTS=1 npm test
const runDbTests = process.env.RUN_DB_TESTS === '1';

(runDbTests ? describe : describe.skip)('MySQL connectivity', () => {
    it('sequelize.authenticate() thành công', async () => {
        require('dotenv').config();
        const sequelize = require('../../lib/database');
        await sequelize.authenticate();
        await sequelize.close();
    }, 20000); // timeout rộng: lần đầu kết nối MySQL 8 (RSA handshake) có thể chậm
});
