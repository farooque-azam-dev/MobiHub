// ---------- Small helpers ----------

function $(selector, root) {
    return (root || document).querySelector(selector);
}

function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

function formatPrice(number) {
    return "Rs. " + Number(number).toLocaleString("en-PK");
}

function loadList(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
}

function saveList(key, list) {
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) { }
}

// Store WhatsApp number (country code + number, no + or spaces)
var STORE_WHATSAPP = "923243226265";


// ---------- Inject small CSS needed by JS (toast, empty message, smooth scroll) ----------

(function injectStyles() {
    var style = document.createElement("style");
    style.textContent =
        "html{scroll-behavior:smooth}" +
        ".toast-msg{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);" +
        "background:#0f172a;color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;" +
        "opacity:0;pointer-events:none;transition:.3s;z-index:3000;max-width:90%;text-align:center}" +
        ".toast-msg.show{opacity:1;transform:translateX(-50%) translateY(0)}" +
        ".no-products{display:none;text-align:center;padding:40px 0;color:#64748b;font-size:16px}";
    document.head.appendChild(style);
})();


// ---------- Toast message ----------

var toastBox = document.createElement("div");
toastBox.className = "toast-msg";
document.body.appendChild(toastBox);

var toastTimer;

function showToast(message) {
    toastBox.textContent = message;
    toastBox.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toastBox.classList.remove("show");
    }, 2500);
}


//    1. HERO SLIDER (arrows + dots + autoplay)

var slides = $all(".slide");
var nextBtn = document.getElementById("heroNext");
var prevBtn = document.getElementById("heroPrev");
var dotsContainer = document.getElementById("heroDots");
var heroSection = $(".hero");
var currentSlide = 0;
var slideTimer;

slides.forEach(function (slide, index) {
    var dot = document.createElement("button");
    dot.setAttribute("aria-label", "Go to slide " + (index + 1));
    if (index === 0) {
        dot.classList.add("active");
    }
    dot.addEventListener("click", function () {
        showSlide(index);
        restartAutoplay();
    });
    dotsContainer.appendChild(dot);
});

function showSlide(index) {
    slides[currentSlide].classList.remove("active");
    dotsContainer.children[currentSlide].classList.remove("active");
    currentSlide = index;
    slides[currentSlide].classList.add("active");
    dotsContainer.children[currentSlide].classList.add("active");
}

nextBtn.addEventListener("click", function () {
    showSlide((currentSlide + 1) % slides.length);
    restartAutoplay();
});

prevBtn.addEventListener("click", function () {
    showSlide((currentSlide - 1 + slides.length) % slides.length);
    restartAutoplay();
});

// Autoplay every 5 seconds, pause while mouse is on the hero
function startAutoplay() {
    slideTimer = setInterval(function () {
        showSlide((currentSlide + 1) % slides.length);
    }, 5000);
}

function stopAutoplay() {
    clearInterval(slideTimer);
}

function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
}

heroSection.addEventListener("mouseenter", stopAutoplay);
heroSection.addEventListener("mouseleave", startAutoplay);
startAutoplay();


//    2. TODAY'S DEALS COUNTDOWN (ends at midnight)

var timerNumbers = $all(".deals-timer strong");

function pad(number) {
    return number < 10 ? "0" + number : String(number);
}

function updateTimer() {
    if (timerNumbers.length < 3) {
        return;
    }
    var now = new Date();
    var end = new Date(now);
    end.setHours(24, 0, 0, 0); // next midnight

    var seconds = Math.floor((end - now) / 1000);
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var secs = seconds % 60;

    timerNumbers[0].textContent = pad(hours);
    timerNumbers[1].textContent = pad(minutes);
    timerNumbers[2].textContent = pad(secs);
}

updateTimer();
setInterval(updateTimer, 1000);


//    3. QUICK VIEW POPUPS (Deals section + All Products)

var quickViewModal = document.getElementById("quickViewModal");
var closeQuickView = document.getElementById("closeQuickView");
var allQuickModal = document.getElementById("allQuickViewModal");
var allQuickClose = document.getElementById("allQuickClose");

