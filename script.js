/* =========================================================
   NOVA MARKET — Store Interactions
   File: script.js
   Demo only: no real payments or order processing.
   ========================================================= */

"use strict";

const NOVA = {
  currency: "INR",
  locale: "en-IN",

  storage: {
    cart: "nova-market-cart-v1",
    wishlist: "nova-market-wishlist-v1"
  },

  products: [
    {
      id: "nova-001",
      name: "Everyday Sneakers",
      category: "Fashion",
      price: 2499,
      oldPrice: 3299,
      badge: "Bestseller",
      description: "Easygoing style for everyday adventures.",
      image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-002",
      name: "Minimal Crossbody",
      category: "Fashion",
      price: 1299,
      oldPrice: 1599,
      badge: "Popular",
      description: "A compact everyday carry essential.",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-003",
      name: "Studio Headphones",
      category: "Tech",
      price: 3499,
      oldPrice: 4299,
      badge: "Editor's pick",
      description: "A clean look for your listening routine.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-004",
      name: "Smart Desk Lamp",
      category: "Lifestyle",
      price: 1899,
      oldPrice: null,
      badge: "",
      description: "A softer glow for your favourite space.",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-005",
      name: "Everyday Watch",
      category: "Fashion",
      price: 2199,
      oldPrice: 2799,
      badge: "New find",
      description: "A versatile finishing touch.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-006",
      name: "Wireless Speaker",
      category: "Tech",
      price: 2799,
      oldPrice: null,
      badge: "",
      description: "Bring your favourite sounds along.",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-007",
      name: "Ceramic Mug Set",
      category: "Lifestyle",
      price: 899,
      oldPrice: 1099,
      badge: "Small favourite",
      description: "Make slow mornings feel special.",
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "nova-008",
      name: "Classic Backpack",
      category: "Fashion",
      price: 1799,
      oldPrice: null,
      badge: "",
      description: "Room for the essentials and then some.",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
    }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Browser storage is unavailable. Changes may not persist.", true);
    return false;
  }
}

