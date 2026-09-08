# Whop setup and payment operations

Status on 7 September 2026: implementation supplied; no Whop API key, webhook secret, connected plans or real purchased files were supplied. No sandbox transaction or live payment was executed. Provider IDs in the migrated catalog remain NULL. Public checkout stays disabled until setup and actual delivery files are complete.

## Checkout model

The current checkout configuration API offers a single existing plan or a single inline plan and returns a hosted `purchase_url`. VYRO uses an existing plan, with one internal order per product. Saved-cart checkout is explicitly per product; it is not a multi-line payment. Bundles use one priced Whop plan and immutable internal component snapshots. [Official checkout configuration reference](https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration).

The frontend remains HTML/CSS/vanilla JavaScript. Cloudflare Pages Functions use native `fetch` and Web Crypto; no Whop secret, server SDK or service-role credential is loaded in the browser. The provider adapter lives in `functions/_lib/whop.js`.

## Start in sandbox

1. Create an account at [Whop Sandbox](https://sandbox.whop.com), then create an account/company API key in its Developer settings. The sandbox business ID may differ from the production Pixel business ID. Keep the existing production Pixel scope unchanged.
2. Configure Cloudflare Pages preview environment secrets: `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_COMPANY_ID`. Set `WHOP_ENVIRONMENT=sandbox` and set `SITE_URL` to the exact HTTPS deployment origin. Configure `SUPABASE_URL` and the private `SUPABASE_SERVICE_ROLE_KEY` separately. Use `.dev.vars` only for local development and never commit it.
3. The adapter selects `https://sandbox-api.whop.com/api/v1` in sandbox. Production selects `https://api.whop.com/api/v1`; arbitrary API destinations are not accepted.
4. Use the documented sandbox successful card `4242 4242 4242 4242` and declined card `4000 0000 0000 0002`, a future expiry and a three-digit CVC. Only use these in sandbox. [Official sandbox guide](https://docs.whop.com/developer/guides/sandbox).

## Connect real products and prices

For each real VYRO guide, create the corresponding product in the sandbox dashboard, then a one-time plan with the exact database price and currency. Configure product and plan access/read permissions, checkout configuration create permission, payments read, refunds read and memberships read for the server key according to the current Whop dashboard. Keys should be scoped to the selected business.

Copy the actual product ID and plan ID into that product's VYRO Admin payment fields. Do not reuse another product's plan. Upload the real PDF, ZIP or installer to the private bucket and finalize it before activating the product. Covers are not deliverables.

The server retrieves the plan at checkout and checks its selling account, product, currency, one-time type and initial price against the database. Prices are major currency units, such as `24.00`. Plans with trials, installment requirements, access expiration or adaptive pricing are rejected. [Official Plans API implementation](https://github.com/whopio/whopsdk-typescript/blob/main/src/resources/plans.ts), [official Plan schema](https://github.com/whopio/whopsdk-typescript/blob/main/src/resources/shared.ts).

Disable promotional discounts for these plans until a deliberate discount ledger is added. This release validates an exact product subtotal and refuses unexpected adjustments. Exclusive tax is accepted only when the retrieved provider total equals the stored subtotal plus provider tax; other unexplained totals fail closed for review. Checkout receipts should explain any provider fees. Validate your exact tax configuration in sandbox before taking real payments.

## Configure webhooks

Create a webhook in the same Whop environment for `https://YOUR_SITE/api/webhooks/whop`, replacing the address with the real site. Subscribe to these documented events:

- `payment.succeeded`
- `payment.failed`
- `payment.canceled`
- `refund.created`
- `refund.updated`
- `membership.activated`
- `membership.deactivated`

Whop follows Standard Webhooks. The endpoint verifies HMAC-SHA256 over the untouched body plus the `webhook-id` and `webhook-timestamp` headers, checks `webhook-signature`, supports rotation signatures and rejects timestamps outside five minutes. Whop uses the literal UTF-8 bytes of the entire issued secret, including the `ws_` prefix. Paste the signing secret into Cloudflare exactly as supplied; do not strip its prefix or encode/decode it. Never paste it into an HTML file. The 8 September package corrects key handling against the current official verifier. [Official webhook guide](https://docs.whop.com/developer/guides/webhooks), [official verifier source](https://github.com/whopio/whopsdk-typescript/blob/main/src/helpers/verifyWebhook.ts).

After signature verification the endpoint retrieves the payment directly from Whop. It verifies the selling business, checkout ID, provider plan/product, internal order ID, Supabase user ID, internal product ID, currency and subtotal against the immutable order snapshot. Browser-supplied totals and the checkout return URL never authorize access. Whop's API payment `status` is `paid`; `substatus` carries success/refund details. The code uses the documented fields, not a guessed `status=succeeded`. [Payment retrieval reference](https://docs.whop.com/api-reference/payments/retrieve-payment).

A single database transaction records the event, updates the order and inserts entitlements. A retry does not duplicate ownership. Failed processing rolls back the event insertion so a retry can work. Refund events retrieve the refund, then retrieve its payment; cumulative refunded amounts determine full versus partial refunds. The supplied policy revokes access for **any successful refund**, including a partial refund. A delayed successful-payment event cannot restore refunded access. Pending or failed refund requests do not independently revoke access. [Refund retrieval reference](https://docs.whop.com/api-reference/refunds/retrieve-refund), [refund event reference](https://docs.whop.com/api-reference/refunds/refund-created).

## Operations and recovery

Whop documents at-least-once, unordered delivery and a short retry window. This endpoint acknowledges only after the database transaction completes; it does not acknowledge and then risk losing an unfinished background task. Monitor non-2xx webhook responses in Cloudflare and the Whop dashboard. Do not log full provider payloads, tokens or signed URLs.

If an outage outlasts retries, use **Verify payment** in Admin (or authenticated `POST /api/admin/reconcile` with `{ "payment_id": "the actual payment ID from Whop" }`). This retrieves the payment from Whop and runs the same identity/amount validation and atomic fulfillment transaction. It cannot mark an unpaid order paid and it cannot invent an order. A mismatched, unrelated or reused checkout is rejected or ignored. A reused hosted checkout may produce a second actual charge; it is flagged for manual provider review rather than granting duplicate access. Issue any necessary refund through the Whop dashboard.

Orders with interrupted checkout creation remain pending and grant nothing. A customer may return to the product and start a fresh checkout. There is no automatic order-cancellation inference from a closed browser tab. The return page only reads that signed-in user's server order status.

## Future subscriptions and external products

This release sells one-time purchases. Schema fields and authenticated membership activation/deactivation processing prepare for subscription products, but recurring checkout is deliberately disabled. Before enabling subscriptions, add a renewal-payment ledger, dunning behavior, permitted-version/license policy, cancel/manage UI and real sandbox renewal tests. Membership events only modify existing paid subscription entitlements; they cannot create first-purchase access. [Membership retrieval reference](https://docs.whop.com/api-reference/memberships/retrieve-membership).

External-access destinations are withheld from the public catalog and returned only after an entitlement check. The destination service must implement its own customer access control; a shared external URL is not a software licensing system. No sample app or software product was created.

## Production switch

After completing all sandbox checks, create/connect the real production products and plans, replace the API key/business ID/webhook secret in the production environment, update database provider IDs for the production catalog, and set `WHOP_ENVIRONMENT=production`. Keep preview and production secrets and preferably Supabase projects separate. Never connect sandbox plans to the live storefront. Run a controlled real purchase/refund only when you authorize live charging and the business policies/files are ready.

## Required service checks before opening checkout

NOT TESTED – requires Whop sandbox credentials and deployed HTTPS webhook: actual successful/failed/canceled checkout, real event payload compatibility, real webhook delivery/retries, provider refund, tax behavior, provider account/plan matching and dashboard reconciliation.

NOT TESTED – requires configured Supabase project and real deliverables: deployed signed URL expiry, real Storage uploads, customer isolation against the live project, and complete payment-to-library-to-download flow.

Local tests verify the signature algorithm against independently created HMAC signatures, malformed/replayed signatures, payment mismatch rejection, safe download authorization and atomic-RPC invocation with mock services. These are not claims of completed Whop sandbox transactions.
