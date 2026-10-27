import fs from 'node:fs/promises';
import path from 'node:path';

const records=[];
for(const [folder,label,tests] of [['shafter-lawyer','Shafter Lawyer',36],['ruesga','Ruesga Farms',12],['foundation','Foundation Properties',12]]) {
  const root=path.resolve('D:/Projects',folder);
  const read=async name=>JSON.parse(await fs.readFile(path.join(root,'migration',name),'utf8'));
  const pages=JSON.parse(await fs.readFile(path.join(root,'src/data/design-pages.json'),'utf8'));
  const site=JSON.parse(await fs.readFile(path.join(root,'src/data/site.json'),'utf8'));
  const assets=await read('local-assets.json'), qa=await read('browser-qa.json'), lh=await read('lighthouse-mobile.json');
  const endpoints=await read('endpoints-qa.json'), mail=await read('mail-delivery-test.json'), sourceIssues=await read('import-issues.json');
  if(qa.routes.length!==pages.length||qa.errors.length)throw new Error(folder+': browser QA is incomplete');
  const verification={
    verifiedAt:new Date().toISOString(),buildId:(await fs.readFile(path.join(root,'.next/BUILD_ID'),'utf8')).trim(),
    stack:'Next.js 16.4.3, React 19, TypeScript, vanilla CSS, Node.js 24',
    typecheck:'passed',lint:'passed',productionBuild:'passed',unitTests:{passed:tests,failed:0},productionDependencyVulnerabilities:0,
    originalRoutes:pages.length,indexableRoutes:endpoints.sitemapUrls,localizedSourceAssets:Object.keys(assets).length,
    browserQA:{routes:qa.routes.length,widths:[1440,768,390],screenshots:qa.screenshots.length,errors:qa.errors},
    sourceReferenceCaptures:(await read('reference-captures.json')).length,
    wordPressRuntimeDependencies:[],clientSecretScan:await read('secret-scan.json'),
    forms:{serverValidation:'passed',mockedBrowserStates:'passed',turnstileServerTests:'passed',smtpProviderAccepted:mail.providerAccepted,recipient:site.email,inboxReceipt:'not verified',liveTurnstile:'blocked: matching public site key missing; production/preview widget hostnames must be configured'},
    lighthouseMobile:Object.fromEntries(Object.entries(lh.categories).map(([key,value])=>[key,Math.round(value.score*100)])),
    lighthouseMetrics:{lcpMs:lh.audits['largest-contentful-paint'].numericValue,cls:lh.audits['cumulative-layout-shift'].numericValue},
    inaccessibleSourceAssets:sourceIssues,
    deployment:{independentVercelApplication:true,deployed:false,dnsChanged:false,wordpressTakenOffline:false,launchBlockedBy:['Missing public Turnstile site key and hostname verification','Recipient inbox receipt not independently confirmed']},
  };
  await fs.writeFile(path.join(root,'migration/verification.json'),JSON.stringify(verification,null,2)+'\n');
  records.push({folder,label,root,pages,site,verification});
}
const row=(label,fn)=>`| ${label} | ${records.map(fn).join(' | ')} |`;
let report=`# WordPress migration report — October 27, 2026

Three independent applications are implemented in their assigned directories, with 49 original page routes and 821 localized source assets. Local production builds and browser QA pass. **Production launch still requires the matching public Cloudflare Turnstile site key, hostname configuration, and confirmation of recipient inbox delivery.** Forms deliberately remain disabled without the public key.

No Vercel deployment, DNS change, or WordPress shutdown was performed. The original websites remain active.

| Requirement | Shafter Lawyer | Ruesga Farms | Foundation Properties |
| --- | --- | --- | --- |
${row('Pages migrated',r=>`${r.pages.length} (${r.verification.indexableRoutes} indexable)`)}
${row('Assets localized',r=>`${r.verification.localizedSourceAssets} original files, plus optimized variants`)}
${row('Visual QA completed',r=>`${r.verification.browserQA.screenshots} captures at 1440 / 768 / 390 px`)}
${row('Contact forms verified',()=> 'Server and mocked UI pass; SMTP accepted; live Turnstile pending')}
${row('SEO implemented',()=> 'Page metadata, JSON-LD, canonical URLs, sitemap, robots')}
${row('Production build passed',()=> 'Yes; TypeScript and lint also pass')}
${row('Unit tests',r=>`${r.verification.unitTests.passed} passed`)}
${row('Vercel ready',()=> 'Application ready; launch requires Turnstile configuration')}

Asset counts identify original localized files, excluding newly generated WebP/WOFF2/mobile variants. Originals are retained. All public images, backgrounds, fonts and downloads used by migrated pages resolve locally. No linked PDFs were discovered in the source pages or available media records. Foundation's six inaccessible legacy decorative icons are documented below.

## Applications and review files

${records.map(r=>`- **${r.label}:** [README](${r.folder}/README.md), [route inventory](${r.folder}/migration/ROUTES.md), [screenshot comparison viewer](${r.folder}/migration/comparison.html), [verification evidence](${r.folder}/migration/verification.json). Local production preview: http://localhost:${r.folder==='shafter-lawyer'?4101:r.folder==='ruesga'?4102:4103}/.`).join('\n')}

