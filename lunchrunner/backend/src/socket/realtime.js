import { Server } from "socket.io";
import { logger } from "../logger.js";

export function initialisiereSocket(server, { erlaubteOrigin }) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: erlaubteOrigin,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.of("/realtime").on("connection", (socket) => {
    logger.info("Socket verbunden", { socketId: socket.id });
    socket.join("global");
    socket.on("disconnect", () => {
      logger.info("Socket getrennt", { socketId: socket.id });
    });
  });

  function sendeProdukteAktualisiert(daten) {
    io.of("/realtime").to("global").emit("produkteAktualisiert", daten);
  }

  function sendeBestellungenAktualisiert(daten) {
    io.of("/realtime").to("global").emit("bestellungenAktualisiert", daten);
  }

  return {
    sendeProdukteAktualisiert,
    sendeBestellungenAktualisiert,
  };
}
