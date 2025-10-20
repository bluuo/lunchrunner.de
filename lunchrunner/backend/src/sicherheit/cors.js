import cors from "cors";
import { konfiguration } from "../config.js";

function istErlaubterUrsprung(origin) {
  if (!origin) {
    return true;
  }
  try {
    const erlaubteDomain = new URL(konfiguration.corsOrigin).hostname;
    const anfragendeDomain = new URL(origin).hostname;
    return (
      anfragendeDomain === erlaubteDomain ||
      anfragendeDomain.endsWith(`.${erlaubteDomain}`)
    );
  } catch (fehler) {
    return false;
  }
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (istErlaubterUrsprung(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS-Anfrage nicht erlaubt"));
  },
  credentials: false,
});
