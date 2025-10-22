import { logger } from "../logger.js";

export function errorHandler(error, req, res, next) {
  logger.error("Request error", {
    message: error.message,
    stack: error.stack,
  });
  if (res.headersSent) {
    return next(error);
  }
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "Internal server error",
  });
}
