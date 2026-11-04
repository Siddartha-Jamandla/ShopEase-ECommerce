document.addEventListener("DOMContentLoaded", () => {

    setupMobileMenu();
    setupSearch();
    setupNewsletter();

    updateCartCount();
    updateWishlistCount();

    // The catalog loads live from the database (/api/products) with a
    // static fallback — wait for it before rendering product sections.
    (window.productsReady || Promise.resolve()).then(() => {
        setupHeroBestseller();
        setupPromoBanner();
        setupCategoryCounts();

        loadFeaturedProducts();
        loadProductDetails();
    });

});


/* =========================================
   FEATURED PRODUCTS
========================================= */

function loadFeaturedProducts() {

    const container = document.getElementById("featuredProducts");

    if (!container || typeof products === "undefined") {
        return;
    }

    const featuredProducts = products.slice(0, 4);

    container.innerHTML = featuredProducts
        .map(product => createHomepageProductCard(product))
        .join("");
}


/* =========================================
   PRODUCT CARD
========================================= */

function createHomepageProductCard(product) {

    const wishlist = getWishlist();
    const isWishlisted = wishlist.includes(Number(product.id));

    return `
        <div class="product-card"
             data-product-id="${product.id}"
             onclick="openProduct(${product.id})">

            <div class="product-image">

                ${
                    product.badge
                        ? `<span class="product-badge">${product.badge}</span>`
                        : ""
                }

                <button
                    class="product-wishlist ${isWishlisted ? "active" : ""}"
                    data-wishlist-id="${product.id}"
                    onclick="event.stopPropagation(); addToWishlist(${product.id})"
                >
                    <i class="${isWishlisted ? "fa-solid" : "fa-regular"} fa-heart"></i>
                </button>

                <button
                    class="add-to-cart-btn"
                    data-product-id="${product.id}"
                    onclick="event.stopPropagation(); addProductToCartFromCard(${product.id})"
                >
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add to Cart
                </button>

                <div class="product-image-placeholder">
                    <i class="fa-solid ${product.icon}"></i>
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
                        ${createStars(product.rating)}
                    </span>

                    <small>
                        (${product.reviews})
                    </small>
                </div>

                <div class="product-price">

                    <span class="current-price">
                        ₹${product.price.toLocaleString("en-IN")}
                    </span>

                    ${
                        product.oldPrice
                            ? `<span class="old-price">
                                ₹${product.oldPrice.toLocaleString("en-IN")}
                               </span>`
                            : ""
                    }

                </div>

            </div>

        </div>
    `;
}


/* =========================================
   STARS
========================================= */

function createStars(rating) {

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        if (rating >= i) {
            stars += "★";
        } else {
            stars += "☆";
        }

    }

    return stars;
}


/* =========================================
   OPEN PRODUCT
========================================= */

function openProduct(productId) {

    window.location.href =
        `product-details.html?id=${productId}`;
}


/* =========================================
   PRODUCT DETAILS
========================================= */

let currentProduct = null;
let selectedSize = "M";
let selectedColor = "Black";
let productQuantity = 1;


function loadProductDetails() {

    const productName = document.getElementById("productName");

    if (!productName || typeof products === "undefined") {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get("id"));

    currentProduct = products.find(
        product => Number(product.id) === productId
    );

    if (!currentProduct) {

        const productContent =
            document.getElementById("productContent");

        const productNotFound =
            document.getElementById("productNotFound");

        if (productContent) {
            productContent.style.display = "none";
        }

        if (productNotFound) {
            productNotFound.style.display = "block";
        }

        return;
    }

    renderProductDetails(currentProduct);
    loadRelatedProducts(currentProduct);
}


/* =========================================
   RENDER PRODUCT DETAILS
========================================= */

