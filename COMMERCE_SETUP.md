# Set up VYRO commerce

For dashboard-by-dashboard instructions, open [START_HERE.md](START_HERE.md).

## Current state

The source implementation, migrations and seeded catalog are supplied. No remote database was modified and nothing was published. No privileged Supabase key, Whop API key or signing secret was supplied. The original browser-safe Supabase URL/key and Whop Pixel business scope `biz_n3wqxoq4XFfxzb` remain present.

The eight original guides are seeded as `coming_soon`. Their original artwork, descriptions, included items, learning points, prices and format metadata are preserved. Unverified prototype reviews, review counts, ratings and bestseller claims are omitted. There are **zero actual paid files** installed. A PNG cover is never a purchased deliverable.

## First setup

1. Back up the existing Supabase project. Use a separate test project for the first migration when possible. Inspect any existing commerce/profile tables before running the migrations; these additive transactional migrations deliberately fail on conflicting table names rather than overwriting existing records.
2. Follow [SUPABASE_COMMERCE_SETUP.md](SUPABASE_COMMERCE_SETUP.md): run both migrations in filename order, run the seed, create the storage buckets, and verify access policies. The seed can be repeated without overwriting subsequent product edits.
3. If using a separate Supabase project, change **only the public URL and publishable key** in `supabase-config.js`. Put the service-role key only in Cloudflare environment secrets.
4. Set Cloudflare secrets and the build settings in [DEPLOYMENT.md](DEPLOYMENT.md). Keep preview and production credentials separate. Start with `WHOP_ENVIRONMENT=sandbox`.
5. Create and confirm your real account. Promote its exact user UUID using the trusted SQL procedure in the Supabase guide. Open `/admin` to manage the catalog.
6. Upload genuine purchased PDFs/resources using Admin. Configure the real Whop sandbox product and one-time plan IDs for each product. Review prices, compare-at prices, descriptions and flags for accuracy before publication. See [WHOP_SETUP.md](WHOP_SETUP.md).
7. Complete the marked Privacy, Terms, Refund and Contact placeholders with your business details and policies. No refund guarantee or legal approval has been invented. Review the existing Pixel consent requirements for your business and users before public launch.
8. Run the real service checks listed below, then activate ready products from Admin. Switch to production only after a successful sandbox flow.

## Required manual service verification

Use two customer accounts and one administrator account in your test environment. Verify signup/confirmation, login, password reset and logout. Confirm the normal customers cannot call administrator APIs or read one another's orders, items, entitlements or private file metadata.

For one real test deliverable, complete successful, declined and canceled Whop sandbox checkouts. Confirm the order is pending until the signed event is processed. Open the success page manually and confirm no access is granted. Retry the same event, issue partial/full refunds, and confirm access is revoked without duplicate records. Use Admin's Verify payment function to test recovery of a delayed event.

Verify the entitled customer can download and the signed URL expires after 60 seconds. Confirm anonymous, unpaid, other-user, refunded and expired-entitlement requests fail. Remove a test file in the test environment and confirm checkout/download fail safely. Upload a new release version and check that current permitted software downloads appear for existing buyers.

These live checks were **NOT TESTED – require configured Supabase, Whop sandbox credentials, deployed webhook and actual deliverables**. Local PostgreSQL, mocked provider and browser tests are recorded separately in [QA_REPORT.md](QA_REPORT.md).

## Scope and operating limits

- One-time purchases, digital files, bundles, software releases and authenticated external links are implemented. No software listing has been invented.
- Subscription fields and membership event processing exist for future development. **Recurring checkout is disabled.** A renewal ledger, dunning/cancellation UI and real renewal testing must be added before selling subscriptions.
- Each Whop checkout contains one plan. The cart is a persistent saved selection with individual checkout buttons; there is no multi-charge surprise or simulated multi-item transaction.
- Any successful refund, including a partial refund, revokes that order's access in this release. Align your published refund policy with that behavior.
- External destination services must enforce their own access permissions. Returning a shared URL is not a license server.
- Uploads check size, MIME and file signatures. An automated malware scanner and code-signing service are not included. Scan your genuine installer builds before publishing.
- Store availability and provider prices are rechecked before checkout. Unexpected discounts, trial/expiring/installment plans and unsupported pricing adjustments fail closed; validate your actual tax configuration in sandbox.
