# VYRO — what's real vs what's next

## What's actually working in this prototype
- Full responsive layout: home, shop, product pages
- Live search, category filters, price filter, sort (newest/popularity/price)
- Product data lives in one file (`data.js`) — nothing is hard-coded into the HTML, so adding a product means adding one object to that array
- Cart adds items and updates the nav badge (in-memory for this session only)
- Related products, reviews, FAQ, tabbed product info — all driven by `data.js`

## What still needs real infrastructure (can't be faked in a static prototype)
1. **Database** — replace `data.js` with a real database (e.g. Postgres via Supabase, or a headless CMS like Sanity) so products can be added/edited without touching code.
2. **Admin dashboard** — a password-protected app (products, orders, customers, reviews, homepage content, site settings) that reads/writes to that database.
3. **Accounts & downloads** — real user auth (e.g. Clerk, Supabase Auth) plus a "My Downloads" area tied to each customer's paid orders.
4. **Payments** — Stripe Checkout (best fit for digital downloads) or PayPal, connected via a server that creates the checkout session and verifies payment before releasing the download link. No fake "Pay Now" button that skips this.
5. **File delivery** — PDFs stored somewhere like S3/Supabase Storage with signed, expiring download links generated after a verified purchase.

## Natural next step
This kind of app — real database, admin panel, auth, Stripe — is a coded full-stack build. The fastest path from this prototype to a live store is handing this exact folder to a developer, or building it out yourself with Claude Code (Next.js + Supabase + Stripe is a common, well-supported stack for this).
