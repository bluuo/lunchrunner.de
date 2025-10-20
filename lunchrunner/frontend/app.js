import { erzeugeOderLeseGeraeteId, formatPreisBetrag, validiereOptionen } from "./util.js";

const apiBasisUrl = window.location.origin.replace(/\/$/, "") + "/api";
const socket = io("/realtime", { path: "/socket.io" });
const geraeteId = erzeugeOderLeseGeraeteId();

const produktAuswahlElement = document.querySelector("#produktAuswahl");
const optionenContainerElement = document.querySelector("#optionenContainer");
const bestellFormularElement = document.querySelector("#bestellFormular");
const bestellungenListeElement = document.querySelector("#bestellungenListe");
const nutzerNameElement = document.querySelector("#nutzerName");
const produktMengeElement = document.querySelector("#produktMenge");

let produkteCache = [];
let bestellungenCache = [];

async function ladeProdukte() {
  const antwort = await fetch(`${apiBasisUrl}/produkte`);
  if (!antwort.ok) {
    throw new Error("Produkte konnten nicht geladen werden");
  }
  produkteCache = await antwort.json();
  aktualisiereProduktAuswahl();
}

async function ladeBestellungen() {
  const antwort = await fetch(`${apiBasisUrl}/bestellungen`);
  if (!antwort.ok) {
    throw new Error("Bestellungen konnten nicht geladen werden");
  }
  bestellungenCache = await antwort.json();
  rendereBestellungen();
}

function aktualisiereProduktAuswahl() {
  produktAuswahlElement.innerHTML = "";
  for (const produkt of produkteCache) {
    const option = document.createElement("option");
    option.value = produkt.id;
    option.textContent = `${produkt.produktName} (${formatPreisBetrag(produkt.produktPreisBrutto, produkt.waehrungCode)})`;
    produktAuswahlElement.append(option);
  }
  baueOptionenFelder();
}

function baueOptionenFelder() {
  optionenContainerElement.innerHTML = "";
  const produktId = produktAuswahlElement.value;
  const produkt = produkteCache.find((eintrag) => eintrag.id === produktId);
  if (!produkt || !produkt.optionenDefinition) {
    optionenContainerElement.hidden = true;
    return;
  }
  optionenContainerElement.hidden = false;
  for (const gruppe of produkt.optionenDefinition.gruppen ?? []) {
    const gruppenElement = document.createElement("div");
    gruppenElement.classList.add("optionen-gruppe");

    const titelElement = document.createElement("h3");
    titelElement.textContent = gruppe.label;
    gruppenElement.append(titelElement);

    const werteContainer = document.createElement("div");
    werteContainer.classList.add("optionen-werte");

    if (gruppe.typ === "single") {
      const leerOption = document.createElement("label");
      const radioLeer = document.createElement("input");
      radioLeer.type = "radio";
      radioLeer.name = `option-${gruppe.id}`;
      radioLeer.value = "";
      radioLeer.checked = true;
      leerOption.append(radioLeer, document.createTextNode("Keine Auswahl"));
      werteContainer.append(leerOption);
    }

    for (const wert of gruppe.werte) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.value = wert.label;
      if (gruppe.typ === "single") {
        input.type = "radio";
        input.name = `option-${gruppe.id}`;
      } else {
        input.type = "checkbox";
        input.name = `option-${gruppe.id}`;
      }
      label.append(input, `${wert.label} (${formatPreisBetrag(wert.preisDelta, produkt.waehrungCode)})`);
      werteContainer.append(label);
    }

    gruppenElement.append(werteContainer);
    optionenContainerElement.append(gruppenElement);
  }
}

function leseOptionenAusFormular() {
  const produktId = produktAuswahlElement.value;
  const produkt = produkteCache.find((eintrag) => eintrag.id === produktId);
  if (!produkt || !produkt.optionenDefinition) {
    return {};
  }
  const auswahl = {};
  for (const gruppe of produkt.optionenDefinition.gruppen ?? []) {
    const inputs = optionenContainerElement.querySelectorAll(`[name="option-${gruppe.id}"]`);
    if (gruppe.typ === "single") {
      const gewaehlte = Array.from(inputs).find((input) => input.checked);
      if (gewaehlte && gewaehlte.value) {
        auswahl[gruppe.id] = gewaehlte.value;
      }
    } else {
      const aktive = Array.from(inputs)
        .filter((input) => input.checked)
        .map((input) => input.value);
      if (aktive.length > 0) {
        auswahl[gruppe.id] = aktive;
      }
    }
  }
  return auswahl;
}

