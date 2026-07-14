const log4js = require('log4js');
const os = require('os');
const {v4: uuidv4} = require('uuid');

const serviceName = process.env.APP_ENV || 'app-service';
const hostName = os.hostname();

log4js.addLayout('json', (config) => {
    const {separator = '\n'} = config || {};

    return (loggingEvent) => {
        const {startTime, categoryName, data, level, context} = loggingEvent;
        const [message, extras] = data;
        const logObject = {
            action_time: startTime.toTimeString(),
            service: context.service || serviceName,
            host: context.host || hostName,
            traceId: context.traceId || null,
            level: level.levelStr,
            category: categoryName,
            message,
        };
        if (extras && typeof extras === 'object') {
            if (extras.meta) logObject.meta = extras.meta;
            if (extras.error) logObject.error = extras.error;
        }
        return JSON.stringify(logObject) + separator;
    };
});

log4js.configure({
    appenders: {
        out: {
            type: 'stdout',
            layout: {
                type: 'json',
                separator: '\n',
                timezoneOffset: -420,
            },
        },
    },
    categories: {
        default: {appenders: ['out'], level: process.env.LOG_LEVEL || 'debug'},
    },
    pm2: true,
});

const logger = log4js.getLogger();
logger.addContext('service', serviceName);
logger.addContext('host', hostName);

// Gắn traceId cho từng request để trace log xuyên suốt
function traceIdMiddleware(req, res, next) {
    const traceId = req.headers['x-trace-id'] || uuidv4();
    logger.addContext('traceId', traceId);
    res.setHeader('X-Trace-Id', traceId);
    next();
}

module.exports = {log4js, logger, traceIdMiddleware};

// Cách dùng:
// logger.info('Ứng dụng khởi động thành công');
// logger.warn('Cảnh báo', {meta: {orderId: 987}});
// logger.error('Xử lý thất bại', {error: {message: err.message, stack: err.stack}});
