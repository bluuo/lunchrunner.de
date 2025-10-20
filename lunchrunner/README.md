# Lunchrunner

Lunchrunner ist eine vollständige, selbst gehostete Bestellplattform mit Echtzeit-Aktualisierungen. Das Projekt besteht aus einem statischen Frontend (HTML/CSS/JS) und einem Node.js/Express Backend mit Socket.IO und PostgreSQL. Es eignet sich für Deployments auf einem VPS mit Plesk und Portainer.

## Architekturüberblick

- **Frontend** (`frontend/`): Statische Seiten (`index.html`, `admin.html`) mit Vanilla JavaScript.
- **Backend** (`backend/`): Express-Server mit REST-API, Socket.IO, Knex und PostgreSQL.
- **Realtime**: Socket.IO Namespace `/realtime` sendet `produkteAktualisiert` und `bestellungenAktualisiert` Events.
- **Datenbank**: PostgreSQL mit Migration (`2025-01-init-schema.sql`) und Seed-Skript.
- **Sicherheit**: Helmet, Rate-Limit, CORS nur für `https://lunchrunner.*`, Admin-Token & Geräte-Ownership.
- **CI/CD**: Plesk Post-Deploy Script & Beispiel GitHub Workflow.

## Schnellstart lokal

```bash
# Repository klonen und in das Projekt wechseln
git clone <repo-url>
cd lunchrunner

# Backend Abhängigkeiten installieren
npm install --prefix backend

# Datenbank (lokal über Docker) starten
docker compose up -d db

# Migrationen & Seed ausführen
npm run migrate --prefix backend
npm run seed --prefix backend

# Backend im Entwicklungsmodus starten (setzt laufende DB voraus)
npm run dev --prefix backend
```

Das Backend liefert das Frontend unter `http://localhost:3000` aus. Socket.IO verbindet sich automatisch.

## Projektstruktur

```
lunchrunner/
├─ backend/
│  ├─ src/
│  │  ├─ routes/, services/, db/, socket/, sicherheit/
│  │  ├─ server.js (Express + Socket.IO)
│  ├─ package.json, Dockerfile, .env.example
├─ frontend/
│  ├─ index.html, admin.html, app.js, admin.js, util.js, styles.css
├─ docker-compose.yml
├─ plesk-post-deploy.sh
├─ infra/nginx-example.conf
├─ .github/workflows/deploy.yml
```

## Plesk Deployment ("Deploy using Git")

1. **Repository hinzufügen**: In Plesk unter *Websites & Domains → Git* das Repo (Branch `main`) verknüpfen.
2. **Deployment-Modus**: "Automatically deploy on push" aktivieren.
3. **Node.js App konfigurieren**:
   - Node-Version: 18.x
   - Dokumentenstamm: Projektordner `lunchrunner`
   - Startdatei: `backend/src/server.js`
   - Umgebungsvariablen setzen (`PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `ADMIN_TOKEN`).
4. **Post-Deployment Script**: Im Git-Setup `plesk-post-deploy.sh` eintragen. Das Script erledigt `npm ci`, Migrationen und optional PM2-Restart.
5. **Reverse Proxy**: Falls nötig `infra/nginx-example.conf` als Vorlage für Nginx/Apache verwenden (Proxy auf Port 3000, WebSocket-Unterstützung).
6. **Datenbank**: PostgreSQL-Service konfigurieren (z. B. via Plesk oder externe Instanz). Zugangsdaten in `.env` bzw. Plesk-Umgebungsvariablen hinterlegen.

### PM2 (optional)

Wenn PM2 genutzt wird, legt das Post-Deploy Script den Prozess `lunchrunner` an. Alternativ kann die Plesk Node-App Verwaltung den Prozess starten.

## Portainer / Docker Compose

Für einen containerisierten Betrieb über Portainer oder CLI steht `docker-compose.yml` bereit.

```bash
docker compose up -d
```

Services:

- `db`: PostgreSQL 16 mit persistentem Volume `db_daten`.
- `app`: Backend im Entwicklungsmodus (bindet lokalen Quellcode ein). Für Produktion empfiehlt sich ein eigenständiges Build (z. B. `docker compose -f docker-compose.yml --profile production up`).

Passen Sie `CORS_ORIGIN` und `ADMIN_TOKEN` in der Compose-Datei an Ihre Domain an.

## GitHub Actions (optional)

Unter `.github/workflows/deploy.yml` befindet sich ein Beispielworkflow für Deployments via SSH (z. B. auf den Plesk-Server). Passen Sie Host, Benutzer und Pfade an Ihre Umgebung an.

## Tests

- `npm test --prefix backend` führt Vitest-Unit-Tests (`preisBerechnung`, `optionenValidierung`) und den Smoke-Test (In-Memory API) aus.
- Weitere Tests können über zusätzliche Vitest-Suites ergänzt werden.

## Sicherheit & Betrieb

- **CORS**: Standardmäßig nur `https://lunchrunner.de` erlaubt. Passen Sie `CORS_ORIGIN` an.
- **Rate-Limit**: Schreiboperationen auf 100 Requests / 10 Minuten begrenzt.
- **Helmet**: Liefert sichere HTTP-Header, inkl. Content-Security-Policy.
- **Admin-Token**: In `backend/.env` definieren und in Admin-UI eingeben (LocalStorage speichert Token clientseitig).
- **Geräte-Ownership**: Frontend erzeugt `geraeteId` (UUID) und sendet diese mit `x-geraete-id`. Backend erlaubt Änderungsoperationen nur für passende Geräte.

## Datenbankmodell

### Tabelle `produkte`

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| id | UUID (PK) | Produkt-ID |
| produkt_name | TEXT | Name |
| produkt_beschreibung | TEXT | Beschreibung |
| produkt_preis_brutto | NUMERIC(10,2) | Bruttopreis |
| waehrung_code | VARCHAR(3) | Währung (Standard: EUR) |
| produkt_kategorie | TEXT | Kategorie |
| produkt_aktiv | BOOLEAN | Sichtbarkeit |
| optionen_definition | JSONB | Definition der Optionen |
| erstellt_am / aktualisiert_am | TIMESTAMPTZ | Timestamps |

### Tabelle `bestellungen`

| Spalte | Typ | Beschreibung |
| --- | --- | --- |
| id | UUID (PK) | Bestellung |
| geraete_id | UUID | Gerätebindung |
| nutzer_name | TEXT | Anzeigename |
| positionen | JSONB[] | Positionen inkl. Preis-Snapshots |
| gesamt_preis_brutto | NUMERIC(10,2) | Gesamtpreis |
| waehrung_code | VARCHAR(3) | Währung |
| erstellt_am / aktualisiert_am | TIMESTAMPTZ | Timestamps |

## Admin-Optionen Definition

```
{
  "gruppen": [
    {
      "id": "sauce",
      "label": "Sauce",
      "typ": "single",
      "werte": [
        { "label": "Ketchup", "preisDelta": 0.00 },
        { "label": "BBQ", "preisDelta": 0.20 }
      ]
    },
    {
      "id": "extras",
      "label": "Extras",
      "typ": "multi",
      "werte": [
        { "label": "Zwiebeln", "preisDelta": 0.10 },
        { "label": "Käse", "preisDelta": 0.40 }
      ]
    }
  ]
}
```

## Lizenz

MIT