function openModal(modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// Build WhatsApp link with product name
function setWhatsAppLink(modal, productName) {
    var link = $(".whatsapp-btn", modal);
    if (!link) {
        return;
    }
    var message = "Assalam o Alaikum, I want details about " + productName;
    link.href = "https://wa.me/" + STORE_WHATSAPP + "?text=" + encodeURIComponent(message);
}

// --- Deals section popup ---

$all(".quick-view-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        var card = button.closest(".product-card");
        var oldPrice = Number(card.dataset.oldPrice);
        var discount = Number(card.dataset.discount);

        document.getElementById("modalProductName").textContent = card.dataset.name;
        document.getElementById("modalProductBrand").textContent = card.dataset.brand;
        document.getElementById("modalProductRating").textContent = card.dataset.rating;
        document.getElementById("modalProductPrice").textContent = formatPrice(card.dataset.price);
        document.getElementById("modalProductOldPrice").textContent = oldPrice > 0 ? formatPrice(oldPrice) : "";
        document.getElementById("modalProductDiscount").textContent = discount > 0 ? "Save " + discount + "%" : "";
        // Use the image that is actually showing on the card (not data-image)
        var cardImage = card.querySelector(".product-image img");
        document.getElementById("modalProductImage").src = cardImage ? cardImage.src : card.dataset.image;
        document.getElementById("modalProductImage").alt = card.dataset.name;

        document.getElementById("modalDisplay").textContent = card.dataset.display;
        document.getElementById("modalBattery").textContent = card.dataset.battery;
        document.getElementById("modalStorage").textContent = card.dataset.storage;
        document.getElementById("modalWarranty").textContent = card.dataset.warranty;

        // Remember which product is open (used by Add to Cart inside popup)
        quickViewModal._product = {
            name: card.dataset.name,
            price: Number(card.dataset.price)
        };

        setWhatsAppLink(quickViewModal, card.dataset.name);
        openModal(quickViewModal);
    });
});

closeQuickView.addEventListener("click", function () {
    closeModal(quickViewModal);
});

quickViewModal.addEventListener("click", function (event) {
    if (event.target === quickViewModal) {
        closeModal(quickViewModal);
    }
});

// --- All Products popup ---

$all(".all-quick-view-btn").forEach(function (button) {
    button.addEventListener("click", function () {
        var card = button.closest(".all-product-card");
        var oldPrice = Number(card.dataset.oldPrice);
        var discount = Number(card.dataset.discount);

        document.getElementById("allModalName").textContent = card.dataset.name;
        document.getElementById("allModalBrand").textContent = card.dataset.brand;
        document.getElementById("allModalRating").textContent = card.dataset.rating;
        document.getElementById("allModalPrice").textContent = formatPrice(card.dataset.price);
        // Use the image that is actually showing on the card (not data-image)
        var allCardImage = card.querySelector(".product-image img");
        document.getElementById("allModalImage").src = allCardImage ? allCardImage.src : card.dataset.image;
        document.getElementById("allModalImage").alt = card.dataset.name;

        document.getElementById("allModalRam").textContent = card.dataset.ram;
        document.getElementById("allModalStorage").textContent = card.dataset.storage;
        document.getElementById("allModalDisplay").textContent = card.dataset.display;
        document.getElementById("allModalBattery").textContent = card.dataset.battery;
        document.getElementById("allModalWarranty").textContent = card.dataset.warranty;

        document.getElementById("allModalOldPrice").textContent = oldPrice > 0 ? formatPrice(oldPrice) : "";
        document.getElementById("allModalDiscount").textContent = discount > 0 ? "Save " + discount + "%" : "";

        allQuickModal._product = {
            name: card.dataset.name,
            price: Number(card.dataset.price)
        };

        setWhatsAppLink(allQuickModal, card.dataset.name);
        openModal(allQuickModal);
    });
});

allQuickClose.addEventListener("click", function () {
    closeModal(allQuickModal);
});

allQuickModal.addEventListener("click", function (event) {
    if (event.target === allQuickModal) {
        closeModal(allQuickModal);
    }
});

