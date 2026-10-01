/**
 * Rebuild the local, WordPress-independent content snapshot.
 * Run: node scripts/migrate-source.mjs (add --refresh to refetch source HTML/REST).
 * This script reads the public source site; it never writes to WordPress.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const origin = 'https://theshafterlawyer.com';
const refresh = process.argv.includes('--refresh');
const sourceDir = 'migration/source';
await Promise.all([sourceDir, 'public/images', 'src/data'].map(dir => fs.mkdir(dir, { recursive: true })));
const plain = html => load(`<div>${html || ''}</div>`).text().replace(/\s+/g, ' ').trim();
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function cached(name, url, json = false) {
  const filename = `${sourceDir}/${name}`;
  if (!refresh) {
    try { const text = await fs.readFile(filename, 'utf8'); return json ? JSON.parse(text) : text; } catch { /* fetch absent source */ }
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const value = json ? await response.json() : await response.text();
  await fs.writeFile(filename, json ? JSON.stringify(value, null, 2) : value);
  return value;
}

async function collection(type) {
  const initial = await cached(`${type}.json`, `${origin}/wp-json/wp/v2/${type}?per_page=100`, true);
  if (initial.length < 100) return initial;
  const all = [...initial];
  for (let index = 2; ; index++) {
    const data = await cached(`${type}-${index}.json`, `${origin}/wp-json/wp/v2/${type}?per_page=100&page=${index}`, true);
    all.push(...data);
    if (data.length < 100) return all;
  }
}

async function concurrent(items, count, action) {
  let next = 0;
  await Promise.all(Array.from({ length: count }, async () => {
    while (next < items.length) { const index = next++; await action(items[index], index); }
  }));
}

const [pages, posts, media, categories] = await Promise.all(['pages', 'posts', 'media', 'categories'].map(collection));
const entries = [...pages, ...posts];
const htmlById = new Map();
await concurrent(entries, 4, async item => {
  const name = `${item.slug || 'home'}.html`;
  htmlById.set(item.id, await cached(name, item.link));
});

