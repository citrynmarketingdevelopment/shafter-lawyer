import type { Metadata } from "next";

export const SITE_NAME = "The Law Offices of B. Scott Winkler";
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://theshafterlawyer.com",
).origin;
const DEFAULT_SOCIAL_IMAGE = "/images/law-firm-18.jpg";

export interface SEOPage {
  path: string;
  title: string;
  type: "page" | "post" | "archive";
  modified: string;
  date?: string;
  metaTitle?: string;
  metaDescription?: string;
  hero: {
    title: string;
    description?: string;
    image?: string;
  };
}

type PageSEO = { title: string; description: string };

// Descriptions summarize the migrated pages without adding legal advice,
// guarantees, or claims that do not appear in the original site.
const pageSEO: Record<string, PageSEO> = {
  "/": {
    title: "Shafter Criminal Defense & Family Lawyer | B. Scott Winkler",
    description:
      "B. Scott Winkler represents clients in criminal defense, family law and personal injury matters in Shafter and Kern County. Request a free consultation.",
  },
  "/our-firm/": {
    title: "Our Shafter Law Firm | B. Scott Winkler",
    description:
      "Learn about the Law Offices of B. Scott Winkler, a Shafter law firm serving Kern County with criminal defense, family law and personal injury representation.",
  },
  "/defense-areas/": {
    title: "Defense & Practice Areas in Shafter | B. Scott Winkler",
    description:
      "Explore legal representation for DUI, felony and misdemeanor charges, family law, and vehicle, oilfield and industrial accidents in Shafter and Kern County.",
  },
  "/dui-cases/": {
    title: "DUI Defense Lawyer in Shafter, CA | B. Scott Winkler",
    description:
      "Discuss your DUI charge with Shafter attorney B. Scott Winkler. Learn about the firm's approach to DUI defense and request a free initial consultation.",
  },
  "/dmv-hearings/": {
    title: "DMV Hearing Lawyer in Shafter, CA | B. Scott Winkler",
    description:
      "B. Scott Winkler represents Shafter and Kern County clients in DMV DUI hearings involving driving privileges. Contact the firm for a free consultation.",
  },
  "/felony-charges/": {
    title: "Felony Defense Lawyer in Shafter, CA | B. Scott Winkler",
    description:
      "Facing a felony charge in Kern County? Learn about criminal defense representation from Shafter attorney B. Scott Winkler and request a free consultation.",
  },
  "/misdemeanors/": {
    title: "Misdemeanor Defense in Shafter, CA | B. Scott Winkler",
    description:
      "Learn about misdemeanor defense for DUI, theft, driving and other charges in Shafter. Speak with attorney B. Scott Winkler about your individual situation.",
  },
  "/child-custody/": {
    title: "Child Custody Lawyer in Shafter, CA | B. Scott Winkler",
    description:
      "Get help with your child custody matter in Shafter and Kern County. B. Scott Winkler offers an initial consultation to discuss your family and legal needs.",
  },
  "/child-visitations/": {
    title: "Child Visitation Lawyer in Shafter | B. Scott Winkler",
    description:
      "Learn about scheduled, reasonable and supervised child visitation. Contact Shafter family law attorney B. Scott Winkler to discuss your parenting arrangement.",
  },
  "/child-support/": {
    title: "Child Support Lawyer in Shafter, CA | B. Scott Winkler",
    description:
      "Discuss child support and parental responsibilities with B. Scott Winkler, a family law attorney serving Shafter and Kern County. Free initial consultation.",
  },
  "/restraining-orders/": {
    title: "Restraining Order Lawyer in Shafter | B. Scott Winkler",
    description:
      "Find representation for domestic violence and civil harassment restraining order matters in Shafter. Contact B. Scott Winkler for a free consultation.",
  },
  "/vehicle-accidents/": {
    title: "Vehicle Accident Lawyer in Shafter | B. Scott Winkler",
    description:
      "Injured in a vehicle accident in Shafter or Bakersfield? Discuss your injury, medical expenses and property damage with attorney B. Scott Winkler.",
  },
  "/oilfield-accidents/": {
    title: "Oilfield Accident Lawyer in Shafter | B. Scott Winkler",
    description:
      "B. Scott Winkler assists people affected by oilfield accidents in Shafter, Bakersfield and surrounding areas. Request a free consultation about your injury.",
  },
  "/industrial-accident/": {
    title: "Industrial Accident Lawyer in Shafter | B. Scott Winkler",
    description:
      "Discuss industrial injuries involving workplace equipment, falls and other accidents with Shafter attorney B. Scott Winkler. Free initial consultations.",
  },
  "/case-results/": {
    title: "Criminal Defense Case Results | B. Scott Winkler",
    description:
      "Read selected criminal defense case results from the Law Offices of B. Scott Winkler, including DUI, felony and misdemeanor matters in Kern County.",
  },
  "/faqs/": {
    title: "Criminal Defense & DUI FAQs | The Shafter Lawyer",
    description:
      "Read the firm's answers to common questions about criminal defense, DUI arrests, plea bargains and hiring an attorney. Contact B. Scott Winkler in Shafter.",
  },
  "/biography/": {
    title: "Attorney B. Scott Winkler's Biography | The Shafter Lawyer",
    description:
      "Read B. Scott Winkler's personal story and the family experience that inspired him to pursue law and help people seeking legal representation in Kern County.",
  },
  "/contact-us/": {
    title: "Contact B. Scott Winkler | Shafter Lawyer Consultation",
    description:
      "Call (661) 746-0235 or contact B. Scott Winkler for a free initial consultation. Visit the law office at 400 Central Valley Hwy, Shafter, CA 93263.",
  },
  "/blog/": {
    title: "B. Scott Winkler's Legal Blog | The Shafter Lawyer",
    description:
      "Read B. Scott Winkler's articles and reflections on criminal defense, Miranda rights, DUI awareness and everyday life from the Shafter Lawyer blog.",
  },
  "/disclaimer/": {
    title: "Website Legal Disclaimer | The Shafter Lawyer",
    description:
      "Read the Law Offices of B. Scott Winkler website disclaimer about general information, legal advice and the creation of an attorney-client relationship.",
  },
  "/our-services-dev/": {
    title: "Our Services Archive | The Shafter Lawyer",
    description:
      "An archived services page from the Law Offices of B. Scott Winkler, including the attorney's Kern County background and approach to legal representation.",
  },
  "/vehicle-accidents-dev/": {
    title: "Vehicle Accident Page Archive | The Shafter Lawyer",
    description:
      "An archived vehicle accident page from the Law Offices of B. Scott Winkler, with information for people injured in Shafter and Bakersfield vehicle accidents.",
  },
  "/tis-season-not-drink-drive/": {
    title: "'Tis the Season to Not Drink & Drive | B. Scott Winkler",
    description:
      "B. Scott Winkler reflects on the dangers of impaired driving, the impact on families and planning a safe ride home during the holiday season.",
  },
  "/thank-veterans-united-states/": {
    title: "Thank You to America's Veterans | B. Scott Winkler",
    description:
      "The Law Offices of B. Scott Winkler shares a Veterans Day message honoring past and present service members and the families who support them.",
  },
  "/miranda-rights/": {
    title: "Do You Know Your Miranda Rights? | B. Scott Winkler",
    description:
      "Read B. Scott Winkler's article about Miranda warnings, the right to remain silent, the right to an attorney and the history behind those protections.",
  },
  "/arrested/": {
    title: "Arrested? Do Not Do These 3 Things | B. Scott Winkler",
    description:
      "B. Scott Winkler discusses common mistakes after an arrest, police encounters and why a person's words and actions can affect their criminal defense.",
  },
  "/introduction/": {
    title: "Introducing the Shafter Lawyer Blog | B. Scott Winkler",
    description:
      "Meet B. Scott Winkler through his first blog post about practicing law in Kern County and sharing candid perspectives on the law and everyday life.",
  },
  "/category/scott-winkler-blog/": {
    title: "Scott Winkler Blog Archives | The Shafter Lawyer",
    description:
      "Browse the Scott Winkler Blog archive for articles on arrests, Miranda rights, impaired driving and personal reflections from the Shafter attorney.",
  },
  "/category/uncategorized/": {
    title: "Uncategorized Article Archive | The Shafter Lawyer",
    description:
      "Browse the original uncategorized article archive from the Shafter Lawyer, including B. Scott Winkler's discussion of common mistakes after an arrest.",
  },
  "/2017/08/": {
    title: "August 2017 Blog Archive | The Shafter Lawyer",
    description:
      "Read the August 2017 Shafter Lawyer articles: B. Scott Winkler introduces his legal blog and discusses three common mistakes people make after an arrest.",
  },
  "/2017/09/": {
    title: "September 2017 Blog Archive | The Shafter Lawyer",
    description:
      "Explore the September 2017 blog archive featuring B. Scott Winkler's article on Miranda rights, the right to remain silent and the right to an attorney.",
  },
  "/2017/11/": {
    title: "November 2017 Blog Archive | The Shafter Lawyer",
    description:
      "Visit the November 2017 archive for the Law Offices of B. Scott Winkler's Veterans Day tribute to military service members and their families.",
  },
  "/2017/12/": {
    title: "December 2017 Blog Archive | The Shafter Lawyer",
    description:
      "Browse the December 2017 Shafter Lawyer archive for B. Scott Winkler's holiday reflection on impaired driving, family safety and arranging a safe ride home.",
  },
  "/author/theshafterlawyer007/": {
    title: "Articles by B. Scott Winkler | The Shafter Lawyer",
    description:
      "Explore B. Scott Winkler's collected articles about arrests, Miranda rights, driving safety and personal reflections from his law practice in Kern County.",
  },
};

