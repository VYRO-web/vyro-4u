# Supabase commerce setup

The existing Supabase project and browser-safe publishable configuration are preserved. Commerce adds database tables and server APIs alongside the existing email/password authentication. No production database was changed while preparing this package.

## 1. Prepare a test project and backup

Use a separate Supabase project for initial testing, and back up the production database before applying migrations. These are additive migrations for a project without existing commerce tables of the same names. If tables such as `products`, `orders` or `profiles` already exist, reconcile that schema first; do not drop live tables to make the migration pass.

Apply, in order, using the Supabase SQL Editor or CLI:

1. `supabase/migrations/202609070001_vyro_commerce.sql`
2. `supabase/migrations/202609070002_commerce_procedures.sql`
3. `supabase/seed.sql`

Both migrations use transactions. The seed inserts by unique slug and does not overwrite later admin changes when run again. It creates four categories and all eight original guides as **Coming Soon**. Original descriptions, included resources, learning points, dates, prices and cover filenames are retained. Demo ratings, customer reviews, review counts and unsupported bestseller labels are excluded.

There are no paid PDFs, resource packs, installers, software releases or Whop product/plan IDs in the supplied project. The seed creates none. Original covers remain static files in the website and are referenced by `cover_path`; they are not pretend Storage uploads or deliverables.

## 2. Create Storage buckets

In Supabase Storage, create the following buckets using the dashboard or Storage API:

| Bucket | Public | Allowed contents |
| --- | --- | --- |
| `public-assets` | Yes | PNG, JPEG, WebP and AVIF covers/previews |
| `paid-products` | **No** | Purchased PDFs, ZIPs, resources and future installers |

Set a public image size limit and a paid-file limit appropriate for your Supabase plan. The admin upload flow may impose a lower limit; use its displayed limit. Large future installers require an explicit size-limit review before upload. Keep paid-product MIME restrictions compatible with PDF, ZIP, operating-system installer formats and approved resource types. Never make the paid bucket public to fix a download error.

Do not write, copy or delete `storage.objects` rows yourself. Supabase stores actual bytes separately from its database metadata. Uploads go through the Storage API; the API then finalizes the asset row only after checking object identity, size and MIME. The database also checks the object exists, the bucket is private, and metadata matches the validated asset before checkout.

The migration adds restrictive Storage policies denying direct browser access to `paid-products` and direct browser writes to both commerce buckets. These restrictions also constrain older permissive policies. Admin uploads and customer signed-download links are issued by authenticated, authorized server APIs. Public buckets deliberately make covers/previews public; never place paid files there.

## 3. Configure authentication and server environment

Keep the Supabase Site URL set to the actual website origin and allow the website's `/account.html` email redirect, including its return-to-product and password-recovery query strings. The test configuration in `START_HERE.md` uses a specific trusted hostname plus `/account.html**`. Add the local development origin and test deployment origin only when you need them. Preserve email confirmation, password recovery and existing users.

Configure custom SMTP (or verify the existing provider) before normal customer confirmation/recovery tests. Supabase's default sender is restricted to project-team addresses and a small test allowance. Put SMTP credentials in Supabase Auth's email settings, not the website source. [Official SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).

The browser uses the existing project URL and publishable key. The Cloudflare Functions use a privileged Supabase credential from an encrypted server environment variable. Use the exact variables in `.dev.vars.example`; never paste privileged values into `supabase-config.js`, HTML, source control or this document.

Requests to admin/payment/download routes validate the bearer token with Supabase Auth. The browser's claimed user ID, role, price and purchase state are never sufficient authorization.

## 4. Promote your first admin

Create and confirm your own account normally. In Supabase Authentication, copy that account's exact UUID. In the trusted SQL Editor, use the UUID in this statement:

```sql
update public.profiles
set role = 'admin'
where id = '<YOUR_CONFIRMED_AUTH_USER_UUID>'::uuid;
```

Check the affected row before opening `/admin`. Use the exact user ID rather than a browser email comparison. New-account metadata always creates a customer profile, even if someone submits `role: admin`. Customers can edit only their own display name; they cannot modify their role. Demote an account with the same SQL statement and `role = 'customer'`.

Role changes are intentionally restricted to trusted database administration. The storefront admin interface does not grant people the power to promote arbitrary accounts. Its server API checks the current database role on every request, so role removal does not depend on waiting for a stale role claim to expire.

