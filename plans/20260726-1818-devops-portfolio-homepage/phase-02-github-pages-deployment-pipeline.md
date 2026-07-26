# Phase 02 — GitHub Pages Deployment Pipeline

## Context Links

- Plan: [plan.md](plan.md) · Depends on: [phase-01](phase-01-project-scaffold-and-static-export-config.md)
- Research: [researcher-01 §2 GitHub Pages Deployment Path & Workflow](research/researcher-01-nextjs-seo-deployment.md)
- Extended by: [phase-03](phase-03-github-data-pipeline-and-daily-refresh.md) (adds fetch + cron to the same workflow file)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~1.5h
- **Description:** Ship the empty shell to `https://tungbq.github.io/dohsites` via GitHub Actions + official Pages actions. Deliberately sequenced before any content so path/prefix failures are isolated.

## Key Insights

1. **Deploy the walking skeleton first.** Every GH Pages static-export failure mode (`_next/` blocked by Jekyll, missing `basePath`, trailing-slash 404, Pages source set to branch instead of Actions) presents identically as "blank page / 404". Debugging that against 3 files is minutes; against a finished homepage it's hours of false leads.
2. **Pages source must be switched to "GitHub Actions" in repo settings.** This is a manual UI step (Settings → Pages → Source). No amount of workflow YAML substitutes for it — first deploy fails or silently serves the old branch content otherwise. It is the single most common setup miss.
3. **One workflow file, not two.** researcher-02 proposes a separate `scheduled-rebuild.yml`. Two workflows that both build and both call `deploy-pages` will race on the `pages` concurrency group and duplicate ~90% of their steps (DRY violation). phase-03 adds `schedule:` and a fetch step to *this* file instead.
4. **`concurrency: group: pages, cancel-in-progress: false`.** researcher-01 suggests `true`. Cancelling an in-flight *deploy* can leave the Pages environment in a half-updated state; cancel-in-progress is safe for builds, not for deployments. Use `false` — a queued deploy is cheap.
5. **Pinned action majors only:** `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. researcher-02's snippet uses `deploy-pages@v3` — mismatched with `upload-pages-artifact@v3`'s expected consumer; use v4.
6. **Node version in CI must match `.nvmrc`.** Use `node-version-file: '.nvmrc'` rather than a hardcoded `'20'`/`'18'` in two places.

## Requirements

**Functional**
- Push to `main` builds and publishes `out/` to GitHub Pages.
- `workflow_dispatch` allows manual redeploy without a code change.
- Site reachable at `https://tungbq.github.io/dohsites/` with all assets 200.

**Non-functional**
- Workflow completes < 3 min on a cold cache.
- Least-privilege permissions (`contents: read` at this stage).
- No third-party actions.

## Architecture

```
push main / manual
        │
        ▼
  job: build ──────────────────────────────────────────┐
   checkout → setup-node(.nvmrc, cache npm) → npm ci    │
   → npm run build:nofetch → upload-pages-artifact(out) │
        │                                               │
        ▼                                               │
  job: deploy (needs: build, env: github-pages)         │
   deploy-pages@v4 ──▶ https://tungbq.github.io/dohsites
```

`permissions: contents: read, pages: write, id-token: write` — `id-token` is required for the OIDC handshake `deploy-pages` performs; omitting it fails with an opaque auth error.

## Related Code Files

**Create**
- `.github/workflows/deploy.yml`

**Modify**
- `README.md` — deploy badge + live URL + "Pages source must be GitHub Actions" note

**Owned by this phase** — `.github/workflows/**` (phase-03 extends `deploy.yml` sequentially; no parallel writer)

## Implementation Steps

