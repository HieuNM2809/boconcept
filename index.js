require('dotenv').config({path: '.env'});

const path = require('path');
const express = require('express');
const {logger} = require('./config/log4js');
const sequelize = require('./lib/database');
const {applyApiMiddlewares, applyErrorHandler} = require('./app/Http/Middleware/index.middleware');
const registerRoutes = require('./routes/index.route');

// Nạp associations giữa các model (định nghĩa quan hệ tại 1 chỗ)
require('./app/Models/index.model');

const app = express();
const port = process.env.PORT || 3000;

// View engine (EJS) + tài nguyên tĩnh (css/js/ảnh) tại /static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

applyApiMiddlewares(app);
// i18n cho mọi request: gắn lang + bộ dịch vào res.locals (áp dụng toàn bộ pages)
app.use(require('./app/Http/Middleware/locale.middleware'));
registerRoutes(app);
applyErrorHandler(app);

async function startServer() {
    try {
        await sequelize.authenticate();
        logger.info('Kết nối MySQL thành công');
    } catch (err) {
        logger.error('Không kết nối được MySQL', {error: {message: err.message, stack: err.stack}});
        process.exit(1);
    }

    app.listen(port, () => {
        logger.info(`Server đang chạy tại http://localhost:${port}`);
    });
}

// Chỉ khởi động server khi chạy trực tiếp (không chạy khi được require trong test)
if (require.main === module) {
    startServer();
}

module.exports = app;
