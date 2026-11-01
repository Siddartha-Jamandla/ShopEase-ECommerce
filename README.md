# ShopEase E-Commerce — Full-Stack Edition

A complete e-commerce web app: storefront (HTML/CSS/JS) + **Python REST API**
(standard library only) + **SQLite** database.

> Built with the skills on my resume: **Python, JavaScript, SQL, HTML/CSS** —
> no frameworks, no paid services, everything runs with a plain `python3`.

---

## Architecture

```
┌─────────────────────────────┐
│  Frontend (browser)         │
│  *.html + css/ + js/        │
│  js/api.js  →  ShopEaseAPI  │──┐
└─────────────────────────────┘  │  HTTP/JSON
                                 │  (CORS enabled)
┌─────────────────────────────┐  │
│  Backend  backend/app.py    │◄─┘
│  http.server (stdlib)       │
│  ├─ REST API  (/api/...)   │
│  ├─ auth: token = user_id:hash (in-memory sessions)
│  ├─ passwords: sha256(salt + password)
│  └─ static file server (serves the frontend for local dev)
└──────────────┬──────────────┘
               │ sqlite3 (stdlib)
┌──────────────▼──────────────┐
│  backend/shopease.db        │
│  users · products           │
│  cart_items · orders        │
│  order_items                │
└─────────────────────────────┘
```

**Offline mode:** `js/api.js` automatically falls back to a `localStorage`
store when the backend is unreachable, so every page keeps working on
GitHub Pages or when opened as plain files.

---

## Quick start

Requirements: Python 3.8+ (no packages to install).

```bash
# Linux / macOS
./run.sh

# Windows
run.bat

# ...or manually, from the repo root:
python3 backend/seed.py      # create DB + insert 12 demo products (skips if seeded)
python3 backend/app.py       # start API + frontend server
```

Then open **http://localhost:8000/** in your browser.

Optional configuration — copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
# then edit SHOPEASE_PORT and SHOPEASE_ADMIN_KEY
```

---

## API reference

Base URL (local dev): `http://localhost:8000`
All responses are JSON: success → `{ "ok": true, "data": ... }`,
error → `{ "ok": false, "error": "message" }` with the HTTP status code.

Auth: send `Authorization: Bearer <token>` (token returned by register/login).

