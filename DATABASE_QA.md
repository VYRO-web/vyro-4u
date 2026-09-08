# Database verification

Executed on 2026-09-08 using Node 24.20.0 and PGlite 0.5.8, an isolated PostgreSQL WASM engine. Minimal `auth` and `storage` schemas emulate the database interfaces needed by these migrations. No hosted Supabase project or payment provider was contacted or changed.

## Passed

- Both migrations executed successfully on a fresh isolated PostgreSQL database.
- Seed executed twice without duplicate rows or errors.
- SQL permission and isolation suite completed and rolled back its fixtures.
- The suite executed 34 boolean assertions and 20 expected-error checks; additional harness checks verified seed contents and Storage policies.
- Anonymous visitors can read only active categories and public active/coming-soon product columns. Draft/hidden listings and private fields are denied.
- Signup metadata cannot grant an admin role; a customer can update only their own display name. Database-promoted admin recognition works; privileged RPCs remain server-only even for an admin browser session.
- Customer A cannot read customer B's orders, order items or entitlements. Browser reads of private provider metadata are denied.
- Order item snapshots and monetary order identity resist direct updates. Creating a pending checkout does not grant access.
- Payment amount mismatch rolls back the event marker and transaction. Duplicate webhooks grant only one entitlement. A failure after success does not demote a paid order.
- Partial refunds revoke access; full refund before success never grants access; late success cannot restore a refunded order.
- Membership events cannot grant initial access or revoke a one-time purchase.
- Rate limiting permits the first configured requests and blocks the next.
- Bundle components update atomically, reject nested/self references, and grant from the immutable checkout snapshot after later catalog changes.
- Product type changes that would break existing purchase/release/bundle relationships are rejected. Category cycles are rejected.
- Public catalog contains the eight seeded products, all unavailable for checkout, without Whop IDs or external destinations.
- In the isolated Storage metadata model, both anonymous and authenticated roles were denied private object reads and commerce uploads even with a deliberately broad permissive legacy policy present. No file bytes were created.
- Product names, descriptions, target-reader text, included resources, learning points, format, artwork paths and prices were compared against the original supplied `data.js` values and matched.

The generator and optional PGlite test harness also passed JavaScript syntax checks.

## Not tested

- Hosted Supabase/PostgREST behavior, real Auth emails/session handling, Storage API upload/finalization, Storage bytes and short-lived signed URL expiry: requires configured test services.
- Actual Whop sandbox checkout/webhook delivery/refunds: requires Whop sandbox credentials and configuration.
- Concurrent transactions from independent network connections: PGlite's local harness uses one connection; locking/idempotency constraints were inspected and sequential retry/order scenarios executed.

The rollback suite is `supabase/tests/commerce.sql`. The optional local harness is `supabase/tests/pglite.mjs`. PGlite is a development test dependency and is not loaded by the website or Cloudflare Functions.
