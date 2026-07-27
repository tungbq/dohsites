"use client";

import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { filterProjects, SORT_OPTIONS, type SortBy } from "@/lib/filter-projects";
import { ProjectCard } from "@/components/projects/project-card";
import { FilterButtonGroup } from "@/components/projects/filter-button-group";
import { TagCloud } from "@/components/projects/tag-cloud";
import type { Project } from "@/types/github";

const SORT_LABEL: Record<SortBy, string> = {
  default: "Default",
  updated: "Recently updated",
  stars: "Most stars",
  name: "Name (A–Z)",
};

export function ProjectsExplorer({
  projects,
  categories,
  languages,
  topics,
}: {
  projects: Project[];
  categories: string[];
  languages: string[];
  topics: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [language, setLanguage] = useState("All");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("default");

  const fuse = useMemo(
    () =>
      new Fuse(projects, {
        keys: ["title", "blurb", "description", "tags", "repo"],
        threshold: 0.3,
      }),
    [projects]
  );

  const filtered = filterProjects({
    projects,
    query,
    category,
    language,
    topics: selectedTopics,
    sortBy,
    fuse,
  });

  const hasActiveFilter =
    query !== "" || category !== "All" || language !== "All" || selectedTopics.length > 0;

  function toggleTopic(topic: string) {
    setSelectedTopics((current) =>
      current.includes(topic) ? current.filter((t) => t !== topic) : [...current, topic]
    );
  }

  function clearAll() {
    setQuery("");
    setCategory("All");
    setLanguage("All");
    setSelectedTopics([]);
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
        <TagCloud
          legend="Filter by topic"
          options={topics}
          active={selectedTopics}
          onToggle={toggleTopic}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p aria-live="polite">
            {filtered.length} project{filtered.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-3">
            <label htmlFor="project-sort" className="sr-only">
              Sort projects
            </label>
            <select
              id="project-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-foreground"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Sort: {SORT_LABEL[option]}
                </option>
              ))}
            </select>
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
