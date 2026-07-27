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
    stats: { language: null, stars: 0, forks: 0, topics: [] },
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
    topics: [],
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
    topics: [],
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
    topics: [],
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
    topics: [],
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
    topics: [],
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
    topics: [],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result, []);
});

test("single topic selected narrows to matching projects", () => {
  const projects = [
    makeProject({ repo: "a", stats: { language: null, stars: 0, forks: 0, topics: ["docker", "iac"] } }),
    makeProject({ repo: "b", stats: { language: null, stars: 0, forks: 0, topics: ["kubernetes"] } }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "All",
    topics: ["docker"],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a"]);
});

test("two topics selected is OR (matches either)", () => {
  const projects = [
    makeProject({ repo: "a", stats: { language: null, stars: 0, forks: 0, topics: ["docker"] } }),
    makeProject({ repo: "b", stats: { language: null, stars: 0, forks: 0, topics: ["kubernetes"] } }),
    makeProject({ repo: "c", stats: { language: null, stars: 0, forks: 0, topics: ["terraform"] } }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "All",
    topics: ["docker", "kubernetes"],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo).sort(), ["a", "b"]);
});

test("topics compose with search and category as AND across dimensions", () => {
  const projects = [
    makeProject({
      repo: "a",
      title: "Terraform Toolkit",
      category: "Toolkit",
      stats: { language: null, stars: 0, forks: 0, topics: ["docker"] },
    }),
    makeProject({
      repo: "b",
      title: "Terraform Labs",
      category: "Labs",
      stats: { language: null, stars: 0, forks: 0, topics: ["docker"] },
    }),
    makeProject({
      repo: "c",
      title: "Terraform Toolkit Two",
      category: "Toolkit",
      stats: { language: null, stars: 0, forks: 0, topics: ["kubernetes"] },
    }),
  ];
  const result = filterProjects({
    projects,
    query: "terraform",
    category: "Toolkit",
    language: "All",
    topics: ["docker"],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["a"]);
});

test("empty topics array is passthrough, changes nothing", () => {
  const projects = [
    makeProject({ repo: "a", stats: { language: null, stars: 0, forks: 0, topics: [] } }),
    makeProject({ repo: "b", stats: { language: null, stars: 0, forks: 0, topics: ["docker"] } }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "All",
    topics: [],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo).sort(), ["a", "b"]);
});

test("project with no topics is excluded (not crashed) when a topic filter is active", () => {
  const projects = [
    makeProject({ repo: "a", stats: { language: null, stars: 0, forks: 0, topics: [] } }),
    makeProject({ repo: "b", stats: { language: null, stars: 0, forks: 0, topics: ["docker"] } }),
  ];
  const result = filterProjects({
    projects,
    query: "",
    category: "All",
    language: "All",
    topics: ["docker"],
    fuse: makeFuse(projects),
  });
  assert.deepEqual(result.map((p) => p.repo), ["b"]);
});