function money(amount) {
  return new Intl.NumberFormat(NOVA.locale, {
    style: "currency",
    currency: NOVA.currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function findProduct(productId) {
  return NOVA.products.find(product => product.id === productId);
}

/* ---------- Initial state ---------- */

function loadCart() {
  const savedCart = readStorage(NOVA.storage.cart, []);

  if (!Array.isArray(savedCart)) return [];

  const combined = new Map();

  savedCart.forEach(item => {
    if (!item || typeof item.id !== "string" || !findProduct(item.id)) {
      return;
    }

    const quantity = Math.floor(Number(item.quantity));

    if (!Number.isFinite(quantity) || quantity < 1) return;

    combined.set(
      item.id,
      (combined.get(item.id) || 0) + quantity
    );
  });

  return Array.from(combined, ([id, quantity]) => ({ id, quantity }));
}

function loadWishlist() {
  const saved = readStorage(NOVA.storage.wishlist, []);

  if (!Array.isArray(saved)) return [];

  return saved.filter(id => typeof id === "string" && findProduct(id));
}

const state = {
  category: "All",
  query: "",
  sort: "featured",
  cart: loadCart(),
  wishlist: new Set(loadWishlist())
};

/* ---------- Product listing ---------- */

function getVisibleProducts() {
  let products = [...NOVA.products];

  if (state.category !== "All") {
    products = products.filter(
      product => product.category === state.category
    );
  }

  const query = state.query.trim().toLowerCase();

  if (query) {
    products = products.filter(product =>
      [product.name, product.category, product.description]
        .some(value => value.toLowerCase().includes(query))
    );
  }

  switch (state.sort) {
    case "price-low":
      products.sort((a, b) => a.price - b.price);
      break;

    case "price-high":
      products.sort((a, b) => b.price - a.price);
      break;

    case "name":
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return products;
}

function renderProducts() {
  const grid = $("#product-grid");
  if (!grid) return;

  const products = getVisibleProducts();

  if (!products.length) {
    grid.innerHTML = `
      <div class="products-placeholder">
        <span class="placeholder-symbol">⌕</span>
        <h3>No finds this time.</h3>
        <p>Try a different search or category to discover more products.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => {
    const wished = state.wishlist.has(product.id);

    const badge = product.badge
      ? `<span class="product-badge">${escapeHTML(product.badge)}</span>`
      : "";

    const oldPrice = product.oldPrice
      ? `<span class="product-old-price">${money(product.oldPrice)}</span>`
      : "";

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img
            class="product-image"
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
          >
          ${badge}

          <button
            class="wishlist-button ${wished ? "is-active" : ""}"
            type="button"
            data-wishlist="${product.id}"
            aria-label="${wished ? "Remove from" : "Add to"} wishlist: ${escapeHTML(product.name)}"
            aria-pressed="${wished}"
          >${wished ? "♥" : "♡"}</button>
        </div>

        <div class="product-info">
          <p class="product-category">${escapeHTML(product.category)}</p>
          <h3 class="product-title">${escapeHTML(product.name)}</h3>
          <p class="product-description">${escapeHTML(product.description)}</p>

          <div class="product-price-row">
            <div>
              <span class="product-price">${money(product.price)}</span>
              ${oldPrice}
            </div>

            <button
              class="add-to-cart"
              type="button"
              data-add="${product.id}"
            >+ Add</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/* ---------- Filters and search ---------- */

function setCategory(category) {
  state.category = category;

  $$(".filter-button").forEach(button => {
    const active = button.dataset.filter === category;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  renderProducts();
}

function setupFilters() {
  $("#category-filters")?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("[data-filter]");
    if (!button) return;

    setCategory(button.dataset.filter);
  });

  $$("[data-category-link]").forEach(link => {
    link.addEventListener("click", () => {
      setCategory(link.dataset.categoryLink);
    });
  });

  $("#sort-products")?.addEventListener("change", event => {
    state.sort = event.target.value;
    renderProducts();
  });

  const searchPanel = $("#search-panel");
  const searchInput = $("#product-search");

  $("#search-toggle")?.addEventListener("click", () => {
    if (!searchPanel) return;

    searchPanel.hidden = !searchPanel.hidden;

    if (!searchPanel.hidden) {
      searchInput?.focus();

      $("#shop")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    } else {
      state.query = "";

      if (searchInput) searchInput.value = "";

      renderProducts();
    }
  });

  searchPanel?.addEventListener("submit", event => {
    event.preventDefault();

    state.query = searchInput?.value || "";
    renderProducts();

    $("#product-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  searchInput?.addEventListener("input", () => {
    state.query = searchInput.value;
    renderProducts();
  });
}

/* ---------- Wishlist ---------- */

function toggleWishlist(productId) {
  const product = findProduct(productId);
  if (!product) return;

  if (state.wishlist.has(productId)) {
    state.wishlist.delete(productId);
    showToast("Removed from your wishlist.");
  } else {
    state.wishlist.add(productId);
    showToast("Added to your wishlist.");
  }

  writeStorage(NOVA.storage.wishlist, [...state.wishlist]);
  renderProducts();
}

/* ---------- Cart calculations ---------- */

function getCartCount() {
  return state.cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
}

function getCartSubtotal() {
  return state.cart.reduce((total, item) => {
    const product = findProduct(item.id);

    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function saveCart() {
  writeStorage(NOVA.storage.cart, state.cart);
  renderCart();
}

/* ---------- Add, remove and change quantity ---------- */

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: productId,
      quantity: 1
    });
  }

  saveCart();
  showToast(`${product.name} added to your bag.`);
}

function changeQuantity(productId, amount) {
  const item = state.cart.find(entry => entry.id === productId);
  if (!item) return;

  const change = Number(amount);

  if (!Number.isFinite(change) || !Number.isInteger(change)) return;

  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  item.quantity = newQuantity;
  saveCart();
}

function removeFromCart(productId) {
  const existing = state.cart.some(item => item.id === productId);
  if (!existing) return;

  state.cart = state.cart.filter(item => item.id !== productId);

  saveCart();

  showToast("Product removed from your bag.");
}

/* ---------- Render cart ---------- */

function renderCart() {
  const cartItems = $("#cart-items");
  const checkoutButton = $("#checkout-button");

  // Remove any invalid or outdated cart entries first.
  state.cart = state.cart.filter(item =>
    findProduct(item.id) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );

  const count = getCartCount();
  const subtotal = getCartSubtotal();

  const countBadge = $("#cart-count");
  const drawerCount = $("#drawer-cart-count");
  const subtotalElement = $("#cart-subtotal");

  if (countBadge) countBadge.textContent = count;
  if (drawerCount) drawerCount.textContent = `(${count})`;
  if (subtotalElement) subtotalElement.textContent = money(subtotal);

  if (checkoutButton) {
    checkoutButton.disabled = count === 0;
  }

  writeStorage(NOVA.storage.cart, state.cart);

  if (!cartItems) return;

  if (!state.cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">♡</span>
        <h3>Nothing in your bag. Yet.</h3>
        <p>There's something out there with your name on it.</p>

        <button
          class="button button-primary"
          id="continue-shopping"
          type="button"
        >Explore products</button>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = state.cart.map(item => {
    const product = findProduct(item.id);

    return `
      <article class="cart-line-item" data-cart-item="${product.id}">
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
        >

        <div class="cart-item-details">
          <h3>${escapeHTML(product.name)}</h3>
          <p class="cart-item-price">${money(product.price)}</p>

          <div class="quantity-control" aria-label="Quantity controls">
            <button
              type="button"
              data-quantity="${product.id}"
              data-change="-1"
              aria-label="Decrease quantity of ${escapeHTML(product.name)}"
            >−</button>

            <span class="quantity-value" aria-live="polite">${item.quantity}</span>

            <button
              type="button"
              data-quantity="${product.id}"
              data-change="1"
              aria-label="Increase quantity of ${escapeHTML(product.name)}"
            >+</button>
          </div>
        </div>

        <button
          class="remove-item"
          type="button"
          data-remove="${product.id}"
          aria-label="Remove ${escapeHTML(product.name)} from cart"
        >Remove</button>
      </article>
    `;
  }).join("");
}

/* ---------- Cart drawer ---------- */

function openCart() {
  const drawer = $("#cart-drawer");
  const backdrop = $("#drawer-backdrop");

  if (!drawer || !backdrop) return;

  renderCart();

  drawer.inert = false;
  drawer.setAttribute("aria-hidden", "false");

  backdrop.hidden = false;
  document.body.classList.add("drawer-open");

  requestAnimationFrame(() => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-visible");
    $("#cart-close")?.focus();
  });
}

function closeCart() {
  const drawer = $("#cart-drawer");
  const backdrop = $("#drawer-backdrop");

  if (!drawer || !backdrop) return;

  drawer.classList.remove("is-open");
  backdrop.classList.remove("is-visible");

  drawer.setAttribute("aria-hidden", "true");
  drawer.inert = true;

  document.body.classList.remove("drawer-open");
  $("#cart-toggle")?.focus();

  window.setTimeout(() => {
    if (!drawer.classList.contains("is-open")) {
      backdrop.hidden = true;
    }
  }, 400);
}

function setupCart() {
  $("#cart-toggle")?.addEventListener("click", openCart);
  $("#cart-close")?.addEventListener("click", closeCart);
  $("#drawer-backdrop")?.addEventListener("click", closeCart);

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      $("#cart-drawer")?.classList.contains("is-open")
    ) {
      closeCart();
    }
  });

  // One delegated click listener handles all cart controls,
  // including buttons recreated whenever the cart is rendered.
  $("#cart-items")?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const quantityButton = event.target.closest("button[data-quantity]");
    const removeButton = event.target.closest("button[data-remove]");
    const continueButton = event.target.closest("#continue-shopping");

    if (quantityButton) {
      event.preventDefault();

      const productId = quantityButton.dataset.quantity;
      const amount = Number(quantityButton.dataset.change);

      changeQuantity(productId, amount);
      return;
    }

    if (removeButton) {
      event.preventDefault();

      removeFromCart(removeButton.dataset.remove);
      return;
    }

    if (continueButton) {
      closeCart();
    }
  });

  $("#checkout-button")?.addEventListener("click", () => {
    if (state.cart.length === 0) return;

    showToast(
      "Demo only: secure checkout will be connected in a later phase."
    );
  });
}

/* ---------- Mobile navigation ---------- */

function setupMobileNavigation() {
  const toggle = $("#menu-toggle");
  const navigation = $("#main-navigation");

  if (!toggle || !navigation) return;

  function closeMenu() {
    navigation.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation"
    );

    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) closeMenu();
  });
}

/* ---------- Newsletter demo ---------- */

function setupNewsletter() {
  const form = $("#newsletter-form");
  const emailInput = $("#newsletter-email");
  const message = $("#newsletter-message");

  form?.addEventListener("submit", event => {
    event.preventDefault();

    if (!emailInput?.checkValidity()) {
      emailInput?.reportValidity();
      return;
    }

    if (message) {
      message.textContent =
        "Thanks for your interest! Newsletter sign-up is demo-only for now.";

      message.classList.remove("is-error");
      message.classList.add("is-success");
    }

    form.reset();
  });
}

/* ---------- Toast notifications ---------- */

function showToast(message, isError = false) {
  const container = $("#toast-container");
  if (!container) return;

  const toast = document.createElement("div");

  toast.className = `toast${isError ? " is-error" : ""}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");

    window.setTimeout(() => toast.remove(), 250);
  }, 2600);
}

/* ---------- Product actions ---------- */

function setupProductActions() {
  $("#product-grid")?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const addButton = event.target.closest("button[data-add]");
    const wishlistButton = event.target.closest("button[data-wishlist]");

    if (addButton) {
      addToCart(addButton.dataset.add);
      return;
    }

    if (wishlistButton) {
      toggleWishlist(wishlistButton.dataset.wishlist);
    }
  });
}

/* ---------- Start store ---------- */

function initNovaMarket() {
  const year = $("#current-year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  renderProducts();
  renderCart();

  setupFilters();
  setupCart();
  setupMobileNavigation();
  setupNewsletter();
  setupProductActions();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNovaMarket, {
    once: true
  });
} else {
  initNovaMarket();
}