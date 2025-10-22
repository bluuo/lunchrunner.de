export function formatPriceAmount(amount, currencyCode, locale = "de-DE") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

export function generateUuidV4() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;
  const hex = Array.from(randomValues, (value) => value.toString(16).padStart(2, "0"));
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

const deviceIdKey = "lunchrunner-device-id";

export function createOrReadDeviceId() {
  let deviceId = localStorage.getItem(deviceIdKey);
  if (!deviceId) {
    deviceId = generateUuidV4();
    localStorage.setItem(deviceIdKey, deviceId);
  }
  return deviceId;
}

export function validateOptions(definition, selection) {
  if (!definition || typeof definition !== "object" || !Array.isArray(definition.groups)) {
    return false;
  }
  if (!selection || typeof selection !== "object") {
    return false;
  }
  return definition.groups.every((group) => {
    const selectionValue = selection[group.id];
    if (group.type === "single") {
      if (selectionValue === undefined || selectionValue === null || selectionValue === "") {
        return true;
      }
      return group.values.some((value) => value.label === selectionValue);
    }
    if (group.type === "multi") {
      if (!Array.isArray(selectionValue)) {
        return selectionValue === undefined || selectionValue === null;
      }
      return selectionValue.every((entry) => group.values.some((value) => value.label === entry));
    }
    return false;
  });
}
