import type { MetadataRoute } from "next";
import content from "@/data/site-content.json";
import { getCanonicalUrl, isIndexablePage, type SEOPage } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return (content as SEOPage[]).filter(isIndexablePage).map((page) => ({
    url: getCanonicalUrl(page.path),
    lastModified: page.modified,
  }));
}
