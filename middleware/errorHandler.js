// middleware/errorHandler.js
import config from '../config/index.js';

// Custom error class with status code
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log the error
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Set default values
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  
  // Customize response based on environment
  const isDevelopment = config.server.environment === 'development';
  
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(isDevelopment && { stack: err.stack }),
      ...(err.details && { details: err.details })
    }
  });
};

// Not found middleware
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Async handler to avoid try/catch blocks in route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};