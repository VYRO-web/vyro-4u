# VYRO: step-by-step first setup

Prepared 8 September 2026 for this exact project. Start with a separate test copy, using a test Supabase project and Whop Sandbox. Your current public store can stay online while you verify the upgrade. You do not need to run terminal commands for the dashboard-based setup below.

You need access to GitHub, Cloudflare, Supabase and Whop, plus at least one genuine PDF or ZIP you intend to sell. The supplied PNGs are product covers only. Keep private credentials in Cloudflare Secrets; do not send them in chat or add them to GitHub.

## 1. Extract the project

Extract the latest `VYRO-commerce-upgraded.zip` and open its `VYRO-commerce` folder. You should see `index.html`, `package.json`, `functions`, `scripts` and `supabase` together. Work from these extracted files, not from the original artwork-only ZIP.

## 2. Create your test database and connect the browser

In the [Supabase dashboard](https://supabase.com/dashboard), create a separate project for testing, for example `VYRO Test`. Save its database password securely; it is not one of this website's environment variables.

Find the project URL and publishable key in the project's Connect dialog or Settings > API Keys. In the extracted `supabase-config.js`, replace only the two quoted values:

```js
window.VYRO_SUPABASE_URL = "https://YOUR_TEST_PROJECT.supabase.co";
window.VYRO_SUPABASE_PUBLISHABLE_KEY = "YOUR_TEST_PUBLISHABLE_KEY";
```

Use the publishable key here. Keep any secret or service-role key out of this browser file. Changing Cloudflare's `SUPABASE_URL` later does not change this file automatically: both must refer to the same project. [Supabase API key documentation](https://supabase.com/docs/guides/getting-started/api-keys).

## 3. Install the database tables and original catalog

Open the test project's **SQL Editor**. Open each file below in a text editor, copy its entire contents into a new SQL query and select **Run**. Wait for success before moving to the next file.

1. [First migration](supabase/migrations/202609070001_vyro_commerce.sql)
2. [Second migration](supabase/migrations/202609070002_commerce_procedures.sql)
3. [Original product seed](supabase/seed.sql)

In the Table Editor, check that `products` contains eight guides with `coming_soon` status. The `categories` table should contain four original categories. Do not run `supabase/tests/commerce.sql` as a setup migration.

If SQL reports that a table already exists, stop and resolve the schema conflict before continuing. Do not delete existing customer or order tables. For eventual production setup, first back up the existing project and follow [the migration guide](SUPABASE_COMMERCE_SETUP.md).

## 4. Create the two file buckets

In Supabase, open **Storage** and create these exact bucket names:

| Bucket name | Public setting | Purpose |
|---|---|---|
| `public-assets` | On | Covers and public preview images |
| `paid-products` | Off | Purchased PDFs, ZIPs and future installers |

Choose upload limits that allow your real files within your plan's limits. Keep the paid bucket private. Upload actual products later through VYRO Admin, which records and verifies their metadata. [Supabase bucket documentation](https://supabase.com/docs/guides/storage/buckets/creating-buckets).

## 5. Put the test website on GitHub

Create a new private repository, for example `vyro-commerce-test`. Open **Add file > Upload files**, or the upload link shown in an empty repository. Drag in all the contents inside the extracted `VYRO-commerce` folder, including its subfolders, and commit the upload.

On GitHub's first file listing, verify that `package.json`, `index.html`, `functions/`, `scripts/` and `supabase/` are present. The repository root should not contain only a ZIP or another enclosing `VYRO-commerce` folder. Include the supplied `.gitignore` and placeholder-only `.dev.vars.example`; do not upload real secret files or paid PDFs. [GitHub upload instructions](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## 6. Deploy the test copy with Cloudflare Pages

In Cloudflare, go to **Workers & Pages > Create application > Pages > Connect to Git**. Connect GitHub and select the new test repository. Use these project settings:

| Setting | Value |
|---|---|
| Production branch | Your repository's main/default branch |
| Framework preset | None |
| Root directory | Leave blank when `package.json` is at the repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Build environment variable | `NODE_VERSION` = `24` |
| Functions compatibility date | `2026-09-07` |

Save and deploy. Set the Functions compatibility date in project settings if it is not shown during creation. The source `functions/` stays beside `package.json`; do not move it inside `dist/`. Use Git integration for this package, because dashboard drag-and-drop does not deploy these Pages Functions. [Cloudflare Git deployment](https://developers.cloudflare.com/pages/get-started/git-integration/), [Pages Functions setup](https://developers.cloudflare.com/pages/functions/get-started/).

Copy the stable HTTPS address Cloudflare assigns to your test project. In the following steps, `YOUR_TEST_SITE` means that exact hostname. Prefer the project address over a temporary deployment-hash address. The first page may report an unavailable catalog until the next configuration steps are complete.

## 7. Create the sandbox payment connection

Open [Whop Sandbox](https://sandbox.whop.com) and create/sign into your test business. In its Developer area, create a server API key scoped to that business. It needs product/plan read access, checkout configuration creation, and payment/refund/membership read access. Copy the actual business/account ID as well; do not assume it matches the existing production Pixel business ID.

In the same sandbox Developer area, create a webhook pointing to:

```text
https://YOUR_TEST_SITE/api/webhooks/whop
```

Select these events:

```text
payment.succeeded
payment.failed
payment.canceled
refund.created
refund.updated
membership.activated
membership.deactivated
```

Save its signing secret exactly as Whop displays it, including its prefix. A webhook is the message Whop sends to the website to confirm a payment or refund. [Whop Sandbox documentation](https://docs.whop.com/developer/guides/sandbox), [webhook setup](https://docs.whop.com/developer/guides/webhooks).

## 8. Add the server settings to Cloudflare

Open the test Pages project, then **Settings > Variables and Secrets > Add**. For a main-branch deployment, use Cloudflare's **Production** environment. That label does not mean real Whop payments: the `WHOP_ENVIRONMENT` value below keeps payments in sandbox.

| Exact variable name | Value | Encrypt? |
|---|---|---|
| `SUPABASE_URL` | The same test project URL used in `supabase-config.js` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | That project's private legacy `service_role` key | Yes |
| `WHOP_API_KEY` | Your sandbox server API key | Yes |
| `WHOP_WEBHOOK_SECRET` | The sandbox webhook signing secret | Yes |
| `WHOP_COMPANY_ID` | Your actual sandbox selling business/account ID | No |
| `WHOP_ENVIRONMENT` | `sandbox` | No |
| `SITE_URL` | `https://YOUR_TEST_SITE`, without a path or trailing slash | No |

For this release, obtain the `service_role` credential from Supabase Settings > API Keys > legacy API keys. Do not use the browser publishable/anon key in that server setting. Do not rename the variable to a different name from another tutorial.

Save all values, then redeploy the Pages project so they take effect. If you use a branch preview later, configure its separate Preview environment too. [Cloudflare secrets instructions](https://developers.cloudflare.com/pages/functions/bindings/#secrets).

## 9. Configure sign-in emails and password recovery

In the test Supabase project, open **Authentication > URL Configuration**. Set **Site URL** to `https://YOUR_TEST_SITE`. Add this to the redirect allowlist:

```text
https://YOUR_TEST_SITE/account.html**
```

The final `**` covers this test page's confirmation, return-to-product and password-recovery query strings. Keep the hostname specific to your own test site. [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

Before testing normal customer emails, configure **custom SMTP** in Supabase's Auth email settings, or verify that your existing email provider is already connected. Enter your email provider's SMTP host, port, username, password and verified sender address there. Supabase's default sender is restricted to project-team email addresses and a small test sending allowance; it is not ready for customer confirmation/recovery emails. Save, then test signup, confirmation, login, logout and password recovery through the website. [Supabase email setup](https://supabase.com/docs/guides/auth/auth-smtp).

## 10. Make your own account an administrator

Create and confirm your account through the test website. In **Supabase > Authentication > Users**, copy that exact account's user ID. In the trusted SQL Editor, replace the placeholder below and run:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE_YOUR_USER_ID_HERE'::uuid
returning id, role;
```

The result must show your user ID and `admin`. If it returns no row, check the project and ID. Open `https://YOUR_TEST_SITE/admin` and sign in with that same account. When upgrading an existing database, the migration also creates profiles for existing Auth users, so an existing confirmed account can be promoted.

## 11. Prepare one real product first

In VYRO Admin, select **Products > Manage** on one of the eight existing guides. Keep it Coming Soon while preparing it; you do not need to recreate the eight listings.

In **Artwork & paid files**, choose the private **PDF** or **ZIP pack** role, select your genuine paid file, provide its display name/version, review the acknowledgment and upload. Wait until it shows **Verified upload**. The existing cover can stay unchanged.

In Whop Sandbox, create the corresponding product and a **one-time** plan. Its amount and currency must exactly match the VYRO product. Avoid trials, installments, access expiry and promotional discounts for this release. Copy the actual Whop product and plan IDs into **Pricing & Whop checkout** in VYRO Admin. Save, review Preview and readiness, then set the product to **Active** and save again.

If publication is rejected, correct the reported missing requirement. Leave products without real files/payment setup Coming Soon. [Detailed product instructions](PRODUCT_UPLOAD_GUIDE.md).

## 12. Test a complete purchase

Use a normal customer account, not only the administrator. Start from VYRO's **Buy Now** button so VYRO creates the internal order before redirecting to Whop. Do not start from an unrelated Whop checkout link.

In sandbox, use `4242 4242 4242 4242`, a future expiry and a three-digit CVC for a successful payment. Use `4000 0000 0000 0002` for a declined payment. These are [Whop's documented sandbox cards](https://docs.whop.com/developer/guides/sandbox).

Check that a successful purchase becomes paid, appears in My Library and downloads the correct file. Confirm the corresponding real sandbox webhook delivery succeeds in Whop. A sample webhook alone is not proof that the complete purchase flow works.

Also verify a second unpaid account has no access, cancellation/decline grants nothing, opening the success URL manually grants nothing, the signed link expires after 60 seconds and requesting a new link works. Issue a sandbox refund through Whop and confirm access is revoked. This release revokes that order's access for any successful partial or full refund. The full service checklist is in [COMMERCE_SETUP.md](COMMERCE_SETUP.md).

## 13. Move the verified setup to the real store

Complete your real PDFs and the marked Privacy, Terms, Refund and Contact pages. Keep your current deployment and database backup available. Apply the reviewed migrations and seed to the existing production Supabase project; do not replace its existing users with the test database. Create its `public-assets` and private `paid-products` buckets too. Restore the production public URL/key in the production copy of `supabase-config.js`, and match the Cloudflare server variables to that same production project.

Create production Whop products/plans and a production webhook at the real storefront URL. Set the production Whop API key/company/signing secret and change `WHOP_ENVIRONMENT` to `production`. Update `SITE_URL`, Supabase's authentication URLs and its email provider settings for the real site. Production provider IDs differ from sandbox IDs.

Deploy the verified source to your existing GitHub/Cloudflare project using the build settings above, keeping products Coming Soon. Promote your confirmed production account using Step 10, then open the deployed production Admin to upload real files and connect production product/plan IDs. Test the real deployment while products are still unavailable, then activate a ready product for a controlled purchase/refund check before opening sales broadly. Production data, paid files, secrets and domain settings do not transfer from the test site automatically.

Recurring subscriptions remain disabled in this release. One-time guide/software purchases and bundles are the implemented sales flow. Local test results are in [QA_REPORT.md](QA_REPORT.md); hosted authentication, real storage and actual Whop transactions still require the setup and service tests described here.
