import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
  { href: "#devops-hub", label: "DevOps Hub" },
  { href: "#stack", label: "Stack" },
  { href: "#projects", label: "Projects" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-foreground">
          {siteConfig.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-2 transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
