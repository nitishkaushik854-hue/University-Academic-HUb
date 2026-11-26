/**
 * Structured JSON Error Handler Middleware
 * Standardizes 400, 404, 500 responses across all /api routes
 */
function errorHandler(err, req, res, next) {
  // If response already committed, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || (statusCode === 500 ? "Internal Server Error" : "Bad Request");

  const response = {
    success: false,
    error: {
      code: statusCode,
      message: message
    }
  };

  if (err.details && Array.isArray(err.details)) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Handler for undefined API routes
 */
function notFoundHandler(req, res, next) {
  const err = new Error(`Resource '${req.originalUrl}' not found.`);
  err.status = 404;
  next(err);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
