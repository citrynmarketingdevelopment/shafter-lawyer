# Current migration evidence

The October 27, 2026 migration preserves the original WordPress layouts in the typed design-pages.json tree, local styles and assets. See ../README.md for the current implementation and ../../MIGRATION_REPORT.md for delivery status.

- ROUTES.md and routes.json: complete route inventory.
- audit-2026-10-27/: current source HTML, WordPress API and asset discovery evidence.
- reference/: all original route captures at 1440, 768 and 390 pixels.
- qa/: final production application screenshots at the same widths.
- comparison.html: route-by-route source/replacement comparison viewer.
- browser-qa.json, verification.json, lighthouse-mobile.html: current validation.
- local-assets.json: original URL to local asset mapping; also used by permanent redirects.
- optimized-assets.json, responsive-backgrounds.json, optimized-fonts.json: preserved originals and optimized delivery variants.
- mail-delivery-test.json and form-ui-qa.json: provider acceptance and mocked form-state tests; live Turnstile remains pending the public site key.

The earlier September 30 inventory.json, validation.json, source/ and preserved implementation files are historical audit evidence. They are not the current visual implementation. Do not rerun old importers over current editorial changes. No source site or DNS records were modified.
