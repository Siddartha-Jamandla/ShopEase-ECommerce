/**
 * ShopEase API client (vanilla JS, no dependencies)
 * =================================================
 * Talks to the Python backend when it is reachable; otherwise falls back
 * to a localStorage-backed store so every static page keeps working
 * offline (deployed on GitHub Pages, or opened as plain files).
 *
 * API_BASE detection:
 *   - local dev (backend running): http://localhost:8000
 *   - deployed / same origin:      '' (relative URLs)
 */

// Base URL: localhost:8000 in dev, same-origin when deployed.
const API_BASE = (() => {
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8000";
  return "";
})();

const TOKEN_KEY = "shopease_token";
const USER_KEY = "shopease_user";

const ShopEaseAPI = {
  // ---------------------------------------------------------- low level
  get token() {
    return localStorage.getItem(TOKEN_KEY);
  },
  set token(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  },
  get user() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch (e) {
      return null;
    }
  },
  set user(u) {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  },
  get isLoggedIn() {
    return !!this.token;
  },

  async _request(method, path, body, opts = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = "Bearer " + this.token;
    if (opts.adminKey) headers["X-Admin-Key"] = opts.adminKey;
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let payload = null;
    try {
      payload = await res.json();
    } catch (e) {
      throw new Error("Server returned a non-JSON response");
    }
    if (!res.ok || payload.ok === false) {
      throw new Error((payload && payload.error) || ("Request failed (" + res.status + ")"));
    }
    return payload.data;
  },

  /** True when the backend answers /api/health within the timeout. */
  async isBackendUp(timeoutMs = 1500) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(API_BASE + "/api/health", { signal: ctrl.signal });
      clearTimeout(timer);
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // ---------------------------------------------------------- products
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      const data = await this._request("GET", "/api/products" + (qs ? "?" + qs : ""));
      // Paginated responses are objects ({items, page, per_page, total,
      // total_pages}); plain requests still return the product array.
      const items = Array.isArray(data) ? data : data.items || [];
      LocalStore.cacheProducts(items); // keep offline copy fresh
      return data;
    } catch (e) {
      return LocalStore.getProducts(params); // offline fallback
    }
  },

  async getProduct(id) {
    try {
      return await this._request("GET", "/api/products/" + id);
    } catch (e) {
      return LocalStore.getProduct(id);
    }
  },

  async createProduct(product, adminKey) {
    return this._request("POST", "/api/products", product, { adminKey });
  },

  async updateProduct(id, fields, adminKey) {
    return this._request("PUT", "/api/products/" + id, fields, { adminKey });
  },

  async deleteProduct(id, adminKey) {
    return this._request("DELETE", "/api/products/" + id, undefined, { adminKey });
  },

  // ---------------------------------------------------------- profile
  async getProfile() {
    return this._request("GET", "/api/me");
  },

  async updateProfile(fields) {
    return this._request("PUT", "/api/me", fields);
  },

  async changePassword(currentPassword, newPassword) {
    return this._request("POST", "/api/me/change-password",
      { current_password: currentPassword, new_password: newPassword });
  },

  // ---------------------------------------------------------- auth
  async register(name, email, password) {
    const data = await this._request("POST", "/api/register", { name, email, password });
    this.token = data.token;
    this.user = data.user;
    return data;
  },

  async login(email, password) {
    const data = await this._request("POST", "/api/login", { email, password });
    this.token = data.token;
    this.user = data.user;
    return data;
  },

  logout() {
    this.token = null;
    this.user = null;
    window.location.href = "index.html";
  },

  // ---------------------------------------------------------- reviews
  async getReviews(productId, params = {}) {
    const qs = new URLSearchParams(params).toString();
    try {
      return await this._request(
        "GET",
        "/api/products/" + productId + "/reviews" + (qs ? "?" + qs : "")
      );
    } catch (e) {
      return { items: [], page: 1, per_page: 20, total: 0, total_pages: 0, average_rating: null };
    }
  },

  async addReview(productId, review) {
    if (!this.isLoggedIn) throw new Error("Please log in to write a review");
    return this._request("POST", "/api/products/" + productId + "/reviews", review);
  },

  async updateReview(productId, review) {
    if (!this.isLoggedIn) throw new Error("Please log in to edit your review");
    return this._request("PUT", "/api/products/" + productId + "/reviews", review);
  },

  async deleteReview(productId) {
    if (!this.isLoggedIn) throw new Error("Please log in to delete your review");
    return this._request("DELETE", "/api/products/" + productId + "/reviews");
  },

  // ---------------------------------------------------------- cart
  async getCart() {
    if (this.isLoggedIn) {
      try {
        return await this._request("GET", "/api/cart");
      } catch (e) {
        /* fall through to local cart */
      }
    }
    return LocalStore.getCart();
  },

  async addToCart(productId, quantity = 1) {
    if (this.isLoggedIn) {
      try {
        return await this._request("POST", "/api/cart", {
          product_id: productId,
          quantity,
        });
      } catch (e) {
        /* fall through to local cart */
      }
    }
    return LocalStore.addToCart(productId, quantity);
  },

  async updateCartItem(itemId, quantity) {
    if (this.isLoggedIn) {
      try {
        return await this._request("PUT", "/api/cart/" + itemId, { quantity });
      } catch (e) {
        /* fall through */
      }
    }
    return LocalStore.updateCartItem(itemId, quantity);
  },

  async removeCartItem(itemId) {
    if (this.isLoggedIn) {
      try {
        return await this._request("DELETE", "/api/cart/" + itemId);
      } catch (e) {
        /* fall through */
      }
    }
    return LocalStore.removeCartItem(itemId);
  },

  // ---------------------------------------------------------- orders
  /** Promo code held for the next checkout (set with applyPromo). The
   *  server validates it at checkout time and rejects the order with a
   *  clear 400 when the code is unknown, expired, fully used, or the
   *  subtotal is below its minimum. */
  _pendingPromoCode: null,

  /** Remember a promo code for the next checkout. Returns the code
   *  (upper-cased); the discount itself is applied server-side. */
  applyPromo(code) {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) throw new Error("Please enter a promo code");
    this._pendingPromoCode = clean;
    return clean;
  },

  clearPromo() {
    this._pendingPromoCode = null;
  },

  /** options: {promoCode, addressId} — a promo code and/or a saved
   *  address (see getAddresses) to ship to. */
  async checkout(shipping = null, items = null, options = {}) {
    if (!this.isLoggedIn) throw new Error("Please log in to place an order");
    const body = {};
    if (shipping) body.shipping = shipping; // {name, address, city, state, pincode, phone}
    if (items) body.items = items; // [{product_id, quantity}] — prices snapshotted server-side
    const promoCode = options.promoCode || this._pendingPromoCode;
    if (promoCode) body.promo_code = promoCode;
    if (options.addressId) body.address_id = options.addressId;
    const order = await this._request("POST", "/api/checkout", body);
    LocalStore.clearCart(); // local cart is obsolete after a real order
    this._pendingPromoCode = null; // a code is spent once the order lands
    return order;
  },

  /** List your orders, newest first. Optional params: {status:
   *  'placed'|'shipped'|'delivered'|'cancelled', page, per_page (max 50)}.
   *  Plain call returns the order array; with any param it returns the
   *  paginated object {items, page, per_page, total, total_pages}. */
  async getOrders(params = {}) {
    if (!this.isLoggedIn) return [];
    const qs = new URLSearchParams(params).toString();
    try {
      return await this._request("GET", "/api/orders" + (qs ? "?" + qs : ""));
    } catch (e) {
      return [];
    }
  },

  async getOrder(id) {
    if (!this.isLoggedIn) throw new Error("Please log in to view orders");
    return this._request("GET", "/api/orders/" + id);
  },

  /** Admin: move an order to its next status (placed → shipped → delivered,
   *  or placed → cancelled). Returns the updated order. */
  async updateOrderStatus(id, status, adminKey) {
    return this._request("PUT", "/api/admin/orders/" + id + "/status",
      { status }, { adminKey });
  },

  // ---------------------------------------------------------- promo codes
  /** Admin: create a promo code {code, discount_percent (1-90),
   *  min_order_amount?, expires_at? (YYYY-MM-DD or ISO), max_uses?}. */
  async createPromoCode(promo, adminKey) {
    return this._request("POST", "/api/admin/promo-codes", promo, { adminKey });
  },

  /** Admin: list all promo codes, newest first. */
  async listPromoCodes(adminKey) {
    return this._request("GET", "/api/admin/promo-codes", undefined, { adminKey });
  },

  // ---------------------------------------------------------- admin orders
  /** Admin: list every order, newest first. Optional params: {status:
   *  'placed'|'shipped'|'delivered'|'cancelled', page, per_page (max 50)}.
   *  Always returns {items, page, per_page, total, total_pages}; each
   *  item has user_email, items_count, total and the shipping snapshot. */
  async adminListOrders(params = {}, key) {
    const qs = new URLSearchParams(params).toString();
    return this._request("GET", "/api/admin/orders" + (qs ? "?" + qs : ""),
      undefined, { adminKey: key });
  },

  // ---------------------------------------------------------- saved addresses
  /** Your saved shipping addresses (default first, then newest first). */
  async getAddresses() {
    if (!this.isLoggedIn) throw new Error("Please log in to view addresses");
    return this._request("GET", "/api/addresses");
  },

  /** Save an address {label, full_name, address_line1, address_line2?,
   *  city, state, pincode, is_default?}. Your first address becomes the
   *  default automatically; setting is_default clears your other defaults. */
  async addAddress(address) {
    if (!this.isLoggedIn) throw new Error("Please log in to save addresses");
    return this._request("POST", "/api/addresses", address);
  },

  /** Delete one of your saved addresses. Deleting the default promotes
   *  your oldest remaining address to default. */
  async deleteAddress(id) {
    if (!this.isLoggedIn) throw new Error("Please log in to manage addresses");
    return this._request("DELETE", "/api/addresses/" + id);
  },

  // ---------------------------------------------------------- wishlist
  /**
   * Wishlist items: [{id, product_id, added_at, name, description, price,
   * category, image_url, stock, average_rating, review_count}].
   * Logged-in users get the backend list (local copy is synced as a mirror);
   * guests get the localStorage copy only.
   */
  async getWishlist() {
    if (this.isLoggedIn) {
      try {
        const items = await this._request("GET", "/api/wishlist");
        LocalStore.syncWishlistIds(items.map((i) => i.product_id));
        return items;
      } catch (e) {
        /* fall through to local copy */
      }
    }
    return LocalStore.getWishlist();
  },

  async addToWishlist(productId) {
    productId = Number(productId);
    if (this.isLoggedIn) {
      try {
        const res = await this._request("POST", "/api/wishlist", {
          product_id: productId,
        });
        LocalStore.addWishlistId(productId);
        return res;
      } catch (e) {
        /* fall through to local copy */
      }
    }
    LocalStore.addWishlistId(productId);
    return { added: true, product_id: productId };
  },

  async removeFromWishlist(productId) {
    productId = Number(productId);
    if (this.isLoggedIn) {
      try {
        const res = await this._request("DELETE", "/api/wishlist/" + productId);
        LocalStore.removeWishlistId(productId);
        return res;
      } catch (e) {
        /* fall through to local copy */
      }
    }
    LocalStore.removeWishlistId(productId);
    return { deleted: true, product_id: productId };
  },

  /** Pull the server wishlist into the local mirror (called on page load). */
  async syncWishlist() {
    if (!this.isLoggedIn) return;
    try {
      const items = await this._request("GET", "/api/wishlist");
      LocalStore.syncWishlistIds(items.map((i) => i.product_id));
    } catch (e) {
      /* keep the local copy */
    }
  },
};

