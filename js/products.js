/* =========================================================
   ShopEase - Product Database
   50 Professional Ecommerce Products
========================================================= */

const products = [

    // =====================================================
    // MEN'S FASHION
    // =====================================================

    {
        id: 1,
        name: "Premium Oversized T-Shirt",
        category: "men",
        brand: "StreetWear",
        price: 899,
        oldPrice: 1299,
        rating: 4.6,
        reviews: 128,
        image: "assets/images/products/mens-oversized-tshirt.jpg",
        badge: "Best Seller",
        description: "Premium cotton oversized t-shirt with a modern relaxed fit."
    },

    {
        id: 2,
        name: "Classic Denim Jacket",
        category: "men",
        brand: "UrbanStep",
        price: 1899,
        oldPrice: 2799,
        rating: 4.7,
        reviews: 94,
        image: "assets/images/products/classic-denim-jacket.jpg",
        badge: "Trending",
        description: "Classic blue denim jacket designed for everyday styling."
    },

    {
        id: 3,
        name: "Slim Fit Casual Shirt",
        category: "men",
        brand: "StreetWear",
        price: 1199,
        oldPrice: 1799,
        rating: 4.5,
        reviews: 86,
        image: "assets/images/products/slim-fit-shirt.jpg",
        badge: "Popular",
        description: "Comfortable slim fit shirt suitable for casual and semi-formal looks."
    },

    {
        id: 4,
        name: "Premium Cotton Polo",
        category: "men",
        brand: "UrbanStep",
        price: 999,
        oldPrice: 1499,
        rating: 4.4,
        reviews: 72,
        image: "assets/images/products/premium-polo.jpg",
        badge: "",
        description: "Soft premium cotton polo shirt with a clean modern design."
    },

    {
        id: 5,
        name: "Relaxed Fit Cargo Pants",
        category: "men",
        brand: "StreetWear",
        price: 1499,
        oldPrice: 2199,
        rating: 4.6,
        reviews: 113,
        image: "assets/images/products/cargo-pants.jpg",
        badge: "New",
        description: "Relaxed cargo pants with multiple utility pockets."
    },

    {
        id: 6,
        name: "Classic Formal Trousers",
        category: "men",
        brand: "UrbanStep",
        price: 1399,
        oldPrice: 1999,
        rating: 4.3,
        reviews: 58,
        image: "assets/images/products/formal-trousers.jpg",
        badge: "",
        description: "Smart formal trousers with a comfortable tailored fit."
    },

    {
        id: 7,
        name: "Hooded Sweatshirt",
        category: "men",
        brand: "StreetWear",
        price: 1599,
        oldPrice: 2299,
        rating: 4.7,
        reviews: 147,
        image: "assets/images/products/hooded-sweatshirt.jpg",
        badge: "Best Seller",
        description: "Warm and comfortable hoodie made for everyday wear."
    },

    {
        id: 8,
        name: "Linen Casual Shirt",
        category: "men",
        brand: "UrbanStep",
        price: 1299,
        oldPrice: 1899,
        rating: 4.5,
        reviews: 67,
        image: "assets/images/products/linen-shirt.jpg",
        badge: "New",
        description: "Breathable linen shirt perfect for warm-weather outfits."
    },

    {
        id: 9,
        name: "Athletic Track Pants",
        category: "men",
        brand: "RunMax",
        price: 1099,
        oldPrice: 1599,
        rating: 4.4,
        reviews: 91,
        image: "assets/images/products/track-pants.jpg",
        badge: "",
        description: "Lightweight athletic track pants for workouts and daily use."
    },

    {
        id: 10,
        name: "Premium Bomber Jacket",
        category: "men",
        brand: "UrbanStep",
        price: 2199,
        oldPrice: 3299,
        rating: 4.8,
        reviews: 54,
        image: "assets/images/products/bomber-jacket.jpg",
        badge: "Premium",
        description: "Stylish bomber jacket with a contemporary streetwear design."
    },


    // =====================================================
    // WOMEN'S FASHION
    // =====================================================

    {
        id: 11,
        name: "Floral Summer Dress",
        category: "women",
        brand: "UrbanStep",
        price: 1499,
        oldPrice: 2199,
        rating: 4.7,
        reviews: 156,
        image: "assets/images/products/floral-summer-dress.jpg",
        badge: "Best Seller",
        description: "Elegant floral dress designed for comfortable summer styling."
    },

    {
        id: 12,
        name: "Elegant Ribbed Top",
        category: "women",
        brand: "StreetWear",
        price: 799,
        oldPrice: 1199,
        rating: 4.5,
        reviews: 82,
        image: "assets/images/products/ribbed-top.jpg",
        badge: "Trending",
        description: "Minimal ribbed top with a stylish contemporary silhouette."
    },

    {
        id: 13,
        name: "Wide Leg Jeans",
        category: "women",
        brand: "UrbanStep",
        price: 1599,
        oldPrice: 2399,
        rating: 4.6,
        reviews: 119,
        image: "assets/images/products/wide-leg-jeans.jpg",
        badge: "Popular",
        description: "Comfortable wide-leg denim with a modern relaxed fit."
    },

    {
        id: 14,
        name: "Oversized Hoodie",
        category: "women",
        brand: "StreetWear",
        price: 1399,
        oldPrice: 1999,
        rating: 4.8,
        reviews: 171,
        image: "assets/images/products/womens-hoodie.jpg",
        badge: "Best Seller",
        description: "Soft oversized hoodie with a cozy everyday fit."
    },

    {
        id: 15,
        name: "Pleated Midi Skirt",
        category: "women",
        brand: "UrbanStep",
        price: 1199,
        oldPrice: 1799,
        rating: 4.4,
        reviews: 63,
        image: "assets/images/products/pleated-skirt.jpg",
        badge: "",
        description: "Elegant pleated midi skirt for casual and formal styling."
    },

    {
        id: 16,
        name: "Classic Women's Blazer",
        category: "women",
        brand: "UrbanStep",
        price: 2299,
        oldPrice: 3499,
        rating: 4.7,
        reviews: 76,
        image: "assets/images/products/womens-blazer.jpg",
        badge: "Premium",
        description: "Sophisticated blazer designed for polished professional looks."
    },

    {
        id: 17,
        name: "Casual Crop Shirt",
        category: "women",
        brand: "StreetWear",
        price: 899,
        oldPrice: 1399,
        rating: 4.3,
        reviews: 49,
        image: "assets/images/products/crop-shirt.jpg",
        badge: "New",
        description: "Trendy crop shirt with a comfortable lightweight design."
    },

    {
        id: 18,
        name: "Elegant Maxi Dress",
        category: "women",
        brand: "UrbanStep",
        price: 1799,
        oldPrice: 2699,
        rating: 4.8,
        reviews: 134,
        image: "assets/images/products/maxi-dress.jpg",
        badge: "Trending",
        description: "Flowing maxi dress with an elegant feminine silhouette."
    },

    {
        id: 19,
        name: "High Waist Leggings",
        category: "women",
        brand: "RunMax",
        price: 699,
        oldPrice: 999,
        rating: 4.5,
        reviews: 201,
        image: "assets/images/products/high-waist-leggings.jpg",
        badge: "Best Seller",
        description: "Stretchable high-waist leggings for workouts and casual wear."
    },

    {
        id: 20,
        name: "Knitted Cardigan",
        category: "women",
        brand: "UrbanStep",
        price: 1499,
        oldPrice: 2199,
        rating: 4.6,
        reviews: 88,
        image: "assets/images/products/knitted-cardigan.jpg",
        badge: "",
        description: "Soft knitted cardigan with a timeless everyday design."
    },


    // =====================================================
    // FOOTWEAR
    // =====================================================

    {
        id: 21,
        name: "Urban Runner Sneakers",
        category: "shoes",
        brand: "RunMax",
        price: 1999,
        oldPrice: 2999,
        rating: 4.8,
        reviews: 245,
        image: "assets/images/products/urban-runner.jpg",
        badge: "Best Seller",
        description: "Lightweight running sneakers with responsive cushioning."
    },

    {
        id: 22,
        name: "Classic White Sneakers",
        category: "shoes",
        brand: "UrbanStep",
        price: 1799,
        oldPrice: 2599,
        rating: 4.7,
        reviews: 198,
        image: "assets/images/products/classic-white-sneakers.jpg",
        badge: "Popular",
        description: "Minimal white sneakers designed for everyday outfits."
    },

    {
        id: 23,
        name: "Performance Running Shoes",
        category: "shoes",
        brand: "RunMax",
        price: 2499,
        oldPrice: 3699,
        rating: 4.9,
        reviews: 176,
        image: "assets/images/products/performance-running.jpg",
        badge: "Premium",
        description: "High-performance running shoes with advanced cushioning."
    },

    {
        id: 24,
        name: "Casual Canvas Shoes",
        category: "shoes",
        brand: "StreetWear",
        price: 1199,
        oldPrice: 1799,
        rating: 4.4,
        reviews: 102,
        image: "assets/images/products/canvas-shoes.jpg",
        badge: "",
        description: "Comfortable canvas shoes for casual everyday wear."
    },

    {
        id: 25,
        name: "Classic Leather Loafers",
        category: "shoes",
        brand: "UrbanStep",
        price: 2199,
        oldPrice: 3299,
        rating: 4.6,
        reviews: 87,
        image: "assets/images/products/leather-loafers.jpg",
        badge: "Premium",
        description: "Classic leather loafers with a refined formal finish."
    },

    {
        id: 26,
        name: "Street High-Top Sneakers",
        category: "shoes",
        brand: "StreetWear",
        price: 1899,
        oldPrice: 2799,
        rating: 4.5,
        reviews: 114,
        image: "assets/images/products/high-top-sneakers.jpg",
        badge: "Trending",
        description: "Modern high-top sneakers inspired by streetwear fashion."
    },

    {
        id: 27,
        name: "Women's Walking Shoes",
        category: "shoes",
        brand: "RunMax",
        price: 1599,
        oldPrice: 2299,
        rating: 4.7,
        reviews: 143,
        image: "assets/images/products/womens-walking-shoes.jpg",
        badge: "Popular",
        description: "Comfortable walking shoes designed for all-day support."
    },

    {
        id: 28,
        name: "Classic Slip-On Shoes",
        category: "shoes",
        brand: "UrbanStep",
        price: 1299,
        oldPrice: 1899,
        rating: 4.3,
        reviews: 71,
        image: "assets/images/products/slip-on-shoes.jpg",
        badge: "",
        description: "Easy slip-on shoes combining comfort and modern style."
    },

    {
        id: 29,
        name: "Training Sports Shoes",
        category: "shoes",
        brand: "RunMax",
        price: 2299,
        oldPrice: 3199,
        rating: 4.8,
        reviews: 96,
        image: "assets/images/products/training-shoes.jpg",
        badge: "New",
        description: "Durable training shoes designed for gym and athletic activities."
    },

    {
        id: 30,
        name: "Minimal Beige Sneakers",
        category: "shoes",
        brand: "StreetWear",
        price: 1699,
        oldPrice: 2499,
        rating: 4.6,
        reviews: 109,
        image: "assets/images/products/beige-sneakers.jpg",
        badge: "Trending",
        description: "Minimal beige sneakers that pair easily with any outfit."
    },


    // =====================================================
    // ACCESSORIES
    // =====================================================

    {
        id: 31,
        name: "Premium Leather Backpack",
        category: "accessories",
        brand: "CarryPro",
        price: 1999,
        oldPrice: 2999,
        rating: 4.8,
        reviews: 164,
        image: "assets/images/products/leather-backpack.jpg",
        badge: "Best Seller",
        description: "Premium backpack with multiple compartments and laptop storage."
    },

    {
        id: 32,
        name: "Minimal Analog Watch",
        category: "accessories",
        brand: "UrbanStep",
        price: 1799,
        oldPrice: 2699,
        rating: 4.6,
        reviews: 92,
        image: "assets/images/products/minimal-watch.jpg",
        badge: "Premium",
        description: "Elegant minimalist watch with a sophisticated dial."
    },

    {
        id: 33,
        name: "Classic Crossbody Bag",
        category: "accessories",
        brand: "CarryPro",
        price: 1299,
        oldPrice: 1899,
        rating: 4.5,
        reviews: 118,
        image: "assets/images/products/crossbody-bag.jpg",
        badge: "Popular",
        description: "Compact crossbody bag perfect for everyday essentials."
    },

    {
        id: 34,
        name: "UV Protection Sunglasses",
        category: "accessories",
        brand: "UrbanStep",
        price: 899,
        oldPrice: 1399,
        rating: 4.4,
        reviews: 134,
        image: "assets/images/products/sunglasses.jpg",
        badge: "",
        description: "Stylish sunglasses offering reliable UV protection."
    },

    {
        id: 35,
        name: "Travel Laptop Backpack",
        category: "accessories",
        brand: "CarryPro",
        price: 2299,
        oldPrice: 3499,
        rating: 4.9,
        reviews: 187,
        image: "assets/images/products/laptop-backpack.jpg",
        badge: "Best Seller",
        description: "Spacious travel backpack with dedicated laptop protection."
    },

    {
        id: 36,
        name: "Premium Leather Wallet",
        category: "accessories",
        brand: "CarryPro",
        price: 799,
        oldPrice: 1199,
        rating: 4.7,
        reviews: 213,
        image: "assets/images/products/leather-wallet.jpg",
        badge: "Popular",
        description: "Slim leather wallet with multiple card slots."
    },

    {
        id: 37,
        name: "Everyday Canvas Backpack",
        category: "accessories",
        brand: "StreetWear",
        price: 1099,
        oldPrice: 1599,
        rating: 4.4,
        reviews: 75,
        image: "assets/images/products/canvas-backpack.jpg",
        badge: "",
        description: "Lightweight canvas backpack for college and everyday use."
    },

    {
        id: 38,
        name: "Classic Leather Belt",
        category: "accessories",
        brand: "CarryPro",
        price: 699,
        oldPrice: 999,
        rating: 4.5,
        reviews: 143,
        image: "assets/images/products/leather-belt.jpg",
        badge: "",
        description: "Classic leather belt with a durable metal buckle."
    },

    {
        id: 39,
        name: "Premium Baseball Cap",
        category: "accessories",
        brand: "StreetWear",
        price: 599,
        oldPrice: 899,
        rating: 4.3,
        reviews: 61,
        image: "assets/images/products/baseball-cap.jpg",
        badge: "New",
        description: "Adjustable baseball cap with a clean everyday design."
    },

    {
        id: 40,
        name: "Smart Travel Duffel Bag",
        category: "accessories",
        brand: "CarryPro",
        price: 1699,
        oldPrice: 2499,
        rating: 4.7,
        reviews: 97,
        image: "assets/images/products/duffel-bag.jpg",
        badge: "Trending",
        description: "Spacious duffel bag designed for weekend trips and travel."
    },


    // =====================================================
    // MORE FASHION & LIFESTYLE PRODUCTS
    // =====================================================

    {
        id: 41,
        name: "Premium Graphic T-Shirt",
        category: "men",
        brand: "StreetWear",
        price: 899,
        oldPrice: 1299,
        rating: 4.5,
        reviews: 109,
        image: "assets/images/products/graphic-tshirt.jpg",
        badge: "Trending",
        description: "Premium graphic t-shirt with a modern streetwear print."
    },

    {
        id: 42,
        name: "Women's Casual Jumpsuit",
        category: "women",
        brand: "UrbanStep",
        price: 1699,
        oldPrice: 2499,
        rating: 4.6,
        reviews: 84,
        image: "assets/images/products/casual-jumpsuit.jpg",
        badge: "New",
        description: "Stylish casual jumpsuit with a comfortable modern fit."
    },

    {
        id: 43,
        name: "Classic Running Sneakers",
        category: "shoes",
        brand: "RunMax",
        price: 1999,
        oldPrice: 2899,
        rating: 4.7,
        reviews: 156,
        image: "assets/images/products/classic-running.jpg",
        badge: "Popular",
        description: "Reliable running sneakers for everyday training."
    },

    {
        id: 44,
        name: "Premium Shoulder Bag",
        category: "accessories",
        brand: "CarryPro",
        price: 1499,
        oldPrice: 2199,
        rating: 4.6,
        reviews: 93,
        image: "assets/images/products/shoulder-bag.jpg",
        badge: "Trending",
        description: "Elegant shoulder bag with a spacious practical interior."
    },

    {
        id: 45,
        name: "Men's Casual Kurta",
        category: "men",
        brand: "UrbanStep",
        price: 1299,
        oldPrice: 1899,
        rating: 4.5,
        reviews: 73,
        image: "assets/images/products/mens-kurta.jpg",
        badge: "New",
        description: "Modern casual kurta combining traditional style with comfort."
    },

    {
        id: 46,
        name: "Women's Printed Kurti",
        category: "women",
        brand: "UrbanStep",
        price: 1099,
        oldPrice: 1599,
        rating: 4.7,
        reviews: 127,
        image: "assets/images/products/printed-kurti.jpg",
        badge: "Best Seller",
        description: "Beautiful printed kurti suitable for everyday occasions."
    },

    {
        id: 47,
        name: "Sports Training Shorts",
        category: "men",
        brand: "RunMax",
        price: 799,
        oldPrice: 1199,
        rating: 4.4,
        reviews: 65,
        image: "assets/images/products/training-shorts.jpg",
        badge: "",
        description: "Breathable sports shorts designed for training and workouts."
    },

    {
        id: 48,
        name: "Women's Activewear Set",
        category: "women",
        brand: "RunMax",
        price: 1799,
        oldPrice: 2599,
        rating: 4.8,
        reviews: 142,
        image: "assets/images/products/activewear-set.jpg",
        badge: "Best Seller",
        description: "Comfortable two-piece activewear set for workouts and fitness."
    },

    {
        id: 49,
        name: "Premium Travel Sunglasses",
        category: "accessories",
        brand: "UrbanStep",
        price: 999,
        oldPrice: 1499,
        rating: 4.5,
        reviews: 89,
        image: "assets/images/products/travel-sunglasses.jpg",
        badge: "New",
        description: "Modern sunglasses designed for travel and outdoor adventures."
    },

    {
        id: 50,
        name: "Everyday Premium Sneakers",
        category: "shoes",
        brand: "RunMax",
        price: 1899,
        oldPrice: 2799,
        rating: 4.8,
        reviews: 221,
        image: "assets/images/products/everyday-sneakers.jpg",
        badge: "Best Seller",
        description: "Premium everyday sneakers combining comfort, durability and style."
    },

    {
        id: 51,
        name: "Noise Buds Pro",
        category: "electronics",
        brand: "Noise",
        price: 3499,
        oldPrice: 4999,
        rating: 4.7,
        reviews: 245,
        image: "assets/images/products/noise-buds-pro.jpg",
        badge: "Top Rated",
        description: "Wireless earbuds with deep bass, fast pairing, and all-day battery life."
    },

    {
        id: 52,
        name: "OnePlus Nord Buds",
        category: "electronics",
        brand: "OnePlus",
        price: 2899,
        oldPrice: 3999,
        rating: 4.6,
        reviews: 176,
        image: "assets/images/products/nord-buds.jpg",
        badge: "Popular",
        description: "Compact wireless earbuds built for immersive music and clear calls."
    },

    {
        id: 53,
        name: "iPad Air 11-inch",
        category: "electronics",
        brand: "Apple",
        price: 54999,
        oldPrice: 64999,
        rating: 4.8,
        reviews: 203,
        image: "assets/images/products/tablet-air.jpg",
        badge: "New",
        description: "Lightweight tablet with vibrant display and excellent productivity tools."
    },

    {
        id: 54,
        name: "Sony Bravia 4K TV",
        category: "electronics",
        brand: "Sony",
        price: 69999,
        oldPrice: 89999,
        rating: 4.9,
        reviews: 144,
        image: "assets/images/products/smart-tv-4k.jpg",
        badge: "Premium",
        description: "Cinematic 4K entertainment with rich contrast and smart streaming."
    },

    {
        id: 55,
        name: "Smart Air Fryer",
        category: "appliances",
        brand: "Prestige",
        price: 7599,
        oldPrice: 9999,
        rating: 4.7,
        reviews: 131,
        image: "assets/images/products/air-fryer.jpg",
        badge: "Fast Selling",
        description: "Crispy cooking made easier with a smart airflow design and intuitive controls."
    },

    {
        id: 56,
        name: "Aroma Diffuser",
        category: "home",
        brand: "AromaHome",
        price: 2499,
        oldPrice: 3499,
        rating: 4.5,
        reviews: 92,
        image: "assets/images/products/aroma-diffuser.jpg",
        badge: "Popular",
        description: "A calming home scent diffuser that fits beautifully into any room."
    },

    {
        id: 57,
        name: "Minimal Accent Chair",
        category: "home",
        brand: "HomeNest",
        price: 8999,
        oldPrice: 11999,
        rating: 4.6,
        reviews: 88,
        image: "assets/images/products/accent-chair.jpg",
        badge: "New",
        description: "Contemporary accent chair with elegant form and soft everyday comfort."
    },

    {
        id: 58,
        name: "Glow Serum Duo",
        category: "beauty",
        brand: "GlowLab",
        price: 2199,
        oldPrice: 3299,
        rating: 4.8,
        reviews: 204,
        image: "assets/images/products/glow-serum.jpg",
        badge: "Bestseller",
        description: "Hydrating serum set designed to brighten, smooth and soften skin."
    },

    {
        id: 59,
        name: "Hair Straightener Pro",
        category: "beauty",
        brand: "Philips",
        price: 3299,
        oldPrice: 4599,
        rating: 4.6,
        reviews: 118,
        image: "assets/images/products/hair-straightener.jpg",
        badge: "Trend",
        description: "Salon-style styling with smooth glide and heat control."
    },

    {
        id: 60,
        name: "Yoga Mat Premium",
        category: "fitness",
        brand: "ProFlex",
        price: 1799,
        oldPrice: 2499,
        rating: 4.7,
        reviews: 185,
        image: "assets/images/products/yoga-mat.jpg",
        badge: "Best Seller",
        description: "Soft, supportive yoga mat for home workouts, stretching and recovery."
    },

    {
        id: 61,
        name: "Resistance Bands Set",
        category: "fitness",
        brand: "FitCore",
        price: 1299,
        oldPrice: 1999,
        rating: 4.5,
        reviews: 114,
        image: "assets/images/products/resistance-bands.jpg",
        badge: "Popular",
        description: "Travel-friendly bands for quick strength, mobility and posture work."
    },

    {
        id: 62,
        name: "Portable Blender",
        category: "appliances",
        brand: "BlendGo",
        price: 2999,
        oldPrice: 3999,
        rating: 4.6,
        reviews: 97,
        image: "assets/images/products/portable-blender.jpg",
        badge: "Hot",
        description: "Compact smoothie blender with rechargeable power and travel-friendly design."
    }

];

