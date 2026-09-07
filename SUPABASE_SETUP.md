# VYRO Supabase Auth setup

The frontend is already configured with the project's public Supabase URL and browser-safe publishable key in `supabase-config.js`.

In Supabase → Authentication → URL Configuration, use:

- Site URL: `https://vyro-4u.pages.dev`
- Redirect URL: `https://vyro-4u.pages.dev/account.html`

Email/password signup and sign-in are handled by `account.js`. A successful new account creation fires the Whop Pixel `complete_registration` event.

Never place a Supabase secret/service-role key in this repository.
