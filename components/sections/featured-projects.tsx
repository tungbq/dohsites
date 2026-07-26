import { ProjectCard } from "@/components/projects/project-card";
import type { Project } from "@/types/github";

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-5xl px-6 py-12">
      <h2 id="featured-heading" className="text-2xl font-semibold text-foreground">
        Featured
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.repo} project={project} />
        ))}
      </div>
    </section>
  );
}