// One Escape handler for both popups
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal(quickViewModal);
        closeModal(allQuickModal);
    }
});


//    4. CART (Add to Cart + header badge, saved in browser)

var cartBadge = $('.header-icons a[aria-label="Shopping Cart"] span');
var wishlistBadge = $('.header-icons a[aria-label="Wishlist"] span');

var cart = loadList("mobihubCart");

function updateCartBadge() {
    var total = 0;
    cart.forEach(function (item) {
        total += item.qty;
    });
    if (cartBadge) {
        cartBadge.textContent = total;
    }
}

function addToCart(product) {
    var found = cart.find(function (item) {
        return item.name === product.name;
    });

    if (found) {
        found.qty++;
    } else {
        cart.push({ name: product.name, price: product.price, qty: 1 });
    }

    saveList("mobihubCart", cart);
    updateCartBadge();
    refreshDrawer();
    showToast(product.name + " added to cart");
}

// One click listener for ALL "Add to Cart" buttons (cards + popups)
document.addEventListener("click", function (event) {
    var button = event.target.closest(".add-cart-btn");
    if (!button) {
        return;
    }

    var product = null;
    var modal = button.closest(".quick-view-modal");

    if (modal) {
        product = modal._product;
    } else {
        var card = button.closest(".product-card, .all-product-card");
        if (card) {
            product = { name: card.dataset.name, price: Number(card.dataset.price) };
        }
    }

    if (product) {
        addToCart(product);
    }
});

updateCartBadge();


//    5. WISHLIST (heart buttons, synced everywhere)

var wishlist = loadList("mobihubWishlist");

function refreshHearts() {
    $all(".wishlist-btn").forEach(function (button) {
        var card = button.closest(".product-card, .all-product-card");
        var icon = button.querySelector("i");
        if (!card || !icon) {
            return;
        }
        var liked = wishlist.indexOf(card.dataset.name) !== -1;

        icon.classList.toggle("bi-heart-fill", liked);
        icon.classList.toggle("bi-heart", !liked);
        button.style.color = liked ? "#ef4444" : "";
    });

    if (wishlistBadge) {
        wishlistBadge.textContent = wishlist.length;
    }
}

// Only ONE handler (old code had two handlers = heart toggled twice)
document.addEventListener("click", function (event) {
    var button = event.target.closest(".wishlist-btn");
    if (!button) {
        return;
    }
    var card = button.closest(".product-card, .all-product-card");
    if (!card) {
        return;
    }

    var name = card.dataset.name;
    var position = wishlist.indexOf(name);

    if (position === -1) {
        wishlist.push(name);
        showToast("Added to wishlist");
    } else {
        wishlist.splice(position, 1);
        showToast("Removed from wishlist");
    }

    saveList("mobihubWishlist", wishlist);
    refreshHearts();
    refreshDrawer();
});

refreshHearts();


//    6. COMPARE CHECKBOXES (maximum 3 products)

document.addEventListener("change", function (event) {
    if (!event.target.matches(".compare-label input")) {
        return;
    }

    var checked = $all(".compare-label input:checked");

    if (checked.length > 3) {
        event.target.checked = false;
        showToast("You can compare maximum 3 products");
        return;
    }

    if (event.target.checked) {
        showToast(checked.length + " product(s) selected for compare");
    }
});


//    7. ALL PRODUCTS: filter + search + sort + reset

var productItems = $all(".product-item");
var categoryButtons = $all(".filter-btn");
var brandFilter = document.getElementById("brandFilter");
var priceFilter = document.getElementById("priceFilter");
var sortProducts = document.getElementById("sortProducts");
var resetProducts = document.getElementById("resetProducts");
var productGrid = document.getElementById("productGrid");
var productCount = document.getElementById("productCount");
var headerSearchForm = $(".header-search-box .search-box");
var headerSearchInput = headerSearchForm ? headerSearchForm.querySelector("input") : null;

var selectedCategory = "all";
var searchText = "";

// Remember original order so "Sort: Featured" can restore it
productItems.forEach(function (item, index) {
    item.dataset.order = index;
});

