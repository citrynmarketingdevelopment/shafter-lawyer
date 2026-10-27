import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';import postcss from 'postcss';
for(const name of ['shafter-lawyer','ruesga','foundation']){
 const root=path.resolve('D:/Projects',name),folder=path.join(root,'public/assets'),map={},dimensions={};let saved=0;
 for(const file of await fs.readdir(folder)){
  if(!/\.(jpe?g|png)$/i.test(file))continue;
  const source=path.join(folder,file),out=file.replace(/\.[^.]+$/,'.webp');
  try{const data=await fs.readFile(source),meta=await sharp(data).metadata();dimensions['/assets/'+file]={width:meta.width,height:meta.height};const optimized=await sharp(data).resize({width:1920,withoutEnlargement:true}).webp({quality:88,effort:5}).toBuffer();if(optimized.length<data.length){await fs.writeFile(path.join(folder,out),optimized);map['/assets/'+file]='/assets/'+out;saved+=data.length-optimized.length}}catch{}
 }
 const replace=s=>{for(const [a,b] of Object.entries(map))s=s.split(a).join(b);return s};
 for(const file of await fs.readdir(path.join(root,'public/styles'))){if(file.endsWith('.css')){const p=path.join(root,'public/styles',file);await fs.writeFile(p,replace(await fs.readFile(p,'utf8')))}}
 const file=path.join(root,'src/data/design-pages.json'),pages=JSON.parse(await fs.readFile(file));
 const titles=Object.fromEntries(pages.map(p=>[p.route,p.name]));
 for(const p of pages){
  function text(n){return typeof n==='string'?n:(n.children||[]).map(text).join('')}
  function visit(n){if(typeof n==='string')return;
   if(n.attrs?.src&&map[n.attrs.src])n.attrs.src=map[n.attrs.src];if(n.attrs?.style)n.attrs.style=replace(n.attrs.style);
   if(/^h[4-6]$/.test(n.tag))n.attrs={...n.attrs,role:'heading','aria-level':'3'};
   if(n.tag==='a'&&/^(learn more|read more\??|click here)$/i.test(text(n).trim())){const target=titles[n.attrs?.href]||'this page';n.children.push({tag:'span',attrs:{class:'sr-only'},children:[' about '+target]});n.attrs['aria-label']=text(n).trim()}
   if(n.tag==='img'&&/logo/i.test(n.attrs?.alt||''))n.attrs.loading='eager';
   n.children?.forEach(visit);
  }visit(p.tree);
  const css=postcss.parse(await fs.readFile(path.join(root,'public',p.css),'utf8')),hero=new Set();
  css.walkRules(r=>{if(/\.et_pb_section_[01](?![0-9_a-z])/.test(r.selector))r.walkDecls(d=>{if(/background/.test(d.prop))for(const match of d.value.matchAll(/url\(['"]?(\/assets\/[^)'"\s]+)['"]?\)/g))hero.add(match[1])})});
  let parallax=0;function inline(n){if(typeof n==='string')return;if(n.attrs?.class==='et_parallax_bg'&&parallax++<2)for(const m of (n.attrs.style||'').matchAll(/url\(['"]?(\/assets\/[^)'"\s]+)['"]?\)/g))hero.add(m[1]);n.children?.forEach(inline)}inline(p.tree);
  p.preloadImages=[...hero].slice(0,2);
 }
 await fs.writeFile(file,JSON.stringify(pages));await fs.writeFile(path.join(root,'migration/optimized-assets.json'),JSON.stringify({map,bytesSaved:saved},null,2));console.log(name,'optimized',Object.keys(map).length,'saved',Math.round(saved/1024/1024)+' MB');
}
