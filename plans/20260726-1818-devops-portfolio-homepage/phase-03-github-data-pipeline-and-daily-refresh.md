# Phase 03 — GitHub Data Pipeline & Daily Refresh

## Context Links

- Plan: [plan.md](plan.md) · Depends on: [phase-01](phase-01-project-scaffold-and-static-export-config.md), [phase-02](phase-02-github-pages-deployment-pipeline.md)
- Research: [researcher-02 §1 Build-time fetching](research/researcher-02-github-data-ux-patterns.md), [§2 Scheduled workflows](research/researcher-02-github-data-ux-patterns.md)
- Consumed by: [phase-05](phase-05-homepage-content-sections.md)
- Runs in parallel with: [phase-04](phase-04-core-layout-seo-metadata-dark-mode.md) (disjoint files)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~2.5h
- **Description:** Fetch tungbq's profile + repo stats from the GitHub REST API at build time, join with a hand-curated project manifest, emit a trimmed `data/github.json`, and refresh it daily via cron on the existing deploy workflow.

## Key Insights

1. **Two sources of truth, joined by repo name.** The *curated manifest* (`content/projects.ts`, hand-written) decides **what** appears, its category, ordering, and impact metric. The *API* supplies **live numbers** (stars, forks, language, topics, description, pushed_at). Neither can do the other's job: the API can't know "reduced deploy time 60%", and a human shouldn't hand-maintain star counts.
2. **The join is the failure point.** If a curated repo is renamed/archived/deleted on GitHub, the join silently yields `undefined` and the site ships cards with `0 ⭐` and no description. The script MUST fail loudly, listing every unmatched slug, rather than degrade quietly.
3. **Every build fetches; commit-back only on schedule.** Fetching on push keeps content fresh without a bot commit per deploy. Committing back on the cron run gives version history and lets `npm run dev` work offline with no token. Pushes made with `GITHUB_TOKEN` do not retrigger workflows — no recursion risk, and no need for the commit to trigger a deploy because the same run deploys.
4. **A failed fetch must not take the site down.** Build-time fetch errors block deployment (researcher-01 §1 gotcha 1). Degradation rule: if the API fails **and** `data/github.json` already exists → warn, keep the existing file, exit 0. If it fails and no file exists → exit 1. Freshness is worth less than availability.
5. **Trim the payload.** Raw `/users/:u/repos` for ~247 repos is ~1.5 MB of JSON, 95% of it irrelevant (`*_url` fields). Store only ~10 fields per repo, and only for curated repos + aggregate totals → ~15–25 KB. Keeps diffs readable and the git history light at 365 commits/year.
6. **No dependencies.** Node 22 has native `fetch`. No `octokit`, no `zod` — a 120-line script with explicit assertions is smaller than the config needed to use a library (YAGNI).
7. **`per_page=100`, not 30.** ~247 repos = 3 requests, not 9. Unauthenticated 60/hr is ample locally; CI uses the auto-provided `secrets.GITHUB_TOKEN` (5000/hr).

## Requirements

**Functional**
- `node scripts/fetch-github-data.mjs` writes `data/github.json` with profile aggregate + per-repo live stats for every curated project.
- Script works with and without `GITHUB_TOKEN`.
- Unmatched curated slugs abort the build with a listing.
- Deploy workflow runs the fetch before `next build`; cron `0 5 * * *` triggers a daily rebuild+deploy; changed JSON is committed back on scheduled runs only.
- `lib/projects.ts` exposes typed, sorted project data to server components.

**Non-functional**
- `data/github.json` < 50 KB.
- Fetch completes < 10 s.
- Deterministic output (stable key order) so unchanged data produces an empty diff.

## Architecture

```
content/projects.ts        GitHub REST API
(curated: slug, category,  /users/tungbq
 blurb, impact, featured,  /users/tungbq/repos?per_page=100 (paginated)
 order, tags)                     │
        └──────────┬──────────────┘
                   ▼
       scripts/fetch-github-data.mjs
       · paginate  · trim fields  · join by name (case-insensitive)
       · assert every curated slug matched  · stable-sort keys
                   ▼
             data/github.json          ← committed to repo
                   ▼
             lib/projects.ts           ← readFileSync at module scope (server-only)
                   ▼
       app/page.tsx (RSC) → phase-05 sections → static HTML
```

