(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = { overview: null, categories: [], products: [], page: 1, hasMore: false, selected: null, category: null, detail: null, dirty: false, bundleProducts: [], bundlePage: 1, bundleMore: false };
  const labels = { digital_file: "Digital file", software: "Software", bundle: "Bundle", external_access: "External access", coming_soon: "Coming soon", active: "Active", draft: "Draft", archived: "Archived" };
  const escape = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const list = (value) => Array.isArray(value) ? value : [];
  const lines = (value) => String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const date = (value) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
  const number = (value) => typeof value === "number" || (typeof value === "string" && value !== "") ? Number(value).toLocaleString() : "—";
  function money(value, currency) {
    if (value == null || !Number.isFinite(Number(value))) return "Not set";
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(Number(value)); }
    catch (_) { return Number(value).toFixed(2) + " " + (currency || ""); }
  }
  function size(value) {
    if (!value) return "0 bytes";
    const unit = Math.min(Math.floor(Math.log(Number(value)) / Math.log(1024)), 3);
    return (Number(value) / Math.pow(1024, unit)).toFixed(unit ? 1 : 0) + " " + ["bytes", "KB", "MB", "GB"][unit];
  }
  function safeCover(value) {
    if (!value) return "";
    try {
      const url = new URL(value, location.href);
      if ((url.protocol === "https:" || url.origin === location.origin) && !url.username && !url.password) return url.href;
    } catch (_) { /* Invalid asset paths are displayed as missing artwork. */ }
    return "";
  }
  function cover(value, className) {
    const url = safeCover(value);
    return url ? '<img class="' + (className || "admin-cover") + '" src="' + escape(url) + '" alt="" loading="lazy" decoding="async">' : '<div class="admin-cover-empty">NO COVER</div>';
  }
  function chip(value, tone) { return '<span class="admin-chip ' + (tone || "muted") + '">' + escape(value) + "</span>"; }
  function message(text, error, target) {
    const node = $(target || "adminMessage");
    node.textContent = text || "";
    node.classList.toggle("error", !!error);
    node.setAttribute("role", error ? "alert" : "status");
    node.hidden = !text;
  }
  function clearAdminData() {
    state.overview = null; state.categories = []; state.products = []; state.selected = null; state.detail = null; state.dirty = false;
    ["overviewStats", "readinessOverview", "revenueOverview", "recentPurchases", "orderList", "productList", "categoryList", "productEditor", "categoryForm", "previewBody"].forEach((id) => { $(id).replaceChildren(); });
  }
  async function api(path, options) {
    const client = window.VyroAuth.client();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    const token = data && data.session && data.session.access_token;
    if (!token) { const failure = new Error("Your session has ended. Sign in again to manage your store."); failure.status = 401; throw failure; }
    const settings = options || {};
    const response = await fetch("/api/admin/" + path, {
      method: settings.method || "GET",
      headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(settings.body ? { "Content-Type": "application/json" } : {}) },
      body: settings.body ? JSON.stringify(settings.body) : undefined,
      credentials: "same-origin", cache: "no-store"
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(typeof json.error === "string" ? json.error : json.error && json.error.message || json.message || "Store request failed. Please try again.");
      err.status = response.status;
      if (response.status === 401 || response.status === 403) {
        $("adminShell").hidden = true;
        $("adminGate").hidden = false;
        $("gateMessage").textContent = response.status === 403 ? "This account does not have store administrator permissions." : "Your session has ended. Sign in to continue.";
        $("adminSignIn").hidden = false;
        document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
        clearAdminData();
      }
      throw err;
    }
    return json;
  }
  async function run(button, target, operation) {
    if (button && button.disabled) return;
    const oldText = button && button.textContent;
    if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); button.textContent = "Working…"; }
    message("", false, target);
    try { await operation(); }
    catch (error) { message(error.message || "This action could not be completed.", true, target); }
    finally {
      if (button) {
        button.disabled = button.id === "previousProducts" ? state.page <= 1 : button.id === "nextProducts" ? !state.hasMore : false;
        button.removeAttribute("aria-busy"); button.textContent = oldText;
      }
    }
  }
  function selectPanel(panel, focus) {
    const titles = { overview: ["Overview", "A clear view of your catalog and purchases."], products: ["Products", "Create, organize and prepare your next release."], categories: ["Categories", "Give every product a place in your store."], orders: ["Recent orders", "Follow purchases and their payment status."] };
    if (!titles[panel]) return;
    document.querySelectorAll("[data-panel]").forEach((button) => {
      if (button.dataset.panel === panel) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    Object.keys(titles).forEach((key) => { $("panel" + key.charAt(0).toUpperCase() + key.slice(1)).hidden = key !== panel; });
    $("panelTitle").textContent = titles[panel][0];
    $("panelDescription").textContent = titles[panel][1];
    if (focus) $("panelTitle").focus();
  }
  function getMetric(source, keys) {
    for (const key of keys) if (source[key] != null) return source[key];
    return null;
  }
  function renderOrders(orders, compact) {
    if (!list(orders).length) return '<div class="admin-empty">No orders to show yet.</div>';
    return '<div class="admin-table-scroll" role="region" aria-label="' + (compact ? "Recent purchases" : "Recent orders") + '" tabindex="0"><table class="admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Date</th><th scope="col">Total</th><th scope="col">Status</th></tr></thead><tbody>' + list(orders).slice(0, compact ? 5 : 50).map((order) => '<tr><td class="admin-order-id">' + escape(order.id) + '<small>' + escape(order.provider || order.payment_provider || "whop") + '</small></td><td class="admin-email">' + escape(order.customer_email || "Email unavailable") + '</td><td>' + escape(date(order.created_at)) + '</td><td>' + escape(money(order.total, order.currency)) + '</td><td>' + chip(String(order.status || "pending").replace(/_/g, " "), order.status === "paid" ? "good" : "muted") + "</td></tr>").join("") + "</tbody></table></div>";
  }
  function renderOverview(payload) {
    const value = payload.overview || {};
    const total = getMetric(value, ["total_products", "products"]);
    const active = getMetric(value, ["active_products"]);
    const drafts = getMetric(value, ["draft_products"]);
    const paid = getMetric(value, ["paid_orders"]);
    const orders = getMetric(value, ["total_orders", "orders"]);
    const stats = [["Products", total, "Across your catalog"], ["Active products", active, "Published in the store"], ["Draft products", drafts, "Work in progress"], ["Paid orders", paid, number(orders) + " total orders"]];
    $("overviewStats").innerHTML = stats.map((item) => '<article class="admin-stat"><span class="admin-stat-label">' + item[0] + '</span><strong>' + number(item[1]) + '</strong><small>' + item[2] + "</small></article>").join("");
    const payments = payload.configured || {};
    $("readinessOverview").innerHTML = payments.free_mode
      ? '<div class="admin-check-row"><span>Bundled PDF products</span><strong>' + number(getMetric(value, ["total_products", "products"])) + '</strong></div><div class="admin-check-row"><span>Payments</span>' + chip("Disabled", "good") + '</div><div class="admin-check-row"><span>Store mode</span>' + chip("Free mode active", "good") + '</div><p class="admin-help admin-space-after">The current release serves the eight bundled guides directly. Commerce can be enabled later without rebuilding the visual storefront.</p>'
      : '<div class="admin-check-row"><span>Products missing paid files</span><strong>' + number(getMetric(value, ["products_missing_files", "missing_files"])) + '</strong></div><div class="admin-check-row"><span>Products missing payment setup</span><strong>' + number(getMetric(value, ["products_missing_payment", "products_missing_payment_configuration", "missing_payment_configuration", "missing_payment"])) + '</strong></div><div class="admin-check-row"><span>Whop connection</span>' + chip(payments.payments ? (payments.sandbox ? "Sandbox configured" : "Live configured") : "Payment setup required", payments.payments ? "good" : "warn") + '</div><p class="admin-help admin-space-after">Checkout also verifies the current price, delivery and payment configuration on the server.</p>';
    let revenues = value.revenue_by_currency || value.revenue || [];
    if (!Array.isArray(revenues) && revenues && typeof revenues === "object") revenues = Object.entries(revenues).map(([currency, amount]) => ({ currency, revenue: amount }));
    $("revenueOverview").innerHTML = list(revenues).length ? list(revenues).map((row) => '<div class="admin-revenue-row"><span>' + escape(row.currency) + '</span><strong>' + escape(money(row.total_amount ?? row.revenue ?? row.total ?? row.amount, row.currency)) + '</strong></div>').join("") : '<div class="admin-empty">No recorded paid revenue yet.</div>';
    const recent = payload.recent_orders || value.recent_orders || [];
    $("recentPurchases").innerHTML = renderOrders(recent.filter((order) => order.status === "paid"), true);
    $("orderList").innerHTML = renderOrders(recent, false);
    $("lastUpdated").textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  async function loadOverview() {
    if (window.VYRO_FREE_MODE?.enabled && window.VYRO_STATIC_CATALOG) {
      const products = window.VYRO_STATIC_CATALOG.products || [];
      state.overview = { overview: { total_products: products.length, active_products: products.length, draft_products: 0, paid_orders: 0, total_orders: 0, missing_files: 0, missing_payment_configuration: 0, revenue_by_currency: [] }, recent_orders: [], configured: { payments: false, sandbox: true, free_mode: true } };
      renderOverview(state.overview); return;
    }
    state.overview = await api("overview"); renderOverview(state.overview);
  }
  function productReadiness(product, detail) {
    if (window.VYRO_FREE_MODE?.enabled && product.free_file) return { ready: true, reasons: ["Free PDF is bundled with this release."] };
    if (product.checkout_ready === true || product.is_purchasable === true || product.readiness && product.readiness.ready) return { ready: true, reasons: ["The last server check passed. Checkout verifies this again before accepting payment."] };
    if (Array.isArray(product.readiness_reasons)) return { ready: false, reasons: product.readiness_reasons };
    if (product.readiness && Array.isArray(product.readiness.reasons)) return { ready: false, reasons: product.readiness.reasons };
    const reasons = [];
    if (product.status !== "active") reasons.push("Set the status to Active when you are ready to publish.");
    if (!(Number(product.price_amount) > 0)) reasons.push("Set a price greater than zero.");
    if (!product.whop_product_id || !product.whop_plan_id) reasons.push("Payment setup required: connect the matching Whop product and plan.");
    if (detail) {
      const assets = list(detail.assets).filter((asset) => asset.is_deliverable && !asset.is_public && asset.active !== false && asset.upload_status === "ready" && asset.file_size > 0);
      if (product.product_type === "external_access") { if (!product.external_access_url) reasons.push("Add the private external-access URL."); }
      else if (product.product_type === "bundle") { if (!assets.length && !list(detail.bundle_components).length) reasons.push("Add paid files or bundle components with working delivery."); }
      else if (!assets.length) reasons.push("Upload and finalize at least one real paid file.");
    if (product.product_type === "software" && !list(detail.releases).some((release) => release.active && release.published_at && new Date(release.published_at) <= new Date())) reasons.push("Publish an active software release linked to its installer.");
    }
    if (product.availability_reason && !reasons.length) reasons.push(String(product.availability_reason).replace(/_/g, " "));
    if (!reasons.length) reasons.push("Product settings are complete. The server must still verify storage and the connected payment plan.");
    return { ready: false, reasons };
  }
  function renderProducts() {
    $("productList").innerHTML = state.products.length ? state.products.map((product) => {
      const category = state.categories.find((item) => item.id === product.category_id);
      const ready = productReadiness(product);
      const action = window.VYRO_FREE_MODE?.enabled
        ? '<a class="btn btn-ghost btn-sm" href="/product.html?id=' + encodeURIComponent(product.slug || product.id) + '">View live →</a>'
        : '<button class="btn btn-ghost btn-sm" type="button" data-edit-product="' + escape(product.id) + '" aria-label="Edit ' + escape(product.name) + '">Manage →</button>';
      const readinessChip = window.VYRO_FREE_MODE?.enabled ? chip("PDF ready", "good") : chip(ready.ready ? "Checkout ready" : !product.whop_plan_id || !product.whop_product_id ? "Payment setup required" : "Review readiness", ready.ready ? "good" : "warn");
      return '<article class="admin-product-row">' + cover(product.cover_path) + '<div class="admin-product-info"><h3>' + escape(product.name) + '</h3><p>' + escape(category ? category.name : "Uncategorized") + ' · ' + escape(labels[product.product_type] || product.product_type) + ' · Position ' + escape(product.display_order || 0) + '</p><div class="admin-badges">' + chip(labels[product.status] || product.status, product.status === "active" ? "good" : "muted") + readinessChip + (product.featured ? chip("Featured") : "") + '</div></div><div class="admin-product-end"><strong>' + escape(window.VYRO_FREE_MODE?.enabled ? "Free" : money(product.price_amount, product.currency)) + '</strong>' + action + '</div></article>';
    }).join("") : '<div class="admin-empty">No products match these filters.</div>';
    $("productPage").textContent = "Page " + state.page;
    $("previousProducts").disabled = state.page <= 1;
    $("nextProducts").disabled = !state.hasMore;
  }
  async function loadProducts(page) {
    const query = new URLSearchParams(new FormData($("productFilters")));
    query.set("page", String(page || 1));
    $("productList").setAttribute("aria-busy", "true");
    try {
      if (window.VYRO_FREE_MODE?.enabled && window.VYRO_STATIC_CATALOG) {
        const q = String(query.get("q") || "").toLowerCase().trim(), status = query.get("status"), type = query.get("product_type");
        state.products = list(window.VYRO_STATIC_CATALOG.products).filter(p => (!q || (p.name + " " + p.slug).toLowerCase().includes(q)) && (!status || p.status === status) && (!type || p.product_type === type));
        state.page = 1; state.hasMore = false; renderProducts(); return;
      }
      const data = await api("products?" + query.toString());
      state.products = list(data.products); state.page = page || 1; state.hasMore = !!data.has_more;
      renderProducts();
    } finally { $("productList").removeAttribute("aria-busy"); }
  }
  function renderCategories() {
    $("categoryList").innerHTML = state.categories.length ? state.categories.map((category) => {
      const parent = state.categories.find((item) => item.id === category.parent_id);
      return '<article class="admin-category-row"><span class="admin-category-rank">' + escape(category.display_order || 0) + '</span><div><h3>' + escape(parent ? parent.name + " / " : "") + escape(category.name) + '</h3><p>' + escape(category.description || "No description") + '</p><p>/' + escape(category.slug) + '</p></div>' + chip(category.active ? "Visible" : "Hidden", category.active ? "good" : "muted") + (window.VYRO_FREE_MODE?.enabled ? '' : '<button class="btn btn-ghost btn-sm" type="button" data-edit-category="' + escape(category.id) + '" aria-label="Edit ' + escape(category.name) + '">Edit</button>') + '</article>';
    }).join("") : '<div class="admin-empty">Create your first category to organize the store.</div>';
  }
  async function loadCategories() {
    if (window.VYRO_FREE_MODE?.enabled && window.VYRO_STATIC_CATALOG) { state.categories = list(window.VYRO_STATIC_CATALOG.categories); renderCategories(); return; }
    const data = await api("categories"); state.categories = list(data.categories); renderCategories();
  }
  function field(key, title, value, options) {
    const settings = { ...(options || {}) };
    const fieldLimits = { name: 200, slug: 100, category_slug: 120, subcategory: 120, short_description: 1000, full_description: 30000, who_for: 3000, cover_path: 2048, version: 80, release_notes: 15000 };
    if (fieldLimits[key]) settings.max = fieldLimits[key];
    if (key === "status") {
      settings.options = [["draft", "Draft"], ["coming_soon", "Coming soon"], ["active", "Active"], ["archived", "Archived"]];
      settings.help = "Drafts are private. Coming Soon has no checkout. Active products must pass server checks.";
    }
    const id = "p_" + key;
    let control;
    if (settings.options) control = '<select id="' + id + '" name="' + key + '">' + settings.options.map(([val, name]) => '<option value="' + escape(val) + '"' + (String(value == null ? "" : value) === String(val) ? " selected" : "") + '>' + escape(name) + '</option>').join("") + '</select>';
    else if (settings.textarea) control = '<textarea id="' + id + '" name="' + key + '" rows="' + (settings.rows || 3) + '" maxlength="' + (settings.max || 20000) + '">' + escape(Array.isArray(value) ? value.join("\n") : value) + '</textarea>';
    else control = '<input id="' + id + '" name="' + key + '" type="' + (settings.type || "text") + '" value="' + escape(value) + '"' + (settings.required ? " required" : "") + (settings.pattern ? ' pattern="' + settings.pattern + '"' : "") + (settings.min != null ? ' min="' + settings.min + '"' : "") + (settings.step ? ' step="' + settings.step + '"' : "") + ' maxlength="' + (settings.max || 1000) + '"' + (settings.list ? ' list="' + settings.list + '"' : "") + '>';
    return '<label class="admin-field' + (settings.wide ? " admin-field-wide" : "") + '" for="' + id + '">' + escape(title) + control + (settings.help ? '<span class="admin-help">' + escape(settings.help) + '</span>' : "") + '</label>';
  }
  function checked(key, title, value) { return '<label class="admin-checkbox"><input type="checkbox" name="' + key + '"' + (value ? " checked" : "") + '><span>' + escape(title) + '</span></label>'; }
  function section(title, body, id, open) { return '<details class="admin-editor-section"' + (id ? ' id="' + id + '"' : "") + (open ? " open" : "") + '><summary>' + title + '</summary><div class="admin-editor-section-body">' + body + '</div></details>'; }
  function defaultProduct() { return { name: "", slug: "", status: "draft", product_type: "digital_file", currency: "USD", price_amount: "", display_order: 0, delivery_mode: "download" }; }
  function productFormHTML(product) {
    const categoryOptions = [["", "Choose a category"], ...state.categories.map((category) => [category.id, category.name + (category.active ? "" : " (hidden)")])];
    const basics = '<div class="admin-form-grid">' + field("name", "Product name", product.name, { required: true, max: 240, wide: true }) + field("slug", "Product URL slug", product.slug, { required: true, pattern: "[a-z0-9]+(-[a-z0-9]+)*", max: 160, help: "Lowercase words with hyphens. Changing a published slug changes its link." }) + field("product_type", "Product type", product.product_type, { options: [["digital_file", "Digital file"], ["software", "Software / app"], ["bundle", "Bundle"], ["external_access", "External access"]] }) + field("status", "Publishing status", product.status, { options: [["draft", "Draft — private"], ["coming_soon", "Coming soon — public, no checkout"], ["active", "Active — subject to checkout readiness"], ["archived", "Archived — removed from the shop"]] }) + field("category_id", "Category", product.category_id, { options: categoryOptions }) + field("subcategory", "Subcategory / label", product.subcategory, { list: "subcategoryOptions", help: "Choose an existing label or type a new one. Manage nested categories in Categories." }) + field("display_order", "Display order", product.display_order ?? 0, { type: "number", min: 0, step: 1, help: "Lower numbers appear first in the default store order." }) + '</div><datalist id="subcategoryOptions">' + [...new Set(state.categories.flatMap((category) => list(category.subcategories)))].map((name) => '<option value="' + escape(name) + '">').join("") + '</datalist><div class="admin-flags">' + checked("featured", "Featured on homepage", product.featured) + checked("bestseller", "Bestseller", product.bestseller) + checked("is_new", "New", product.is_new) + '</div><p class="admin-help">Use the Bestseller label only when it reflects your real sales.</p>';
    const content = '<div class="admin-form-grid">' + field("short_description", "Short description", product.short_description, { textarea: true, max: 1200, wide: true }) + field("full_description", "Full description", product.full_description, { textarea: true, rows: 6, wide: true, help: "Plain text. Customer-facing text is escaped for safety." }) + field("who_for", "Who it is for", product.who_for, { textarea: true, wide: true }) + field("included_items", "Included resources", product.included_items, { textarea: true, help: "One item per line. List only resources you will actually deliver." }) + field("learning_points", "Learning points", product.learning_points, { textarea: true, help: "One point per line." }) + field("format", "Format", product.format, { max: 200, help: "For example: PDF guide + printable tracker." }) + field("pages_text", "Pages / resources", product.pages_text, { max: 200 }) + field("release_date", "Release date", product.release_date, { type: "date" }) + field("license_url", "License terms / EULA URL", product.license_url, { type: "url", help: "Optional HTTPS link to your actual license terms." }) + '</div>';
    const commerce = '<div class="admin-form-grid">' + field("price_amount", "Price", product.price_amount, { type: "number", min: 0, step: "0.01", help: "Amount in the selected currency, for example 24.00." }) + field("compare_at_price", "Compare-at price", product.compare_at_price, { type: "number", min: 0, step: "0.01", help: "Optional genuine previous price. Leave empty for no sale." }) + field("currency", "Currency", product.currency || "USD", { required: true, max: 3, pattern: "[A-Za-z]{3}", help: "Three-letter currency code, for example USD or EUR." }) + field("delivery_mode", "Delivery mode", product.delivery_mode || "download", { options: [["download", "Secure download"], ["external", "External access"]] }) + field("whop_product_id", "Whop product ID", product.whop_product_id, { help: "Copy the real product ID from your matching Whop environment." }) + field("whop_plan_id", "Whop plan ID", product.whop_plan_id, { help: "The plan amount, currency and product must match this listing." }) + field("external_access_url", "Private external-access URL", product.external_access_url, { type: "url", wide: true, help: "For external-access products only. Use HTTPS; shared links cannot enforce third-party access on their own." }) + '</div><p class="admin-file-warning">Payment setup required until real Whop IDs are connected. The server blocks checkout when the product, price, delivery or payment configuration is incomplete.</p>';
    const software = '<div class="admin-form-grid">' + field("software_version", "Software version shown in product details", product.software_version, { max: 80 }) + field("platforms", "Supported platforms", product.platforms, { textarea: true, help: "One per line: Windows, macOS, Linux, or another real platform." }) + field("system_requirements", "System requirements", product.system_requirements, { textarea: true, wide: true, help: "One requirement per line. Publish releases and installers below." }) + '</div>';
    const seo = '<div class="admin-form-grid">' + field("seo_title", "Search title", product.seo_title, { max: 240, wide: true }) + field("seo_description", "Search description", product.seo_description, { textarea: true, max: 1000, wide: true }) + field("cover_path", "Current cover path / public image URL", product.cover_path, { wide: true, help: "Existing artwork paths are retained. Upload a cover below to update the public cover safely." }) + '</div>';
    return '<form id="productForm" class="admin-form">' + section("01 / Product & publishing", basics, "", true) + section("02 / Descriptions & resources", content, "", false) + section("03 / Pricing & Whop checkout", commerce, "", true) + section("Software details", software, "softwareFields", false) + section("Search & artwork settings", seo, "", false) + '</form>';
  }
  function renderEditor() {
    const product = state.selected || defaultProduct();
    const ready = productReadiness(product, state.detail);
    $("productDialogTitle").textContent = product.id ? product.name : "New product";
    $("productEditor").innerHTML = '<div class="admin-readiness"><strong>' + (ready.ready ? "Checkout ready" : "Publishing checklist") + '</strong><ul>' + ready.reasons.map((reason) => '<li>' + escape(reason) + '</li>').join("") + '</ul></div>' + productFormHTML(product) + (product.id ? section("04 / Artwork & paid files", '<div id="productAssets"></div><div id="uploadArea"></div>', "assetSection", true) + section("Software releases", '<div id="productReleases"></div><div id="releaseArea"></div>', "releaseSection", true) + section("Bundle components", '<p class="admin-help">Bundle components are granted after verified purchase. Add products with real delivery. The server rejects circular bundles.</p><div id="bundleOptions" class="admin-bundle-options"></div><div class="admin-inline-actions"><button type="button" class="btn btn-ghost btn-sm" id="moreBundleProducts">Load more products</button><button type="button" class="btn btn-secondary btn-sm" id="saveBundle">Save bundle components</button></div>', "bundleSection", true) : '<p class="admin-file-warning">Save this product as a draft first. Then upload real files, add releases or configure bundle components.</p>');
    $("duplicateProduct").hidden = !product.id;
    $("archiveProduct").hidden = !product.id || product.status === "archived";
    $("productForm").addEventListener("submit", saveProduct);
    $("productForm").addEventListener("input", () => { state.dirty = true; });
    $("p_product_type").addEventListener("change", toggleTypeSections);
    $("p_name").addEventListener("input", () => {
      if (!product.id && !$("p_slug").dataset.edited) $("p_slug").value = $("p_name").value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    });
    $("p_slug").addEventListener("input", () => { $("p_slug").dataset.edited = "true"; });
    if (product.id) { renderAssets(); renderUpload(); renderReleases(); renderBundleOptions(); }
    toggleTypeSections();
  }
  function toggleTypeSections() {
    const type = $("p_product_type").value;
    $("softwareFields").hidden = type !== "software";
    if ($("releaseSection")) $("releaseSection").hidden = type !== "software";
    if ($("bundleSection")) $("bundleSection").hidden = type !== "bundle";
  }
  async function openProduct(id) {
    state.dirty = false;
    if (id) {
      state.detail = await api("product?id=" + encodeURIComponent(id));
      state.selected = state.detail.product;
      if (!state.selected) throw new Error("This product could not be found.");
    } else { state.selected = defaultProduct(); state.detail = { assets: [], releases: [], bundle_components: [] }; }
    state.bundleProducts = []; state.bundlePage = 0; state.bundleMore = true;
    state.bundleSelections = new Set(list(state.detail.bundle_components).map((item) => item.component_product_id || item.id));
    if (state.selected.product_type === "bundle") {
      const data = await api("products?page=1"); state.bundleProducts = list(data.products); state.bundlePage = 1; state.bundleMore = !!data.has_more;
    }
    renderEditor(); message("", false, "productMessage");
    if (!$("productDialog").open) $("productDialog").showModal();
  }
  function readProduct() {
    const form = new FormData($("productForm"));
    const product = {};
    for (const [key, value] of form) product[key] = String(value).trim();
    ["featured", "bestseller", "is_new"].forEach((key) => { product[key] = form.has(key); });
    ["included_items", "learning_points", "system_requirements", "platforms"].forEach((key) => { product[key] = lines(product[key]); });
    ["price_amount", "compare_at_price"].forEach((key) => { product[key] = product[key] === "" ? null : Number(product[key]); });
    product.display_order = Number(product.display_order || 0);
    ["category_id", "release_date", "whop_product_id", "whop_plan_id", "external_access_url", "license_url"].forEach((key) => { product[key] = product[key] || null; });
    product.currency = product.currency.toUpperCase();
    if (product.product_type === "external_access") product.delivery_mode = "external";
    else product.delivery_mode = "download";
    return product;
  }
  async function saveProduct(event) {
    event.preventDefault();
    await run($("saveProduct"), "productMessage", async () => {
      const product = readProduct();
      const existing = state.selected.id;
      const result = await api("product", { method: existing ? "PATCH" : "POST", body: existing ? { id: existing, product } : { product } });
      const saved = result.product || result;
      const id = saved.id || existing;
      if (!id) throw new Error("Product saved, but its ID was not returned. Refresh your product list before continuing.");
      state.dirty = false;
      await openProduct(id);
      message("Product saved. Readiness is checked again by the server before checkout.", false, "productMessage");
      await Promise.all([loadProducts(state.page), loadOverview()]);
    });
  }

  function requireSaved() {
    if (state.dirty) throw new Error("Save your product changes first, then manage its files, releases or bundle components.");
  }
  async function refreshDetail() {
    state.detail = await api("product?id=" + encodeURIComponent(state.selected.id));
    state.selected = state.detail.product;
    if (!state.dirty && $("p_cover_path")) $("p_cover_path").value = state.selected.cover_path || "";
    renderAssets(); renderReleases();
  }
  function renderAssets() {
    const assets = list(state.detail.assets);
    $("productAssets").innerHTML = assets.length ? '<div class="admin-file-list">' + assets.map((asset) => '<article class="admin-file" data-asset="' + escape(asset.id) + '"><div class="admin-file-heading"><strong>' + escape(asset.original_filename) + '</strong><div class="admin-badges">' + chip(asset.is_public ? "Public artwork" : "Private paid file", asset.is_public ? "muted" : "good") + chip(asset.upload_status === "ready" ? "Verified upload" : "Upload pending", asset.upload_status === "ready" ? "good" : "warn") + '</div></div><p class="admin-file-meta">' + escape(asset.asset_type) + ' · ' + escape(size(asset.file_size)) + ' · ' + escape(asset.mime_type) + ' · Uploaded ' + escape(date(asset.created_at)) + '</p><div class="admin-file-fields"><label class="admin-field">Display name<input type="text" data-asset-field="display_name" maxlength="240" value="' + escape(asset.display_name) + '"></label><label class="admin-field">Version<input type="text" data-asset-field="version" maxlength="100" value="' + escape(asset.version) + '"></label><label class="admin-field">Order<input type="number" min="0" step="1" data-asset-field="display_order" value="' + escape(asset.display_order || 0) + '"></label></div><div class="admin-inline-actions"><label class="admin-checkbox"><input type="checkbox" data-asset-field="active"' + (asset.active ? ' checked' : '') + '><span>Available to eligible buyers</span></label><button type="button" class="btn btn-ghost btn-sm" data-save-asset="' + escape(asset.id) + '">Save file details</button>' + (asset.upload_status !== "ready" ? '<button type="button" class="btn btn-secondary btn-sm" data-finalize-asset="' + escape(asset.id) + '">Retry verification</button>' : "") + '</div><p class="admin-help">' + (asset.is_public ? "Public assets must contain only previews or artwork." : "Turning off availability affects existing buyers. File history is retained; the dashboard never deletes paid files.") + '</p></article>').join("") + '</div>' : '<div class="admin-empty">No files uploaded yet. Artwork alone does not make a product deliverable.</div>';
  }
  function renderUpload() {
    $("uploadArea").innerHTML = '<h3>Add a file or a new version</h3><form id="uploadForm" class="admin-form"><div class="admin-form-grid"><label class="admin-field">File role<select name="asset_type" id="uploadAssetType"><option value="cover">Cover — public image</option><option value="preview">Preview — public image</option><option value="gallery">Gallery — public image</option><option value="pdf">PDF — private</option><option value="zip">ZIP pack — private</option><option value="installer">Installer — private</option><option value="executable">Executable — private</option><option value="dmg">macOS disk image — private</option><option value="archive">Archive — private</option><option value="resource">Resource — private</option><option value="documentation">Documentation — private</option></select></label><label class="admin-field">Display name<input name="display_name" type="text" maxlength="240" placeholder="Optional customer-facing filename"></label><label class="admin-field">Version<input name="version" type="text" maxlength="100" placeholder="Optional, for example 1.1"></label><label class="admin-field">Choose file<input name="file" type="file" id="uploadFile" required><span class="admin-help">Public images: PNG, JPEG, WebP or AVIF up to 12 MB. Private files: PDF, ZIP, 7z, GZ, TAR, EXE, MSI, DMG, AppImage, DEB or RPM up to 512 MB, subject to your storage plan.</span></label></div><p class="admin-file-warning" id="uploadVisibility">This image will be public. Never upload a paid product as a cover or preview.</p><label class="admin-checkbox"><input type="checkbox" name="safety_confirmed" required><span>I have checked this file, have the rights to distribute it, and scanned any installer or executable for malware. File validation does not replace a malware scan.</span></label><progress class="admin-upload-progress" id="uploadProgress" value="0" max="100" aria-label="File upload progress" hidden></progress><p id="uploadStatus" class="admin-help" role="status" aria-live="polite"></p><div><button type="submit" class="btn btn-secondary" id="uploadButton">Upload file</button></div></form>';
    const updateType = () => {
      const publicAsset = ["cover", "preview", "gallery"].includes($("uploadAssetType").value);
      $("uploadVisibility").textContent = publicAsset ? "This image will be public. Never upload a paid product as a cover or preview." : "This file goes to private storage. Buyers receive temporary links only after the server verifies their entitlement.";
      $("uploadFile").accept = publicAsset ? ".png,.jpg,.jpeg,.webp,.avif" : ".pdf,.zip,.7z,.gz,.tar,.exe,.msi,.dmg,.appimage,.deb,.rpm";
    };
    $("uploadAssetType").addEventListener("change", updateType); updateType();
    $("uploadForm").addEventListener("submit", uploadFile);
  }
  function putFile(url, file, mime) {
    const expected = new URL(window.VYRO_SUPABASE_URL);
    const destination = new URL(url);
    if (destination.protocol !== "https:" || destination.origin !== expected.origin || !destination.pathname.startsWith("/storage/v1/object/upload/sign/")) throw new Error("The server returned an unexpected storage upload destination.");
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", destination.href, true);
      xhr.setRequestHeader("Content-Type", mime || "application/octet-stream");
      xhr.timeout = 30 * 60 * 1000;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) { const percentage = Math.round(event.loaded / event.total * 100); $("uploadProgress").value = percentage; $("uploadStatus").textContent = "Uploading… " + percentage + "%"; }
      };
      xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection, then upload again."));
      xhr.ontimeout = () => reject(new Error("The upload timed out. Check your connection and storage file-size limits."));
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Storage did not accept this file (" + xhr.status + "). Check the file size and storage configuration."));
      xhr.send(file);
    });
  }
  async function uploadFile(event) {
    event.preventDefault();
    await run($("uploadButton"), "productMessage", async () => {
      requireSaved();
      const form = new FormData($("uploadForm"));
      const file = form.get("file");
      if (!(file instanceof File) || file.size < 1) throw new Error("Choose a non-empty file.");
      const publicAsset = ["cover", "preview", "gallery"].includes(form.get("asset_type"));
      if (file.size > (publicAsset ? 12 : 512) * 1024 * 1024) throw new Error("This file exceeds the allowed upload size.");
      $("uploadProgress").hidden = false; $("uploadProgress").value = 0; $("uploadStatus").textContent = "Preparing a secure upload…";
      let pendingID = null;
      try {
        const upload = await api("upload", { method: "POST", body: { product_id: state.selected.id, asset_type: form.get("asset_type"), filename: file.name, file_size: file.size, mime_type: file.type || "application/octet-stream", display_name: form.get("display_name"), version: form.get("version"), safety_confirmed: form.has("safety_confirmed") } });
        pendingID = upload.asset_id;
        await putFile(upload.upload_url, file, upload.mime_type);
        $("uploadStatus").textContent = "Upload received. Verifying the stored file…";
        await api("upload", { method: "POST", body: { action: "finalize", asset_id: pendingID } });
        await refreshDetail();
        $("uploadForm").reset(); $("uploadAssetType").dispatchEvent(new Event("change"));
        $("uploadStatus").textContent = "File uploaded and verified. Software installers also need a published release.";
        message("File uploaded. Previous files and versions have been retained.", false, "productMessage");
        await Promise.all([loadProducts(state.page), loadOverview()]);
      } catch (error) {
        $("uploadStatus").textContent = pendingID ? "The upload is not ready for delivery. Review the pending file and retry verification if the transfer completed." : "Upload did not complete.";
        if (pendingID) { try { await refreshDetail(); } catch (_) { /* The primary upload failure remains visible. */ } }
        throw error;
      } finally { $("uploadProgress").hidden = true; }
    });
  }
  function renderReleases() {
    const releases = list(state.detail.releases);
    $("productReleases").innerHTML = releases.length ? '<div class="admin-release-list">' + releases.map((release) => '<article class="admin-file"><div class="admin-file-heading"><strong>' + escape(release.platform) + ' / ' + escape(release.version) + '</strong>' + chip(release.active ? "Active release" : "Inactive", release.active ? "good" : "muted") + '</div><p class="admin-file-meta">' + escape(release.architecture || "Architecture not specified") + ' · ' + escape(release.minimum_os || "Minimum OS not specified") + ' · Published ' + escape(date(release.published_at)) + '</p><p class="admin-release-notes">' + escape(release.release_notes || "No release notes") + '</p><div class="admin-inline-actions"><button class="btn btn-ghost btn-sm" type="button" data-edit-release="' + escape(release.id) + '">Edit release</button><button class="btn btn-ghost btn-sm" type="button" data-toggle-release="' + escape(release.id) + '">' + (release.active ? "Deactivate" : "Activate") + '</button></div></article>').join("") + '</div>' : '<div class="admin-empty">No software releases yet. Add only an app you have actually built and verified.</div>';
    renderReleaseForm(null);
  }
  function renderReleaseForm(release) {
    const value = release || { platform: "windows", active: false };
    const assets = list(state.detail.assets).filter((asset) => asset.is_deliverable && !asset.is_public && asset.active && asset.upload_status === "ready");
    $("releaseArea").innerHTML = '<h3>' + (release ? "Edit release" : "Add release") + '</h3><form id="releaseForm" class="admin-form" data-release-id="' + escape(value.id || "") + '"><div class="admin-form-grid">' + field("version", "Release version", value.version, { required: true, max: 80 }) + field("platform", "Platform", value.platform, { options: [["windows", "Windows"], ["macos", "macOS"], ["linux", "Linux"], ["web", "Web"], ["other", "Other"]] }) + field("architecture", "Architecture", value.architecture, { max: 120, help: "For example x64, ARM64 or universal." }) + field("minimum_os", "Minimum OS", value.minimum_os, { max: 240 }) + field("asset_id", "Verified installer / archive", value.asset_id, { options: [["", "Select an uploaded private file"], ...assets.map((asset) => [asset.id, (asset.display_name || asset.original_filename) + (asset.version ? " — " + asset.version : "")])], wide: true }) + field("release_notes", "Release notes", value.release_notes, { textarea: true, wide: true, rows: 4 }) + '</div>' + checked("active", "Publish this release for eligible buyers", value.active) + '<p class="admin-help">Existing buyers see active releases permitted by their entitlement. Keep the old files for history; activate new releases only after testing the real installer.</p><div class="admin-inline-actions"><button class="btn btn-secondary" type="submit" id="saveRelease">' + (release ? "Save release" : "Add release") + '</button>' + (release ? '<button class="btn btn-ghost btn-sm" type="button" id="cancelReleaseEdit">Cancel edit</button>' : "") + '</div></form>';
    $("releaseForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await run($("saveRelease"), "productMessage", async () => {
        requireSaved();
        const form = new FormData($("releaseForm"));
        if (!form.get("asset_id")) throw new Error("Upload a real installer or archive and select its verified file first.");
        const data = { product_id: state.selected.id, version: String(form.get("version")).trim(), platform: form.get("platform"), architecture: String(form.get("architecture")).trim(), minimum_os: String(form.get("minimum_os")).trim(), asset_id: form.get("asset_id"), release_notes: String(form.get("release_notes")).trim(), active: form.has("active") };
        await api("release", { method: value.id ? "PATCH" : "POST", body: { ...(value.id ? { id: value.id } : {}), release: data } });
        await refreshDetail(); message("Software release saved. Active releases are available only to eligible buyers.", false, "productMessage"); await loadOverview();
      });
    });
    if ($("cancelReleaseEdit")) $("cancelReleaseEdit").addEventListener("click", () => renderReleaseForm(null));
  }
  function renderBundleOptions() {
    const products = state.bundleProducts.filter((product) => product.id !== state.selected.id);
    const knownIDs = new Set(products.map((product) => product.id));
    const unseen = [...state.bundleSelections].filter((id) => !knownIDs.has(id));
    $("bundleOptions").innerHTML = (products.length ? products.map((product) => '<label class="admin-checkbox"><input type="checkbox" value="' + escape(product.id) + '" data-bundle-component' + (state.bundleSelections.has(product.id) ? " checked" : "") + '><span>' + escape(product.name) + ' <span class="admin-help">(' + escape(labels[product.status] || product.status) + ')</span></span></label>').join("") : '<p class="admin-help">Load products to choose bundle components.</p>') + unseen.map((id) => '<label class="admin-checkbox"><input type="checkbox" value="' + escape(id) + '" data-bundle-component checked><span>Saved component <span class="admin-help">' + escape(id) + '</span></span></label>').join("");
    $("moreBundleProducts").hidden = !state.bundleMore;
  }
  function openCategory(id) {
    state.category = id ? state.categories.find((item) => item.id === id) : { active: true, display_order: 0 };
    if (!state.category) throw new Error("This category could not be found.");
    const value = state.category;
    $("categoryDialogTitle").textContent = id ? "Edit category" : "New category";
    $("categoryForm").innerHTML = '<div class="admin-form-grid">' + field("category_name", "Category name", value.name, { required: true, max: 120, wide: true }) + field("category_slug", "URL slug", value.slug, { required: true, pattern: "[a-z0-9]+(-[a-z0-9]+)*", max: 160, help: "Changing a slug changes category links. Update any links you have shared." }) + field("parent_id", "Parent category", value.parent_id, { options: [["", "Top-level category"], ...state.categories.filter((item) => item.id !== value.id).map((item) => [item.id, item.name])] }) + field("category_description", "Description", value.description, { textarea: true, wide: true, max: 2000 }) + field("subcategories", "Suggested subcategory labels", value.subcategories, { textarea: true, wide: true, help: "One per line. For independent categories with their own filters, create nested categories instead." }) + field("category_display_order", "Display order", value.display_order ?? 0, { type: "number", min: 0, step: 1, help: "Lower numbers appear first." }) + '</div>' + checked("category_active", "Show this category in the store", value.active);
    message("", false, "categoryMessage");
    if (!id) {
      $("p_category_name").addEventListener("input", () => { if (!$("p_category_slug").dataset.edited) $("p_category_slug").value = $("p_category_name").value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });
      $("p_category_slug").addEventListener("input", () => { $("p_category_slug").dataset.edited = "true"; });
    }
    $("categoryDialog").showModal();
  }
  function previewProduct() {
    const product = readProduct();
    $("previewBody").innerHTML = '<article class="admin-preview"><p class="admin-file-warning">Admin preview of current form values. This does not publish the product or enable checkout.</p>' + (safeCover(product.cover_path) ? cover(product.cover_path, "admin-preview-cover") : "") + '<div class="admin-badges">' + chip(labels[product.product_type]) + chip(labels[product.status]) + '</div><h3>' + escape(product.name || "Untitled product") + '</h3><strong>' + escape(money(product.price_amount, product.currency)) + '</strong><p>' + escape(product.short_description) + '</p><p>' + escape(product.full_description) + '</p>' + (product.included_items.length ? '<h4>Included resources</h4><ul>' + product.included_items.map((item) => '<li>' + escape(item) + '</li>').join("") + '</ul>' : "") + (product.product_type === "software" ? '<h4>System requirements</h4><ul>' + product.system_requirements.map((item) => '<li>' + escape(item) + '</li>').join("") + '</ul>' : "") + '</article>';
    $("previewDialog").showModal();
  }
  async function initialize() {
    $("adminGate").hidden = false; $("adminShell").hidden = true; $("retryAdmin").hidden = true; $("adminSignIn").hidden = true;
    $("gateMessage").textContent = "Checking your account and store permissions…";
    try {
      if (!window.VyroAuth || !window.VyroAuth.configured()) throw new Error("Store authentication needs configuration. Follow SUPABASE_COMMERCE_SETUP.md before opening administration.");
      const { data, error } = await window.VyroAuth.client().auth.getSession();
      if (error) throw error;
      if (!data || !data.session) { $("gateMessage").textContent = "Sign in with your administrator account to manage products, files and releases."; $("adminSignIn").hidden = false; return; }
      // This request authorizes the user on the server before any admin data is shown.
      await loadOverview();
      await loadCategories();
      await loadProducts(1);
      if (window.VYRO_FREE_MODE?.enabled) {
        $("newProduct").hidden = true; $("newCategory").hidden = true;
        const reconcile = $("reconcileForm"); if (reconcile) reconcile.hidden = true;
        message("Free mode is active. The eight bundled PDF products are live and payments are disabled. Catalog editing will be re-enabled when you switch back to the commerce backend.");
      }
      $("adminGate").hidden = true; $("adminShell").hidden = false;
    } catch (error) {
      $("gateMessage").textContent = error.status === 403 ? "This account does not have store administrator permissions. The store owner must assign your role securely in Supabase." : error.message || "Store administration is unavailable. Check the setup and try again.";
      $("adminSignIn").hidden = error.status !== 401 && error.status !== 403;
      $("retryAdmin").hidden = false;
    }
  }
  document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => selectPanel(button.dataset.panel, true)));
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => selectPanel(button.dataset.go, true)));
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.close === "productDialog" && state.dirty && !window.confirm("Close without saving your product changes?")) return;
    $(button.dataset.close).close();
  }));
  $("productDialog").addEventListener("cancel", (event) => { if (state.dirty && !window.confirm("Close without saving your product changes?")) event.preventDefault(); });
  $("newProduct").addEventListener("click", (event) => run(event.currentTarget, "adminMessage", () => openProduct(null)));
  $("newCategory").addEventListener("click", () => openCategory(null));
  $("previewProduct").addEventListener("click", previewProduct);
  $("retryAdmin").addEventListener("click", initialize);
  $("productFilters").addEventListener("submit", (event) => { event.preventDefault(); run(event.submitter, "adminMessage", () => loadProducts(1)); });
  $("previousProducts").addEventListener("click", (event) => run(event.currentTarget, "adminMessage", () => loadProducts(state.page - 1)));
  $("nextProducts").addEventListener("click", (event) => run(event.currentTarget, "adminMessage", () => loadProducts(state.page + 1)));
  $("refreshOrders").addEventListener("click", (event) => run(event.currentTarget, "adminMessage", loadOverview));
  $("reconcileForm").addEventListener("submit", (event) => {
    event.preventDefault();
    run(event.submitter, "adminMessage", async () => {
      const paymentID = String(new FormData($("reconcileForm")).get("payment_id") || "").trim();
      const result = await api("reconcile", { method: "POST", body: { payment_id: paymentID } });
      await loadOverview();
      message("Payment verified against Whop. Order status: " + (result.status || "updated") + (result.duplicate ? ". This event had already been processed." : "."));
    });
  });
  $("duplicateProduct").addEventListener("click", (event) => run(event.currentTarget, "productMessage", async () => {
    requireSaved();
    const result = await api("product", { method: "POST", body: { action: "duplicate", id: state.selected.id } });
    await openProduct((result.product || result).id); await Promise.all([loadProducts(1), loadOverview()]);
    message("Draft copy created. Connect its own payment plan and add its paid files before publishing.", false, "productMessage");
  }));
  $("archiveProduct").addEventListener("click", (event) => run(event.currentTarget, "productMessage", async () => {
    requireSaved();
    if (!window.confirm("Archive this product? It will leave the public shop. Existing orders and entitlements remain in the store.")) return;
    await api("product", { method: "PATCH", body: { id: state.selected.id, product: { status: "archived" } } });
    await openProduct(state.selected.id); await Promise.all([loadProducts(state.page), loadOverview()]); message("Product archived. Purchase and file history retained.", false, "productMessage");
  }));
  $("categoryForm").addEventListener("submit", (event) => {
    event.preventDefault();
    run(event.submitter, "categoryMessage", async () => {
      const form = new FormData($("categoryForm"));
      const category = { name: String(form.get("category_name")).trim(), slug: String(form.get("category_slug")).trim(), parent_id: form.get("parent_id") || null, description: String(form.get("category_description")).trim(), subcategories: lines(form.get("subcategories")), display_order: Number(form.get("category_display_order") || 0), active: form.has("category_active") };
      await api("category", { method: state.category.id ? "PATCH" : "POST", body: { ...(state.category.id ? { id: state.category.id } : {}), category } });
      await loadCategories(); $("categoryDialog").close(); renderProducts(); message("Category saved. Active categories are reflected automatically in the store.");
    });
  });
  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-bundle-component]")) {
      if (event.target.checked) state.bundleSelections.add(event.target.value); else state.bundleSelections.delete(event.target.value);
    }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.editProduct) run(button, "adminMessage", () => openProduct(button.dataset.editProduct));
    if (button.dataset.editCategory) openCategory(button.dataset.editCategory);
    if (button.dataset.saveAsset) run(button, "productMessage", async () => {
      requireSaved();
      const row = button.closest("[data-asset]");
      const old = list(state.detail.assets).find((item) => item.id === button.dataset.saveAsset);
      const active = row.querySelector('[data-asset-field="active"]').checked;
      if (old.active && !active && !window.confirm("Make this file unavailable? Existing buyers and releases using it will lose access to this file. Upload and publish a replacement first when needed.")) return;
      const asset = { active, display_name: row.querySelector('[data-asset-field="display_name"]').value.trim(), version: row.querySelector('[data-asset-field="version"]').value.trim(), display_order: Number(row.querySelector('[data-asset-field="display_order"]').value || 0) };
      await api("asset", { method: "PATCH", body: { id: old.id, asset } }); await refreshDetail(); message("File details saved. The stored file has not been overwritten.", false, "productMessage"); await loadOverview();
    });
    if (button.dataset.finalizeAsset) run(button, "productMessage", async () => { requireSaved(); await api("upload", { method: "POST", body: { action: "finalize", asset_id: button.dataset.finalizeAsset } }); await refreshDetail(); message("Stored file verified.", false, "productMessage"); await loadOverview(); });
    if (button.dataset.editRelease) { const release = list(state.detail.releases).find((item) => item.id === button.dataset.editRelease); renderReleaseForm(release); $("p_version").focus(); }
    if (button.dataset.toggleRelease) run(button, "productMessage", async () => {
      requireSaved(); const release = list(state.detail.releases).find((item) => item.id === button.dataset.toggleRelease);
      if (release.active && !window.confirm("Deactivate this release? Buyers will no longer see this version. Its file and version history remain stored.")) return;
      await api("release", { method: "PATCH", body: { id: release.id, release: { active: !release.active } } }); await refreshDetail(); message("Release availability updated.", false, "productMessage"); await loadOverview();
    });
    if (button.id === "moreBundleProducts") run(button, "productMessage", async () => {
      const next = state.bundlePage + 1; const data = await api("products?page=" + next); state.bundlePage = next; state.bundleMore = !!data.has_more;
      const known = new Set(state.bundleProducts.map((item) => item.id)); state.bundleProducts.push(...list(data.products).filter((item) => !known.has(item.id))); renderBundleOptions();
    });
    if (button.id === "saveBundle") run(button, "productMessage", async () => { requireSaved(); await api("bundle", { method: "PUT", body: { product_id: state.selected.id, component_ids: [...state.bundleSelections] } }); await refreshDetail(); message("Bundle components saved. Readiness is validated before purchase.", false, "productMessage"); await loadOverview(); });
  });
  window.addEventListener("beforeunload", (event) => { if (state.dirty && $("productDialog").open) { event.preventDefault(); event.returnValue = ""; } });
  if (window.VyroAuth && window.VyroAuth.configured()) {
    try {
      window.VyroAuth.client().auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") { document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close()); clearAdminData(); $("adminShell").hidden = true; $("adminGate").hidden = false; $("gateMessage").textContent = "You have signed out. Sign in to manage the store."; $("adminSignIn").hidden = false; }
      });
    } catch (_) { /* Initialization below reports missing authentication configuration. */ }
  }
  initialize();
})();
