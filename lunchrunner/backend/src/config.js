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
  clerkPublishableKey: readEnvironmentVariable("CLERK_PUBLISHABLE_KEY"),
  clerkSecretKey: readEnvironmentVariable("CLERK_SECRET_KEY"),
  clerkIssuerUrl: readEnvironmentVariable("CLERK_ISSUER_URL"),
  clerkJwtAudience: process.env.CLERK_JWT_AUDIENCE ?? null,
  clerkJwtTemplate: process.env.CLERK_JWT_TEMPLATE ?? null,
  clerkApiBaseUrl: readEnvironmentVariable("CLERK_API_BASE_URL", "https://api.clerk.com"),
  clerkAdminRole: readEnvironmentVariable("CLERK_ADMIN_ROLE", "admin"),
  clerkSignInUrl: process.env.CLERK_SIGN_IN_URL ?? null,
  clerkSignUpUrl: process.env.CLERK_SIGN_UP_URL ?? null,
});
