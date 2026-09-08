# VYRO commerce QA report

Release verification: 8 September 2026. This report covers the upgraded supplied project, not the archived prototype reports. The full source is supplied for GitHub/Cloudflare deployment; no live deployment or remote database migration was performed.

## Outcome

The existing HTML/CSS/vanilla JavaScript storefront now has a database catalog, persistent saved cart, hosted-checkout integration, verified payment fulfillment, private downloads, customer library and administrator product/category/file/release management. All eight supplied guides are seeded as Coming Soon. There are no real purchased files or connected Whop plans, so none can currently be purchased.

## Existing functionality

The original visual system, covers, product slugs/query links, home/shop/product pages, search, categories and mobile navigation are retained. Auth still uses Supabase and the original browser-safe public configuration, verified byte-for-byte unchanged. Login/signup/logout/session and email redirect code remains in the existing architecture, with password recovery and the library added.

Whop Pixel's original business scope and `whop.track("page")` remain once on each customer-facing page. The new admin page is untracked. `complete_registration` runs only after a successful new Supabase user result with a non-empty identities array. Existing-account/empty-identity responses do not fire it. Local mocks verified event counts; actual registration emails and live Pixel ingestion were not exercised.

The obsolete production `data.js` path is removed from the public build. An explicitly marked original reference is retained in `docs/history/`, including its unverified prototype ratings/reviews, and is never served. Live product cards and details contain no demo reviews, ratings or customer counts. Unsupported instant/permanent-download and 14-day refund claims were removed. Policy/contact pages clearly mark owner-supplied wording as pending.

## Database

Migrations:

- `202609070001_vyro_commerce.sql`: catalog, asset/release metadata, orders/items, entitlements, profiles/admin roles, webhook history, indexes, triggers and RLS.
- `202609070002_commerce_procedures.sql`: safe catalog, checkout snapshot, transactional fulfillment/refunds/membership handling, readiness, bundles, overview and rate limiting.

Tables: `categories`, `products`, `product_assets`, `app_releases`, `product_bundle_items`, `profiles`, `orders`, `order_items`, `entitlements`, `webhook_events`, plus a private rate-limit table. No existing Auth user/session tables are replaced. Seed re-execution does not overwrite administrator edits.

## Security

Browser column grants and RLS limit users to public catalog fields and their own profile, orders, items and entitlements. A profile role from trusted database administration authorizes every admin API request. User metadata cannot promote itself. Private Storage access is blocked for browser roles, including in the presence of a permissive legacy policy in the isolated policy tests.

Cloudflare Functions verify the Supabase bearer token through Auth, validate input, rate-limit protected operations and keep privileged keys in environment variables. Checkout checks the current database price, private deliverable readiness and the actual Whop plan. The signed raw webhook is verified using Web Crypto; the payment is retrieved again from Whop and compared to the immutable order. One SQL transaction records the event, updates payment state and grants/revokes entitlements. Duplicate and out-of-order events cannot duplicate or restore refunded access.

Private downloads require the current customer, active unexpired entitlement, paid order and valid file/release. Storage URLs expire after 60 seconds. File staging uses random immutable paths, canonical MIME, size and signature checks; pending/unvalidated files cannot unlock checkout. Browser rendering escapes catalog text. Authenticated responses are discarded after an account change; sign-out, failed session restoration and page caching clear private account data.

The public build uses an allowlist. SQL, documentation, example environment files, server code and test fixtures are excluded. Static CSP/security headers and API no-store headers are supplied. No private credentials were discovered or included.

## Whop

- Configuration: waiting for actual keys, signing secret, company and product/plan IDs.
- Environment: defaults to sandbox; no sandbox or live charge was made.
- Webhooks: signature/validation/idempotence implementation present; no deployed endpoint was registered or contacted.
- Checkout: one plan per payment, reflected in individual saved-cart checkout buttons. Bundles can grant multiple snapshotted products under one plan.
- Refund policy in code: any successful partial/full refund revokes that order's access.
- Future subscriptions: schema and membership-event infrastructure supplied; recurring checkout is disabled pending renewal billing implementation.
- Official Whop references, exact supported events and production switch instructions: `WHOP_SETUP.md`.

## Products and artwork

All eight names, descriptions, target-reader text, included items, learning points, prices, format metadata and original slugs were compared to migrated database rows and matched. Unverified review/bestseller claims are deliberately excluded.

| Product | Exact original file |
|---|---|
| The 8-Week Calisthenics Starter System | `calisthenics-cover.png` |
| 50 High-Protein Recipes | `food-cover.png` |
| The Ultimate Men's Style Guide | `style-cover.png` |
| The Habit Reset Blueprint | `habit-cover.png` |
| 30-Day Home Workout Challenge | `workout-cover.png` |
| The Weekly Meal Prep System | `meal-cover.png` |
| The Capsule Wardrobe Guide | `wardrobe-cover.png` |
| The Deep Work Productivity System | `productivity-cover.png` |

