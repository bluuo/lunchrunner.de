import { Router } from "express";

export function gesundheitRouter() {
  const router = Router();
  router.get("/", (req, res) => {
    res.json({ status: "ok" });
  });
  return router;
}
