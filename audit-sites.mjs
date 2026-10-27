import fs from 'node:fs/promises';
import path from 'node:path';
import {load} from './node_modules/cheerio/dist/esm/index.js';
import {chromium} from './node_modules/@playwright/test/index.mjs';
const names=process.argv.slice(2).length?process.argv.slice(2):['ruesga','foundation','shafter-lawyer'];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
for(const name of names){
 const root=path.resolve('..',name),dir=path.join(root,'migration/audit-2026-10-27');
 const records=[...JSON.parse(await fs.readFile(path.join(dir,'pages.json'))),...JSON.parse(await fs.readFile(path.join(dir,'posts.json')))];
 const urls=new Set(records.map(p=>p.link));
 const origin=new URL(records[0].link).origin;
 const maps=[origin+(name==='foundation'?'/page-sitemap.xml':'/wp-sitemap-posts-page-1.xml')];
 for(const url of maps){try{const txt=await(await fetch(url)).text();await fs.writeFile(path.join(dir,new URL(url).pathname.slice(1)),txt);const $=load(txt,{xml:true});$('loc').each((i,e)=>{let u=$(e).text();if(!/\.(jpg|png|webp|jpeg)$/i.test(u))urls.add(u)});}catch(e){console.log('SITEMAP ERROR',name,e.message)}}
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const inventory=[];
 for(const url of urls){
  const slug=new URL(url).pathname;const file=slug==='/'?'home':slug.slice(1).replaceAll('/','_').replace(/_$/,'');
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(1000);await page.evaluate(async()=>{await document.fonts.ready;for(const img of document.images)if(img.loading==='lazy')img.loading='eager';});
   const html=await page.content();await fs.writeFile(path.join(dir,file+'.html'),html);
   const details=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,bodyClass:document.body.className,headings:[...document.querySelectorAll('h1,h2,h3,h4')].map(e=>({tag:e.tagName,text:e.textContent.trim()})),links:[...document.querySelectorAll('a[href]')].map(e=>({text:e.textContent.trim(),href:e.href})),forms:[...document.querySelectorAll('form')].map(f=>({action:f.action,fields:[...f.querySelectorAll('input,textarea,select')].map(e=>({type:e.type,name:e.name,placeholder:e.placeholder,required:e.required}))})),images:[...document.images].map(i=>({src:i.currentSrc||i.src,alt:i.alt,width:i.naturalWidth,height:i.naturalHeight})),iframes:[...document.querySelectorAll('iframe')].map(e=>e.src),text:document.body.innerText}));
   inventory.push({url,route:slug,file,...details});
   for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});await page.waitForTimeout(250);await page.screenshot({path:path.join(dir,file+'-'+width+'.png'),fullPage:true,timeout:60000})}
   await page.setViewportSize({width:1440,height:1000});
   console.log(name,slug,details.title,'forms',details.forms.length);
  }catch(e){inventory.push({url,route:slug,error:e.message});console.log(name,slug,'ERROR',e.message)}
 }
 await fs.writeFile(path.join(dir,'browser-inventory.json'),JSON.stringify(inventory,null,2));await page.close();
}
await browser.close();
