/* =========================================
   CHECKOUT SYSTEM
========================================= */

let checkoutSubtotalValue = 0;
let checkoutDiscountValue = 0;
let checkoutShippingValue = 0;
let checkoutPromoCode = "";


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeCheckout();

    setupPaymentOptions();

    setupCheckoutForm();

    loadSavedAddresses();

});


/* =========================================
   INITIALIZE CHECKOUT
========================================= */

function initializeCheckout() {

    const form =
        document.getElementById("checkoutForm");

    if (!form) {
        return;
    }


    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    if (cart.length === 0) {

        form.style.display = "none";

        const empty =
            document.getElementById("checkoutEmpty");

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    renderCheckoutProducts(cart);

    calculateCheckoutTotal();

}


/* =========================================
   RENDER PRODUCTS
========================================= */

function renderCheckoutProducts(cart) {

    const container =
        document.getElementById(
            "checkoutProductList"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    cart.forEach(item => {

        const product =
            products.find(
                product =>
                    Number(product.id) ===
                    Number(item.id)
            );


        if (!product) {
            return;
        }


        const quantity =
            Number(item.quantity) || 1;


        const itemTotal =
            product.price * quantity;


        const imagePath =
            getProductImage(product);


        const productElement =
            document.createElement("div");


        productElement.className =
            "checkout-product";


        productElement.innerHTML = `

            <div class="checkout-product-image">

                <img
                    src="${imagePath}"
                    alt="${product.name}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                >

                <i
                    class="fa-solid ${product.icon}"
                    style="display:none;"
                ></i>

            </div>


            <div class="checkout-product-info">

                <strong>
                    ${product.name}
                </strong>

                <span>
                    Qty: ${quantity}
                    ${
                        item.size
                            ? ` • ${item.size}`
                            : ""
                    }
                    ${
                        item.color
                            ? ` • ${item.color}`
                            : ""
                    }
                </span>

            </div>


            <div class="checkout-product-price">

                ₹${itemTotal.toLocaleString("en-IN")}

            </div>

        `;


        container.appendChild(productElement);

    });

}


/* =========================================
   CALCULATE TOTAL
========================================= */

function calculateCheckoutTotal() {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    let subtotal = 0;


    cart.forEach(item => {

        const product =
            products.find(
                product =>
                    Number(product.id) ===
                    Number(item.id)
            );


        if (!product) {
            return;
        }


        subtotal +=
            product.price *
            Number(item.quantity || 1);

    });


    checkoutSubtotalValue =
        subtotal;


    checkoutShippingValue =
        subtotal >= 999
            ? 0
            : 99;


    const total =
        subtotal +
        checkoutShippingValue -
        checkoutDiscountValue;


    updateCheckoutDisplay(
        subtotal,
        checkoutShippingValue,
        checkoutDiscountValue,
        total
    );

}


/* =========================================
   UPDATE DISPLAY
========================================= */

function updateCheckoutDisplay(
    subtotal,
    shipping,
    discount,
    total
) {

    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const shippingElement =
        document.getElementById(
            "checkoutShipping"
        );

    const discountElement =
        document.getElementById(
            "checkoutDiscount"
        );

    const discountRow =
        document.getElementById(
            "discountRow"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            `₹${subtotal.toLocaleString("en-IN")}`;

    }


    if (shippingElement) {

        shippingElement.textContent =
            shipping === 0
                ? "FREE"
                : `₹${shipping.toLocaleString("en-IN")}`;

    }


    if (discountRow && discountElement) {

        if (discount > 0) {

            discountRow.style.display =
                "flex";

            discountElement.textContent =
                `-₹${discount.toLocaleString("en-IN")}`;

        } else {

            discountRow.style.display =
                "none";

        }

    }


    if (totalElement) {

        totalElement.textContent =
            `₹${Math.max(0, total).toLocaleString("en-IN")}`;

    }

}


/* =========================================
   COUPON
========================================= */

function applyCoupon() {

    const input =
        document.getElementById(
            "couponInput"
        );

    const message =
        document.getElementById(
            "couponMessage"
        );


    if (!input || !message) {
        return;
    }


    const coupon =
        input.value
            .trim()
            .toUpperCase();


    if (!coupon) {

        message.textContent =
            "Please enter a coupon code.";

        message.className =
            "coupon-message coupon-error";

        return;

    }


    /* No hardcoded demo codes: promo codes live on the server (an admin
       creates them at /api/admin/promo-codes). The code is remembered
       here and validated by POST /api/checkout when the order is placed
       — an unknown, expired or fully-used code, or a subtotal below its
       minimum, is rejected there and the order is not placed. Any local
       preview discount is cleared so the summary never shows money the
       server has not confirmed. */
    checkoutPromoCode = coupon;

    checkoutDiscountValue = 0;

    calculateCheckoutTotal();

    message.textContent =
        "Code " + coupon + " saved — it will be verified when you place the order.";

    message.className =
        "coupon-message coupon-success";

}


/* =========================================
   PAYMENT OPTIONS
========================================= */

function setupPaymentOptions() {

    const options =
        document.querySelectorAll(
            ".payment-option"
        );


    options.forEach(option => {

        const radio =
            option.querySelector(
                "input[type='radio']"
            );


        if (!radio) {
            return;
        }


        radio.addEventListener(
            "change",
            () => {

                options.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                if (radio.checked) {

                    option.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


/* =========================================
   FORM
========================================= */

function setupCheckoutForm() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (!validateCheckoutForm()) {
                return;
            }


            placeOrder();

        }
    );

}


/* =========================================
   VALIDATION
========================================= */

function validateCheckoutForm() {

    const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "pincode"
    ];


    let valid = true;


    requiredFields.forEach(fieldId => {

        const field =
            document.getElementById(fieldId);


        if (!field) {
            return;
        }


        removeFieldError(field);


        if (!field.value.trim()) {

            showFieldError(
                field,
                "This field is required."
            );

            valid = false;

        }

    });


    /* Email */

    const email =
        document.getElementById("email");


    if (
        email &&
        email.value.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email.value.trim()
        )
    ) {

        showFieldError(
            email,
            "Enter a valid email address."
        );

        valid = false;

    }


    /* Phone */

    const phone =
        document.getElementById("phone");


    if (
        phone &&
        !/^[6-9]\d{9}$/.test(
            phone.value.trim()
        )
    ) {

        showFieldError(
            phone,
            "Enter a valid 10-digit mobile number."
        );

        valid = false;

    }


    /* PIN */

    const pincode =
        document.getElementById("pincode");


    if (
        pincode &&
        !/^\d{6}$/.test(
            pincode.value.trim()
        )
    ) {

        showFieldError(
            pincode,
            "Enter a valid 6-digit PIN code."
        );

        valid = false;

    }


    if (!valid) {

        showToast(
            "Please correct the highlighted fields."
        );

    }


    return valid;

}


/* =========================================
   FIELD ERROR
========================================= */

function showFieldError(
    field,
    message
) {

    field.style.borderColor =
        "#dc3545";


    const error =
        document.createElement("span");


    error.className =
        "form-error";


    error.textContent =
        message;


    field.parentElement.appendChild(
        error
    );

}


function removeFieldError(field) {

    field.style.borderColor = "";


    const oldError =
        field.parentElement.querySelector(
            ".form-error"
        );


    if (oldError) {
        oldError.remove();
    }

}


/* =========================================
   SAVED ADDRESSES
========================================= */

/* Signed-in shoppers can pick one of their saved addresses
   (GET /api/addresses) instead of typing it again. Choosing one
   fills the contact + delivery fields; typing stays available. */
function loadSavedAddresses() {

    const select =
        document.getElementById(
            "savedAddressSelect"
        );

    const row =
        document.getElementById(
            "savedAddressRow"
        );

    if (!select || !row) {
        return;
    }


    const token =
        localStorage.getItem("shopease_token");

    if (!token) {
        return;
    }


    const apiBase =
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
            ? "http://localhost:8000"
            : "";


    fetch(apiBase + "/api/addresses", {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(function (res) { return res.json(); })
        .then(function (payload) {

            const list =
                (payload && Array.isArray(payload.data))
                    ? payload.data
                    : [];

            if (!list.length) {
                return;
            }

            list.forEach(function (a) {

                const opt =
                    document.createElement("option");

                opt.value = a.id;

                opt.textContent =
                    (a.label ? a.label + " — " : "") +
                    (a.full_name || "") + ", " +
                    (a.city || "");

                opt.dataset.address =
                    JSON.stringify(a);

                select.appendChild(opt);

            });

            row.hidden = false;

            select.addEventListener("change", function () {

                const chosen =
                    select.options[select.selectedIndex];

                if (!chosen || !chosen.dataset.address) {
                    return;
                }

                fillAddressForm(
                    JSON.parse(chosen.dataset.address)
                );

            });

        })
        .catch(function () {
            /* Addresses stay hidden; typing still works. */
        });

}


function fillAddressForm(a) {

    const setValue = function (id, value) {

        const el = document.getElementById(id);

        if (el && value !== undefined && value !== null) {
            el.value = value;
        }

    };

    const parts =
        String(a.full_name || "").trim().split(/\s+/);

    setValue("firstName", parts[0] || "");
    setValue("lastName", parts.slice(1).join(" "));

    setValue(
        "address",
        [a.address_line1, a.address_line2]
            .filter(Boolean)
            .join(", ")
    );

    setValue("city", a.city);
    setValue("state", a.state);
    setValue("pincode", a.pincode);

}


/* =========================================
   PLACE ORDER
========================================= */

async function placeOrder() {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    if (cart.length === 0) {

        showToast(
            "Your cart is empty."
        );

        return;

    }


    const form =
        document.getElementById(
            "checkoutForm"
        );


    const formData =
        new FormData(form);


    /* Delivery address, as typed on the form - sent to the backend so the
       order persists with its shipping address (see POST /api/checkout). */
    const shipping = {

        name:
            `${formData.get("firstName") || ""} ${formData.get("lastName") || ""}`.trim(),

        address:
            formData.get("address"),

        city:
            formData.get("city"),

        state:
            formData.get("state"),

        pincode:
            formData.get("pincode"),

        phone:
            formData.get("phone")

    };


    /* The storefront cart lives in localStorage, so the order is placed
       with an explicit items list (prices snapshotted server-side). */
    const items =
        cart.map(item => ({
            product_id: Number(item.id),
            quantity: Number(item.quantity) || 1
        }));


    const orderId =
        "SE" +
        Date.now().toString().slice(-8);


    const order = {

        id: orderId,

        date:
            new Date().toISOString(),

        customer: {

            firstName:
                formData.get("firstName"),

            lastName:
                formData.get("lastName"),

            email:
                formData.get("email"),

            phone:
                formData.get("phone"),

            address:
                formData.get("address"),

            city:
                formData.get("city"),

            state:
                formData.get("state"),

            pincode:
                formData.get("pincode")

        },

        payment:
            formData.get("payment"),

        items:
            cart,

        subtotal:
            checkoutSubtotalValue,

        shipping:
            checkoutShippingValue,

        discount:
            checkoutDiscountValue,

        total:
            Math.max(
                0,
                checkoutSubtotalValue +
                checkoutShippingValue -
                checkoutDiscountValue
            ),

        status:
            "Confirmed"

    };


    /* Persist the order to the backend when signed in, so the order
       (with its shipping address and item summary) lives in the
       database and shows up in My Orders. Guests / offline checkouts
       keep the previous device-only behaviour. */
    const token =
        localStorage.getItem("shopease_token");


    if (token) {

        try {

            const apiBase =
                (window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1")
                    ? "http://localhost:8000"
                    : "";


            const checkoutBody = { shipping, items };

            if (checkoutPromoCode) {
                checkoutBody.promo_code = checkoutPromoCode;
            }


            const res = await fetch(apiBase + "/api/checkout", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify(checkoutBody)

            });


            const payload = await res.json();


            if (!res.ok || payload.ok === false) {

                const errMsg =
                    (payload && payload.error) ||
                        ("Checkout failed (" + res.status + ")");

                /* A rejected promo code stops the order here: saving it
                   locally and redirecting to "success" would pretend the
                   server accepted a code it refused. */
                if (checkoutPromoCode && /promo/i.test(errMsg)) {

                    const couponMessage =
                        document.getElementById("couponMessage");

                    if (couponMessage) {

                        couponMessage.textContent = errMsg;

                        couponMessage.className =
                            "coupon-message coupon-error";

                    }

                    showToast(errMsg);

                    return;

                }

                throw new Error(errMsg);

            }


            order.id = "SE" + payload.data.id;
            order.backend_order_id = payload.data.id;

            /* The server is the authority on the discount: use its
               figures, not the local preview. */
            if (payload.data) {

                order.discount =
                    Number(payload.data.discount_amount || 0);

                order.total =
                    Number(payload.data.total || order.total);

                order.promo_code =
                    payload.data.promo_code || checkoutPromoCode || "";

            }

        } catch (e) {

            showToast(
                "Could not save this order to your account - saved on this device only."
            );

        }

    }


    /* Save order */

    const orders =
        JSON.parse(
            localStorage.getItem("orders")
        ) || [];


    orders.unshift(order);


    localStorage.setItem(
        "orders",
        JSON.stringify(orders)
    );


    /* Save latest order */

    localStorage.setItem(
        "latestOrder",
        JSON.stringify(order)
    );


    /* Empty cart */

    localStorage.removeItem("cart");


    /* Go to success page */

    window.location.href =
        "order-success.html";

}