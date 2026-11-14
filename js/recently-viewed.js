/* =========================================
   RECENTLY VIEWED PRODUCTS
   =========================================
   A "Recently viewed" strip for shop.html and product-details.html,
   backed by localStorage only — no API calls, so it works fully
   offline (GitHub Pages, plain files, backend down).

   - Every product-details visit is recorded (see loadProductDetails
     in js/main.js, which calls RecentlyViewed.record()).
   - At most 8 products, most recent first; re-viewing a product moves
     it to the front instead of duplicating it.
   - The strip renders into #recentlyViewedGrid with the same product
     cards as "You May Also Like" (createHomepageProductCard); the
     product currently being viewed is excluded, and the whole section
     hides itself when there is nothing to show yet.
   ========================================= */

(function () {

    var STORAGE_KEY = "shopease_recently_viewed";
    var MAX_ITEMS = 8;

    function readStored() {
        try {
            var items = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!Array.isArray(items)) {
                return [];
            }
            return items.filter(function (item) {
                return item && item.id != null && item.name;
            });
        } catch (e) {
            return [];
        }
    }

    function record(product) {
        if (!product || product.id == null) {
            return;
        }
        var entry = {
            id: Number(product.id),
            name: String(product.name || ""),
            price: Number(product.price || 0),
            image: product.image || product.image_url || "",
            category: String(product.category || product.categorySlug || "")
        };
        var items = readStored().filter(function (item) {
            return Number(item.id) !== entry.id;
        });
        items.unshift(entry);
        try {
            localStorage.setItem(
                STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
        } catch (e) {
            // Storage full or unavailable: recently viewed is best-effort.
        }
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function cardHtml(item) {
        // Same cards as the rest of the storefront when available.
        if (typeof createHomepageProductCard === "function") {
            return createHomepageProductCard(item);
        }
        var image = (typeof getProductImage === "function")
            ? getProductImage(item)
            : (item.image || "");
        var price = "₹" + Number(item.price || 0).toLocaleString("en-IN");
        return '<div class="product-card" data-product-id="' + item.id + '"'
            + ' onclick="openProduct(' + item.id + ')">'
            + '<div class="product-image"><img src="' + escapeHtml(image)
            + '" alt="' + escapeHtml(item.name)
            + '" loading="lazy"></div>'
            + '<div class="product-info"><h3>' + escapeHtml(item.name)
            + '</h3><div class="product-price">' + price
            + '</div></div></div>';
    }

    function render(containerId) {
        var container = document.getElementById(containerId);
        if (!container) {
            return 0;
        }
        var section = container.closest
            ? container.closest("section")
            : null;
        // On product-details.html the product being viewed is excluded
        // (it was just recorded by loadProductDetails).
        var params = new URLSearchParams(window.location.search);
        var currentId = Number(params.get("id")) || null;
        var items = readStored().filter(function (item) {
            return currentId === null || Number(item.id) !== currentId;
        });
        if (!items.length) {
            if (section) {
                section.style.display = "none";
            }
            container.innerHTML = "";
            return 0;
        }
        if (section) {
            section.style.display = "";
        }
        container.innerHTML = items.map(cardHtml).join("");
        return items.length;
    }

    document.addEventListener("DOMContentLoaded", function () {
        render("recentlyViewedGrid");
    });

    window.RecentlyViewed = {
        record: record,
        get: readStored,
        render: render,
        MAX_ITEMS: MAX_ITEMS
    };

})();
