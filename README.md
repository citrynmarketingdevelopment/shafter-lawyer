# The Shafter Lawyer

Independent Next.js 16 App Router application using TypeScript, React and vanilla CSS. Original content and branding are preserved from https://theshafterlawyer.com. There is no WordPress API, plugin, database or hosting dependency at runtime.

## Local development

Use Node.js 24 (see .nvmrc). Run `npm ci`, copy .env.example to .env.local for a new checkout, then run `npm run dev`. The prepared workspace already has private SMTP.com and Turnstile secret configuration in the ignored .env.local file. Never commit that file.

- `npm run typecheck`: TypeScript verification.
- `npm run lint`: lint application and tooling.
- `npm test`: security, mail-provider, route and asset tests.
- `npm run build`: production build.
- `npm start`: serve the production build.
- `npm run verify`: Playwright checks against http://localhost:3000. Set TEST_BASE_URL to test another local origin. The audit uses installed Chrome on Windows; change the executable path or install Playwright Chromium on another OS.

## Contact delivery and remaining launch requirement

Contact submissions POST to /api/contact/ in the Node.js runtime. Delivery uses the existing **SMTP.com HTTPS API**, because the reference configuration provides SMTP_API and SMTP_CHANNEL rather than SMTP username/password credentials. A sender authenticated by that account, contactforms@citryn.com, is used. The visitor's address is Reply-To. Every submission also copies citryn.contactforms@gmail.com (CONTACT_CC), while retaining the site's existing recipient. This avoids spoofing each business's domain. Submissions go to **shafterlaw@gmail.com**.

**The public Turnstile site key is still missing.** Forms fail closed until it is configured. The existing secret was copied privately, but its matching public key and hostname allowlist could not be inferred. Set the public key for the matching Cloudflare widget, allow the production hostname and www variant if used, and add the specific Vercel preview hostname used for testing. Then rebuild and verify a real browser challenge and inbox receipt. Do not ship Cloudflare's testing keys.

| Variable | Purpose |
| --- | --- |
| NEXT_PUBLIC_SITE_URL | Canonical origin: https://theshafterlawyer.com |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public widget key; currently missing |
| TURNSTILE_SECRET_KEY | Matching secret; server only |
| SMTP_API | Existing SMTP.com API credential; server only |
| SMTP_CHANNEL | Active SMTP.com channel; server only |
| SMTP_FROM | Authenticated sender; contactforms@citryn.com |
| CONTACT_TO | shafterlaw@gmail.com |
| CONTACT_CC | Additional recipient: citryn.contactforms@gmail.com |
| CONTACT_ALLOWED_ORIGINS | Optional comma-separated exact additional origins; leave empty for normal production |

Vercel's own VERCEL_URL and VERCEL_PROJECT_PRODUCTION_URL are recognized automatically. The API validates body size, fields, request origin, honeypot, Turnstile success, hostname and action. Turnstile's single-use tokens provide the primary replay protection. A bounded in-memory IP rate limit is supplementary and resets across serverless instances; use Vercel's platform rate controls if stronger global limits are needed. Errors never log credentials or submission contents. All provider calls have timeouts and no runtime filesystem access.

One explicitly labeled migration test was accepted by SMTP.com for this recipient. Inbox delivery has not been independently confirmed. Browser loading/error/retry/success states were tested using mocked transport and a temporary public testing key; that testing key was removed afterward. See migration/mail-delivery-test.json and migration/form-ui-qa.json.

## Content and design maintenance

34 original page routes and 413 source assets are preserved. The importer converts sanitized original content into a typed React content tree in src/data/design-pages.json. MigrationPage renders it on the server; only contact forms, menus, lightboxes, galleries and native parallax need client JavaScript. Original visual rules are pruned into static, local vanilla CSS in public/styles. The prebuild/predev script packages these rules into server-rendered style elements to avoid a blocking stylesheet request; rerun node scripts/prepare-styles.mjs after editing CSS during development. Responsive background copies preserve desktop photographs while reducing mobile transfers. There is no Divi, jQuery, WordPress or third-party UI framework runtime. Original class names remain as styling identifiers to preserve the exact cascade.

