import Image from "next/image";
import Link from "next/link";
import {
  PracticeAreas,
  FirmIntro,
  MeetLawyer,
  Testimonials,
} from "@/components/HomeSections";
import { ContactSection } from "@/components/ContactSection";
import { StructuredData } from "@/components/StructuredData";
import { home } from "@/lib/content";
import { getPageMetadata, getPageStructuredData } from "@/lib/seo";

export const metadata = getPageMetadata(home);

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <Image
          className="hero-background"
          src="/images/law-firm-18.jpg"
          alt="Scales of justice, law books and a judge's gavel"
          fill
          preload
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="container home-hero-content">
          <p className="eyebrow">The Law Offices of B. Scott Winkler</p>
          <h1>
            Your Shafter Lawyer.
            <br />
            Your side of the story.
          </h1>
          <p className="hero-intro">
            Criminal defense, family law and civil litigation.
            <br />
            Aggressive and competent legal services at an affordable rate.
          </p>
          <div className="hero-actions">
            <Link href="/contact-us/" className="button button-gold">
              Get a Free Consultation <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/defense-areas/" className="text-link">
              Our Defense Areas <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <Image
          className="hero-wordmark"
          src="/images/Main-Logo-in-White.png"
          alt="B. Scott Winkler, The Shafter Lawyer"
          width={270}
          height={187}
        />
      </section>
      <PracticeAreas />
      <FirmIntro />
      <MeetLawyer />
      <ContactSection />
      <Testimonials />
      <StructuredData data={getPageStructuredData(home)} />
    </>
  );
}
