import {createHash} from 'node:crypto';
import {z} from 'zod';
import {readContactJson,ContactRequestError,isAllowedContactOrigin} from './contact';

type Env=Record<string,string|undefined>;
const line=z.string().trim().max(100).refine(x=>!/[\r\n\0]/.test(x));
export const submissionSchema=z.object({
 kind:z.enum(['contact','inquiry','split']).default('contact'),name:line.optional().default(''),email:z.email().max(254),phone:line.optional().default(''),message:z.string().trim().max(5000).optional().default(''),website:z.string().max(200).optional().default(''),token:z.string().min(1).max(2048),page:z.string().max(300).regex(/^\/(?!\/)/).default('/'),
}).superRefine((v,ctx)=>{if(v.kind!=='inquiry'&&(v.name.length<2||(v.kind==='contact'&&v.message.length<10)))ctx.addIssue({code:'custom',message:'Enter your name and a message of at least 10 characters.'})});
const attempts=new Map<string,{count:number;until:number}>();
function limit(key:string){const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);if(attempts.size>5000)return false;const current=attempts.get(key);if(current&&current.until>now){current.count++;return current.count<=5}attempts.set(key,{count:1,until:now+600000});return true}
function response(success:boolean,message:string,status:number){return Response.json({success,message},{status,headers:{'Cache-Control':'no-store'}})}
function allowedOrigins(env:Env){return (env.CONTACT_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)}
export function contactHandler(site:{name:string;origin:string;email:string},env:Env=process.env,fetcher:typeof fetch=fetch){
 return async(request:Request)=>{
  const origin=request.headers.get('origin')||'';
  if(!isAllowedContactOrigin(request,{...env,NEXT_PUBLIC_SITE_URL:env.NEXT_PUBLIC_SITE_URL||site.origin})&&!allowedOrigins(env).includes(origin))return response(false,'Please submit this form from our website.',403);
  if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return response(false,'Please submit a valid contact form.',415);
  let input:unknown;try{input=await readContactJson(request)}catch(e){return response(false,'Please submit a valid contact form.',e instanceof ContactRequestError?e.status:400)}
  const parsed=submissionSchema.safeParse(input);
  if(!parsed.success||parsed.data.website)return response(false,'Please enter valid contact details, your message, and complete the security verification.',400);
  const data=parsed.data;
  if(data.kind==='inquiry'&&site.name!=='Foundation Properties Inc')return response(false,'Please include your name and message.',400);
  const recipient=env.CONTACT_TO||site.email,copyRecipient=env.CONTACT_CC?.trim()||'citryn.contactforms@gmail.com',from=env.SMTP_FROM||'contactforms@citryn.com';
  if(!env.TURNSTILE_SECRET_KEY||!env.SMTP_API||!env.SMTP_CHANNEL||!z.email().safeParse(recipient).success||!z.email().safeParse(copyRecipient).success||!z.email().safeParse(from).success)return response(false,'Online messages are currently unavailable. Please use the published contact details.',503);
  const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const rateKey=createHash('sha256').update(ip==='unknown'?data.email.toLowerCase():ip).digest('hex');
  if(!limit(rateKey))return response(false,'Please wait a few minutes before trying again.',429);
  try{
   const verification=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.token,...(ip!=='unknown'?{remoteip:ip}:{})}),signal:AbortSignal.timeout(8000)});
   if(!verification.ok)return response(false,'Security verification is unavailable. Please try again.',502);
   const result=await verification.json() as {success?:boolean;hostname?:string;action?:string};
   const hostnames=[env.NEXT_PUBLIC_SITE_URL||site.origin,env.VERCEL_URL?`https://${env.VERCEL_URL}`:'',env.VERCEL_PROJECT_PRODUCTION_URL?`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`:'',...allowedOrigins(env)].filter(Boolean).map(s=>new URL(s).hostname);
   if(env.NODE_ENV!=='production')hostnames.push('localhost','127.0.0.1');
   if(!result.success||result.action!=='contact'||!result.hostname||!hostnames.includes(result.hostname))return response(false,'Security verification failed or expired. Please complete it again.',400);
   const text=[`New ${site.name} website ${data.kind==='inquiry'?'real estate inquiry':'contact request'}`,'',`Name: ${data.name||'Not provided (email inquiry)'}`,`Email: ${data.email}`,`Phone: ${data.phone||'Not provided'}`,`Page: ${data.page}`,'','Message:',data.message||(data.kind==='inquiry'?'Please contact me about real estate services.':'No message provided.')].join('\n');
   const sent=await fetcher('https://api.smtp.com/v4/messages',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','X-SMTPCOM-API':env.SMTP_API},body:JSON.stringify({channel:env.SMTP_CHANNEL,recipients:{to:[{address:recipient}],...(copyRecipient.toLowerCase()!==recipient.toLowerCase()?{cc:[{address:copyRecipient}]}:{})},originator:{from:{name:site.name,address:from},reply_to:{address:data.email}},subject:`${site.name}: website ${data.kind==='inquiry'?'inquiry':'contact request'}`,body:{parts:[{type:'text/plain',charset:'UTF-8',content:text}]}}),signal:AbortSignal.timeout(15000)});
   if(!sent.ok)return response(false,'Your message could not be sent. Please try again or use the published contact details.',502);
   const mail=await sent.json() as {status?:string;data?:{msg_id?:string;message?:string}};
   if(mail.status!=='success'||!(mail.data?.msg_id||/^accepted,\s*msg_id:\s*[a-zA-Z0-9._-]+\s*$/i.test(mail.data?.message||'')))return response(false,'Your message could not be sent. Please try again.',502);
   return response(true,'Thank you. Your message has been sent.',200);
  }catch{return response(false,'Your message could not be sent. Please try again or use the published contact details.',502)}
 };
}
