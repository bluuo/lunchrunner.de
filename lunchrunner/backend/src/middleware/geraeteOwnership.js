import { validate as istUuid } from "uuid";

export function pruefeGeraeteId(req, res, next) {
  const geraeteId = req.headers["x-geraete-id"];
  if (!geraeteId || !istUuid(geraeteId)) {
    res.status(400).json({ nachricht: "Geräte-ID fehlt oder ist ungültig" });
    return;
  }
  req.geraeteId = geraeteId;
  next();
}

export function pruefeAdminToken(konfiguration) {
  return function (req, res, next) {
    const token = req.headers["x-admin-token"];
    if (!token || token !== konfiguration.adminToken) {
      res.status(401).json({ nachricht: "Admin-Token ungültig" });
      return;
    }
    next();
  };
}
