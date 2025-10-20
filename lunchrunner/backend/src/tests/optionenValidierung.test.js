import { describe, expect, it } from "vitest";
import { validiereOptionenAuswahl, validiereOptionenDefinition } from "../services/optionenValidierung.js";

const definition = {
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
};

describe("Optionenvalidierung", () => {
  it("akzeptiert gültige Definition", () => {
    expect(() => validiereOptionenDefinition(definition)).not.toThrow();
  });

  it("wirft Fehler bei ungültiger Auswahl", () => {
    expect(() =>
      validiereOptionenAuswahl(definition, {
        sauce: "Mayo",
      })
    ).toThrow();
  });

  it("akzeptiert gültige Auswahl", () => {
    expect(() =>
      validiereOptionenAuswahl(definition, {
        sauce: "BBQ",
        extras: ["Käse"],
      })
    ).not.toThrow();
  });
});
