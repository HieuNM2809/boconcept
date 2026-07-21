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

// Cache-busting cho CSS/JS: markup và style đổi cùng lúc, nếu trình duyệt còn giữ
// style.css cũ thì header 2 hàng mới sẽ bị style bằng rule 1 hàng cũ -> vỡ layout.
app.locals.assetVersion = Date.now().toString(36);

applyApiMiddlewares(app);
// i18n cho mọi request: gắn lang + bộ dịch vào res.locals (áp dụng toàn bộ pages)
app.use(require('./app/Http/Middleware/locale.middleware'));
registerRoutes(app);
applyErrorHandler(app);

// Cửa sổ chờ MySQL lúc khởi động. Phải NHỎ HƠN healthcheckTimeout trong
// railway.json (100s), nếu không Railway bỏ cuộc trước khi ta kịp thử xong.
const DB_WAIT_MS = 60_000;
const DB_RETRY_STEP_MS = 3_000;

async function startServer() {
    // Mở cổng TRƯỚC, thử DB SAU — thứ tự này là cả điểm mấu chốt.
    //
    // Bản cũ authenticate() trước rồi process.exit(1) nếu trượt, nên app chết
    // trước khi kịp listen. Hậu quả trên Railway: healthcheck /health không gọi
    // được -> deploy bị đánh fail -> Railway GIỮ NGUYÊN bản deploy cũ. Nhìn từ
    // ngoài y hệt "build xong mà không nhận code mới", dù build đã thành công.
    //
    // Mà lần authenticate() đầu trượt là chuyện BÌNH THƯỜNG ở đây: private
    // network của Railway (mysql.railway.internal) chỉ chạy IPv6 và cần vài trăm
    // ms mới sẵn sàng sau khi container start.
    app.listen(port, () => {
        logger.info(`Server đang chạy tại http://localhost:${port}`);
    });

    const deadline = Date.now() + DB_WAIT_MS;
    for (let attempt = 1; ; attempt++) {
        try {
            await sequelize.authenticate();
            app.locals.dbReady = true;   // /health chuyển sang 200 từ đây
            logger.info(`Kết nối MySQL thành công (lần thử ${attempt})`);
            return;
        } catch (err) {
            if (Date.now() >= deadline) {
                // Hết cửa sổ chờ: CỐ Ý không process.exit. Cứ để process sống,
                // /health tiếp tục trả 503 -> Railway vẫn đánh deploy này là fail
                // và giữ bản cũ (đúng cái process.exit(1) cũ bảo vệ), nhưng log
                // chẩn đoán không bị giết theo nên còn đọc được nguyên nhân.
                logger.error(
                    `Không kết nối được MySQL sau ${attempt} lần trong ${DB_WAIT_MS / 1000}s`
                    + ` — host=${process.env.DB_HOST} port=${process.env.DB_PORT}`
                    + ` db=${process.env.DB_NAME} user=${process.env.DB_USER}`,
                    {error: {message: err.message, code: err.original && err.original.code}}
                );
                return;
            }
            logger.warn(`MySQL chưa sẵn sàng (lần ${attempt}): ${err.message}`
                + ` — thử lại sau ${DB_RETRY_STEP_MS / 1000}s`);
            await new Promise((r) => setTimeout(r, DB_RETRY_STEP_MS));
        }
    }
}

// Chỉ khởi động server khi chạy trực tiếp (không chạy khi được require trong test)
if (require.main === module) {
    startServer();
}

module.exports = app;
