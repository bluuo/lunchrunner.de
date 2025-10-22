import express from "express";
import { randomUUID } from "node:crypto";
import bodyParser from "body-parser";
import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import { productsRouter } from "../routes/products.js";
import { adminRouter } from "../routes/admin.js";
import { ordersRouter } from "../routes/orders.js";

class InMemoryProductRepository {
  constructor() {
    this.products = [];
  }

  async findAllActive() {
    return this.products.filter((product) => product.productActive !== false);
  }

  async findAll() {
    return [...this.products];
  }

  async saveProduct(product) {
    if (product.id) {
      const index = this.products.findIndex((entry) => entry.id === product.id);
      if (index !== -1) {
        this.products[index] = { ...this.products[index], ...product };
        return this.products[index];
      }
    }
    const newProduct = {
      id: product.id || randomUUID(),
      productName: product.productName,
      productDescription: product.productDescription ?? null,
      productPriceGross: product.productPriceGross,
      currencyCode: product.currencyCode ?? "EUR",
      productCategory: product.productCategory ?? null,
      productActive: product.productActive ?? true,
      optionsDefinition: product.optionsDefinition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.push(newProduct);
    return newProduct;
  }

  async findById(id) {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async deleteProduct(id) {
    this.products = this.products.filter((product) => product.id !== id);
  }
}

class InMemoryOrderRepository {
  constructor() {
    this.orders = [];
  }

  async findAll() {
    return [...this.orders];
  }

  async saveOrder(order) {
    if (order.id) {
      const index = this.orders.findIndex((entry) => entry.id === order.id);
      if (index !== -1) {
        this.orders[index] = { ...this.orders[index], ...order };
        return this.orders[index];
      }
    }
    const newOrder = {
      id: order.id || randomUUID(),
      ...order,
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  async findById(id) {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async remove(id) {
    this.orders = this.orders.filter((order) => order.id !== id);
  }
}

describe("E2E Smoke", () => {
  let app;
  let productRepository;
  let orderRepository;
  const config = { adminToken: "test-token" };

  beforeEach(() => {
    productRepository = new InMemoryProductRepository();
    orderRepository = new InMemoryOrderRepository();
    app = express();
    app.use(bodyParser.json());
    app.use("/api/products", productsRouter({ productRepository }));
    app.use("/api/admin", adminRouter({ productRepository, config }));
    app.use("/api/orders", ordersRouter({ productRepository, orderRepository }));
  });

  it("creates a product and order and calculates prices", async () => {
    const productResponse = await request(app)
      .post("/api/admin/products")
      .set("x-admin-token", "test-token")
      .send({
        productName: "Test Dish",
        productDescription: "Tasty",
        productPriceGross: 4,
        productCategory: "Test",
        productActive: true,
        optionsDefinition: {
          groups: [
            {
              id: "extras",
              label: "Extras",
              type: "multi",
              values: [{ label: "Cheese", priceDelta: 0.4 }],
            },
          ],
        },
      })
      .expect(201);

    const productId = productResponse.body.id;

    const orderResponse = await request(app)
      .post("/api/orders")
      .set("x-device-id", "00000000-0000-0000-0000-000000000001")
      .send({
        customerName: "Max",
        items: [
          {
            productId,
            quantity: 2,
            selectedOptions: {
              extras: ["Cheese"],
            },
          },
        ],
      })
      .expect(201);

    expect(orderResponse.body.totalPriceGross).toBeCloseTo(8.8, 2);

    const listResponse = await request(app).get("/api/orders").expect(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].items[0].itemPriceGrossSnapshot).toBeCloseTo(8.8, 2);
  });
});
