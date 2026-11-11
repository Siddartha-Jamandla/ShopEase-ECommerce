# ShopEase E-Commerce — Full-Stack Edition

A complete e-commerce web app: storefront (HTML/CSS/JS) + **Python REST API**
(standard library only) + **SQLite** database.

> Built with the skills on my resume: **Python, JavaScript, SQL, HTML/CSS** —
> no frameworks, no paid services, everything runs with a plain `python3`.

## Live Demo

**[https://siddarthashopease.pythonanywhere.com/](https://siddarthashopease.pythonanywhere.com/)** — the full app running live: storefront, REST API, and database.

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
python3 backend/seed.py      # create DB + upsert the 70-product catalog (idempotent)
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
| GET    | `/api/wishlist`         | user | Your wishlist with product details (each item has `average_rating`/`review_count`), newest first |
| POST   | `/api/wishlist`         | user | `{product_id}` — idempotent add: 201 when added, 200 when already present |
| DELETE | `/api/wishlist/:productId` | user | Remove from wishlist (404 if not in your wishlist) |
| POST   | `/api/register`       | –    | `{name, email, password}` (≥6 chars) → `{user, token}` |
| POST   | `/api/login`          | –    | `{email, password}` → `{user, token}`. Brute-force protection: 5 failed attempts within 15 minutes lock the email for 15 minutes (429); a successful login resets the counter. Wrong email and wrong password both return the same generic 401, so the lockout never reveals whether an email is registered |
| GET    | `/api/me`             | user | Your profile: `{id, name, email, created_at}` (401 without a token) |
| PUT    | `/api/me`             | user | Update your name/email: `{name, email}` — email must be valid and unique (409 if taken) |
| POST   | `/api/me/change-password` | user | `{current_password, new_password}` (new password 6–128 chars; 401 if the current password is wrong) |
| GET    | `/api/cart`           | user | Cart with product details → `{items, total, count}` |
| POST   | `/api/cart`           | user | `{product_id, quantity?}` — adds or increments (checks stock) |
| PUT    | `/api/cart/:id`       | user | `{quantity}` — update; `0` removes the item |
| DELETE | `/api/cart/:id`       | user | Remove item (404 if not yours) |
| POST   | `/api/checkout`       | user | Creates an order: optional `{shipping: {name, address, city, state, pincode, phone}}` (validated, persisted on the order), optional `{address_id}` (one of your saved addresses — its snapshot becomes the shipping address; an explicit `shipping` object wins when both are sent; 403 for someone else's address, 404 if missing) and optional `{items: [{product_id, quantity}]}` — the storefront cart lives in localStorage, so the page sends its items explicitly; without `items` the server-side cart is used. Optional `{promo_code}` applies a percentage discount (400 when the code is unknown, expired, fully used, or the subtotal is below its minimum); the order stores `promo_code` + `discount_amount` and `summary` reports `subtotal` (before discount) and `discount_amount`. Prices are snapshotted from the DB, stock decremented, server cart cleared → order with `items`, `shipping` and `summary` |
| GET    | `/api/orders`         | user | Your orders, newest first — each with `shipping` and `summary` (`items_count`, `subtotal`). Filter: `?status=placed\|shipped\|delivered\|cancelled` (400 otherwise). Pagination: `?page=&per_page=` (`per_page` capped at 50) → `{items, page, per_page, total, total_pages}`; a plain request still returns the plain order array |
| GET    | `/api/orders/:id`     | user | One order with items, `shipping` and `summary` (404 if not yours) |
| POST   | `/api/orders/:id/cancel` | user | Cancel your own order while `placed`: restores stock, records a `cancelled` status event. 403 for others' orders, 404 missing, 409 if already shipped/delivered/cancelled |
| GET    | `/api/orders/:id/timeline` | user | Status timeline: `current_status`, `events` (oldest first) and `stages` (placed → shipped → delivered, or placed → cancelled) with reached flags + timestamps |
| PUT    | `/api/admin/orders/:id/status` | admin key (`?key=` or `X-Admin-Key`) | Move an order to its next status: `{status}` — allowed moves are placed → shipped → delivered and placed → cancelled (a cancel restores product stock, like a customer cancel). 400 unknown status, 404 missing order, 409 illegal transition; every move records a status-history event and stamps `updated_at` |
| GET    | `/api/admin/orders` | admin key (`?key=` or `X-Admin-Key`) | All orders, newest first — always `{items, page, per_page, total, total_pages}`. Filter: `?status=placed\|shipped\|delivered\|cancelled` (400 otherwise). Pagination: `?page=&per_page=` (`per_page` capped at 50). Each item has `user_email`, `items_count`, `total` and the `shipping` snapshot (plus `summary`) |
| POST   | `/api/admin/promo-codes` | admin key (`?key=` or `X-Admin-Key`) | Create a promo code: `{code}` (3–30 chars, letters/digits/hyphen/underscore, stored upper-case), `{discount_percent}` (1–90), `{min_order_amount?}` (₹ subtotal, default 0), `{expires_at?}` (`YYYY-MM-DD` = end of that day, or full ISO timestamp; null = never expires), `{max_uses?}` (null = unlimited). 400 bad fields, 409 when the code already exists |
| GET    | `/api/admin/promo-codes` | admin key (`?key=` or `X-Admin-Key`) | List all promo codes, newest first (each with `uses` so far) |
| DELETE | `/api/admin/promo-codes/:id` | admin key (`?key=` or `X-Admin-Key`) | Deactivate (delete) a promo code by id. 404 if missing; deleted codes can no longer be used at checkout |
| GET    | `/api/admin/orders/:id` | admin key (`?key=` or `X-Admin-Key`) | One order in full: items (with product name/image), customer `{id, name, email}`, shipping snapshot, totals and status timeline. 404 if missing |
| GET    | `/api/admin/customers` | admin key (`?key=` or `X-Admin-Key`) | Every customer with `order_count`, `total_spent` (non-cancelled orders) and `last_order_at`, highest spend first. Filter: `?q=` (name/email). Pagination: `?page=&per_page=` (capped at 50) |
| GET    | `/api/admin/revenue` | admin key (`?key=` or `X-Admin-Key`) | Revenue breakdown: `by_day` (each of the last N days, zero-filled), `by_category`, plus `today` and `week` totals. `?days=` (default 30, 1–90). Non-cancelled orders only |
| GET    | `/api/addresses`    | user | Your saved shipping addresses, default first then newest first |
| POST   | `/api/addresses`    | user | Save an address: `{label, full_name, address_line1, address_line2?, city, state, pincode, is_default?}` (pincode must be 6 digits). Setting `is_default` clears your other defaults; your first address becomes the default automatically |
| DELETE | `/api/addresses/:id` | user | Delete one of your addresses (403 for someone else's, 404 if missing). Deleting the default promotes your oldest remaining address to default |
| GET    | `/api/admin/stats`    | admin key (`?key=` or `X-Admin-Key`) | Store stats: `total_revenue` (non-cancelled orders), `orders_by_status`, `top_products` (top 10 by units sold + gross revenue), `user_count` |

Any other `GET` path serves the frontend static files from the repo root.

`admin.html` is the full admin dashboard: enter the admin key (kept only for
the browser session, verified against `GET /api/admin/stats`), then use the
sidebar sections — Dashboard (revenue/orders/customers totals, today + this
week, low-stock alerts, top sellers, recent orders), Products (search, category
and stock filters, pagination, add/edit/delete with brand, old price and badge),
Orders (status filter, pagination, full order detail with items/customer/address,
mark shipped/delivered or cancel), Customers (search, order counts, total spent),
Promotions (create/list/deactivate promo codes) and Revenue (by-day and
by-category bars for the last 7/30/90 days). Wrong or missing keys get a 403.

### Input validation

Write endpoints reject bad input with 400 before touching the database:
product names ≤200 chars, descriptions ≤10000, categories ≤60, image URLs
≤2000; register names ≤100 chars and passwords 6–128 chars; cart quantities
1–99; cart/wishlist `product_id` must be a positive integer; review ratings
1–5 with titles ≤120 and comments ≤2000 chars. Prices must be numbers ≥0 and
stock an integer ≥0. Checkout shipping: name ≤100 chars, address 5–500 chars,
city/state ≤60 chars, pincode exactly 6 digits, phone a valid 10-digit Indian
mobile (an optional `+91`/`91` prefix is accepted); an explicit checkout
`items` list needs a positive `product_id` and quantity 1–99 per line.

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
curl -X POST http://localhost:8000/api/checkout -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"shipping":{"name":"Test User","address":"1-2-3 Main Road","city":"Warangal","state":"Telangana","pincode":"506002","phone":"9876543210"},"items":[{"product_id":1,"quantity":2}]}'
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
orders(id, user_id → users, total, status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_phone, created_at, updated_at)
order_items(id, order_id → orders, product_id → products, quantity, price)
order_status_history(id, order_id → orders, status, changed_at)
```

- `password_hash` = `salt$sha256(salt + password)` (hashlib, per-user salt)
- `order_items.price` snapshots the unit price at checkout
- Foreign keys with `ON DELETE CASCADE`; indexes on category, cart user, order user

Seed data: `python3 backend/seed.py` upserts the 70-product catalog
(men, women, shoes, accessories, electronics, appliances, home, beauty,
fitness — INR prices, real local photos). Safe to re-run: products are
matched by id and updated in place.

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
│   ├── seed.py             # NEW: 70-product catalog seed (idempotent upsert)
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

- `profile.html` loads `js/api.js`: name + email come from `GET /api/me`
  (server wins), saving writes `PUT /api/me`, and the Change Password card
  calls `POST /api/me/change-password`. Phone/address stay local-only — the
  API stores name/email only. Offline, the page falls back to localStorage.
- `checkout.html` + `js/checkout.js`: the coupon box sends the code as
  `promo_code` to `POST /api/checkout` (no hardcoded demo codes — the server
  validates it and the order stores the server-confirmed discount); a
  rejected code stops the order instead of saving it locally. Signed-in
  shoppers can pick a saved address (`GET /api/addresses`) to fill the form.

- `my-orders.html` loads `js/api.js` and reads `GET /api/orders` first
  (with the persisted shipping snapshot, promo code and discount per order)
  — device-only localStorage orders are the offline fallback. Placed orders
  get a Cancel button (`POST /api/orders/:id/cancel`, stock restored).
- Product cards carry a Compare button (`js/products.js` →
  `CompareTool.toggle`, `js/compare.js`): every page that loads
  `products.js` also loads `compare.js`, so the button works on
  shop, categories, home, product details, checkout, profile and
  my-orders — not just product details.

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
- Login is brute-force protected: 5 failed attempts within 15 minutes lock
  the email for 15 minutes (HTTP 429); a successful login resets the
  counter. The tracker is in-memory, so a server restart clears it.
- Product creation requires the `X-Admin-Key` header — change the default key
  before any public deployment (`SHOPEASE_ADMIN_KEY`).
- Keep `backend/.env` out of git (see `.gitignore`).
