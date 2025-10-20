import {
  formatPreisBetrag,
  leseAdminToken,
  speichereAdminToken,
  validiereOptionen,
} from "./util.js";

const apiBasisUrl = window.location.origin.replace(/\/$/, "") + "/api";
const socket = io("/realtime", { path: "/socket.io" });

const adminTokenFormular = document.querySelector("#adminTokenFormular");
const adminTokenEingabe = document.querySelector("#adminTokenEingabe");
const produkteListeElement = document.querySelector("#produkteListe");
const neuesProduktButton = document.querySelector("#neuesProduktButton");
const produktEditorBereich = document.querySelector("#produktEditorBereich");
const produktEditorTitel = document.querySelector("#produktEditorTitel");
const produktFormular = document.querySelector("#produktFormular");
const produktIdEingabe = document.querySelector("#produktId");
const produktNameEingabe = document.querySelector("#produktName");
const produktBeschreibungEingabe = document.querySelector("#produktBeschreibung");
const produktPreisEingabe = document.querySelector("#produktPreis");
const produktKategorieEingabe = document.querySelector("#produktKategorie");
const produktAktivAuswahl = document.querySelector("#produktAktiv");
const optionenDefinitionTextarea = document.querySelector("#optionenDefinition");
const abbrechenButton = document.querySelector("#abbrechenButton");

let produkteCache = [];
let adminToken = leseAdminToken();
adminTokenEingabe.value = adminToken;

adminTokenFormular.addEventListener("submit", (ereignis) => {
  ereignis.preventDefault();
  adminToken = adminTokenEingabe.value.trim();
  speichereAdminToken(adminToken);
  alert("Token gespeichert");
  ladeProdukte();
});

neuesProduktButton.addEventListener("click", () => {
  produktEditorTitel.textContent = "Neues Produkt anlegen";
  produktFormular.reset();
  produktIdEingabe.value = "";
  optionenDefinitionTextarea.value = JSON.stringify(
    {
      gruppen: [],
    },
    null,
    2
  );
  produktEditorBereich.hidden = false;
});

abbrechenButton.addEventListener("click", () => {
  produktEditorBereich.hidden = true;
});

produktFormular.addEventListener("submit", async (ereignis) => {
  ereignis.preventDefault();
  let optionenDefinition;
  try {
    optionenDefinition = JSON.parse(optionenDefinitionTextarea.value);
  } catch (fehler) {
    alert("Optionen-Definition ist kein gültiges JSON");
    return;
  }
  if (!validiereOptionen(optionenDefinition, {})) {
    alert("Optionen-Definition entspricht nicht dem Schema");
    return;
  }
  const payload = {
    id: produktIdEingabe.value || undefined,
    produktName: produktNameEingabe.value.trim(),
    produktBeschreibung: produktBeschreibungEingabe.value.trim(),
    produktPreisBrutto: Number(produktPreisEingabe.value),
    produktKategorie: produktKategorieEingabe.value.trim(),
    produktAktiv: produktAktivAuswahl.value === "true",
    optionenDefinition,
  };
  const antwort = await fetch(`${apiBasisUrl}/admin/produkte`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify(payload),
  });
  if (!antwort.ok) {
    const fehler = await antwort.json().catch(() => ({ nachricht: "Unbekannter Fehler" }));
    alert(`Speichern fehlgeschlagen: ${fehler.nachricht ?? fehler.message}`);
    return;
  }
  produktEditorBereich.hidden = true;
});

function rendereProdukte() {
  produkteListeElement.innerHTML = "";
  for (const produkt of produkteCache) {
    const karte = document.createElement("article");
    karte.classList.add("produkt-karte");

    const kopf = document.createElement("header");
    const titel = document.createElement("h3");
    titel.textContent = produkt.produktName;
    const preis = document.createElement("span");
    preis.textContent = formatPreisBetrag(produkt.produktPreisBrutto, produkt.waehrungCode);
    kopf.append(titel, preis);

    const beschreibung = document.createElement("p");
    beschreibung.textContent = produkt.produktBeschreibung ?? "Keine Beschreibung";

    const status = document.createElement("p");
    status.innerHTML = `<strong>Status:</strong> ${produkt.produktAktiv ? "Aktiv" : "Inaktiv"}`;

    const optionen = document.createElement("pre");
    optionen.textContent = JSON.stringify(produkt.optionenDefinition, null, 2);

    const aktionen = document.createElement("div");
    aktionen.classList.add("bestellung-aktionen");

    const bearbeitenButton = document.createElement("button");
    bearbeitenButton.classList.add("sekundaer");
    bearbeitenButton.textContent = "Bearbeiten";
    bearbeitenButton.addEventListener("click", () => produktBearbeiten(produkt));

    const loeschenButton = document.createElement("button");
    loeschenButton.classList.add("sekundaer");
    loeschenButton.textContent = "Löschen";
    loeschenButton.addEventListener("click", () => produktLoeschen(produkt.id));

    aktionen.append(bearbeitenButton, loeschenButton);

    karte.append(kopf, beschreibung, status, optionen, aktionen);
    produkteListeElement.append(karte);
  }
}

async function produktLoeschen(produktId) {
  const bestaetigt = confirm("Produkt wirklich löschen?");
  if (!bestaetigt) {
    return;
  }
  const antwort = await fetch(`${apiBasisUrl}/admin/produkte/${produktId}`, {
    method: "DELETE",
    headers: {
      "x-admin-token": adminToken,
    },
  });
  if (!antwort.ok) {
    const fehler = await antwort.json().catch(() => ({ nachricht: "Unbekannter Fehler" }));
    alert(`Löschen fehlgeschlagen: ${fehler.nachricht ?? fehler.message}`);
  }
}

function produktBearbeiten(produkt) {
  produktEditorTitel.textContent = "Produkt bearbeiten";
  produktIdEingabe.value = produkt.id;
  produktNameEingabe.value = produkt.produktName;
  produktBeschreibungEingabe.value = produkt.produktBeschreibung ?? "";
  produktPreisEingabe.value = produkt.produktPreisBrutto;
  produktKategorieEingabe.value = produkt.produktKategorie ?? "";
  produktAktivAuswahl.value = produkt.produktAktiv ? "true" : "false";
  optionenDefinitionTextarea.value = JSON.stringify(produkt.optionenDefinition, null, 2);
  produktEditorBereich.hidden = false;
}

socket.on("produkteAktualisiert", () => {
  ladeProdukte();
});

async function ladeProdukte() {
  const headers = {};
  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }
  const antwort = await fetch(adminToken ? `${apiBasisUrl}/admin/produkte` : `${apiBasisUrl}/produkte`, {
    headers,
  });
  if (!antwort.ok) {
    if (antwort.status === 401 && adminToken) {
      alert("Admin-Token ungültig");
      produkteCache = await (await fetch(`${apiBasisUrl}/produkte`)).json();
    } else {
      alert("Produkte konnten nicht geladen werden");
      return;
    }
  } else {
    produkteCache = await antwort.json();
  }
  rendereProdukte();
}

ladeProdukte();
