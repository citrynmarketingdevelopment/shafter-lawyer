import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {contactHandler} from '../src/lib/secure-contact';
import site from '../src/data/site.json';

// Explicitly invoked mail test only. The deployed endpoint has no test bypass.
// Cloudflare is simulated here because the matching public widget key is absent.
async function main(){
  process.loadEnvFile('.env.local');
  const report:{[key:string]:unknown}={
    checkedAt:new Date().toISOString(),site:site.name,
    to:process.env.CONTACT_TO||site.email,cc:process.env.CONTACT_CC||'citryn.contactforms@gmail.com',
    transport:'Actual SMTP.com HTTPS API through the application contact handler',
    turnstile:'Simulated within this local test harness only; live browser verification remains pending the public site key',
    inboxReceipt:'Not verified',
  };
  const transport:typeof fetch=async(input,options)=>{
    const url=String(input);
    if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){
      return Response.json({success:true,hostname:new URL(site.origin).hostname,action:'contact'});
    }
    assert.equal(url,'https://api.smtp.com/v4/messages');
    const message=JSON.parse(String(options?.body));
    assert.equal(message.recipients.to[0].address,report.to);
    assert.ok(message.recipients.cc.some((r:{address:string})=>r.address===report.cc));
    assert.equal(message.originator.reply_to.address,'citryn.contactforms@gmail.com');
    message.subject='[TEST] '+message.subject;
    message.body.parts[0].content='AUTHORIZED MIGRATION VERIFICATION TEST — no business inquiry; no action required.\n\n'+message.body.parts[0].content;
    const response=await fetch(input,{...options,body:JSON.stringify(message)});
    report.smtpHttpStatus=response.status;
    return response;
  };
  const request=new Request(site.origin+'/api/contact/',{
    method:'POST',headers:{Origin:site.origin,'Content-Type':'application/json'},
    body:JSON.stringify({name:'TEST — Citryn contact form verification',email:'citryn.contactforms@gmail.com',message:'Authorized test of this website’s server-side contact form. Verify delivery to the original business recipient and the additional Citryn mailbox. This is not a customer inquiry.',token:'local-harness-only',page:'/contact-us/',kind:'contact'}),
  });
  const result=await contactHandler(site,process.env,transport)(request);
  const body=await result.json();
  report.handlerStatus=result.status;report.providerAccepted=result.ok&&body.success===true;
  await fs.writeFile('migration/contact-copy-delivery-test.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  if(!report.providerAccepted)process.exitCode=1;
}
main().catch(()=>{console.error('Contact delivery test failed. No private configuration was logged.');process.exitCode=1});
