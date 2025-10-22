import { Router } from "express";

export function productsRouter({ productRepository }) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const products = await productRepository.findAllActive();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
