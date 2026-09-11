/* =========================================================
   ShopEase - Shop Filters
   Handles filtering and sorting on shop.html only.
========================================================= */

let filteredProducts = [];


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
           Only run this file on the Shop page.
        */

        const shopGrid =
            document.getElementById(
                "shopProductGrid"
            );


        if (!shopGrid) {
            return;
        }


        setupShopFilters();

        applyShopFilters();

    }
);


/* =========================================================
   SETUP FILTER EVENTS
========================================================= */

function setupShopFilters() {

    /*
       Category filters
    */

    document
        .querySelectorAll(
            '#categoryFilters input[type="checkbox"]'
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    function () {

                        /*
                           Once the user manually changes
                           category checkboxes, remove the
                           URL category restriction.
                        */

                        removeUrlCategoryFilter();

                        applyShopFilters();

                    }
                );

            }
        );


    /*
       Brand filters
    */

    document
        .querySelectorAll(
            '#brandFilters input[type="checkbox"]'
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    applyShopFilters
                );

            }
        );


    /*
       Rating filters
    */

    document
        .querySelectorAll(
            'input[name="rating"]'
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    applyShopFilters
                );

            }
        );


    /*
       Maximum price
    */

    const maxPrice =
        document.getElementById(
            "maxPrice"
        );


    if (maxPrice) {

        maxPrice.addEventListener(
            "input",
            applyShopFilters
        );

    }


    /*
       Sorting
    */

    const sort =
        document.getElementById(
            "sortProducts"
        );


    if (sort) {

        sort.addEventListener(
            "change",
            applyShopFilters
        );

    }


    /*
       Clear filters
    */

    const clearButton =
        document.getElementById(
            "clearFilters"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearAllFilters
        );

    }

}


/* =========================================================
   APPLY SHOP FILTERS
========================================================= */

function applyShopFilters() {

    /*
       Make sure products.js is loaded.
    */

    if (
        typeof products === "undefined" ||
        !Array.isArray(products)
    ) {

        console.error(
            "products.js could not be loaded."
        );

        return;

    }


    const url =
        new URL(
            window.location.href
        );


    /*
       URL search.
       Example:
       shop.html?search=shirt
    */

    const search =
        (
            url.searchParams.get(
                "search"
            ) || ""
        )
        .toLowerCase()
        .trim();


    /*
       URL category.
       Example:
       shop.html?category=men
    */

    const urlCategory =
        (
            url.searchParams.get(
                "category"
            ) || ""
        )
        .toLowerCase()
        .trim();


    /* =====================================================
       CATEGORY CHECKBOXES
    ===================================================== */

    const selectedCategories =
        Array.from(
            document.querySelectorAll(
                '#categoryFilters input[type="checkbox"]:checked'
            )
        )
        .map(
            function (input) {

                return String(
                    input.value
                )
                .toLowerCase()
                .trim();

            }
        );


    /* =====================================================
       BRAND CHECKBOXES
    ===================================================== */

    const selectedBrands =
        Array.from(
            document.querySelectorAll(
                '#brandFilters input[type="checkbox"]:checked'
            )
        )
        .map(
            function (input) {

                return String(
                    input.value
                )
                .toLowerCase()
                .trim();

            }
        );


    /* =====================================================
       MAXIMUM PRICE
    ===================================================== */

    const maxPriceElement =
        document.getElementById(
            "maxPrice"
        );


    const maxPrice =
        maxPriceElement
            ? Number(
                maxPriceElement.value || 5000
            )
            : 5000;


    /* =====================================================
       RATING
    ===================================================== */

    const selectedRating =
        document.querySelector(
            'input[name="rating"]:checked'
        );


    const minimumRating =
        selectedRating
            ? Number(
                selectedRating.value || 0
            )
            : 0;


    /* =====================================================
       FILTER PRODUCTS
    ===================================================== */

    filteredProducts =
        products.filter(
            function (product) {

                const productCategory =
                    String(
                        product.categorySlug || ""
                    )
                    .toLowerCase()
                    .trim();


                const productBrand =
                    String(
                        product.brand || ""
                    )
                    .toLowerCase()
                    .trim();


                const searchableText =
                    (
                        String(
                            product.name || ""
                        ) +

                        " " +

                        String(
                            product.category || ""
                        ) +

                        " " +

                        String(
                            product.brand || ""
                        ) +

                        " " +

                        String(
                            product.description || ""
                        )
                    )
                    .toLowerCase();


                /* -----------------------------------------
                   Search
                ----------------------------------------- */

                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                /* -----------------------------------------
                   URL category
                ----------------------------------------- */

                const matchesUrlCategory =
                    !urlCategory ||
                    productCategory ===
                        urlCategory;


                /* -----------------------------------------
                   Checkbox category
                ----------------------------------------- */

                const matchesCategory =
                    selectedCategories.length === 0 ||
                    selectedCategories.includes(
                        productCategory
                    );


                /* -----------------------------------------
                   Brand
                ----------------------------------------- */

                const matchesBrand =
                    selectedBrands.length === 0 ||
                    selectedBrands.includes(
                        productBrand
                    );


                /* -----------------------------------------
                   Price
                ----------------------------------------- */

                const matchesPrice =
                    Number(
                        product.price || 0
                    ) <= maxPrice;


                /* -----------------------------------------
                   Rating
                ----------------------------------------- */

                const matchesRating =
                    Number(
                        product.rating || 0
                    ) >= minimumRating;


                return (
                    matchesSearch &&
                    matchesUrlCategory &&
                    matchesCategory &&
                    matchesBrand &&
                    matchesPrice &&
                    matchesRating
                );

            }
        );


    /*
       Sort after filtering.
    */

    sortFilteredProducts();


    /*
       Display products.
    */

    displayShopProducts();


    /*
       Update count.
    */

    updateShopProductCount();

}


