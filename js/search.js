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