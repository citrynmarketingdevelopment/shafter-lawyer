// Build-time importer. No WordPress code or network requests run in the application.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
import postcss from 'postcss';

const sites = {
  ruesga: {name:'Ruesga Farms',origin:'https://ruesgafarms.com',email:'jose@ruesgafarms.com',type:'Organization',description:'Family farming in San Vicente, Nayarit, Mexico. Discover Ruesga Farms watermelons, beans, stevia, farming operations and winter watermelon program.'},
  foundation: {name:'Foundation Properties Inc',origin:'https://foundationpropertiesinc.com',email:'kerngc@gmail.com',type:'GeneralContractor',phone:'+1-661-565-6358',address:'4208 Rosedale Hwy Ste 302-120',city:'Bakersfield',region:'CA',postal:'93308',description:'Foundation Properties Inc and Kern General Construction provide residential and commercial construction, remodeling and real estate services in Bakersfield, CA.'},
  'shafter-lawyer': {name:'The Shafter Lawyer',origin:'https://theshafterlawyer.com',email:'shafterlaw@gmail.com',type:'LegalService',phone:'+1-661-746-0235',address:'400 Central Valley Hwy',city:'Shafter',region:'CA',postal:'93263',description:'The Law Offices of B. Scott Winkler in Shafter, CA. Criminal defense, family law, civil litigation and personal injury representation.'}
};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,10);
async function pool(items,fn,n=8){let i=0;await Promise.all(Array.from({length:n},async()=>{while(i<items.length){const x=items[i++];await fn(x)}}))}
async function read(url){for(let n=0;n<3;n++){try{const r=await fetch(url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'}});if(!r.ok)throw Error('HTTP '+r.status);return Buffer.from(await r.arrayBuffer())}catch(e){if(n===2)throw e}}}
for(const name of process.argv.slice(2).length?process.argv.slice(2):Object.keys(sites)){
 const site=sites[name],root=path.resolve('D:/Projects',name),audit=path.join(root,'migration/audit-2026-10-27');
 for(const d of ['src/data','public/assets','public/styles','migration'])await fs.mkdir(path.join(root,d),{recursive:true});
 const records=[...JSON.parse(await fs.readFile(path.join(audit,'pages.json'))),...JSON.parse(await fs.readFile(path.join(audit,'posts.json')))];
 if(name==='shafter-lawyer'){const old=JSON.parse(await fs.readFile(path.join(root,'migration/inventory.json')));for(const r of old.routes)if(!records.some(x=>new URL(x.link).pathname===r.path))records.push({id:hash(r.path),link:site.origin+r.path,title:{rendered:r.title}})}
 const assets={},failures=[],cache=new Map();
 try{Object.assign(assets,JSON.parse(await fs.readFile(path.join(root,'migration/local-assets.json'))))}catch{}
 const canonicalAsset=(value,base=site.origin)=>{
  let u=new URL(value.replaceAll('&amp;','&'),base);
  if(/^i\d\.wp\.com$/.test(u.hostname)){const parts=u.pathname.slice(1).split('/');u=new URL('https://'+parts.shift()+'/'+parts.join('/'));}
  if(u.hostname==='dev.foundationpropertiesinc.com'){u.hostname='foundationpropertiesinc.com';u.protocol='https:';}
  if(u.hostname===new URL(site.origin).hostname)u.search='';u.hash='';return u.href;
 };
 async function asset(value,base=site.origin){
  if(!value||/^(data:|#|blob:)/.test(value))return value;
  const url=canonicalAsset(value,base);if(cache.has(url))return cache.get(url);
  const task=(async()=>{
   const u=new URL(url);let ext=path.extname(u.pathname).toLowerCase();if(!ext&&u.hostname==='fonts.googleapis.com')ext='.css';if(!ext)ext='.bin';
   const baseName=decodeURIComponent(path.basename(u.pathname,ext)).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,90)||'asset';
   const dest=assets[url]||`/assets/${baseName}-${hash(url)}${ext}`;
   try{try{await fs.access(path.join(root,'public',dest))}catch{let data=await read(url);if(ext==='.css')data=Buffer.from(await localCss(data.toString(),url,false));await fs.writeFile(path.join(root,'public',dest),data)}assets[url]=dest;return dest}catch(e){failures.push({url,error:e.message});return ''}
  })();cache.set(url,task);return task;
 }
 async function localCss(css,base,prune=true,$){
  // Retain original cascade and responsive rules; discard unrelated plugin rules.
  try{const tree=postcss.parse(css);if(prune&&$)tree.walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes/.test(rule.parent.name))return;const keep=rule.selectors?.filter(sel=>{if(/:hover|:focus|:active|:checked|\.et_mobile_menu|\.mobile_nav|\.sub-menu|\.et-fixed-header/.test(sel))return true;try{return $(sel.replace(/::[\w-]+(?:\([^)]*\))?/g,'').replace(/:(?:before|after)\b/g,'')).length>0}catch{return true}});if(keep?.length)rule.selector=keep.join(',');else rule.remove()});css=tree.toString()}catch{}
  const refs=[...new Set([...css.matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)].map(m=>m[1]).filter(u=>!u.startsWith('data:')&&!u.startsWith('#')))];
  for(const url of refs){const replacement=await asset(url,base);css=css.split(url).join(replacement||'data:,')}
  return css.replace(/\bbody\b(?=[\s.#:[>+~,{])/g,'.source-site').replaceAll('font-display:auto','font-display:swap');
 }
 const pages=[];
 for(const record of records){
  const route=new URL(record.link).pathname,file=route==='/'?'home':route.slice(1).replaceAll('/','_').replace(/_$/,'');
  let html;try{html=(await read(record.link)).toString();await fs.writeFile(path.join(audit,file+'-raw.html'),html)}catch(e){failures.push({url:record.link,error:e.message});continue}
  const $=load(html),title=$('title').text(),description=$('meta[name=description]').attr('content')||'',bodyClass=$('body').attr('class')||'';
  let css='';
  for(const el of $('style,link[rel=stylesheet],link[as=style]').toArray()){
   if(el.tagName==='style')css+=await localCss($(el).html()||'',record.link,true,$)+'\n';
   else{const href=$(el).attr('href');if(!href||/mediaelement|block-library/.test(href))continue;try{css+=await localCss((await read(new URL(href,record.link))).toString(),new URL(href,record.link).href,true,$)+'\n'}catch(e){failures.push({url:href,error:e.message})}}
  }
  const tree=$('#page-container');
  tree.find('script,style,link,noscript,#wpstats,.et_pb_contact_captcha,.et_pb_contact_right,.et-pb-slider-arrows,.et-pb-controllers,.et_pb_video_overlay,.mejs-container,.et_pb_newsletter_error,.et_pb_newsletter_success').remove();
  tree.find('[data-src]').each((i,e)=>{if(e.tagName==='img')$(e).attr('src',$(e).attr('data-src'))});
  // The pages are now self-contained and don't rely on Divi's lazy animation runtime.
  tree.find('*').addBack().each((i,e)=>{for(const a of Object.keys(e.attribs||{})){if(a.startsWith('on')||a.startsWith('data-')||['srcset','sizes','fetchpriority','decoding'].includes(a))$(e).removeAttr(a)}const style=$(e).attr('style');if(style)$(e).attr('style',style.replace(/(?:animation[^:;]*|transform|opacity|visibility):[^;]+;?/g,''));});
  // Resolve all images, embedded video and downloadable files before producing React data.
  await pool(tree.find('[src],[poster],a[href],[style]').toArray(),async e=>{
   for(const attr of ['src','poster']){let v=$(e).attr(attr);if(!v)continue;if(e.tagName==='iframe')continue;if(/^(data:|#)/.test(v))continue;$(e).attr(attr,await asset(v,record.link))}
   const href=$(e).attr('href');if(href&&!/^(mailto:|tel:|#|javascript:)/.test(href)){const u=new URL(href,record.link);if(/\.(?:jpe?g|png|webp|gif|svg|pdf|docx?|xlsx?|mp4|mov)$/i.test(u.pathname))$(e).attr('href',await asset(u.href));else if(u.hostname.replace(/^www\./,'')===new URL(site.origin).hostname)$(e).attr('href',u.pathname+u.search+u.hash)}
   const style=$(e).attr('style');if(style)$(e).attr('style',await localCss(style,record.link,false));
  });
  tree.find('iframe').each((i,e)=>{const src=$(e).attr('src')||'';if(/wordpress|wp\.com|wp-content/.test(src)){$(e).replaceWith('<p>Video unavailable in the original source.</p>');failures.push({url:src,error:'Embedded WordPress video requires replacement'})}else $(e).attr('title',/maps/.test(src)?'Location map':'Video').attr('loading','lazy')});
  tree.find('a[href^="javascript:"]').attr('href','#');
  tree.find('img').each((i,e)=>{if(!$(e).attr('alt')){const p=$(e).closest('.et_pb_blurb,.et_pb_image,.et_pb_gallery_item');const t=p.find('h1,h2,h3,h4,figcaption').first().text().trim();$(e).attr('alt',t||decodeURIComponent(path.basename($(e).attr('src')||'')).replace(/-[a-f0-9]{10}\.[^.]+$/,'').replace(/[-_]/g,' '))}$(e).attr('loading',i<2?'eager':'lazy')});
  tree.find('a[target=_blank]').attr('rel','noopener noreferrer');
  tree.find('.mobile_menu_bar').each((i,e)=>{$(e).replaceWith('<button class="mobile_menu_bar mobile_menu_bar_toggle" type="button" aria-label="Open navigation" aria-expanded="false"></button>')});
  tree.find('#et-info-phone').each((i,e)=>{if(!$(e).closest('a').length)$(e).wrap(`<a href="tel:${$(e).text().replace(/[^+0-9]/g,'')}"></a>`)});
  // Preserve both original contact form layouts, replacing only WordPress form engines.
  tree.find('form').each((i,e)=>{
   const fields=$(e).find('input:not([type=hidden]):not([type=submit]),textarea,select').toArray().filter(el=>!/(captcha|honeypot|wpforms\[fields\]\[[34]\])/.test($(el).attr('name')||''));
   const split=fields.some(f=>/\[first\]/.test($(f).attr('name')||''));
   const newsletter=fields.length===1&&/email/i.test($(fields[0]).attr('name')||$(fields[0]).attr('placeholder')||'');
   const config={variant:split?'split':newsletter?'newsletter':'contact',className:$(e).attr('class')||'et_pb_contact_form clearfix',button:$(e).find('button,[type=submit]').first().text().trim()||'Send',fields:fields.map(f=>{const raw=$(f).attr('name')||'',label=$(f).attr('placeholder')||$(e).find(`label[for="${$(f).attr('id')}"]`).text().trim();const key=/\[first\]/.test(raw)?'firstName':/\[last\]/.test(raw)?'lastName':/email|\[1\]/i.test(raw)?'email':/phone/i.test(raw)?'phone':f.tagName==='textarea'?'message':'name';return {name:key,label:label.replace(/\s*\*$/,'')||({firstName:'First name',lastName:'Last name',name:'Name',email:'Email',message:'Message',phone:'Phone number'}[key]),type:f.tagName==='textarea'?'textarea':key==='email'?'email':key==='phone'?'tel':'text',className:$(f).attr('class')||'input',wrapperClass:$(f).parent().attr('class')||'et_pb_contact_field et_pb_contact_field_last',required:key!=='phone'&&key!=='message'?true:!split&&key==='message'};})};
   $(e).replaceWith(`<contact-form data-config="${encodeURIComponent(JSON.stringify(config))}"></contact-form>`);
  });
  tree.find('.et_pb_toggle').each((i,e)=>{e.tagName='details';$(e).attr('class',($(e).attr('class')||'').replace('et_pb_toggle_close',''));const h=$(e).children('.et_pb_toggle_title').first();if(h[0])h[0].tagName='summary'});
  // Repair only demonstrably broken source placeholders, using existing destinations.
  if(name==='ruesga'){tree.find('a[href="#"]').each((i,e)=>{if(/view gallery/i.test($(e).text()))$(e).attr('href','/farming-operations/#farm-gallery');else if(/follow/i.test($(e).text()))$(e).replaceWith(`<span>${$(e).html()}</span>`)});if(route==='/farming-operations/')tree.find('.et_pb_gallery').first().attr('id','farm-gallery')}
  if(name==='shafter-lawyer'&&route==='/vehicle-accidents/')tree.find('h1,h2,h3').each((i,e)=>{if($(e).text().includes('Restraining Order Lawyer'))$(e).text('Vehicle Accident Lawyer Shafter CA')});
  tree.find('#main-content').attr('id','main-content');if(!tree.find('#main-content').length)tree.find('#et-main-area').attr('id','main-content');
  if(!tree.find('h1').length)tree.prepend(`<h1 class="sr-only">${record.title.rendered}</h1>`)
  function node(el){if(el.type==='text')return el.data;if(el.type!=='tag')return null;const props={...el.attribs};if(el.tagName==='contact-form')return {tag:'contact-form',config:JSON.parse(decodeURIComponent(props['data-config']))};return {tag:el.tagName,attrs:props,children:(el.children||[]).map(node).filter(x=>x!==null)}}
  const page={route,id:String(record.id),title,description:description||'',name:load(record.title.rendered).text(),bodyClass,tree:node(tree[0]),css:`/styles/page-${record.id}.css`,original:record.link};
  pages.push(page);await fs.writeFile(path.join(root,'public',page.css),css);console.log(name,route,'CSS',css.length,'assets',Object.keys(assets).length);
  await fs.writeFile(path.join(root,'migration/local-assets.json'),JSON.stringify(assets,null,2));
 }
 // Preserve the public media library as well as page-referenced assets, including documents.
 let media=JSON.parse(await fs.readFile(path.join(audit,'media.json')));
 if(media.length===100){for(let n=2;n<=30;n++){try{const more=JSON.parse((await read(site.origin+'/wp-json/wp/v2/media?per_page=100&page='+n)).toString());media.push(...more);if(more.length<100)break}catch{break}}}
 await pool(media.filter(m=>/^(image\/|application\/pdf)/.test(m.mime_type)),async m=>{if(m.source_url)await asset(m.source_url)});
 const icon=media.find(m=>/site-icon|cropped/i.test(m.slug))||media.find(m=>/logo/i.test(m.slug));
 site.icon=icon?await asset(icon.source_url):Object.values(assets).find(v=>/logo/i.test(v));
 site.socialImage=Object.values(assets).find(v=>/Logo|logo/.test(v))||site.icon;
 await fs.writeFile(path.join(root,'src/data/design-pages.json'),JSON.stringify(pages));
 await fs.writeFile(path.join(root,'src/data/site.json'),JSON.stringify(site,null,2));
 await fs.writeFile(path.join(root,'migration/local-assets.json'),JSON.stringify(assets,null,2));
 await fs.writeFile(path.join(root,'migration/import-issues.json'),JSON.stringify(failures,null,2));
 await fs.writeFile(path.join(root,'migration/routes.json'),JSON.stringify(pages.map(({route,name,title,original})=>({route,name,title,original})),null,2));
 console.log('COMPLETE',name,pages.length,'pages',Object.keys(assets).length,'assets',failures.length,'issues');
}