/* =========================================================
   SORT PRODUCTS
========================================================= */

function sortFilteredProducts() {

    const sortElement =
        document.getElementById(
            "sortProducts"
        );


    const sortValue =
        sortElement
            ? sortElement.value
            : "featured";


    /* Featured */

    if (
        sortValue === "featured"
    ) {

        /*
           Keep original products.js order.
        */

        return;

    }


    /* Price low to high */

    if (
        sortValue === "price-low"
    ) {

        filteredProducts.sort(
            function (a, b) {

                return (
                    Number(a.price || 0) -
                    Number(b.price || 0)
                );

            }
        );

        return;

    }


    /* Price high to low */

    if (
        sortValue === "price-high"
    ) {

        filteredProducts.sort(
            function (a, b) {

                return (
                    Number(b.price || 0) -
                    Number(a.price || 0)
                );

            }
        );

        return;

    }


    /* Highest rated */

    if (
        sortValue === "rating"
    ) {

        filteredProducts.sort(
            function (a, b) {

                return (
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
                );

            }
        );

        return;

    }


    /* Name A-Z */

    if (
        sortValue === "name"
    ) {

        filteredProducts.sort(
            function (a, b) {

                return String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                );

            }
        );

    }

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayShopProducts() {

    const grid =
        document.getElementById(
            "shopProductGrid"
        );


    const noProducts =
        document.getElementById(
            "noProducts"
        );


    if (!grid) {
        return;
    }


    /*
       No products found.
    */

    if (
        filteredProducts.length === 0
    ) {

        grid.innerHTML = "";


        if (noProducts) {

            noProducts.style.display =
                "block";

        }


        return;

    }


    /*
       Products found.
    */

    if (noProducts) {

        noProducts.style.display =
            "none";

    }


    /*
       Use the shared product card
       from main.js.
    */

    if (
        typeof createProductCard ===
        "function"
    ) {

        grid.innerHTML =
            filteredProducts
                .map(
                    function (product) {

                        return createProductCard(
                            product
                        );

                    }
                )
                .join("");

    }


    /*
       Fallback if main.js isn't available.
    */

    else {

        grid.innerHTML =
            filteredProducts
                .map(
                    createFallbackShopCard
                )
                .join("");

    }


    /*
       Setup product navigation,
       wishlist and other shared
       product-card behavior.
    */

    if (
        typeof setupProductCardClicks ===
        "function"
    ) {

        setupProductCardClicks(
            grid
        );

    }


    /*
       Restore wishlist heart state.
    */

    restoreShopWishlist();

}


/* =========================================================
   UPDATE PRODUCT COUNT
========================================================= */

function updateShopProductCount() {

    const count =
        document.getElementById(
            "productCount"
        );


    if (!count) {
        return;
    }


    const total =
        filteredProducts.length;


    count.textContent =
        total +
        (
            total === 1
                ? " product"
                : " products"
        );

}


/* =========================================================
   CLEAR ALL FILTERS
========================================================= */

