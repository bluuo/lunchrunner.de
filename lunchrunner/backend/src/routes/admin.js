import { Router } from "express";
import { z } from "zod";
import { pruefeAdminToken } from "../middleware/geraeteOwnership.js";
import { schreibRateLimit } from "../sicherheit/rateLimit.js";
import { validiereOptionenDefinition } from "../services/optionenValidierung.js";

const produktSchema = z.object({
  id: z.string().uuid().optional(),
  produktName: z.string().min(1),
  produktBeschreibung: z.string().optional(),
  produktPreisBrutto: z.number().min(0),
  produktKategorie: z.string().optional(),
  produktAktiv: z.boolean().optional(),
  optionenDefinition: z.any(),
});

export function adminRouter({ produktRepository, konfiguration }) {
  const router = Router();

  router.use(pruefeAdminToken(konfiguration));

  router.get("/produkte", async (req, res, next) => {
    try {
      const produkte = await produktRepository.findeAlle();
      res.json(produkte);
    } catch (fehler) {
      next(fehler);
    }
  });

  router.post("/produkte", schreibRateLimit, async (req, res, next) => {
    try {
      const payload = produktSchema.parse(req.body);
      const definition = validiereOptionenDefinition(payload.optionenDefinition);
      const gespeichertesProdukt = await produktRepository.speichereProdukt({
        ...payload,
        optionenDefinition: definition,
        waehrungCode: "EUR",
      });
      res.status(201).json(gespeichertesProdukt);
    } catch (fehler) {
      next(fehler);
    }
  });

  router.delete("/produkte/:id", schreibRateLimit, async (req, res, next) => {
    try {
      await produktRepository.loescheProdukt(req.params.id);
      res.status(204).send();
    } catch (fehler) {
      next(fehler);
    }
  });

  return router;
}
