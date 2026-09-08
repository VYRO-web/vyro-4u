# GitHub → Cloudflare Pages deployment

This release preserves the existing static frontend with project-root Pages Functions. It does not require React, a frontend bundler or a server process. A small Node build script selects public files so privileged source and setup documents are not served accidentally.

## Repository settings

Upload the contents of this project to your existing GitHub repository, preserving the root `functions/`, `scripts/` and `supabase/` directories. Do not upload the surrounding archive or a second nested project directory as the configured root. The original source ZIP remains untouched.

Set your existing Cloudflare Pages project as follows:

| Setting | Value |
|---|---|
| Framework preset | None |
| Root directory | Repository directory containing this `package.json` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 or newer; tested with Node 24 |
| Functions compatibility date | `2026-09-07` or later after testing |

Keep `functions/` in the project root, **outside `dist/`**. Pages compiles these functions alongside the static output. Use GitHub integration or Wrangler for deployment; dashboard drag-and-drop does not support this Functions deployment. [Cloudflare Functions setup](https://developers.cloudflare.com/pages/functions/get-started/).

## Environment values

Add these separately to Cloudflare Pages Preview and Production environment settings:

| Name | Value / visibility |
|---|---|
| `SUPABASE_URL` | Exact project HTTPS URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server-only Supabase key |
| `WHOP_API_KEY` | Private key for the selected Whop environment |
| `WHOP_WEBHOOK_SECRET` | Private signing secret for that environment's webhook |
| `WHOP_COMPANY_ID` | Actual selling business/company ID |
| `WHOP_ENVIRONMENT` | `sandbox` first; later `production` |
| `SITE_URL` | Exact trusted HTTPS storefront origin, without a path |

`.dev.vars.example` contains placeholders only. Never put secrets in `supabase-config.js`, HTML, GitHub commits or screenshots. Real `.dev.vars` and `.env` files are ignored. A deployment with missing configuration safely refuses checkout and private/admin requests.

The production Pixel business ID is preserved independently of the sandbox company. Do not replace the browser's public Supabase key with the service-role key.

## Supabase and Whop

Apply the SQL migrations and seed separately; the Pages build never connects to or changes a database. Create storage buckets as described in the Supabase guide. Keep the existing Auth redirect `https://vyro-4u.pages.dev/account.html`; add the actual preview origin's account redirect when testing another domain. Set the Supabase Site URL and email confirmation/reset allowlist accordingly.

Create the Whop webhook at `https://YOUR_SITE/api/webhooks/whop` and copy its real signing secret into Cloudflare. Subscribe to the documented events in `WHOP_SETUP.md`. Deploy the database schema and matching server code together.

## Local preview

With Node 22+ installed, run:

```sh
npm run check
npm test
npm run build
npx wrangler pages dev dist --compatibility-date 2026-09-07
```

Copy `.dev.vars.example` to `.dev.vars` in the project root and supply sandbox values only if testing real integrations. A plain file preview or static-only web server cannot run `/api` routes. The catalog will show an unavailable state until the backend and database are connected. No production fallback array or fake paid files is included. [Cloudflare local development](https://developers.cloudflare.com/pages/functions/local-development/).

## Build security and rollout

The generated `_routes.json` sends only `/api/*` to Functions. The generated `_headers` adds content-type, referrer, frame and Content Security Policy protections to static files; inline Pixel scripts are permitted by their content hashes. Functions return their own no-store JSON/security headers. The public asset allowlist excludes SQL, Markdown, tests, package/tooling files, secrets and all server implementation files.

Use a preview deployment first. Verify the actual CDN/auth/Pixel network behavior, webhook delivery, signed URL expiry and the two-customer isolation checks before enabling real checkout. Keep the prior Pages deployment available for rollback. A frontend rollback must remain compatible with the additive database schema; do not drop paid order records to roll back the UI.

The original `sitemap.xml` preserves the eight existing product URLs. New dynamic catalog pages are reachable through navigation; extend sitemap generation if you require every future product in the XML sitemap. Cloudflare's clean `/admin`, `/account`, `/shop` and `/product` URLs work alongside the existing `.html` links.
