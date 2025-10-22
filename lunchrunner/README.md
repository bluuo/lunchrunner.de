# Lunchrunner

Lunchrunner is a self-hosted lunch ordering board with real-time updates. The project pairs a static frontend (HTML/CSS/JS) with a Java Spring Boot backend that exposes a REST API, verifies Clerk-based admin access, and broadcasts Socket.IO events. It is designed for VPS deployments managed by Plesk and Portainer.

## Architecture overview

- **Frontend** (`frontend/`): Static pages (`index.html`, `admin.html`) rendered by vanilla JavaScript. The frontend persists a device UUID in `localStorage` to enforce ownership of orders.
- **Backend** (`backend/`): Spring Boot 3 application with REST controllers, Flyway migrations, JPA repositories, and a Socket.IO gateway (`netty-socketio`).
- **Realtime**: Namespace `/realtime` emits `productsUpdated` and `ordersUpdated` events whenever catalog or order data changes.
- **Database**: PostgreSQL 16 with a Flyway migration (`V202501010000__init_schema.sql`) and automatic seed data for three sample products.
- **Security**: Strict CORS, Clerk-admin verification, and device ownership enforcement on order mutations.
- **CI/CD**: Plesk post-deploy script plus an optional GitHub Actions workflow.

## Project structure

```
lunchrunner/
├─ backend/
│  ├─ pom.xml, Dockerfile, .env.example
│  └─ src/main/java/de/lunchrunner/backend/...
├─ frontend/
│  ├─ index.html, admin.html, app.js, admin.js, util.js, styles.css
├─ docker-compose.yml
├─ plesk-post-deploy.sh
├─ infra/nginx-example.conf
├─ .github/workflows/deploy.yml
└─ README.md
```

## Local quick start

```bash
# Clone the repository and switch into the project
git clone <repo-url>
cd lunchrunner

# Start PostgreSQL (Docker Desktop / Podman Desktop or a local instance)
docker compose up -d db

# Build and run the backend (listens on http://localhost:3000)
mvn -f backend/pom.xml -DskipTests package
java -jar backend/target/backend-1.0.0.jar
```

The Spring Boot backend serves the static frontend from the classpath (`/index.html`, `/admin.html`). Socket.IO connects automatically using the realtime configuration endpoint.

To develop iteratively, you can run `mvn -f backend/pom.xml spring-boot:run` and edit the frontend files in `frontend/`.

## Docker Compose / Portainer

`docker-compose.yml` builds the backend image and runs PostgreSQL. The backend exposes ports `3000` (HTTP API + static assets) and `3300` (Socket.IO server). Adjust the environment variables to reflect your domain and Clerk project.

```bash
docker compose up --build
```

Services:

- `db`: PostgreSQL 16 with a persistent `db_data` volume.
- `app`: Spring Boot backend built from `backend/Dockerfile`.

When running behind Portainer, publish ports `3000` and `3300`, or proxy `/socket.io` traffic to the Socket.IO port.

## Environment variables

The backend reads configuration via Spring Boot properties (see `backend/.env.example`). Key values:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`). |
| `SPRING_DATASOURCE_URL` | JDBC URL for PostgreSQL. |
| `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | Database credentials. |
| `LUNCHRUNNER_CORS_ORIGIN` | Allowed HTTPS origin (e.g., `https://lunchrunner.de`). |
| `LUNCHRUNNER_CLERK_PUBLISHABLE_KEY` | Clerk publishable key. |
| `LUNCHRUNNER_CLERK_SECRET_KEY` | Clerk secret key (used to verify admin metadata). |
| `LUNCHRUNNER_CLERK_ISSUER_URL` | Clerk issuer URL (e.g., `https://<app>.clerk.accounts.dev`). |
| `LUNCHRUNNER_CLERK_JWT_AUDIENCE` / `LUNCHRUNNER_CLERK_JWT_TEMPLATE` | Audience and template for Clerk session tokens. |
| `LUNCHRUNNER_CLERK_ADMIN_ROLE` | Metadata flag checked for administrator privileges (default `admin`). |
| `LUNCHRUNNER_CLERK_SIGN_IN_URL` / `LUNCHRUNNER_CLERK_SIGN_UP_URL` | Optional Clerk-hosted pages for redirects. |
| `LUNCHRUNNER_SOCKET_IO_PORT` | Socket.IO server port (default `3300`). |
| `LUNCHRUNNER_SOCKET_IO_ENABLED` | Toggle Socket.IO (set to `false` for tests). |

