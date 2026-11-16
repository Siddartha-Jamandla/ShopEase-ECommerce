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
   GET SAVED FOR LATER
   Same persistence model as the cart itself: localStorage,
   so it works for guests and signed-in users alike and
   survives reloads. Saved items keep their quantity and
   selected options (size / color), which the wishlist
   (product ids only) cannot hold.
========================================================= */

function getSavedForLaterItems() {

    try {

        const saved = JSON.parse(
            localStorage.getItem("savedForLater")
        );

        return Array.isArray(saved) ? saved : [];

    } catch (error) {

        console.error("Unable to read saved items:", error);

        return [];

    }
}


/* =========================================================
   SAVE SAVED FOR LATER
========================================================= */

function saveSavedForLaterItems(saved) {

    localStorage.setItem(
        "savedForLater",
        JSON.stringify(saved)
    );

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


    /* Saved for later is independent of the cart contents,
       so it renders even when the cart is empty. */

    renderSavedForLater();


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
                        class="cart-save-later"
                        onclick="
                            saveCartItemForLater(
                                ${product.id}
                            )
                        "
                    >

                        <i class="fa-regular fa-bookmark"></i>

                        Save for later

                    </button>


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
   SAVE FOR LATER
   Move a cart item to the saved list. The item keeps its
   quantity and selected options. Saving an item that is
   already saved just removes it from the cart (no duplicate
   saved entries).
========================================================= */

function saveCartItemForLater(productId) {

    const product =
        findProduct(productId);


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


    const saved =
        getSavedForLaterItems();


    const alreadySaved =
        saved.some(function (savedItem) {

            return Number(savedItem.id) ===
                Number(productId);

        });


    if (!alreadySaved) {

        saved.push({
            id: item.id,
            quantity: Math.max(
                1,
                Number(item.quantity || 1)
            ),
            size: item.size,
            color: item.color,
        });

        saveSavedForLaterItems(saved);

    }


    removeCartItem(productId);


    if (typeof showToast === "function") {

        showToast(
            product
                ? `${product.name} saved for later.`
                : "Product saved for later."
        );

    }

}


/* =========================================================
   MOVE SAVED ITEM TO CART
   Restores a saved item to the cart with its saved
   quantity and options. If the product is already in the
   cart, the quantities merge (capped at 10, the cart max).
========================================================= */

function moveSavedItemToCart(productId) {

    const product =
        findProduct(productId);


    const saved =
        getSavedForLaterItems();


    const savedItem =
        saved.find(function (item) {

            return Number(item.id) ===
                Number(productId);

        });


    if (!savedItem) {
        return;
    }


    saveSavedForLaterItems(
        saved.filter(function (item) {

            return Number(item.id) !==
                Number(productId);

        })
    );


    const cart =
        getCartItems();


    const existingItem =
        cart.find(function (cartItem) {

            return Number(cartItem.id) ===
                Number(productId);

        });


    if (existingItem) {

        existingItem.quantity =
            Math.min(
                10,
                Math.max(1, Number(existingItem.quantity || 1)) +
                Math.max(1, Number(savedItem.quantity || 1))
            );

    } else {

        cart.push({
            id: savedItem.id,
            quantity: Math.min(
                10,
                Math.max(1, Number(savedItem.quantity || 1))
            ),
            size: savedItem.size,
            color: savedItem.color,
        });

    }


    saveCartItems(cart);

    renderCart();


    if (typeof showToast === "function") {

        showToast(
            product
                ? `${product.name} moved back to cart.`
                : "Product moved back to cart."
        );

    }

}


/* =========================================================
   REMOVE SAVED ITEM
   Deletes a saved item permanently (it does not go back
   to the cart).
========================================================= */

function removeSavedItem(productId) {

    const product =
        findProduct(productId);


    const saved =
        getSavedForLaterItems();


    const itemExists =
        saved.some(function (item) {

            return Number(item.id) ===
                Number(productId);

        });


    if (!itemExists) {
        return;
    }


    saveSavedForLaterItems(
        saved.filter(function (item) {

            return Number(item.id) !==
                Number(productId);

        })
    );


    renderCart();


    if (typeof showToast === "function") {

        showToast(
            product
                ? `${product.name} removed from saved items.`
                : "Product removed from saved items."
        );

    }

}


/* =========================================================
   RENDER SAVED FOR LATER
========================================================= */

function renderSavedForLater() {

    const section =
        document.getElementById("savedForLaterSection");

    const container =
        document.getElementById("savedForLaterItems");

    const countElement =
        document.getElementById("savedForLaterCount");


    if (!section || !container) {
        return;
    }


    let saved = getSavedForLaterItems();


    /* -----------------------------------------------------
       Remove invalid products
    ----------------------------------------------------- */

    saved = saved.filter(function (item) {

        /* findProduct returns undefined (not null) for an
           unknown id, so test for both. */

        return findProduct(item.id) != null;

    });


    saveSavedForLaterItems(saved);


    if (saved.length === 0) {

        section.style.display = "none";

        container.innerHTML = "";

        return;
    }


    section.style.display = "block";


    if (countElement) {

        countElement.textContent =
            `${saved.length} ${
                saved.length === 1
                    ? "item"
                    : "items"
            }`;

    }


    container.innerHTML = saved.map(function (item) {

        const product =
            findProduct(item.id);

        const quantity =
            Math.max(
                1,
                Number(item.quantity || 1)
            );


        return `
            <article
                class="cart-item saved-item"
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

                            <span class="cart-option">
                                Qty: ${quantity}
                            </span>

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


                <!-- Move to Cart / Remove -->
                <div class="cart-item-actions">

                    <button
                        type="button"
                        class="saved-move-to-cart"
                        onclick="
                            moveSavedItemToCart(
                                ${product.id}
                            )
                        "
                    >

                        <i class="fa-solid fa-cart-shopping"></i>

                        Move to cart

                    </button>


                    <button
                        type="button"
                        class="cart-remove"
                        onclick="
                            removeSavedItem(
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