import { ProjectCard } from "@/components/projects/project-card";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import type { Project } from "@/types/github";

const STAGGER_STEP_MS = 80;

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-5xl px-6 pt-12 pb-4">
      <h2 id="featured-heading" className="text-2xl font-semibold text-foreground">
        Featured
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <RevealOnScroll key={project.repo} delayMs={index * STAGGER_STEP_MS}>
            <ProjectCard project={project} />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
