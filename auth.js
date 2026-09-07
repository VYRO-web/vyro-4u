(function () {
  const url = window.VYRO_SUPABASE_URL;
  const key = window.VYRO_SUPABASE_PUBLISHABLE_KEY;

  function configured() {
    return url && key && !url.startsWith("YOUR_") && !key.startsWith("YOUR_");
  }

  function client() {
    if (!configured()) throw new Error("Supabase is not configured yet. Add your Project URL and public publishable key to supabase-config.js.");
    if (!window.supabase || !window.supabase.createClient) throw new Error("Supabase client library did not load.");
    if (!window.VYRO_SUPABASE) window.VYRO_SUPABASE = window.supabase.createClient(url, key);
    return window.VYRO_SUPABASE;
  }

  async function updateAccountLinks() {
    const links = document.querySelectorAll("[data-account-link]");
    if (!links.length) return;

    if (!configured()) {
      links.forEach(function (link) { link.textContent = "Account"; });
      return;
    }

    try {
      const { data } = await client().auth.getSession();
      const user = data && data.session && data.session.user;
      links.forEach(function (link) {
        link.textContent = user ? "My Account" : "Sign In";
      });
    } catch (_) {
      links.forEach(function (link) { link.textContent = "Account"; });
    }
  }

  window.VyroAuth = { configured, client, updateAccountLinks };
  document.addEventListener("DOMContentLoaded", updateAccountLinks);
})();