// ---------------------------------------------------------------------------
// LocalStore: offline fallback (localStorage) mirroring the API shape.
// Keeps the existing static pages fully functional without the backend.
// ---------------------------------------------------------------------------
const LocalStore = {
  PRODUCTS_KEY: "shopease_products",
  CART_KEY: "shopease_cart",
  WISHLIST_KEY: "wishlist", // shared with js/products.js + js/wishlist.js

  _defaultProducts() {
    // 12 products matching backend/seed.py (offline copy)
    const p = (id, name, price, category, stock, image, description) => ({
      id, name, description, price, category,
      image_url: image, stock, created_at: "",
    });
    const IMG = "assets/images/products/";
    const PH = IMG + "placeholder.jpg";
    return [
      p(1, "Men's Oversized Graphic T-Shirt", 899, "fashion", 120, IMG + "mens-oversized-tshirt.jpg", "Premium cotton oversized t-shirt."),
      p(2, "Classic Denim Jacket", 1899, "fashion", 80, IMG + "classic-denim-jacket.jpg", "Classic blue denim jacket."),
      p(3, "Slim Fit Casual Shirt", 1199, "fashion", 95, IMG + "slim-fit-shirt.jpg", "Comfortable slim-fit shirt."),
      p(4, "Genuine Leather Wallet", 899, "fashion", 150, IMG + "leather-wallet.jpg", "Genuine leather bifold wallet."),
      p(5, "Ceramic Dinner Set (18 pcs)", 1999, "home", 40, PH, "Elegant 18-piece ceramic dinner set."),
      p(6, "LED Table Lamp", 749, "home", 90, PH, "Touch-control LED desk lamp."),
      p(7, "Cotton Bedsheet (King)", 999, "home", 70, PH, "220 TC pure cotton king-size bedsheet."),
      p(8, "Stainless Steel Water Bottle 1L", 649, "home", 200, PH, "Double-wall vacuum insulated bottle."),
      p(9, "Wireless Bluetooth Earbuds", 1799, "electronics", 110, PH, "True wireless earbuds, 40-hr battery."),
      p(10, "Smart Fitness Band", 2499, "electronics", 75, PH, "Heart-rate & SpO2 tracking fitness band."),
      p(11, "Portable Bluetooth Speaker", 1599, "electronics", 65, PH, "Compact speaker, 18-hour playtime."),
      p(12, "USB-C Fast Charger 65W", 1299, "electronics", 130, PH, "65W GaN fast charger."),
    ];
  },

  cacheProducts(products) {
    try {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) { /* storage full / unavailable */ }
  },

  getProducts(params = {}) {
    let list;
    try {
      list = JSON.parse(localStorage.getItem(this.PRODUCTS_KEY) || "null") || this._defaultProducts();
    } catch (e) {
      list = this._defaultProducts();
    }
    if (params.category) list = list.filter((x) => x.category === params.category);
    const s = String(params.q || params.search || "").toLowerCase();
    if (s) {
      list = list.filter((x) =>
        (x.name + " " + x.description).toLowerCase().includes(s));
    }
    const sortFns = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      name_asc: (a, b) => String(a.name).localeCompare(String(b.name)),
      name_desc: (a, b) => String(b.name).localeCompare(String(a.name)),
      newest: (a, b) => b.id - a.id,
    };
    if (sortFns[params.sort]) list = [...list].sort(sortFns[params.sort]);
    return list;
  },

  getProduct(id) {
    return this.getProducts().find((x) => String(x.id) === String(id)) || null;
  },

  _readCart() {
    try {
      return JSON.parse(localStorage.getItem(this.CART_KEY) || "[]");
    } catch (e) {
      return [];
    }
  },
  _writeCart(items) {
    try {
      localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    } catch (e) { /* ignore */ }
  },

  /** Cart shape mirrors the API: {items:[{id, product_id, quantity, name, price, image_url}], total, count} */
  getCart() {
    const raw = this._readCart();
    const items = raw
      .map((r) => {
        const prod = this.getProduct(r.product_id);
        if (!prod) return null;
        return {
          id: "local-" + r.product_id,
          product_id: prod.id,
          quantity: r.quantity,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          category: prod.category,
          image_url: prod.image_url,
          stock: prod.stock,
        };
      })
      .filter(Boolean);
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, total: Math.round(total * 100) / 100, count: items.length };
  },

  addToCart(productId, quantity = 1) {
    const raw = this._readCart();
    const found = raw.find((r) => String(r.product_id) === String(productId));
    if (found) found.quantity += quantity;
    else raw.push({ product_id: Number(productId), quantity });
    this._writeCart(raw);
    return this.getCart();
  },

  updateCartItem(itemId, quantity) {
    const pid = String(itemId).replace("local-", "");
    let raw = this._readCart();
    if (quantity <= 0) raw = raw.filter((r) => String(r.product_id) !== pid);
    else raw = raw.map((r) =>
      String(r.product_id) === pid ? { ...r, quantity } : r);
    this._writeCart(raw);
    return this.getCart();
  },

  removeCartItem(itemId) {
    const pid = String(itemId).replace("local-", "");
    this._writeCart(this._readCart().filter((r) => String(r.product_id) !== pid));
    return { deleted: true };
  },

  clearCart() {
    this._writeCart([]);
  },

  // -- wishlist local mirror (same "wishlist" key as js/wishlist.js) --------
  _wishlistIds() {
    try {
      const ids = JSON.parse(localStorage.getItem(this.WISHLIST_KEY) || "[]") || [];
      return [...new Set(ids.map((i) => Number(typeof i === "object" ? i.id : i)).filter((i) => !Number.isNaN(i)))];
    } catch (e) {
      return [];
    }
  },

  /** Guest wishlist as product objects (mirrors the API item shape). */
  getWishlist() {
    return this._wishlistIds()
      .map((id) => this.getProduct(id))
      .filter(Boolean)
      .map((p) => ({
        product_id: p.id,
        added_at: null,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image_url: p.image_url,
        stock: p.stock,
        average_rating: null,
        review_count: 0,
      }));
  },

  syncWishlistIds(ids) {
    try {
      localStorage.setItem(this.WISHLIST_KEY, JSON.stringify([...new Set(ids.map(Number))]));
    } catch (e) { /* ignore */ }
  },

  addWishlistId(id) {
    const ids = this._wishlistIds();
    if (!ids.includes(Number(id))) ids.push(Number(id));
    this.syncWishlistIds(ids);
  },

  removeWishlistId(id) {
    this.syncWishlistIds(this._wishlistIds().filter((i) => i !== Number(id)));
  },

  clearWishlist() {
    try {
      localStorage.removeItem(this.WISHLIST_KEY);
    } catch (e) { /* ignore */ }
  },
};