function renderProductDetails(product) {

    const category =
        document.getElementById("productCategory");

    const name =
        document.getElementById("productName");

    const ratingStars =
        document.getElementById("productRatingStars");

    const ratingText =
        document.getElementById("productRatingText");

    const price =
        document.getElementById("productPrice");

    const oldPrice =
        document.getElementById("productOldPrice");

    const discount =
        document.getElementById("productDiscount");

    const description =
        document.getElementById("productDescription");

    const badge =
        document.getElementById("productBadge");

    const breadcrumb =
        document.getElementById("breadcrumbProduct");


    if (category) {
        category.textContent = product.category;
    }

    if (name) {
        name.textContent = product.name;
    }

    if (ratingStars) {
        ratingStars.textContent =
            createStars(product.rating);
    }

    if (ratingText) {
        ratingText.textContent =
            `${product.rating} (${product.reviews} reviews)`;
    }

    if (price) {
        price.textContent =
            `₹${product.price.toLocaleString("en-IN")}`;
    }

    if (oldPrice) {

        if (product.oldPrice) {

            oldPrice.textContent =
                `₹${product.oldPrice.toLocaleString("en-IN")}`;

            oldPrice.style.display = "inline";

        } else {

            oldPrice.style.display = "none";

        }
    }


    if (discount) {

        if (product.oldPrice) {

            const discountValue =
                Math.round(
                    ((product.oldPrice - product.price) /
                    product.oldPrice) * 100
                );

            discount.textContent =
                `${discountValue}% OFF`;

            discount.style.display = "inline";

        } else {

            discount.style.display = "none";

        }
    }


    if (description) {
        description.textContent = product.description;
    }


    if (badge) {

        if (product.badge) {

            badge.textContent = product.badge;
            badge.style.display = "block";

        } else {

            badge.style.display = "none";

        }
    }


    if (breadcrumb) {
        breadcrumb.textContent = product.name;
    }


    setupProductImages(product);

    updateProductWishlistButton();

}


/* =========================================
   PRODUCT IMAGES
========================================= */

function setupProductImages(product) {

    const imagePaths = [
        getProductImage(product),
        getProductImage(product),
        getProductImage(product),
        getProductImage(product)
    ];


    const mainImage =
        document.getElementById("mainProductImage");

    const placeholder =
        document.getElementById("mainImagePlaceholder");


    if (mainImage) {

        mainImage.src = imagePaths[0];

        mainImage.onload = () => {

            mainImage.style.display = "block";

            if (placeholder) {
                placeholder.style.display = "none";
            }

        };

        mainImage.onerror = () => {

            mainImage.style.display = "none";

            if (placeholder) {
                placeholder.style.display = "flex";
            }

        };

    }


    imagePaths.forEach((path, index) => {

        const thumbnail =
            document.getElementById(`thumbnail${index + 1}`);

        if (!thumbnail) {
            return;
        }

        thumbnail.src = path;

        thumbnail.onload = () => {

            thumbnail.style.display = "block";

            const placeholder =
                thumbnail.parentElement.querySelector(
                    ".thumbnail-placeholder"
                );

            if (placeholder) {
                placeholder.style.display = "none";
            }

        };

        thumbnail.onerror = () => {

            thumbnail.style.display = "none";

            const placeholder =
                thumbnail.parentElement.querySelector(
                    ".thumbnail-placeholder"
                );

            if (placeholder) {
                placeholder.style.display = "flex";
            }

        };

    });

}


/* =========================================
   CHANGE PRODUCT IMAGE
========================================= */

function changeProductImage(index, thumbnailButton) {

    if (!currentProduct) {
        return;
    }

    const path = getProductImage(currentProduct);

    const mainImage =
        document.getElementById("mainProductImage");

    const placeholder =
        document.getElementById("mainImagePlaceholder");


    document
        .querySelectorAll(".product-thumbnail")
        .forEach(button => {
            button.classList.remove("active");
        });

    if (thumbnailButton) {
        thumbnailButton.classList.add("active");
    }


    if (mainImage) {

        mainImage.src = path;

        mainImage.onload = () => {

            mainImage.style.display = "block";

            if (placeholder) {
                placeholder.style.display = "none";
            }

        };

        mainImage.onerror = () => {

            mainImage.style.display = "none";

            if (placeholder) {
                placeholder.style.display = "flex";
            }

        };

    }

}


/* =========================================
   SIZE SELECTION
========================================= */

function selectSize(button) {

    document
        .querySelectorAll(".size-button")
        .forEach(item => {
            item.classList.remove("active");
        });

    button.classList.add("active");

    selectedSize = button.textContent.trim();

}


/* =========================================
   COLOR SELECTION
========================================= */

function selectColor(button) {

    document
        .querySelectorAll(".color-button")
        .forEach(item => {
            item.classList.remove("active");
        });

    button.classList.add("active");

    selectedColor =
        button.dataset.color || "Black";

}


/* =========================================
   QUANTITY
========================================= */

function changeQuantity(amount) {

    productQuantity += amount;

    if (productQuantity < 1) {
        productQuantity = 1;
    }

    if (productQuantity > 10) {
        productQuantity = 10;
    }

    const quantityElement =
        document.getElementById("productQuantity");

    if (quantityElement) {
        quantityElement.textContent =
            productQuantity;
    }

}


/* =========================================
   ADD CURRENT PRODUCT TO CART
========================================= */

