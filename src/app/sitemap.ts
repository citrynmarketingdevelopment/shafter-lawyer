import type {MetadataRoute} from 'next';
import {pages} from '@/lib/content';
import {SITE_URL,isIndexablePage,isPreviewDeployment} from '@/lib/seo';
export default function sitemap():MetadataRoute.Sitemap{return isPreviewDeployment()?[]:pages.filter(isIndexablePage).map(p=>({url:SITE_URL+p.path,lastModified:p.modified,changeFrequency:'monthly',priority:p.path==='/'?1:0.7}))}