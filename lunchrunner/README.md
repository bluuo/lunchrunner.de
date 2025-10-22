# Lunchrunner

Lunchrunner is a fully self-hosted ordering board with real-time updates. The project combines a static frontend (HTML/CSS/JS) with a Node.js/Express backend that uses Socket.IO and PostgreSQL. It is designed for deployment on a VPS that is managed with Plesk and Portainer.

## Architecture overview

- **Frontend** (`frontend/`): Static pages (`index.html`, `admin.html`) powered by vanilla JavaScript.
- **Backend** (`backend/`): Express server exposing a REST API, Socket.IO gateway, Knex migrations, and PostgreSQL access.
- **Realtime**: Socket.IO namespace `/realtime` emits `productsUpdated` and `ordersUpdated` events.
- **Database**: PostgreSQL with migration (`2025-01-init-schema.sql`) and seed script.
- **Security**: Helmet, rate limiting, domain restricted CORS, Clerk-managed admin login, and device ownership enforcement.
- **CI/CD**: Plesk post-deploy script and example GitHub workflow.

## Local quick start

```bash
# Clone the repository and switch into the project
git clone <repo-url>
cd lunchrunner

# Install backend dependencies
npm install --prefix backend

# Start the database (via Docker for local development)
docker compose up -d db

# Run migrations and seed data
npm run migrate --prefix backend
npm run seed --prefix backend

# Launch the backend in development mode (requires the database)
npm run dev --prefix backend
```

The backend serves the frontend at `http://localhost:3000`. Socket.IO connects automatically.

## Project structure

```
lunchrunner/
├─ backend/
│  ├─ src/
│  │  ├─ routes/, services/, db/, socket/, security/
│  │  ├─ server.js (Express + Socket.IO)
│  ├─ package.json, Dockerfile, .env.example
├─ frontend/
│  ├─ index.html, admin.html, app.js, admin.js, util.js, styles.css
├─ docker-compose.yml
├─ plesk-post-deploy.sh
├─ infra/nginx-example.conf
├─ .github/workflows/deploy.yml
```

## Plesk deployment ("Deploy using Git")

1. **Add the repository**: In Plesk under *Websites & Domains → Git* link the repo (branch `main`).
2. **Deployment mode**: Enable "Automatically deploy on push".
3. **Configure the Node.js app**:
   - Node version: 18.x
  - Document root: project folder `lunchrunner`
   - Application startup file: `backend/src/server.js`
   - Set environment variables (`PORT`, `DATABASE_URL`, `CORS_ORIGIN`, Clerk keys from `.env.example`).
4. **Post-deployment script**: Register `plesk-post-deploy.sh` in the Git settings. The script runs `npm ci`, executes migrations, and optionally restarts a PM2 process.
5. **Reverse proxy**: If needed, use `infra/nginx-example.conf` as a template for Nginx/Apache (proxy to port 3000 with WebSocket support).
6. **Database**: Configure a PostgreSQL service (via Plesk or an external instance). Provide credentials via `.env` or Plesk environment variables.

### PM2 (optional)

If PM2 is used, the post-deploy script manages the `lunchrunner` process. Alternatively, rely on the Plesk Node.js app manager.

## Portainer / Docker Compose

`docker-compose.yml` is ready for container-based operation via Portainer or the CLI.

```bash
docker compose up -d
```

Services:

- `db`: PostgreSQL 16 with a persistent `db_data` volume.
- `app`: Backend in development mode (mounts the local source tree). For production, prefer a dedicated build (for example `docker compose -f docker-compose.yml --profile production up`).

Adjust `CORS_ORIGIN` and the Clerk environment variables in the compose file to reflect your domain and Clerk project.

## GitHub Actions (optional)

`.github/workflows/deploy.yml` contains an SSH-based deployment example (e.g., targeting the Plesk server). Update host, user, and paths for your environment.

## Tests

- `npm test --prefix backend` runs the Vitest unit tests (`priceCalculation`, `optionsValidation`) and the smoke test (in-memory API).
- Extend with additional Vitest suites as needed.

## Security & operations

- **CORS**: Defaults to `https://lunchrunner.de`. Update `CORS_ORIGIN` for your domain.
- **Rate limiting**: Write operations are limited to 100 requests per 10 minutes.
- **Helmet**: Provides secure HTTP headers including a Content-Security-Policy.
- **Clerk authentication**: Admin routes verify Clerk session tokens and require the configured admin role metadata.
- **Device ownership**: The frontend generates a `deviceId` (UUID) and sends it as `x-device-id`. The backend restricts modifications to matching devices.

## Clerk authentication

The admin interface uses [Clerk](https://clerk.com/) for sign-in, token management, and user interface components.

1. **Create a Clerk application** and note the publishable and secret keys. For EU or development environments adjust `CLERK_API_BASE_URL` accordingly (default is `https://api.clerk.com`).
2. **Configure environment variables** (see `backend/.env.example`). Required values:
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_ISSUER_URL` (for example `https://<your-app>.clerk.accounts.dev`)
   - `CLERK_JWT_AUDIENCE` (matches the audience configured for the session token template)
   - `CLERK_JWT_TEMPLATE` (name of the JWT template used in the admin frontend)
   - Optional: `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`, `CLERK_ADMIN_ROLE`, and `CLERK_API_BASE_URL`
3. **Create a JWT template in Clerk** (for example named `backend`) with the desired audience and issuer. The admin UI requests this template when calling protected APIs.
4. **Grant administrator rights** to users by setting their Clerk `public_metadata.roles` (or `private_metadata.roles`) to include the value configured in `CLERK_ADMIN_ROLE` (defaults to `admin`). Setting `public_metadata.isAdmin = true` is also accepted.
5. When signed in, the admin frontend acquires a session token and sends it as `Authorization: Bearer <token>` to `/api/admin/*` routes. The backend verifies the token signature against Clerk JWKS and confirms administrator privileges via metadata or the Clerk API.

If Clerk initialization fails the admin UI displays a warning banner; verify that the publishable key and issuer URL are accessible from the browser.

## Database model

### Table `products`

| Column | Type | Description |
| --- | --- | --- |
| id | UUID (PK) | Product identifier |
| product_name | TEXT | Name |
| product_description | TEXT | Description |
| product_price_gross | NUMERIC(10,2) | Gross price |
| currency_code | VARCHAR(3) | Currency (default: EUR) |
| product_category | TEXT | Category |
| product_active | BOOLEAN | Visibility |
| options_definition | JSONB | Options definition |
| created_at / updated_at | TIMESTAMPTZ | Timestamps |

### Table `orders`

| Column | Type | Description |
| --- | --- | --- |
| id | UUID (PK) | Order identifier |
| device_id | UUID | Device binding |
| customer_name | TEXT | Display name |
| items | JSONB[] | Items including price snapshots |
| total_price_gross | NUMERIC(10,2) | Total gross price |
| currency_code | VARCHAR(3) | Currency |
| created_at / updated_at | TIMESTAMPTZ | Timestamps |

## Admin options definition

```
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
