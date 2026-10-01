export const navigation = [
  { label: "Home", href: "/" },
  { label: "Our Firm", href: "/our-firm/" },
  { label: "Defense Areas", href: "/defense-areas/" },
  { label: "Case Results", href: "/case-results/" },
  { label: "FAQs", href: "/faqs/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact Us", href: "/contact-us/" },
];

export const practiceGroups = [
  {
    title: "Criminal Defense",
    items: [
      { label: "DUI Cases", href: "/dui-cases/" },
      { label: "DMV Hearings", href: "/dmv-hearings/" },
      { label: "Felony Charges", href: "/felony-charges/" },
      { label: "Misdemeanors", href: "/misdemeanors/" },
    ],
  },
  {
    title: "Family Law",
    items: [
      { label: "Child Custody", href: "/child-custody/" },
      { label: "Child Visitations", href: "/child-visitations/" },
      { label: "Child Support", href: "/child-support/" },
      { label: "Restraining Orders", href: "/restraining-orders/" },
    ],
  },
  {
    title: "Personal Injury",
    items: [
      { label: "Vehicle Accidents", href: "/vehicle-accidents/" },
      { label: "Oil Field Accidents", href: "/oilfield-accidents/" },
      { label: "Industrial Accidents", href: "/industrial-accident/" },
    ],
  },
];

export const practiceLinks = practiceGroups.flatMap((group) => group.items);
export const office = {
  name: "The Law Offices of B. Scott Winkler",
  phone: "(661) 746-0235",
  phoneHref: "tel:+16617460235",
  email: "shafterlaw@gmail.com",
  street: "400 Central Valley Hwy",
  locality: "Shafter, CA 93263",
  mapHref:
    "https://www.google.com/maps/search/?api=1&query=400+Central+Valley+Hwy+Shafter+CA+93263",
};
