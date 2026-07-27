import { siteConfig } from "@/lib/site-config";

// Static content only, sourced from siteConfig -- no user or API input
// ever reaches this dangerouslySetInnerHTML.
export function PersonJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.author,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    jobTitle: "DevOps Engineer",
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.location,
    },
    sameAs: [
      siteConfig.socials.github,
      siteConfig.socials.linkedin,
      siteConfig.socials.x,
      siteConfig.socials.website,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
