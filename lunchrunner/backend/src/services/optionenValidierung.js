import { z } from "zod";

const optionenSchema = z.object({
  gruppen: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        typ: z.enum(["single", "multi"]),
        werte: z.array(
          z.object({
            label: z.string().min(1),
            preisDelta: z.number().min(0),
          })
        ),
      })
    )
    .min(0),
});

export function validiereOptionenDefinition(definition) {
  return optionenSchema.parse(definition);
}

export function validiereOptionenAuswahl(definition, auswahl) {
  const gepruefteDefinition = validiereOptionenDefinition(definition);
  const fehler = [];
  for (const gruppe of gepruefteDefinition.gruppen) {
    const auswahlWert = auswahl?.[gruppe.id];
    if (gruppe.typ === "single") {
      if (auswahlWert === undefined || auswahlWert === null || auswahlWert === "") {
        continue;
      }
      const gefunden = gruppe.werte.find((wert) => wert.label === auswahlWert);
      if (!gefunden) {
        fehler.push(`Ungültige Auswahl für ${gruppe.label}`);
      }
    } else if (gruppe.typ === "multi") {
      if (auswahlWert === undefined) {
        continue;
      }
      if (!Array.isArray(auswahlWert)) {
        fehler.push(`Mehrfachauswahl erwartet für ${gruppe.label}`);
        continue;
      }
      for (const einzelwert of auswahlWert) {
        const gefunden = gruppe.werte.find((wert) => wert.label === einzelwert);
        if (!gefunden) {
          fehler.push(`Ungültige Option ${einzelwert} in ${gruppe.label}`);
        }
      }
    }
  }
  if (fehler.length > 0) {
    const fehlerObjekt = new Error("Optionen ungültig");
    fehlerObjekt.status = 400;
    fehlerObjekt.nachricht = fehler.join(", ");
    throw fehlerObjekt;
  }
}
