import { Router } from "express";

export function produkteRouter({ produktRepository }) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const produkte = await produktRepository.findeAlleAktiven();
      res.json(produkte);
    } catch (fehler) {
      next(fehler);
    }
  });

  return router;
}
