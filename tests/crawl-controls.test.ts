import test from 'node:test';
import assert from 'node:assert/strict';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import site from '../src/data/site.json';
import sourceJson from '../src/data/source-sitemap.json';

const source:Record<string,{url:string;lastModified?:string}>=sourceJson;
const excluded=new Set(['/our-services-dev/','/vehicle-accidents-dev/','/development/']);
test('sitemap preserves every indexable URL from the original sitemap and its modification date',()=>{
  const entries=sitemap(),byPath=new Map(entries.map(e=>[new URL(e.url).pathname,e]));
  for(const [route,original] of Object.entries(source)){
    if(excluded.has(route)){assert.ok(!byPath.has(route));continue;}
    const entry=byPath.get(route);assert.ok(entry,'Missing original URL: '+route);
    assert.equal(entry.url,site.origin+route);
    if(original.lastModified)assert.equal(Date.parse(String(entry.lastModified)),Date.parse(original.lastModified));
  }
  assert.equal(new Set(entries.map(e=>e.url)).size,entries.length);
  assert.ok(entries.every(e=>e.url.startsWith(site.origin+'/')));
});
test('production robots preserves source exclusions and advertises the working HTTPS sitemap',()=>{
  const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV='production';
  try{
    const result=robots();assert.equal(result.sitemap,site.origin+'/sitemap.xml');
    assert.ok(!Array.isArray(result.rules));
    const rules=result.rules as {allow?:string;disallow?:string[]};
    assert.equal(rules.allow,'/');assert.ok(rules.disallow?.includes('/wp-admin/'));assert.ok(rules.disallow?.includes('/api/'));
    if(site.name==='The Shafter Lawyer'){assert.ok(rules.disallow?.includes('/search/'));assert.ok(rules.disallow?.includes('/*?s=*'));}
    if(site.name==='Foundation Properties Inc')assert.ok(rules.disallow?.includes('/category/'));
  }finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});
test('preview robots blocks crawling and omits the production sitemap',()=>{
  const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
  try{assert.deepEqual(robots().rules,{userAgent:'*',disallow:'/'});assert.equal(robots().sitemap,undefined);}
  finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous;}
});
