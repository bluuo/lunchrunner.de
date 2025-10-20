export function formatPreisBetrag(betrag, waehrungCode, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: waehrungCode,
  }).format(Number(betrag));
}

export function generiereUuidV4() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const zufallswerte = new Uint8Array(16);
  crypto.getRandomValues(zufallswerte);
  zufallswerte[6] = (zufallswerte[6] & 0x0f) | 0x40;
  zufallswerte[8] = (zufallswerte[8] & 0x3f) | 0x80;
  const hex = Array.from(zufallswerte, (wert) => wert.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

const geraeteIdSchluessel = "lunchrunner-geraete-id";

export function erzeugeOderLeseGeraeteId() {
  let geraeteId = localStorage.getItem(geraeteIdSchluessel);
  if (!geraeteId) {
    geraeteId = generiereUuidV4();
    localStorage.setItem(geraeteIdSchluessel, geraeteId);
  }
  return geraeteId;
}

export function leseAdminToken() {
  return localStorage.getItem("lunchrunner-admin-token") ?? "";
}

export function speichereAdminToken(token) {
  localStorage.setItem("lunchrunner-admin-token", token);
}

export function validiereOptionen(definition, auswahl) {
  if (!definition || typeof definition !== "object" || !Array.isArray(definition.gruppen)) {
    return false;
  }
  if (!auswahl || typeof auswahl !== "object") {
    return false;
  }
  return definition.gruppen.every((gruppe) => {
    const auswahlWert = auswahl[gruppe.id];
    if (gruppe.typ === "single") {
      if (auswahlWert === undefined || auswahlWert === null || auswahlWert === "") {
        return true;
      }
      return gruppe.werte.some((wert) => wert.label === auswahlWert);
    }
    if (gruppe.typ === "multi") {
      if (!Array.isArray(auswahlWert)) {
        return auswahlWert === undefined || auswahlWert === null;
      }
      return auswahlWert.every((eintrag) => gruppe.werte.some((wert) => wert.label === eintrag));
    }
    return false;
  });
}
