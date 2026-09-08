# VYRO administration

Open `/admin` or `/admin.html` on the deployed Cloudflare Pages site. Sign in using the existing VYRO account flow. The administrator area uses the original HTML, CSS and vanilla JavaScript architecture.

## First-time setup

1. Complete `COMMERCE_SETUP.md` and `SUPABASE_COMMERCE_SETUP.md`: apply migrations, seed the existing catalog, configure Cloudflare secrets and create the storage buckets.
2. Create and confirm your real account through the account page.
3. Follow **Promote your first admin** in `SUPABASE_COMMERCE_SETUP.md` using that account's exact Auth user UUID in the trusted Supabase SQL Editor.
4. Open the administrator area. A normal customer account receives an authorization error.

The browser sends the current Supabase session access token with every administrator request. Cloudflare verifies the user and the current database administrator role. Hiding a page or changing browser storage does not grant permission. Administrator role assignment is intentionally kept in trusted Supabase administration, outside this dashboard.

## Overview

The overview reads actual database records:

- Total, active and draft products.
- Paid order count and total order count.
- Products missing files or payment setup.
- Recorded paid revenue grouped by currency, with no conversion or invented trends.
- Recent paid purchases and the latest orders.

These values are store records, not settlement accounting. The display does not estimate traffic, customers, conversion rates or lifetime sales. Check Whop for provider fees and payout reconciliation. A configured connection indicator means environment settings are present; it is not proof that a sandbox transaction succeeded.

## Products

Select **Products**, then **New product** or **Manage**. The list supports server-side name/slug search, status and type filters, and page navigation.

The editor contains:

- **Product & publishing:** name, slug, type, status, category, subcategory label, display order, featured, bestseller and new flags.
- **Descriptions & resources:** short/full descriptions, target audience, included resources, learning points, format, pages, release date and license link.
- **Pricing & Whop checkout:** price, real compare-at price, currency, matching Whop product/plan IDs and external-access URL when applicable.
- **Search & artwork:** search title/description and the current cover path.
- **Artwork & paid files:** upload, verification, metadata and safe version history.
- **Software details / releases:** visible for software products.
- **Bundle components:** visible for bundles.

Save a new product as **Draft** before adding files. The server refuses an active listing without required setup. Read the readiness checklist, upload the actual purchased files, connect the corresponding Whop plan, and then change the status to **Active**.

### Publishing states

| State | Store behavior |
| --- | --- |
| Draft | Private work in progress. |
| Coming soon | Public preview with checkout disabled. |
| Active | Published; checkout remains subject to server validation of delivery, price and payment setup. |
| Archived | Removed from the public shop; orders, entitlements and stored file history remain. |

**Preview** displays current form values inside the administrator area. It neither publishes a draft nor bypasses public catalog security. Save your product changes before using upload, release, duplicate, archive or bundle actions.

**Duplicate as draft** creates a separate SKU and slug with copied editorial details. Real Whop IDs, paid files, bundle components and software releases are not connected automatically. Configure delivery and the product's own matching payment plan deliberately.

**Archive** is the preferred way to retire a product. The dashboard never destructively deletes products or paid files. Changing a live slug changes its public link; existing external links are not automatically redirected.

Display order is a whole number, with smaller numbers first. Edit it to reorder products. Use the **Bestseller** flag only if your real sales justify it. Compare-at prices and resource descriptions must also be accurate.

## Categories and nested categories

Choose **Categories → New category**. Add a name, unique slug, description and display order. Choose a parent to create a nested category. Uncheck visibility to hide the category. The database rejects invalid nesting and cycles.

Active categories automatically populate store filters and navigation. Product subcategory labels can be typed directly or chosen from category suggestions. For a standalone filterable subcategory, create a category with a parent and assign products to it.

Changing a category slug changes links you have shared. Hiding a category does not archive every product assigned to it; manage product status separately.

## Files and releases

See `PRODUCT_UPLOAD_GUIDE.md` for the complete workflow. Each upload gets a fresh storage path, so a replacement never overwrites the previous file silently. File metadata shows name, role, MIME type, size, version, visibility and upload date.

After a transfer, the server verifies the stored object before marking it ready. A pending file is not a deliverable. **Retry verification** is useful if the transfer completed but the verification request was interrupted. If the transfer itself failed, upload the file again; do not make an incomplete record active.

The **Available to eligible buyers** control changes availability without deleting the stored file. Turning a file or release off can affect existing buyers, so the dashboard displays a confirmation. Add and test a replacement first when necessary. Public artwork is always publicly accessible by design; do not use a public role for a paid product.

## Bundles

Create a bundle as a draft, save it, and select its included products under **Bundle components**. Load additional pages to find more components. Previously saved components stay selected even before their product page has been loaded. A bundle can also have its own private files.

Save the components, configure the bundle's own Whop plan, review delivery readiness and publish. The server validates component delivery and rejects circular bundles. Purchase history retains the components granted at the time of verified purchase; editing the current bundle does not rewrite old orders.

## Recent orders and delayed payment recovery

**Recent orders** shows the latest orders returned by the overview query, not a full export. **Refresh** reloads current payment states.

If a real Whop payment is missing from the store after a delivery outage, copy its actual payment ID into **Verify a delayed payment**. The server retrieves the provider's payment, matches it to the saved internal order and performs the same validated/idempotent processing. This control cannot make an unpaid order paid by typing a browser status or success-page URL.

Refunds are initiated in Whop. Verified refund events update orders and access according to the documented store policy. There is no arbitrary “grant purchase” or “mark paid” browser control.

## Known operational limits

- The supplied project contains cover artwork, not purchased PDFs or installers. All eight seeded guides remain Coming Soon until real files and payment setup are added.
- No sample app or fictional software release is supplied.
- One-time Whop checkout is implemented. Subscription-related schema and event fields reserve a future extension; subscription billing is not enabled for sale in this release.
- Recent orders are bounded to the latest records. Full finance reporting and export are outside this dashboard.
- File checks validate storage, type and size; they do not constitute a malware scan or prove installer signing. Scan/test your files before upload.
- The server decides readiness. A successful local preview, browser return URL or environment indicator does not prove payment or grant access.
- Live administrator operations require a configured Supabase project, migrated database, Cloudflare Functions and a real administrator account. UI tests with fixtures are not live service tests.

## Troubleshooting

| Message | Next step |
| --- | --- |
| Sign in to continue | Sign in with a confirmed administrator account. |
| Account does not have permissions | Check the exact account UUID and database role using trusted Supabase administration. |
| Payment setup required | Follow `WHOP_SETUP.md`; use real matching IDs and server secrets for the correct environment. |
| Upload pending | Retry verification if the upload completed; otherwise upload again. |
| Storage did not accept this file | Check accepted formats, file-size limits, bucket configuration and network connectivity. |
| Save product changes first | Save the current form before managing files, releases or components. |
| Active publication rejected | Correct the readiness issue reported by the server; keep the product Draft or Coming Soon in the meantime. |
