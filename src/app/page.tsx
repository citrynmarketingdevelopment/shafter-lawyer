import {MigrationPage,designPages} from '@/components/MigrationPage';
import {pageMetadata,structuredData} from '@/lib/design-seo';
const page=designPages.find(p=>p.route==='/')!;
export const metadata=pageMetadata(page);
export default function Home(){return <><MigrationPage page={page}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData(page)).replaceAll('<','\\u003c')}}/></>}
