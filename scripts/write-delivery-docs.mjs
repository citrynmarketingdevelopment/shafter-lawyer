import fs from 'node:fs/promises';import path from 'node:path';
const names=['shafter-lawyer','ruesga','foundation'];
for(const name of names){
 const root=path.resolve('D:/Projects',name),site=JSON.parse(await fs.readFile(path.join(root,'src/data/site.json'))),routes=JSON.parse(await fs.readFile(path.join(root,'migration/routes.json'))),assets=JSON.parse(await fs.readFile(path.join(root,'migration/local-assets.json'))),issues=JSON.parse(await fs.readFile(path.join(root,'migration/import-issues.json')));
 const readme=`# ${site.name}

Independent Next.js 16 App Router application using TypeScript, React and vanilla CSS. Original content and branding are preserved from ${site.origin}. There is no WordPress API, plugin, database or hosting dependency at runtime.

## Local development

Use Node.js 24 (see .nvmrc). Run \`npm ci\`, copy .env.example to .env.local for a new checkout, then run \`npm run dev\`. The prepared workspace already has private SMTP.com and Turnstile secret configuration in the ignored .env.local file. Never commit that file.

- \`npm run typecheck\`: TypeScript verification.
- \`npm run lint\`: lint application and tooling.
- \`npm test\`: security, mail-provider, route and asset tests.
- \`npm run build\`: production build.
- \`npm start\`: serve the production build.
- \`npm run verify\`: Playwright checks against http://localhost:3000. Set TEST_BASE_URL to test another local origin. The audit uses installed Chrome on Windows; change the executable path or install Playwright Chromium on another OS.

## Contact delivery and remaining launch requirement

Contact submissions POST to /api/contact/ in the Node.js runtime. Delivery uses the existing **SMTP.com HTTPS API**, because the reference configuration provides SMTP_API and SMTP_CHANNEL rather than SMTP username/password credentials. A sender authenticated by that account, contactforms@citryn.com, is used. The visitor's address is Reply-To. This avoids spoofing each business's domain. Submissions go to **${site.email}**${name==='ruesga'?' (recipient supplied by the owner)':''}.

**The public Turnstile site key is still missing.** Forms fail closed until it is configured. The existing secret was copied privately, but its matching public key and hostname allowlist could not be inferred. Set the public key for the matching Cloudflare widget, allow the production hostname and www variant if used, and add the specific Vercel preview hostname used for testing. Then rebuild and verify a real browser challenge and inbox receipt. Do not ship Cloudflare's testing keys.

| Variable | Purpose |
| --- | --- |
| NEXT_PUBLIC_SITE_URL | Canonical origin: ${site.origin} |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public widget key; currently missing |
| TURNSTILE_SECRET_KEY | Matching secret; server only |
| SMTP_API | Existing SMTP.com API credential; server only |
| SMTP_CHANNEL | Active SMTP.com channel; server only |
| SMTP_FROM | Authenticated sender; contactforms@citryn.com |
| CONTACT_TO | ${site.email} |
| CONTACT_ALLOWED_ORIGINS | Optional comma-separated exact additional origins; leave empty for normal production |

Vercel's own VERCEL_URL and VERCEL_PROJECT_PRODUCTION_URL are recognized automatically. The API validates body size, fields, request origin, honeypot, Turnstile success, hostname and action. Turnstile's single-use tokens provide the primary replay protection. A bounded in-memory IP rate limit is supplementary and resets across serverless instances; use Vercel's platform rate controls if stronger global limits are needed. Errors never log credentials or submission contents. All provider calls have timeouts and no runtime filesystem access.

One explicitly labeled migration test was accepted by SMTP.com for this recipient. Inbox delivery has not been independently confirmed. Browser loading/error/retry/success states were tested using mocked transport and a temporary public testing key; that testing key was removed afterward. See migration/mail-delivery-test.json and migration/form-ui-qa.json.

## Content and design maintenance

${routes.length} original page routes and ${Object.keys(assets).length} source assets are preserved. The importer converts sanitized original content into a typed React content tree in src/data/design-pages.json. MigrationPage renders it on the server; only contact forms, menus, lightboxes, galleries and native parallax need client JavaScript. Original visual rules are pruned into static, local vanilla CSS in public/styles. There is no Divi, jQuery, WordPress or third-party UI framework runtime. Original class names remain as styling identifiers to preserve the exact cascade.

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

All original route slugs remain. Metadata includes titles, descriptions, canonicals, Open Graph, Twitter and business/breadcrumb JSON-LD. sitemap.xml and robots.txt are generated. Preview deployments disallow indexing. Legacy source asset paths and old sitemap endpoints redirect permanently with HTTP 301 to local assets and the new sitemap. ${name==='shafter-lawyer'?'The two original -dev routes remain accessible with noindex and public-page canonicals. Original article/attorney schema and source modification dates are retained. Native /search/, /feed/ and /comments/feed/ replace the public WordPress search/feed features. The obsolete WordPress login link was removed.':name==='foundation'?'The original /development/ route remains accessible but is noindex because it contains legacy template material.':'The gallery CTA that previously pointed to # now links to the existing farming-operations imagery. Social placeholders without real destinations are non-clickable.'}

## Vercel deployment

Create a separate Vercel project rooted in this directory. Select Next.js and Node.js 24, with \`npm run build\` and the default output settings. Add the environment variables above to the intended Vercel environment before building; NEXT_PUBLIC variables are embedded at build time. Do not use static export because the contact handler${name==='shafter-lawyer'?' and search route':''} requires a server function.

The implementation is compatible with [Vercel's Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js); delivery and [Turnstile verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) use HTTPS from server-only code. Review the preview at all three screen widths, confirm the Turnstile hostname and mailbox receipt, then attach the production domain. Preserve email-related DNS records. No deployment, DNS cutover or WordPress shutdown was performed during this task.

## Source limitations and external services

${name==='shafter-lawyer'?'- The source contact page says 422 James St., while repeated footers say 400 Central Valley Hwy. Both original visible passages remain; business schema uses the repeated footer address. Confirm the current address before cutover.\n- Google Maps embeds remain an independent external service.\n- A copied restraining-order heading on the public vehicle-accident page was corrected to the page topic.':name==='foundation'?'- Six decorative funeral-template icons on the original legacy /development/ page return 404. No substitutes were invented; the failed images are omitted, and the exact URLs are in migration/import-issues.json.\n- Assets linked through the defunct dev subdomain were recovered from the main domain.\n- The original YouTube video remains external, with a local thumbnail and click-to-load player. Playback depends on YouTube.': '- No public email address was exposed by the source. The owner supplied jose@ruesgafarms.com.\n- The source repeats two contact form layouts; both field sets are preserved.\n- Source gallery/social placeholder links were repaired or made non-clickable; no social account was invented.'}

${issues.length?'Source issues recorded: '+issues.length+'.':'No inaccessible required source assets were found.'} No PDFs were discovered among published links or the available media records. The WordPress installations must remain online until preview review, live Turnstile verification and recipient inbox checks are complete.
`;
 await fs.writeFile(path.join(root,'README.md'),readme);
 await fs.writeFile(path.join(root,'migration/ROUTES.md'),`# ${site.name}: route inventory\n\nSource: ${site.origin}. All listed page URLs retain their original path.\n\n| Original URL | Next.js route | Page |\n| --- | --- | --- |\n`+routes.map(r=>`| ${r.original} | ${r.route} | ${r.name.replaceAll('|','–')} |`).join('\n')+'\n'+(name==='shafter-lawyer'?'\nFunctional endpoints: /search/ (noindex; also handles legacy /?s=...), /feed/, /comments/feed/.\n':'')+'\nShared technical endpoints: /api/contact/, /sitemap.xml, /robots.txt. Legacy media URLs and sitemap URLs redirect with HTTP 301.\n');
}
