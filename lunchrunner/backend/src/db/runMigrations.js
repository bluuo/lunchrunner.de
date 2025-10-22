import fs from "fs";
import path from "path";
import knexModule from "knex";
import { fileURLToPath } from "url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDirectory = path.join(__dirname, "migrations");

const knex = knexModule({
  client: "pg",
  connection: config.databaseUrl,
});

async function runMigrations() {
  const files = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDirectory, file);
    const sql = fs.readFileSync(filePath, "utf8");
    await knex.raw(sql);
  }
}

runMigrations()
  .then(() => {
    console.log("Migrations executed successfully");
  })
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
