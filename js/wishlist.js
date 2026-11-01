/* =========================================
   ShopEase Wishlist
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadWishlist();

});


/* =========================================
   BACKEND WISHLIST (logged-in users)
========================================= */

/* Cache of backend wishlist items keyed by product id, so the card
   builder and "add to cart" keep working with server-side products. */
var wishlistApiCache = {};


/* True when js/api.js is loaded and the user is signed in. */
function useBackendWishlist() {

    return (typeof ShopEaseAPI !== "undefined") &&
        ShopEaseAPI.isLoggedIn;

}


/* Map a backend wishlist item to the product shape
   createWishlistCard() expects. */
function mapApiWishlistItem(item) {

    const product = {

        id: Number(item.product_id),

        name: item.name,

        category: item.category,

        price: Number(item.price),

        oldPrice: null,

        rating: Number(item.average_rating) || 0,

        reviews: Number(item.review_count) || 0,

        image: item.image_url,

        badge: null,

        icon: "fa-bag-shopping",

        description: item.description || ""

    };

    wishlistApiCache[product.id] = product;

    return product;

}


/* =========================================
   GET WISHLIST
========================================= */

function getWishlist() {

    try {

        return JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];

    } catch (error) {

        return [];

    }

}


/* =========================================
   SAVE WISHLIST
========================================= */

function saveWishlist(wishlist) {

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

}


/* =========================================
   LOAD WISHLIST
========================================= */

async function loadWishlist() {

    const wishlistContainer =
        document.getElementById("wishlistProducts");

    const emptyWishlist =
        document.getElementById("emptyWishlist");

    const countText =
        document.getElementById("wishlistCountText");


    if (!wishlistContainer) {
        return;
    }


    let wishlistProducts = [];


    if (useBackendWishlist()) {

        /* Logged in: render the server-side wishlist. */

        try {

            wishlistProducts =
                (await ShopEaseAPI.getWishlist())
                    .map(mapApiWishlistItem);

        } catch (error) {

            wishlistProducts = [];

        }

    } else {

        /* Guest: render the localStorage wishlist (unchanged behaviour). */

        const wishlist = getWishlist().map(item => Number(typeof item === "object" ? item.id : item)).filter(item => !Number.isNaN(item));
        localStorage.setItem("wishlist", JSON.stringify([...new Set(wishlist)]));


        wishlistProducts = wishlist
            .map(function (id) {

                return products.find(function (product) {

                    return product.id === Number(id);

                });

            })
            .filter(Boolean);

    }


    /* Update count */

    if (countText) {

        countText.textContent =
            wishlistProducts.length +
            (wishlistProducts.length === 1
                ? " product saved"
                : " products saved");

    }


    /* Empty state */

    if (wishlistProducts.length === 0) {

        wishlistContainer.innerHTML = "";

        if (emptyWishlist) {
            emptyWishlist.style.display = "block";
        }

        return;

    }


    if (emptyWishlist) {
        emptyWishlist.style.display = "none";
    }


    wishlistContainer.innerHTML =
        wishlistProducts
            .map(createWishlistCard)
            .join("");


    setupWishlistCards();

}


/* =========================================
   CREATE PRODUCT CARD
========================================= */

function createWishlistCard(product) {

    return `

        <div
            class="wishlist-card"
            data-product-id="${product.id}"
        >

            <div class="wishlist-image">

                ${
                    product.badge
                    ? `
                        <span class="wishlist-badge">
                            ${product.badge}
                        </span>
                    `
                    : ""
                }


                <button
                    type="button"
                    class="wishlist-remove"
                    data-action="remove"
                    data-id="${product.id}"
                    aria-label="Remove from wishlist"
                >

                    <i class="fa-solid fa-heart"></i>

                </button>


                <img
                    src="${getProductImage(product)}"
                    alt="${product.name}"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >


                <div
                    class="wishlist-icon-fallback"
                    style="display:none;"
                >

                    <i
                        class="fa-solid ${product.icon}"
                    ></i>

                </div>

            </div>


            <div class="wishlist-info">

                <span class="wishlist-category">
                    ${product.category}
                </span>


                <h3 class="wishlist-name">
                    ${product.name}
                </h3>


                <div class="wishlist-rating">

                    <span class="stars">
                        ${createStars(product.rating)}
                    </span>

                    <span>
                        ${product.rating}
                    </span>

                    <span>
                        (${product.reviews})
                    </span>

                </div>


                <div class="wishlist-price">

                    <span class="current-price">

                        ₹${product.price.toLocaleString("en-IN")}

                    </span>


                    ${
                        product.oldPrice
                        ? `
                            <span class="old-price">

                                ₹${product.oldPrice.toLocaleString("en-IN")}

                            </span>
                        `
                        : ""
                    }

                </div>


                <div class="wishlist-actions">

                    <button
                        type="button"
                        class="btn btn-primary add-wishlist-cart"
                        data-action="cart"
                        data-id="${product.id}"
                    >

                        <i class="fa-solid fa-cart-shopping"></i>

                        Add to Cart

                    </button>


                    <button
                        type="button"
                        class="view-product-button"
                        data-action="view"
                        data-id="${product.id}"
                    >

                        <i class="fa-solid fa-eye"></i>

                    </button>

                </div>

            </div>

        </div>

    `;

}


