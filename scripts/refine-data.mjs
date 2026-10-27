import fs from 'node:fs/promises';import path from 'node:path';import {load} from 'cheerio';
for(const name of ['ruesga','foundation','shafter-lawyer']){
 const root=path.resolve('D:/Projects',name),pages=JSON.parse(await fs.readFile(path.join(root,'src/data/design-pages.json')));
 for(const page of pages){
  const file=page.route==='/'?'home':page.route.slice(1).replaceAll('/','_').replace(/_$/,'');
  const $=load(await fs.readFile(path.join(root,'migration/audit-2026-10-27',file+'-raw.html'),'utf8'));
  let originalHeading=$('#main-content h2,#main-content h3').first();
  const noH1=$('#page-container h1').length===0;
  function walk(node){if(typeof node==='string')return;
   if(noH1&&node.tag==='h1'&&node.attrs?.class!=='sr-only')node.tag=originalHeading[0]?.tagName||'h2';
   if(node.tag==='contact-form'&&node.config.variant!=='newsletter'&&!node.config.fields.some(f=>f.name==='email'))node.config.fields.push({name:'email',label:'Email Address',type:'email',className:'input',wrapperClass:'et_pb_contact_field et_pb_contact_field_last',required:true});
   if(node.tag==='iframe'){node.attrs.style=(node.attrs.style||'')+';width:100%;aspect-ratio:16/9;height:auto;border:0'}
   if(node.children)node.children=node.children.filter(x=>typeof x==='string'||x.tag!=='img'||x.attrs?.src);
   node.children?.forEach(walk);
  }walk(page.tree);
  if(noH1&&!JSON.stringify(page.tree).includes('"class":"sr-only"'))page.tree.children.unshift({tag:'h1',attrs:{class:'sr-only'},children:[page.route==='/'?(name==='shafter-lawyer'?'The Law Offices of B. Scott Winkler — The Shafter Lawyer':page.name):page.name]});
  if(name==='ruesga'&&page.route==='/farming-operations/')page.tree.children.unshift({tag:'span',attrs:{id:'farm-gallery'},children:[]});
 }
 await fs.writeFile(path.join(root,'src/data/design-pages.json'),JSON.stringify(pages));
 await fs.mkdir(path.join(root,'tests'),{recursive:true});await fs.copyFile('scripts/templates/migration-contact.test.ts',path.join(root,'tests/migration-contact.test.ts'));
 const cfg=await fs.readFile(path.join(root,'eslint.config.mjs'),'utf8');await fs.writeFile(path.join(root,'eslint.config.mjs'),cfg.replace('"migration/**"','"migration/**", "scripts/templates/**"'));
}
