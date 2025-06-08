"use strict";
/**
 * Cache Performance Monitor Utility
 * Tracks cache hit/miss rates, performance metrics, and provides insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePerformanceMonitor = void 0;
class CachePerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.globalMetrics = {
            totalHits: 0,
            totalMisses: 0,
            totalErrors: 0,
            totalHitTime: 0,
            totalMissTime: 0,
        };
    }
    /**
     * Record a cache hit event
     */
    recordCacheHit(fingerprint, duration, data) {
        const entry = this.getOrCreateEntry(fingerprint);
        entry.hits++;
        entry.hitTimes.push(duration);
        entry.lastAccessed = new Date();
        this.globalMetrics.totalHits++;
        this.globalMetrics.totalHitTime += duration;
        console.log(`📊 Cache HIT recorded: ${fingerprint} (${duration.toFixed(2)}ms)`);
    }
    /**
     * Record a cache miss event
     */
    recordCacheMiss(fingerprint, duration) {
        const entry = this.getOrCreateEntry(fingerprint);
        entry.misses++;
        entry.missTimes.push(duration);
        entry.lastAccessed = new Date();
        this.globalMetrics.totalMisses++;
        this.globalMetrics.totalMissTime += duration;
        console.log(`📊 Cache MISS recorded: ${fingerprint} (${duration.toFixed(2)}ms)`);
    }
    /**
     * Record a cache error event
     */
    recordCacheError(fingerprint, errorMessage) {
        const entry = this.getOrCreateEntry(fingerprint);
        entry.errors++;
        entry.lastAccessed = new Date();
        this.globalMetrics.totalErrors++;
        console.log(`📊 Cache ERROR recorded: ${fingerprint} - ${errorMessage}`);
    }
    /**
     * Get metrics for a specific fingerprint
     */
    getMetrics(fingerprint) {
        const entry = this.metrics.get(fingerprint);
        if (!entry)
            return null;
        const totalRequests = entry.hits + entry.misses + entry.errors;
        const averageHitTime = entry.hitTimes.length > 0
            ? entry.hitTimes.reduce((a, b) => a + b, 0) / entry.hitTimes.length
            : 0;
        const averageMissTime = entry.missTimes.length > 0
            ? entry.missTimes.reduce((a, b) => a + b, 0) / entry.missTimes.length
            : 0;
        const hitRate = totalRequests > 0 ? (entry.hits / totalRequests) * 100 : 0;
        return {
            hits: entry.hits,
            misses: entry.misses,
            errors: entry.errors,
            totalRequests,
            averageHitTime,
            averageMissTime,
            hitRate,
        };
    }
    /**
     * Get global cache metrics
     */
    getGlobalMetrics() {
        const totalRequests = this.globalMetrics.totalHits + this.globalMetrics.totalMisses + this.globalMetrics.totalErrors;
        const averageHitTime = this.globalMetrics.totalHits > 0
            ? this.globalMetrics.totalHitTime / this.globalMetrics.totalHits
            : 0;
        const averageMissTime = this.globalMetrics.totalMisses > 0
            ? this.globalMetrics.totalMissTime / this.globalMetrics.totalMisses
            : 0;
        const hitRate = totalRequests > 0
            ? (this.globalMetrics.totalHits / totalRequests) * 100
            : 0;
        return {
            hits: this.globalMetrics.totalHits,
            misses: this.globalMetrics.totalMisses,
            errors: this.globalMetrics.totalErrors,
            totalRequests,
            averageHitTime,
            averageMissTime,
            hitRate,
        };
    }
    /**
     * Get top performing cache entries
     */
    getTopPerformers(limit = 10) {
        const results = [];
        for (const [fingerprint] of this.metrics) {
            const metrics = this.getMetrics(fingerprint);
            if (metrics) {
                results.push({ fingerprint, metrics });
            }
        }
        // Sort by hit rate, then by total requests
        return results
            .sort((a, b) => {
            if (a.metrics.hitRate !== b.metrics.hitRate) {
                return b.metrics.hitRate - a.metrics.hitRate;
            }
            return b.metrics.totalRequests - a.metrics.totalRequests;
        })
            .slice(0, limit);
    }
    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        this.globalMetrics = {
            totalHits: 0,
            totalMisses: 0,
            totalErrors: 0,
            totalHitTime: 0,
            totalMissTime: 0,
        };
        console.log('📊 Cache performance metrics reset');
    }
    /**
     * Cleanup old entries (older than specified days)
     */
    cleanup(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        let removedCount = 0;
        for (const [fingerprint, entry] of this.metrics) {
            if (entry.lastAccessed < cutoffDate) {
                this.metrics.delete(fingerprint);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            console.log(`📊 Cleaned up ${removedCount} old cache performance entries`);
        }
        return removedCount;
    }
    getOrCreateEntry(fingerprint) {
        if (!this.metrics.has(fingerprint)) {
            this.metrics.set(fingerprint, {
                hits: 0,
                misses: 0,
                errors: 0,
                hitTimes: [],
                missTimes: [],
                lastAccessed: new Date(),
            });
        }
        return this.metrics.get(fingerprint);
    }
}
// Export singleton instance
exports.cachePerformanceMonitor = new CachePerformanceMonitor();
//# sourceMappingURL=cachePerformanceMonitor.js.map