SHA-256 comparison passed for all eight files against the original archive extraction. No image pixels were changed, recolored, cropped or re-encoded. Product artwork uses `object-fit: contain`; the original Habit cover's different aspect ratio is preserved. Browser screenshots were inspected on desktop/mobile, with lazy images explicitly loaded for full-page capture.

## Downloads

**Real paid deliverables installed: zero.** The ZIP contains artwork, not the purchased PDFs or future installers. Test fixtures were local mocks or rollback database metadata; no fabricated downloadable guide or app was added to the store.

## Tests performed

- 50 JavaScript and inline-script syntax checks passed on the final source; HTML duplicate IDs and local asset/page references passed.
- HTML structure validation passed: closing order, permitted children/parents, required contents, duplicate attributes and duplicate IDs. Both full CSS stylesheets parsed without errors.
- 35 backend tests passed under Node, including independently signed HMAC fixtures, invalid/stale signatures, price/identity mismatches, one-time plan restrictions, missing-file checkout, user/admin isolation, file staging/finalization, refund ordering, recovery and library pagination. The 8 September setup follow-up corrected signing-key handling to use the full literal UTF-8 Whop secret (including its prefix), matching the current official SDK verifier; regressions reject stripped/pre-encoded keys. External services were mocked.
- Actual isolated PostgreSQL execution using PGlite passed both migrations, seed twice, 34 assertions and 20 expected rejection checks. Coverage includes RLS/user isolation, role escalation, immutable snapshots, refund-before-success, duplicate/out-of-order webhook processing, bundle snapshots, membership limits, rate limiting and restrictive Storage policies. The final release-size catalog change was retested. Minimal Auth/Storage metadata schemas were test doubles. See `DATABASE_QA.md`.
- Public browser checks passed for home, shop, product, cart, account, payment-status and policy pages at 320, 375, 430, 768, 1280, 1440 and 1920 pixels: 49 page/viewport combinations without document overflow or clipped visible controls.
- Public functional checks cover all eight product details/covers, missing product, search/category/type/price/sort/empty state, cart persistence/removal/quantity-one behavior, mobile menu/Escape/inert state, registration-event guards, recovery UI, authenticated library/snapshot prices, sign-out and delayed-response protection, manual success URL, and unavailable-catalog failure. Additional login-intent and software metadata checks use isolated fixtures. No uncaught browser JavaScript errors were found in the completed suite.
- 16 admin mocked browser checks passed: overview and editor at all seven widths, create/edit/duplicate/archive, nested categories, canonical-MIME upload/finalize, asset metadata, releases, bundles, reconciliation, escaped preview, 403 and sign-out cleanup. 54 mock API requests; no uncaught JavaScript errors.
- Cloudflare Wrangler 4.129.0 compiled the Pages Functions Worker successfully. Its local runtime served the site and returned expected failures: unconfigured catalog 503; anonymous library/admin 401; SQL, example secrets, server source, README and obsolete data.js all 404.
- Full artwork hashes, preserved Supabase public configuration and single customer-page Pixel event checks passed.

Browser tests used mocked Auth/API/provider responses; external Pixel ingestion and Google Fonts requests were stubbed. These results are not claims of completed live purchases or hosted storage operations.

## Tests not performed

- **NOT TESTED – requires Whop sandbox credentials, connected plans and deployed HTTPS webhook:** actual success/decline/cancel payments, real provider event payloads/delivery/retries, actual refunds, taxes, production switching and actual reconciliation.
- **NOT TESTED – requires configured hosted Supabase and real deliverables:** live signup/login/logout/session restoration/email/reset redirects, deployed PostgREST/RLS, real private upload finalization, real paid download, expired signed URL and replacement URL behavior.
- **NOT TESTED – requires independent service connections/load tooling:** concurrent network webhook races and production load. SQL locks/constraints were reviewed and sequential retry/order scenarios executed.
- **NOT TESTED – requires publication and configured external services:** actual Cloudflare deployment, live CDN/Pixel/consent behavior and full production end-to-end commerce.

## Known limitations and manual steps

Follow `COMMERCE_SETUP.md` before sales. Apply migrations/seed to a backed-up test project, create buckets, configure server secrets, bootstrap a real admin, upload genuine paid files and connect actual Whop plans. Complete business/legal/contact placeholders and execute the live service checklist before activating real checkout.

Recurring sales are intentionally unavailable. Automatic malware scanning, a software licensing server and subscription renewal/cancellation UI are not included. Public previews support images; installers/resources remain private. Recent admin orders show the latest 20; customer history and product administration are paginated. The original XML sitemap lists eight existing products; future comprehensive sitemap generation is an extension. Cart quantities are one per digital license, with totals grouped by currency. Initial compare-at prices and marketing text should be checked by the owner before publishing. External destination services must enforce their own access.

## Files changed

The complete created/modified source list is in `FILE_MANIFEST.md`, including every server route, migration, page, script and guide. Original imagery is unchanged. Historical documentation and the old content array are marked and isolated in `docs/history/`. No runtime downloads, scratch fixtures, browser profiles, secret files or local test tooling are included in the delivery ZIP.