/* =========================================
   STAR RATING
========================================= */

function createStars(rating) {

    let stars = "";

    const roundedRating =
        Math.round(rating);


    for (let i = 1; i <= 5; i++) {

        if (i <= roundedRating) {

            stars +=
                '<i class="fa-solid fa-star"></i>';

        } else {

            stars +=
                '<i class="fa-regular fa-star"></i>';

        }

    }


    return stars;

}


/* =========================================
   CARD EVENTS
========================================= */

function setupWishlistCards() {

    const buttons =
        document.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();


                const action =
                    button.getAttribute(
                        "data-action"
                    );


                const productId =
                    Number(
                        button.getAttribute(
                            "data-id"
                        )
                    );


                if (action === "remove") {

                    removeFromWishlist(
                        productId
                    );

                }


                if (action === "cart") {

                    addWishlistProductToCart(
                        productId
                    );

                }


                if (action === "view") {

                    window.location.href =
                        "product-details.html?id=" +
                        productId;

                }

            }
        );

    });


    /* Card click */

    document
        .querySelectorAll(".wishlist-card")
        .forEach(function (card) {

            card.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target.closest(
                            "button"
                        )
                    ) {
                        return;
                    }


                    const productId =
                        card.getAttribute(
                            "data-product-id"
                        );


                    window.location.href =
                        "product-details.html?id=" +
                        productId;

                }
            );

        });

}


/* =========================================
   REMOVE ITEM
========================================= */

async function removeFromWishlist(productId) {

    if (useBackendWishlist()) {

        try {

            await ShopEaseAPI.removeFromWishlist(productId);

        } catch (error) {

            showWishlistToast(
                "Could not remove the product. Please try again."
            );

            return;

        }

    } else {

        let wishlist =
            getWishlist();


        wishlist =
            wishlist.filter(function (id) {

                return Number(id) !==
                    Number(productId);

            });


        saveWishlist(wishlist);

    }


    if (
        typeof updateWishlistCount ===
        "function"
    ) {

        updateWishlistCount();

    }


    loadWishlist();


    showWishlistToast(
        "Product removed from wishlist."
    );

}


/* =========================================
   ADD TO CART
========================================= */

function addWishlistProductToCart(productId) {

    const product =
        wishlistApiCache[Number(productId)] ||
        products.find(function (item) {

            return item.id ===
                Number(productId);

        });


    if (!product) {
        return;
    }


    let cart = [];


    try {

        cart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

    } catch (error) {

        cart = [];

    }


    const existingItem =
        cart.find(function (item) {

            return Number(item.id) ===
                Number(productId);

        });


    if (existingItem) {

        existingItem.quantity =
            Number(existingItem.quantity || 0) + 1;

    } else {

        cart.push({

            id: Number(productId),

            quantity: 1,

            size: "",

            color: ""

        });

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    if (
        typeof updateCartCount ===
        "function"
    ) {

        updateCartCount();

    }


    showWishlistToast(
        product.name +
        " added to cart."
    );

}


/* =========================================
   CLEAR WISHLIST
========================================= */

async function clearWishlist() {

    const confirmedMessage =
        "Are you sure you want to remove all wishlist items?";


    if (useBackendWishlist()) {

        let items = [];

        try {

            items = await ShopEaseAPI.getWishlist();

        } catch (error) {

            items = [];

        }


        if (items.length === 0) {
            return;
        }


        if (!confirm(confirmedMessage)) {
            return;
        }


        for (const item of items) {

            try {

                await ShopEaseAPI.removeFromWishlist(item.product_id);

            } catch (error) {
                /* keep going */
            }

        }

    } else {

        const wishlist =
            getWishlist();


        if (wishlist.length === 0) {
            return;
        }


        if (!confirm(confirmedMessage)) {
            return;
        }


        localStorage.removeItem(
            "wishlist"
        );

    }


    if (
        typeof updateWishlistCount ===
        "function"
    ) {

        updateWishlistCount();

    }


    loadWishlist();


    showWishlistToast(
        "Wishlist cleared."
    );

}


/* =========================================
   TOAST
========================================= */

function showWishlistToast(message) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    if (
        toast &&
        toastMessage
    ) {

        toastMessage.textContent =
            message;


        toast.classList.add(
            "show"
        );


        setTimeout(function () {

            toast.classList.remove(
                "show"
            );

        }, 2500);

    }

}