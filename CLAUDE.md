# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Two things live under `E:\boconcept`:

- **The project (repo root)** — a Node.js + Express + Sequelize/MySQL service. It started as a clean MVC "base" (extracted from the reference below) and is being built into a **BoConcept-style furniture e‑commerce** site (bilingual VI/EN). Backend = JSON REST API under `/api`; frontend = server-rendered EJS pages under `/`.
- **`hasaki-tech-hasaki-services-hasakinow-.../`** — the original HasakiNow logistics service this base was derived from. **Read-only reference; do not modify.** It has a much heavier stack (Elasticsearch, Kafka, Bee-Queue, APM) that was deliberately dropped here. Jest is scoped to ignore it.

## Commands

```bash
npm install
cp .env.example .env               # then edit DB_*/JWT_SECRET  (Git Bash: use copy if cp missing)

docker compose up -d               # MySQL 8 on :3306 (see DB_PORT); auto-runs doc/schema.sql + seed.sql on FIRST init
docker compose down                # stop (keep data) · down -v = wipe volume + re-run schema/seed

npm run dev                        # API + web on :3000 (nodemon)
npm start                          # production start
npm run schedule                   # cron process (app/Console/Kernel.js) — separate PM2 app
node app/Console/Commands/example.command.js seed -n "X"   # CLI pattern (yargs)
npm run pm2:start                  # pm2 (app-server cluster + schedule-runner) from pm2-apps.json

npm test                           # jest (DB-dependent tests are skipped by default)
RUN_DB_TESTS=1 npm test            # include the live MySQL connectivity test
npx jest tests/unit/auth.service.test.js   # single file
npx jest -t "issues and verifies"          # single test by name
```

No linter/formatter is configured. Health check is `GET /health` (root `/` renders the homepage).

**Applying DB changes to an already-running container** (schema.sql/seed.sql only auto-run on a fresh volume):
```bash
docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < doc/schema.sql
```

## Architecture (big picture)

Laravel-style MVC. A request flows: **`routes/` → `applyApiMiddlewares` + `locale.middleware` → `Http/Requests` (validation) → `Http/Controllers` → `Services` → `Models` → `lib` (Sequelize/Redis singletons)**. Wiring lives in `index.js` (view engine, `/static`, middleware order) and `routes/index.route.js` (`/api` + `/`).

- **Response envelope** — controllers extend `app/Http/Controllers/BaseController.js` and reply only via `sendSuccessResponse` / `sendErrorResponse` (`{status, message, data, meta?}`). Note: `sendErrorResponse` does NOT `process.exit` when `res` is missing (changed vs. the reference source).
- **Services** — static classes holding all business logic; controllers stay thin. Services throw `Object.assign(new Error(msg), {status})` and controllers map `err.status` to the HTTP code. Services never touch `req`/`res`.
- **Validation** — `Http/Requests/*.validation.js` (express-validator) run as route middleware and end with `handleValidation` (returns 422). Attach before the controller.
- **Models & associations** — Sequelize models under `app/Models/`; all relationships are declared in `app/Models/index.model.js` (required once at boot in `index.js`). `underscored`, `created_at/updated_at`, and `paranoid` soft-delete are the norm.
- **Catalog domain** — `Category` (self-referencing tree via `parent_id`) → `Product` → `ProductVariant` (Shopee-style child items) + `ProductImage` (gallery). Bilingual fields are dual columns: `name_vi/name_en`, `description_vi/description_en`. Product listing supports `q`, `category_id`, `is_featured`, price range, `sort`, pagination. **READ endpoints are public; write endpoints require a Bearer token** (`authenticate` applied per-method in `routes/api.route.js`).
- **Auth** — `ApiClient` (client_id/secret) → JWT via `AuthService`; `auth.middleware.js` verifies `Authorization: Bearer`. `AuthService.validateClient` lazy-requires the model so `issueToken`/`verifyToken` don't pull in the DB (keeps token unit tests DB-free).
- **i18n (applies to ALL pages)** — text lives in `resources/lang/{vi,en}/*.js` (one file per namespace: `common`, `home`, `messages`). `resources/lang/index.js` merges namespaces per locale with fallback to `vi`. `app/Http/Middleware/locale.middleware.js` runs on every request and injects `res.locals`: `lang`, `altLang`, `t` (e.g. `t.common.nav`, `t.home.featured`), `pick(obj,'name')` (picks `name_<lang>`), `money(v)`. Language priority: `?lang=` → cookie → `Accept-Language` → `vi`; a chosen `?lang=` is persisted in a cookie. Views read `t.*` / `pick` / `money` directly (no need to pass from controllers).
- **Frontend** — EJS in `views/` (`home.ejs` + `partials/`), static assets in `public/` served at `/static`. `home.controller.js` loads categories + featured products from the DB and merges non-translatable data (images/icons) with localized text from `t.home`. Hero/partners/why-us/certificates are still static placeholders (marked TODO to become DB content modules).
- **Background work** — `app/Console/Kernel.js` registers `node-cron` jobs and runs as its own PM2 process (`schedule-runner`); jobs extend `app/Jobs/BaseJob.js`.
- **Config & connections** — `config/*.js` read `.env` via an absolute path (cwd-independent). `lib/database.js` and `lib/redis.js` export shared singletons. MySQL uses timezone `+07:00` and **utf8mb4 is enforced** (`dialectOptions.charset` in `config/mysql.js` + `SET NAMES utf8mb4` atop the SQL files) — required for Vietnamese.

## Conventions

- **Add a new resource**: Model → declare associations in `index.model.js` → Service (static) → `*.validation.js` → Controller (extends BaseController) → wire in `routes/api.route.js`. Copy the `Example`/`Product` set as the template.
- **Add a translatable page**: create `resources/lang/vi/<page>.js` + `en/<page>.js` (the loader auto-discovers them as `t.<page>`), then use `t.<page>.*` in the view — `res.locals` already carries `t`/`pick`/`money`.
- Comments/user-facing strings are commonly in Vietnamese.

## Environment

Required in `.env`: `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASS`, `JWT_SECRET` (+ `TOKEN_EXPIRES_IN`). Optional: `REDIS_*`, `CORS_ORIGIN`, `RATE_LIMIT_*`, `BODY_LIMIT`. See `.env.example`. Docker MySQL defaults align with the example (`root`/`root`, db `app_db`, port 3306); seeded demo client for `/api/auth/login` is `demo-client` / `demo-secret`.

## Gotchas (this Windows + Git Bash environment)

- Testing endpoints with Vietnamese: **do not** pass the body inline (`curl -d '{...}'`) — Windows `argv` mangles UTF-8 into `?`/`�` (looks like a DB bug, isn't). Write the JSON with a file and use `curl -d @file.json`. Same for SQL: pipe a file (`mysql < file.sql`), don't inline.
- Inspecting Vietnamese output: read raw `curl` output (renders UTF-8 correctly); piping through `python -m json.tool` or `node -e console.log` re-encodes to the console codepage and shows mojibake.