// "No products found" message
var noResult = document.createElement("div");
noResult.className = "no-products";
noResult.textContent = "No products found. Try changing your filters.";
productGrid.parentNode.insertBefore(noResult, productGrid.nextSibling);

function setCategory(category) {
    selectedCategory = category;
    categoryButtons.forEach(function (button) {
        button.classList.toggle("active", button.dataset.category === category);
    });
}

function filterAllProducts() {
    var visibleCount = 0;
    var words = searchText.split(" ").filter(function (w) { return w !== ""; });

    productItems.forEach(function (item) {
        var price = Number(item.dataset.price);
        var show = true;

        if (selectedCategory !== "all" && item.dataset.category !== selectedCategory) {
            show = false;
        }

        if (brandFilter.value !== "all" && item.dataset.brand !== brandFilter.value) {
            show = false;
        }

        if (priceFilter.value === "under50000" && price >= 50000) {
            show = false;
        }

        if (priceFilter.value === "50000to100000" && (price < 50000 || price > 100000)) {
            show = false;
        }

        if (priceFilter.value === "above100000" && price <= 100000) {
            show = false;
        }

        // Search words must all match name / brand / category
        if (words.length > 0) {
            var text = (item.dataset.name + " " + item.dataset.brand + " " +
                item.dataset.category).toLowerCase();
            var allMatch = words.every(function (word) {
                return text.indexOf(word) !== -1;
            });
            if (!allMatch) {
                show = false;
            }
        }

        item.style.display = show ? "" : "none";

        if (show) {
            visibleCount++;
        }
    });

    productCount.textContent = visibleCount + (visibleCount === 1 ? " product found" : " products found");
    noResult.style.display = visibleCount === 0 ? "block" : "none";

    sortAllProducts();
}

function sortAllProducts() {
    var items = Array.from(productGrid.querySelectorAll(".product-item"));

    items.sort(function (a, b) {
        if (sortProducts.value === "low") {
            return Number(a.dataset.price) - Number(b.dataset.price);
        }
        if (sortProducts.value === "high") {
            return Number(b.dataset.price) - Number(a.dataset.price);
        }
        if (sortProducts.value === "name") {
            return a.dataset.name.localeCompare(b.dataset.name);
        }
        // featured = original order
        return Number(a.dataset.order) - Number(b.dataset.order);
    });

    items.forEach(function (item) {
        productGrid.appendChild(item);
    });
}

function resetAllFilters() {
    setCategory("all");
    brandFilter.value = "all";
    priceFilter.value = "all";
    sortProducts.value = "featured";
    searchText = "";
    if (headerSearchInput) {
        headerSearchInput.value = "";
    }
    filterAllProducts();
}

function scrollToProducts() {
    document.getElementById("all-products").scrollIntoView({ behavior: "smooth" });
}

categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        setCategory(button.dataset.category);
        filterAllProducts();
    });
});

brandFilter.addEventListener("change", filterAllProducts);
priceFilter.addEventListener("change", filterAllProducts);
sortProducts.addEventListener("change", sortAllProducts);
resetProducts.addEventListener("click", resetAllFilters);

// Header search box
if (headerSearchForm) {
    headerSearchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var typed = headerSearchInput.value.trim().toLowerCase();

        setCategory("all");
        brandFilter.value = "all";
        priceFilter.value = "all";
        searchText = typed;

        filterAllProducts();
        scrollToProducts();
    });
}


//    8. CATEGORY CARD COUNTS (real product numbers)

$all(".category-card").forEach(function (card) {
    var key = card.getAttribute("href").slice(1);
    var count = productItems.filter(function (item) {
        return item.dataset.category === key;
    }).length;
    var label = card.querySelector("p");
    if (label) {
        label.textContent = count + (count === 1 ? " Product" : " Products");
    }
});


//    9. NAVIGATION LINKS (menu, brands, price, categories)

var categoryLinks = {
    shop: "all",
    smartphones: "smartphones",
    tablets: "tablets",
    watches: "watches",
    earbuds: "earbuds",
    accessories: "accessories"
};

var brandLinks = {
    apple: "Apple",
    samsung: "Samsung",
    huawie: "Huawie",
    oppo: "Oppo"
};