function clearAllFilters() {

    /*
       Clear category checkboxes.
    */

    document
        .querySelectorAll(
            '#categoryFilters input[type="checkbox"]'
        )
        .forEach(
            function (input) {

                input.checked = false;

            }
        );


    /*
       Clear brand checkboxes.
    */

    document
        .querySelectorAll(
            '#brandFilters input[type="checkbox"]'
        )
        .forEach(
            function (input) {

                input.checked = false;

            }
        );


    /*
       Reset rating.
    */

    const allRating =
        document.querySelector(
            'input[name="rating"][value="0"], ' +
            'input[name="rating"][value=""]'
        );


    if (allRating) {

        allRating.checked = true;

    }


    /*
       Reset price.
    */

    const maxPrice =
        document.getElementById(
            "maxPrice"
        );


    if (maxPrice) {

        maxPrice.value =
            maxPrice.max || 5000;

    }


    /*
       Reset sorting.
    */

    const sort =
        document.getElementById(
            "sortProducts"
        );


    if (sort) {

        sort.value =
            "featured";

    }


    /*
       Remove search and category
       parameters from the URL.
    */

    const url =
        new URL(
            window.location.href
        );


    url.searchParams.delete(
        "category"
    );


    url.searchParams.delete(
        "search"
    );


    /*
       Update browser URL without reload.
    */

    window.history.replaceState(
        {},
        "",
        url
    );


    /*
       Re-apply filters.
    */

    applyShopFilters();

}


/* =========================================================
   REMOVE URL CATEGORY
========================================================= */

function removeUrlCategoryFilter() {

    const url =
        new URL(
            window.location.href
        );


    if (
        url.searchParams.has(
            "category"
        )
    ) {

        url.searchParams.delete(
            "category"
        );


        window.history.replaceState(
            {},
            "",
            url
        );

    }

}


/* =========================================================
   RESTORE WISHLIST STATE
========================================================= */

function restoreShopWishlist() {

    let wishlist = [];


    try {

        wishlist =
            JSON.parse(
                localStorage.getItem(
                    "wishlist"
                )
            ) || [];

    } catch (error) {

        wishlist = [];

    }


    wishlist =
        wishlist.map(Number);


    document
        .querySelectorAll(
            "#shopProductGrid .product-wishlist"
        )
        .forEach(
            function (button) {

                const id =
                    Number(
                        button.dataset.wishlistId
                    );


                if (
                    wishlist.includes(id)
                ) {

                    button.classList.add(
                        "added"
                    );


                    const icon =
                        button.querySelector(
                            "i"
                        );


                    if (icon) {

                        icon.classList.remove(
                            "fa-regular"
                        );

                        icon.classList.add(
                            "fa-solid"
                        );

                    }

                }

            }
        );

}


/* =========================================================
   FALLBACK PRODUCT CARD
========================================================= */

function createFallbackShopCard(product) {

    let stars = "";


    const rating =
        Number(
            product.rating || 0
        );


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        if (
            i <= Math.round(rating)
        ) {

            stars +=
                '<i class="fa-solid fa-star"></i>';

        } else {

            stars +=
                '<i class="fa-regular fa-star"></i>';

        }

    }


    return `

        <article
            class="product-card"
            data-product-id="${product.id}"
        >

            <div class="product-image">

                ${
                    product.badge
                        ? `
                            <span class="product-badge">
                                ${product.badge}
                            </span>
                          `
                        : ""
                }


                <button
                    type="button"
                    class="product-wishlist"
                    data-wishlist-id="${product.id}"
                >

                    <i class="fa-regular fa-heart"></i>

                </button>


                <img
                    src="${getProductImage(product)}"
                    alt="${product.name}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >


                <div
                    class="product-icon-fallback"
                    style="display:none;"
                >

                    <i
                        class="fa-solid ${product.icon || "fa-box"}"
                    ></i>

                </div>

            </div>


            <div class="product-info">

                <span class="product-category">
                    ${product.category || ""}
                </span>


                <h3 class="product-name">
                    ${product.name || ""}
                </h3>


                <div class="product-rating">

                    <span>
                        ${stars}
                    </span>

                    <small>
                        ${rating}
                        (${product.reviews || 0})
                    </small>

                </div>


                <div class="product-price">

                    <span class="current-price">
                        ₹${Number(
                            product.price || 0
                        ).toLocaleString("en-IN")}
                    </span>


                    ${
                        product.oldPrice
                            ? `
                                <span class="old-price">
                                    ₹${Number(
                                        product.oldPrice
                                    ).toLocaleString("en-IN")}
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   PUBLIC API
========================================================= */

window.ShopEaseFilters = {

    apply:
        applyShopFilters,

    clear:
        clearAllFilters,

    getFilteredProducts:
        function () {

            return filteredProducts;

        }

};