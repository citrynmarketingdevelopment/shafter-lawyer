import { ContactForm } from "@/components/ContactForm";
import { office } from "@/lib/navigation";

export function ContactSection({
  heading = "Get In Touch",
}: {
  heading?: string;
}) {
  return (
    <section className="contact-section section" id="contact">
      <div className="container contact-layout">
        <div className="contact-info">
          <p className="eyebrow">The Law Offices of B. Scott Winkler</p>
          <h2>{heading}</h2>
          <div className="gold-rule" />
          <a className="contact-phone" href={office.phoneHref}>
            {office.phone}
          </a>
          <a href={`mailto:${office.email}`}>{office.email}</a>
          <address>
            {office.street}
            <br />
            {office.locality}
          </address>
          <a
            className="text-link"
            href={office.mapHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get directions <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
