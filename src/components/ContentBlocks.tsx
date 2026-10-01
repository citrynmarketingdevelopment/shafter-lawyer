import Image from "next/image";
import type { ContentBlock } from "@/data/types";

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "faq")
          return (
            <details className="faq" key={index}>
              <summary>{block.title}</summary>
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            </details>
          );
        if (block.type === "image")
          return (
            <figure
              className={`content-image ${block.src.includes("stars-5") ? "is-rating" : ""}`}
              key={index}
            >
              <Image
                src={block.src}
                alt={
                  block.alt ||
                  (block.src.includes("IMG_4071")
                    ? "Attorney B. Scott Winkler"
                    : "")
                }
                width={block.width || 1000}
                height={block.height || 667}
                sizes="(max-width: 767px) calc(100vw - 40px), 800px"
              />
            </figure>
          );
        return (
          <div
            className="prose content-block"
            key={index}
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        );
      })}
    </>
  );
}
