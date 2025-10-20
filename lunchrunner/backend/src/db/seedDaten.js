import knexModule from "knex";
import { v4 as generiereUuid } from "uuid";
import { konfiguration } from "../config.js";

const knex = knexModule({
  client: "pg",
  connection: konfiguration.datenbankUrl,
});

const beispielProdukte = [
  {
    produkt_name: "Veggie Wrap",
    produkt_beschreibung: "Frischer Wrap mit Gemüse und Hummus",
    produkt_preis_brutto: 5.5,
    produkt_kategorie: "Wraps",
    optionen_definition: {
      gruppen: [
        {
          id: "sauce",
          label: "Sauce",
          typ: "single",
          werte: [
            { label: "Joghurtsauce", preisDelta: 0 },
            { label: "BBQ", preisDelta: 0.2 }
          ],
        },
        {
          id: "extras",
          label: "Extras",
          typ: "multi",
          werte: [
            { label: "Feta", preisDelta: 0.5 },
            { label: "Oliven", preisDelta: 0.4 }
          ],
        },
      ],
    },
  },
  {
    produkt_name: "Frikadellenbrötchen",
    produkt_beschreibung: "Hausgemachte Frikadelle im Brötchen",
    produkt_preis_brutto: 3.2,
    produkt_kategorie: "Snacks",
    optionen_definition: {
      gruppen: [
        {
          id: "sauce",
          label: "Sauce",
          typ: "single",
          werte: [
            { label: "Ketchup", preisDelta: 0 },
            { label: "Senf", preisDelta: 0 }
          ],
        },
        {
          id: "extras",
          label: "Extras",
          typ: "multi",
          werte: [
            { label: "Zwiebeln", preisDelta: 0.1 },
            { label: "Käse", preisDelta: 0.4 }
          ],
        },
      ],
    },
  },
  {
    produkt_name: "Sommer-Salat",
    produkt_beschreibung: "Bunter Salat mit saisonalem Gemüse",
    produkt_preis_brutto: 6.9,
    produkt_kategorie: "Salate",
    optionen_definition: {
      gruppen: [
        {
          id: "dressing",
          label: "Dressing",
          typ: "single",
          werte: [
            { label: "Balsamico", preisDelta: 0 },
            { label: "Joghurt", preisDelta: 0 }
          ],
        },
        {
          id: "toppings",
          label: "Toppings",
          typ: "multi",
          werte: [
            { label: "Croutons", preisDelta: 0.3 },
            { label: "Sonnenblumenkerne", preisDelta: 0.2 }
          ],
        },
      ],
    },
  },
];

async function seed() {
  for (const produkt of beispielProdukte) {
    const existierendes = await knex("produkte").where({ produkt_name: produkt.produkt_name }).first();
    if (existierendes) {
      await knex("produkte")
        .where({ id: existierendes.id })
        .update({
          ...produkt,
          aktualisiert_am: knex.fn.now(),
        });
    } else {
      await knex("produkte").insert({ id: generiereUuid(), ...produkt });
    }
  }
}

seed()
  .then(() => {
    console.log("Seed-Daten geschrieben");
  })
  .catch((fehler) => {
    console.error("Seed fehlgeschlagen", fehler);
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
