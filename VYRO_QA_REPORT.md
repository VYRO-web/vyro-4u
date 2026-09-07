# VYRO QA Report — Cover Artwork Release

Automated checks completed for this build:

- 8/8 products map to a supplied cover image.
- All 8 cover files exist in the deploy folder.
- All 8 cover files are byte-identical to the user-supplied artwork (no re-encoding or pixel edits).
- Cover CSS uses `object-fit: contain`, so artwork is not cropped or stretched.
- JavaScript syntax checks pass for `data.js`, `cart.js`, `auth.js`, `account.js`, `motion.js`, and `supabase-config.js`.
- Inline JavaScript syntax checks pass on `index.html`, `shop.html`, `product.html`, and `account.html`.
- CSS parses with zero stylesheet parse errors.
- All local HTML asset references resolve to files in the project.
- All local navigation links resolve to existing project pages.
- Whop Pixel scope + page event remain installed once on every HTML page.
- Supabase/auth files remain present and unchanged apart from the surrounding visual build.
- Product-card images use lazy loading and async decoding; primary hero/product artwork uses priority decoding where appropriate.
- Reduced-motion support is preserved for users who disable animation.

## Product-to-cover mapping

1. The 8-Week Calisthenics Starter System → `calisthenics-cover.png`
2. 50 High-Protein Recipes → `food-cover.png`
3. The Ultimate Men's Style Guide → `style-cover.png`
4. The Habit Reset Blueprint → `habit-cover.png`
5. 30-Day Home Workout Challenge → `workout-cover.png`
6. The Weekly Meal Prep System → `meal-cover.png`
7. The Capsule Wardrobe Guide → `wardrobe-cover.png`
8. The Deep Work Productivity System → `productivity-cover.png`

The Habit Reset artwork is 2:3 while the other supplied covers are 3:4. The site deliberately uses `contain` rather than cropping it, so the full image remains visible.
