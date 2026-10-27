import {SITE_URL,SITE_NAME} from '@/lib/seo';
export const dynamic='force-static';
export function GET(){return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Comments for ${SITE_NAME}</title><link>${SITE_URL}/</link><description>No public comments were present in the source feed at migration.</description></channel></rss>`,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}})}