**`data/github.json` shape:**
```jsonc
{
  "generatedAt": "2026-07-26T05:00:00.000Z",
  "profile": { "login": "tungbq", "name": "...", "avatarUrl": "...",
               "followers": 270, "publicRepos": 247, "totalStars": 2400 },
  "repos": {
    "devops-basics": { "name": "devops-basics", "description": "...", "stars": 1868,
                       "forks": 210, "language": "Markdown", "topics": ["devops"],
                       "htmlUrl": "...", "pushedAt": "...", "archived": false }
  }
}
```
Keyed map, not array — the join in `lib/projects.ts` is O(1) and the curated file controls ordering.

**Workflow delta (edits phase-02's `deploy.yml`):**
```yaml
on:
  push: { branches: [main] }
  schedule: [{ cron: '0 5 * * *' }]
  workflow_dispatch:
# build job:
  - run: npm run build            # = fetch + next build
    env: { GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
  - name: Commit refreshed data
    if: github.event_name == 'schedule'
    run: |
      git config user.name  "github-actions[bot]"
      git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
      git add data/github.json
      git diff --staged --quiet || (git commit -m "chore: refresh github data" && git push)
```
Requires `contents: write` — scope it on the **build job**, keep workflow-level at `contents: read`.

## Related Code Files

**Create**
- `scripts/fetch-github-data.mjs`
- `scripts/fetch-github-data.test.mjs` (`node --test`, pure join/trim functions)
- `content/projects.ts` (curated manifest, ~15–20 entries)
- `lib/projects.ts` (typed accessor)
- `types/github.ts`
- `data/github.json` (generated, committed)

**Modify**
- `.github/workflows/deploy.yml` — add `schedule`, `GITHUB_TOKEN` env, flip to `npm run build`, add guarded commit step, add `contents: write` to build job

**Do NOT touch** — `package.json` (scripts pre-written in phase-01), anything under `app/` or `components/` (phase-04/05 own those)

## Implementation Steps

1. **`types/github.ts`** — `RepoStats`, `GithubData`, `CuratedProject`, `Project` (= curated + stats merged).
2. **`content/projects.ts`** — curate 15–20 repos. Per entry: `repo` (exact GitHub name), `title`, `blurb` (1–2 sentences, hand-written — do not reuse the GitHub description verbatim), `category` (`Basics | Labs | Practice | Toolkit | Hubs | Tools`), `impact` (optional metric string), `featured` (bool, max 3 true), `order` (number), `tags` (string[] for filtering). Categories per researcher-02 §5.
3. **`scripts/fetch-github-data.mjs`**, exporting pure helpers for tests:
   - `fetchAll(url, token)` — paginates via `Link` header `rel="next"`; throws on non-2xx with status + `x-ratelimit-remaining` in the message.
   - `trimRepo(raw)` — picks the ~10 fields.
   - `buildData(profile, repos, curated)` — joins case-insensitively, throws `Curated repos not found on GitHub: a, b` listing all misses.
   - `main()` — try/catch: on failure, if `data/github.json` exists → `console.warn` + exit 0; else exit 1.
   - Write with `JSON.stringify(data, null, 2) + '\n'`, keys sorted, `generatedAt` from `new Date().toISOString()`.
   - **Note:** `generatedAt` changes every run → the file always diffs → the "commit only if changed" guard never no-ops. Fix: round `generatedAt` to the date only (`YYYY-MM-DD`), or exclude it from the diff check by comparing the object minus that key. Round to date — simplest, and daily granularity is all the cron provides.
4. **`scripts/fetch-github-data.test.mjs`** — `node --test`. Cases: join happy path; missing curated repo throws with names; `trimRepo` drops `*_url` noise; pagination stops when no `rel="next"`.
5. **`lib/projects.ts`** — `import data from '@/data/github.json'` (or `readFileSync` if JSON import assertions bite), merge with `content/projects.ts`, export `getFeaturedProjects()`, `getAllProjects()` (sorted by `order`), `getProfileStats()`, `getCategories()`, `getLanguages()`. Server-only; no `'use client'`.
6. **Run locally unauthenticated** to prove the no-token path: `node scripts/fetch-github-data.mjs`. Inspect `data/github.json` size and content.
7. **Test the failure path deliberately:** add a bogus slug to `content/projects.ts`, confirm the script exits 1 with a readable message, then remove it.
8. **Test the degradation path:** temporarily point the API base at an invalid host with `data/github.json` present → warns and exits 0; delete the file → exits 1.
9. **Edit `deploy.yml`** per the Architecture delta. Add `permissions: contents: write` on the build job only.
10. **Trigger `workflow_dispatch`** → build must consume the fetched data and deploy. Then verify the schedule path by temporarily setting the cron a few minutes out, or accept next-day verification (document which was done).
11. **Commit `data/github.json`** so `npm run dev` works with no network.

## Todo List

- [ ] `types/github.ts` defined
- [ ] `content/projects.ts` curated (15–20 repos, ≤3 featured, categories assigned)
- [ ] `scripts/fetch-github-data.mjs` with pagination, trim, join, loud-fail, graceful-degrade
- [ ] `generatedAt` at date granularity (no spurious daily diffs)
- [ ] `scripts/fetch-github-data.test.mjs` — 4 cases green via `npm test`
- [ ] `lib/projects.ts` typed accessors
- [ ] `data/github.json` generated (< 50 KB) and committed
- [ ] Missing-slug path verified to exit 1 with names
- [ ] API-failure-with-cache path verified to exit 0
- [ ] `deploy.yml`: `schedule` cron, `GITHUB_TOKEN` env, `npm run build`, guarded commit-back, job-scoped `contents: write`
- [ ] `workflow_dispatch` run green with real data on the live site

## Success Criteria

| Criterion | Verification |
|---|---|
| Data fetched + joined | `data/github.json` contains an entry for every curated repo |
| Payload trimmed | file size < 50 KB |
| Loud failure on bad slug | script exits 1, message names the slug |
| Graceful degradation | API down + cache present → exit 0, previous file intact |
| Tests pass | `npm test` exits 0 |
| Live numbers on site | deployed page shows current star counts (spot-check 2 repos vs github.com) |
| Cron wired | `deploy.yml` contains `cron: '0 5 * * *'`; scheduled run appears in Actions |
| No commit noise | two consecutive scheduled runs with unchanged stars produce zero commits |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Curated repo renamed → silent empty cards | Med × High | Hard fail listing unmatched slugs (step 3); build stops before deploy |
| API failure blocks all deploys | Med × High | Degrade to committed cache, exit 0 (step 3/8) |
| `generatedAt` timestamp → daily empty-diff commits | High × Low | Date-granularity timestamp (step 3) |
| Scheduled workflow auto-disabled after 60 days of repo inactivity | Med × Med | Documented in README; `workflow_dispatch` is the manual escape hatch; commit-back on schedule counts as activity and keeps it alive |
| GH cron drift 5–15 min (no SLA) | High × Low | Accept — daily portfolio data has no freshness SLA |
| Rate limit hit locally during iteration | Low × Low | 3 requests/run unauth; set a local `GITHUB_TOKEN` in `.env.local` if it bites |
| `contents: write` broadens blast radius | Low × Med | Scoped to build job only; only `data/github.json` is `git add`ed |
| Repos grow past 500 → more pages | Low × Low | Pagination already generic; ETag/conditional requests deferred (researcher-02 §Q4) |

## Security Considerations

- Use the **auto-injected `secrets.GITHUB_TOKEN`**, not a personal PAT. It is scoped to this repo and expires with the job.
- Never log the token; never echo the `Authorization` header. Log only `x-ratelimit-remaining`.
- Token is used **only** at build time in CI — it never reaches the client bundle. `lib/projects.ts` is server-only; nothing in `data/github.json` is secret (all public API data).
- `.env.local` (optional local token) is gitignored per phase-01.
- Bot commits are attributed to `github-actions[bot]` with the canonical noreply email — no impersonation of a human author.
- Fetched strings (descriptions, topics) are rendered as React text, never via `dangerouslySetInnerHTML` — no injection surface from upstream repo metadata.

## Rollback

- Revert `deploy.yml` to the phase-02 version and switch `build` → `build:nofetch`; site deploys from committed JSON.
- Bad data committed by the bot → `git revert` that commit and re-run the workflow.
- Cron misbehaving → delete the `schedule:` trigger; push-triggered deploys are unaffected.

## Next Steps

- **Unblocks:** phase-05 (consumes `lib/projects.ts`).
- **Hand-off to phase-05:** `getFeaturedProjects()`, `getAllProjects()`, `getProfileStats()`, `getCategories()`, `getLanguages()` — all synchronous, server-only.
- **Open question carried:** if native HTML stat widgets are chosen over github-readme-stats (plan.md Q5), `getProfileStats()` already supplies totals — no extra data work.