var mainMenu = document.getElementById("mainMenu");

function closeMobileMenu() {
    if (mainMenu && mainMenu.classList.contains("show") && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(mainMenu).hide();
    }
}

document.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) {
        return;
    }

    var href = link.getAttribute("href");
    if (!href || href.charAt(0) !== "#") {
        return;
    }

    var key = href.slice(1);
    var text = link.textContent.trim().toLowerCase();

    // (a) Mobile: open/close dropdown menus by tap
    if (link.classList.contains("dropdown-toggle") && window.innerWidth < 992) {
        event.preventDefault();
        var parent = link.closest(".dropdown");
        parent.classList.toggle("show");
        var submenu = parent.querySelector(".main-menu, .dropdown-menu");
        if (submenu) {
            submenu.classList.toggle("show");
        }
        return;
    }

    // (b) Smartphones mega menu: brand names and price ranges
    if (link.closest(".main-menu")) {
        event.preventDefault();
        resetAllFilters();
        setCategory("smartphones");

        if (brandLinks[text]) {
            brandFilter.value = brandLinks[text];
        } else if (text.indexOf("under") === 0) {
            priceFilter.value = "under50000";
        } else if (text.indexOf("above") === 0) {
            priceFilter.value = "above100000";
        } else if (text.indexOf("–") !== -1 || text.indexOf("-") !== -1) {
            priceFilter.value = "50000to100000";
        } else {
            showToast(link.textContent.trim() + " products coming soon");
            setCategory("all");
        }

        filterAllProducts();
        scrollToProducts();
        closeMobileMenu();
        return;
    }

    // (c) Accessories dropdown items
    if (link.closest(".simple-dropdown .dropdown-menu")) {
        event.preventDefault();
        resetAllFilters();
        setCategory("accessories");
        filterAllProducts();
        scrollToProducts();
        closeMobileMenu();
        return;
    }

    // (d) Brand strip under the hero (#apple, #samsung ...)
    if (link.closest(".brand-list")) {
        event.preventDefault();
        if (brandLinks[key]) {
            resetAllFilters();
            brandFilter.value = brandLinks[key];
            filterAllProducts();
            scrollToProducts();
        } else {
            showToast(link.textContent.trim() + " products coming soon");
        }
        return;
    }

    // (e) Category links (menu, category cards, hero buttons)
    if (categoryLinks[key]) {
        event.preventDefault();
        resetAllFilters();
        setCategory(categoryLinks[key]);
        filterAllProducts();
        scrollToProducts();
        closeMobileMenu();
        return;
    }

    // (f) Special links
    if (key === "home") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        closeMobileMenu();
    } else if (key === "contact") {
        event.preventDefault();
        document.getElementById("footer").scrollIntoView({ behavior: "smooth" });
        closeMobileMenu();
    } else if (key === "compare") {
        event.preventDefault();
        scrollToProducts();
        showToast("Tick 'Compare' on up to 3 products");
        closeMobileMenu();
    } else if (key === "deals") {
        closeMobileMenu();
    }
});


//    10. NEWSLETTER FORM

var newsletterForm = $(".newsletter-form");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var emailInput = newsletterForm.querySelector("input[type='email']");
        showToast("Thank you! " + emailInput.value + " has been subscribed.");
        newsletterForm.reset();
    });
}


//    11. CART & WISHLIST SIDE PANEL (header icons)

var drawerMode = ""; // "cart", "wishlist" or "" (closed)

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
}

// Find product image/price from the cards on the page
function getProductInfo(name) {
    var cards = $all(".all-product-card, .product-card");
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].dataset.name === name) {
            var img = cards[i].querySelector(".product-image img");
            return {
                name: name,
                price: Number(cards[i].dataset.price),
                image: img ? img.src : ""
            };
        }
    }
    return null;
}

