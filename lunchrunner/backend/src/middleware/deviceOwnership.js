import { validate as isUuid } from "uuid";

export function requireDeviceId(req, res, next) {
  const deviceId = req.headers["x-device-id"];
  if (!deviceId || !isUuid(deviceId)) {
    res.status(400).json({ message: "Device ID is missing or invalid" });
    return;
  }
  req.deviceId = deviceId;
  next();
}

export function requireAdminToken(config) {
  return function (req, res, next) {
    const token = req.headers["x-admin-token"];
    if (!token || token !== config.adminToken) {
      res.status(401).json({ message: "Admin token is invalid" });
      return;
    }
    next();
  };
}
