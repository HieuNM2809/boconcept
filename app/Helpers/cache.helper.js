const redis = require('../../lib/redis');

class CacheHelper {
    /**
     * Cache-aside: trả cache nếu có, không thì gọi resolver rồi lưu cache.
     * @param {string} key
     * @param {number} ttlSeconds
     * @param {Function} resolver - async () => data
     */
    static async remember(key, ttlSeconds, resolver) {
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        const data = await resolver();
        if (data !== undefined && data !== null) {
            await redis.setex(key, ttlSeconds, JSON.stringify(data));
        }
        return data;
    }

    /**
     * Lấy dữ liệu qua cache, fallback sang Sequelize model.findAll.
     */
    static async getCachedData(key, model, query = {}, ttl = 3600, attributes = null) {
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
            const data = await model.findAll({
                ...query,
                attributes: attributes || undefined,
                raw: true,
            });
            if (data && data.length > 0) {
                await redis.setex(key, ttl, JSON.stringify(data));
            }
            return data;
        } catch (error) {
            console.error(`Error with cache for key: ${key}`, error.message);
            throw error;
        }
    }

    static async clearCache(key) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Error clearing cache for key: ${key}`, error.message);
            throw error;
        }
    }
}

module.exports = CacheHelper;
