import { v4 as generiereUuid } from 'uuid';
const tabellenName = "produkte";

export function mappeProduktDatensatz(datensatz) {
  if (!datensatz) {
    return null;
  }
  return {
    id: datensatz.id,
    produktName: datensatz.produkt_name,
    produktBeschreibung: datensatz.produkt_beschreibung,
    produktPreisBrutto: Number(datensatz.produkt_preis_brutto),
    waehrungCode: datensatz.waehrung_code,
    produktKategorie: datensatz.produkt_kategorie,
    produktAktiv: datensatz.produkt_aktiv,
    optionenDefinition: datensatz.optionen_definition,
    erstelltAm: datensatz.erstellt_am,
    aktualisiertAm: datensatz.aktualisiert_am,
  };
}

export function erzeugeProduktRepository(knex) {
  async function findeAlleAktiven() {
    const datensaetze = await knex(tabellenName).where({ produkt_aktiv: true }).orderBy("produkt_name", "asc");
    return datensaetze.map(mappeProduktDatensatz);
  }

  async function findeAlle() {
    const datensaetze = await knex(tabellenName).orderBy("produkt_name", "asc");
    return datensaetze.map(mappeProduktDatensatz);
  }

  async function speichereProdukt(produkt) {
    const jetzt = knex.fn.now();
    if (produkt.id) {
      const datensatz = {
        produkt_name: produkt.produktName,
        produkt_beschreibung: produkt.produktBeschreibung,
        produkt_preis_brutto: produkt.produktPreisBrutto,
        waehrung_code: produkt.waehrungCode ?? "EUR",
        produkt_kategorie: produkt.produktKategorie,
        produkt_aktiv: produkt.produktAktiv,
        optionen_definition: produkt.optionenDefinition,
        aktualisiert_am: jetzt,
      };
      await knex(tabellenName).where({ id: produkt.id }).update(datensatz);
      const aktualisiert = await knex(tabellenName).where({ id: produkt.id }).first();
      return mappeProduktDatensatz(aktualisiert);
    }
    const produktId = produkt.id ?? generiereUuid();
    const [neu] = await knex(tabellenName)
      .insert({
        id: produktId,
        produkt_name: produkt.produktName,
        produkt_beschreibung: produkt.produktBeschreibung,
        produkt_preis_brutto: produkt.produktPreisBrutto,
        waehrung_code: produkt.waehrungCode ?? "EUR",
        produkt_kategorie: produkt.produktKategorie,
        produkt_aktiv: produkt.produktAktiv ?? true,
        optionen_definition: produkt.optionenDefinition,
        erstellt_am: jetzt,
        aktualisiert_am: jetzt,
      })
      .returning("*");
    return mappeProduktDatensatz(neu);
  }

  async function findeNachId(id) {
    const datensatz = await knex(tabellenName).where({ id }).first();
    return mappeProduktDatensatz(datensatz);
  }

  async function loescheProdukt(id) {
    await knex(tabellenName).where({ id }).del();
  }

  return {
    findeAlleAktiven,
    findeAlle,
    speichereProdukt,
    findeNachId,
    loescheProdukt,
  };
}