function normalizeProductData() {
    products.forEach(product => {
        product.categorySlug = String(product.categorySlug || product.category || "").toLowerCase();
        product.category = product.categorySlug;
        product.icon = product.icon || getFallbackIcon(product.category);

        if (product.image && !/^https?:\/\//i.test(product.image)) {
            product.image = product.image.startsWith("assets/")
                ? product.image
                : `assets/${product.image.replace(/^\/+/, "")}`;
        }

        if (!product.image) {
            product.image = "assets/images/products/placeholder.jpg";
        }
    });
}

function getFallbackIcon(category) {
    const icons = {
        men: "fa-shirt",
        women: "fa-person-dress",
        shoes: "fa-shoe-prints",
        accessories: "fa-bag-shopping",
        electronics: "fa-laptop",
        home: "fa-house",
        beauty: "fa-spa",
        appliances: "fa-kitchen-set",
        fitness: "fa-dumbbell"
    };

    return icons[category] || "fa-box";
}

normalizeProductData();

/* =========================================================
   PRODUCT HELPER FUNCTIONS
========================================================= */

function getProductImage(product) {
    if (!product) {
        return "assets/images/products/placeholder.jpg";
    }

    const image = product.image || "";
    return image.startsWith("assets/") || image.startsWith("/") || image.startsWith("http")
        ? image.startsWith("/") ? image.replace(/^\//, "") : image
        : `assets/${image.replace(/^\/+/, "")}`;
}

function getProductById(id) {
    return products.find(product => product.id === Number(id));
}


function getProductsByCategory(category) {
    return products.filter(product => product.category === category);
}


function getProductsByBrand(brand) {
    return products.filter(product => product.brand === brand);
}


function getDiscountPercentage(product) {

    if (!product.oldPrice || product.oldPrice <= product.price) {
        return 0;
    }

    return Math.round(
        ((product.oldPrice - product.price) / product.oldPrice) * 100
    );
}


function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(product) {

    const discount = getDiscountPercentage(product);
    const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const isWishlisted = wishlist.some(item => Number(item) === Number(product.id));

    return `
        <div class="product-card" data-id="${product.id}">

            <div class="product-image-wrapper">

                ${product.badge
                    ? `<span class="product-badge">${product.badge}</span>`
                    : ""
                }

                ${discount > 0
                    ? `<span class="discount-badge">${discount}% OFF</span>`
                    : ""
                }

                <button
                    class="wishlist-btn ${isWishlisted ? "active" : ""}"
                    data-wishlist="${product.id}"
                    aria-label="Add ${product.name} to wishlist"
                >
                    <i class="${isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"}"></i>
                </button>

                <img
                    src="${getProductImage(product)}"
                    alt="${product.name}"
                    class="product-image"
                    loading="lazy"
                    onerror="this.src='assets/images/products/placeholder.jpg'"
                >

                <div class="product-quick-actions">

                    <button
                        class="quick-view-btn"
                        data-product-id="${product.id}"
                    >
                        <i class="fa-solid fa-eye"></i>
                        Quick View
                    </button>

                </div>

            </div>


            <div class="product-info">

                <span class="product-brand">
                    ${product.brand}
                </span>

                <h3 class="product-name">
                    ${product.name}
                </h3>


                <div class="product-rating">

                    <span class="stars">
                        ${createStars(product.rating)}
                    </span>

                    <span class="rating-number">
                        ${product.rating}
                    </span>

                    <span class="review-count">
                        (${product.reviews})
                    </span>

                </div>


                <div class="product-price">

                    <strong>
                        ${formatPrice(product.price)}
                    </strong>

                    ${product.oldPrice
                        ? `
                            <span class="old-price">
                                ${formatPrice(product.oldPrice)}
                            </span>
                          `
                        : ""
                    }

                </div>


                <button
                    class="add-to-cart-btn"
                    data-product-id="${product.id}"
                >
                    <i class="fa-solid fa-cart-shopping"></i>
                    Add to Cart
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   STAR RATING
========================================================= */

function createStars(rating) {

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        if (rating >= i) {

            stars += `
                <i class="fa-solid fa-star"></i>
            `;

        } else if (rating >= i - 0.5) {

            stars += `
                <i class="fa-solid fa-star-half-stroke"></i>
            `;

        } else {

            stars += `
                <i class="fa-regular fa-star"></i>
            `;

        }
    }

    return stars;
}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList = products) {

    const grid = document.getElementById("shopProductGrid");

    const noProducts = document.getElementById("noProducts");

    const shopCount = document.getElementById("shopCount");


    if (!grid) {
        return;
    }


    if (shopCount) {

        shopCount.innerHTML = `
            Showing
            <strong>${productList.length}</strong>
            products
        `;
    }


    if (productList.length === 0) {

        grid.innerHTML = "";

        if (noProducts) {
            noProducts.style.display = "block";
        }

        return;
    }


    if (noProducts) {
        noProducts.style.display = "none";
    }


    grid.innerHTML = productList
        .map(product => createProductCard(product))
        .join("");


    initializeProductButtons();
}


/* =========================================================
   PRODUCT BUTTON EVENTS
========================================================= */

function initializeProductButtons() {

    /* ADD TO CART */

    document
        .querySelectorAll(".add-to-cart-btn")
        .forEach(button => {

            button.addEventListener("click", function () {

                const productId = Number(
                    this.dataset.productId
                );

                const product = getProductById(productId);

                if (!product) return;


                let cart =
                    JSON.parse(
                        localStorage.getItem("cart")
                    ) || [];


                const existingProduct =
                    cart.find(item => Number(item.id) === Number(product.id));


                if (existingProduct) {

                    existingProduct.quantity =
                        (Number(existingProduct.quantity) || 1) + 1;

                } else {

                    cart.push({
                        id: Number(product.id),
                        quantity: 1,
                        size: "M",
                        color: "Black"
                    });

                }


                localStorage.setItem(
                    "cart",
                    JSON.stringify(cart)
                );


                if (typeof updateCartCount === "function") {
                    updateCartCount();
                }


                showProductMessage(
                    `${product.name} added to cart`
                );

            });

        });


    /* WISHLIST */

    document
        .querySelectorAll(".wishlist-btn")
        .forEach(button => {

            button.addEventListener("click", function () {

                const productId =
                    Number(this.dataset.wishlist);

                const product =
                    getProductById(productId);

                if (!product) return;


                let wishlist =
                    JSON.parse(
                        localStorage.getItem("wishlist")
                    ) || [];

                wishlist = wishlist
                    .map(item => Number(typeof item === "object" ? item.id : item))
                    .filter(item => !Number.isNaN(item));

                const existingIndex =
                    wishlist.findIndex(
                        item => Number(item) === Number(product.id)
                    );


                if (existingIndex >= 0) {

                    wishlist.splice(
                        existingIndex,
                        1
                    );

                    this.classList.remove("active");

                    showProductMessage(
                        "Removed from wishlist"
                    );

                } else {

                    wishlist.push(Number(product.id));

                    this.classList.add("active");

                    showProductMessage(
                        "Added to wishlist"
                    );
                }


                localStorage.setItem(
                    "wishlist",
                    JSON.stringify([...new Set(wishlist)])
                );


                if (typeof updateWishlistCount === "function") {
                    updateWishlistCount();
                }

            });

        });


    /* QUICK VIEW */

    document
        .querySelectorAll(".quick-view-btn")
        .forEach(button => {

            button.addEventListener("click", function () {

                const productId =
                    Number(this.dataset.productId);

                const product =
                    getProductById(productId);

                if (!product) return;


                window.location.href =
                    `product-details.html?id=${product.id}`;

            });

        });

}


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    const count =
        cart.reduce(
            (total, item) =>
                total + (item.quantity || 1),
            0
        );


    const cartCount =
        document.getElementById("cartCount");


    if (cartCount) {
        cartCount.textContent = count;
    }
}


/* =========================================================
   WISHLIST COUNT
========================================================= */

function updateWishlistCount() {

    const wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    const wishlistCount =
        document.getElementById("wishlistCount");


    if (wishlistCount) {
        wishlistCount.textContent =
            wishlist.length;
    }
}


/* =========================================================
   MESSAGE / TOAST
========================================================= */

function showProductMessage(message) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById("toastMessage");


    if (!toast || !toastMessage) {
        return;
    }


    toastMessage.textContent = message;

    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    displayProducts(products);

    updateCartCount();

    updateWishlistCount();

});