import { v4 as generiereUuid } from 'uuid';
const tabellenName = "bestellungen";

function jsonbArrayLiteral(knex, positionen) {
  const placeholders = positionen.map(() => "?").join(",");
  const werte = positionen.map((position) => JSON.stringify(position));
  return knex.raw(`ARRAY[${placeholders}]::jsonb[]`, werte);
}

function parsePositionen(datensatz) {
  if (datensatz.positionen_json) {
    return datensatz.positionen_json;
  }
  const wert = datensatz.positionen;
  if (!wert) {
    return [];
  }
  if (typeof wert === "string") {
    try {
      return JSON.parse(wert);
    } catch (fehler) {
      return [];
    }
  }
  if (Array.isArray(wert)) {
    return wert.map((eintrag) => {
      if (typeof eintrag === "string") {
        try {
          return JSON.parse(eintrag);
        } catch (fehler) {
          return eintrag;
        }
      }
      return eintrag;
    });
  }
  return [];
}

export function mappeBestellungDatensatz(datensatz) {
  if (!datensatz) {
    return null;
  }
  return {
    id: datensatz.id,
    geraeteId: datensatz.geraete_id,
    nutzerName: datensatz.nutzer_name,
    positionen: parsePositionen(datensatz),
    gesamtPreisBrutto: Number(datensatz.gesamt_preis_brutto),
    waehrungCode: datensatz.waehrung_code,
    erstelltAm: datensatz.erstellt_am,
    aktualisiertAm: datensatz.aktualisiert_am,
  };
}

export function erzeugeBestellungRepository(knex) {
  async function findeAlle() {
    const datensaetze = await knex
      .select(
        "id",
        "geraete_id",
        "nutzer_name",
        "positionen",
        knex.raw("array_to_json(positionen) as positionen_json"),
        "gesamt_preis_brutto",
        "waehrung_code",
        "erstellt_am",
        "aktualisiert_am"
      )
      .from(tabellenName)
      .orderBy("erstellt_am", "asc");
    return datensaetze.map(mappeBestellungDatensatz);
  }

  async function speichereBestellung(bestellung) {
    const jetzt = knex.fn.now();
    const positionenArray = jsonbArrayLiteral(knex, bestellung.positionen);
    if (bestellung.id) {
      await knex(tabellenName)
        .where({ id: bestellung.id })
        .update({
          geraete_id: bestellung.geraeteId,
          nutzer_name: bestellung.nutzerName,
          positionen: positionenArray,
          gesamt_preis_brutto: bestellung.gesamtPreisBrutto,
          waehrung_code: bestellung.waehrungCode,
          aktualisiert_am: jetzt,
        });
      return findeNachId(bestellung.id);
    }
    const bestellungId = bestellung.id ?? generiereUuid();
    await knex(tabellenName)
      .insert({
        id: bestellungId,
        geraete_id: bestellung.geraeteId,
        nutzer_name: bestellung.nutzerName,
        positionen: positionenArray,
        gesamt_preis_brutto: bestellung.gesamtPreisBrutto,
        waehrung_code: bestellung.waehrungCode,
        erstellt_am: jetzt,
        aktualisiert_am: jetzt,
      });
    return findeNachId(bestellungId);
  }

  async function findeNachId(id) {
    const datensatz = await knex
      .select(
        "id",
        "geraete_id",
        "nutzer_name",
        "positionen",
        knex.raw("array_to_json(positionen) as positionen_json"),
        "gesamt_preis_brutto",
        "waehrung_code",
        "erstellt_am",
        "aktualisiert_am"
      )
      .from(tabellenName)
      .where({ id })
      .first();
    return mappeBestellungDatensatz(datensatz);
  }

  async function loesche(id) {
    await knex(tabellenName).where({ id }).del();
  }

  return {
    findeAlle,
    speichereBestellung,
    findeNachId,
    loesche,
  };
}
