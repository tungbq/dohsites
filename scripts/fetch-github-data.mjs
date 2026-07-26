import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const GITHUB_USER = "tungbq";
const API_BASE = process.env.GITHUB_API_BASE ?? "https://api.github.com";
const OUTPUT_PATH = new URL("../data/github.json", import.meta.url);

// Distinguishes "our curated list references a repo GitHub no longer has"
// (a content bug -- always fails the build, cache or not) from a transient
// API/network failure (which degrades to the committed cache, see main()).
export class MissingCuratedRepoError extends Error {}

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(",")) {
    const [, url, rel] = part.match(/<([^>]+)>;\s*rel="([^"]+)"/) ?? [];
    if (rel === "next") return url;
  }
  return null;
}

export async function fetchAll(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `token ${token}`;

  const results = [];
  let next = url;
  while (next) {
    const res = await fetch(next, { headers });
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (!res.ok) {
      throw new Error(
        `GitHub API request failed: ${res.status} ${res.statusText} (${next}), x-ratelimit-remaining=${remaining}`
      );
    }
    console.warn(`fetched ${next} (x-ratelimit-remaining=${remaining})`);
    const body = await res.json();
    if (Array.isArray(body)) results.push(...body);
    else return body; // single-object endpoint (profile)
    next = parseNextLink(res.headers.get("link"));
  }
  return results;
}

export function trimRepo(raw) {
  return {
    name: raw.name,
    description: raw.description ?? null,
    stars: raw.stargazers_count ?? 0,
    forks: raw.forks_count ?? 0,
    language: raw.language ?? null,
    topics: raw.topics ?? [],
    htmlUrl: raw.html_url,
    pushedAt: raw.pushed_at,
    archived: raw.archived ?? false,
  };
}

export function buildData(profileRaw, reposRaw, curated) {
  const nonForkRepos = reposRaw.filter((r) => !r.fork);
  const trimmed = nonForkRepos.map(trimRepo);
  const byLowerName = new Map(trimmed.map((r) => [r.name.toLowerCase(), r]));

  const repos = {};
  const missing = [];
  for (const project of curated) {
    const stats = byLowerName.get(project.repo.toLowerCase());
    if (!stats) {
      missing.push(project.repo);
      continue;
    }
    repos[project.repo] = stats;
  }
  if (missing.length > 0) {
    throw new MissingCuratedRepoError(
      `Curated repos not found on GitHub: ${missing.join(", ")}`
    );
  }

  const totalStars = nonForkRepos.reduce(
    (sum, r) => sum + (r.stargazers_count ?? 0),
    0
  );

  const sortedRepos = Object.fromEntries(
    Object.keys(repos)
      .sort()
      .map((key) => [key, repos[key]])
  );

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    profile: {
      login: profileRaw.login,
      name: profileRaw.name ?? null,
      avatarUrl: profileRaw.avatar_url,
      followers: profileRaw.followers ?? 0,
      publicRepos: profileRaw.public_repos ?? 0,
      totalStars,
    },
    repos: sortedRepos,
  };
}

export async function main() {
  const token = process.env.GITHUB_TOKEN;
  const { projects: curated } = await import("../content/projects.ts");

  const profile = await fetchAll(`${API_BASE}/users/${GITHUB_USER}`, token);
  const repos = await fetchAll(
    `${API_BASE}/users/${GITHUB_USER}/repos?per_page=100&type=owner`,
    token
  );

  const data = buildData(profile, repos, curated);
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n");
  console.warn(`wrote ${OUTPUT_PATH.pathname} (${curated.length} curated repos)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    if (err instanceof MissingCuratedRepoError) {
      // A content bug (renamed/deleted repo in content/projects.ts), not a
      // transient API failure -- always fails the build, cache or not.
      process.exit(1);
    }
    if (existsSync(OUTPUT_PATH)) {
      console.warn("keeping existing data/github.json, deploy continues");
      process.exit(0);
    }
    process.exit(1);
  });
}
