import {contactHandler} from '@/lib/secure-contact';
import site from '@/data/site.json';
export const runtime='nodejs';
export const maxDuration=30;
export const POST=contactHandler(site);
