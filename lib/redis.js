const Redis = require('ioredis');
const config = require('../config/redis');

// Client ioredis dùng chung toàn app. Hỗ trợ get/set/setex/del... trực tiếp.
const redis = new Redis({
    host: config.host,
    port: config.port,
    db: config.db,
    password: config.password || undefined,
    lazyConnect: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 200, 5000),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

async function shutdownAndExit(code = 0) {
    try {
        await redis.quit();
        console.log('Redis connection closed.');
    } catch (err) {
        console.error('Error closing Redis connection:', err.message);
    }
    process.exit(code);
}

process.on('SIGINT', () => shutdownAndExit(0));
process.on('SIGTERM', () => shutdownAndExit(0));

module.exports = redis;
