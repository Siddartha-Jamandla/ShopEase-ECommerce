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
