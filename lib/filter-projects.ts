import type Fuse from "fuse.js";
import type { Project } from "@/types/github";

export interface FilterProjectsArgs {
  projects: Project[];
  query: string;
  category: string;
  language: string;
  topics: string[];
  fuse: Fuse<Project>;
}

export function filterProjects({
  projects,
  query,
  category,
  language,
  topics,
  fuse,
}: FilterProjectsArgs): Project[] {
  const searched = query.trim()
    ? fuse.search(query.trim()).map((result) => result.item)
    : projects;

  return searched
    .filter((project) => category === "All" || project.category === category)
    .filter(
      (project) => language === "All" || project.stats.language === language
    )
    .filter(
      (project) =>
        topics.length === 0 ||
        project.stats.topics.some((topic) => topics.includes(topic))
    );
}
