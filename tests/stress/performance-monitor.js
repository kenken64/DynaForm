// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    // Log to file or monitoring service
    console.log('PERF:', JSON.stringify(logData));
    
    // Alert on slow requests
    if (duration > 30000) { // 30 seconds
      console.warn('SLOW_REQUEST:', logData);
    }
  });
  
  next();
};

module.exports = { performanceMonitor };