- src/data/design-pages.json: page copy, layout hierarchy, local image references and form definitions.
- src/data/site.json: business identity and public contact information.
- src/components/MigrationPage.tsx: server rendering of reusable content and semantic elements.
- src/components/SiteInteractions.tsx: accessible navigation, galleries and lightboxes.
- src/components/MigrationContactForm.tsx and src/lib/secure-contact.ts: browser form and server handler.
- public/styles/page-*.css: original page design rules; public/styles/native.css: native behavior and accessibility fixes.
- public/assets: original assets plus optimized WebP images and WOFF2 fonts. Original files are retained. Font licenses are in licenses/.
- migration/routes.json and migration/ROUTES.md: route inventory.
- migration/comparison.html: offline original/Next.js screenshot comparison at 1440, 768 and 390 pixels.
- migration/reference/: original captures with scroll animation timing neutralized; migration/qa/: replacement captures.

Treat source snapshots and earlier audit reports as evidence, not current runtime files. Historical Shafter implementation files are retained under migration/previous-implementation; the active app uses the new renderer. Build-time import tools are audit utilities and should not be rerun over editorial changes without reviewing their output. Each app has its own dependencies, data, CSS, assets, environment and lockfile.

## SEO and URLs

All original route slugs remain. Metadata includes titles, descriptions, canonicals, Open Graph, Twitter and business/breadcrumb JSON-LD. sitemap.xml and robots.txt are generated. Preview deployments disallow indexing. Legacy source asset paths and old sitemap endpoints redirect permanently with HTTP 301 to local assets and the new sitemap. The two original -dev routes remain accessible with noindex and public-page canonicals. Original article/attorney schema and source modification dates are retained. Native /search/, /feed/ and /comments/feed/ replace the public WordPress search/feed features. The obsolete WordPress login link was removed.

## Vercel deployment

Create a separate Vercel project rooted in this directory. Select Next.js and Node.js 24, with `npm run build` and the default output settings. Add the environment variables above to the intended Vercel environment before building; NEXT_PUBLIC variables are embedded at build time. Do not use static export because the contact handler and search route requires a server function.

The implementation is compatible with [Vercel's Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js); delivery and [Turnstile verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) use HTTPS from server-only code. Review the preview at all three screen widths, confirm the Turnstile hostname and mailbox receipt, then attach the production domain. Preserve email-related DNS records. No deployment, DNS cutover or WordPress shutdown was performed during this task.

## Source limitations and external services

- The source contact page says 422 James St., while repeated footers say 400 Central Valley Hwy. Both original visible passages remain; business schema uses the repeated footer address. Confirm the current address before cutover.
- Google Maps embeds remain an independent external service.
- A copied restraining-order heading on the public vehicle-accident page was corrected to the page topic.

No inaccessible required source assets were found. No PDFs were discovered among published links or the available media records. The WordPress installations must remain online until preview review, live Turnstile verification and recipient inbox checks are complete.

## Crawl-control and mail-copy verification (October 27, 2026)

robots.txt and sitemap.xml were compared with the live WordPress endpoints. Every indexable source URL remains; legacy development pages stay accessible with noindex and are intentionally excluded. Original source last-modified dates are preserved. See migration/crawl-controls/comparison.json and original-audit.json for exact differences. The new robots rules retain the source exclusions, block /api/, and point to a working HTTPS sitemap.

CONTACT_CC=citryn.contactforms@gmail.com receives a copy of every form submission in addition to CONTACT_TO. One labeled test per site was sent through the actual contact handler and accepted by SMTP.com for both addresses. This local delivery harness simulates Cloudflare verification because the public widget Site Key is missing; it does not add a bypass to the deployed endpoint. Inbox receipt and a live browser challenge remain unconfirmed. See migration/contact-copy-delivery-test.json. To intentionally send another test, run npx tsx scripts/test-contact-delivery.ts; this sends a real email.
