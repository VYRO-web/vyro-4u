/* ============================================================
   VYRO — CART (session-only prototype)
   Held in memory for this demo. In production this is replaced
   by a real cart/session service tied to the payment provider —
   see ADMIN-NOTES.md for what needs to be connected.
   ============================================================ */

const VyroCart = (function () {
  let items = [];

  function add(id) {
    const existing = items.find(function (i) { return i.id === id; });
    if (existing) { existing.qty += 1; } else { items.push({ id: id, qty: 1 }); }
    render();
    const p = vyroGetProduct(id);
    if (p) showToast(p.name + " added to cart");
  }

  function count() {
    return items.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function render() {
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      const n = count();
      el.textContent = n;
      el.style.display = n > 0 ? "flex" : "none";
    });
  }

  function showToast(message) {
    let toast = document.getElementById("vyro-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "vyro-toast";
      toast.className = "vyro-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("vyro-toast--visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove("vyro-toast--visible");
    }, 2200);
  }

  return { add: add, count: count, render: render };
})();

document.addEventListener("DOMContentLoaded", function () {
  VyroCart.render();

  const searchForm = document.querySelector("[data-search-form]");
  if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const q = searchForm.querySelector("input").value.trim();
      window.location.href = "shop.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  }

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      const open = mobileNav.classList.toggle("mobile-nav--open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
});