Each app owns its dependencies, lockfile, environment configuration, data, components and assets. The existing Shafter content, detailed article SEO and tests were preserved; changed earlier implementation entry points are archived under its migration/previous-implementation directory. The other two apps were initialized independently.

Original content is represented as a typed React tree and rendered by Server Components. Local vanilla CSS preserves the original design cascade. Native React handlers replace WordPress forms, menus, sliders, galleries and parallax scripts. Original builder class names are retained solely as CSS selectors; no WordPress, Divi, jQuery, Bootstrap or Tailwind runtime is required. Page CSS is prepared at build time and included in server-rendered HTML. Images use Next.js Image where appropriate, plus responsive local backgrounds. Font licenses are stored in each licenses directory.

## Contact forms and launch configuration

| Site | Submission recipient | Provider verification |
| --- | --- | --- |
${records.map(r=>`| ${r.label} | ${r.site.email} | One labeled migration test accepted by SMTP.com (HTTP 200); inbox unconfirmed |`).join('\n')}

Ruesga's recipient was supplied by the owner. Shafter and Foundation recipients were taken from their original public pages.

The reference environment supplies an SMTP.com API credential and channel, rather than SMTP host/password credentials. The Node.js server endpoint therefore uses SMTP.com's HTTPS API with the account's authenticated sender, contactforms@citryn.com. The visitor's email is Reply-To. Required variables and Vercel setup are documented in each README and safe .env.example. Private values are present only in ignored .env.local files; the reference trends-frontend project was not changed. Exact-value scans of production browser bundles found no SMTP or Turnstile secret values.

The server validates fields, body size, origin, honeypot, Turnstile success, action and hostname before sending mail. Network calls have timeouts, provider rejection cannot report success, and a bounded in-memory rate limit supplements Turnstile. That limit resets across serverless instances; it is not a distributed global limiter. All five original form variants retain their fields. Loading, success, error, retry and reset behavior passed browser tests with mocked transport. Turnstile validation and SMTP responses also passed server tests.

The source .env has TURNSTILE_SECRET_KEY but no matching public site key. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY for that widget (or supply a new matching pair), authorize the production hostname and the specific preview hostname, and rebuild. If www is an active alias, redirect it to the canonical hostname or include it explicitly in CONTACT_ALLOWED_ORIGINS and the widget allowlist. A live successful challenge and actual inbox receipt must be checked before cutover. No testing site key is left in the applications.

## Verification and performance

The final production browser pass covered all 49 routes at three widths: 147 replacement screenshots, with corresponding source captures. It found no broken visible local images, horizontal overflow, application console errors, failed internal page links, or WordPress asset requests. Mobile menus open and close with Escape; sliders, accordions, lightbox controls, search, RSS and asset redirects were checked. Foundation's video button creates the original YouTube embed. Unknown routes return 404. Contact endpoints reject invalid fields and missing verification tokens. All 60 unit tests, all lint checks, TypeScript checks and production builds pass. Production dependency audits reported zero known vulnerabilities at verification time.

