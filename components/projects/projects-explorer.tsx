"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { filterProjects } from "@/lib/filter-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { FilterButtonGroup } from "@/components/projects/filter-button-group";
import type { Project } from "@/types/github";

export function ProjectsExplorer({
  projects,
  categories,
  languages,
}: {
  projects: Project[];
  categories: string[];
  languages: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");

  const fuse = useMemo(
    () =>
      new Fuse(projects, {
        keys: ["title", "blurb", "description", "tags", "repo"],
        threshold: 0.3,
      }),
    [projects]
  );

  const filtered = filterProjects({ projects, query, category, language, fuse });

  const hasActiveFilter = query !== "" || category !== "All" || language !== "All";

  function clearAll() {
    setQuery("");
    setCategory("All");
    setLanguage("All");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects by name, tag, or description…"
            className="w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent"
          />
        </div>

        <FilterButtonGroup
          legend="Filter by category"
          options={categories}
          active={category}
          onChange={setCategory}
        />
        <FilterButtonGroup
          legend="Filter by language"
          options={languages}
          active={language}
          onChange={setLanguage}
        />

        <div className="flex items-center justify-between text-sm text-muted">
          <p aria-live="polite">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
          </p>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={clearAll}
              className="text-accent hover:underline"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted">
          No projects match these filters.{" "}
          <button type="button" onClick={clearAll} className="text-accent hover:underline">
            Clear filters
          </button>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.repo} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
