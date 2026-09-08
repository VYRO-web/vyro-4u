# Server API contract

All browser calls use the same site origin. Protected calls send `Authorization: Bearer <Supabase access token>`; mutations send JSON. The server verifies the token with Supabase Auth and independently reads the protected profile role for admin requests. Errors are JSON `{error,code}` with an appropriate HTTP status. API responses use `Cache-Control: no-store`. Cloudflare environment variables contain the private credentials.

| Route | Method | Purpose / input |
|---|---|---|
| `/api/catalog` | GET | `{categories,products}` from the sanitized database RPC; missing service setup disables checkout. |
| `/api/checkout` | POST | Authenticated `{product_id}` UUID; returns `{order_id,checkout_url}` after database and Whop validation. |
| `/api/order?id=UUID` | GET | Own `{order,items}` only. Query values never authorize a purchase. |
| `/api/library?page=1` | GET | Own `{entitlements,orders,has_more}`. Each entitlement includes sanitized product, deliverable metadata and active published releases. No private storage paths. |
| `/api/download` | POST | Own `{asset_id}` or `{product_id,external:true}`. Validates current entitlement and paid order; file URL expires after 60 seconds. |
| `/api/webhooks/whop` | POST | Raw signed provider event; signature checked before reads or writes. |
| `/api/admin/overview` | GET | Real `{overview,recent_orders,configured}`. Revenue grouped by currency. |
| `/api/admin/products` | GET | `{products,has_more}`; `page`, optional `q`, `status`, `product_type` filters. |
| `/api/admin/product?id=UUID` | GET | `{product,assets,releases,bundle_components}` including private admin metadata. |
| `/api/admin/product` | POST | `{product:{...}}` creates draft/coming-soon; `{action:'duplicate',id}` copies text to a new draft with cleared provider IDs/destination. |
| `/api/admin/product` | PATCH | `{id,product:{...}}`; explicit editable field allowlist. |
| `/api/admin/categories` | GET | `{categories}`. |
| `/api/admin/category` | POST/PATCH | `{category:{...}}`, plus `id` for update. |
| `/api/admin/upload` | POST | Stage `{product_id,asset_type,filename,mime_type,file_size,display_name,version,safety_confirmed}`; returns `{asset_id,upload_url,token,path,mime_type}`. PUT the file to `upload_url` using the **returned** MIME type, then POST `{action:'finalize',asset_id}`. |
| `/api/admin/asset` | PATCH | `{id,asset:{active,display_name,display_order,version}}`; no destructive file deletion. |
| `/api/admin/release` | POST/PATCH | `{release:{product_id,version,platform,architecture,asset_id,release_notes,minimum_os,active}}`; add `id` for update. |
| `/api/admin/bundle` | PUT | `{product_id,component_ids:[UUID]}`; atomic replacement, no nested bundles. |
| `/api/admin/reconcile` | POST | `{payment_id}`; verified recovery of a real payment after webhook failure. |

Product fields and service RPC signatures are documented in `SCHEMA_CONTRACT.md`. The backend and migrations must be deployed together.

## Storage verification and practical limits

Paid uploads use immutable random paths in `paid-products`; signed upload creation explicitly disables upsert. Pending metadata never makes a file deliverable. Finalization checks bucket privacy, actual content length, actual MIME type and file magic bytes. Public image uploads allow PNG/JPEG/WebP/AVIF, maximum 12 MB. Private uploads allow PDF/ZIP/7z/gzip/tar/EXE/MSI/DMG/AppImage/DEB/RPM, maximum 512 MB; the Supabase project's configured file limit may be lower. Binary files travel directly from browser to Storage, not through a large Worker body.

Magic-byte checking detects obvious mislabeling; it does not establish that an installer or PDF is harmless. Admin must scan executable/installer content before checking the upload confirmation. There is no automated antivirus engine, archive extraction or code-signing verification bundled here. Upload software from trusted builds and preserve a separate scan record. `checksum_sha256` is available in the schema but remains NULL unless a trusted ingestion process computes it; the code does not pretend that a client-supplied digest proves file contents.

The signed upload capability is valid for the period Supabase issues (currently two hours). It grants creation at one random path without overwrite permission. New versions get new paths. Failed/stale pending uploads can be reviewed in Admin; manually remove unreferenced abandoned objects using the Storage dashboard after confirming they are not in an active release or paid delivery path. [Supabase signed upload documentation](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl), [upload token behavior](https://supabase.com/docs/reference/javascript/storage-from-uploadtosignedurl).

Checkout, downloads and admin actions use database-backed rate limits. They fail closed if that database check fails. At public launch, set Cloudflare rules for broader abusive traffic based on the actual site's traffic; webhook requests must remain deliverable. No IP/header is trusted as customer identity.

## Local tests

Run `node --test tests/backend-security.test.mjs` with Node 22 or newer. Tests stub external HTTP services; no real credentials are required or created. Fixtures are explicitly synthetic and isolated from seed data.

Actual Supabase RLS and transaction execution, real Storage URL expiration and Whop sandbox payment tests require configured services and are listed separately in the final QA report. A successful local mocked test does not certify a deployed integration.
