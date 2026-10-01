import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { load } from "cheerio";
import content from "../src/data/site-content.json";
import assets from "../src/data/assets.json";
import type { SiteContent } from "../src/data/types";

const pages = content as SiteContent[];
const byPath = new Map(pages.map((page) => [page.path, page]));
const publicDirectory = path.resolve("public");

function getPage(route: string): SiteContent {
  const page = byPath.get(route);
  assert.ok(page, `Original public route is missing: ${route}`);
  return page;
}

function textFingerprint(html: string): string {
  // Ignore layout whitespace, while retaining every original word and punctuation mark.
  return createHash("sha256").update(load(html).text().replace(/\s+/g, "")).digest("hex");
}

function assertLocalImage(src: string, context: string): void {
  assert.ok(src.startsWith("/images/"), `${context} must use a local image: ${src}`);
  const filename = path.resolve(publicDirectory, `.${src}`);
  assert.ok(filename.startsWith(`${path.join(publicDirectory, "images")}${path.sep}`));
  assert.ok(existsSync(filename), `${context} is missing ${src}`);
  assert.ok(statSync(filename).size > 0, `${context} has an empty image: ${src}`);
}

test("every original published page, article and linked archive retains its route", () => {
  const originalRoutes = [
    "/", "/our-firm/", "/defense-areas/", "/case-results/", "/faqs/", "/blog/", "/contact-us/",
    "/biography/", "/disclaimer/", "/dui-cases/", "/dmv-hearings/", "/felony-charges/",
    "/misdemeanors/", "/child-custody/", "/child-visitations/", "/child-support/",
    "/restraining-orders/", "/vehicle-accidents/", "/oilfield-accidents/", "/industrial-accident/",
    "/our-services-dev/", "/vehicle-accidents-dev/", "/tis-season-not-drink-drive/",
    "/thank-veterans-united-states/", "/miranda-rights/", "/arrested/", "/introduction/",
    "/category/scott-winkler-blog/", "/category/uncategorized/", "/author/theshafterlawyer007/",
    "/2017/08/", "/2017/09/", "/2017/11/", "/2017/12/",
  ];
  assert.equal(byPath.size, pages.length, "Duplicate paths would make page resolution ambiguous");
  for (const route of originalRoutes) getPage(route);
  for (const page of pages) {
    assert.match(page.path, /^\/(?:[^?#]+\/)?$/);
    if (page.type === "archive") {
      assert.ok(page.postIds?.length, `${page.path} must contain articles`);
      for (const id of page.postIds) assert.ok(pages.some((article) => article.id === id && article.type === "post"));
    }
  }
});

test("migrated photos exist locally and content cannot load WordPress media or builder code", () => {
  for (const src of new Set(Object.values(assets))) assertLocalImage(src, "Media inventory");
  for (const page of pages) {
    if (page.hero.image) assertLocalImage(page.hero.image, `${page.path} hero`);
    for (const block of page.blocks) {
      if (block.type === "image") {
        assertLocalImage(block.src, page.path);
        continue;
      }
      assert.doesNotMatch(block.html, /\[\/?et_pb_|\bet_pb_|wp-content\/|i\d+\.wp\.com/i, page.path);
      const $ = load(block.html);
      assert.equal($("script,style,form,input,link").length, 0, `${page.path} contains a legacy runtime element`);
      $("img").each((_, image) => assertLocalImage($(image).attr("src") || "", page.path));
      $("a").each((_, anchor) => {
        const href = $(anchor).attr("href") || "";
        assert.doesNotMatch(href, /^\s*(?:javascript|data):/i);
        if (href.startsWith("/") && !href.startsWith("/images/")) {
          const route = href.split(/[?#]/)[0].replace(/\/?$/, "/");
          assert.ok(byPath.has(route), `${page.path} links to an unmigrated page: ${href}`);
        }
      });
    }
  }
});

// These fingerprints were computed independently from the archived public source
// HTML, with only WordPress sharing widgets excluded. An intentional editorial
// revision should update its fixture after reviewing the complete source copy.
test("all five articles retain their complete original prose", () => {
  const sourceFingerprints = {
    "/tis-season-not-drink-drive/": "225f8e841b78e2f335a9cec18a34a16d57c278ffea99b01caae735718a970547",
    "/thank-veterans-united-states/": "cd22479edcf95d61ff8107d167f1b2f56a8dda9f6d97641309fa417c65fd2fa7",
    "/miranda-rights/": "723bb2309b80f17b6833814c7222b23754b14c8a067afeb0e847c02e8d6f076d",
    "/arrested/": "270a32bd3024ef07b118a8837d48b4e5a8b220854859502c6a9a7135cdcd214c",
    "/introduction/": "5c3bd5c25a744ba12eceb67df583bd8a3edd7de7c85dc74789a558b6f5c4b05d",
  };
  for (const [route, fingerprint] of Object.entries(sourceFingerprints)) {
    const page = getPage(route);
    const html = page.blocks.flatMap((block) => block.type === "image" ? [] : [block.html]).join("");
    assert.equal(textFingerprint(html), fingerprint, `${route} lost or altered source text`);
  }
});

test("all seven FAQ answers retain their complete source text", () => {
  const sourceFingerprints = [
    "0bd6f309a02c985f6694f4c86ef7f87819792c55d4c3abff3e61b68bffb67d98",
    "3fab7a7b0e9149cbb795c86299898fa5a4ba5d2304bd291804435099d65c8093",
    "c6c2c255c5dafb1a3851cb32379e0e00eeac9fa07171542208bdfb5492ff4ae2",
    "72ab2ca1857c164e691c3eff3dff826dfcf41cc481eb054227d8cb43a347f5a8",
    "c51fab035d2f9dc3dad74769f9c8f2eb91e9ffede14e5ebaefef70a36194d511",
    "6f3879c756e59098ae5e6306d2e257b96c6279850950d9d05a16c4ce0aa82fd2",
    "93f8b973989a4865c241b2fa8a11799967ee66bfe17a0d30247b692cd1f63c34",
  ];
  const answers = getPage("/faqs/").blocks.filter((block) => block.type === "faq");
  assert.equal(answers.length, sourceFingerprints.length);
  answers.forEach((answer, index) => {
    assert.ok(answer.title.endsWith("?"));
    assert.equal(textFingerprint(answer.html), sourceFingerprints[index], `FAQ answer changed: ${answer.title}`);
  });
});

test("all six case narratives and the full legal disclaimer survive extraction", () => {
  const cases = getPage("/case-results/").blocks
    .filter((block) => block.type === "html" && block.html.includes("The People of California"));
  const caseHtml = cases.map((block) => block.type === "html" ? block.html : "").join("");
  for (const name of ["Daniel A.", "Gaylen O.", "Melissa H.", "Brandon P.", "D.H", "Esteban J."]) {
    assert.ok(caseHtml.includes(`The People of California vs ${name}`), `Missing result for ${name}`);
  }
  assert.equal(textFingerprint(caseHtml), "c8cd3354de42a29d4ce3626af9d9c63e0f12432c29a51f0b236892f56d063925");

  const disclaimer = getPage("/disclaimer/").blocks.find((block) =>
    block.type === "html" && block.html.includes("The information you obtain"));
  assert.ok(disclaimer?.type === "html");
  assert.equal(textFingerprint(disclaimer.html), "d9df883312d36fe0b3dc4e9aad7d06a9cce086ca35838add83bfa78a2ca8faae");
});
