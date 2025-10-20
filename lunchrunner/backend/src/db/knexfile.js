import { konfiguration } from "../../config.js";

export default {
  client: "pg",
  connection: konfiguration.datenbankUrl,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: new URL("./migrations", import.meta.url).pathname,
  },
};
