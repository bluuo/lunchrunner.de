import helmet from "helmet";

export function createHelmetMiddleware({ allowedOrigin }) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", allowedOrigin, allowedOrigin.replace(/^http/, "ws")],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
