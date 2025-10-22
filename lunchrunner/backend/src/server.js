import http from "http";
import express from "express";
import bodyParser from "body-parser";
import knexModule from "knex";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { logger, requestLogger } from "./logger.js";
import { createHelmetMiddleware } from "./security/helmet.js";
import { corsMiddleware } from "./security/cors.js";
import { productsRouter } from "./routes/products.js";
import { healthRouter } from "./routes/health.js";
import { adminRouter } from "./routes/admin.js";
import { ordersRouter } from "./routes/orders.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createProductRepository } from "./db/queries/products.js";
import { createOrderRepository } from "./db/queries/orders.js";
import { initializeSocket } from "./socket/realtime.js";

const knex = knexModule({
  client: "pg",
  connection: config.databaseUrl,
});

const productRepository = createProductRepository(knex);
const orderRepository = createOrderRepository(knex);

const app = express();
const server = http.createServer(app);
const socketInterface = initializeSocket(server, {
  allowedOrigin: config.corsOrigin,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "..", "..", "frontend");

app.use(createHelmetMiddleware({ allowedOrigin: config.corsOrigin }));
app.use(corsMiddleware);
app.use(requestLogger);
app.use(bodyParser.json());
app.use(express.static(frontendPath));

app.use("/api/health", healthRouter());
app.use("/api/products", productsRouter({ productRepository }));
app.use("/api/orders", ordersRouter({ productRepository, orderRepository }));
app.use("/api/admin", adminRouter({ productRepository, config }));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendPath, "index.html"));
    return;
  }
  next();
});

app.use(errorHandler);

const port = config.port;
server.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});

async function sendUpdates() {
  const products = await productRepository.findAllActive();
  const orders = await orderRepository.findAll();
  socketInterface.emitProductsUpdated(products);
  socketInterface.emitOrdersUpdated(orders);
}

const originalSaveProduct = productRepository.saveProduct.bind(productRepository);
productRepository.saveProduct = async (...args) => {
  const result = await originalSaveProduct(...args);
  await sendUpdates();
  return result;
};

const originalDeleteProduct = productRepository.deleteProduct.bind(productRepository);
productRepository.deleteProduct = async (...args) => {
  await originalDeleteProduct(...args);
  await sendUpdates();
};

const originalSaveOrder = orderRepository.saveOrder.bind(orderRepository);
orderRepository.saveOrder = async (...args) => {
  const result = await originalSaveOrder(...args);
  await sendUpdates();
  return result;
};

const originalRemoveOrder = orderRepository.remove.bind(orderRepository);
orderRepository.remove = async (...args) => {
  await originalRemoveOrder(...args);
  await sendUpdates();
};

try {
  await sendUpdates();
} catch (error) {
  logger.warn("Initial realtime update failed", { message: error.message });
}

process.on("SIGINT", async () => {
  logger.info("Shutting down server (SIGINT)");
  await knex.destroy();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down server (SIGTERM)");
  await knex.destroy();
  process.exit(0);
});
