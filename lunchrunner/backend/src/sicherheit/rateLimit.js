import rateLimit from "express-rate-limit";

export const schreibRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    nachricht: "Zu viele Anfragen. Bitte später erneut versuchen.",
  },
});
