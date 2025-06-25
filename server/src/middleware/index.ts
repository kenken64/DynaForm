import { Request, Response, NextFunction } from 'express';

// Export auth middleware
export { verifyToken, requireRole, optionalAuth, AuthMiddleware } from './auth';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const allowCredentials = process.env.CORS_CREDENTIALS === 'true';
  
  // Handle multiple origins (comma-separated)
  if (corsOrigin !== '*') {
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
    const requestOrigin = req.headers.origin;
    
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    } else if (allowedOrigins.length === 1) {
      res.header('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (allowCredentials) {
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  console.error('Error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message
    });
    return;
  }
  
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
    return;
  }
  
  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}