| Method | Endpoint              | Auth | Description |
|--------|-----------------------|------|-------------|
| GET    | `/api/health`         | –    | Liveness check → `{status:"ok", time}` |
| GET    | `/api/products`       | –    | List products. Filters: `?category=`, `?q=` (alias `?search=`). Sort: `?sort=newest\|price_asc\|price_desc\|name_asc\|name_desc\|rating_asc\|rating_desc` (unrated products sort last). Pagination: `?page=&per_page=` (1–100, default 20) → `{items, page, per_page, total, total_pages}`; plain array otherwise |
| GET    | `/api/products/:id`   | –    | Single product (404 if missing); includes `average_rating` and `review_count` |
| GET    | `/api/products/:id/reviews` | – | Reviews for a product (paginated, newest first) → `{items, page, per_page, total, total_pages, average_rating}`; each item has `user_name` |
| POST   | `/api/products/:id/reviews` | user | Add a review: `{rating}` (int 1–5, required), `{title?, comment?}`; 409 if you already reviewed (use PUT) |
| PUT    | `/api/products/:id/reviews` | user | Update your own review (404 if you haven't reviewed) |
| DELETE | `/api/products/:id/reviews` | user | Delete your own review (404 if you haven't reviewed) |
| POST   | `/api/products`       | admin key (`X-Admin-Key`) | Create product: `name`, `price`, `category?`, `description?`, `image_url?`, `stock?` |
| PUT    | `/api/products/:id`   | admin key (`X-Admin-Key`) | Partial update of any product field (validated like create); 404 if missing |
| DELETE | `/api/products/:id`   | admin key (`X-Admin-Key`) | Delete product; carts cascade automatically; 409 if referenced in past orders |
| POST   | `/api/register`       | –    | `{name, email, password}` (≥6 chars) → `{user, token}` |
| POST   | `/api/login`          | –    | `{email, password}` → `{user, token}` |
| GET    | `/api/cart`           | user | Cart with product details → `{items, total, count}` |
| POST   | `/api/cart`           | user | `{product_id, quantity?}` — adds or increments (checks stock) |
| PUT    | `/api/cart/:id`       | user | `{quantity}` — update; `0` removes the item |
| DELETE | `/api/cart/:id`       | user | Remove item (404 if not yours) |
| POST   | `/api/checkout`       | user | Creates order from cart, snapshots prices, decrements stock, clears cart → order with `items` |
| GET    | `/api/orders`         | user | Your orders, newest first |
| GET    | `/api/orders/:id`     | user | One order with items (404 if not yours) |

Any other `GET` path serves the frontend static files from the repo root.

### Example session (curl)

```bash
# health + products
curl http://localhost:8000/api/health
curl http://localhost:8000/api/products | head -c 300

# register & login
curl -X POST http://localhost:8000/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'
# → {"ok":true,"data":{"user":{...},"token":"1:abc..."}}
TOKEN="<paste token>"

# cart → checkout → orders
curl -X POST http://localhost:8000/api/cart -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"product_id":1,"quantity":2}'
curl http://localhost:8000/api/cart -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8000/api/checkout -H "Authorization: Bearer $TOKEN"
curl http://localhost:8000/api/orders -H "Authorization: Bearer $TOKEN"
```

---

## Database schema

Defined in `backend/schema.sql` (auto-applied on startup). SQLite file:
`backend/shopease.db` (git-ignored).

```
users(id, name, email UNIQUE, password_hash, created_at)
products(id, name, description, price, category, image_url, stock, created_at)
cart_items(id, user_id → users, product_id → products, quantity, UNIQUE(user_id, product_id))
orders(id, user_id → users, total, status, created_at)
order_items(id, order_id → orders, product_id → products, quantity, price)
```

- `password_hash` = `salt$sha256(salt + password)` (hashlib, per-user salt)
- `order_items.price` snapshots the unit price at checkout
- Foreign keys with `ON DELETE CASCADE`; indexes on category, cart user, order user

Seed data: `python3 backend/seed.py` inserts 12 products
(4 fashion with real photos, 4 home, 4 electronics, INR prices).
Re-run with `--force` to wipe and re-seed products.

---

## Project layout

```
ShopEase-ECommerce/
├── index.html, shop.html, cart.html, checkout.html, ...   # storefront (existing)
├── css/  js/  assets/                                     # frontend (existing)
├── js/api.js               # NEW: API client + offline localStorage fallback + auth UI helpers
├── backend/
│   ├── app.py              # NEW: REST API + static server (stdlib only)
│   ├── schema.sql          # NEW: SQLite schema
│   ├── seed.py             # NEW: 12 demo products
│   ├── requirements.txt    # empty - stdlib only
│   ├── .env.example        # config template
│   └── shopease.db         # created at runtime (git-ignored)
├── run.sh / run.bat        # NEW: one-command launchers
├── INTEGRATION.md          # NEW: how to wire js/api.js into the HTML pages
├── TEST_RESULTS.md         # NEW: backend test log
└── .gitignore              # NEW
```

## Frontend integration

No HTML file was modified in this upgrade. To connect the pages to the
backend, add one script tag per page as described in **[INTEGRATION.md](INTEGRATION.md)**:

```html
<script src="js/api.js"></script>
```

## Deployment notes

- **Local / VPS:** `python3 backend/app.py` (set `SHOPEASE_ADMIN_KEY` in the
  environment; use a process manager for production).
- **GitHub Pages / static hosts:** the site works offline via the
  `localStorage` fallback in `js/api.js` — no backend needed.
- **Same-origin API:** `js/api.js` uses relative URLs when not on localhost,
  so a reverse proxy serving the API at `/api/` on the same domain works
  with zero frontend changes.
- Sessions are in-memory (a server restart logs users out); the SQLite file
  persists users, products, carts and orders.

## Security notes

- Passwords are salted + SHA-256 hashed; plaintext passwords are never stored.
- Product creation requires the `X-Admin-Key` header — change the default key
  before any public deployment (`SHOPEASE_ADMIN_KEY`).
- Keep `backend/.env` out of git (see `.gitignore`).
