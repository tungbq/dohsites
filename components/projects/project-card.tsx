import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/github";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          <a
            href={project.stats.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent"
          >
            {project.title}
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </h3>
        <Badge>{project.category}</Badge>
      </div>

      <p className="line-clamp-3 text-sm text-muted">{project.blurb}</p>

      {project.impact ? (
        <p className="text-sm font-medium text-accent">{project.impact}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-xs text-muted">
        <span>
          <span aria-hidden="true">⭐</span> {project.stats.stars}
          <span className="sr-only"> stars</span>
        </span>
        <span>
          <span aria-hidden="true">🍴</span> {project.stats.forks}
          <span className="sr-only"> forks</span>
        </span>
        {project.stats.language ? <span>{project.stats.language}</span> : null}
      </div>
    </article>
  );
}
