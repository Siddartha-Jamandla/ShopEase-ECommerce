/* =========================================
   ShopEase Authentication
   Front-End Demo Using LocalStorage
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    initializeAuthPage();

});


/* =========================================
   INITIALIZE
========================================= */

function initializeAuthPage() {

    setupPasswordToggles();
    setupLoginForm();
    setupRegisterForm();
    setupForgotPasswordForm();
    updateAccountLinks();

}


/* =========================================
   STORAGE HELPERS
========================================= */

function getUsers() {

    try {

        return JSON.parse(
            localStorage.getItem("shopEaseUsers")
        ) || [];

    } catch (error) {

        return [];

    }

}


function saveUsers(users) {

    localStorage.setItem(
        "shopEaseUsers",
        JSON.stringify(users)
    );

}


function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem("shopEaseCurrentUser")
        );

    } catch (error) {

        return null;

    }

}


/* =========================================
   PASSWORD VISIBILITY
========================================= */

function setupPasswordToggles() {

    const toggleButtons =
        document.querySelectorAll(".password-toggle");

    toggleButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const inputId = button.getAttribute("data-target");

            const input =
                document.getElementById(inputId);

            if (!input) {
                return;
            }

            if (input.type === "password") {

                input.type = "text";

                button.innerHTML =
                    '<i class="fa-solid fa-eye-slash"></i>';

            } else {

                input.type = "password";

                button.innerHTML =
                    '<i class="fa-solid fa-eye"></i>';

            }

        });

    });

}


/* =========================================
   LOGIN
========================================= */

function setupLoginForm() {

    const form =
        document.getElementById("loginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        clearAuthErrors();

        const email =
            document.getElementById("loginEmail")
                .value.trim()
                .toLowerCase();

        const password =
            document.getElementById("loginPassword")
                .value;

        let valid = true;


        if (!email) {

            showAuthError(
                "loginEmailError",
                "Please enter your email address."
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            showAuthError(
                "loginEmailError",
                "Please enter a valid email address."
            );

            valid = false;

        }


        if (!password) {

            showAuthError(
                "loginPasswordError",
                "Please enter your password."
            );

            valid = false;

        }


        if (!valid) {
            return;
        }


        const users = getUsers();

        const user = users.find(function (item) {

            return (
                item.email.toLowerCase() === email &&
                item.password === password
            );

        });


        if (!user) {

            showAuthError(
                "loginGeneralError",
                "Incorrect email or password."
            );

            return;

        }


        const currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || ""
        };


        localStorage.setItem(
            "shopEaseCurrentUser",
            JSON.stringify(currentUser)
        );


        showAuthSuccess(
            "loginGeneralSuccess",
            "Login successful! Redirecting..."
        );


        setTimeout(function () {

            const redirect =
                new URLSearchParams(window.location.search)
                    .get("redirect");

            window.location.href =
                redirect || "profile.html";

        }, 700);

    });

}


/* =========================================
   REGISTER
========================================= */

function setupRegisterForm() {

    const form =
        document.getElementById("registerForm");

    if (!form) {
        return;
    }


    form.addEventListener("submit", function (event) {

        event.preventDefault();

        clearAuthErrors();

        const name =
            document.getElementById("registerName")
                .value.trim();

        const email =
            document.getElementById("registerEmail")
                .value.trim()
                .toLowerCase();

        const phone =
            document.getElementById("registerPhone")
                .value.trim();

        const password =
            document.getElementById("registerPassword")
                .value;

        const confirmPassword =
            document.getElementById("registerConfirmPassword")
                .value;


        let valid = true;


        if (name.length < 2) {

            showAuthError(
                "registerNameError",
                "Please enter your full name."
            );

            valid = false;

        }


        if (!email) {

            showAuthError(
                "registerEmailError",
                "Please enter your email address."
            );

            valid = false;

        } else if (!isValidEmail(email)) {

            showAuthError(
                "registerEmailError",
                "Please enter a valid email address."
            );

            valid = false;

        }


        if (phone && !isValidPhone(phone)) {

            showAuthError(
                "registerPhoneError",
                "Enter a valid 10-digit Indian mobile number."
            );

            valid = false;

        }


        if (password.length < 6) {

            showAuthError(
                "registerPasswordError",
                "Password must contain at least 6 characters."
            );

            valid = false;

        }


        if (password !== confirmPassword) {

            showAuthError(
                "registerConfirmPasswordError",
                "Passwords do not match."
            );

            valid = false;

        }


        if (!valid) {
            return;
        }


        const users = getUsers();


        const existingUser = users.find(function (user) {

            return user.email.toLowerCase() === email;

        });


        if (existingUser) {

            showAuthError(
                "registerGeneralError",
                "An account with this email already exists."
            );

            return;

        }


        const newUser = {

            id: Date.now(),

            name: name,

            email: email,

            phone: phone,

            password: password,

            createdAt: new Date().toISOString()

        };


        users.push(newUser);

        saveUsers(users);


        const currentUser = {

            id: newUser.id,

            name: newUser.name,

            email: newUser.email,

            phone: newUser.phone

        };


        localStorage.setItem(
            "shopEaseCurrentUser",
            JSON.stringify(currentUser)
        );


        showAuthSuccess(
            "registerGeneralSuccess",
            "Account created successfully! Redirecting..."
        );


        setTimeout(function () {

            window.location.href = "profile.html";

        }, 800);

    });

}


/* =========================================
   FORGOT PASSWORD
========================================= */

function setupForgotPasswordForm() {

    const form =
        document.getElementById("forgotPasswordForm");

    if (!form) {
        return;
    }


    form.addEventListener("submit", function (event) {

        event.preventDefault();

        clearAuthErrors();


        const email =
            document.getElementById("forgotEmail")
                .value.trim()
                .toLowerCase();


        if (!email) {

            showAuthError(
                "forgotEmailError",
                "Please enter your email address."
            );

            return;

        }


        if (!isValidEmail(email)) {

            showAuthError(
                "forgotEmailError",
                "Please enter a valid email address."
            );

            return;

        }


        const users = getUsers();


        const user = users.find(function (item) {

            return item.email.toLowerCase() === email;

        });


        /*
         * This is only a front-end demo.
         * No real email is sent.
         */

        if (user) {

            showAuthSuccess(
                "forgotGeneralSuccess",
                "Password reset instructions would be sent to your email."
            );

        } else {

            showAuthSuccess(
                "forgotGeneralSuccess",
                "If an account exists for this email, reset instructions would be sent."
            );

        }

    });

}


/* =========================================
   VALIDATION
========================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


function isValidPhone(phone) {

    return /^[6-9]\d{9}$/.test(phone);

}


/* =========================================
   ERROR HELPERS
========================================= */

function showAuthError(elementId, message) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.add("show");

}


function showAuthSuccess(elementId, message) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.add("show");

}


function clearAuthErrors() {

    document
        .querySelectorAll(".form-error, .form-success")
        .forEach(function (element) {

            element.textContent = "";

            element.classList.remove("show");

        });

}


/* =========================================
   ACCOUNT LINKS
========================================= */

function updateAccountLinks() {

    const currentUser = getCurrentUser();

    const accountLinks =
        document.querySelectorAll(
            'a[href="login.html"]'
        );


    if (!currentUser) {
        return;
    }


    accountLinks.forEach(function (link) {

        link.href = "profile.html";

        link.setAttribute(
            "aria-label",
            "My Account"
        );

    });

}


/* =========================================
   LOGOUT
========================================= */

function logoutUser() {

    localStorage.removeItem(
        "shopEaseCurrentUser"
    );

    window.location.href = "index.html";

}