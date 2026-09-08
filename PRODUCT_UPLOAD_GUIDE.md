# Add products and deliver real files

The eight original VYRO images are covers. They are preserved exactly and are not counted as purchased deliverables. No PDFs, resource packs, installers or sample apps have been fabricated.

## Add a digital guide or resource pack

1. Sign into `/admin` with an administrator account.
2. Select **New product**, choose **Digital file**, enter the name and keep **Draft** while preparing it.
3. Set the category or create one through **Categories**. Add descriptions, format, pages/resources and the actual included items.
4. Save the draft. File management now appears.
5. Under **Artwork & paid files**, choose **Cover** and upload artwork. Covers and previews go into the public `public-assets` bucket. Existing seeded cover paths can remain unchanged.
6. Choose **PDF**, **ZIP pack** or the appropriate private role, select the actual purchased file and supply a readable display name/version.
7. Check the file verification acknowledgment only after reviewing your file. Upload and wait for both transfer and server verification to finish. The file must show **Verified upload**.
8. Enter the price in normal currency units: `24.00` means twenty-four dollars if currency is USD. Add a compare-at price only when it represents a real previous price.
9. Create or connect the real Whop product and plan for the same product, amount, currency and environment; follow `WHOP_SETUP.md`. Paste those IDs in the editor.
10. Save, use **Preview**, review the checklist, then set the product to **Active** and save again. The server verifies publication prerequisites and checkout always validates the current database record.

Featured active products appear in the homepage catalog. Categories, search and product details read the database automatically. A buyer sees the product in My Library only after a verified payment grants an entitlement.

## Public versus private files

| Role | Visibility and purpose |
| --- | --- |
| Cover, Preview, Gallery | Public images only. Anyone can view them. |
| PDF, ZIP, Resource, Documentation | Private purchased downloads. |
| Installer, Executable, DMG, Archive | Private installers or archives; software additionally needs a release record. |

Public image formats are PNG, JPEG, WebP and AVIF, up to 12 MB. Private uploads support PDF, ZIP, 7z, GZ, TAR, EXE, MSI, DMG, AppImage, DEB and RPM, up to 512 MB. Your Supabase plan/bucket may impose a smaller limit. Put unsupported resource formats inside a supported ZIP archive. SVG, HTML and arbitrary public executable content are rejected.

The browser uploads directly to the narrowly scoped signed storage URL issued by the server. It then asks the server to verify the object. Until verification succeeds, the asset remains pending and cannot unlock checkout or become a purchased download.

Public/private classification is controlled by the server from the file role. Do not place paid content in public images. For an installer, verify its source, malware scan, installer behavior and platform signing before acknowledging the safety check. Magic-byte/MIME validation is not antivirus software.

## Add previews

Upload additional public artwork using **Preview** or **Gallery**. Set each file's display name and display order. Never expose every paid page as a “preview” unless that is your deliberate publishing decision. The original cover artwork uses contained images and is not regenerated, recolored or destructively cropped.

## Replace a file safely

1. Open the existing product.
2. Upload the replacement as a **new file** with a new version and a clear display name.
3. Wait for verification and test the real file with an eligible test account.
4. Keep old files for history. If buyers should no longer receive an older digital-file version, turn off that file's availability after confirming the replacement works.

The dashboard does not overwrite or delete old storage objects. File availability changes affect existing buyers and may affect software releases that refer to the file; a confirmation explains this before the change. Purchase snapshots retain the original product name, price and currency independently of today's product details.

If a transfer finishes but verification fails or times out, use **Retry verification** for that pending asset. If the upload itself failed, upload again. An abandoned pending record cannot be purchased or downloaded; cleanup can be performed later by a trusted operator after confirming no valid file/release depends on it.

## Add your first real software product

1. Select **New product → Software / app** and save a draft.
2. Add the real name, description, category, price, cover and screenshots.
3. Fill **Software details**: version shown on the product, real supported platforms and actual system requirements.
4. Upload the installer/archive as a private file with its version. Scan and test it first.
5. In **Software releases → Add release**, enter the version, platform, architecture, minimum OS and release notes. Select the verified private file.
6. Publish that release only once it is ready for eligible buyers. An inactive release is retained as a draft version.
7. Connect matching Whop IDs, add your actual license/EULA link where applicable and publish the product after server readiness checks pass.

No app is pre-created. The infrastructure is ready for an application you build later. Product-type software fields are not presented on ordinary PDF products.

## Publish version 1.1 later

1. Open the existing software product and save any pending product edits.
2. Upload the new installer/archive at a new private path and wait for verification.
3. Add a new release with version `1.1`, its platform/architecture, release notes and the verified asset.
4. Publish the new release. Keep previous versions for history, or deactivate a superseded release after confirming the new version works.
5. Update the product's descriptive version and requirements if needed.

Library delivery uses active releases that are published and allowed by the buyer's current entitlement. Existing buyers can request the newest permitted version without altering old order history. Inactive releases and revoked/expired entitlements do not grant a download.

## Add a bundle

Create and save a Bundle draft. Choose actual products in **Bundle components** and save the selection. Use **Load more products** to browse additional product pages. A bundle may also contain its own uploaded private files. Connect a Whop plan for the bundle itself and verify all included delivery before publication.

A bundle is one sellable product. It does not simulate a multi-plan cart checkout. The server validates component references and prevents circular bundles.

## External access and future subscriptions

External-access listings can store a private HTTPS destination and use **Open Product** for an entitled customer. A shared third-party URL is not equivalent to per-user licensing; ensure the destination enforces any permissions your product requires.

Future subscription fields and provider access-event handling are present, but subscription checkout remains disabled in this release. A real subscription product requires the documented billing extension and sandbox verification before sale. Do not label an unimplemented recurring service as available.

## Before accepting real purchases

- Replace all business-specific legal/support placeholders.
- Upload and test the actual purchased deliverable.
- Ensure public storage contains only intended public artwork.
- Connect Whop Sandbox and test the configured payment/webhook flow before switching to live.
- Confirm a paid account can download and an unpaid/other/refunded account cannot.
- Check desktop and mobile product pages, actual installer compatibility, descriptions and license terms.

These are operational steps to perform with real services and files. The supplied project does not claim that your missing deliverables or live payment credentials have been tested.
