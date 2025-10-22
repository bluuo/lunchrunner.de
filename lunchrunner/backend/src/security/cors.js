import cors from "cors";
import { config } from "../config.js";

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }
  try {
    const allowedDomain = new URL(config.corsOrigin).hostname;
    const requestingDomain = new URL(origin).hostname;
    return (
      requestingDomain === allowedDomain ||
      requestingDomain.endsWith(`.${allowedDomain}`)
    );
  } catch (error) {
    return false;
  }
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS request not allowed"));
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-device-id"],
  optionsSuccessStatus: 204,
});
