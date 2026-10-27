import type {Metadata} from 'next';
import site from '@/data/site.json';
import {siteOrigin} from '@/lib/design-seo';
export const metadata:Metadata={metadataBase:new URL(siteOrigin),title:site.name,description:site.description,icons:{icon:site.icon}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0}}>{children}</body></html>}