const canonicalAliases: Record<string, string> = {
  // Despite its legacy slug, this page's content is a firm/attorney biography.
  "/our-services-dev/": "/our-firm/",
  "/vehicle-accidents-dev/": "/vehicle-accidents/",
};

const practicePaths = new Set([
  "/dui-cases/",
  "/dmv-hearings/",
  "/felony-charges/",
  "/misdemeanors/",
  "/child-custody/",
  "/child-visitations/",
  "/child-support/",
  "/restraining-orders/",
  "/vehicle-accidents/",
  "/oilfield-accidents/",
  "/industrial-accident/",
]);

export function normalizePath(path: string): string {
  const value = path.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, "");
  return value ? `/${value}/` : "/";
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function isIndexablePage(page: Pick<SEOPage, "path">): boolean {
  return !isPreviewDeployment() && !canonicalAliases[normalizePath(page.path)];
}

export function getCanonicalUrl(path: string): string {
  const normalized = normalizePath(path);
  return `${SITE_URL}${canonicalAliases[normalized] || normalized}`;
}

function getPageSEO(page: SEOPage): PageSEO {
  return (
    pageSEO[normalizePath(page.path)] || {
      title: page.metaTitle || `${page.title} | The Shafter Lawyer`,
      description:
        page.metaDescription ||
        page.hero.description ||
        `Read ${page.title} from the Law Offices of B. Scott Winkler, serving Shafter and Kern County. Contact the firm for a free initial consultation.`,
    }
  );
}

