// Redis-based request queue configuration
const Queue = require('bull');
const Redis = require('ioredis');

// Redis connection for queue
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3
});

// Chat processing queue
const chatQueue = new Queue('chat processing', {
  redis: {
    host: 'localhost',
    port: 6379
  }
});

// Queue configuration
chatQueue.process('chat-request', 5, async (job) => {
  const { message, userId, sessionId } = job.data;
  
  // Process chat request
  try {
    const response = await processChatMessage(message, userId);
    return { success: true, response };
  } catch (error) {
    throw new Error(`Chat processing failed: ${error.message}`);
  }
});

// Queue monitoring
chatQueue.on('completed', (job, result) => {
  console.log(`Chat job ${job.id} completed`);
});

chatQueue.on('failed', (job, err) => {
  console.log(`Chat job ${job.id} failed: ${err.message}`);
});

module.exports = { chatQueue };
