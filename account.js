(function () {
  const status = document.getElementById("authStatus");
  const authPanel = document.getElementById("authPanel");
  const accountPanel = document.getElementById("accountPanel");
  const userEmail = document.getElementById("accountEmail");
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const tabs = document.querySelectorAll("[data-auth-tab]");

  function message(text, type) {
    status.textContent = text || "";
    status.className = "auth-status" + (type ? " " + type : "");
  }

  function showTab(name) {
    tabs.forEach(function (tab) { tab.classList.toggle("active", tab.dataset.authTab === name); });
    signupForm.hidden = name !== "signup";
    loginForm.hidden = name !== "login";
    message("");
  }

  async function refresh() {
    if (!window.VyroAuth.configured()) {
      message("Supabase still needs to be connected. Add your Project URL and public publishable key to supabase-config.js.", "error");
      authPanel.hidden = false;
      accountPanel.hidden = true;
      return;
    }

    const { data } = await window.VyroAuth.client().auth.getSession();
    const user = data && data.session && data.session.user;
    authPanel.hidden = !!user;
    accountPanel.hidden = !user;
    if (user) userEmail.textContent = user.email || "Signed in";
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { showTab(tab.dataset.authTab); });
  });

  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    message("Creating your account…");

    const form = new FormData(signupForm);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (password.length < 8) {
      message("Use a password with at least 8 characters.", "error");
      return;
    }

    try {
      const { data, error } = await window.VyroAuth.client().auth.signUp({
        email: email,
        password: password,
        options: {
          data: { display_name: name },
          emailRedirectTo: window.location.origin + "/account.html"
        }
      });

      if (error) throw error;
      if (!data || !data.user) throw new Error("Supabase did not return a new user.");

      // With email confirmation enabled, Supabase can return an obfuscated user
      // for an email that is already registered. Its identities array is empty.
      // Do not count that as a new Whop registration conversion.
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        signupForm.reset();
        message("If an account with that email already exists, sign in or check your inbox.", "success");
        return;
      }

      if (window.whop && typeof window.whop.track === "function") {
        window.whop.track("complete_registration", {
          event_id: "registration_" + data.user.id,
          email: email,
          name: name || undefined,
          external_id: data.user.id
        });
      }

      signupForm.reset();
      if (data.session) {
        message("Account created. You are signed in.", "success");
        await refresh();
      } else {
        message("Account created. Check your email to confirm your address, then sign in.", "success");
      }
    } catch (error) {
      message(error.message || "Could not create your account.", "error");
    }
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    message("Signing you in…");
    const form = new FormData(loginForm);

    try {
      const { error } = await window.VyroAuth.client().auth.signInWithPassword({
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || "")
      });
      if (error) throw error;
      loginForm.reset();
      message("Signed in.", "success");
      await refresh();
    } catch (error) {
      message(error.message || "Could not sign in.", "error");
    }
  });

  logoutBtn.addEventListener("click", async function () {
    try {
      await window.VyroAuth.client().auth.signOut();
      message("Signed out.", "success");
      showTab("login");
      await refresh();
    } catch (error) {
      message(error.message || "Could not sign out.", "error");
    }
  });

  window.addEventListener("load", refresh);
})();
