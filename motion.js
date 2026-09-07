/* VYRO — progressive motion and micro-interactions.
   Everything here is optional enhancement: if it fails, the site remains usable. */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  function addPointerGlow(element) {
    if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;
    element.addEventListener("pointermove", function (event) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty("--pointer-x", x.toFixed(2) + "%");
      element.style.setProperty("--pointer-y", y.toFixed(2) + "%");
    }, { passive: true });
  }

  function setupReveals() {
    const selector = [
      ".hero-content > *",
      ".hero-visual .cover",
      ".section-head",
      ".cat-card",
      ".product-card",
      ".shop-header > *",
      ".shop-toolbar",
      ".product-hero > *",
      ".tabs",
      ".related-heading",
      ".auth-card"
    ].join(",");

    const seen = new WeakSet();
    let observer = null;

    function prepare(root) {
      const scope = root && root.querySelectorAll ? root : document;
      const elements = Array.from(scope.querySelectorAll(selector));

      elements.forEach(function (element, index) {
        if (seen.has(element)) return;
        seen.add(element);
        element.classList.add("vyro-reveal");
        element.style.setProperty("--reveal-delay", Math.min(index % 5, 4) * 65 + "ms");
        addPointerGlow(element);

        if (reduceMotion || !observer) {
          element.classList.add("is-visible");
        } else {
          observer.observe(element);
        }
      });
    }

    if (!reduceMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }

    prepare(document);
    document.body.classList.add("motion-ready");

    if ("MutationObserver" in window) {
      const mutationObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(selector)) {
              const parent = node.parentElement || document;
              prepare(parent);
            } else {
              prepare(node);
            }
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  function setupFaqMotion() {
    document.querySelectorAll(".faq-item").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (details.open) details.classList.add("is-open");
        else details.classList.remove("is-open");
      });
    });
  }

  function init() {
    setupHeader();
    setupReveals();
    setupFaqMotion();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
