import Image from "next/image";
import Link from "next/link";
import { biographyIntro, firmIntro, home } from "@/lib/content";

const practices = [
  {
    title: "Criminal Defense",
    image: "law-firm-06.jpg",
    alt: "An attorney shaking hands with a client",
    text: "Criminal Defense Lawyer Shafter CA. Allegations by law enforcement… make sure your side of the story is told.",
  },
  {
    title: "Family Law",
    image: "law-firm-20.jpg",
    alt: "Scales of justice",
    text: "Family and Child Custody Lawyer in Shafter CA assisting in divorce, custody, visitation, support & restraining orders.",
  },
  {
    title: "Civil Litigation",
    image: "law-firm-07.jpg",
    alt: "Reviewing a legal document",
    text: "Mergers & Acquisitions – Contract Disputes – Employment/Education Law.",
  },
];

export function PracticeAreas() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <h2>Primary Practice Areas</h2>
          <div className="gold-rule" />
        </div>
        <div className="practice-grid">
          {practices.map((practice) => (
            <article className="practice-card" key={practice.title}>
              <Link
                href="/defense-areas/"
                className="practice-photo"
                aria-label={`${practice.title}: learn more`}
                style={{ display: "block" }}
              >
                <Image
                  src={`/images/${practice.image}`}
                  alt={practice.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 33vw"
                />
              </Link>
              <h3>{practice.title}</h3>
              <p>{practice.text}</p>
              <Link href="/defense-areas/" className="text-link">
                Learn More <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
        <div className="section-action">
          <Link href="/defense-areas/" className="button">
            View All Defense Areas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FirmIntro() {
  return (
    <section className="section firm-intro">
      <div className="container intro-grid">
        <div>
          <p className="eyebrow">Charge Forward</p>
          <h2>Criminal Defense Law Firm Local Leading Lawyer in Shafter, CA</h2>
          <div className="gold-rule" />
          <div dangerouslySetInnerHTML={{ __html: firmIntro }} />
          <Link className="text-link" href="/our-firm/">
            Learn more <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="local-gallery">
          {[
            { file: "79", alt: "Shafter, California sign" },
            { file: "78", alt: "Shafter Depot Museum" },
            { file: "72", alt: "A view of Shafter, California" },
            { file: "74", alt: "Agricultural fields in Shafter, California" },
          ].map((photo) => (
            <Image
              key={photo.file}
              src={`/images/Untitled-design-${photo.file}.jpg`}
              alt={photo.alt}
              width={800}
              height={1035}
              sizes="(max-width: 767px) 45vw, 25vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MeetLawyer() {
  return (
    <section className="section">
      <div className="container meet-grid">
        <div className="portrait-wrap">
          <Image
            src="/images/IMG_4071.-min-1.jpg"
            alt="Attorney B. Scott Winkler"
            width={1067}
            height={1600}
            sizes="(max-width: 767px) 90vw, 40vw"
          />
        </div>
        <div className="meet-copy">
          <h2>Meet The Shafter Lawyer</h2>
          <div className="gold-rule" />
          <div dangerouslySetInnerHTML={{ __html: biographyIntro }} />
          <Link href="/biography/" className="text-link">
            Read More <span aria-hidden="true">↗</span>
          </Link>
          <blockquote className="attorney-quote">
            <p>
              We are continuously serving our primary market with aggressive and
              competent legal services at an affordable rate.
            </p>
            <cite>Attorney B. Scott Winkler</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const quotes = home.blocks.filter(
    (block) =>
      block.type === "html" &&
      /Eddie S \||Jennifer N \||Alyssa B \|/.test(block.html),
  );
  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <h2>From Our Clients</h2>
          <div className="gold-rule" />
          <p>
            Built on paying thorough attention to the crucial details that we
            give to our clients, you can be sure that you will be taken care of
            properly with B. Scott Winkler the Criminal Defense Lawyer Shafter
            CA
          </p>
        </div>
        <div className="testimonials-grid">
          {quotes.map((quote, index) => {
            if (quote.type !== "html") return null;
            const end = quote.html.lastIndexOf("</p>") + 4;
            return (
              <blockquote className="testimonial" key={index}>
                <Image
                  className="stars"
                  src="/images/stars-5.png"
                  alt="5 stars"
                  width={204}
                  height={34}
                />
                <div
                  dangerouslySetInnerHTML={{ __html: quote.html.slice(0, end) }}
                />
                <cite>{quote.html.slice(end).trim()}</cite>
              </blockquote>
            );
          })}
        </div>
      </div>
    </section>
  );
}
