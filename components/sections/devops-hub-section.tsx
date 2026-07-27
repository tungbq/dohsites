import { Badge } from "@/components/ui/badge";
import { devopsHub } from "@/content/devops-hub";
import { siteConfig } from "@/lib/site-config";

export function DevopsHubSection() {
  return (
    <section
      id="devops-hub"
      aria-labelledby="devops-hub-heading"
      className="mx-auto max-w-5xl px-6 py-12"
    >
      <h2 id="devops-hub-heading" className="text-2xl font-semibold text-foreground">
        {devopsHub.title}
      </h2>
      <p className="mt-2 text-sm text-muted">{devopsHub.tagline}</p>
      <p className="mt-4 max-w-2xl text-muted">{devopsHub.description}</p>
      <p className="mt-3 max-w-2xl text-muted">{devopsHub.role}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {devopsHub.topics.map((topic) => (
          <li key={topic}>
            <Badge>{topic}</Badge>
          </li>
        ))}
      </ul>

      <a
        href={siteConfig.socials.website}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-md border border-accent-2/40 px-4 py-2 text-sm font-medium text-accent-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2 hover:text-background hover:shadow-lg hover:shadow-accent-2/30"
      >
        Visit {devopsHub.title}
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    </section>
  );
}
