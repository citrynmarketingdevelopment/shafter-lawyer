import { createElement, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import pagesJson from '@/data/design-pages.json';
import site from '@/data/site.json';
import { MigrationContactForm, type FormDefinition } from './MigrationContactForm';
import { SiteInteractions, ImageSlider, BeforeAfter } from './SiteInteractions';

export type ContentNode = string | { tag: string; attrs?: Record<string, string>; children?: ContentNode[]; config?: FormDefinition };
export type DesignPage = { route: string; id: string; name: string; title: string; description: string; bodyClass: string; css: string; tree: ContentNode };
export const designPages = pagesJson as unknown as DesignPage[];
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const names: Record<string,string> = {class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',maxlength:'maxLength',colspan:'colSpan',rowspan:'rowSpan',frameborder:'frameBorder',allowfullscreen:'allowFullScreen',autoplay:'autoPlay',playsinline:'playsInline',crossorigin:'crossOrigin',viewbox:'viewBox',fillrule:'fillRule',cliprule:'clipRule',strokeWidth:'strokeWidth'};
const booleanAttributes = new Set(['controls','autoPlay','loop','muted','playsInline','allowFullScreen','hidden','open','disabled','required','readOnly']);
function attributes(input: Record<string,string> = {}) {
  const output: Record<string,unknown> = {};
  for (const [key,value] of Object.entries(input)) {
    if (/^on/i.test(key) || key.startsWith('data-') || key === 'srcset') continue;
    if (key === 'style') {
      const style: Record<string,string> = {};
      for(const part of value.split(/;(?![^()]*\))/)) {
        const i=part.indexOf(':'); if(i<0)continue;
        const name=part.slice(0,i).trim().replace(/^-ms-/,'ms-').replace(/-([a-z])/g,(_,x:string)=>x.toUpperCase());
        if(name)style[name]=part.slice(i+1).trim().replace(/\s*!important/g,'');
      }
      output.style=style as CSSProperties;
    } else {const name=names[key]||key;output[name]=booleanAttributes.has(name)?value!=='false':value;}
  }
  return output;
}
function imageNodes(node: ContentNode): ContentNode[] {
  if(typeof node==='string')return [];
  return node.tag==='img'?[node]:(node.children||[]).flatMap(imageNodes);
}
export function Content({node}: {node: ContentNode}): ReactNode {
  if(typeof node==='string')return node;
  if(node.tag==='contact-form'&&node.config)return <MigrationContactForm definition={node.config}/>;
  if(['script','object','embed'].includes(node.tag))return null;
  const props=attributes(node.attrs),children=node.children?.map((child,i)=><Content node={child} key={i}/>);
  const className=node.attrs?.class||'';
  if(/(?:^| )et_pb_slider(?: |$)|(?:^| )et_pb_gallery(?: |$)/.test(className))return <ImageSlider className={className} id={node.attrs?.id}>{children}</ImageSlider>;
  if(/twentytwenty-container|dsm_image_comparison_container|dipi_image_compare_container/.test(className)){
    const images=imageNodes(node).filter((x):x is Exclude<ContentNode,string>=>typeof x!=='string');
    if(images.length>=2)return <BeforeAfter before={images[0].attrs?.src||''} after={images[1].attrs?.src||''}/>;
  }
  if(node.tag==='img'&&node.attrs?.src?.startsWith('/assets/')) {
    const width=Number(node.attrs.width),height=Number(node.attrs.height);
    if(width>0&&height>0){
      return <Image {...props} src={node.attrs.src} alt={node.attrs.alt||''} width={width} height={height} sizes="(max-width: 767px) 100vw, (max-width: 1100px) 80vw, 1080px" loading={node.attrs.loading==='eager'?'eager':'lazy'} />;
    }
  }
  const tag=node.attrs?.id==='main-content'?'main':node.tag;
  return createElement(tag,props,...(voidTags.has(node.tag)?[]:children||[]));
}
export function MigrationPage({page}: {page: DesignPage}) {
  return <>
    <link rel="stylesheet" href={page.css} precedence="design" />
    <link rel="stylesheet" href="/styles/native.css" precedence="native" />
    <div className={`source-site ${page.bodyClass}`} data-site={site.name}>
      <a className="migration-skip" href="#main-content">Skip to content</a>
      <SiteInteractions><Content node={page.tree}/></SiteInteractions>
    </div>
  </>;
}