// Styles for the panel
(function injectDrawerStyles() {
    var style = document.createElement("style");
    style.textContent =
        ".drawer-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);opacity:0;visibility:hidden;transition:.3s;z-index:2400}" +
        ".drawer-overlay.show{opacity:1;visibility:visible}" +
        ".side-drawer{position:fixed;top:0;right:0;height:100%;width:400px;max-width:100%;background:#fff;" +
        "transform:translateX(100%);transition:transform .3s;z-index:2500;display:flex;flex-direction:column;box-shadow:-8px 0 30px rgba(0,0,0,.15)}" +
        ".side-drawer.show{transform:translateX(0)}" +
        ".drawer-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e8f0}" +
        ".drawer-head h3{margin:0;font-size:18px;font-weight:700}" +
        ".drawer-close{border:0;background:none;font-size:20px;cursor:pointer;color:#475569}" +
        ".drawer-body{flex:1;overflow-y:auto;padding:12px 20px}" +
        ".drawer-empty{text-align:center;color:#64748b;margin-top:60px}" +
        ".drawer-item{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9}" +
        ".drawer-item img{width:64px;height:64px;object-fit:contain;background:#f8fafc;border-radius:8px}" +
        ".drawer-info{flex:1;min-width:0}" +
        ".drawer-info h4{margin:0 0 4px;font-size:14px;font-weight:600}" +
        ".drawer-info p{margin:0 0 6px;font-size:13px;color:#475569}" +
        ".qty-box{display:inline-flex;align-items:center;gap:10px}" +
        ".qty-box button,.drawer-mini-btn{border:1px solid #cbd5e1;background:#fff;border-radius:6px;min-width:28px;height:28px;cursor:pointer;font-size:14px}" +
        ".drawer-mini-btn{padding:0 10px;background:#2563eb;color:#fff;border-color:#2563eb;height:30px}" +
        ".drawer-remove{border:0;background:none;color:#ef4444;font-size:18px;cursor:pointer}" +
        ".drawer-foot{padding:16px 20px;border-top:1px solid #e2e8f0}" +
        ".drawer-total{display:flex;justify-content:space-between;font-weight:700;font-size:16px;margin-bottom:12px}" +
        ".drawer-order{display:block;text-align:center;background:#16a34a;color:#fff;padding:11px;border-radius:8px;text-decoration:none;font-weight:600}" +
        ".drawer-clear{display:block;width:100%;margin-top:8px;border:0;background:none;color:#ef4444;cursor:pointer;font-size:14px}";
    document.head.appendChild(style);
})();

// Build the panel
var drawerOverlay = document.createElement("div");
drawerOverlay.className = "drawer-overlay";

var drawer = document.createElement("aside");
drawer.className = "side-drawer";
drawer.setAttribute("aria-hidden", "true");
drawer.innerHTML =
    '<div class="drawer-head"><h3 id="drawerTitle"></h3>' +
    '<button type="button" class="drawer-close" aria-label="Close"><i class="bi bi-x-lg"></i></button></div>' +
    '<div class="drawer-body" id="drawerBody"></div>' +
    '<div class="drawer-foot" id="drawerFoot"></div>';

document.body.appendChild(drawerOverlay);
document.body.appendChild(drawer);

