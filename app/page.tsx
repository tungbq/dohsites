import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { GithubStatsSection } from "@/components/sections/github-stats-section";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import {
  getAllProjects,
  getCategories,
  getFeaturedProjects,
  getLanguages,
  getProfileStats,
} from "@/lib/projects";

export default function Home() {
  const stats = getProfileStats();
  const allProjects = getAllProjects();
  const featuredProjects = getFeaturedProjects();
  const categories = getCategories();
  const languages = getLanguages();

  return (
    <>
      <HeroSection stats={stats} />
      <AboutSection />
      <TechStackSection />
      <FeaturedProjects projects={featuredProjects} />

      <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-5xl px-6 py-12">
        <h2 id="projects-heading" className="text-2xl font-semibold text-foreground">
          Projects
        </h2>
        <div className="mt-6">
          <ProjectsExplorer
            projects={allProjects}
            categories={categories}
            languages={languages}
          />
        </div>
      </section>

      <GithubStatsSection projects={allProjects} />
    </>
  );
}
