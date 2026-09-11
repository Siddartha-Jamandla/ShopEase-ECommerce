/* =========================================
   CHECKOUT SYSTEM
========================================= */

let checkoutSubtotalValue = 0;
let checkoutDiscountValue = 0;
let checkoutShippingValue = 0;


/* =========================================
   INITIALIZE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeCheckout();

    setupPaymentOptions();

    setupCheckoutForm();

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


    /*
        Demo coupon codes:

        SHOPEASE10 = 10% discount
        SAVE200 = ₹200 discount
    */


    if (coupon === "SHOPEASE10") {

        checkoutDiscountValue =
            Math.round(
                checkoutSubtotalValue * 0.10
            );


        message.textContent =
            "Coupon applied! You saved 10%.";

        message.className =
            "coupon-message coupon-success";


        input.disabled = true;

        calculateCheckoutTotal();

        return;

    }


    if (coupon === "SAVE200") {

        if (checkoutSubtotalValue < 1000) {

            message.textContent =
                "SAVE200 requires a minimum order of ₹1,000.";

            message.className =
                "coupon-message coupon-error";

            return;

        }


        checkoutDiscountValue =
            200;


        message.textContent =
            "Coupon applied! You saved ₹200.";

        message.className =
            "coupon-message coupon-success";


        input.disabled = true;

        calculateCheckoutTotal();

        return;

    }


    message.textContent =
        "Invalid coupon code.";

    message.className =
        "coupon-message coupon-error";

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
   PLACE ORDER
========================================= */

function placeOrder() {

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