import type {Metadata} from 'next';
import {MigrationPage,designPages,type ContentNode} from '@/components/MigrationPage';
import {pages} from '@/lib/content';
export const metadata:Metadata={title:'Search | The Shafter Lawyer',robots:{index:false,follow:true},alternates:{canonical:'/search/'}};
export default async function Search({searchParams}:{searchParams:Promise<{s?:string}>}){
 const {s}=await searchParams,query=(typeof s==='string'?s:'').slice(0,120).trim();
 const results=query?pages.filter(p=>!p.path.endsWith('-dev/')&&JSON.stringify(p).toLowerCase().includes(query.toLowerCase())):[];
 const page=structuredClone(designPages.find(p=>p.route==='/category/scott-winkler-blog/')!);
 const resultNodes:ContentNode[]=[{tag:'h1',children:[query?`Search results for: ${query}`:'Search the website']}];
 for(const p of results)resultNodes.push({tag:'article',attrs:{class:'et_pb_post'},children:[{tag:'h2',children:[{tag:'a',attrs:{href:p.path},children:[p.title]}]},{tag:'p',children:[p.hero.description||p.metaDescription||'Read more.']}]});
 if(!results.length)resultNodes.push({tag:'p',children:[query?'No matching pages were found. Please try another search.':'Enter a search term to find pages and articles.']});
 function replace(node:ContentNode){if(typeof node==='string')return;if(node.attrs?.id==='left-area')node.children=resultNodes;else node.children?.forEach(replace)}
 replace(page.tree);page.route='/search/';return <MigrationPage page={page}/>;
}
