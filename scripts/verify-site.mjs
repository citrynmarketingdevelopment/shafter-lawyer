import fs from 'node:fs/promises';import path from 'node:path';import {chromium} from '@playwright/test';
const sites=[['shafter-lawyer',3000]];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
for(const [name,port] of sites){
 const root=process.cwd(),pages=JSON.parse(await fs.readFile(path.join(root,'src/data/design-pages.json'))),origin=process.env.TEST_BASE_URL||`http://localhost:${port}`,output=path.join(root,'migration/qa');await fs.mkdir(output,{recursive:true});
 const report={site:name,time:new Date().toISOString(),routes:[],errors:[],externalResources:[],screenshots:[],links:[],forms:[],navigation:[]};
 const hrefs=new Set(),external=new Set();
 for(const pageData of pages){
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/ERR_BLOCKED|youtube|google|favicon/.test(m.text()))errors.push(m.text().slice(0,500))});
  page.on('request',r=>{if(!r.url().startsWith(origin)&&/^http/.test(r.url()))external.add(r.url())});
  try{
   const res=await page.goto(origin+pageData.route,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(120);await page.evaluate(()=>document.fonts.ready);
   const seo=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name=description]')?.content,canonical:document.querySelector('link[rel=canonical]')?.href,h1:document.querySelectorAll('h1').length,structured:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>{try{return JSON.parse(e.textContent)}catch{return 'invalid'}}),links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))}));
   for(const href of seo.links)if(href?.startsWith('/')&&!href.startsWith('//'))hrefs.add(href.split('#')[0]);
   const routeResult={route:pageData.route,status:res.status(),title:seo.title,description:seo.description,canonical:seo.canonical,h1:seo.h1,widths:[]};
   if(res.status()!==200||!seo.title||!seo.description||!seo.canonical||!seo.h1||!seo.structured.length||seo.structured.includes('invalid'))report.errors.push({route:pageData.route,check:'page or SEO',seo});
   for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:1000});
    // Walk the page so native lazy images are decoded before the capture.
    for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=800){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(20)}
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(250);
    const layout=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,height:document.body.scrollHeight,broken:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&i.getBoundingClientRect().height>0&&getComputedStyle(i).visibility!=='hidden'&&!i.naturalWidth).map(i=>i.src),forms:[...document.forms].filter(f=>f.getBoundingClientRect().width>0).map(f=>[...f.querySelectorAll('input,textarea')].map(x=>({name:x.name,type:x.type,required:x.required})))}));
    routeResult.widths.push({width,height:layout.height,overflow:layout.scroll>layout.width+1,broken:layout.broken});
    if(layout.scroll>layout.width+1||layout.broken.length)report.errors.push({route:pageData.route,width,layout});
    const filename=(pageData.route==='/'?'home':pageData.route.slice(1).replaceAll('/','_'))+'-'+width+'.png';await page.screenshot({path:path.join(output,filename),fullPage:true});report.screenshots.push(filename);
   }
   if(pageData.route==='/'){
    const button=page.locator('.mobile_menu_bar:visible').first();if(await button.count()){await button.click();const opened=await button.getAttribute('aria-expanded')==='true';const mobileLinks=await page.locator('.mobile_nav.opened a:visible').count();await page.keyboard.press('Escape');report.navigation.push({mobileOpened:opened,mobileLinks,escapeClosed:await button.getAttribute('aria-expanded')==='false'});if(!opened||!mobileLinks)report.errors.push({check:'mobile navigation'})}
   }
   const slider=page.locator('.native-slider:visible').first();if(await slider.count()){const next=slider.getByRole('button',{name:'Next image'});if(await next.count()){await next.click();const active=await slider.locator('.et-pb-active-slide').count();if(!active)report.errors.push({route:pageData.route,check:'slider'});}}
   const toggle=page.locator('details:visible').first();if(await toggle.count()){await toggle.locator('summary').click();if(!await toggle.getAttribute('open')&&await toggle.getAttribute('open')!== '')report.errors.push({route:pageData.route,check:'accordion'});}
   if(errors.length)report.errors.push({route:pageData.route,check:'browser console',errors:[...new Set(errors)]});
   report.routes.push(routeResult);await fs.writeFile(path.join(root,'migration/browser-qa.json'),JSON.stringify(report,null,2));console.log(name,pageData.route,res.status(),errors.length+' console errors');
  }catch(e){report.errors.push({route:pageData.route,error:e.message});console.log(name,pageData.route,'ERROR',e.message.slice(0,150))}
  await page.close();
 }
 for(const href of hrefs){if(!href||href.startsWith('/assets/'))continue;const r=await fetch(origin+href,{redirect:'manual'});report.links.push({href,status:r.status});if(r.status>=400)report.errors.push({check:'internal link',href,status:r.status})}
 for(const route of ['/sitemap.xml','/robots.txt']){const r=await fetch(origin+route);if(r.status!==200)report.errors.push({check:route,status:r.status})}
 report.externalResources=[...external];if([...external].some(x=>/wp-content|wp-includes|i\d\.wp\.com|stats\.wp\.com/.test(x)))report.errors.push({check:'WordPress runtime dependency'});
 for(const body of [{name:'x',email:'invalid',message:'short',token:'fake'}, {name:'Tester',email:'tester@example.org',message:'Test validation only',token:''}]){const r=await fetch(origin+'/api/contact/',{method:'POST',headers:{'Content-Type':'application/json',Origin:JSON.parse(await fs.readFile(path.join(root,'src/data/site.json'))).origin},body:JSON.stringify(body)});report.forms.push({expected:400,status:r.status});if(r.status!==400)report.errors.push({check:'API validation',status:r.status})}
 await fs.writeFile(path.join(root,'migration/browser-qa.json'),JSON.stringify(report,null,2));console.log('QA',name,report.routes.length,'routes',report.errors.length,'issues');
}
await browser.close();
