import assert from "node:assert/strict";
import test from "node:test";
import content from "../src/data/site-content.json";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import {
  getCanonicalUrl,
  getOrganizationStructuredData,
  getPageMetadata,
  getPageStructuredData,
  serializeJsonLd,
  SITE_URL,
  type SEOPage,
} from "../src/lib/seo";

const pages = content as SEOPage[];

function inDeployment(environment: string, check: () => void) {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = environment;
  try {
    check();
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  }
}

test("every migrated route has distinct metadata and its canonical URL", () => {
  inDeployment("production", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const page of pages) {
      const metadata = getPageMetadata(page);
      assert.ok(metadata.title && typeof metadata.title === "object" && "absolute" in metadata.title);
      assert.ok(metadata.description && metadata.description.length >= 70);
      assert.ok(metadata.description.length <= 175, `${page.path} description should remain concise`);
      assert.ok(!titles.has(metadata.title.absolute), `Duplicate title for ${page.path}`);
      assert.ok(!descriptions.has(metadata.description), `Duplicate description for ${page.path}`);
      assert.equal(metadata.alternates?.canonical, getCanonicalUrl(page.path));
      assert.ok(metadata.openGraph);
      assert.ok(metadata.twitter);
      titles.add(metadata.title.absolute);
      descriptions.add(metadata.description);
    }
  });
});

test("sitemap retains public URLs and source modification dates while excluding development duplicates", () => {
  inDeployment("production", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    assert.ok(urls.includes(`${SITE_URL}/`), "Homepage must be indexed");
    assert.equal(new Set(urls).size, urls.length);
    assert.equal(entries.length, pages.length - 2);
    assert.ok(!urls.some((url) => url.includes("-dev/")));
    for (const page of pages.filter((page) => !page.path.endsWith("-dev/"))) {
      const entry = entries.find((item) => item.url === `${SITE_URL}${page.path}`);
      assert.ok(entry, `Missing sitemap entry: ${page.path}`);
      assert.equal(entry.lastModified, page.modified);
      assert.ok(!Number.isNaN(Date.parse(page.modified)));
    }
  });
});

test("legacy development pages remain accessible metadata targets without competing in search", () => {
  inDeployment("production", () => {
    assert.equal(getCanonicalUrl("our-services-dev"), `${SITE_URL}/our-firm/`);
    assert.equal(getCanonicalUrl("/vehicle-accidents-dev/"), `${SITE_URL}/vehicle-accidents/`);
    for (const page of pages.filter((page) => page.path.endsWith("-dev/"))) {
      const directive = getPageMetadata(page).robots;
      assert.ok(directive && typeof directive === "object");
      assert.equal(directive.index, false);
      assert.equal(directive.follow, true);
    }
    const home = pages.find((page) => page.path === "/");
    assert.ok(home);
    assert.deepEqual(getPageMetadata(home).robots, { index: true, follow: true });
    const rules = robots().rules as { userAgent: string; allow: string; disallow: string[] };
    assert.equal(rules.userAgent, "*");
    assert.equal(rules.allow, "/");
    assert.ok(!rules.disallow.includes("/"), "Production pages must remain crawlable");
    assert.equal(robots().sitemap, `${SITE_URL}/sitemap.xml`);
  });
});

test("Vercel preview builds are excluded by both robots.txt and page metadata", () => {
  inDeployment("preview", () => {
    assert.deepEqual(robots().rules, { userAgent: "*", disallow: "/" });
    assert.equal(robots().sitemap, undefined);
    assert.deepEqual(sitemap(), []);
    for (const page of pages) {
      assert.deepEqual(getPageMetadata(page).robots, { index: false, follow: false });
    }
  });
});

test("article structured data preserves publication dates, author and breadcrumb hierarchy", () => {
  const posts = pages.filter((page) => page.type === "post");
  assert.equal(posts.length, 5);
  for (const page of posts) {
    const graph = getPageStructuredData(page)["@graph"];
    const article = graph.find((item) => item["@type"] === "BlogPosting");
    assert.ok(article);
    assert.equal(article.datePublished, page.date);
    assert.equal(article.dateModified, page.modified);
    assert.deepEqual(article.author, { "@id": `${SITE_URL}/#attorney` });
    const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb);
    assert.deepEqual(breadcrumb.itemListElement, [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog/` },
      { "@type": "ListItem", position: 3, name: page.title, item: getCanonicalUrl(page.path) },
    ]);
  }
});

test("local business schema uses the source contact details without invented ratings", () => {
  const data = getOrganizationStructuredData();
  const firm = data["@graph"][0];
  assert.ok("telephone" in firm && "email" in firm && "address" in firm);
  assert.equal(firm.telephone, "+16617460235");
  assert.equal(firm.email, "shafterlaw@gmail.com");
  assert.equal(firm.address?.streetAddress, "400 Central Valley Hwy");
  assert.equal(firm.address?.postalCode, "93263");
  assert.ok(!("aggregateRating" in firm));
  assert.ok(!("openingHours" in firm));
});

test("JSON-LD serialization prevents imported text from closing its script element", () => {
  const data = { headline: "</script><script>alert('unsafe')</script>" };
  const serialized = serializeJsonLd(data);
  assert.ok(!serialized.includes("<"));
  assert.deepEqual(JSON.parse(serialized), data);
});
