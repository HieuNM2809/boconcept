const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const {logger, traceIdMiddleware} = require('../../../config/log4js');
require('express-async-errors');

let globalErrorHandlersRegistered = false;

function registerGlobalErrorHandlers() {
    if (globalErrorHandlersRegistered) return;
    globalErrorHandlersRegistered = true;

    process.on('uncaughtException', (err) => {
        logger.fatal('Uncaught exception', {
            error: {message: err.message, stack: err.stack},
        });
    });

    process.on('unhandledRejection', (reason) => {
        const error = reason instanceof Error
            ? {message: reason.message, stack: reason.stack}
            : {message: String(reason)};
        logger.error('Unhandled promise rejection', {error});
    });
}

function applyApiMiddlewares(app) {
    registerGlobalErrorHandlers();

    // 0. Gắn trace id cho mỗi request
    app.use(traceIdMiddleware);

    // 1. Body parser
    app.use(express.json({limit: process.env.BODY_LIMIT || '16mb'}));
    // `limit` là BẮT BUỘC ở đây: body-parser mặc định chặn urlencoded ở 100KB
    // (KHÔNG kế thừa BODY_LIMIT như express.json ở trên), nên form admin có icon
    // base64 sẽ bị trả 413 dạng JSON thô thay vì báo lỗi trên form.
    app.use(express.urlencoded({extended: true, limit: process.env.BODY_LIMIT || '16mb'}));

    // 2. Header bảo mật cơ bản (CSP nới cho trang render EJS: ảnh ngoài, google fonts, inline)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // `blob:` là BẮT BUỘC: form admin thu nhỏ ảnh bằng cách nạp file
                // qua URL.createObjectURL(), tức là một URL blob:. Thiếu nó thì
                // trình duyệt chặn, img.onerror chạy và MỌI lần chọn ảnh đều báo
                // "File không phải ảnh hợp lệ" — kể cả ảnh JPEG bình thường.
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                // BẮT BUỘC khai báo: không có `frame-src` thì nó rơi về
                // `default-src 'self'` và trình duyệt CHẶN iframe Google Maps ở
                // footer — bản đồ ra ô trắng kèm lỗi CSP trong console. Kiểm tra
                // ở phía Google (200, không có X-Frame-Options) không phát hiện
                // được, vì bên chặn là CSP của chính site này.
                frameSrc: ["'self'", 'https://www.google.com'],
            },
        },
    }));

    // 3. Chống HTTP Parameter Pollution
    // `whitelist` là BẮT BUỘC cho các field vốn dĩ là mảng: hpp mặc định gộp
    // mọi tham số trùng tên về GIÁ TRỊ CUỐI, nên form gửi gallery[]=a&gallery[]=b
    // sẽ chỉ còn "b" và admin lưu 5 ảnh xong chỉ thấy 1 ảnh, không báo lỗi gì.
    //
    // Các trường của khe lưới ảnh mang tiền tố `slot_` chứ không dùng thẳng
    // `image`/`alt_vi`/`alt_en`: whitelist tên chung sẽ gỡ mất lớp bảo vệ này ở
    // MỌI form admin khác đang dùng `image` đơn (slides, news, pages, ...), và ở
    // đó một mảng lọt vào sẽ làm `.trim()` ném lỗi 500.
    app.use(hpp({whitelist: ['gallery', 'slot_image', 'slot_alt_vi', 'slot_alt_en']}));

    // 4. CORS
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    }));

    // 5. Nén response (gzip)
    app.use(compression());

    // 6. Log request (tắt khi chạy test cho gọn output)
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('combined'));
    }

    // 7. Giới hạn số request theo IP
    const limiter = rateLimit({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: {status: 'error', message: 'Too many requests, please try again later.'},
    });
    app.use(limiter);
}

function applyErrorHandler(app) {
    // Middleware xử lý lỗi tập trung (đặt sau cùng)
    app.use((err, req, res, next) => {
        logger.error('Unhandled application error', {
            error: {
                message: err && err.message ? err.message : 'Unknown error',
                stack: err && err.stack ? err.stack : undefined,
            },
            meta: {method: req.method, url: req.originalUrl},
        });

        res.status(err.status || 500).json({
            status: 'error',
            message: err.message || 'Internal Server Error',
            error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
    });
}

module.exports = {applyApiMiddlewares, applyErrorHandler};
