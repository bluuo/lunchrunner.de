import dotenv from "dotenv";

dotenv.config();

function leseUmgebungsvariable(name, standardwert) {
  const wert = process.env[name];
  if (wert === undefined || wert === "") {
    if (standardwert !== undefined) {
      return standardwert;
    }
    throw new Error(`Erforderliche Umgebungsvariable fehlt: ${name}`);
  }
  return wert;
}

export const konfiguration = Object.freeze({
  umgebung: leseUmgebungsvariable("NODE_ENV", "production"),
  port: Number(leseUmgebungsvariable("PORT", "3000")),
  datenbankUrl: leseUmgebungsvariable("DATABASE_URL"),
  corsOrigin: leseUmgebungsvariable("CORS_ORIGIN", "https://lunchrunner.de"),
  adminToken: leseUmgebungsvariable("ADMIN_TOKEN"),
});
