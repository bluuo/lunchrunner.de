import winston from "winston";

const { combine, timestamp, printf } = winston.format;

const menschlichesFormat = printf(({ level, message, timestamp: zeitstempel, ...rest }) => {
  const details = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${zeitstempel} [${level}] ${message}${details}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(timestamp(), menschlichesFormat),
  transports: [new winston.transports.Console()],
});

export function loggeAnfrage(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const dauer = Date.now() - start;
    logger.info("HTTP-Anfrage", {
      methode: req.method,
      pfad: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      dauerMs: dauer,
    });
  });
  next();
}
