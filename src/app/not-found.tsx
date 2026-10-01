import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container not-found">
      <p className="eyebrow">Page not found</p>
      <h1>Let’s get you back on track.</h1>
      <p>The page you requested could not be found.</p>
      <Link href="/" className="button button-gold">
        Return Home
      </Link>
    </div>
  );
}
