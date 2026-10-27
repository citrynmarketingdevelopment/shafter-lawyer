import {notFound} from 'next/navigation';
import {MigrationPage,designPages} from '@/components/MigrationPage';
import {pageMetadata,structuredData} from '@/lib/design-seo';
export const dynamicParams=false;
export function generateStaticParams(){return designPages.filter(p=>p.route!=='/').map(p=>({slug:p.route.split('/').filter(Boolean)}))}
async function getPage(params:Promise<{slug:string[]}>){const {slug}=await params;const page=designPages.find(p=>p.route==='/'+slug.join('/')+'/');if(!page)notFound();return page}
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){return pageMetadata(await getPage(params))}
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const page=await getPage(params);return <><MigrationPage page={page}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData(page)).replaceAll('<','\\u003c')}}/></>}
