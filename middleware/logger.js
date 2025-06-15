// middleware/logger.js
import config from '../config/index.js';

/**
 * Get the client IP address from the request
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress || 
         'unknown';
}

/**
 * Formats the log message with timestamp, method, URL, status, and response time
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} responseTime - Response time in milliseconds
 * @returns {string} - Formatted log message
 */
function formatLogMessage(req, res, responseTime) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  return `[${timestamp}] ${method} ${url} ${status} ${responseTime}ms - ${ip} - ${userAgent}`;
}

/**
 * Logger middleware for Express
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const requestLogger = (req, res, next) => {
  // Skip logging for health check endpoints in production
  if (config.server.environment === 'production' && req.path === '/health') {
    return next();
  }

  // Record start time
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request received`);
  
  // Store the original end method
  const originalEnd = res.end;
  
  // Override the end method
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Call the original end method
    originalEnd.call(this, chunk, encoding);
    
    // Log response details
    const logMessage = formatLogMessage(req, res, responseTime);
    console.log(logMessage);
  };
  
  next();
};

/**
 * Error logger middleware
 * @param {object} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const errorLogger = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = getClientIp(req);
  
  console.error(`[${timestamp}] ERROR: ${method} ${url} - ${err.stack} - Client: ${ip}`);
  
  next(err);
};