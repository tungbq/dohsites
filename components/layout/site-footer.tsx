import { siteConfig } from "@/lib/site-config";

const SOCIAL_LINKS = [
  { href: siteConfig.socials.github, label: "GitHub" },
  { href: siteConfig.socials.linkedin, label: "LinkedIn" },
  { href: siteConfig.socials.x, label: "X" },
  { href: siteConfig.socials.website, label: "Website" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.author}. Project data
          refreshed daily from GitHub.
        </p>
        <nav aria-label="Social links" className="flex gap-4">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
