import { HeroSection } from "@/components/sections/hero-section";
import { AboutSection } from "@/components/sections/about-section";
import { ContactSection } from "@/components/sections/contact-section";
import { DevopsHubSection } from "@/components/sections/devops-hub-section";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { GithubStatsSection } from "@/components/sections/github-stats-section";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import { sections } from "@/content/sections";
import {
  getAllProjects,
  getCategories,
  getFeaturedProjects,
  getLanguages,
  getProfileStats,
  getTopics,
} from "@/lib/projects";

export default function Home() {
  const stats = getProfileStats();
  const allProjects = getAllProjects();
  const featuredProjects = getFeaturedProjects();
  const categories = getCategories();
  const languages = getLanguages();
  const topics = getTopics();

  return (
    <>
      <HeroSection stats={stats} />
      <RevealOnScroll>
        <AboutSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <ContactSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <DevopsHubSection />
      </RevealOnScroll>
      <RevealOnScroll>
        <TechStackSection />
      </RevealOnScroll>
      <FeaturedProjects projects={featuredProjects} />

      <RevealOnScroll>
        <section id="projects" aria-labelledby="projects-heading" className="mx-auto max-w-5xl px-6 pt-4 pb-12">
          <h2 id="projects-heading" className="text-2xl font-semibold text-foreground">
            {sections.projects.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{sections.projects.intro}</p>
          <div className="mt-6">
            <ProjectsExplorer
              projects={allProjects}
              categories={categories}
              languages={languages}
              topics={topics}
            />
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll>
        <GithubStatsSection projects={allProjects} />
      </RevealOnScroll>
    </>
  );
}
