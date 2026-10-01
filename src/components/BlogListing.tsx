import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/data/types";

export function BlogListing({ posts }: { posts: SiteContent[] }) {
  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <article className="post-card" key={post.path}>
          <Link
            href={post.path}
            className="post-card-image"
            aria-label={post.title}
            style={{ display: "block" }}
          >
            <Image
              src={post.hero.image || "/images/law-firm-18.jpg"}
              alt={
                post.hero.image?.includes("IMG_4071") ? "B. Scott Winkler" : ""
              }
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </Link>
          {post.date && (
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
          )}
          <h2>
            <Link href={post.path}>{post.title}</Link>
          </h2>
          <p>{post.excerpt}</p>
          <Link href={post.path} className="text-link">
            Read More <span aria-hidden="true">↗</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