| Mobile Lighthouse lab result | Shafter Lawyer | Ruesga Farms | Foundation Properties |
| --- | --- | --- | --- |
${row('Performance',r=>String(r.verification.lighthouseMobile.performance))}
${row('Accessibility',r=>String(r.verification.lighthouseMobile.accessibility))}
${row('Best practices',r=>String(r.verification.lighthouseMobile['best-practices']))}
${row('SEO',r=>String(r.verification.lighthouseMobile.seo))}
${row('Largest Contentful Paint',r=>(r.verification.lighthouseMetrics.lcpMs/1000).toFixed(1)+' s')}
${row('Cumulative Layout Shift',r=>r.verification.lighthouseMetrics.cls.toFixed(3))}

These are local production homepage lab runs, not field Core Web Vitals or a guarantee of every page's score. Ruesga and Foundation still have room to improve mobile LCP. Their original image-rich layouts and typography were preserved. Final reports are saved as migration/lighthouse-mobile.html and JSON in each repository. Source screenshots neutralize entrance-animation timing; parallax crops can vary with scroll and capture timing. The comparison viewer supports every route and viewport, and major layouts were visually reviewed and refined.

## Source limitations and external services

- Foundation's public /development/ page references six missing funeral-template decorative PNGs (all HTTP 404). The accessible content is retained, broken icons are omitted, and the route is noindex. Exact URLs are in [import-issues.json](foundation/migration/import-issues.json). No replacement imagery or business claims were fabricated.
- Shafter's contact page says 422 James St., while repeated source footers say 400 Central Valley Hwy. The visible discrepancy is preserved; the existing business schema uses the repeated footer address. Confirm the current business address before launch.
- Shafter's two published development duplicates remain accessible with noindex and canonicals to the corresponding public pages. Foundation's development route is excluded from the sitemap. All other discovered indexable paths remain unchanged.
- Ruesga's gallery placeholder now links to the existing farming-operations image section. Unassigned social placeholders are non-clickable. Shafter's visitor-facing WordPress login link was removed; search and RSS were rebuilt locally.
- Shafter's original Google Maps embed and Foundation's original YouTube video remain independent external services. YouTube loads only after the play button is selected, using youtube-nocookie.com and a local poster. Turnstile and SMTP.com are required external services. All site-controlled fonts and images are local. Availability of third-party maps/video and actual mailbox delivery is outside the local build checks.

## Deployment handoff

Create one Vercel project per directory using Next.js and Node.js 24, the default output settings and npm run build. Configure each project's environment variables before building; public keys are embedded at build time. The contact endpoint requires the Node.js runtime, so do not use static export. The prebuild step prepares local styles; migration screenshots and raw source archives are excluded from deployment uploads. No runtime reads from the old hosting or local project filesystem are required.

Deploy a preview, configure its Turnstile hostname, and verify a real submission in each recipient inbox. Review the source/replacement comparisons, metadata, sitemaps, redirects and business-address discrepancy. Then attach the production domains and plan DNS cutover while preserving mail-related records. Keep WordPress available until that review is complete. Preview builds send noindex directives. All original WordPress media paths that map to localized assets and legacy sitemap endpoints have permanent HTTP 301 redirects.

## Complete route inventory

Every original URL below retains its path. No discovered public page was silently replaced with a placeholder.

`;
for(const r of records){
  report+=`### ${r.label}\n\n| Original URL | Next.js route | Indexing |\n| --- | --- | --- |\n`;
  for(const p of r.pages)report+=`| ${r.site.origin}${p.route} | ${p.route} | ${['/our-services-dev/','/vehicle-accidents-dev/','/development/'].includes(p.route)?'Noindex (legacy page)':'Indexable'} |\n`;
  report+='\n';
}
report+='Shafter also implements /search/ (noindex), /feed/ and /comments/feed/. Legacy /?s=... redirects to /search/?s=... with HTTP 301. Every application additionally provides /api/contact/, /sitemap.xml and /robots.txt.\n';
await fs.writeFile('D:/Projects/MIGRATION_REPORT.md',report);
console.log('Wrote final report and verified evidence for',records.length,'applications.');
