import type {Metadata} from 'next';
import site from '@/data/site.json';
import {designPages,type DesignPage} from '@/components/MigrationPage';
export const siteOrigin=(process.env.NEXT_PUBLIC_SITE_URL||site.origin).replace(/\/$/,'');
export const preview=process.env.VERCEL_ENV==='preview';
const descriptions:Record<string,Record<string,string>>={
 'Ruesga Farms':{'/':site.description,'/winter-program/':'Explore Ruesga Farms’ December–February winter watermelon program in San Vicente and Puerto Vallarta, Mexico, including seeded and seedless varieties.','/what-we-grow/':'Discover the crops grown by Ruesga Farms in San Vicente, Mexico, including watermelon, beans, stevia and corn.','/farming-operations/':'Learn about crop sustainability, grafting, worker responsibility and food safety at Ruesga Farms in San Vicente, Nayarit.','/our-history/':'Read the history of Ruesga Farms, a family farm founded by Jose Ruesga in San Vicente, Nayarit, in the 1920s.','/contact-us/':'Contact Ruesga Farms with questions about its produce, farming operations and winter watermelon program in San Vicente, Mexico.'},
 'Foundation Properties Inc':{'/':site.description,'/contact-us/':'Contact Foundation Properties Inc and Kern General Construction for construction, remodeling and real estate services in Bakersfield, California.','/about-us/':'Learn about Foundation Properties Inc and Kern General Construction, serving residential and commercial clients in Bakersfield, California.','/gallery/':'Browse original before-and-after photographs of Foundation Properties Inc construction and remodeling projects in Bakersfield, CA.','/video/':'Watch Kern General Construction project videos and contact Foundation Properties Inc about construction and remodeling in Bakersfield, CA.','/development/':'Explore Foundation Properties Inc development and construction project information in Bakersfield, California.'}
};
export function canonicalRoute(route:string){return route==='/our-services-dev/'?'/our-firm/':route==='/vehicle-accidents-dev/'?'/vehicle-accidents/':route}
export function indexable(page:DesignPage){return !preview&&!['/our-services-dev/','/vehicle-accidents-dev/','/development/'].includes(page.route)}
export function pageMetadata(page:DesignPage):Metadata{
 const title=page.route==='/'?page.title:page.title.includes(site.name)?page.title:`${page.name} | ${site.name}`;
 const description=descriptions[site.name]?.[page.route]||page.description||`${page.name}: ${site.description}`;
 const url=siteOrigin+canonicalRoute(page.route),image=siteOrigin+site.socialImage;
 return {title:{absolute:title},description,alternates:{canonical:url},robots:{index:indexable(page),follow:true},openGraph:{type:'website',title,description,url,siteName:site.name,locale:'en_US',images:[{url:image,alt:site.name}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export function structuredData(page:DesignPage){
 const info=site as typeof site&{phone?:string;address?:string;city?:string;region?:string;postal?:string};
 return {'@context':'https://schema.org','@graph':[{'@type':site.type,'@id':siteOrigin+'/#organization',name:site.name,url:siteOrigin,logo:siteOrigin+site.icon,...(site.email?{email:site.email}:{}),...(info.phone?{telephone:info.phone}:{}),...(info.address?{address:{'@type':'PostalAddress',streetAddress:info.address,addressLocality:info.city,addressRegion:info.region,postalCode:info.postal,addressCountry:'US'}}:{areaServed:['Mexico','United States']})},{'@type':'WebPage','@id':siteOrigin+page.route,name:page.name,url:siteOrigin+canonicalRoute(page.route),isPartOf:{'@id':siteOrigin+'/#website'},about:{'@id':siteOrigin+'/#organization'}},{'@type':'WebSite','@id':siteOrigin+'/#website',url:siteOrigin,name:site.name},...(page.route==='/'?[]:[{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:siteOrigin+'/'},{'@type':'ListItem',position:2,name:page.name,item:siteOrigin+page.route}]}])]};
}
export {designPages};
