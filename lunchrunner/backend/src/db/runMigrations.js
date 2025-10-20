import fs from "fs";
import path from "path";
import knexModule from "knex";
import { fileURLToPath } from "url";
import { konfiguration } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsVerzeichnis = path.join(__dirname, "migrations");

const knex = knexModule({
  client: "pg",
  connection: konfiguration.datenbankUrl,
});

async function fuehreMigrationenAus() {
  const dateien = fs
    .readdirSync(migrationsVerzeichnis)
    .filter((datei) => datei.endsWith(".sql"))
    .sort();

  for (const datei of dateien) {
    const dateiPfad = path.join(migrationsVerzeichnis, datei);
    const sql = fs.readFileSync(dateiPfad, "utf8");
    await knex.raw(sql);
  }
}

fuehreMigrationenAus()
  .then(() => {
    console.log("Migrationen erfolgreich ausgeführt");
  })
  .catch((fehler) => {
    console.error("Migration fehlgeschlagen", fehler);
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
