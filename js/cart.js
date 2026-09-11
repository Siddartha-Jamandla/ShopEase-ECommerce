/* =========================================================
   ShopEase - Shopping Cart
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    renderCart();

    setupCartEvents();
});


/* =========================================================
   CART EVENTS
========================================================= */

function setupCartEvents() {

    const clearButton = document.getElementById("clearCartButton");

    if (clearButton) {
        clearButton.addEventListener("click", clearCart);
    }


    const checkoutButton = document.getElementById("checkoutButton");

    if (checkoutButton) {
        checkoutButton.addEventListener(
            "click",
            proceedToCheckout
        );
    }
}


/* =========================================================
   GET CART
========================================================= */

function getCartItems() {

    try {

        const cart = JSON.parse(
            localStorage.getItem("cart")
        );

        return Array.isArray(cart) ? cart : [];

    } catch (error) {

        console.error("Unable to read cart:", error);

        return [];

    }
}


/* =========================================================
   SAVE CART
========================================================= */

function saveCartItems(cart) {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    if (typeof updateCartCount === "function") {
        updateCartCount();
    }
}


/* =========================================================
   FIND PRODUCT
========================================================= */

function findProduct(productId) {

    if (typeof products === "undefined") {
        return null;
    }

    return products.find(
        product =>
            Number(product.id) === Number(productId)
    );
}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const container =
        document.getElementById("cartItems");

    const emptyCart =
        document.getElementById("emptyCart");

    const summary =
        document.querySelector(".cart-summary");


    if (!container) {
        return;
    }


    let cart = getCartItems();


    /* -----------------------------------------------------
       Remove invalid products
    ----------------------------------------------------- */

    cart = cart.filter(function (item) {

        return findProduct(item.id) !== null;

    });


    saveCartItems(cart);


    /* -----------------------------------------------------
       EMPTY CART
    ----------------------------------------------------- */

    if (cart.length === 0) {

        container.innerHTML = "";

        if (emptyCart) {
            emptyCart.style.display = "block";
        }

        if (summary) {
            summary.style.display = "none";
        }

        updateCartItemCount(0);

        updateCartSummary(0);

        return;
    }


    /* -----------------------------------------------------
       SHOW CART
    ----------------------------------------------------- */

    if (emptyCart) {
        emptyCart.style.display = "none";
    }

    if (summary) {
        summary.style.display = "block";
    }


    /* -----------------------------------------------------
       CART ITEMS HTML
    ----------------------------------------------------- */

    container.innerHTML = cart.map(function (item) {

        const product =
            findProduct(item.id);

        const quantity =
            Math.max(
                1,
                Number(item.quantity || 1)
            );


        return `
            <article
                class="cart-item"
                data-product-id="${product.id}"
            >

                <!-- Product Image -->
                <div class="cart-item-image">

                    <img
                        src="${getProductImage(product)}"
                        alt="${product.name}"
                        onerror="
                            this.style.display='none';
                            this.nextElementSibling.style.display='flex';
                        "
                    >

                    <div
                        class="cart-item-image-fallback"
                        style="display:none;"
                    >
                        <i class="fa-solid ${product.icon}"></i>
                    </div>

                </div>


                <!-- Product Details -->
                <div class="cart-item-details">

                    <div>

                        <span class="cart-item-category">
                            ${product.category}
                        </span>

                        <h3 class="cart-item-name">

                            <a
                                href="product-details.html?id=${product.id}"
                            >
                                ${product.name}
                            </a>

                        </h3>

                        <div class="cart-item-brand">
                            ${product.brand}
                        </div>


                        <!-- Selected Options -->
                        <div class="cart-item-options">

                            ${
                                item.size
                                    ? `
                                        <span class="cart-option">
                                            Size: ${item.size}
                                        </span>
                                      `
                                    : ""
                            }

                            ${
                                item.color
                                    ? `
                                        <span class="cart-option">
                                            Color: ${item.color}
                                        </span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>


                    <!-- Price -->
                    <div class="cart-item-price">

                        <span class="cart-current-price">
                            ${formatCurrency(product.price)}
                        </span>

                        ${
                            product.oldPrice
                                ? `
                                    <span class="cart-old-price">
                                        ${formatCurrency(
                                            product.oldPrice
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <!-- Quantity / Remove -->
                <div class="cart-item-actions">

                    <div>

                        <div class="cart-quantity-label">
                            Quantity
                        </div>

                        <div class="cart-quantity">

                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                onclick="
                                    changeCartQuantity(
                                        ${product.id},
                                        -1
                                    )
                                "
                            >
                                −
                            </button>


                            <span>
                                ${quantity}
                            </span>


                            <button
                                type="button"
                                aria-label="Increase quantity"
                                onclick="
                                    changeCartQuantity(
                                        ${product.id},
                                        1
                                    )
                                "
                            >
                                +
                            </button>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="cart-remove"
                        onclick="
                            removeCartItem(
                                ${product.id}
                            )
                        "
                    >

                        <i class="fa-regular fa-trash-can"></i>

                        Remove

                    </button>

                </div>

            </article>
        `;

    }).join("");


    /* -----------------------------------------------------
       CALCULATE TOTALS
    ----------------------------------------------------- */

    let totalQuantity = 0;
    let subtotal = 0;


    cart.forEach(function (item) {

        const product =
            findProduct(item.id);

        const quantity =
            Math.max(
                1,
                Number(item.quantity || 1)
            );


        totalQuantity += quantity;

        subtotal +=
            Number(product.price) * quantity;

    });


    updateCartItemCount(
        totalQuantity
    );


    updateCartSummary(
        subtotal
    );

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeCartQuantity(
    productId,
    change
) {

    const cart =
        getCartItems();


    const item =
        cart.find(function (cartItem) {

            return Number(cartItem.id) ===
                Number(productId);

        });


    if (!item) {
        return;
    }


    const currentQuantity =
        Math.max(
            1,
            Number(item.quantity || 1)
        );


    const newQuantity =
        currentQuantity +
        Number(change);


    /* -----------------------------------------------------
       Prevent quantity below 1
    ----------------------------------------------------- */

    if (newQuantity < 1) {

        removeCartItem(productId);

        return;
    }


    /* -----------------------------------------------------
       Optional maximum quantity
    ----------------------------------------------------- */

    if (newQuantity > 10) {

        if (typeof showToast === "function") {

            showToast(
                "Maximum quantity is 10."
            );

        }

        return;
    }


    item.quantity =
        newQuantity;


    saveCartItems(cart);

    renderCart();


    if (typeof showToast === "function") {

        showToast(
            "Cart updated."
        );

    }

}


/* =========================================================
   REMOVE ITEM
========================================================= */

function removeCartItem(productId) {

    const product =
        findProduct(productId);


    let cart =
        getCartItems();


    const itemExists =
        cart.some(function (item) {

            return Number(item.id) ===
                Number(productId);

        });


    if (!itemExists) {
        return;
    }


    cart =
        cart.filter(function (item) {

            return Number(item.id) !==
                Number(productId);

        });


    saveCartItems(cart);

    renderCart();


    if (typeof showToast === "function") {

        showToast(
            product
                ? `${product.name} removed from cart.`
                : "Product removed from cart."
        );

    }

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

    const cart =
        getCartItems();


    if (!cart.length) {

        if (typeof showToast === "function") {

            showToast(
                "Your cart is already empty."
            );

        }

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to clear your cart?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "cart"
    );


    if (typeof updateCartCount === "function") {
        updateCartCount();
    }


    renderCart();


    if (typeof showToast === "function") {

        showToast(
            "Your cart has been cleared."
        );

    }

}


/* =========================================================
   UPDATE ITEM COUNT
========================================================= */

function updateCartItemCount(
    count
) {

    const element =
        document.getElementById(
            "cartItemsCount"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `${count} ${
            count === 1
                ? "item"
                : "items"
        }`;

}


/* =========================================================
   UPDATE CART SUMMARY
========================================================= */

function updateCartSummary(
    subtotal
) {

    subtotal =
        Number(subtotal || 0);


    /* -----------------------------------------------------
       Shipping
       Free shipping above ₹999
    ----------------------------------------------------- */

    let shipping = 0;


    if (subtotal === 0) {

        shipping = 0;

    } else if (subtotal >= 999) {

        shipping = 0;

    } else {

        shipping = 99;

    }


    const total =
        subtotal +
        shipping;


    /* -----------------------------------------------------
       Update HTML
    ----------------------------------------------------- */

    const subtotalElement =
        document.getElementById(
            "cartSubtotal"
        );


    const shippingElement =
        document.getElementById(
            "cartShipping"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    const shippingMessage =
        document.getElementById(
            "shippingMessage"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatCurrency(subtotal);

    }


    if (shippingElement) {

        shippingElement.textContent =
            shipping === 0 && subtotal > 0
                ? "FREE"
                : formatCurrency(shipping);

    }


    if (totalElement) {

        totalElement.textContent =
            formatCurrency(total);

    }


    /* -----------------------------------------------------
       Shipping Message
    ----------------------------------------------------- */

    if (shippingMessage) {

        if (subtotal === 0) {

            shippingMessage.className =
                "shipping-message";

            shippingMessage.innerHTML = `
                <i class="fa-solid fa-truck"></i>
                Add products to your cart to calculate shipping.
            `;

        }

        else if (shipping === 0) {

            shippingMessage.className =
                "free-shipping-message";

            shippingMessage.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                You qualify for free shipping!
            `;

        }

        else {

            const remaining =
                999 - subtotal;


            shippingMessage.className =
                "shipping-message";


            shippingMessage.innerHTML = `
                <i class="fa-solid fa-truck"></i>
                Add
                <strong>
                    ${formatCurrency(remaining)}
                </strong>
                more for free shipping.
            `;

        }

    }

}


/* =========================================================
   PROCEED TO CHECKOUT
========================================================= */

function proceedToCheckout() {

    const cart =
        getCartItems();


    if (!cart.length) {

        if (typeof showToast === "function") {

            showToast(
                "Your cart is empty."
            );

        }

        return;
    }


    /* -----------------------------------------------------
       Check that all products still exist
    ----------------------------------------------------- */

    const validCart =
        cart.filter(function (item) {

            return findProduct(item.id) !== null;

        });


    if (!validCart.length) {

        localStorage.removeItem(
            "cart"
        );

        renderCart();

        if (typeof showToast === "function") {

            showToast(
                "Your cart contains unavailable products."
            );

        }

        return;
    }


    window.location.href =
        "checkout.html";

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCartCurrency(
    value
) {

    return "₹" +
        Number(value || 0)
            .toLocaleString("en-IN");

}


/* =========================================================
   USE GLOBAL FORMATTER IF AVAILABLE
========================================================= */

if (typeof formatCurrency !== "function") {

    window.formatCurrency =
        formatCartCurrency;

}