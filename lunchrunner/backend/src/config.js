import dotenv from "dotenv";

dotenv.config();

function readEnvironmentVariable(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Required environment variable is missing: ${name}`);
  }
  return value;
}

export const config = Object.freeze({
  environment: readEnvironmentVariable("NODE_ENV", "production"),
  port: Number(readEnvironmentVariable("PORT", "3000")),
  databaseUrl: readEnvironmentVariable("DATABASE_URL"),
  corsOrigin: readEnvironmentVariable("CORS_ORIGIN", "https://lunchrunner.de"),
  adminToken: readEnvironmentVariable("ADMIN_TOKEN"),
});