function rendereBestellungen() {
  bestellungenListeElement.innerHTML = "";
  for (const bestellung of bestellungenCache) {
    const karte = document.createElement("article");
    karte.classList.add("bestellung-karte");

    const kopf = document.createElement("div");
    kopf.classList.add("bestellung-kopf");
    const nameElement = document.createElement("h3");
    nameElement.textContent = bestellung.nutzerName;
    const summeElement = document.createElement("span");
    summeElement.textContent = formatPreisBetrag(bestellung.gesamtPreisBrutto, bestellung.waehrungCode);
    kopf.append(nameElement, summeElement);

    const positionsListe = document.createElement("ul");
    positionsListe.classList.add("bestellung-positionen");

    for (const position of bestellung.positionen) {
      const eintrag = document.createElement("li");
      const optionenDetails = [];
      if (position.ausgewaehlteOptionen) {
        for (const [schluessel, wert] of Object.entries(position.ausgewaehlteOptionen)) {
          optionenDetails.push(`${schluessel}: ${Array.isArray(wert) ? wert.join(", ") : wert}`);
        }
      }
      eintrag.textContent = `${position.menge} × ${position.produktNameSnapshot} (${formatPreisBetrag(position.positionsPreisBruttoSnapshot, position.waehrungCode)})${
        optionenDetails.length ? ` – ${optionenDetails.join(" | ")}` : ""
      }`;
      positionsListe.append(eintrag);
    }

    karte.append(kopf, positionsListe);

    if (bestellung.geraeteId === geraeteId) {
      const aktionen = document.createElement("div");
      aktionen.classList.add("bestellung-aktionen");

      const bearbeitenButton = document.createElement("button");
      bearbeitenButton.classList.add("sekundaer");
      bearbeitenButton.textContent = "Bearbeiten";
      bearbeitenButton.addEventListener("click", () => bestellungBearbeiten(bestellung));

      const loeschenButton = document.createElement("button");
      loeschenButton.classList.add("sekundaer");
      loeschenButton.textContent = "Löschen";
      loeschenButton.addEventListener("click", () => bestellungLoeschen(bestellung.id));

      aktionen.append(bearbeitenButton, loeschenButton);
      karte.append(aktionen);
    }

    bestellungenListeElement.append(karte);
  }
}

async function bestellungLoeschen(bestellungId) {
  const bestaetigt = confirm("Bestellung wirklich löschen?");
  if (!bestaetigt) {
    return;
  }
  const antwort = await fetch(`${apiBasisUrl}/bestellungen/${bestellungId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-geraete-id": geraeteId,
    },
  });
  if (!antwort.ok) {
    alert("Löschen fehlgeschlagen");
  }
}

function bestellungBearbeiten(bestellung) {
  nutzerNameElement.value = bestellung.nutzerName;
  const erstePosition = bestellung.positionen[0];
  if (!erstePosition) {
    return;
  }
  produktAuswahlElement.value = erstePosition.produktId;
  baueOptionenFelder();
  produktMengeElement.value = erstePosition.menge;
  for (const gruppeElement of optionenContainerElement.querySelectorAll(".optionen-gruppe")) {
    const gruppenId = gruppeElement.querySelector("input")?.name.replace("option-", "");
    if (!gruppenId || !erstePosition.ausgewaehlteOptionen) {
      continue;
    }
    const auswahlWert = erstePosition.ausgewaehlteOptionen[gruppenId];
    const inputs = gruppeElement.querySelectorAll("input");
    if (Array.isArray(auswahlWert)) {
      for (const input of inputs) {
        input.checked = auswahlWert.includes(input.value);
      }
    } else if (typeof auswahlWert === "string") {
      for (const input of inputs) {
        input.checked = input.value === auswahlWert;
      }
    }
  }
  bestellFormularElement.dataset.bearbeiteBestellungId = bestellung.id;
}

bestellFormularElement.addEventListener("submit", async (ereignis) => {
  ereignis.preventDefault();
  const produktId = produktAuswahlElement.value;
  const produkt = produkteCache.find((eintrag) => eintrag.id === produktId);
  if (!produkt) {
    alert("Bitte Produkt wählen");
    return;
  }
  const optionenAuswahl = leseOptionenAusFormular();
  if (!validiereOptionen(produkt.optionenDefinition, optionenAuswahl)) {
    alert("Optionen ungültig");
    return;
  }
  const payload = {
    nutzerName: nutzerNameElement.value.trim(),
    positionen: [
      {
        produktId,
        menge: Number(produktMengeElement.value),
        ausgewaehlteOptionen: optionenAuswahl,
      },
    ],
  };
  const methode = bestellFormularElement.dataset.bearbeiteBestellungId ? "PUT" : "POST";
  const url = bestellFormularElement.dataset.bearbeiteBestellungId
    ? `${apiBasisUrl}/bestellungen/${bestellFormularElement.dataset.bearbeiteBestellungId}`
    : `${apiBasisUrl}/bestellungen`;
  const antwort = await fetch(url, {
    method: methode,
    headers: {
      "Content-Type": "application/json",
      "x-geraete-id": geraeteId,
    },
    body: JSON.stringify(payload),
  });
  if (!antwort.ok) {
    const fehler = await antwort.json().catch(() => ({ nachricht: "Unbekannter Fehler" }));
    alert(`Speichern fehlgeschlagen: ${fehler.nachricht ?? fehler.message}`);
    return;
  }
  bestellFormularElement.reset();
  delete bestellFormularElement.dataset.bearbeiteBestellungId;
  baueOptionenFelder();
});

produktAuswahlElement.addEventListener("change", () => baueOptionenFelder());

socket.on("produkteAktualisiert", (daten) => {
  produkteCache = daten;
  aktualisiereProduktAuswahl();
  rendereBestellungen();
});

socket.on("bestellungenAktualisiert", (daten) => {
  bestellungenCache = daten;
  rendereBestellungen();
});

Promise.all([ladeProdukte(), ladeBestellungen()]).catch((fehler) => {
  console.error(fehler);
  alert("Initiale Daten konnten nicht geladen werden");
});
