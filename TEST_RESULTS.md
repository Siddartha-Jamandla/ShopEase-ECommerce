# ShopEase Full-Stack Backend — Test Results

**Date:** 2026-10-31 (IST)
**Command:** `python3 backend/app.py --port 8123` (from repo root) + `bash /tmp/shopease_test.sh`
**Python:** stdlib only — no packages installed.

## Summary

**39 passed, 0 failed.** Every required endpoint was exercised end-to-end with
curl: health, products (list/filter/search/single/404), admin product creation
(403 without key, 201 with key), register (duplicate → 409), login (wrong
password → 401, malformed JSON → 400), full cart flow (add/update/delete,
stock limits, unauthenticated → 401), checkout (order creation, price snapshot,
stock decrement, cart clear, empty-cart → 400), orders (list/detail,
cross-user isolation → 404), static file serving, and CORS headers.

## Full log

```
=== health ===
PASS: health ok
=== products ===
PASS: 12 products seeded
PASS: product 3 name
PASS: product 999 -> 404
PASS: category filter electronics
PASS: search filter
=== auth ===
PASS: register ok
PASS: no plaintext password in response
PASS: duplicate register -> 409
token format: 2:<hash>  (user_id:hash)
PASS: token starts with user id
PASS: login wrong password -> 401
PASS: login bad json -> 400
PASS: password stored as salt$hash, not plaintext
PASS: login ok
PASS: cart without auth -> 401
=== cart ===
PASS: add to cart
PASS: cart has 2 lines
PASS: cart total
PASS: update qty to 3
PASS: add over stock -> 400
PASS: add missing product -> 404
=== checkout & orders ===
PASS: checkout ok
PASS: second checkout on empty cart -> 400
PASS: order total
PASS: order status
PASS: cart cleared after checkout
PASS: stock decremented (1: 120-3=117)
PASS: order detail items
PASS: orders list has 1
PASS: other user cannot see order -> 404
PASS: other user sees 0 orders
PASS: delete missing cart item -> 404
=== admin product create ===
PASS: no admin key -> 403
PASS: admin create 201
PASS: new product name
=== static serving ===
PASS: index.html served
PASS: js/api.js served
PASS: missing page -> 404
PASS: CORS header present

RESULT: 39 passed, 0 failed
```

## Verified request/response samples

**`GET /api/health`**
```json
{"ok": true, "data": {"status": "ok", "time": "2026-10-31T01:32:18Z"}}
```

**`GET /api/products/3`**
```json
{"ok": true, "data": {"id": 3, "name": "Slim Fit Casual Shirt",
 "description": "Comfortable slim-fit shirt suitable for casual and semi-formal looks. Soft-touch cotton blend.",
 "price": 1199.0, "category": "fashion",
 "image_url": "assets/images/products/slim-fit-shirt.jpg", "stock": 95,
 "created_at": "2026-10-31 01:32:10"}}
```

**`POST /api/register`** → `{"ok": true, "data": {"user": {"id": 2, "name": "QA Bot",
"email": "qa@example.com", "created_at": "..."}, "token": "2:<64-hex-chars>"}}`

**Checkout flow:** added product 1 ×3 (₹899) + product 9 ×1 (₹1799) →
order total ₹4496.0, status `placed`, 2 order items with price snapshots;
cart emptied; product 1 stock 120 → 117.

**Error format:** `{"ok": false, "error": "message"}` with correct HTTP codes
(400/401/403/404/409 verified).

## Notes

- Passwords verified in SQLite as `salt$sha256(salt+password)` — no plaintext.
- Sessions are in-memory (`token = user_id:hash`); server restart invalidates them.
- After testing, the database was reset: `backend/shopease.db` deleted and
  re-seeded with the clean 12 products (0 users, 0 orders).
- `js/api.js` passed a Node syntax check; browser behaviour not tested here
  (no live-browser access in this environment).

## Re-test — 2026-11-10 (IST)

Admin-endpoint batch (`GET /api/admin/orders/:id`,
`GET /api/admin/customers`, `GET /api/admin/revenue`,
`DELETE /api/admin/promo-codes/:id`) tested on a scratch DB from this
commit's `backend/app.py` (port 8131, seeded 70 products).
**31 checks, all passing.**

- Register → checkout with a server promo code (TEST10, 10% off) → order
  placed with the discount stored; admin order detail returns items, the
  customer (name/email) and the timeline (placed); 404 for an unknown id,
  403 without a key or with a wrong key.
- Admin customers lists the buyer with `order_count` 1 and `total_spent`
  above 0; `?q=` filters by email; 403 without a key.
- Admin revenue returns `by_day` (zero-filled), `by_category`, and
  `today`/`week` as `{revenue, orders}`; `?days=7` returns 7 rows;
  403 without a key.
- Deleting the promo code returns 200; checkout with it then fails 400;
  deleting it again or an unknown id returns 404; 403 without a key.