function openDrawer(mode) {
    drawerMode = mode;
    refreshDrawer();
    drawerOverlay.classList.add("show");
    drawer.classList.add("show");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeDrawer() {
    drawerMode = "";
    drawerOverlay.classList.remove("show");
    drawer.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

// Re-draw the panel content (only if it is open)
function refreshDrawer() {
    if (!drawerMode) {
        return;
    }

    var title = document.getElementById("drawerTitle");
    var body = document.getElementById("drawerBody");
    var foot = document.getElementById("drawerFoot");
    var html = "";

    if (drawerMode === "cart") {
        title.textContent = "Shopping Cart";

        if (cart.length === 0) {
            body.innerHTML = '<p class="drawer-empty">Your cart is empty.</p>';
            foot.innerHTML = "";
            return;
        }

        var total = 0;
        var message = "Hello MobiHub, I want to place an order:\n\n";

        cart.forEach(function (item, index) {
            var info = getProductInfo(item.name);
            var image = info ? info.image : "";
            total += item.price * item.qty;
            message += (index + 1) + ". " + item.name + " x " + item.qty +
                " = " + formatPrice(item.price * item.qty) + "\n";

            html +=
                '<div class="drawer-item">' +
                (image ? '<img src="' + escapeHtml(image) + '" alt="">' : "") +
                '<div class="drawer-info"><h4>' + escapeHtml(item.name) + "</h4>" +
                "<p>" + formatPrice(item.price) + "</p>" +
                '<div class="qty-box">' +
                '<button type="button" data-action="minus" data-index="' + index + '">−</button>' +
                "<span>" + item.qty + "</span>" +
                '<button type="button" data-action="plus" data-index="' + index + '">+</button>' +
                "</div></div>" +
                '<button type="button" class="drawer-remove" data-action="remove" data-index="' + index +
                '" aria-label="Remove"><i class="bi bi-trash"></i></button></div>';
        });

        message += "\nTotal: " + formatPrice(total) + "\n\nPlease confirm availability and delivery details.";

        body.innerHTML = html;
        foot.innerHTML =
            '<div class="drawer-total"><span>Total</span><span>' + formatPrice(total) + "</span></div>" +
            '<a class="drawer-order" target="_blank" rel="noopener" href="https://wa.me/' + STORE_WHATSAPP +
            "?text=" + encodeURIComponent(message) + '">Order on WhatsApp</a>' +
            '<button type="button" class="drawer-clear" data-action="clear">Clear cart</button>';
    } else {
        title.textContent = "My Wishlist";
        foot.innerHTML = "";

        if (wishlist.length === 0) {
            body.innerHTML = '<p class="drawer-empty">Your wishlist is empty.</p>';
            return;
        }

        wishlist.forEach(function (name, index) {
            var info = getProductInfo(name);
            var image = info ? info.image : "";
            var price = info ? formatPrice(info.price) : "";

            html +=
                '<div class="drawer-item">' +
                (image ? '<img src="' + escapeHtml(image) + '" alt="">' : "") +
                '<div class="drawer-info"><h4>' + escapeHtml(name) + "</h4>" +
                "<p>" + price + "</p>" +
                '<button type="button" class="drawer-mini-btn" data-action="addcart" data-index="' + index +
                '">Add to Cart</button></div>' +
                '<button type="button" class="drawer-remove" data-action="remove" data-index="' + index +
                '" aria-label="Remove"><i class="bi bi-trash"></i></button></div>';
        });

        body.innerHTML = html;
    }
}

// Clicks inside the panel (+, -, remove, clear, add to cart)
drawer.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) {
        return;
    }

    var action = button.dataset.action;
    var index = Number(button.dataset.index);

    if (drawerMode === "cart") {
        if (action === "clear") {
            cart = [];
        } else {
            if (!cart[index]) {
                return;
            }
            if (action === "plus") {
                cart[index].qty++;
            } else if (action === "minus") {
                cart[index].qty--;
                if (cart[index].qty <= 0) {
                    cart.splice(index, 1);
                }
            } else if (action === "remove") {
                cart.splice(index, 1);
            }
        }
        saveList("mobihubCart", cart);
        updateCartBadge();
        refreshDrawer();
    } else if (drawerMode === "wishlist") {
        if (action === "remove") {
            wishlist.splice(index, 1);
            saveList("mobihubWishlist", wishlist);
            refreshHearts();
            refreshDrawer();
        } else if (action === "addcart") {
            var product = getProductInfo(wishlist[index]);
            if (product) {
                addToCart(product);
            }
        }
    }
});

// Open from header icons
var headerCartIcon = $('.header-icons a[aria-label="Shopping Cart"]');
var headerWishlistIcon = $('.header-icons a[aria-label="Wishlist"]');

if (headerCartIcon) {
    headerCartIcon.addEventListener("click", function (event) {
        event.preventDefault();
        openDrawer("cart");
    });
}

if (headerWishlistIcon) {
    headerWishlistIcon.addEventListener("click", function (event) {
        event.preventDefault();
        openDrawer("wishlist");
    });
}

// Close with X, overlay click, or Escape
drawer.querySelector(".drawer-close").addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeDrawer();
    }
});