const normalized = input => {
  try {
    const url = new URL(input, origin);
    if (/^i\d+\.wp\.com$/.test(url.hostname)) return `https:/${url.pathname}`;
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch { return input; }
};
const canonicalAssets = new Map();
const assetAliases = new Map();
const basenames = new Map();
function registerAsset(source, metadata = {}) {
  source = normalized(source);
  if (!/\.(?:jpe?g|png|gif|webp|avif|svg)$/i.test(source)) return;
  if (!source.startsWith(`${origin}/wp-content/uploads/`)) return;
  if (assetAliases.has(source)) return;
  const base = decodeURIComponent(path.posix.basename(new URL(source).pathname));
  let filename = base;
  if (basenames.has(base) && basenames.get(base) !== source) filename = `${new URL(source).pathname.split('/').slice(-3, -1).join('-')}-${base}`;
  basenames.set(base, source);
  const record = { sourceUrl: source, src: `/images/${filename}`, ...metadata };
  canonicalAssets.set(source, record);
  assetAliases.set(source, source);
}
for (const item of media.filter(item => item.media_type === 'image')) {
  registerAsset(item.source_url, { id: item.id, alt: item.alt_text || '', title: plain(item.title.rendered), width: item.media_details?.width, height: item.media_details?.height });
  for (const size of Object.values(item.media_details?.sizes || {})) if (size.source_url) assetAliases.set(normalized(size.source_url), normalized(item.source_url));
}
for (const html of htmlById.values()) {
  const $ = load(html);
  $('img').each((_, image) => registerAsset($(image).attr('src') || ''));
  for (const match of html.matchAll(/url\((?:['"]?)(https?:[^)'"\s]+)(?:['"]?)\)/g)) registerAsset(match[1].replaceAll('&amp;', '&'));
}

const failures = [];
await concurrent([...canonicalAssets.values()], 6, async asset => {
  const filename = `public${asset.src}`;
  try {
    if (!refresh) { try { const info = await fs.stat(filename); if (info.size > 0) return; } catch { /* absent asset */ } }
    const response = await fetch(asset.sourceUrl, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await fs.writeFile(filename, new Uint8Array(await response.arrayBuffer()));
  } catch (error) { failures.push({ sourceUrl: asset.sourceUrl, error: error.message }); }
});
if (failures.length) console.error('Asset download failures', failures);

const localAsset = value => canonicalAssets.get(assetAliases.get(normalized(value)))?.src;
function localLink(value) {
  if (!value || value === '#') return '/contact-us/';
  try {
    const url = new URL(value, origin);
    if (url.hostname === 'theshafterlawyer.com' || url.hostname === 'www.theshafterlawyer.com') return localAsset(value) || `${url.pathname}${url.search}${url.hash}`;
    if (/^(https?:|mailto:|tel:)/.test(url.protocol)) return value;
  } catch { /* invalid source hyperlink */ }
  return undefined;
}
function sanitize(html) {
  const $ = load(html || '', null, false);
  $('script,style,noscript,form,input,textarea,select,button,.sharedaddy,.jp-relatedposts,.et-pb-icon,.et_pb_contact_form_container,.et_pb_video_overlay').remove();
  const allowed = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 'br', 'a', 'img', 'blockquote', 'cite', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'iframe']);
  $('*').get().reverse().forEach(element => {
    const tag = element.tagName;
    const node = $(element);
    if (tag === 'h1') { element.tagName = 'h2'; }
    else if (!allowed.has(tag)) { node.replaceWith(node.contents()); return; }
    const attrs = { ...element.attribs };
    for (const attribute of Object.keys(attrs)) node.removeAttr(attribute);
    if (tag === 'a') {
      const href = localLink(attrs.href);
      if (href) node.attr('href', href); else node.replaceWith(node.contents());
    }
    if (tag === 'img') {
      const src = localAsset(attrs.src);
      if (!src) { node.remove(); return; }
      node.attr('src', src).attr('alt', attrs.alt || '');
      if (attrs.width) node.attr('width', attrs.width);
      if (attrs.height) node.attr('height', attrs.height);
      node.attr('loading', 'lazy');
    }
    if (tag === 'iframe') {
      if (!/^https:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//.test(attrs.src || '')) { node.remove(); return; }
      node.attr('src', attrs.src).attr('title', attrs.title || 'Video from The Shafter Lawyer').attr('loading', 'lazy').attr('allowfullscreen', '');
    }
    if (['p', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName) && !node.text().trim() && !node.find('img,iframe').length) node.remove();
  });
  return $.html().replace(/<!--[\s\S]*?-->/g, '').replace(/[\ue000-\uf8ff]/g, '').replace(/\s+/g, ' ').replace(/<p>\s*(?:&nbsp;|&#xa0;|\u00a0)*\s*<\/p>/g, '').trim();
}

const notes = [];
const moduleSelector = '.et_pb_text_inner,.et_pb_blurb_content,.et_pb_image,.et_pb_gallery,.et_pb_toggle,.et_pb_testimonial,.et_pb_promo,.et_pb_button_module_wrapper,.et_pb_number_counter,.et_pb_video';
const content = entries.map(item => {
  const $ = load(htmlById.get(item.id));
  const article = $(`#post-${item.id}`).length ? $(`#post-${item.id}`) : $('article').first();
  const container = article.find('.entry-content').first();
  const header = container.find('.et_pb_fullwidth_header').first();
  const title = plain(item.title.rendered);
  const route = new URL(item.link).pathname;
  let heroImage = header.find('[style*="background-image"]').attr('style')?.match(/url\(['"]?([^)'"\s]+)/)?.[1];
  if (!heroImage) heroImage = $('style').text().match(/\.et_pb_fullwidth_header\.et_pb_fullwidth_header_0\{[^}]*background-image:[^}]*?url\(['"]?([^)'"\s]+)/)?.[1];
  if (!heroImage && item.featured_media) heroImage = media.find(asset => asset.id === item.featured_media)?.source_url;
  if (route === '/') heroImage = `${origin}/wp-content/uploads/2020/04/law-firm-18.jpg`;
  const hero = {
    title: title === 'Home' ? 'The Law Offices of B. Scott Winkler' : title,
    eyebrow: plain(header.find('.et_pb_fullwidth_header_subhead').text()) || (item.type === 'post' ? 'Scott Winkler Blog' : 'The Shafter Lawyer'),
    description: plain(header.find('.et_pb_header_content_wrapper').html()),
    ...(localAsset(heroImage || '') ? { image: localAsset(heroImage) } : {}),
  };
  const blocks = [];
  const seen = new Set();
  const seenParagraphs = new Set();
  const push = block => {
    if (block.type === 'html') {
      const fragment = load(block.html, null, false);
      fragment('p').each((_, paragraph) => {
        const normalizedText = plain(fragment(paragraph).text()).toLowerCase();
        if (!normalizedText || normalizedText.length < 30) return;
        if (seenParagraphs.has(normalizedText)) fragment(paragraph).remove();
        else seenParagraphs.add(normalizedText);
      });
      block.html = fragment.html();
      if (/lorem ipsum dolor sit amet/i.test(plain(block.html))) {
        notes.push(`${route}: omitted the original builder's Lorem ipsum placeholder paragraph.`);
        return;
      }
      if (route === '/faqs/' && /^Business Consulting Market Research Mergers & Acquisitions$/i.test(plain(block.html))) {
        notes.push(`${route}: omitted unrelated business-consulting template navigation left by the original builder.`);
        return;
      }
    }
    const identity = block.type === 'image' ? `image:${block.src}` : `${block.type}:${plain(block.html).toLowerCase()}:${block.title || ''}`;
    if (seen.has(identity)) return;
    if (block.type !== 'image' && !plain(block.html) && !block.html.includes('<iframe') && !block.html.includes('<img')) return;
    seen.add(identity); blocks.push(block);
  };
  if (item.type === 'post') {
    const body = container.clone();
    body.find('.sharedaddy,.jp-relatedposts').remove();
    push({ type: 'html', html: sanitize(body.html()) });
  } else {
    const sections = container.find('.et_builder_inner_content').first().children('.et_pb_section');
    sections.each((_, section) => {
      const node = $(section);
      const sectionText = plain(node.text());
      if (/^Navigation\s+Home\s+Our Firm/.test(sectionText)) return;
      if (node.find('.et_pb_fullwidth_header').length) return;
      node.find('.et_pb_contact_form_container,.et_pb_blog_grid,.et_pb_blog').remove();
      const modules = node.find(moduleSelector).filter((_, element) => !$(element).parentsUntil(section).filter(moduleSelector).length);
      modules.each((_, element) => {
        const contentModule = $(element);
        if (contentModule.hasClass('et_pb_toggle')) {
          push({ type: 'faq', title: plain(contentModule.find('.et_pb_toggle_title').text()).replace(/Goes Here$/, ''), html: sanitize(contentModule.find('.et_pb_toggle_content').html()) });
        } else if (contentModule.hasClass('et_pb_image') || contentModule.hasClass('et_pb_gallery')) {
          contentModule.find('img').each((_, imageElement) => {
            const image = $(imageElement);
            const src = localAsset(image.attr('src') || '');
            if (src) push({ type: 'image', src, alt: image.attr('alt') || plain(image.attr('title')) || '', ...(image.attr('width') ? { width: Number(image.attr('width')) } : {}), ...(image.attr('height') ? { height: Number(image.attr('height')) } : {}) });
          });
        } else if (contentModule.hasClass('et_pb_number_counter')) {
          const number = contentModule.attr('data-number-value');
          push({ type: 'html', html: `<p><strong>${escape(number || '')}${contentModule.find('.percent-sign').text() === '%' ? '%' : ''}</strong> ${escape(plain(contentModule.find('h3').text()))}</p>` });
        } else {
          const html = sanitize(contentModule.html());
          push({ type: 'html', html });
        }
      });
      // This graphic is a CSS background in the original builder rather than an img.
      if (/View Our Case Stages/.test(sectionText) && !node.find('img[src*="Case-Stages"]').length) push({ type: 'image', src: localAsset(`${origin}/wp-content/uploads/2017/06/Case-Stages-Winkler-Edition.png`), alt: 'The stages of a criminal case, from arrest through trial and appeal' });
    });
    if (!sections.length) push({ type: 'html', html: sanitize(container.html()) });
  }
  if (route === '/vehicle-accidents/' || route === '/vehicle-accidents-dev/') {
    for (const block of blocks) if (block.type === 'html' && /Restraining Order Lawyer Shafter CA/.test(block.html)) {
      block.html = block.html.replaceAll('Restraining Order Lawyer Shafter CA', 'Vehicle Accident Lawyer Shafter CA');
      notes.push(`${route}: corrected copied service heading from “Restraining Order” to “Vehicle Accident”; original archived in migration/source.`);
    }
  }
  return {
    id: item.id, path: route, title, type: item.type,
    modified: `${item.modified_gmt}Z`, date: `${item.date_gmt}Z`, sourceUrl: item.link,
    metaTitle: $('title').text().trim(), metaDescription: $('meta[name="description"]').attr('content') || '',
    hero, blocks, ...(item.type === 'post' ? { categories: item.categories, excerpt: plain(item.excerpt.rendered) } : {}),
  };
});

for (const category of categories.filter(item => item.count > 0)) {
  const categoryPosts = content.filter(item => item.type === 'post' && item.categories.includes(category.id));
  content.push({ id: -category.id, path: new URL(category.link).pathname, title: category.name, type: 'archive', modified: categoryPosts.map(item => item.modified).sort().at(-1), sourceUrl: category.link,
    metaTitle: `${category.name} | The Shafter Lawyer`, metaDescription: `Read ${category.name} articles from B. Scott Winkler, The Shafter Lawyer in Shafter, California.`,
    hero: { title: category.name, eyebrow: 'The Shafter Lawyer Blog', description: plain(category.description) },
    blocks: [], postIds: categoryPosts.map(item => item.id),
  });
}

// WordPress linked these archives from the blog sidebar. Preserve their URLs too.
const linkedArchives = new Set();
for (const html of htmlById.values()) {
  const $ = load(html);
  $('a[href]').each((_, element) => {
    try {
      const url = new URL($(element).attr('href'), origin);
      if (url.origin === origin && /^\/(?:\d{4}\/\d{2}|author\/[^/]+)\/$/.test(url.pathname)) linkedArchives.add(url.pathname);
    } catch { /* invalid hyperlink */ }
  });
}
let archiveId = -1000;
for (const route of [...linkedArchives].sort()) {
  await cached(`archive-${route.slice(1, -1).replaceAll('/', '-')}.html`, `${origin}${route}`);
  const isAuthor = route.startsWith('/author/');
  const month = isAuthor ? undefined : route.slice(1, 8).replace('/', '-');
  const archivePosts = content.filter(item => item.type === 'post' && (isAuthor || item.date.startsWith(month)));
  const title = isAuthor ? 'Articles by The Shafter Lawyer' : new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  content.push({ id: archiveId--, path: route, title, type: 'archive', modified: archivePosts.map(item => item.modified).sort().at(-1), sourceUrl: `${origin}${route}`,
    metaTitle: `${title} | The Shafter Lawyer`, metaDescription: `Browse ${isAuthor ? 'articles by B. Scott Winkler' : `${title} articles`} on criminal defense, family law and life in Kern County.`,
    hero: { title, eyebrow: 'The Shafter Lawyer Blog', description: '' }, blocks: [], postIds: archivePosts.map(item => item.id),
  });
}

const assets = {};
for (const [alias, canonical] of assetAliases) assets[alias] = canonicalAssets.get(canonical)?.src;
for (const html of htmlById.values()) {
  const $ = load(html);
  $('img').each((_, image) => { const src = $(image).attr('src'); if (localAsset(src || '')) assets[src] = localAsset(src); });
}
await Promise.all([
  fs.writeFile('src/data/site-content.json', JSON.stringify(content, null, 2) + '\n'),
  fs.writeFile('src/data/assets.json', JSON.stringify(assets, null, 2) + '\n'),
  fs.writeFile('src/data/media.json', JSON.stringify([...canonicalAssets.values()], null, 2) + '\n'),
  fs.writeFile('src/data/categories.json', JSON.stringify(categories.map(({ id, name, slug, link, count }) => ({ id, name, slug, path: new URL(link).pathname, count })), null, 2) + '\n'),
  fs.writeFile('migration/inventory.json', JSON.stringify({ source: origin, fetchedAt: new Date().toISOString(), pages: pages.length, posts: posts.length, categoryArchives: categories.filter(item => item.count > 0).length, otherArchives: linkedArchives.size, images: canonicalAssets.size, assetFailures: failures, routes: content.map(({ id, path, title, type, blocks }) => ({ id, path, title, type, blocks: blocks.length })), notes }, null, 2) + '\n'),
]);
console.log(`Migrated ${pages.length} pages, ${posts.length} posts, ${categories.length + linkedArchives.size} archives and ${canonicalAssets.size} images.`);
console.log(content.map(item => `${item.path}: ${item.blocks.length} blocks`).join('\n'));
if (failures.length) process.exitCode = 1;
