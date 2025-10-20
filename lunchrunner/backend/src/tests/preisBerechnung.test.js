import { describe, expect, it } from "vitest";
import { berechneBestellung } from "../services/preisBerechnung.js";

const produkt = {
  id: "11111111-1111-1111-1111-111111111111",
  produktName: "Testprodukt",
  produktPreisBrutto: 5,
  waehrungCode: "EUR",
  optionenDefinition: {
    gruppen: [
      {
        id: "sauce",
        label: "Sauce",
        typ: "single",
        werte: [
          { label: "Ketchup", preisDelta: 0 },
          { label: "BBQ", preisDelta: 0.2 },
        ],
      },
      {
        id: "extras",
        label: "Extras",
        typ: "multi",
        werte: [
          { label: "Käse", preisDelta: 0.4 },
          { label: "Zwiebeln", preisDelta: 0.1 },
        ],
      },
    ],
  },
};

describe("berechneBestellung", () => {
  it("berechnet Positions- und Gesamtpreise korrekt", () => {
    const ergebnis = berechneBestellung({
      produkte: [produkt],
      positionen: [
        {
          produktId: produkt.id,
          menge: 2,
          ausgewaehlteOptionen: {
            sauce: "BBQ",
            extras: ["Käse", "Zwiebeln"],
          },
        },
      ],
      waehrungCode: "EUR",
    });
    expect(ergebnis.gesamtPreisBrutto).toBeCloseTo(11.4, 2);
    expect(ergebnis.positionen[0].optionenPreisGesamtSnapshot).toBeCloseTo(0.7, 2);
    expect(ergebnis.positionen[0].positionsPreisBruttoSnapshot).toBeCloseTo(11.4, 2);
  });
});
