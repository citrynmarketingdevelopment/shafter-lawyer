import assert from "node:assert/strict";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import { load } from "cheerio";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "migration", "inspection");
const baseUrl = new URL(process.env.TEST_BASE_URL || "http://127.0.0.1:3000");
const content = JSON.parse(await readFile(path.join(root, "src/data/site-content.json"), "utf8"));
const assets = JSON.parse(await readFile(path.join(root, "src/data/assets.json"), "utf8"));
const inventory = JSON.parse(await readFile(path.join(root, "migration/inventory.json"), "utf8"));
const siteOrigin = new URL(process.env.TEST_SITE_URL || inventory.source).origin;
const canonicalAliases = {
  "/our-services-dev/": "/our-firm/",
  "/vehicle-accidents-dev/": "/vehicle-accidents/",
};
const report = {
  checkedAt: new Date().toISOString(),
  baseUrl: baseUrl.origin,
  passed: 0,
  failures: [],
  routes: [],
  assets: {},
  screenshots: [],
};

await mkdir(output, { recursive: true });

async function check(name, run) {
  try {
    await run();
    report.passed += 1;
  } catch (error) {
    const failure = { check: name, message: error instanceof Error ? error.message : String(error) };
    report.failures.push(failure);
    console.error(`FAIL ${name}: ${failure.message.slice(0, 350)}`);
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const executablePath = process.env.TEST_CHROME_EXECUTABLE || "C:/Program Files/Google/Chrome/Application/chrome.exe";
    try {
      await access(executablePath);
    } catch {
      throw error;
    }
    return chromium.launch({ executablePath, headless: true });
  }
}

async function screenshot(page, name) {
  const filename = `audit-${name}.png`;
  await page.screenshot({ path: path.join(output, filename), fullPage: true });
  report.screenshots.push(`migration/inspection/${filename}`);
}

