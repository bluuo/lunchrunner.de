import { Router } from "express";
import { z } from "zod";
import { writeRateLimit } from "../security/rateLimit.js";
import { validateOptionsDefinition } from "../services/optionsValidation.js";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  productName: z.string().min(1),
  productDescription: z.string().optional(),
  productPriceGross: z.number().min(0),
  productCategory: z.string().optional(),
  productActive: z.boolean().optional(),
  optionsDefinition: z.any(),
});

export function adminRouter({ productRepository, requireAdmin }) {
  const router = Router();

  if (typeof requireAdmin !== "function") {
    throw new Error("Admin router requires an authentication middleware");
  }

  router.use(requireAdmin);

  router.get("/products", async (req, res, next) => {
    try {
      const products = await productRepository.findAll();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  router.post("/products", writeRateLimit, async (req, res, next) => {
    try {
      const payload = productSchema.parse(req.body);
      const definition = validateOptionsDefinition(payload.optionsDefinition);
      const savedProduct = await productRepository.saveProduct({
        ...payload,
        optionsDefinition: definition,
        currencyCode: "EUR",
      });
      res.status(201).json(savedProduct);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/products/:id", writeRateLimit, async (req, res, next) => {
    try {
      await productRepository.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