// Currency helper shared by pages: ₹ formatting.
function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* ============================================================================
 * ShopEaseAuth - login/register UI helpers wired to the backend API
 * ============================================================================
 * NOTE: the repo already ships js/auth.js (a localStorage-only demo) which is
 * left untouched. These helpers talk to the real backend via ShopEaseAPI and
 * can be used on login.html / register.html alongside or instead of it.
 *
 *   ShopEaseAuth.wireLoginForm("loginForm");       // login page
 *   ShopEaseAuth.wireRegisterForm("registerForm"); // register page
 *   ShopEaseAuth.refreshNav();                     // any page with auth links
 *
 * Nav markup (optional - all selectors are defensive):
 *   [data-auth="guest"]  shown when logged out
 *   [data-auth="user"]   shown when logged in
 *   [data-auth-name]     filled with the user's name
 *   [data-action="logout"] logs out on click
 */
const ShopEaseAuth = {
  _showMessage(text, isError = true) {
    const box =
      document.getElementById("auth-message") ||
      document.querySelector("[data-auth-message]");
    if (box) {
      box.textContent = text;
      box.style.display = "block";
      box.style.color = isError ? "#c0392b" : "#1e8449";
    } else if (isError) {
      alert(text);
    }
  },

  _setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = "Please wait...";
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
    }
  },

  wireLoginForm(formId = "loginForm") {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = ((form.querySelector("#email") || {}).value || "").trim();
      const password = (form.querySelector("#password") || {}).value || "";
      if (!email || !password) {
        this._showMessage("Please enter your email and password.");
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      this._setLoading(btn, true);
      try {
        const { user } = await ShopEaseAPI.login(email, password);
        this._showMessage("Welcome back, " + user.name + "!", false);
        setTimeout(() => {
          const redirect = new URLSearchParams(window.location.search).get("redirect");
          window.location.href = redirect || "index.html";
        }, 800);
      } catch (err) {
        this._showMessage(err.message || "Login failed. Please try again.");
      } finally {
        this._setLoading(btn, false);
      }
    });
  },

  wireRegisterForm(formId = "registerForm") {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = ((form.querySelector("#name") || {}).value || "").trim();
      const email = ((form.querySelector("#email") || {}).value || "").trim();
      const password = (form.querySelector("#password") || {}).value || "";
      const confirm = form.querySelector("#confirm-password") || form.querySelector("#confirmPassword");
      if (!name || !email || !password) {
        this._showMessage("Please fill in your name, email and password.");
        return;
      }
      if (password.length < 6) {
        this._showMessage("Password must be at least 6 characters.");
        return;
      }
      if (confirm && confirm.value !== password) {
        this._showMessage("Passwords do not match.");
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      this._setLoading(btn, true);
      try {
        const { user } = await ShopEaseAPI.register(name, email, password);
        this._showMessage("Account created. Welcome, " + user.name + "!", false);
        setTimeout(() => (window.location.href = "index.html"), 800);
      } catch (err) {
        this._showMessage(err.message || "Registration failed. Please try again.");
      } finally {
        this._setLoading(btn, false);
      }
    });
  },

  /** Show/hide nav elements based on login state; safe to call on any page. */
  refreshNav() {
    const loggedIn = ShopEaseAPI.isLoggedIn;
    document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
      el.style.display = loggedIn ? "none" : "";
    });
    document.querySelectorAll('[data-auth="user"]').forEach((el) => {
      el.style.display = loggedIn ? "" : "none";
    });
    const user = ShopEaseAPI.user;
    document.querySelectorAll("[data-auth-name]").forEach((el) => {
      el.textContent = user ? user.name : "";
    });
    document.querySelectorAll('[data-action="logout"]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        ShopEaseAPI.logout();
      });
    });
  },

  /** Redirect to login.html when not authenticated (checkout / orders pages). */
  requireLogin(redirectTo = "login.html") {
    if (!ShopEaseAPI.isLoggedIn) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
};

document.addEventListener("DOMContentLoaded", () => ShopEaseAuth.refreshNav());
