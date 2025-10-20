import { logger } from "../logger.js";

export function errorHandler(fehler, req, res, next) {
  logger.error("Fehler im Request", {
    nachricht: fehler.message,
    stack: fehler.stack,
  });
  if (res.headersSent) {
    return next(fehler);
  }
  const status = fehler.status || 500;
  res.status(status).json({
    nachricht: fehler.nachricht || fehler.message || "Interner Serverfehler",
  });
}
