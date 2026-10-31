# INTEGRATION — wiring `js/api.js` into the existing pages

No HTML file was changed in this upgrade. `js/api.js` is a new, dependency-free
file that adds:

- `ShopEaseAPI` — async wrapper for every backend endpoint (products, auth,
  cart, orders), with automatic `localStorage` fallback when the backend is
  unreachable, so pages keep working offline / on GitHub Pages.
- `ShopEaseAuth` — login/register form wiring + nav auth-state helpers,
  backed by the real API (the existing `js/auth.js` is a localStorage demo and
  is left untouched).
- `formatINR(amount)` — `₹` formatting helper.
- `LocalStore` — the offline cart/product cache (used automatically).

## The one-line change (per page)

Add this script tag to each HTML page, **before** the page's own scripts
(`js/main.js`, `js/cart.js`, etc.) so the `ShopEaseAPI` global exists when
they run. Recommended placement: right after `<script src="js/products.js">`
(or as the first script if a page has none):

```html
<script src="js/api.js"></script>
```

For `categories.html`, which uses cache-busting query strings, use the same
pattern: `<script src="js/api.js?v=20260911"></script>`.

## Per-page checklist

| Page | Existing scripts | Add | Notes |
|------|------------------|-----|-------|
| `index.html` | products.js, main.js | `<script src="js/api.js"></script>` | Enables live product list via `ShopEaseAPI.getProducts()` |
| `shop.html` | products.js, main.js, search.js, filters.js | `<script src="js/api.js"></script>` | `?category=` / `?search=` map to the API query params |
| `product-details.html` | products.js, main.js | `<script src="js/api.js"></script>` | Use `ShopEaseAPI.getProduct(id)` |
| `categories.html` | products.js?v=…, main.js?v=…, categories.js?v=… | `<script src="js/api.js?v=20260911"></script>` | Same version suffix as the other tags |
| `cart.html` | products.js, main.js, cart.js | `<script src="js/api.js"></script>` | `ShopEaseAPI.getCart()/updateCartItem()/removeCartItem()` work logged-in or offline |
| `checkout.html` | products.js, main.js, checkout.js | `<script src="js/api.js"></script>` | Call `ShopEaseAuth.requireLogin()` on load, then `ShopEaseAPI.checkout()` |
| `order-success.html` | products.js, main.js | `<script src="js/api.js"></script>` | Optional: show the created order via `ShopEaseAPI.getOrder(id)` |
| `my-orders.html` | products.js, main.js | `<script src="js/api.js"></script>` | `ShopEaseAuth.requireLogin()` + `ShopEaseAPI.getOrders()` |
| `login.html` | products.js, main.js, auth.js | `<script src="js/api.js"></script>` | Add `ShopEaseAuth.wireLoginForm("loginForm")` in a small inline script, or call it from the console-tested snippet below |
| `register.html` | products.js, main.js, auth.js | `<script src="js/api.js"></script>` | Add `ShopEaseAuth.wireRegisterForm("registerForm")` |
| `forgot-password.html` | products.js, main.js, auth.js | `<script src="js/api.js"></script>` | Optional — no backend endpoint yet |
| `profile.html` | products.js, main.js | `<script src="js/api.js"></script>` | `ShopEaseAuth.requireLogin()`; fill name/email from `ShopEaseAPI.user` |
| `wishlist.html` | products.js, main.js, wishlist.js | `<script src="js/api.js"></script>` | Optional — wishlist stays local-only for now |
| `about.html`, `contact.html`, `faq.html`, `privacy-policy.html`, `terms.html` | products.js, main.js | `<script src="js/api.js"></script>` | Optional — enables `ShopEaseAuth.refreshNav()` for login-aware nav |

## Suggested nav upgrade (optional, no backend needed)

To make the navbar show "Hi, \<name\>" / Logout when signed in, add these
attributes to the existing markup (still no JS changes required):

```html
<a href="login.html" data-auth="guest">Login</a>
<span data-auth="user" style="display:none">Hi, <b data-auth-name></b></span>
<a href="#" data-auth="user" data-action="logout" style="display:none">Logout</a>
```

`ShopEaseAuth.refreshNav()` (auto-run on `DOMContentLoaded` once `js/api.js`
is loaded) toggles them.

## Minimal wiring snippets

```html
<!-- login.html: after the existing scripts -->
<script>
  ShopEaseAuth.wireLoginForm("loginForm");
</script>

<!-- register.html: after the existing scripts -->
<script>
  ShopEaseAuth.wireRegisterForm("registerForm");
</script>

<!-- checkout.html / my-orders.html: guard the page -->
<script>
  ShopEaseAuth.requireLogin("login.html?redirect=" + location.pathname.split("/").pop());
</script>
```

## API_BASE behaviour

- Page served from `http://localhost:8000/` (via `python3 backend/app.py`) →
  API calls go to `http://localhost:8000/api/...`.
- Page on any other host (e.g. GitHub Pages) → relative `/api/...` URLs;
  when those fail, `ShopEaseAPI` silently uses the `localStorage` fallback.

## What was deliberately NOT changed

- All existing HTML, CSS and JS files are byte-identical to the original repo.
- `js/auth.js` (localStorage demo auth) is untouched; `ShopEaseAuth` in
  `js/api.js` is the API-backed alternative.
- Product data in `js/products.js` is untouched; the backend seed uses the
  same 12-product shape with real image paths from `assets/images/products/`.
