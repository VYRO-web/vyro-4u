# VYRO Supabase Auth setup

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open the project, then copy the Project URL and the public publishable/anon key from Project Settings / API.
3. Open `supabase-config.js` and replace:
   - `YOUR_SUPABASE_PROJECT_URL`
   - `YOUR_SUPABASE_PUBLISHABLE_KEY`
4. In Supabase Authentication URL configuration, set:
   - Site URL: `https://vyro-4u.netlify.app`
   - Redirect URL: `https://vyro-4u.netlify.app/account.html`
5. Keep email/password auth enabled.
6. Deploy the changed files to GitHub/Netlify.
7. Visit `/account.html`, create a test account, and then verify `complete_registration` in Whop.

Security: never put a Supabase `service_role` or secret key in this static website. Only the public publishable/anon key belongs in `supabase-config.js`.
