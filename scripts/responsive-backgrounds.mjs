import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {createHash} from 'node:crypto';

// One-time migration optimization: retain full-size originals and crops,
// while serving a smaller version of the same photo on narrow screens.
for (const name of ['shafter-lawyer','ruesga','foundation']) {
  const root=path.resolve('D:/Projects',name), pages=JSON.parse(await fs.readFile(path.join(root,'src/data/design-pages.json')));
  const folder=path.join(root,'public/styles'), sheets={};
  for (const file of await fs.readdir(folder)) if(file.endsWith('.css')) sheets[file]=await fs.readFile(path.join(folder,file),'utf8');
  const candidates=new Set();
  const collect=s=>{for(const m of s.matchAll(/url\(['"]?(\/assets\/[^)'"\s]+\.(?:webp|jpe?g|png))['"]?\)/g))candidates.add(m[1])};
  Object.values(sheets).forEach(collect);
  const walk=(n,fn)=>{if(typeof n==='string')return;fn(n);n.children?.forEach(c=>walk(c,fn))};
  pages.forEach(p=>walk(p.tree,n=>collect(n.attrs?.style||'')));
  const map={};
  for(const source of candidates) {
    const file=path.join(root,'public',source),meta=await sharp(file).metadata();
    if(!meta.width||meta.width<=1000)continue;
    const small=source.replace(/\.[^.]+$/, '-mobile.webp');
    await sharp(file).resize({width:960,withoutEnlargement:true}).webp({quality:88,effort:5}).toFile(path.join(root,'public',small));
    map[source]={small,variable:'--photo-'+createHash('sha256').update(source).digest('hex').slice(0,10)};
  }
  const replace=s=>s.replace(/url\(['"]?(\/assets\/[^)'"\s]+\.(?:webp|jpe?g|png))['"]?\)/g,(whole,src)=>map[src]?`var(${map[src].variable})`:whole);
  for(const [file,css] of Object.entries(sheets))await fs.writeFile(path.join(folder,file),replace(css));
  const vars=Object.entries(map).map(([src,v])=>`${v.variable}:url("${src}")`).join(';');
  const mobile=Object.values(map).map(v=>`${v.variable}:url("${v.small}")`).join(';');
  await fs.appendFile(path.join(folder,'native.css'),`\n.source-site{${vars}}\n@media(max-width:600px){.source-site{${mobile}}}\n`);
  pages.forEach(p=>{walk(p.tree,n=>{if(n.attrs?.style)n.attrs.style=replace(n.attrs.style)});p.preloadMobileImages=Object.fromEntries((p.preloadImages||[]).filter(src=>map[src]).map(src=>[src,map[src].small]));});
  await fs.writeFile(path.join(root,'src/data/design-pages.json'),JSON.stringify(pages));
  await fs.writeFile(path.join(root,'migration/responsive-backgrounds.json'),JSON.stringify(map,null,2));
  console.log(name,Object.keys(map).length,'responsive background photos');
}
