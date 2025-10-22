import { Server } from "socket.io";
import { logger } from "../logger.js";

export function initializeSocket(server, { allowedOrigin }) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.of("/realtime").on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });
    socket.join("global");
    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id });
    });
  });

  function emitProductsUpdated(data) {
    io.of("/realtime").to("global").emit("productsUpdated", data);
  }

  function emitOrdersUpdated(data) {
    io.of("/realtime").to("global").emit("ordersUpdated", data);
  }

  return {
    emitProductsUpdated,
    emitOrdersUpdated,
  };
}
