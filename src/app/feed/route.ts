import {posts} from '@/lib/content';
import {SITE_URL,SITE_NAME} from '@/lib/seo';
export const dynamic='force-static';
const escape=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export function GET(){
 const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${escape(SITE_NAME)}</title><link>${SITE_URL}/</link><description>Articles by B. Scott Winkler, The Shafter Lawyer</description><language>en-US</language>${posts.map(p=>`<item><title>${escape(p.title)}</title><link>${SITE_URL}${p.path}</link><guid isPermaLink="true">${SITE_URL}${p.path}</guid><pubDate>${new Date(p.date||p.modified).toUTCString()}</pubDate><description>${escape(p.hero.description||p.title)}</description><content:encoded><![CDATA[${p.blocks.filter(b=>b.type==='html').map(b=>b.type==='html'?b.html:'').join('\n').replaceAll(']]>',']]]]><![CDATA[>')}]]></content:encoded></item>`).join('')}</channel></rss>`;
 return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=3600'}});
}
