import helmet from "helmet";

export function erzeugeHelmetMiddleware({ erlaubteOrigin }) {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", erlaubteOrigin, erlaubteOrigin.replace(/^http/, "ws")],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}
