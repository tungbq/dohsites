import { contact } from "@/content/contact";
import { siteConfig } from "@/lib/site-config";

const CONTACT_LINKS = [
  { href: `mailto:${siteConfig.email}`, label: siteConfig.email, external: false },
  { href: siteConfig.socials.linkedin, label: "LinkedIn", external: true },
  { href: siteConfig.socials.x, label: "X", external: true },
  { href: siteConfig.socials.github, label: "GitHub", external: true },
];

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-5xl px-6 py-12">
      <h2 id="contact-heading" className="text-2xl font-semibold text-foreground">
        {contact.heading}
      </h2>
      <p className="mt-4 max-w-2xl text-muted">{contact.blurb}</p>
      <ul className="mt-6 flex flex-wrap gap-3">
        {CONTACT_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface hover:shadow-md"
            >
              {link.label}
              {link.external ? <span className="sr-only"> (opens in new tab)</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
