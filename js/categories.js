/* =========================================================
   ShopEase - Categories
   Products + Category Sections + Filters
========================================================= */

let categoryFilteredProducts = [];
let categoryPageInitialized = false;


/* =========================================================
   CATEGORY CONFIG
========================================================= */

const categoryConfig = {

    men: {
        title: "Men's Fashion",
        description: "Classic essentials, smart casual staples and premium everyday wear.",
        icon: "fa-person"
    },

    women: {
        title: "Women's Fashion",
        description: "Trend-forward picks for work, weekends and elevated everyday styling.",
        icon: "fa-person-dress"
    },

    shoes: {
        title: "Footwear",
        description: "Step into comfort and style with everyday and performance footwear.",
        icon: "fa-shoe-prints"
    },

    accessories: {
        title: "Accessories",
        description: "Finish your look with bags, belts, travel gear and everyday carry essentials.",
        icon: "fa-bag-shopping"
    },

    electronics: {
        title: "Electronics",
        description: "Smartphones, laptops, audio gear and connected devices for modern life.",
        icon: "fa-laptop"
    },

    home: {
        title: "Home & Living",
        description: "Curated living, comfort and utility finds for cleaner, smarter spaces.",
        icon: "fa-house"
    },

    beauty: {
        title: "Beauty",
        description: "Skincare, grooming and wellness essentials that feel premium and useful.",
        icon: "fa-spa"
    },

    appliances: {
        title: "Appliances",
        description: "Kitchen and home devices built for convenience, cooling and everyday ease.",
        icon: "fa-kitchen-set"
    },

    fitness: {
        title: "Fitness",
        description: "Supportive gear and accessories that help you move better every day.",
        icon: "fa-dumbbell"
    }

};


/* =========================================================
   INITIALIZE
========================================================= */

function initializeCategoryPage() {

    if (categoryPageInitialized) {
        return;
    }

    if (!document.getElementById("categorySections")) {
        return;
    }

    categoryPageInitialized = true;

    updateCategoryPriceLabel();
    setupCategoryFilters();
    applyCategoryFilters();

}


document.addEventListener(
    "DOMContentLoaded",
    function () {
        // The catalog loads live from the database (/api/products) with a
        // static fallback — wait for it before building the page.
        (window.productsReady || Promise.resolve()).then(function () {
            initializeCategoryPage();
        });
    }
);

if (document.readyState !== "loading") {
    initializeCategoryPage();
}


/* =========================================================
   SETUP FILTERS
========================================================= */

