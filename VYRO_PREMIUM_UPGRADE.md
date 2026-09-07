# VYRO premium visual upgrade

This build keeps the existing store, Supabase authentication and Whop Pixel logic intact while upgrading the visual system.

## Visual upgrades
- Premium glass/sticky navigation with scroll state
- Editorial hero layout with layered, floating product covers
- Subtle brand texture and ambient background gradients
- Refined typography, spacing, shadows and rounded surfaces
- Animated category and product cards with pointer-aware highlights
- Better shop filters and responsive mobile controls
- Stronger product-detail presentation, tabs, reviews and FAQ interactions
- Redesigned account/signup experience with a premium split-card layout
- More polished footer, buttons, toast messages and micro-interactions
- Reduced-motion support for accessibility

## Reliability fixes
- Fixed hidden login/signup forms being accidentally displayed by CSS
- Fixed product category badges positioning on generated covers
- Fixed mobile search display and support for more than one search form
- Added actual cover art to featured/related products when an image exists
- Preserved the Whop Pixel on all HTML pages
- Kept the Whop `complete_registration` call after successful Supabase signup
- Updated Supabase documentation for the Cloudflare Pages domain
- Updated `robots.txt` and `sitemap.xml` for `vyro-4u.pages.dev`

## New file
- `motion.js` contains progressive reveal, header-scroll and pointer micro-interactions. If JavaScript fails or reduced motion is requested, content remains usable and visible.