- Regressions: `/api/admin/stats`, `/api/admin/orders`, `/api/orders`
  and order cancel still pass.

---

## Daily upgrade — 2026-11-11 (IST): compare button on every page

`js/products.js` gains the Compare button on product cards (was local-only
since the redesign) and `js/compare.js` is now loaded on all 7 pages that
load `products.js` (categories, checkout, index, my-orders, profile, shop
+ product-details, which already had it), so `CompareTool.toggle` can no
longer throw on a page without the script.

Tested statically on the snapshot files: `js/products.js` passes
`node --check` and carries the Compare button; each of the 6 pages has
exactly one `compare.js` tag placed right after the `products.js` tag;
`product-details.html` was left untouched (it already loaded compare.js).
**17 checks, all passing.**

---

## Daily upgrade — 2026-11-11 (IST): meta copy + design-system sweep

`profile.html`, `checkout.html`, `my-orders.html`, `index.html` and
`categories.html` now say "70 hand-picked products" (the live catalog grew
62 → 70 on 8 Nov; only shop + product-details were updated then) and link
`css/design-system.css` right after `css/style.css`, matching shop.html and
product-details.html.

Tested statically on the snapshot files: each of the 5 pages has exactly
one `design-system.css` link placed right after the `style.css` link,
says "70 hand-picked" in the meta description, og:description (and, on
index.html, the body copy), and has no remaining "62 hand-picked".
**20 checks, all passing.**


---

## Daily upgrade — 2026-11-13 (IST): search suggestions

`GET /api/products/suggest` returns up to 8 `{id, name, price, image_url,
category, stock}` matches ranked name-prefix → name-contains →
description, in-stock first; `ShopEaseAPI.suggestProducts()` wraps it and
`js/search.js` shows a debounced (200 ms) dropdown under the header search
box (click a suggestion to open the product; Escape / click-outside closes;
offline, plain search still works).

Tested 2026-11-13 on a scratch DB from this commit's `backend/app.py`
(port 8141, seeded 70 products): suggest returns ranked matches
(name-prefix first, case-insensitive, `[]` for empty/missing/no-match
queries, `limit` 1–8 ok with 400s for 0/9/non-integer), in-stock matches
rank before out-of-stock ones at the same relevance, and health, products
list/get/search, register, cart add, checkout and order get still pass.
**35 checks, all passing.**


---

## Daily upgrade — 2026-11-13 (IST): related products

`GET /api/products/:id/related` returns up to 8 same-category products
(excluding the product itself), in-stock first, then rating desc, then
name; `?limit=` 1–8 (default 4), 404 for an unknown product.
`ShopEaseAPI.relatedProducts()` wraps it; `js/main.js` feeds the
"You May Also Like" grid on product-details.html from the endpoint first
(`js/api.js` is now loaded on that page) and falls back to the local
catalog when the backend is down.

Tested 2026-11-13 on a scratch DB from this commit's `backend/app.py`
(port 8142, seeded 70 products): related returns same-category only,
excludes self, defaults to 4, `limit` 1–8 ok with 400s for 0/9/non-integer,
404 for an unknown product; in-stock beats a higher rating, in-stock items
rank by rating desc; health, products list/get still pass.
**29 checks, all passing.**


---

## Daily upgrade — 2026-11-13 (IST): order-tracking timeline on My Orders

My Orders now shows a per-order stage timeline (placed → shipped →
delivered, or placed → cancelled) under each order header, fetched from
the existing `GET /api/orders/:id/timeline` via a new
`ShopEaseAPI.getOrderTimeline()` helper; reached stages are green, the
last reached stage is the current one, cancelled shows red, and each
reached stage shows its timestamp. Backend orders only — localStorage
orders keep no timeline and their placeholder stays hidden; a failed
fetch hides that order's timeline instead of breaking the page.

Tested 2026-11-13 on a scratch DB from the live `backend/app.py` (port
8143, seeded 70 products): timeline stages arrive in order with correct
reached flags for a fresh order and after cancelling (placed →
cancelled), 401 unauthenticated, 403 for another user's order, 404 for
an unknown order; the page's own renderOrderTimeline() was executed in
Node for placed/delivered/cancelled payloads (step order, reached/current
classes, dates); orders list and cancel still pass.
**30 checks, all passing.**


---

## Daily upgrade — 2026-11-14 (IST): DB performance indexes

`backend/schema.sql` gains three indexes that were missing live
(`idx_products_category`, `idx_cart_user`, `idx_orders_user`,
`idx_reviews_product` and `idx_wishlist_user` already existed):
`idx_products_price` on `products(price)`, `idx_products_stock` on
`products(stock)` and `idx_orders_created_at` on `orders(created_at)`.
`init_db()` re-runs `schema.sql` on every startup, so the indexes are
also created on databases built from the older schema — no separate
migration step is needed. README documents the full index list.

