# VYRO commerce upgrade

This is the supplied VYRO storefront upgraded in place. The frontend remains HTML, CSS and vanilla JavaScript; the eight original cover images are unchanged. GitHub → Cloudflare Pages remains the deployment route.

**Start with the [step-by-step dashboard guide](START_HERE.md)** or the shorter [setup checklist](COMMERCE_SETUP.md). The supplied catalog has eight Coming Soon guides and no paid deliverables or Whop IDs. Checkout is intentionally unavailable until genuine files, payment plans and server configuration are installed. No app, customer review, sale count or payment transaction has been fabricated.

## Architecture

The browser loads the public catalog through `/api/catalog`, restores Supabase Auth sessions and keeps product IDs in a local saved cart. Cloudflare Pages Functions validate authentication, prices and administrator permissions. Supabase PostgreSQL stores categories, products, immutable order items, entitlements, releases and webhook history. Supabase Storage separates public artwork from private paid files. Whop supplies one-product hosted checkout.

`Buy Now → sign in → server-created pending order → Whop checkout → signed webhook + retrieved payment verification → atomic paid order and entitlement → My Library → entitlement-checked 60-second download link`.

The return page only reads the order. It never grants a purchase. Each cart product has a separate, clearly labeled checkout. A bundle can use a single plan and grant its snapshotted component products.

## Included guides

- [Deployment](DEPLOYMENT.md)
- [Supabase and first administrator](SUPABASE_COMMERCE_SETUP.md)
- [Whop sandbox and production setup](WHOP_SETUP.md)
- [Admin workflow](ADMIN_GUIDE.md)
- [Uploading files and software releases](PRODUCT_UPLOAD_GUIDE.md)
- [QA results and remaining limitations](QA_REPORT.md)
- [API contract](BACKEND_API.md) and [database contract](SCHEMA_CONTRACT.md)

## Local checks

Use Node 22 or newer. The store has no runtime package dependencies and needs no package installation for these checks:

```sh
npm run check
npm test
npm run build
```

The build copies an explicit public-file allowlist into `dist/`; SQL, documentation, tests, examples and server code are not exposed as static files. Cloudflare compiles the project-root `functions/` directory separately.

Archived prototype documentation in `docs/history/` is historical reference, not current setup guidance. The current commerce guides supersede it.
