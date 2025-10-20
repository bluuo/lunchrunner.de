import { validiereOptionenAuswahl } from "./optionenValidierung.js";

export function berechneBestellung({ produkte, positionen, waehrungCode }) {
  let gesamtPreis = 0;
  const positionenMitSnapshot = [];
  for (const position of positionen) {
    const produkt = produkte.find((eintrag) => eintrag.id === position.produktId);
    if (!produkt) {
      const fehler = new Error("Produkt nicht gefunden");
      fehler.status = 404;
      throw fehler;
    }
    validiereOptionenAuswahl(produkt.optionenDefinition, position.ausgewaehlteOptionen || {});
    const optionenPreis = berechneOptionenPreis(produkt, position.ausgewaehlteOptionen || {});
    const basisPreis = Number(produkt.produktPreisBrutto);
    const menge = Number(position.menge ?? 1);
    const positionsPreis = (basisPreis + optionenPreis) * menge;
    gesamtPreis += positionsPreis;
    positionenMitSnapshot.push({
      produktId: produkt.id,
      produktNameSnapshot: produkt.produktName,
      produktBasisPreisSnapshot: basisPreis,
      waehrungCode: produkt.waehrungCode,
      menge,
      ausgewaehlteOptionen: position.ausgewaehlteOptionen || {},
      optionenPreisGesamtSnapshot: Number(optionenPreis.toFixed(2)),
      positionsPreisBruttoSnapshot: Number(positionsPreis.toFixed(2)),
    });
  }
  return {
    positionen: positionenMitSnapshot,
    gesamtPreisBrutto: Number(gesamtPreis.toFixed(2)),
    waehrungCode,
  };
}

function berechneOptionenPreis(produkt, ausgewaehlteOptionen) {
  let summe = 0;
  for (const gruppe of produkt.optionenDefinition.gruppen ?? []) {
    const auswahl = ausgewaehlteOptionen?.[gruppe.id];
    if (!auswahl) {
      continue;
    }
    if (gruppe.typ === "single") {
      const option = gruppe.werte.find((wert) => wert.label === auswahl);
      if (option) {
        summe += Number(option.preisDelta);
      }
    } else if (gruppe.typ === "multi") {
      for (const eintrag of auswahl) {
        const option = gruppe.werte.find((wert) => wert.label === eintrag);
        if (option) {
          summe += Number(option.preisDelta);
        }
      }
    }
  }
  return summe;
}
