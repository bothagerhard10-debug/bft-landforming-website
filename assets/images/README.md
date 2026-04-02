# Image Slots

The website is wired to these image filenames:

- `hero-tractor.svg`: main tractor with scraper hero image
- `gps-rtk.svg`: RTK GPS close-up
- `scraper-action.svg`: scraper moving soil
- `scraper-closeup.svg`: ErdVark scraper close-up
- `tracks-closeup.svg`: tracks and traction close-up
- `tractor-topdown.svg`: aerial tractor and scraper image
- `process-survey.svg`: Step 1 survey image
- `process-design.svg`: Step 2 create design image
- `process-landform.svg`: Step 3 landform image

Current files are lightweight SVG placeholders so the site renders immediately.

To swap in the real uploaded photos:

1. Export each photo to optimized `webp`, `jpg`, or `png`.
2. Replace the `src` values in the HTML pages if you change the file extension.
3. Keep hero and band images at roughly 1800px to 2400px wide for good quality and fast loading.
