import { ArrowUpRight } from "lucide-react";
import { devopsHub } from "@/content/devops-hub";
import { getCollectionStats } from "@/lib/projects";

const numberFormat = new Intl.NumberFormat("en-US");

export function DevopsHubSection() {
  const stats = getCollectionStats();

  const figures = [
    { label: "stars", value: numberFormat.format(stats.stars) },
    { label: "repos", value: numberFormat.format(stats.repos) },
    { label: "topics", value: numberFormat.format(stats.topics) },
  ];

  return (
    <section
      id="devops-hub"
      aria-labelledby="devops-hub-heading"
      className="mx-auto max-w-5xl px-6 py-12"
    >
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="devops-hub-heading"
              className="text-2xl font-semibold text-foreground"
            >
              {devopsHub.title}
            </h2>
            <p className="mt-1 text-accent-2">{devopsHub.tagline}</p>
          </div>

          <a
            href={devopsHub.links.home}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-accent-2/40 px-4 py-2 text-sm font-medium text-accent-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2 hover:text-background hover:shadow-lg hover:shadow-accent-2/30"
          >
            Visit the hub
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>

        <p className="mt-4 max-w-2xl text-muted">{devopsHub.description}</p>
        <p className="mt-3 max-w-2xl text-muted">{devopsHub.role}</p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {figures.map((figure) => (
            <div key={figure.label} className="flex flex-col">
              <dt className="order-2 text-sm text-muted">{figure.label}</dt>
              <dd className="order-1 text-2xl font-semibold text-foreground">
                {figure.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-muted">
          Across the projects curated on this page, refreshed daily from GitHub.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={devopsHub.links.projects}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-2 hover:shadow-lg hover:shadow-accent-2/30"
          >
            Explore Projects
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <a
            href={devopsHub.links.learningPaths}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-background hover:shadow-md"
          >
            Learning Paths
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
