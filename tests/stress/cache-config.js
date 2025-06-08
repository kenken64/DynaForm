// Redis-based caching for chat responses
const Redis = require('ioredis');

const cache = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3
});

// Cache configuration
const CACHE_TTL = 3600; // 1 hour

// Generate cache key based on message content
function generateCacheKey(message) {
  const crypto = require('crypto');
  return 'chat:' + crypto.createHash('md5').update(message.toLowerCase().trim()).digest('hex');
}

// Get cached response
async function getCachedResponse(message) {
  try {
    const key = generateCacheKey(message);
    const cached = await cache.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

// Cache response
async function cacheResponse(message, response) {
  try {
    const key = generateCacheKey(message);
    await cache.setex(key, CACHE_TTL, JSON.stringify(response));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

module.exports = { getCachedResponse, cacheResponse };
