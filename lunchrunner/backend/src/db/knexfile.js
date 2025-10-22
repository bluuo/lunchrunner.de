import { config } from "../../config.js";

export default {
  client: "pg",
  connection: config.databaseUrl,
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: new URL("./migrations", import.meta.url).pathname,
  },
};
