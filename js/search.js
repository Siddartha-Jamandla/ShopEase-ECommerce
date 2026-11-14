/* =====================================================
   SHOPEASE - SEARCH
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchSubmit =
            document.getElementById(
                "searchSubmit"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (
            !searchSubmit ||
            !searchInput
        ) {
            return;
        }


        searchSubmit.addEventListener(
            "click",
            function () {

                searchProducts();

            }
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    searchProducts();

                }

            }
        );


        searchInput.addEventListener(
            "input",
            function () {

                scheduleSuggestions(searchInput);

            }
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    hideSuggestions();

                }

            }
        );


        document.addEventListener(
            "click",
            function (event) {

                if (
                    !event.target.closest(
                        ".search-suggestions"
                    ) &&
                    event.target !== searchInput
                ) {

                    hideSuggestions();

                }

            }
        );

    }
);


/* =====================================================
   SEARCH PRODUCTS
===================================================== */

function searchProducts() {

    const input =
        document.getElementById(
            "searchInput"
        );


    if (!input) {
        return;
    }


    const query =
        input.value.trim();


    if (!query) {

        showToast(
            "Please enter a search term"
        );

        return;
    }


    window.location.href =
        `shop.html?search=${encodeURIComponent(query)}`;

}


/* =====================================================
   SEARCH SUGGESTIONS (autocomplete)
===================================================== */

let suggestionTimer = null;


/* One self-contained <style> for the dropdown (no HTML edit needed). */
function ensureSuggestionStyles() {

    if (document.getElementById("search-suggestions-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "search-suggestions-style";
    style.textContent = `
        .search-suggestions {
            position: absolute;
            left: 0;
            right: 0;
            top: calc(100% + 6px);
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
            z-index: 1200;
            overflow: hidden;
        }
        .search-suggestions a {
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 9px 12px;
            text-decoration: none;
            color: #111827;
        }
        .search-suggestions a:hover {
            background: #f3f4f6;
        }
        .search-suggestions img {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
        }
        .search-suggestions .sugg-name {
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .search-suggestions .sugg-meta {
            font-size: 12px;
            color: #6b7280;
        }
        .search-suggestions .sugg-price {
            margin-left: auto;
            font-size: 14px;
            font-weight: 700;
            white-space: nowrap;
        }
        .search-suggestions .sugg-empty {
            padding: 12px;
            font-size: 14px;
            color: #6b7280;
        }
    `;
    document.head.appendChild(style);
}


function hideSuggestions() {

    const box = document.querySelector(".search-suggestions");

    if (box) {
        box.remove();
    }
}


function scheduleSuggestions(input) {

    clearTimeout(suggestionTimer);

    const q = input.value.trim();

    if (q.length < 2) {
        hideSuggestions();
        return;
    }

    suggestionTimer = setTimeout(function () {
        loadSuggestions(input, q);
    }, 200);
}


async function loadSuggestions(input, q) {

    let items = [];

    try {

        if (
            typeof ShopEaseAPI !== "undefined" &&
            typeof ShopEaseAPI.suggestProducts === "function"
        ) {
            items = await ShopEaseAPI.suggestProducts(q, 5);
        }

    } catch (e) {

        // Backend down or slow: no dropdown, plain search still works.
        hideSuggestions();
        return;
    }

    showSuggestions(input, items);
}


function showSuggestions(input, items) {

    hideSuggestions();
    ensureSuggestionStyles();

    const wrap = input.closest(".search-box, .search-bar, form") || input.parentElement;

    if (!wrap) {
        return;
    }

    if (getComputedStyle(wrap).position === "static") {
        wrap.style.position = "relative";
    }

    const box = document.createElement("div");
    box.className = "search-suggestions";

    if (!items.length) {
        box.innerHTML = '<div class="sugg-empty">No products match yet — press Enter to search.</div>';
    } else {
        box.innerHTML = items.map(function (p) {
            const img = (p.image_url || "").startsWith("assets/")
                ? p.image_url
                : "assets/images/products/placeholder.jpg";
            const price = (typeof formatPrice === "function")
                ? formatPrice(p.price)
                : ("₹" + p.price);
            return '<a href="product-details.html?id=' + p.id + '">' +
                '<img src="' + img + '" alt="" loading="lazy">' +
                '<span><span class="sugg-name">' + escapeHtml(p.name) + '</span><br>' +
                '<span class="sugg-meta">' + escapeHtml(p.category || "") +
                (p.stock <= 0 ? ' · Out of stock' : '') + '</span></span>' +
                '<span class="sugg-price">' + price + '</span></a>';
        }).join("");
    }

    wrap.appendChild(box);
}


function escapeHtml(text) {

    return String(text == null ? "" : text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
