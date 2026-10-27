import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ContentBlocks } from "@/components/ContentBlocks";
import { BlogListing } from "@/components/BlogListing";
import { PracticeDirectory } from "@/components/PracticeDirectory";
import { MeetLawyer, Testimonials } from "@/components/HomeSections";
import { ContactSection } from "@/components/ContactSection";
import { StructuredData } from "@/components/StructuredData";
import { pages, posts, getPage, withoutSharedContact } from "@/lib/content";
import { practiceLinks, office } from "@/lib/navigation";
import { getPageMetadata, getPageStructuredData } from "@/lib/seo";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return pages
    .filter((page) => page.path !== "/")
    .map((page) => ({ slug: page.path.split("/").filter(Boolean) }));
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = getPage(`/${slug.join("/")}/`);
  return page
    ? getPageMetadata(page)
    : { title: "Page not found", robots: { index: false, follow: false } };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(`/${slug.join("/")}/`);
  if (!page) notFound();
  const isBlog = page.path === "/blog/" || page.type === "archive";
  const isContact = page.path === "/contact-us/";
  const isDirectory = page.path === "/defense-areas/";
  const isPractice =
    practiceLinks.some((link) => link.href === page.path) ||
    page.path === "/vehicle-accidents-dev/";
  let blocks = withoutSharedContact(page.blocks);
  if (isPractice) {
    const biographyIndex = blocks.findIndex(
      (block) =>
        block.type === "html" && /<h5>Biography<\/h5>/i.test(block.html),
    );
    if (biographyIndex >= 0) blocks = blocks.slice(0, biographyIndex);
  }
  if (isDirectory) {
    const serviceIndex = blocks.findIndex(
      (block) =>
        block.type === "html" && block.html.includes("What We Can Do For You"),
    );
    blocks = serviceIndex >= 0 ? blocks.slice(serviceIndex) : [];
  }
  if (isContact) {
    const serviceIndex = blocks.findIndex(
      (block) =>
        block.type === "html" && block.html.includes("What We Can Do For You"),
    );
    blocks = serviceIndex >= 0 ? blocks.slice(serviceIndex) : [];
  }

  return (
    <>
      <PageHero
        {...page.hero}
        eyebrow={isPractice ? "Defense Areas" : page.hero.eyebrow}
        date={page.type === "post" ? page.date : undefined}
      />
      {isContact && (
        <>
          <div className="container contact-page-intro">
            <h2>Open Hours</h2>
            <p>
              Mon-Fri: 9am – 5pm
              <br />
              Sat-Sun: CLOSED
            </p>
          </div>
          <ContactSection />
        </>
      )}
      {isBlog ? (
        <section className="container section">
          <BlogListing
            posts={
              page.postIds
                ? posts.filter((post) => page.postIds!.includes(post.id))
                : posts
            }
          />
        </section>
      ) : (
        <>
          {isDirectory && (
            <section className="container section">
              <div className="section-heading">
                <h2>Our Areas of Expertise</h2>
                <div className="gold-rule" />
              </div>
              <PracticeDirectory />
            </section>
          )}
          {blocks.length > 0 && (
            <section className="container section article-layout">
              <article className="article-content">
                <ContentBlocks blocks={blocks} />
                {page.type === "post" && (
                  <div className="related-posts">
                    <h2>More From the Blog</h2>
                    {posts
                      .filter((post) => post.path !== page.path)
                      .map((post) => (
                        <Link key={post.path} href={post.path}>
                          {post.title}
                        </Link>
                      ))}
                  </div>
                )}
              </article>
              <aside className="article-sidebar">
                <h2>Defense Areas</h2>
                <nav aria-label="Defense areas">
                  {practiceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={
                        page.path === link.href ? "page" : undefined
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <Link href="/contact-us/" className="button button-gold">
                  Free Consultation
                </Link>
                <a className="sidebar-phone" href={office.phoneHref}>
                  {office.phone}
                </a>
              </aside>
            </section>
          )}
          {(isPractice || isDirectory || isContact) && <MeetLawyer />}
          {isContact && <Testimonials />}
        </>
      )}
      {!isContact && page.path !== "/disclaimer/" && <ContactSection />}
      <StructuredData data={getPageStructuredData(page)} />
    </>
  );
}