function addCurrentProductToCart(buyNow = false) {

    if (!currentProduct) {
        return;
    }


    let cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    const existingItem = cart.find(item =>
        Number(item.id) === Number(currentProduct.id) &&
        item.size === selectedSize &&
        item.color === selectedColor
    );


    if (existingItem) {

        existingItem.quantity += productQuantity;

    } else {

        cart.push({
            id: Number(currentProduct.id),
            quantity: productQuantity,
            size: selectedSize,
            color: selectedColor
        });

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    updateCartCount();


    if (buyNow) {

        window.location.href = "cart.html";

    } else {

        showToast(
            `${currentProduct.name} added to cart`
        );

    }

}


/* =========================================
   WISHLIST
========================================= */

function getWishlist() {

    return JSON.parse(
        localStorage.getItem("wishlist")
    ) || [];

}


function addProductToCartFromCard(productId) {
    const product = products.find(item => Number(item.id) === Number(productId));

    if (!product) {
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find(item => Number(item.id) === Number(product.id));

    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 1) + 1;
    } else {
        cart.push({
            id: Number(product.id),
            quantity: 1,
            size: "M",
            color: "Black"
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast(`${product.name} added to cart`);
}

function addToWishlist(productId) {

    let wishlist = getWishlist();

    productId = Number(productId);


    if (wishlist.includes(productId)) {

        wishlist = wishlist.filter(
            id => Number(id) !== productId
        );

        showToast("Removed from wishlist");

    } else {

        wishlist.push(productId);

        showToast("Added to wishlist");

    }

    wishlist = [...new Set(wishlist.map(Number).filter(id => !Number.isNaN(id)))];

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );


    updateWishlistCount();


    const currentButton =
        document.getElementById(
            "productWishlistButton"
        );

    if (currentButton && currentProduct) {
        updateProductWishlistButton();
    }

    const productButtons = document.querySelectorAll(".product-wishlist");
    productButtons.forEach(button => {
        const buttonId = Number(button.dataset.wishlistId);
        if (buttonId === productId) {
            if (wishlist.includes(productId)) {
                button.classList.add("active");
                button.innerHTML = '<i class="fa-solid fa-heart"></i>';
            } else {
                button.classList.remove("active");
                button.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        }
    });

}


/* =========================================
   PRODUCT PAGE WISHLIST
========================================= */

function toggleProductWishlist() {

    if (!currentProduct) {
        return;
    }

    addToWishlist(currentProduct.id);

}


function updateProductWishlistButton() {

    const button =
        document.getElementById(
            "productWishlistButton"
        );

    if (!button || !currentProduct) {
        return;
    }


    const wishlist = getWishlist();

    const isWishlisted =
        wishlist.includes(
            Number(currentProduct.id)
        );


    if (isWishlisted) {

        button.classList.add("active");

        button.innerHTML =
            `<i class="fa-solid fa-heart"></i>`;

    } else {

        button.classList.remove("active");

        button.innerHTML =
            `<i class="fa-regular fa-heart"></i>`;

    }

}


/* =========================================
   WISHLIST COUNT
========================================= */

function updateWishlistCount() {

    const countElement =
        document.getElementById("wishlistCount");

    if (!countElement) {
        return;
    }

    const wishlist = getWishlist();

    countElement.textContent =
        wishlist.length;

}


/* =========================================
   CART COUNT
========================================= */

function updateCartCount() {

    const countElement =
        document.getElementById("cartCount");

    if (!countElement) {
        return;
    }


    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total + Number(item.quantity || 0),
            0
        );


    countElement.textContent =
        totalQuantity;

}


/* =========================================
   RELATED PRODUCTS
========================================= */

function loadRelatedProducts(product) {

    const container =
        document.getElementById(
            "relatedProductsGrid"
        );

    if (!container || typeof products === "undefined") {
        return;
    }


    let relatedProducts =
        products.filter(item =>
            item.id !== product.id &&
            String(item.category || item.categorySlug || "") ===
            String(product.category || product.categorySlug || "")
        );


    if (relatedProducts.length < 4) {

        const additionalProducts =
            products.filter(item =>
                item.id !== product.id &&
                !relatedProducts.includes(item)
            );

        relatedProducts =
            relatedProducts.concat(
                additionalProducts
            );

    }


    relatedProducts =
        relatedProducts.slice(0, 4);


    container.innerHTML =
        relatedProducts
            .map(product => createHomepageProductCard(product))
            .join("");

}


/* =========================================
   MOBILE MENU
========================================= */

function setupMobileMenu() {

    const menuButton =
        document.getElementById("mobileMenuBtn") ||
        document.getElementById("mobileMenuButton");

    const navMenu =
        document.getElementById("navMenu") ||
        document.querySelector(".mobile-menu");


    if (!menuButton || !navMenu) {
        return;
    }

    menuButton.addEventListener("click", () => {

        if (navMenu.classList.contains("active") || navMenu.classList.contains("show")) {
            navMenu.classList.remove("active", "show");
        } else {
            navMenu.classList.add("active", "show");
        }

        const icon =
            menuButton.querySelector("i");

        if (icon) {
            if (navMenu.classList.contains("active") || navMenu.classList.contains("show")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        }

    });

}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    const openSearch =
        document.getElementById("openSearch") ||
        document.getElementById("searchButton");

    const closeSearch =
        document.getElementById("closeSearch") ||
        document.getElementById("searchClose");

    const overlay =
        document.getElementById("searchOverlay");

    const input =
        document.getElementById("searchInput");

    const submit =
        document.getElementById("searchSubmit");


    if (!overlay || !openSearch) {
        return;
    }

    const openOverlay = () => {
        overlay.classList.add("active");
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
    };

    const closeOverlay = () => {
        overlay.classList.remove("active");
    };

    openSearch.addEventListener("click", openOverlay);

    if (closeSearch) {
        closeSearch.addEventListener("click", closeOverlay);
    }

    if (submit) {
        submit.addEventListener("click", () => {
            if (input && input.value.trim()) {
                closeOverlay();
            }
        });
    }

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeOverlay();
        }
    });

}


