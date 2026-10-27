import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/design-seo';
export default function robots():MetadataRoute.Robots{const preview=process.env.VERCEL_ENV==='preview';return {rules:preview?{userAgent:'*',disallow:'/'}:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:preview?undefined:siteOrigin+'/sitemap.xml'}}