export function getPageMetadata(page: SEOPage): Metadata {
  const { title, description } = getPageSEO(page);
  const index = isIndexablePage(page);
  const image = {
    url: new URL(page.hero.image || DEFAULT_SOCIAL_IMAGE, `${SITE_URL}/`).href,
    alt: page.hero.image ? page.hero.title || page.title : SITE_NAME,
  };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: getCanonicalUrl(page.path) },
    robots: { index, follow: !isPreviewDeployment() },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(page.path),
      siteName: SITE_NAME,
      locale: "en_US",
      images: [image],
      ...(page.type === "post"
        ? {
            type: "article" as const,
            publishedTime: page.date,
            modifiedTime: page.modified,
            authors: [getCanonicalUrl("/biography/")],
          }
        : { type: "website" as const }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function getOrganizationStructuredData(image?: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LegalService", "Attorney"],
        "@id": `${SITE_URL}/#firm`,
        name: SITE_NAME,
        alternateName: "The Shafter Lawyer",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/images/New-Web-Logo.png`,
        telephone: "+16617460235",
        email: "shafterlaw@gmail.com",
        address: {
          "@type": "PostalAddress",
          streetAddress: "400 Central Valley Hwy",
          addressLocality: "Shafter",
          addressRegion: "CA",
          postalCode: "93263",
          addressCountry: "US",
        },
        areaServed: [
          { "@type": "City", name: "Shafter" },
          { "@type": "AdministrativeArea", name: "Kern County, California" },
        ],
        employee: { "@id": `${SITE_URL}/#attorney` },
        ...(image ? { image: new URL(image, `${SITE_URL}/`).href } : {}),
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#attorney`,
        name: "B. Scott Winkler",
        jobTitle: "Attorney",
        url: getCanonicalUrl("/biography/"),
        worksFor: { "@id": `${SITE_URL}/#firm` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#firm` },
        inLanguage: "en-US",
      },
    ],
  };
}

export function getPageStructuredData(page: SEOPage) {
  const path = normalizePath(page.path);
  const url = getCanonicalUrl(path);
  const { description } = getPageSEO(page);
  const crumbs = [{ name: "Home", item: `${SITE_URL}/` }];
  if (practicePaths.has(path)) {
    crumbs.push({
      name: "Defense Areas",
      item: getCanonicalUrl("/defense-areas/"),
    });
  } else if (page.type === "post" || page.type === "archive") {
    crumbs.push({ name: "Blog", item: getCanonicalUrl("/blog/") });
  } else if (path === "/biography/") {
    crumbs.push({ name: "Our Firm", item: getCanonicalUrl("/our-firm/") });
  }
  if (path !== "/") crumbs.push({ name: page.title, item: url });

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...crumb,
      })),
    },
    {
      "@type":
        path === "/contact-us/"
          ? "ContactPage"
          : ["/our-firm/", "/biography/"].includes(path)
            ? "AboutPage"
            : page.type === "archive" || path === "/blog/"
              ? "CollectionPage"
              : "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description,
      inLanguage: "en-US",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#firm` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      dateModified: page.modified,
      ...(page.type === "post"
        ? { mainEntity: { "@id": `${url}#article` } }
        : {}),
    },
  ];

  if (page.type === "post") {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: page.title,
      description,
      url,
      datePublished: page.date,
      dateModified: page.modified,
      author: { "@id": `${SITE_URL}/#attorney` },
      publisher: { "@id": `${SITE_URL}/#firm` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      inLanguage: "en-US",
      ...(page.hero.image
        ? { image: new URL(page.hero.image, `${SITE_URL}/`).href }
        : {}),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// Escape markup delimiters so imported text cannot terminate the script element.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
