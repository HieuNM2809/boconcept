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
    app.use(express.json({limit: process.env.BODY_LIMIT || '1mb'}));
    app.use(express.urlencoded({extended: true}));

    // 2. Header bảo mật cơ bản (CSP nới cho trang render EJS: ảnh ngoài, google fonts, inline)
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    }));

    // 3. Chống HTTP Parameter Pollution
    app.use(hpp());

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
