/**
 * ShopEase Product Comparison Tool
 * ==================================
 * Side-by-side comparison of up to 3 products. Frontend-only, uses the
 * existing ShopEaseAPI / LocalStore product data. No backend changes.
 *
 * Usage:
 *   1. Add a "Compare" checkbox/button on product cards:
 *      <button onclick="CompareTool.toggle(123)">Compare</button>
 *   2. Include the compare bar markup (auto-injected if missing).
 *   3. Call CompareTool.show() to open the comparison modal.
 *
 * The compare bar appears at the bottom when 1+ products are selected.
 * Click "Compare Now" to see the side-by-side table.
 */

const CompareTool = {
  KEY: "shopease_compare",
  MAX: 3,

  _ids() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || "[]");
    } catch (e) {
      return [];
    }
  },

  _save(ids) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(ids));
    } catch (e) { /* ignore */ }
  },

  getIds() { return this._ids(); },
  count() { return this._ids().length; },
  has(id) { return this._ids().includes(Number(id)); },

  toggle(id) {
    id = Number(id);
    let ids = this._ids();
    if (ids.includes(id)) {
      ids = ids.filter((i) => i !== id);
    } else {
      if (ids.length >= this.MAX) {
        this.toast(`You can compare up to ${this.MAX} products. Remove one first.`);
        return false;
      }
      ids.push(id);
    }
    this._save(ids);
    this.renderBar();
    this._updateButtons();
    return true;
  },

  clear() {
    this._save([]);
    this.renderBar();
    this._updateButtons();
    this.hideModal();
  },

  remove(id) {
    this._save(this._ids().filter((i) => i !== Number(id)));
    this.renderBar();
    this._updateButtons();
    if (this.count() < 2) this.hideModal();
    else this.show(true); // refresh table
  },

  /** Update all compare toggle buttons on the page */
  _updateButtons() {
    document.querySelectorAll("[data-compare-id]").forEach((btn) => {
      const id = Number(btn.dataset.compareId);
      const active = this.has(id);
      btn.classList.toggle("active", active);
      const label = btn.querySelector(".compare-label");
      if (label) label.textContent = active ? "Added ✓" : "Compare";
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  },

  /** Bottom bar showing selected products */
  renderBar() {
    let bar = document.getElementById("compareBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "compareBar";
      bar.className = "se-compare-bar";
      document.body.appendChild(bar);
    }
    const ids = this._ids();
    if (ids.length === 0) {
      bar.classList.remove("show");
      bar.innerHTML = "";
      return;
    }
    bar.classList.add("show");
    bar.innerHTML = `
      <div class="se-container se-flex se-items-center se-justify-between se-gap-4">
        <div class="se-flex se-items-center se-gap-2">
          <strong>Compare (${ids.length}/${this.MAX})</strong>
          <span class="se-text-sm se-text-muted">Select up to ${this.MAX} products</span>
        </div>
        <div class="se-flex se-gap-2">
          <button class="se-btn se-btn-outline se-btn-sm" onclick="CompareTool.clear()">Clear</button>
          <button class="se-btn se-btn-primary se-btn-sm" onclick="CompareTool.show()"
            ${ids.length < 2 ? "disabled" : ""}>
            Compare Now
          </button>
        </div>
      </div>`;
  },

  /** Fetch product details for compared IDs */
  async _getProducts() {
    const ids = this._ids();
    const out = [];
    for (const id of ids) {
      try {
        const p = await ShopEaseAPI.getProduct(id);
        if (p) out.push(p);
      } catch (e) { /* skip */ }
    }
    return out;
  },

  _stars(rating) {
    if (!rating) return "—";
    const full = Math.round(Number(rating));
    return "★".repeat(Math.min(full, 5)) + "☆".repeat(5 - Math.min(full, 5));
  },

  /** Show the comparison modal table */
  async show(refresh = false) {
    const ids = this._ids();
    if (ids.length < 2) {
      this.toast("Select at least 2 products to compare.");
      return;
    }
    let modal = document.getElementById("compareModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "compareModal";
      modal.style.cssText = `
        position:fixed; inset:0; z-index:1000; display:flex;
        align-items:center; justify-content:center; padding:1rem;
        background:rgba(15,23,42,0.6);`;
      modal.innerHTML = `
        <div style="background:#fff; border-radius:14px; max-width:900px; width:100%;
                    max-height:90vh; overflow:auto; padding:1.5rem; position:relative;">
          <button onclick="CompareTool.hideModal()"
            style="position:absolute; top:1rem; right:1rem; width:40px; height:40px;
                   border-radius:50%; border:1px solid #e2e8f0; background:#fff;
                   font-size:1.2rem; cursor:pointer;" aria-label="Close">×</button>
          <h3 class="se-h3">Product Comparison</h3>
          <div id="compareTableWrap"><p class="se-text-muted">Loading…</p></div>
        </div>`;
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hideModal();
      });
      document.body.appendChild(modal);
    }
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    const wrap = document.getElementById("compareTableWrap");
    const products = await this._getProducts();
    if (products.length < 2) {
      wrap.innerHTML = '<p class="se-text-muted">Could not load product details.</p>';
      return;
    }

    const row = (label, fn) => `
      <tr><th>${label}</th>${products.map((p) => `<td>${fn(p)}</td>`).join("")}</tr>`;

    const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

    wrap.innerHTML = `
      <div style="overflow-x:auto;">
      <table class="se-compare-table">
        <tr><th></th>${products.map((p) => `
          <td style="text-align:center;">
            <img src="${p.image_url || "assets/images/products/placeholder.jpg"}"
                 alt="${p.name}" loading="lazy"
                 style="width:120px; height:120px; object-fit:cover; border-radius:10px; margin:0 auto 8px;">
            <div style="font-weight:700;">${p.name}</div>
            <button class="se-btn se-btn-ghost se-btn-sm" onclick="CompareTool.remove(${p.id})">Remove</button>
          </td>`).join("")}
        </tr>
        ${row("Price", (p) => `<strong style="font-size:1.1rem;">${money(p.price)}</strong>`)}
        ${row("Rating", (p) => `<span class="se-stars">${this._stars(p.average_rating)}</span> <small>(${p.review_count || 0})</small>`)}
        ${row("Category", (p) => p.category || "—")}
        ${row("Brand", (p) => p.brand || "—")}
        ${row("Stock", (p) => p.stock > 0 ? `<span style="color:#16a34a;">In stock (${p.stock})</span>` : `<span style="color:#dc2626;">Out of stock</span>`)}
        ${row("Description", (p) => (p.description || "—").slice(0, 120))}
        <tr><th></th>${products.map((p) => `
          <td><button class="se-btn se-btn-primary se-btn-sm se-btn-block"
            onclick="ShopEaseAPI.addToCart(${p.id},1).then(()=>{CompareTool.toast('Added to cart');}).catch(e=>CompareTool.toast(e.message))">
            Add to Cart</button></td>`).join("")}
        </tr>
      </table>
      </div>`;
  },

  hideModal() {
    const modal = document.getElementById("compareModal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
  },

  toast(msg) {
    let t = document.getElementById("seToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "seToast";
      t.className = "se-toast";
      t.innerHTML = '<span id="seToastMsg"></span>';
      document.body.appendChild(t);
    }
    document.getElementById("seToastMsg").textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  },
};

// Init compare bar on every page
document.addEventListener("DOMContentLoaded", () => {
  CompareTool.renderBar();
  CompareTool._updateButtons();
});
