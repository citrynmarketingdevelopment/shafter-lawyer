import Image from "next/image";
import Link from "next/link";

export function PageHero({
  title,
  eyebrow,
  description,
  image,
  date,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  image?: string;
  date?: string;
}) {
  return (
    <section className="page-hero">
      <Image
        className="hero-background"
        src={image || "/images/law-firm-18.jpg"}
        alt=""
        fill
        preload
        sizes="100vw"
      />
      <div className="hero-shade" />
      <div className="container page-hero-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>{eyebrow || title}</span>
        </nav>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="hero-description">{description}</p>}
        {date && (
          <time dateTime={date}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
        )}
      </div>
    </section>
  );
}
