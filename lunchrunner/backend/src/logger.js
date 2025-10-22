import winston from "winston";

const { combine, timestamp, printf } = winston.format;

const humanReadableFormat = printf(({ level, message, timestamp: time, ...rest }) => {
  const details = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${time} [${level}] ${message}${details}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(timestamp(), humanReadableFormat),
  transports: [new winston.transports.Console()],
});

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      durationMs: duration,
    });
  });
  next();
}
