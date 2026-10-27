'use client';
import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
export type FormDefinition={variant:string;className:string;button:string;fields:{name:string;label:string;type:string;className:string;wrapperClass:string;required:boolean}[]};
type TurnstileApi={render:(container:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
declare global {interface Window {turnstile?:TurnstileApi}}
let loading:Promise<void>|undefined;
function loadWidget(){
  if(window.turnstile)return Promise.resolve();
  if(!loading)loading=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.onload=()=>resolve();script.onerror=()=>{loading=undefined;script.remove();reject(new Error('Verification unavailable'))};document.head.append(script)});
  return loading;
}
export function MigrationContactForm({definition}:{definition:FormDefinition}){
 const id=useId(),widget=useRef<HTMLDivElement>(null),widgetId=useRef<string|undefined>(undefined),submitting=useRef(false);
 const [token,setToken]=useState(''),[pending,setPending]=useState(false),[status,setStatus]=useState(''),[verificationError,setVerificationError]=useState(''),[ok,setOk]=useState(false),[retry,setRetry]=useState(0);
 const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 useEffect(()=>{
  if(!key||!widget.current)return;
  let disposed=false;
  loadWidget().then(()=>{if(disposed||!widget.current)return;widgetId.current=window.turnstile?.render(widget.current,{sitekey:key,action:'contact',theme:'light',size:'flexible',callback:(t:string)=>{setToken(t);setVerificationError('')},'expired-callback':()=>setToken(''),'error-callback':()=>{setToken('');setVerificationError('Verification could not load. Please retry verification.')}})}).catch(()=>{if(!disposed)setVerificationError('Verification could not load. Please retry verification.')});
  return()=>{disposed=true;if(widgetId.current)window.turnstile?.remove(widgetId.current)};
 },[key,retry]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(submitting.current)return;setOk(false);
  if(!token){setStatus('Please complete the security verification before sending.');return}
  const form=event.currentTarget,fields=new FormData(form);
  const input=Object.fromEntries(fields.entries());
  if(definition.variant==='split')input.name=`${input.firstName||''} ${input.lastName||''}`.trim();
  submitting.current=true;setPending(true);setStatus('Sending your message…');
  try{
   const res=await fetch('/api/contact/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,kind:definition.variant==='newsletter'?'inquiry':definition.variant==='split'?'split':'contact',token,page:window.location.pathname}),signal:AbortSignal.timeout(30000)});
   const result=await res.json();setStatus(result.message||'Your message could not be sent. Please try again.');
   if(res.ok&&result.success){setOk(true);form.reset()}
  }catch{setStatus('We could not confirm delivery. Please try again or use the published contact details.')}
  finally{submitting.current=false;setPending(false);setToken('');if(widgetId.current)window.turnstile?.reset(widgetId.current)}
 }
 return <form className={`${definition.className} native-contact ${definition.variant}`} onSubmit={submit} aria-busy={pending}>
  {definition.fields.map((field,i)=><p className={field.wrapperClass} key={`${field.name}-${i}`}>
   <label className={definition.variant==='split'?'':'sr-only'} htmlFor={`${id}-${i}`}>{field.label}{field.required?' *':''}</label>
   {field.type==='textarea'?<textarea className={field.className} id={`${id}-${i}`} name={field.name} placeholder={field.label} required={field.required} minLength={field.required?10:undefined} maxLength={5000} rows={5} disabled={pending}/>:<input className={field.className} id={`${id}-${i}`} name={field.name} placeholder={definition.variant==='split'?undefined:field.label} type={field.type} required={field.required} maxLength={field.name==='email'?254:100} autoComplete={field.name==='email'?'email':field.name==='phone'?'tel':field.name==='firstName'?'given-name':field.name==='lastName'?'family-name':'name'} disabled={pending}/>}
  </p>)}
  <div className="contact-trap" aria-hidden="true"><label htmlFor={`${id}-website`}>Leave empty</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off"/></div>
  <div className="verification-area"><div ref={widget}/>{!key&&<p>Online messages are currently unavailable. Please use the published contact details.</p>}{verificationError&&!ok&&!pending&&<p className="native-form-status" role="alert">{verificationError}</p>}</div>
  <div className="et_contact_bottom_container"><button type="submit" className="et_pb_contact_submit et_pb_button" disabled={pending||!key}>{pending?'Sending…':definition.button}</button></div>
  <p className="native-form-status" role="status" aria-live="polite" data-success={ok}>{status}</p>
  {(status.includes('verification')||(verificationError&&!ok&&!pending))&&key&&<button className="verification-retry" type="button" onClick={()=>{setStatus('');setVerificationError('');setRetry(x=>x+1)}}>Retry verification</button>}
  <noscript>Enable JavaScript to send a message, or use the published contact details.</noscript>
 </form>
}
