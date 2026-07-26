import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchAll, trimRepo, buildData, MissingCuratedRepoError } from "./fetch-github-data.mjs";

test("buildData joins curated projects with live repo stats (happy path)", () => {
  const profile = {
    login: "tungbq",
    name: "Tung Leo",
    avatar_url: "https://example.com/avatar.png",
    followers: 10,
    public_repos: 2,
  };
  const repos = [
    { name: "devops-basics", fork: false, stargazers_count: 100, forks_count: 5 },
    { name: "other-repo", fork: false, stargazers_count: 3, forks_count: 0 },
  ];
  const curated = [{ repo: "devops-basics" }];

  const data = buildData(profile, repos, curated);

  assert.equal(data.profile.login, "tungbq");
  assert.equal(data.profile.totalStars, 103);
  assert.ok(data.repos["devops-basics"]);
  assert.equal(data.repos["devops-basics"].stars, 100);
  assert.equal(data.repos["other-repo"], undefined);
});

test("buildData throws listing every unmatched curated slug", () => {
  const profile = { login: "tungbq", public_repos: 1, followers: 0, avatar_url: "" };
  const repos = [{ name: "real-repo", fork: false, stargazers_count: 1 }];
  const curated = [{ repo: "real-repo" }, { repo: "renamed-repo" }, { repo: "deleted-repo" }];

  assert.throws(
    () => buildData(profile, repos, curated),
    (err) =>
      err instanceof MissingCuratedRepoError &&
      /Curated repos not found on GitHub: renamed-repo, deleted-repo/.test(err.message)
  );
});

test("trimRepo drops *_url noise and keeps only the fields we need", () => {
  const raw = {
    name: "example",
    description: "An example repo",
    stargazers_count: 42,
    forks_count: 7,
    language: "TypeScript",
    topics: ["a", "b"],
    html_url: "https://github.com/x/example",
    pushed_at: "2026-01-01T00:00:00Z",
    archived: false,
    // noise that must not survive trimming
    url: "https://api.github.com/repos/x/example",
    git_url: "git://github.com/x/example.git",
    ssh_url: "git@github.com:x/example.git",
    contributors_url: "https://api.github.com/repos/x/example/contributors",
    owner: { login: "x" },
  };

  const trimmed = trimRepo(raw);

  assert.deepEqual(trimmed, {
    name: "example",
    description: "An example repo",
    stars: 42,
    forks: 7,
    language: "TypeScript",
    topics: ["a", "b"],
    htmlUrl: "https://github.com/x/example",
    pushedAt: "2026-01-01T00:00:00Z",
    archived: false,
  });
  assert.equal("url" in trimmed, false);
  assert.equal("owner" in trimmed, false);
});

test("fetchAll paginates while a Link rel=\"next\" header is present, stops otherwise", async () => {
  const pages = [
    { body: [{ name: "a" }], link: '<https://api.example.com/repos?page=2>; rel="next"' },
    { body: [{ name: "b" }], link: null },
  ];
  let call = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    const page = pages[call++];
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: (name) => (name === "link" ? page.link : name === "x-ratelimit-remaining" ? "58" : null),
      },
      json: async () => page.body,
    };
  };

  try {
    const results = await fetchAll("https://api.example.com/repos", undefined);
    assert.deepEqual(results, [{ name: "a" }, { name: "b" }]);
    assert.equal(call, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchAll throws with status and rate-limit info on a non-2xx response", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 403,
    statusText: "Forbidden",
    headers: { get: (name) => (name === "x-ratelimit-remaining" ? "0" : null) },
    json: async () => ({}),
  });

  try {
    await assert.rejects(
      () => fetchAll("https://api.example.com/repos", undefined),
      /403 Forbidden.*x-ratelimit-remaining=0/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
