import http from "http";
import express from "express";
import bodyParser from "body-parser";
import knexModule from "knex";
import path from "path";
import { fileURLToPath } from "url";
import { konfiguration } from "./config.js";
import { logger, loggeAnfrage } from "./logger.js";
import { erzeugeHelmetMiddleware } from "./sicherheit/helmet.js";
import { corsMiddleware } from "./sicherheit/cors.js";
import { produkteRouter } from "./routes/produkte.js";
import { gesundheitRouter } from "./routes/gesundheit.js";
import { adminRouter } from "./routes/admin.js";
import { bestellungenRouter } from "./routes/bestellungen.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { erzeugeProduktRepository } from "./db/queries/produkte.js";
import { erzeugeBestellungRepository } from "./db/queries/bestellungen.js";
import { initialisiereSocket } from "./socket/realtime.js";

const knex = knexModule({
  client: "pg",
  connection: konfiguration.datenbankUrl,
});

const produktRepository = erzeugeProduktRepository(knex);
const bestellungRepository = erzeugeBestellungRepository(knex);

const app = express();
const server = http.createServer(app);
const socketSchnittstelle = initialisiereSocket(server, {
  erlaubteOrigin: konfiguration.corsOrigin,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPfad = path.join(__dirname, "..", "..", "frontend");

app.use(erzeugeHelmetMiddleware({ erlaubteOrigin: konfiguration.corsOrigin }));
app.use(corsMiddleware);
app.use(loggeAnfrage);
app.use(bodyParser.json());
app.use(express.static(frontendPfad));

app.use("/api/gesundheit", gesundheitRouter());
app.use("/api/produkte", produkteRouter({ produktRepository }));
app.use(
  "/api/bestellungen",
  bestellungenRouter({ produktRepository, bestellungRepository })
);
app.use(
  "/api/admin",
  adminRouter({ produktRepository, konfiguration })
);

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendPfad, "index.html"));
    return;
  }
  next();
});

app.use(errorHandler);

const port = konfiguration.port;
server.listen(port, () => {
  logger.info(`Server läuft auf Port ${port}`);
});

async function sendeAktualisierungen() {
  const produkte = await produktRepository.findeAlleAktiven();
  const bestellungen = await bestellungRepository.findeAlle();
  socketSchnittstelle.sendeProdukteAktualisiert(produkte);
  socketSchnittstelle.sendeBestellungenAktualisiert(bestellungen);
}

const originalSpeichereProdukt = produktRepository.speichereProdukt.bind(produktRepository);
produktRepository.speichereProdukt = async (...args) => {
  const ergebnis = await originalSpeichereProdukt(...args);
  await sendeAktualisierungen();
  return ergebnis;
};

const originalLoescheProdukt = produktRepository.loescheProdukt.bind(produktRepository);
produktRepository.loescheProdukt = async (...args) => {
  await originalLoescheProdukt(...args);
  await sendeAktualisierungen();
};

const originalSpeichereBestellung = bestellungRepository.speichereBestellung.bind(bestellungRepository);
bestellungRepository.speichereBestellung = async (...args) => {
  const ergebnis = await originalSpeichereBestellung(...args);
  await sendeAktualisierungen();
  return ergebnis;
};

const originalLoescheBestellung = bestellungRepository.loesche.bind(bestellungRepository);
bestellungRepository.loesche = async (...args) => {
  await originalLoescheBestellung(...args);
  await sendeAktualisierungen();
};


try {
  await sendeAktualisierungen();
} catch (fehler) {
  logger.warn("Initiale Echtzeitaktualisierung fehlgeschlagen", { nachricht: fehler.message });
}
process.on("SIGINT", async () => {
  logger.info("Beende Server (SIGINT)");
  await knex.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Beende Server (SIGTERM)");
  await knex.destroy();
  process.exit(0);
});
