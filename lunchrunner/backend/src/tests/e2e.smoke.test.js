import express from "express";
import { randomUUID } from "node:crypto";
import bodyParser from "body-parser";
import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import { produkteRouter } from "../routes/produkte.js";
import { adminRouter } from "../routes/admin.js";
import { bestellungenRouter } from "../routes/bestellungen.js";

class InMemoryProduktRepository {
  constructor() {
    this.produkte = [];
  }

  async findeAlleAktiven() {
    return this.produkte.filter((produkt) => produkt.produktAktiv !== false);
  }

  async findeAlle() {
    return [...this.produkte];
  }

  async speichereProdukt(produkt) {
    if (produkt.id) {
      const index = this.produkte.findIndex((eintrag) => eintrag.id === produkt.id);
      if (index !== -1) {
        this.produkte[index] = { ...this.produkte[index], ...produkt };
        return this.produkte[index];
      }
    }
    const neuesProdukt = {
      id: produkt.id || randomUUID(),
      produktName: produkt.produktName,
      produktBeschreibung: produkt.produktBeschreibung ?? null,
      produktPreisBrutto: produkt.produktPreisBrutto,
      waehrungCode: produkt.waehrungCode ?? "EUR",
      produktKategorie: produkt.produktKategorie ?? null,
      produktAktiv: produkt.produktAktiv ?? true,
      optionenDefinition: produkt.optionenDefinition,
      erstelltAm: new Date().toISOString(),
      aktualisiertAm: new Date().toISOString(),
    };
    this.produkte.push(neuesProdukt);
    return neuesProdukt;
  }

  async findeNachId(id) {
    return this.produkte.find((produkt) => produkt.id === id) ?? null;
  }

  async loescheProdukt(id) {
    this.produkte = this.produkte.filter((produkt) => produkt.id !== id);
  }
}

class InMemoryBestellungRepository {
  constructor() {
    this.bestellungen = [];
  }

  async findeAlle() {
    return [...this.bestellungen];
  }

  async speichereBestellung(bestellung) {
    if (bestellung.id) {
      const index = this.bestellungen.findIndex((eintrag) => eintrag.id === bestellung.id);
      if (index !== -1) {
        this.bestellungen[index] = { ...this.bestellungen[index], ...bestellung };
        return this.bestellungen[index];
      }
    }
    const neueBestellung = {
      id: bestellung.id || randomUUID(),
      ...bestellung,
    };
    this.bestellungen.push(neueBestellung);
    return neueBestellung;
  }

  async findeNachId(id) {
    return this.bestellungen.find((bestellung) => bestellung.id === id) ?? null;
  }

  async loesche(id) {
    this.bestellungen = this.bestellungen.filter((bestellung) => bestellung.id !== id);
  }
}

describe("E2E Smoke", () => {
  let app;
  let produktRepository;
  let bestellungRepository;
  const konfiguration = { adminToken: "test-token" };

  beforeEach(() => {
    produktRepository = new InMemoryProduktRepository();
    bestellungRepository = new InMemoryBestellungRepository();
    app = express();
    app.use(bodyParser.json());
    app.use("/api/produkte", produkteRouter({ produktRepository }));
    app.use("/api/admin", adminRouter({ produktRepository, konfiguration }));
    app.use("/api/bestellungen", bestellungenRouter({ produktRepository, bestellungRepository }));
  });

  it("legt Produkt und Bestellung an und berechnet Preise", async () => {
    const produktAntwort = await request(app)
      .post("/api/admin/produkte")
      .set("x-admin-token", "test-token")
      .send({
        produktName: "Testgericht",
        produktBeschreibung: "Lecker",
        produktPreisBrutto: 4,
        produktKategorie: "Test",
        produktAktiv: true,
        optionenDefinition: {
          gruppen: [
            {
              id: "extras",
              label: "Extras",
              typ: "multi",
              werte: [{ label: "Käse", preisDelta: 0.4 }],
            },
          ],
        },
      })
      .expect(201);

    const produktId = produktAntwort.body.id;

    const bestellungAntwort = await request(app)
      .post("/api/bestellungen")
      .set("x-geraete-id", "00000000-0000-0000-0000-000000000001")
      .send({
        nutzerName: "Max",
        positionen: [
          {
            produktId,
            menge: 2,
            ausgewaehlteOptionen: {
              extras: ["Käse"],
            },
          },
        ],
      })
      .expect(201);

    expect(bestellungAntwort.body.gesamtPreisBrutto).toBeCloseTo(8.8, 2);

    const listeAntwort = await request(app).get("/api/bestellungen").expect(200);
    expect(listeAntwort.body).toHaveLength(1);
    expect(listeAntwort.body[0].positionen[0].positionsPreisBruttoSnapshot).toBeCloseTo(8.8, 2);
  });
});