## Plesk deployment ("Deploy using Git")

1. **Add the repository**: In Plesk under *Websites & Domains → Git*, link the repository (branch `main`).
2. **Deployment mode**: Enable "Automatically deploy on push".
3. **Configure the Java application**:
   - Runtime: Java 21 (Temurin) with Maven available.
   - Document root: the repo folder `lunchrunner`.
   - Deployment script: see `plesk-post-deploy.sh` (invoked after pull).
   - Environment variables: apply values from `backend/.env.example` via the Plesk UI.
4. **Post-deploy hook** (`plesk-post-deploy.sh`):
   - `mvn -f backend/pom.xml -B -DskipTests package`
   - Restart the application server (systemd service, Plesk Java app, or PM2 if you wrap the jar).
5. **Reverse proxy**: Use `infra/nginx-example.conf` (or Apache equivalent) to proxy HTTPS traffic to port `3000` and forward `/socket.io` to the Socket.IO port (`3300`).
6. **Database**: Provision PostgreSQL via Plesk or an external instance. Supply credentials through environment variables.

### Post-deploy script expectations

`plesk-post-deploy.sh` assumes Maven is available on the server. Adjust the script if you rely on a Maven wrapper or containerized build step.

## GitHub Actions (optional)

`.github/workflows/deploy.yml` provides an SSH-based deployment template. Update the host, SSH key, remote path, and restart commands to match your infrastructure.

## Tests

```bash
mvn -f backend/pom.xml test
```

The suite covers:

- Unit tests for `OptionsValidationService` and `PriceCalculationService`.
- An end-to-end smoke test that starts the Spring Boot application with Testcontainers (PostgreSQL) and validates the public ordering flow.

## Security & operations

- **CORS**: Enforced via `LUNCHRUNNER_CORS_ORIGIN`.
- **Clerk admin verification**: Admin endpoints require a valid Clerk session token. Metadata (`isAdmin`, `roles`, or `role`) must include the configured admin role. If not present in the token, the backend queries the Clerk API.
- **Device ownership**: `x-device-id` header (UUID) is required for order mutations. The backend rejects changes for orders owned by a different device.
- **Socket.IO**: Namespace `/realtime` broadcasts `productsUpdated` and `ordersUpdated`. Clients fetch `/api/auth/realtime-config` to determine the socket endpoint.

## Database model

### Table `products`

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID (PK) | Product identifier |
| `product_name` | TEXT | Name |
| `product_description` | TEXT | Optional description |
| `product_price_gross` | NUMERIC(10,2) | Gross price |
| `currency_code` | VARCHAR(3) | Currency (default EUR) |
| `product_category` | TEXT | Optional category |
| `product_active` | BOOLEAN | Visibility flag |
| `options_definition` | JSONB | Options definition |
| `created_at` / `updated_at` | TIMESTAMPTZ | Timestamps |

### Table `orders`

| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID (PK) | Order identifier |
| `device_id` | UUID | Device binding |
| `customer_name` | TEXT | Display name |
| `items` | JSONB | Array of item snapshots with pricing |
| `total_price_gross` | NUMERIC(10,2) | Total gross price |
| `currency_code` | VARCHAR(3) | Currency |
| `created_at` / `updated_at` | TIMESTAMPTZ | Timestamps |

## Options definition schema

```json
{
  "groups": [
    {
      "id": "sauce",
      "label": "Sauce",
      "type": "single",
      "values": [
        { "label": "Ketchup", "priceDelta": 0.00 },
        { "label": "BBQ", "priceDelta": 0.20 }
      ]
    },
    {
      "id": "extras",
      "label": "Extras",
      "type": "multi",
      "values": [
        { "label": "Onions", "priceDelta": 0.10 },
        { "label": "Cheese", "priceDelta": 0.40 }
      ]
    }
  ]
}
```

## License

MIT
