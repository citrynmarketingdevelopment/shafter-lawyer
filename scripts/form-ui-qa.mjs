// Local-only UI verification. Provider requests are mocked; no message is sent.
import fs from 'node:fs/promises';import {chromium,expect} from '@playwright/test';
const sites=[['shafter-lawyer',3101,'/contact-us/'],['ruesga',3102,'/contact-us/'],['foundation',3103,'/contact-us/']];
const saved=new Map();
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 for(const [name] of sites){const file=`D:/Projects/${name}/.env.local`;const env=await fs.readFile(file,'utf8');saved.set(file,env);await fs.writeFile(file,env.replace(/^NEXT_PUBLIC_TURNSTILE_SITE_KEY=.*$/m,'NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA'))}
 await new Promise(resolve=>setTimeout(resolve,2500));
 for(const [name,port,route] of sites){
  const page=await browser.newPage({viewport:{width:1280,height:900}}),report={site:name,transport:'Mocked, no email sent',checks:[],errors:[]};
  await page.addInitScript(()=>{const widgets=new Map();window.turnstile={render:(el,opts)=>{el.textContent='Verified (automated UI test)';const id=String(widgets.size);widgets.set(id,opts);setTimeout(()=>opts.callback('browser-test-token'),50);return id},reset:id=>{setTimeout(()=>widgets.get(id)?.callback('browser-test-token'),60)},remove:id=>widgets.delete(id)}});
  let requests=0;
  await page.route('**/api/contact/',async route=>{requests++;const body=route.request().postDataJSON();if(body.token!=='browser-test-token')report.errors.push('Token missing');await new Promise(resolve=>setTimeout(resolve,350));await route.fulfill({status:requests%2?502:200,contentType:'application/json',body:JSON.stringify(requests%2?{success:false,message:'Test delivery error. Please try again.'}:{success:true,message:'Thank you. Your message has been sent.'})})});
  for(const routePath of name==='foundation'?[route,'/real-estate-services/']:[route]){
   await page.goto(`http://localhost:${port}${routePath}`,{waitUntil:'networkidle',timeout:60000});
   const forms=page.locator('form.native-contact:visible');const count=await forms.count();
   for(let i=0;i<count;i++){
    const form=forms.nth(i);
    for(const field of await form.locator('input:not([name=website]),textarea').all()){
     const type=await field.getAttribute('type'),name=await field.getAttribute('name');await field.fill(type==='email'?'migration-test@example.org':type==='tel'?'6615550100':name==='message'?'Automated UI verification only; this is never delivered.':name==='lastName'?'Tester':'Migration Tester');
    }
    const button=form.locator('button[type=submit]');await expect(button).toBeEnabled();await button.click();await expect(button).toBeDisabled();await expect(form.getByRole('status')).toContainText('Test delivery error');await expect(button).toBeEnabled();await page.waitForTimeout(100);await button.click();await expect(form.getByRole('status')).toContainText('Thank you');await expect(form.locator('input[type=email]')).toHaveValue('');report.checks.push({route:routePath,form:i,loading:true,error:true,retry:true,success:true,reset:true});
   }
  }
  await fs.writeFile(`D:/Projects/${name}/migration/form-ui-qa.json`,JSON.stringify(report,null,2));console.log(name,report.checks.length,'form variants passed');await page.close();
 }
}finally{for(const [file,env] of saved)await fs.writeFile(file,env);await browser.close()}
