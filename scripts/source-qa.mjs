import fs from 'node:fs/promises';import path from 'node:path';import {chromium} from '@playwright/test';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for(const name of ['ruesga','foundation','shafter-lawyer']){
 const root=path.resolve('D:/Projects',name),pages=JSON.parse(await fs.readFile(path.join(root,'src/data/design-pages.json'))),site=JSON.parse(await fs.readFile(path.join(root,'src/data/site.json'))),out=path.join(root,'migration/reference');await fs.mkdir(out,{recursive:true});
 const report=[];
 for(const item of pages){
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  try{await p.goto(site.origin+item.route,{waitUntil:'domcontentloaded',timeout:45000});await p.waitForTimeout(500);await p.evaluate(()=>document.fonts.ready);
   // Capture the completed design state, independent of scroll-triggered animation timing.
   await p.addStyleTag({content:'.et_animated,.et-waypoint{opacity:1!important;visibility:visible!important;animation:none!important;transform:none!important}'});
   for(const w of [1440,768,390]){await p.setViewportSize({width:w,height:1000});await p.evaluate(()=>{for(const i of document.images)i.loading='eager';window.scrollTo({top:0,behavior:'instant'})});await p.waitForTimeout(450);await p.screenshot({path:path.join(out,(item.route==='/'?'home':item.route.slice(1).replaceAll('/','_'))+'-'+w+'.png'),fullPage:true,animations:'disabled'})}
   report.push({route:item.route,status:'captured'});console.log(name,item.route,'reference captured');
  }catch(e){report.push({route:item.route,error:e.message});console.log(name,item.route,'ERROR')}
  await p.close();
 }
 await fs.writeFile(path.join(root,'migration/reference-captures.json'),JSON.stringify(report,null,2));
}
await b.close();
