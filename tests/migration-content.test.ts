import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import pages from '../src/data/design-pages.json';
import routes from '../migration/routes.json';
type Node=string|{tag:string;attrs?:Record<string,string>;children?:Node[]};
const root=process.cwd();
test('every captured published route is implemented once',()=>{const paths=pages.map(p=>p.route);assert.equal(new Set(paths).size,paths.length);for(const r of routes)assert.ok(paths.includes(r.route));for(const filename of ['pages.json','posts.json'])for(const p of JSON.parse(fs.readFileSync(path.join(root,'migration/audit-2026-10-27',filename),'utf8')))assert.ok(paths.includes(new URL(p.link).pathname))});
test('page images, downloads, and styles are local and exist',()=>{
 const walk=(node:Node)=>{if(typeof node==='string')return;assert.ok(!['script','object','embed'].includes(node.tag));for(const key of ['src','poster','href']){const v:string|undefined=node.attrs?.[key];if(!v)continue;assert.ok(!/https?:\/\/.*(?:wp-content|wp-includes|i\d\.wp\.com)/.test(v),v);if(v.startsWith('/assets/'))assert.ok(fs.existsSync(path.join(root,'public',v)),v)}node.children?.forEach(walk)};
 for(const page of pages){walk(page.tree as Node);assert.ok(fs.existsSync(path.join(root,'public',page.css)));const css=fs.readFileSync(path.join(root,'public',page.css),'utf8');for(const m of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)){assert.ok(!/^https?:/.test(m[1]),m[1]);if(m[1].startsWith('/assets/'))assert.ok(fs.existsSync(path.join(root,'public',new URL(m[1],'http://local').pathname)),m[1]);}}
});
test('environment examples never contain credentials and environment files are ignored',()=>{const template=fs.readFileSync('.env.example','utf8');for(const key of ['SMTP_API','SMTP_CHANNEL','TURNSTILE_SECRET_KEY'])assert.match(template,new RegExp('^'+key+'=$','m'));assert.match(fs.readFileSync('.gitignore','utf8'),/\.env/)});
