---
name: verify
description: Build, launch, and drive the boconcept furniture e-commerce app end-to-end to verify changes (web pages + JSON API, bilingual).
---

# Verify the boconcept app

Node.js + Express + Sequelize/MySQL + Redis. Web pages are EJS SSR under `/`; JSON API under `/api`. Runtime surface = HTTP on `:3000`.

## Launch

```bash
docker compose up -d                 # MySQL (:3306) + Redis (:6379) — needed by the app
cp .env.example .env                 # first time only
# clear any stale server, then start:
for pid in $(netstat -ano | grep LISTENING | grep ':3000' | awk '{print $NF}' | sort -u); do taskkill //F //PID "$pid"; done
node index.js > /tmp/boconcept-server.log 2>&1   # run in background; wait ~5s for "Server đang chạy"
```

- EJS templates reload per request (dev) — **view edits need no restart**; **controller/service/route/lib edits DO** (restart node).
- App won't boot without MySQL (calls `sequelize.authenticate()` on start). Redis is not on the request path yet (client only in `lib/redis.js` / `cache.helper.js`).

## Drive (surfaces worth exercising)

```bash
B=http://localhost:3000
curl -s $B/health                                   # {status:ok} (DB-free)
curl -s $B/ | grep -o 'Loại sản phẩm'               # homepage (DB: categories + featured)
curl -s "$B/?lang=en" | grep -o 'Featured products' # i18n (?lang= → cookie persists)
curl -s $B/categories/1                             # listing: breadcrumb, subcats, sort/search/pagination
curl -s "$B/categories/1?sort=price_desc&q=sofa"    # filters
curl -s $B/products/1                               # detail: gallery, variants, tabs
# API:
TOKEN=$(curl -s -X POST $B/api/auth/login -H 'Content-Type: application/json' -d '{"client_id":"demo-client","client_secret":"demo-secret"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.token.accessToken))")
curl -s "$B/api/products?per_page=3"                # public read
curl -s -X POST $B/api/products -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d @payload.json  # write (needs token)
```

Probes that matter here: bad id `/products/abc` & `/categories/abc` **and** `/admin/<res>/abc/edit` → must be **404** (regression: NaN id → `findByPk(NaN)` used to 500; public catalog guards in the controller, admin guards via `adminRouter.param('id')`); `?per_page=999` → 422; wrong login / no-token write / `/admin/*` no-auth → 401; `?sort=BOGUS` → defaults to popular.

Admin area (`/admin`, Basic Auth `ADMIN_USER`/`ADMIN_PASS`): 5 sections — slides, categories, partners, products, certificates — each list + `/new` + `/:id/edit` + POST create/update/`:id/delete`. Homepage sections are all DB-driven (slides, categories, featured=category-tiles-with-counts, partners, certificates) with static fallbacks; changing a section in admin should reflect on `/` after refresh.

## Gotchas (Windows + Git Bash)

- **Do not** send Vietnamese via inline `curl -d '{...}'` — `argv` mangles UTF-8 (`?`/`�`). Write a UTF-8 file and use `curl -d @file.json`. Same for SQL: `mysql < file.sql`.
- Inspect Vietnamese from **raw** curl output; piping through `python -m json.tool` / `node console.log` re-encodes to the console codepage and shows mojibake.
- Read the app's own output raw (`curl`), don't rely on memory.

## Tests (separate from runtime verify)

```bash
npm test                    # unit + feature (supertest); DB test skipped by default → 7 pass / 1 skip
RUN_DB_TESTS=1 npm test     # include live MySQL connectivity → 8/8
```
Jest is scoped to `tests/` via `roots`. Health test hits `/health` (not `/`, which is the homepage).
