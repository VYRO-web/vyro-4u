# VYRO commerce schema contract

All tables live in `public`; privileged helpers live in `vyro_private`. Amounts are numeric **major currency units**, never cents. Product IDs are UUIDs; `slug` preserves the original `data.js` ID. Currency is uppercase ISO-style three-letter text. Arrays are PostgreSQL `text[]`, returned as JSON arrays.

- `categories`: id, slug, name, description, subcategories[], parent_id, display_order, active, created_at, updated_at.
- `products`: id, slug, name, category_id, subcategory, product_type (`digital_file`, `software`, `bundle`, `external_access`), status (`draft`, `coming_soon`, `active`, `archived`), short_description, full_description, who_for, price_amount, compare_at_price, currency, cover_path, featured, bestseller, is_new, release_date, format, pages_text, included_items[], learning_points[], system_requirements[], platforms[], software_version, delivery_mode (`download`, `external`), external_access_url, license_url, whop_product_id, whop_plan_id, billing_type (`one_time`, `subscription`), seo_title, seo_description, display_order, timestamps.
- `product_assets`: id, product_id, asset_type, bucket, storage_path, original_filename, display_name, mime_type, file_size, version, checksum_sha256, is_deliverable, is_public, display_order, active, upload_status (`pending`, `ready`), validated_at, created_at.
- `app_releases`: id, product_id, version, platform (`windows`, `macos`, `linux`, `web`, `other`), architecture, asset_id, release_notes, minimum_os, published_at, active, created_at.
- `product_bundle_items`: bundle_product_id, component_product_id, display_order. No nested bundles.
- `profiles`: id (auth user ID), display_name, role (`customer`, `admin`), created_at, updated_at. User metadata never sets role; browser cannot change role.
- `orders`: id, user_id, provider (`whop`), customer_email, status (`pending`, `paid`, `failed`, `cancelled`, `refunded`, `partially_refunded`), subtotal_amount, total_amount, refunded_amount, currency, whop_payment_id, whop_receipt_id, whop_checkout_id, whop_membership_id, checkout_url, provider_metadata, paid_at, refunded_at, provider_event_at, access_event_at, created_at, updated_at.
- `order_items`: id, order_id, product_id, product_name, product_slug, product_type, cover_path, unit_price, quantity, currency, whop_plan_id, whop_product_id, billing_type, component_product_ids[], created_at. Snapshots are immutable.
- `entitlements`: id, user_id, product_id, order_id, status (`active`, `revoked`, `expired`), source, granted_at, revoked_at, expires_at; unique `(order_id,product_id)`.
- `webhook_events`: provider, event_id, event_type, order_id, outcome, created_at; composite primary key `(provider,event_id)`.

Public catalog RPC: `public_catalog()` returns `{categories, products}` with sanitized product fields, `checkout_ready` and `availability_reason`. No Whop IDs, external destination or private asset paths. Direct browser product queries have a limited column grant and RLS; drafts/archived are hidden. Coming-soon listings are deliberately public.

Service-only RPCs:

- `create_pending_order(p_user_id uuid,p_product_id uuid,p_email text)` returns `{order,items}` and snapshots current database price and bundle components. Only one-time checkout enabled.
- `apply_whop_event(p_event_id text,p_event_type text,p_order_id uuid,p_payment_id text,p_amount numeric,p_currency text,p_plan_id text,p_product_id text,p_user_id uuid,p_checkout_id text,p_membership_id text,p_status text,p_refunded_amount numeric,p_expires_at timestamptz,p_event_created_at timestamptz,p_total_amount numeric,p_receipt_id text)` returns `{duplicate,order_id,status}`. `p_product_id` is the provider's product ID. The server verifies signature and retrieves payment first. Amount/currency/identity/plan/product are rechecked transactionally against the snapshot. Any refund revokes the order's access, including partial refunds; late payment success cannot restore it.
- `apply_whop_membership(p_event_id text,p_event_type text,p_membership_id text,p_active boolean,p_expires_at timestamptz,p_event_created_at timestamptz)` only changes already paid subscription entitlements. It never creates access.
- `consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)` returns boolean.
- `admin_overview()` returns real counts, revenue grouped by currency, up to 20 recent orders and readiness counts.
- `replace_bundle_components(p_product_id uuid,p_component_ids uuid[])` replaces up to 50 distinct existing non-bundle components atomically; prior order snapshots remain unchanged.

Storage buckets are created through the Storage API/dashboard, not by writing `storage.objects`. Names: `public-assets` (public, image-only), `paid-products` (private). Readiness verifies validated active deliverables exist in private Storage. Digital products need at least one file; software needs a published active release; bundles need all configured components deliverable; external access needs an HTTPS destination. Checkout additionally needs active status, active category, price > 0 and both Whop IDs. Administrative API must inspect provider plan configuration and storage objects; SQL metadata checks do not scan file contents.