Tested 2026-11-14 on a scratch DB (port 8151): a database seeded from
the OLD schema had none of the three indexes; after starting the app
with the new `schema.sql` all three appear in `sqlite_master` on the
right columns, the five pre-existing indexes are untouched, and health,
product list (including a price-sorted list), register, cart, checkout
and orders list still pass.
**32 checks, all passing.**


---

## Daily upgrade — 2026-11-14 (IST): low-stock admin endpoint

`GET /api/admin/low-stock?threshold=` (default 5, 1–100, admin-key auth
like the other admin endpoints) returns `{threshold, count, items}` —
products with `stock <= threshold`, lowest stock first.
`ShopEaseAPI.adminLowStock()` wraps it, and the admin dashboard's Low
stock panel now calls the endpoint (with a threshold input + Refresh
button) instead of paging the whole catalogue and filtering in the
browser; a failed fetch shows an inline note and the rest of the
dashboard still loads. README documents the endpoint.

Tested 2026-11-14 on a scratch DB from this commit's `backend/app.py`
(port 8152, seeded 70 products with five pinned stocks 0/2/5/6/100):
no key → 403, wrong key → 403, `?key=` query auth works; default
returns exactly the products with stock ≤ 5, sorted ascending, stock 6
excluded; `?threshold=1` matches the DB count; 0/101/non-integer → 400;
health, products list and admin stats still pass.
**34 checks, all passing.**


---

## Daily upgrade — 2026-11-14 (IST): recently viewed products

New `js/recently-viewed.js` (localStorage only, no API calls): every
product-details visit is recorded by `loadProductDetails()` in
`js/main.js` (guarded, so the page works if the script is absent) and a
"Recently viewed" strip renders into `#recentlyViewedGrid` on shop.html
and product-details.html — at most 8 products, most recent first,
re-viewing moves a product to the front instead of duplicating it, the
product being viewed is excluded from its own strip, and the section
hides itself when the list is empty. Cards reuse
`createHomepageProductCard`, so the strip matches "You May Also Like".
README documents the feature. (This replaces the planned orders
filter + pagination frontend wiring: `GET /api/orders?status=&page=&per_page=`
already exists live, backend and `ShopEaseAPI.getOrders()` included.)

Tested 2026-11-14: the module was executed in Node with localStorage /
document stubs — empty storage → `[]`, 3 records in most-recent-first
order, re-visit dedupes and moves to front, 11 records keep the newest
8, corrupt stored JSON → `[]`, bad `record()` calls are no-ops, empty
render returns 0 and hides the section, render returns the count and
excludes the `?id=` product; both pages pass `node --check` and serve
200 with the strip from the live backend on a scratch DB (port 8153),
health and products list still pass.
**42 checks, all passing.**


---

## Daily upgrade — 2026-11-15 (IST): My Orders status filter

`my-orders.html` gains a Status filter (All statuses / Placed /
Shipped / Delivered / Cancelled) in the page header. Signed in, the
selection is passed to `ShopEaseAPI.getOrders({status})` so the live
backend filters (`GET /api/orders?status=`); signed out, the same
filter runs client-side over the device-only orders, where a missing
or "Confirmed" status counts as "placed". The empty state names the
selected status when a filter yields nothing, and the order count
reflects the filtered list.

Tested locally (test_shopease_2026-11-15_item1.py, port 8161, scratch
DB, live `backend/app.py`): 19 checks, all passing — select options,
normalizer mappings (missing/"Confirmed" -> placed), diff discipline,
plus a live register -> cart -> checkout flow proving
`?status=placed` returns the order, `?status=delivered` returns none,
an invalid status is a 400, and plain `/api/orders` still returns the
array.


---

## Daily upgrade — 2026-11-15 (IST): Low-stock badges

`stockBadgeHtml(product)` in `js/products.js` renders "Only N left"
(0 < stock ≤ 5) or "Out of stock" (stock 0) and nothing when stock is
unknown, so the offline fallback catalog never shows a wrong badge.
The badge appears under the price on shop-grid cards
(`createProductCard`) and the `filters.js` fallback card, and as a
stock line under the price on product-details.html
(`renderProductDetails` in `js/main.js`); styles live in
`css/components.css` (`.low-stock-badge`, `.out-of-stock-badge`,
`.product-stock-line`). Seed data: four products now have genuinely
low stock (cargo pants 3, running shoes 2, noise buds 4, yoga mat 0)
— previously all 70 were 44–159, so the badge could never appear on a
fresh database. Existing live databases are untouched (seed.py only
runs on fresh setup).

Tested locally (test_shopease_2026-11-15_item2.py, port 8162, scratch
DB, live `backend/app.py`): 24 checks, all passing — the real
`stockBadgeHtml` executed in Node over the boundary cases (1–5 low,
0 out, 6+ and unknown hidden), diff discipline (additive everywhere
except the 4 intended seed stock changes), plus a live flow: the API
reports the seeded low stocks (3/2/4/0), checkout decrements the
low-stock product 3 -> 2, and the out-of-stock product still lists
with stock 0.
