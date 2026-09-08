# VYRO Free Release

This package is configured to run the VYRO storefront without payment processing.

## What works now

- Homepage, categories, search, filters and product pages
- Eight bundled VYRO PDF products
- Direct free PDF downloads
- Saved cart on the visitor's device
- Supabase account signup/sign-in/password reset when Supabase Auth is configured
- My Library shows the eight free guides to signed-in users
- Admin page opens in read-only Free Mode and shows the bundled catalog without needing Whop or the commerce API
- Existing Cloudflare/Supabase/Whop backend code is preserved for a future paid release

## Important deployment rule

Upload the **contents of this folder** to the root of the GitHub repository. Do not upload the ZIP as one file and do not place everything inside another `VYRO-commerce` folder.

The first page of the GitHub repository should directly show files/folders such as:

- `functions/`
- `free-products/`
- `scripts/`
- `supabase/`
- `index.html`
- `package.json`
- `site-config.js`
- `catalog-static.js`

## Cloudflare Pages settings

- Framework preset: None
- Root directory: blank
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 24

No Whop variables are required while Free Mode is enabled.

## Supabase

The public site does not require Supabase to display or download the bundled products. Supabase is only needed for account/authentication features.

Keep the browser-safe project URL and publishable key in `supabase-config.js`. Never place a service-role or secret key in that file.

## Turning payments back on later

Open `site-config.js` and change:

```js
window.VYRO_FREE_MODE = {
  enabled: true,
```

to:

```js
window.VYRO_FREE_MODE = {
  enabled: false,
```

Before doing that, finish the existing Supabase/Whop commerce setup and private paid-file configuration. The original payment backend remains in `functions/`.