## 5. Add actual deliverables before enabling sales

Use the admin manager to upload real purchased files to `paid-products`, configure Whop IDs, and review each product. A file record stays `pending` until the upload is finalized; a cover cannot be a paid deliverable. Keep versions at new paths so previous files are not overwritten silently.

Checkout requires active product status, an active category when assigned, a positive database price, both Whop IDs, one-time billing, and valid delivery. Software also requires a published active release linked to that product's private deliverable. A bundle with components requires every component to be active and deliverable. Each order snapshots the exact component UUIDs at checkout, so later bundle edits do not rewrite a buyer's purchase. Nested bundles are rejected. An external-access product uses an HTTPS destination disclosed only to an entitled customer.

The provider plan is rechecked by the checkout API against the database price, currency and product mapping. Database metadata alone cannot prove the contents of an uploaded file are the promised paid product; the store owner must inspect the real files before publishing.

## Security model

| Resource | Anonymous | Signed-in customer | Admin through server API |
| --- | --- | --- | --- |
| Public categories/products | Active categories; active/coming-soon public listings | Same | All, including drafts |
| Public cover/preview metadata | Read public ready rows | Same | Manage |
| Private asset paths | No access | No direct access | Manage after role check |
| Profile | No access | Own profile; own display-name edit | Role check; role management via trusted SQL |
| Orders/items/entitlements | No access | Own rows; no browser writes | Read relevant store data |
| Webhook records/payment RPCs | No access | No access | Verified server only |
| Paid Storage objects | No access | No direct object reads/listing | Server uploads/signing |

All commerce tables use Row Level Security. Table and column grants remove default browser writes and sensitive columns; policies limit visible rows. The server catalog explicitly selects public fields. Internal payment metadata, customer email snapshots, provider IDs and external destinations are not returned by public catalog queries. Admins use the protected server API for privileged operations; promoting a database profile does not grant unrestricted browser SQL access.

Security-definer routines use an empty search path and fully qualified objects. Execute permissions are explicitly revoked from `PUBLIC`, `anon` and `authenticated` for payment, catalog, rate-limit and admin RPCs. Only the server `service_role` may call them. The small `vyro_private.is_admin()` helper returns only whether the current signed-in identity has an administrator profile.

Orders retain immutable owner, email, currency, subtotal and timestamps; item snapshots are never updated or deleted. Payment-state changes use a transaction procedure, which validates the provider payment against the snapshot, records the event ID and grants/revokes entitlements in the same transaction. It rejects mismatched users, currency, totals, plans, products and checkout identity. Retried events are idempotent. Refund totals are monotonic and any partial/full refund revokes that order's entitlements. A later success event cannot restore refunded access. Another independently paid order can still provide valid ownership of the same product.

The schema prepares subscription billing and membership expiry, but the checkout flow deliberately enables one-time billing only until a complete subscription lifecycle is configured and tested. Membership events affect only known paid subscription orders and never create an initial entitlement. One-time purchases are not revoked just because a provider membership is deactivated.

Purchase-history foreign keys restrict account deletion. Plan a deliberate retention/anonymization process for account-deletion requests instead of deleting commerce history or disabling constraints. Webhook IDs should be retained for the useful life of the corresponding payment to preserve retry protection. Rate-limit counters automatically discard entries older than two days.

## Database verification

`supabase/tests/commerce.sql` is a rollback-only SQL suite for a disposable test project. Run with a privileged database connection, after migrations and seed:

```sh
psql -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f supabase/tests/commerce.sql
```

The test script creates temporary test users and catalog fixtures, switches PostgreSQL roles, checks anonymous/customer access, prevents role escalation, verifies user/order/item/entitlement isolation, checks immutable snapshots, verifies mismatched payments roll back, exercises duplicate and out-of-order payment events, refunds, membership non-grant behavior and rate limits. Test-only provider strings are confined to this rolled-back test transaction. They are not credentials or connected payment plans.

See `QA_REPORT.md` for the actual execution status. Hosted Supabase Storage enforcement, signed URL expiry, real Auth/session behavior and Whop transactions must also be tested against configured services; an isolated SQL suite cannot replace those integration checks.

## Primary references

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database function security and execute privileges](https://supabase.com/docs/guides/database/functions)
- [Supabase Storage schema: API operations and read-only metadata](https://supabase.com/docs/guides/storage/schema/design)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
