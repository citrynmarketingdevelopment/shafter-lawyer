import content from "@/data/site-content.json";
import type { SiteContent, ContentBlock } from "@/data/types";

export const pages = content as SiteContent[];
export const posts = pages
  .filter((page) => page.type === "post")
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
export function getPage(path: string) {
  return pages.find((page) => page.path === path);
}
export const home = getPage("/")!;

// Imported HTML has already been sanitized by scripts/migrate-source.mjs.
export function htmlContaining(page: SiteContent, text: string): string {
  return (
    page.blocks.find(
      (block): block is Extract<ContentBlock, { type: "html" }> =>
        block.type === "html" && block.html.includes(text),
    )?.html || ""
  );
}

export function withoutSharedContact(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((block) => {
    if (block.type !== "html") return true;
    const text = block.html.replace(/<[^>]*>/g, "").trim();
    // A working React contact section replaces these exact shared builder modules.
    return (
      !/^Get In Touch$/i.test(text) &&
      !(
        text.includes("400 Central Valley Hwy") &&
        text.includes("shafterlaw@gmail.com")
      )
    );
  });
}

export const biographyIntro = htmlContaining(
  home,
  "My calling to the law came in 1980",
);
export const firmIntro = htmlContaining(
  home,
  "Built on paying thorough attention",
);