/* =========================================
   NEWSLETTER
========================================= */

function setupNewsletter() {

    const form =
        document.getElementById("newsletterForm");

    if (!form) {
        return;
    }


    form.addEventListener("submit", event => {

        event.preventDefault();

        showToast(
            "Thank you for subscribing!"
        );

        form.reset();

    });

}


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById("toastMessage") || toast;


    if (!toast) {
        return;
    }


    toastMessage.textContent = message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =========================================
   HERO BESTSELLER CARD (real top-rated product)
========================================= */

function setupHeroBestseller() {

    const card = document.getElementById("heroBestseller");

    if (!card || typeof products === "undefined" || !Array.isArray(products)) {
        return;
    }

    const top = [...products]
        .filter(p => p && p.rating)
        .sort((a, b) => (b.rating - a.rating) || ((b.reviews || 0) - (a.reviews || 0)))[0];

    if (!top) {
        return;
    }

    const img = (typeof getProductImage === "function")
        ? getProductImage(top)
        : (top.image || "assets/images/products/placeholder.jpg");

    const price = (typeof formatPrice === "function")
        ? formatPrice(top.price)
        : ("\u20b9" + top.price);

    card.innerHTML = `
        <img src="${img}" alt="${top.name}"
             onerror="this.src='assets/images/products/placeholder.jpg'">
        <span class="hero-card-text">
            <span class="hero-card-label">Bestseller</span>
            <strong>${top.name}</strong>
            <span class="hero-card-meta">${price} &middot; <i class="fa-solid fa-star"></i> ${top.rating} (${top.reviews || 0})</span>
        </span>`;

    card.addEventListener("click", () => {
        window.location.href = `product-details.html?id=${top.id}`;
    });
}


/* =========================================
   PROMO BANNER (real max discount)
========================================= */

function setupPromoBanner() {

    if (typeof products === "undefined" || !Array.isArray(products)) {
        return;
    }

    let best = null;
    let bestDiscount = 0;

    products.forEach(p => {
        const d = (typeof getDiscountPercentage === "function")
            ? getDiscountPercentage(p) : 0;
        if (d > bestDiscount) {
            bestDiscount = d;
            best = p;
        }
    });

    if (!best || bestDiscount <= 0) {
        return;
    }

    const title = document.getElementById("promoTitle");
    const sub = document.getElementById("promoSub");
    const img = document.getElementById("promoImage");

    if (title) {
        title.innerHTML = `Up to ${bestDiscount}% off<br>top-rated picks`;
    }

    if (sub) {
        sub.textContent =
            `Including the ${best.name} \u2014 rated ${best.rating}/5 by ${best.reviews || 0} customers.`;
    }

    if (img) {
        img.src = (typeof getProductImage === "function")
            ? getProductImage(best)
            : best.image;
        img.alt = best.name;
        img.onerror = function () {
            this.src = "assets/images/products/placeholder.jpg";
        };
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
            window.location.href = `product-details.html?id=${best.id}`;
        });
    }
}


/* =========================================
   CATEGORY PRODUCT COUNTS (real numbers)
========================================= */

function setupCategoryCounts() {

    if (typeof products === "undefined" || !Array.isArray(products)) {
        return;
    }

    document.querySelectorAll("[data-count-for]").forEach(el => {
        const cat = el.getAttribute("data-count-for");
        el.textContent = products.filter(p => p.category === cat).length;
    });
}
