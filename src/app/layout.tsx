import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StructuredData } from "@/components/StructuredData";
import { getOrganizationStructuredData, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | The Shafter Lawyer` },
  description:
    "The Law Offices of B. Scott Winkler in Shafter, California. Criminal defense, family law and personal injury representation in Kern County.",
  applicationName: "The Shafter Lawyer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <StructuredData
          data={getOrganizationStructuredData("/images/IMG_4071.-min-1.jpg")}
        />
      </body>
    </html>
  );
}