function setupCategoryFilters() {

    /* Category */

    document
        .querySelectorAll(
            "#categoryPageCategoryFilters input"
        )
        .forEach(function (input) {

            input.addEventListener(
                "change",
                applyCategoryFilters
            );

        });


    /* Brand */

    document
        .querySelectorAll(
            "#categoryPageBrandFilters input"
        )
        .forEach(function (input) {

            input.addEventListener(
                "change",
                applyCategoryFilters
            );

        });


    /* Rating */

    document
        .querySelectorAll(
            'input[name="categoryRating"]'
        )
        .forEach(function (input) {

            input.addEventListener(
                "change",
                applyCategoryFilters
            );

        });


    /* Price */

    const price =
        document.getElementById(
            "categoryMaxPrice"
        );


    if (price) {

        price.addEventListener(
            "input",
            function () {

                updateCategoryPriceLabel();

                applyCategoryFilters();

            }
        );

    }


    /* Sort */

    const sort =
        document.getElementById(
            "categorySortProducts"
        );


    if (sort) {

        sort.addEventListener(
            "change",
            applyCategoryFilters
        );

    }


    /* Clear */

    const clearButton =
        document.getElementById(
            "clearCategoryFilters"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearCategoryFilters
        );

    }


    /* Reset */

    const resetButton =
        document.getElementById(
            "categoryResetButton"
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            clearCategoryFilters
        );

    }

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyCategoryFilters() {

    if (
        typeof products === "undefined" ||
        !Array.isArray(products)
    ) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const search =
        (
            params.get("search") || ""
        )
            .toLowerCase()
            .trim();


    const urlCategory =
        (
            params.get("category") || ""
        )
            .toLowerCase()
            .trim();


    /* Selected categories */

    const selectedCategories =
        Array.from(
            document.querySelectorAll(
                "#categoryPageCategoryFilters input:checked"
            )
        )
        .map(function (input) {

            return input.value.toLowerCase();

        });


    /* Selected brands */

    const selectedBrands =
        Array.from(
            document.querySelectorAll(
                "#categoryPageBrandFilters input:checked"
            )
        )
        .map(function (input) {

            return input.value.toLowerCase();

        });


    /* Maximum price */

    const priceElement =
        document.getElementById(
            "categoryMaxPrice"
        );


    const maxPrice =
        priceElement
            ? Number(priceElement.value)
            : 5000;


    /* Rating */

    const ratingElement =
        document.querySelector(
            'input[name="categoryRating"]:checked'
        );


    const minimumRating =
        ratingElement
            ? Number(ratingElement.value)
            : 0;


    /* Filter products */

    categoryFilteredProducts =
        products.filter(
            function (product) {

                const category =
                    String(
                        product.categorySlug || product.category || ""
                    )
                    .toLowerCase();


                const brand =
                    String(
                        product.brand || ""
                    )
                    .toLowerCase();


                const searchable =
                    (
                        String(product.name || "") +
                        " " +
                        String(product.category || "") +
                        " " +
                        String(product.brand || "") +
                        " " +
                        String(product.description || "")
                    )
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                /*
                   If category was supplied in URL,
                   use it as initial category filter.
                */

                const matchesUrlCategory =
                    !urlCategory ||
                    category === urlCategory;


                /*
                   Checkbox categories.
                */

                const matchesCategory =
                    selectedCategories.length === 0 ||
                    selectedCategories.includes(category);


                /*
                   Brand.
                */

                const matchesBrand =
                    selectedBrands.length === 0 ||
                    selectedBrands.includes(brand);


                /*
                   Price.
                */

                const matchesPrice =
                    Number(product.price || 0)
                    <= maxPrice;


                /*
                   Rating.
                */

                const matchesRating =
                    Number(product.rating || 0)
                    >= minimumRating;


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


    sortCategoryProducts();

    renderCategoryProducts();

    updateCategoryProductCount();

}


/* =========================================================
   SORT
========================================================= */

function sortCategoryProducts() {

    const sort =
        document.getElementById(
            "categorySortProducts"
        );


    const value =
        sort
            ? sort.value
            : "featured";


    if (value === "price-low") {

        categoryFilteredProducts.sort(
            function (a, b) {

                return (
                    Number(a.price) -
                    Number(b.price)
                );

            }
        );

    }


    else if (value === "price-high") {

        categoryFilteredProducts.sort(
            function (a, b) {

                return (
                    Number(b.price) -
                    Number(a.price)
                );

            }
        );

    }


    else if (value === "rating") {

        categoryFilteredProducts.sort(
            function (a, b) {

                return (
                    Number(b.rating) -
                    Number(a.rating)
                );

            }
        );

    }


    else if (value === "name") {

        categoryFilteredProducts.sort(
            function (a, b) {

                return String(a.name)
                    .localeCompare(
                        String(b.name)
                    );

            }
        );

    }

}


/* =========================================================
   RENDER CATEGORY PRODUCTS
========================================================= */

function renderCategoryProducts() {

    const container =
        document.getElementById(
            "categorySections"
        );


    const noResults =
        document.getElementById(
            "categoryNoResults"
        );


    if (!container) {
        return;
    }


    /*
       No filtered products.
    */

    if (
        categoryFilteredProducts.length === 0
    ) {

        container.innerHTML = "";

        if (noResults) {
            noResults.style.display =
                "block";
        }

        return;

    }


    if (noResults) {
        noResults.style.display =
            "none";
    }


    let html = "";


    Object.keys(categoryConfig)
        .forEach(
            function (slug) {

                const config =
                    categoryConfig[slug];


                const sectionProducts =
                    categoryFilteredProducts.filter(
                        function (product) {

                            return String(
                                product.categorySlug || product.category || ""
                            )
                            .toLowerCase()
                            === slug;

                        }
                    );


                if (
                    sectionProducts.length === 0
                ) {

                    return;

                }


                html +=
                    createCategorySection(
                        slug,
                        config,
                        sectionProducts
                    );

            }
        );


    container.innerHTML = html;


    setupCategoryProductClicks();

    if (typeof initializeProductButtons === "function") {
        initializeProductButtons();
    }

    restoreWishlistState();

}


/* =========================================================
   CREATE CATEGORY SECTION
========================================================= */

function createCategorySection(
    slug,
    config,
    sectionProducts
) {

    return `

        <section
            class="category-product-section"
            data-category="${slug}"
        >

            <div class="category-section-header">

                <div class="category-title-area">

                    <div class="category-section-icon">

                        <i
                            class="fa-solid ${config.icon}"
                        ></i>

                    </div>


                    <div>

                        <span class="category-label">
                            COLLECTION
                        </span>

                        <h2>
                            ${config.title}
                        </h2>

                        <p>
                            ${config.description}
                        </p>

                    </div>

                </div>


                <div class="category-section-action">

                    <span class="category-product-count">

                        ${sectionProducts.length}

                        ${
                            sectionProducts.length === 1
                                ? " Product"
                                : " Products"
                        }

                    </span>


                    <a
                        href="shop.html?category=${slug}"
                        class="category-view-all"
                    >

                        View All

                        <i
                            class="fa-solid fa-arrow-right"
                        ></i>

                    </a>

                </div>

            </div>


            <div class="product-grid category-product-grid">

                ${
                    sectionProducts
                        .map(
                            function (product) {

                                /*
                                   Use the SAME product
                                   card used by ShopEase.
                                */

                                if (
                                    typeof createProductCard ===
                                    "function"
                                ) {

                                    return createProductCard(
                                        product
                                    );

                                }


                                return createFallbackProductCard(
                                    product
                                );

                            }
                        )
                        .join("")
                }

            </div>

        </section>

    `;

}


/* =========================================================
   FALLBACK PRODUCT CARD
========================================================= */

function createFallbackProductCard(product) {

    const rating =
        Number(product.rating || 0);


    let stars = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        stars +=
            i <= Math.round(rating)
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>';

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
                    aria-label="Add to wishlist"
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
                    ${product.category}
                </span>

                <h3 class="product-name">
                    ${product.name}
                </h3>

                <div class="product-rating">

                    <span>
                        ${stars}
                    </span>

                    <small>
                        ${product.rating}
                        (${product.reviews})
                    </small>

                </div>


                <div class="product-price">

                    <span class="current-price">
                        ₹${Number(product.price).toLocaleString("en-IN")}
                    </span>

                    ${
                        product.oldPrice
                            ? `
                                <span class="old-price">
                                    ₹${Number(product.oldPrice).toLocaleString("en-IN")}
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
   PRODUCT CLICK EVENTS
========================================================= */

function setupCategoryProductClicks() {

    const container =
        document.getElementById(
            "categorySections"
        );


    if (!container) {
        return;
    }


    /*
       Prefer the shared main.js handler.
    */

    if (
        typeof setupProductCardClicks ===
        "function"
    ) {

        setupProductCardClicks(
            container
        );

        return;

    }


    /*
       Fallback handler.
    */

    container
        .querySelectorAll(
            ".product-card"
        )
        .forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target.closest(
                                ".product-wishlist"
                            )
                        ) {
                            return;
                        }


                        const id =
                            card.dataset.productId;


                        if (id) {

                            window.location.href =
                                "product-details.html?id=" +
                                id;

                        }

                    }
                );

            }
        );

}


/* =========================================================
   RESTORE WISHLIST
========================================================= */

function restoreWishlistState() {

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
            "#categorySections .product-wishlist, #categorySections .wishlist-btn"
        )
        .forEach(
            function (button) {

                const id =
                    Number(
                        button.dataset.wishlistId || button.dataset.wishlist
                    );


                if (
                    wishlist.includes(id)
                ) {

                    button.classList.add(
                        "active",
                        "added"
                    );


                    const icon =
                        button.querySelector("i");


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
   PRICE LABEL
========================================================= */

function updateCategoryPriceLabel() {

    const slider =
        document.getElementById(
            "categoryMaxPrice"
        );


    const label =
        document.getElementById(
            "categoryPriceValue"
        );


    if (
        slider &&
        label
    ) {

        label.textContent =
            "₹" +
            Number(
                slider.value
            ).toLocaleString("en-IN");

    }

}


/* =========================================================
   PRODUCT COUNT
========================================================= */

function updateCategoryProductCount() {

    const count =
        document.getElementById(
            "categoryProductCount"
        );


    if (!count) {
        return;
    }


    const total =
        categoryFilteredProducts.length;


    count.textContent =
        total +
        (
            total === 1
                ? " product"
                : " products"
        );

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearCategoryFilters() {

    /*
       Uncheck categories.
    */

    document
        .querySelectorAll(
            "#categoryPageCategoryFilters input"
        )
        .forEach(
            function (input) {

                input.checked = false;

            }
        );


    /*
       Uncheck brands.
    */

    document
        .querySelectorAll(
            "#categoryPageBrandFilters input"
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
            'input[name="categoryRating"][value="0"]'
        );


    if (allRating) {
        allRating.checked = true;
    }


    /*
       Reset price.
    */

    const price =
        document.getElementById(
            "categoryMaxPrice"
        );


    if (price) {

        price.value =
            price.max || 5000;

    }


    /*
       Reset sort.
    */

    const sort =
        document.getElementById(
            "categorySortProducts"
        );


    if (sort) {
        sort.value = "featured";
    }


    /*
       Remove URL filters.
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


    window.history.replaceState(
        {},
        "",
        url
    );


    updateCategoryPriceLabel();

    applyCategoryFilters();

}


/* =========================================================
   PUBLIC API
========================================================= */

window.ShopEaseCategories = {

    applyFilters:
        applyCategoryFilters,

    clearFilters:
        clearCategoryFilters,

    getProducts:
        function () {

            return categoryFilteredProducts;

        }

};