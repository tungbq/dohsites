import { test } from "node:test";
import assert from "node:assert/strict";
import Fuse from "fuse.js";
import { filterProjects } from "./filter-projects.ts";

function makeProject(overrides) {
  return {
    repo: "repo",
    title: "Title",
    blurb: "blurb",
    category: "Tools",
    featured: false,
    order: 1,
    tags: [],
    stats: { language: null, stars: 0, forks: 0 },
    ...overrides,
  };
}

function makeFuse(projects) {
  return new Fuse(projects, {
    keys: ["title", "blurb", "tags"],
    threshold: 0.3,
  });
}

test("no query, no filters returns everything, order preserved", () => {
  const projects = [
    makeProject({ repo: "a", title: "Alpha" }),
    makeProject({ repo: "b", title: "Beta" }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "All",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a", "b"]);
});

test("query narrows to matching title", () => {
  const projects = [
    makeProject({ repo: "a", title: "Terraform Toolkit" }),
    makeProject({ repo: "b", title: "Kubernetes Hub" }),
  ];
  const result = filterProjects({
    projects,
    query: "terraform",
    category: "All",
    language: "All",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a"]);
});

test("category filter narrows independent of query", () => {
  const projects = [
    makeProject({ repo: "a", category: "Labs" }),
    makeProject({ repo: "b", category: "Tools" }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "Tools",
    language: "All",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["b"]);
});

test("search and category filters compose (intersection)", () => {
  const projects = [
    makeProject({ repo: "a", title: "Terraform Toolkit", category: "Toolkit" }),
    makeProject({ repo: "b", title: "Terraform Labs", category: "Labs" }),
  ];
  const result = filterProjects({
    projects,
    query: "terraform",
    category: "Toolkit",
    language: "All",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a"]);
});

test("language filter matches stats.language exactly", () => {
  const projects = [
    makeProject({ repo: "a", stats: { language: "Go", stars: 0, forks: 0 } }),
    makeProject({ repo: "b", stats: { language: "TypeScript", stars: 0, forks: 0 } }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "Go",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a"]);
});

test("impossible combination returns empty array, not an error", () => {
  const projects = [makeProject({ repo: "a", category: "Labs" })];
  const result = filterProjects({
    projects,
    query: "nonexistent-string",
    category: "Labs",
    language: "All",
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result, []);
});
