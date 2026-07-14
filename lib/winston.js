'use strict';
const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

// Logger ghi ra FILE (xoay vòng theo ngày) — bổ trợ cho log4js (log ra stdout).
// Dùng khi cần lưu log vào ổ đĩa: require('../../lib/winston').
const LOG_DIR = path.resolve(__dirname, '../storage/logs/');
const MAX_SIZE = '50m';
const MAX_FILES = '30d';
const DATE_PATTERN = 'YYYY-MM-DD-HH';

const logFormat = winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    winston.format.printf((info) => {
        if (info.stack) return `[${info.timestamp}] [${info.level}]: ${info.stack}`;
        return `[${info.timestamp}] [${info.level}]: ${info.message}`;
    })
);

const createLogger = (level, filename) => winston.createLogger({
    defaultMeta: {service: 'log-service'},
    format: logFormat,
    transports: [
        new winston.transports.Console({format: winston.format.colorize({all: true})}),
        new winston.transports.DailyRotateFile({
            level,
            dirname: LOG_DIR,
            filename: `${filename}-%DATE%.log`,
            datePattern: DATE_PATTERN,
            zippedArchive: true,
            maxSize: MAX_SIZE,
            maxFiles: MAX_FILES,
        }),
    ],
});

const infoLogger = createLogger('info', 'info');
const debugLogger = createLogger('debug', 'debug');
const errorLogger = createLogger('error', 'error');

const parseLogs = (key, params) => {
    if (typeof key === 'object') key = JSON.stringify(key);
    return params !== undefined ? `${key}: ${JSON.stringify(params)}` : key;
};

module.exports = {
    info: (key, params) => infoLogger.info(parseLogs(key, params)),
    debug: (key, params) => debugLogger.debug(parseLogs(key, params)),
    error: (key, params) => errorLogger.error(parseLogs(key, params)),
};
