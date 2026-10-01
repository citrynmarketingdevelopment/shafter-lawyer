import Image from "next/image";
import Link from "next/link";
import { navigation, office } from "@/lib/navigation";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="The Shafter Lawyer homepage">
            <Image
              src="/images/Main-Logo-in-White.png"
              alt="B. Scott Winkler, The Shafter Lawyer"
              width={270}
              height={187}
            />
          </Link>
          <p>Law Offices of B. Scott Winkler</p>
          <div className="social-links">
            <a
              href="https://www.facebook.com/theshafterlawyer/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook ↗
            </a>
            <a
              href="https://www.instagram.com/winklerscott7/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram ↗
            </a>
          </div>
        </div>
        <div>
          <h2>Navigation</h2>
          <nav aria-label="Footer navigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/biography/">Biography</Link>
          </nav>
        </div>
        <div>
          <h2>Contact Us</h2>
          <a href={office.phoneHref}>{office.phone}</a>
          <a href={`mailto:${office.email}`}>{office.email}</a>
          <h2 className="footer-visit">Visit us</h2>
          <address>
            {office.street}
            <br />
            {office.locality}
          </address>
          <a href={office.mapHref} target="_blank" rel="noopener noreferrer">
            Get directions ↗
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} The Law Offices of B. Scott Winkler. All
          Rights Reserved.
        </p>
        <Link href="/disclaimer/">Disclaimer</Link>
        <span>Powered &amp; Designed by Citryn, LLC</span>
      </div>
    </footer>
  );
}
