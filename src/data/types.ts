export type ContentBlock =
  | { type: 'html'; html: string }
  | { type: 'image'; src: string; alt: string; width?: number; height?: number }
  | { type: 'faq'; title: string; html: string };

export interface SiteContent {
  id: number;
  path: string;
  title: string;
  type: 'page' | 'post' | 'archive';
  modified: string;
  date?: string;
  sourceUrl: string;
  metaTitle: string;
  metaDescription: string;
  hero: { title: string; eyebrow?: string; description?: string; image?: string };
  blocks: ContentBlock[];
  categories?: number[];
  excerpt?: string;
  postIds?: number[];
}