async function assertNoOverflow(page, route, width) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter((element) => element.getClientRects().length)
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.right > window.innerWidth + 1 || box.left < -1;
      })
      .slice(0, 5)
      .map((element) => `${element.tagName.toLowerCase()}.${String(element.className).replace(/\s+/g, ".")}`),
  }));
  assert.ok(
    dimensions.scroll <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${route} at ${width}px overflows: ${JSON.stringify(dimensions)}`,
  );
}

let browser;
try {
  browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const api = context.request;

  await check("all migrated local image files exist and contain data", async () => {
    const imagePaths = [...new Set(Object.values(assets))];
    const missing = [];
    for (const imagePath of imagePaths) {
      const localPath = path.resolve(root, "public", `.${imagePath}`);
      assert.ok(localPath.startsWith(path.join(root, "public") + path.sep));
      try {
        const file = await stat(localPath);
        if (!file.isFile() || file.size === 0) missing.push(imagePath);
      } catch {
        missing.push(imagePath);
      }
    }
    report.assets = { checked: imagePaths.length, missing };
    assert.deepEqual(missing, []);
  });

  for (let offset = 0; offset < content.length; offset += 4) {
    await Promise.all(content.slice(offset, offset + 4).map(async (entry) => {
      await check(`route and SEO ${entry.path}`, async () => {
        const response = await api.get(new URL(entry.path, baseUrl).href);
        const html = load(await response.text());
        const info = {
          path: entry.path,
          status: response.status(),
          h1Count: html("h1").length,
          title: html("title").text().trim(),
          description: html('meta[name="description"]').attr("content") || "",
          canonical: html('link[rel="canonical"]').attr("href") || "",
          robots: html('meta[name="robots"]').attr("content") || "",
        };
        report.routes.push(info);
        assert.equal(info.status, 200);
        assert.equal(info.h1Count, 1, `Expected one h1, got ${info.h1Count}`);
        assert.ok(info.title.length > 10, "Missing meaningful title");
        assert.ok(info.description.length > 40, "Missing meaningful meta description");
        assert.equal(info.canonical, `${siteOrigin}${canonicalAliases[entry.path] || entry.path}`);
        if (canonicalAliases[entry.path]) assert.match(info.robots, /noindex/);
        else assert.doesNotMatch(info.robots, /noindex/);
      });
    }));
  }
  report.routes.sort((a, b) => a.path.localeCompare(b.path));
  await check("all 34 routes have unique titles and descriptions", async () => {
    assert.equal(content.length, 34);
    assert.equal(report.routes.length, 34);
    assert.equal(new Set(report.routes.map((entry) => entry.title)).size, 34, "Duplicate page titles");
    assert.equal(new Set(report.routes.map((entry) => entry.description)).size, 34, "Duplicate meta descriptions");
  });

  await check("sitemap includes each indexable page and excludes legacy duplicates", async () => {
    const response = await api.get(new URL("/sitemap.xml", baseUrl).href);
    assert.equal(response.status(), 200);
    const xml = load(await response.text(), { xmlMode: true });
    const actual = xml("url > loc").map((_, element) => xml(element).text()).get().sort();
    const expected = content.filter((entry) => !canonicalAliases[entry.path]).map((entry) => `${siteOrigin}${entry.path}`).sort();
    assert.deepEqual(actual, expected);
    report.sitemapEntries = actual.length;
  });

  await check("robots.txt allows public pages and declares the canonical sitemap", async () => {
    const response = await api.get(new URL("/robots.txt", baseUrl).href);
    assert.equal(response.status(), 200);
    const robots = await response.text();
    assert.match(robots, /User-Agent:\s*\*/i);
    assert.match(robots, /^Allow:\s*\/$/im);
    assert.match(robots, /^Disallow:\s*\/api\/$/im);
    assert.ok(robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`));
  });

  await check("unknown routes return HTTP 404", async () => {
    const response = await api.get(new URL("/migration-smoke-not-a-real-page/", baseUrl).href);
    assert.equal(response.status(), 404);
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const entry of content) {
      await check(`layout ${width}px ${entry.path}`, async () => {
        await page.goto(new URL(entry.path, baseUrl).href, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await assertNoOverflow(page, entry.path, width);
      });
    }
  }

  for (const route of ["/", "/biography/", "/dui-cases/", "/blog/"]) {
    await check(`rendered local images ${route}`, async () => {
      const imageFailures = [];
      const recordFailure = (response) => {
        if (response.request().resourceType() === "image" && response.status() >= 400) {
          imageFailures.push({ url: response.url(), status: response.status() });
        }
      };
      page.on("response", recordFailure);
      try {
        await page.goto(new URL(route, baseUrl).href, { waitUntil: "load" });
        const images = await page.evaluate(async () => {
          const elements = [...document.images];
          for (const image of elements) image.loading = "eager";
          await Promise.all(elements.map((image) => image.decode().catch(() => {})));
          return elements.map((image) => ({
            src: image.currentSrc || image.src,
            loaded: image.complete && image.naturalWidth > 0,
          }));
        });
        assert.ok(images.length > 0);
        assert.deepEqual(images.filter((image) => !image.loaded), [], "Some images did not decode");
        assert.deepEqual(images.filter((image) => new URL(image.src).origin !== baseUrl.origin), [], "Some images depend on a remote host");
        assert.deepEqual(imageFailures, [], "Image requests failed");
      } finally {
        page.off("response", recordFailure);
      }
    });
  }

  await check("mobile navigation and defense dropdown open and close", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(new URL("/", baseUrl).href, { waitUntil: "load" });
    const menu = page.locator(".menu-toggle");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#primary-navigation")).toBeVisible();
    const areas = page.getByRole("button", { name: "Show defense areas" });
    await areas.click();
    await expect(areas).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#defense-menu")).toBeVisible();
    await assertNoOverflow(page, "open mobile navigation", 390);
    await screenshot(page, "mobile-navigation");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('button[aria-controls="defense-menu"]')).toHaveAttribute("aria-expanded", "false");
  });

  await check("FAQ accordion is keyboard operable and exposes its answer", async () => {
    await page.goto(new URL("/faqs/", baseUrl).href, { waitUntil: "load" });
    const faq = page.locator("details.faq").first();
    const summary = faq.locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(faq).toHaveAttribute("open", "");
    await expect(faq.locator(".prose")).toBeVisible();
    await screenshot(page, "faq-expanded");
    await summary.press("Enter");
    await expect(faq).not.toHaveAttribute("open", "");
  });

  await check("placeholder SMTP returns honest 503 and preserves contact form input", async () => {
    // Never run this send attempt against a deployed site or real credentials.
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname), "Contact check is local-only");
    const envFile = await readFile(path.join(root, ".env.local"), "utf8");
    assert.match(envFile, /^SMTP_HOST\s*=\s*["']?smtp\.example\.com["']?\s*$/m, "Contact check requires the documented placeholder SMTP host");
    assert.match(envFile, /^SMTP_PASSWORD\s*=\s*["']?your-smtp-password["']?\s*$/m, "Contact check requires the documented placeholder password");
    assert.ok(!process.env.SMTP_HOST || process.env.SMTP_HOST === "smtp.example.com", "Do not override SMTP host with real credentials when running this check");
    await page.goto(new URL("/contact-us/", baseUrl).href, { waitUntil: "load" });
    const form = page.locator("form.contact-form").first();
    const synthetic = {
      name: "Migration Smoke Check",
      email: "migration-smoke@example.invalid",
      phone: "661-555-0100",
      message: "Synthetic local migration verification. This message must not be delivered.",
    };
    await form.getByLabel("Name", { exact: true }).fill(synthetic.name);
    await form.getByLabel("Email Address", { exact: true }).fill(synthetic.email);
    await form.getByLabel("Phone Number", { exact: true }).fill(synthetic.phone);
    await form.getByLabel("Message", { exact: true }).fill(synthetic.message);
    const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/contact/" && response.request().method() === "POST");
    await form.getByRole("button", { name: "Send", exact: true }).click();
    const response = await responsePromise;
    assert.equal(response.status(), 503);
    assert.equal((await response.json()).success, false);
    await expect(form.locator(".form-status")).toHaveAttribute("data-state", "error");
    await expect(form.locator(".form-status")).toContainText("unavailable");
    await expect(form.locator('.form-status a[href="tel:+16617460235"]')).toBeVisible();
    await expect(form.getByLabel("Name", { exact: true })).toHaveValue(synthetic.name);
    await expect(form.getByLabel("Email Address", { exact: true })).toHaveValue(synthetic.email);
    await expect(form.getByLabel("Message", { exact: true })).toHaveValue(synthetic.message);
    await expect(form.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
    await screenshot(page, "contact-unconfigured");
  });

  await check("no uncaught browser errors", async () => assert.deepEqual([...new Set(pageErrors)], []));
  await context.close();
} catch (error) {
  report.failures.push({ check: "audit execution", message: error instanceof Error ? error.message : String(error) });
} finally {
  if (browser) await browser.close();
  report.completedAt = new Date().toISOString();
  await writeFile(path.join(output, "browser-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, failed: report.failures.length, routes: report.routes.length, report: "migration/inspection/browser-report.json" }));
  if (report.failures.length) process.exitCode = 1;
}
