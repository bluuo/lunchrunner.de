import { Router } from "express";
import { z } from "zod";
import { schreibRateLimit } from "../sicherheit/rateLimit.js";
import { pruefeGeraeteId } from "../middleware/geraeteOwnership.js";
import { berechneBestellung } from "../services/preisBerechnung.js";

const positionSchema = z.object({
  produktId: z.string().uuid(),
  menge: z.number().int().min(1),
  ausgewaehlteOptionen: z.record(z.any()).optional(),
});

const bestellungSchema = z.object({
  nutzerName: z.string().min(1),
  positionen: z.array(positionSchema).min(1),
});

export function bestellungenRouter({ produktRepository, bestellungRepository }) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      const bestellungen = await bestellungRepository.findeAlle();
      res.json(bestellungen);
    } catch (fehler) {
      next(fehler);
    }
  });

  router.post("/", pruefeGeraeteId, schreibRateLimit, async (req, res, next) => {
    try {
      const payload = bestellungSchema.parse(req.body);
      const produktIds = [...new Set(payload.positionen.map((pos) => pos.produktId))];
      const produkte = [];
      for (const produktId of produktIds) {
        const produkt = await produktRepository.findeNachId(produktId);
        if (!produkt || !produkt.produktAktiv) {
          const fehler = new Error("Produkt nicht verfügbar");
          fehler.status = 400;
          throw fehler;
        }
        produkte.push(produkt);
      }
      const berechnet = berechneBestellung({
        produkte,
        positionen: payload.positionen,
        waehrungCode: produkte[0]?.waehrungCode ?? "EUR",
      });
      const gespeicherteBestellung = await bestellungRepository.speichereBestellung({
        id: undefined,
        geraeteId: req.geraeteId,
        nutzerName: payload.nutzerName,
        positionen: berechnet.positionen,
        gesamtPreisBrutto: berechnet.gesamtPreisBrutto,
        waehrungCode: berechnet.waehrungCode,
      });
      res.status(201).json(gespeicherteBestellung);
    } catch (fehler) {
      next(fehler);
    }
  });

  router.put("/:id", pruefeGeraeteId, schreibRateLimit, async (req, res, next) => {
    try {
      const payload = bestellungSchema.parse(req.body);
      const existierend = await bestellungRepository.findeNachId(req.params.id);
      if (!existierend) {
        res.status(404).json({ nachricht: "Bestellung nicht gefunden" });
        return;
      }
      if (existierend.geraeteId !== req.geraeteId) {
        res.status(403).json({ nachricht: "Keine Berechtigung" });
        return;
      }
      const produktIds = [...new Set(payload.positionen.map((pos) => pos.produktId))];
      const produkte = [];
      for (const produktId of produktIds) {
        const produkt = await produktRepository.findeNachId(produktId);
        if (!produkt || !produkt.produktAktiv) {
          const fehler = new Error("Produkt nicht verfügbar");
          fehler.status = 400;
          throw fehler;
        }
        produkte.push(produkt);
      }
      const berechnet = berechneBestellung({
        produkte,
        positionen: payload.positionen,
        waehrungCode: produkte[0]?.waehrungCode ?? existierend.waehrungCode,
      });
      const aktualisiert = await bestellungRepository.speichereBestellung({
        id: existierend.id,
        geraeteId: existierend.geraeteId,
        nutzerName: payload.nutzerName,
        positionen: berechnet.positionen,
        gesamtPreisBrutto: berechnet.gesamtPreisBrutto,
        waehrungCode: berechnet.waehrungCode,
      });
      res.json(aktualisiert);
    } catch (fehler) {
      next(fehler);
    }
  });

  router.delete("/:id", pruefeGeraeteId, schreibRateLimit, async (req, res, next) => {
    try {
      const existierend = await bestellungRepository.findeNachId(req.params.id);
      if (!existierend) {
        res.status(404).json({ nachricht: "Bestellung nicht gefunden" });
        return;
      }
      if (existierend.geraeteId !== req.geraeteId) {
        res.status(403).json({ nachricht: "Keine Berechtigung" });
        return;
      }
      await bestellungRepository.loesche(req.params.id);
      res.status(204).send();
    } catch (fehler) {
      next(fehler);
    }
  });

  return router;
}
