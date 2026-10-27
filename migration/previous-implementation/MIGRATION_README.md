# WordPress content migration

The public source at <https://theshafterlawyer.com/> was captured on September 30, 2026. The Next.js application reads `src/data/site-content.json` and local images; it does not contact WordPress at runtime.

- **22 published pages:** includes the two published legacy development URLs, `/our-services-dev/` and `/vehicle-accidents-dev/`.
- **5 complete blog articles:** original publication dates and categories retained.
- **7 archive URLs:** both categories, four monthly archives, and the author archive linked by the original site.
- **86 local image files:** all public image media, including page backgrounds, logos, portraits, the case-stage diagrams, and the four local gallery photographs. The media library's unused `.mov` file was not downloaded; no published page embeds that video.
- **7 FAQ answers:** complete source text retained as structured question-and-answer blocks.

`inventory.json` lists every migrated route and intentional cleanup. `validation.json` records the last content validation. `source/` contains the public REST responses and rendered source pages used for migration. These raw captures are audit material and are not served by Next.js.

The migration removes WordPress/Divi scripts, style rules, duplicate desktop/mobile paragraphs, repeated global navigation/footer markup, contact form widgets, tracking markup, and social-sharing widgets. Page links point to the matching local routes, and images point to `/images/`. Original page-specific prose, case results, testimonials, lists, links, and FAQs remain in semantic content blocks. The UI supplies a new functional contact form and shared navigation.

Obvious builder residue was cleaned: the vehicle-accident page's copied restraining-order heading, the defense directory's Lorem ipsum placeholder, and the FAQ page's unrelated business-consulting template list. The FAQ heading's trailing `Goes Here` placeholder was removed. Original versions remain in the raw captures. Legal descriptions were copied as source content, rather than rewritten or updated.

The original site's contact page lists **422 James St.**, while its repeated footers and contact sections list **400 Central Valley Hwy**. The raw and migrated source captures preserve this discrepancy; the application uses its central site configuration for shared contact details.

To repeat extraction using the saved source:

```sh
node scripts/migrate-source.mjs
```

To fetch a new public-source snapshot and redownload media:

```sh
node scripts/migrate-source.mjs --refresh
```

Review any intentional local content edits before rerunning: generated JSON files are replaced. This script only reads the public source; it does not write to or alter WordPress.
