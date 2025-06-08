"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisCacheService = exports.RedisCacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const crypto_1 = __importDefault(require("crypto"));
const cachePerformanceMonitor_1 = require("../utils/cachePerformanceMonitor");
const perf_hooks_1 = require("perf_hooks");
class RedisCacheService {
    constructor() {
        this.OCR_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
        this.CACHE_KEY_PREFIX = 'ocr:form:';
        this.isConnected = false;
        this.redis = new ioredis_1.default({
            host: config_1.config.REDIS_HOST,
            port: config_1.config.REDIS_PORT,
            password: config_1.config.REDIS_PASSWORD,
            db: config_1.config.REDIS_DB,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            enableOfflineQueue: false,
        });
        // Handle Redis connection events
        this.redis.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Redis Cache Service connected');
        });
        this.redis.on('ready', () => {
            this.isConnected = true;
            console.log('🚀 Redis Cache Service ready');
        });
        this.redis.on('error', (error) => {
            this.isConnected = false;
            console.error('❌ Redis Cache Service error:', error);
        });
        this.redis.on('close', () => {
            this.isConnected = false;
            console.log('🔌 Redis Cache Service connection closed');
        });
        this.redis.on('reconnecting', () => {
            console.log('🔄 Redis Cache Service reconnecting...');
        });
    }
    /**
     * Check if Redis is connected and available
     */
    async ensureConnection() {
        try {
            // If not connected, attempt to connect
            if (!this.isConnected) {
                await this.redis.connect();
            }
            // Test the connection with a ping
            const result = await this.redis.ping();
            this.isConnected = result === 'PONG';
            return this.isConnected;
        }
        catch (error) {
            this.isConnected = false;
            console.warn('⚠️ Redis not available, continuing without cache:', error);
            return false;
        }
    }
    /**
     * Generate cache key from JSON fingerprint
     */
    generateCacheKey(jsonFingerprint) {
        return `${this.CACHE_KEY_PREFIX}${jsonFingerprint}`;
    }
    /**
     * Generate JSON fingerprint from image data and prompt
     */
    generateJsonFingerprint(imageBuffer, prompt) {
        const hash = crypto_1.default.createHash('sha256');
        hash.update(imageBuffer);
        hash.update(prompt);
        return hash.digest('hex');
    }
    /**
     * Get cached OCR result by JSON fingerprint
     */
    async getCachedOcrResult(jsonFingerprint) {
        const startTime = perf_hooks_1.performance.now();
        try {
            if (!(await this.ensureConnection())) {
                const duration = perf_hooks_1.performance.now() - startTime;
                cachePerformanceMonitor_1.cachePerformanceMonitor.recordCacheError(jsonFingerprint, 'Redis connection unavailable');
                return null;
            }
            const cacheKey = this.generateCacheKey(jsonFingerprint);
            const cached = await this.redis.get(cacheKey);
            if (!cached) {
                const duration = perf_hooks_1.performance.now() - startTime;
                cachePerformanceMonitor_1.cachePerformanceMonitor.recordCacheMiss(jsonFingerprint, duration);
                console.log(`🔍 Cache MISS for fingerprint: ${jsonFingerprint}`);
                return null;
            }
            const result = JSON.parse(cached);
            // Check if cache has expired
            const now = new Date();
            const expiresAt = new Date(result.expiresAt);
            if (now > expiresAt) {
                const duration = perf_hooks_1.performance.now() - startTime;
                console.log(`⏰ Cache EXPIRED for fingerprint: ${jsonFingerprint}`);
                await this.deleteCachedOcrResult(jsonFingerprint);
                cachePerformanceMonitor_1.cachePerformanceMonitor.recordCacheMiss(jsonFingerprint, duration);
                return null;
            }
            const duration = perf_hooks_1.performance.now() - startTime;
            cachePerformanceMonitor_1.cachePerformanceMonitor.recordCacheHit(jsonFingerprint, duration, {
                formTitle: result.formTitle,
                fieldsCount: result.fields.length
            });
            console.log(`✅ Cache HIT for fingerprint: ${jsonFingerprint}`);
            return result;
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            cachePerformanceMonitor_1.cachePerformanceMonitor.recordCacheError(jsonFingerprint, errorMessage);
            console.error('❌ Error getting cached OCR result:', error);
            return null;
        }
    }
    /**
     * Cache OCR result with JSON fingerprint as key
     */
    async cacheOcrResult(jsonFingerprint, formTitle, fields, originalJson) {
        try {
            if (!(await this.ensureConnection())) {
                console.warn('⚠️ Redis not available, skipping cache storage');
                return false;
            }
            const now = new Date();
            const expiresAt = new Date(now.getTime() + (this.OCR_CACHE_TTL * 1000));
            const cacheData = {
                formTitle,
                fields,
                originalJson,
                cachedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString()
            };
            const cacheKey = this.generateCacheKey(jsonFingerprint);
            await this.redis.setex(cacheKey, this.OCR_CACHE_TTL, JSON.stringify(cacheData));
            console.log(`💾 Cached OCR result for fingerprint: ${jsonFingerprint} (expires: ${expiresAt.toISOString()})`);
            return true;
        }
        catch (error) {
            console.error('❌ Error caching OCR result:', error);
            return false;
        }
    }
    /**
     * Delete cached OCR result
     */
    async deleteCachedOcrResult(jsonFingerprint) {
        try {
            const cacheKey = this.generateCacheKey(jsonFingerprint);
            const result = await this.redis.del(cacheKey);
            if (result > 0) {
                console.log(`🗑️ Deleted cached OCR result for fingerprint: ${jsonFingerprint}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('❌ Error deleting cached OCR result:', error);
            return false;
        }
    }
    /**
     * Get cache statistics
     */
    async getCacheStats() {
        try {
            const totalKeys = await this.redis.dbsize();
            const ocrKeys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}*`);
            // Get memory usage using INFO command
            const memoryInfo = await this.redis.info('memory');
            const memoryMatch = memoryInfo.match(/used_memory:(\d+)/);
            const memoryBytes = memoryMatch ? parseInt(memoryMatch[1]) : 0;
            return {
                totalKeys,
                ocrCacheKeys: ocrKeys.length,
                memoryUsage: `${Math.round(memoryBytes / 1024 / 1024 * 100) / 100} MB`
            };
        }
        catch (error) {
            console.error('❌ Error getting cache stats:', error);
            return {
                totalKeys: 0,
                ocrCacheKeys: 0,
                memoryUsage: 'Unknown'
            };
        }
    }
    /**
     * Clear all OCR cache entries
     */
    async clearOcrCache() {
        try {
            const keys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}*`);
            if (keys.length === 0) {
                return 0;
            }
            const result = await this.redis.del(...keys);
            console.log(`🧹 Cleared ${result} OCR cache entries`);
            return result;
        }
        catch (error) {
            console.error('❌ Error clearing OCR cache:', error);
            return 0;
        }
    }
    /**
     * Check Redis connection health
     */
    async healthCheck() {
        return await this.ensureConnection();
    }
    /**
     * Close Redis connection
     */
    async disconnect() {
        try {
            await this.redis.quit();
            console.log('👋 Redis Cache Service disconnected');
        }
        catch (error) {
            console.error('❌ Error disconnecting Redis Cache Service:', error);
        }
    }
}
exports.RedisCacheService = RedisCacheService;
// Export singleton instance
exports.redisCacheService = new RedisCacheService();
//# sourceMappingURL=redisCacheService.js.map