import fs from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';

const base=process.argv[2]||'http://localhost:3000';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('This mocked regression test is restricted to local development.');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const page=await browser.newPage();let submissions=0;
  await page.addInitScript(()=>{
    const widgets=new Map();
    window.turnstile={
      render:(el,options)=>{const id=String(widgets.size);widgets.set(id,options);el.textContent='Verified (regression fixture)';setTimeout(()=>options.callback('fixture-token'),20);return id},
      reset:id=>widgets.get(id)?.['error-callback']('300030'),
      remove:id=>widgets.delete(id),
    };
  });
  await page.route('**/api/contact/',async route=>{submissions++;expect(route.request().postDataJSON().token).toBe('fixture-token');await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,message:'Thank you. Your message has been sent.'})})});
  await page.goto(base+'/contact-us/',{waitUntil:'networkidle'});
  const form=page.locator('form.native-contact').first();
  const fill=async()=>{await form.locator('input[name=name]').fill('Regression test');await form.locator('input[name=email]').fill('fixture@example.org');await form.locator('textarea[name=message]').fill('Local mocked regression test; no email is delivered.')};
  await fill();await page.waitForTimeout(50);await form.locator('button[type=submit]').click();
  await expect(form.getByRole('status')).toHaveText('Thank you. Your message has been sent.');
  await expect(form.getByRole('status')).toHaveAttribute('data-success','true');
  await expect(form.getByRole('button',{name:'Retry verification'})).toHaveCount(0);
  await fill();await form.locator('button[type=submit]').click();
  await expect(form.getByRole('status')).toContainText('Please complete the security verification');
  await expect(form.getByRole('status')).toHaveAttribute('data-success','false');
  await form.getByRole('button',{name:'Retry verification'}).click();await page.waitForTimeout(50);
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('status')).toHaveText('Thank you. Your message has been sent.');
  await expect(form.getByRole('button',{name:'Retry verification'})).toHaveCount(0);
  expect(submissions).toBe(2);
  const report={checkedAt:new Date().toISOString(),transport:'Mocked local browser test; no email delivered',verificationRefreshError:'300030',successConfirmationPreserved:true,newSubmissionShowsVerificationError:true,retryAllowsAnotherSubmission:true};
  await fs.writeFile('migration/verification-refresh-test.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close()}
