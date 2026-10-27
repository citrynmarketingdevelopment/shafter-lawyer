import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
for(const [name,port,origin] of [['ruesga',3102,'https://ruesgafarms.com'],['foundation',3103,'https://foundationpropertiesinc.com'],['shafter-lawyer',3101,'https://theshafterlawyer.com']]){
 for(const target of ['source','local']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto(target==='source'?origin:`http://localhost:${port}`,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(1300);await page.evaluate(()=>document.fonts.ready);for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=650){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(180)}await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(800);await page.screenshot({path:`../${name}/migration/${target}-home-desktop.png`,fullPage:true});console.log(name,target,JSON.stringify(await page.evaluate(()=>({height:document.body.scrollHeight,images:[...document.images].filter(i=>getComputedStyle(i).display!=='none'&&i.getBoundingClientRect().width>0&&!i.naturalWidth).map(i=>i.src),h1:[...document.querySelectorAll('h1')].map(e=>e.textContent)}))),errors);}catch(e){console.log(name,target,e.message)}await page.close();
 }
}
await browser.close();
