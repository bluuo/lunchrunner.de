import { Router } from "express";
import { z } from "zod";
import { writeRateLimit } from "../security/rateLimit.js";
import { requireDeviceId } from "../middleware/deviceOwnership.js";
import { calculateOrder } from "../services/priceCalculation.js";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  selectedOptions: z.record(z.any()).optional(),
});

const orderSchema = z.object({
  customerName: z.string().min(1),
  items: z.array(itemSchema).min(1),
});

export function ordersRouter({ productRepository, orderRepository }) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const orders = await orderRepository.findAll();
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireDeviceId, writeRateLimit, async (req, res, next) => {
    try {
      const payload = orderSchema.parse(req.body);
      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = [];
      for (const productId of productIds) {
        const product = await productRepository.findById(productId);
        if (!product || !product.productActive) {
          const error = new Error("Product is not available");
          error.status = 400;
          throw error;
        }
        products.push(product);
      }
      const calculated = calculateOrder({
        products,
        items: payload.items,
        currencyCode: products[0]?.currencyCode ?? "EUR",
      });
      const savedOrder = await orderRepository.saveOrder({
        id: undefined,
        deviceId: req.deviceId,
        customerName: payload.customerName,
        items: calculated.items,
        totalPriceGross: calculated.totalPriceGross,
        currencyCode: calculated.currencyCode,
      });
      res.status(201).json(savedOrder);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireDeviceId, writeRateLimit, async (req, res, next) => {
    try {
      const payload = orderSchema.parse(req.body);
      const existing = await orderRepository.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (existing.deviceId !== req.deviceId) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }
      const productIds = [...new Set(payload.items.map((item) => item.productId))];
      const products = [];
      for (const productId of productIds) {
        const product = await productRepository.findById(productId);
        if (!product || !product.productActive) {
          const error = new Error("Product is not available");
          error.status = 400;
          throw error;
        }
        products.push(product);
      }
      const calculated = calculateOrder({
        products,
        items: payload.items,
        currencyCode: products[0]?.currencyCode ?? existing.currencyCode,
      });
      const updated = await orderRepository.saveOrder({
        id: existing.id,
        deviceId: existing.deviceId,
        customerName: payload.customerName,
        items: calculated.items,
        totalPriceGross: calculated.totalPriceGross,
        currencyCode: calculated.currencyCode,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", requireDeviceId, writeRateLimit, async (req, res, next) => {
    try {
      const existing = await orderRepository.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      if (existing.deviceId !== req.deviceId) {
        res.status(403).json({ message: "Not authorized" });
        return;
      }
      await orderRepository.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