1. Create `.github/workflows/deploy.yml`:
   - `on: push: branches: [main]` + `workflow_dispatch`
   - `permissions: { contents: read, pages: write, id-token: write }`
   - `concurrency: { group: pages, cancel-in-progress: false }`
   - **build job:** `actions/checkout@v4` → `actions/setup-node@v4` with `node-version-file: '.nvmrc'`, `cache: 'npm'` → `npm ci` → `npm run build:nofetch` → `actions/upload-pages-artifact@v3` with `path: ./out`
   - **deploy job:** `needs: build`, `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, `actions/deploy-pages@v4` with `id: deployment`
2. Commit + push to `main`.
3. **Repo Settings → Pages → Source → "GitHub Actions".** Do this before judging the first run.
4. Watch the run in the Actions tab. If build passes but the site 404s, check in this order: Pages source setting → `.nojekyll` in artifact → `assetPrefix` in built HTML → trailing slash.
5. Verify live:
   ```bash
   curl -sI https://tungbq.github.io/dohsites/ | head -1              # 200
   curl -s https://tungbq.github.io/dohsites/ | grep -o '/dohsites/_next/[^"]*' | head -3
   ```
   Then fetch one of those asset URLs and confirm 200 (not 404).
6. Open the URL in a browser with devtools Network tab — zero failed requests.
7. Re-run via `workflow_dispatch` once to prove manual redeploy works (phase-03's cron relies on the same path).
8. Add the badge + URL to `README.md`.

## Todo List

- [ ] `.github/workflows/deploy.yml` created with pinned v4/v3 actions
- [ ] `node-version-file: .nvmrc` used (no duplicated version literal)
- [ ] `concurrency` set with `cancel-in-progress: false`
- [ ] Pushed to `main`; workflow run green
- [ ] Repo Settings → Pages → Source = GitHub Actions
- [ ] `https://tungbq.github.io/dohsites/` returns 200
- [ ] `_next/` asset URL returns 200 (Jekyll not interfering)
- [ ] Browser devtools shows zero failed requests
- [ ] `workflow_dispatch` manual run verified
- [ ] README updated with live URL + badge

## Success Criteria

| Criterion | Verification |
|---|---|
| Pipeline green end-to-end | Actions run shows build + deploy success |
| Site live | `curl -sI .../dohsites/` → `HTTP/2 200` |
| Assets resolve | at least one `_next/static/...` URL → 200 |
| No Jekyll interference | `_next/` directory reachable |
| Manual trigger works | `workflow_dispatch` run green |
| Deploy time | < 3 min cold |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Pages source left on "Deploy from branch" → deploy no-ops or 404 | High × High | Explicit step 3 + README note; first troubleshooting check in step 4 |
| Missing `id-token: write` → opaque OIDC failure | Med × High | Permissions block specified verbatim; symptom documented |
| Missing `.nojekyll` → all `_next/` assets 404 | Med × High | Created in phase-01; step 5 asserts an asset URL is 200 |
| `deploy-pages` version mismatch with artifact action | Low × High | Pin `upload-pages-artifact@v3` + `deploy-pages@v4` (correct pairing) |
| Concurrent runs corrupt Pages env | Low × Med | `concurrency: pages` with `cancel-in-progress: false` |
| Build passes locally, fails in CI (case-sensitive FS) | Med × Med | Linux runner catches it; keep all file/import names lowercase-kebab |
| First deploy propagation delay misread as failure | Med × Low | Allow 5–10 min before debugging (documented in README) |

## Security Considerations

- `permissions` declared at workflow level, least-privilege. `contents: write` is **not** granted here — phase-03 raises it only for the job that commits data.
- No secrets referenced in this phase. `secrets.GITHUB_TOKEN` enters in phase-03.
- Only first-party `actions/*`, pinned by major tag. No `peaceiris/*` or other third-party publishers.
- Public repo → workflow logs are public. Never `echo` env/tokens.
- `environment: github-pages` gives an audit trail of every deployment.

## Rollback

- Bad deploy → revert the offending commit and push; workflow redeploys the previous state.
- Or re-run the last known-good workflow run from the Actions tab (artifact-based redeploy).
- Nuclear: Settings → Pages → unpublish site. No data loss; the site is a pure build product.

## Next Steps

- **Unblocks:** phase-03 (extends this workflow) and phase-04 (independent, parallel).
- **Hand-off to phase-03:** workflow path `.github/workflows/deploy.yml`; build step currently `npm run build:nofetch` — phase-03 flips it to `npm run build` and adds `schedule` + a guarded commit-back step.
