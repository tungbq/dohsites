# Phase 01 — Project Scaffold & Static Export Config

## Context Links

- Plan: [plan.md](plan.md)
- Research: [researcher-01 §1 Static Export Mechanics](research/researcher-01-nextjs-seo-deployment.md), [§6 Tailwind v4](research/researcher-01-nextjs-seo-deployment.md)
- Next depends on this: phase-02 (deploy), phase-03 (data), phase-04 (layout)

## Overview

- **Priority:** P1 (blocks everything)
- **Status:** pending
- **Effort:** ~2h
- **Description:** Turn an empty directory into a buildable Next.js 15 App Router project that emits a static `out/` correctly prefixed for `tungbq.github.io/dohsites`, with Tailwind v4 wired and all runtime deps pre-installed so later parallel phases never touch `package.json`.

## Key Insights

1. **The working directory is not empty.** It holds `plans/` and `.claude/`. `create-next-app` aborts on directories containing files outside its allowlist (`.git`, `.gitignore`, `LICENSE`, `README.md`, …). `plans/` and `.claude/` are not allowlisted → scaffold into a temp dir and move contents in.
2. **Local Node is v12.22.9** (`/usr/bin/node`, verified via `node -v`). Next.js 15 requires `^18.18.0 || ^19.8.0 || >=20.0.0`. This is a hard blocker before any npm work. A Windows-side Node v24.2.0 exists at `/mnt/c/nvm4w/nodejs` but mixing Windows Node with a WSL checkout on `/mnt/d` causes path/permission/watcher pain — install Node in WSL instead.
3. **Tailwind v4 setup in researcher-01 §6 is actually v3 syntax** and will silently produce zero styles. Verified correct v4 form against current Tailwind docs: `npm i tailwindcss @tailwindcss/postcss postcss`, `postcss.config.mjs` → `{ plugins: { "@tailwindcss/postcss": {} } }`, CSS entry → `@import "tailwindcss";`. No `autoprefixer`, no `tailwind.config.js`.
4. **`basePath` is hardcoded, not env-driven.** researcher-01's workflow passes `NEXT_PUBLIC_BASEPATH` at CI build time. That creates a config that is correct in CI and wrong locally — the exact class of bug that only shows up in production. Hardcode `/dohsites` so `npm run dev` serves at `localhost:3000/dohsites` and mirrors prod byte-for-byte.
5. **`.nojekyll` is not optional.** Jekyll drops directories starting with `_`; Next emits `_next/`. Without it every asset 404s.
6. **All deps installed here.** phase-03 and phase-04 run in parallel; if either had to `npm i`, both would edit `package.json`/lockfile → conflict. Install `next-themes` + `fuse.js` now, and pre-write the `build` script that phase-03 will rely on.

## Requirements

**Functional**
- `npm run build` produces `out/` containing `index.html` and `_next/` with `/dohsites`-prefixed asset URLs.
- `npm run dev` serves the app at `http://localhost:3000/dohsites`.
- Tailwind utility classes render (verified visually, not assumed).
- Repo is a git repo on branch `main` with an initial commit; `plans/`, `.claude/` preserved.

**Non-functional**
- TypeScript strict mode on; ESLint passes clean.
- Node version pinned via `.nvmrc` so CI and local agree.
- No secrets, no `.env` committed.

## Architecture

```
dohsites/
├── .nvmrc                   # 22
├── next.config.mjs          # output:'export', basePath, assetPrefix, trailingSlash, images.unoptimized
├── postcss.config.mjs       # @tailwindcss/postcss
├── tsconfig.json            # strict, paths: @/*
├── package.json             # scripts: dev/build/lint/fetch:github
├── app/
│   ├── layout.tsx           # minimal; phase-04 owns the real one
│   ├── page.tsx             # placeholder; phase-05 owns the real one
│   └── globals.css          # @import "tailwindcss"; @custom-variant dark
├── public/
│   └── .nojekyll
├── plans/                   # preserved
└── .claude/                 # preserved
```

**Build data flow (final shape, wired incrementally):**
`scripts/fetch-github-data.mjs` → `data/github.json` → server components read at build → static HTML in `out/` → Pages artifact.

## Related Code Files

**Create**
- `.nvmrc`, `.gitignore`, `README.md`
- `next.config.mjs`, `postcss.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `eslint.config.mjs`
- `package.json`, `package-lock.json`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `public/.nojekyll`

**Modify** — none (greenfield)
**Delete** — scaffold leftovers: `app/favicon.ico` kept, `public/*.svg` demo assets removed

## Implementation Steps

1. **Install Node 22 in WSL** (blocker):
   ```bash
   source "$HOME/.nvm/nvm.sh" && nvm install 22 && nvm use 22 && node -v   # expect v22.x
   ```
   Write `.nvmrc` with `22`. Every later step assumes this shell.
2. **Scaffold out-of-tree, then move in:**
   ```bash
   TMP=$(mktemp -d) && cd "$TMP"
   npx create-next-app@latest app --ts --eslint --app --no-src-dir --import-alias "@/*" --no-turbopack --use-npm
   ```
   Copy everything from `$TMP/app/` (including dotfiles, excluding `node_modules`, `.git`) into `/mnt/d/CODING/GITHUB/MY-REPO/dohsites/`. Verify `plans/` and `.claude/` survived.
3. **Tailwind v4** (create-next-app may already include it — check `package.json` before installing):
   `npm i tailwindcss @tailwindcss/postcss postcss`; write `postcss.config.mjs`; replace `app/globals.css` body with:
   ```css
   @import "tailwindcss";
   @custom-variant dark (&:where(.dark, .dark *));
   ```
   Delete any `tailwind.config.*` the scaffold produced.
4. **Write `next.config.mjs`:**
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     basePath: '/dohsites',
     assetPrefix: '/dohsites',
     trailingSlash: true,
     images: { unoptimized: true },
   };
   export default nextConfig;
   ```
   `trailingSlash: true` emits `about/index.html` instead of `about.html` — removes all GH Pages pretty-URL ambiguity. Sitemap URLs in phase-04 must match with trailing slashes.
5. **Install runtime deps for later phases:** `npm i next-themes fuse.js`.
6. **Pre-write `package.json` scripts** (phase-03 fills in the script body, does not edit this file):
   ```json
   "dev": "next dev",
   "build": "node scripts/fetch-github-data.mjs && next build",
   "build:nofetch": "next build",
   "lint": "next lint",
   "test": "node --test scripts/*.test.mjs"
   ```
   Until phase-03 lands, `scripts/fetch-github-data.mjs` does not exist → use `npm run build:nofetch` in this phase and phase-02.
7. **Add `public/.nojekyll`** (empty file). Add `out/`, `.env*.local`, `node_modules/` to `.gitignore`.
8. **Smoke test:** strip the demo page to a single `<h1 className="text-3xl font-bold underline">` and confirm Tailwind styles apply in `npm run dev` at `/dohsites`.
9. **Build + inspect output:** `npm run build:nofetch`, then grep `out/index.html` for `/dohsites/_next/` asset paths. If paths lack the prefix, `assetPrefix` is wrong — stop and fix here, not in phase-02.
10. **git init:** `git init -b main`, commit, create/point remote at `github.com/tungbq/dohsites`, push.

## Todo List

- [ ] Node 22 installed in WSL; `.nvmrc` written
- [ ] Next.js 15 scaffolded via temp dir; `plans/` + `.claude/` intact
- [ ] Tailwind v4 (`@import "tailwindcss"`) rendering styles — visually confirmed
- [ ] `@custom-variant dark` present in `globals.css`
- [ ] `next.config.mjs` with export/basePath/assetPrefix/trailingSlash/unoptimized
- [ ] `next-themes` + `fuse.js` installed
- [ ] `package.json` scripts pre-written (incl. `build` with fetch prefix)
- [ ] `public/.nojekyll` present
- [ ] `.gitignore` covers `out/`, `node_modules/`, `.env*.local`
- [ ] `npm run build:nofetch` green; `out/index.html` references `/dohsites/_next/`
- [ ] git repo initialized on `main`, initial commit pushed

## Success Criteria

| Criterion | Verification |
|---|---|
| Node runtime valid | `node -v` ≥ v20 |
| Build emits static site | `out/index.html` exists after build |
| basePath applied | `grep -c '/dohsites/_next/' out/index.html` > 0 |
| Trailing-slash routing | build of a second route emits `<route>/index.html` |
| Tailwind active | rendered heading is styled in browser |
| Type/lint clean | `npx tsc --noEmit` and `npm run lint` exit 0 |
| Repo state preserved | `ls plans .claude` still present after scaffold move |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Node v12 breaks every npm command | High × High | Step 1 is a hard gate; `.nvmrc` + `engines` field prevent recurrence |
| `create-next-app` aborts on non-empty dir | High × Med | Temp-dir scaffold + copy (step 2); fallback = hand-write the ~8 config files |
| Copied research Tailwind v3 syntax → no styles, silent | Med × High | Step 3 uses verified v4 syntax; step 8 visually confirms before moving on |
| `assetPrefix` misconfigured → total asset 404 on Pages | Med × High | Step 9 greps built HTML locally, before any deploy exists |
| npm install over `/mnt/d` (WSL↔NTFS) is slow/flaky | Med × Low | Accept; if severe, move repo to WSL-native `~/` and symlink |
| Turbopack/Next 15 export interaction quirks | Low × Med | `--no-turbopack`; webpack path is the documented export path |

## Security Considerations

- No tokens needed in this phase; all fetches are unauthenticated/none.
- `.gitignore` must cover `.env*.local` before the first commit — a secret committed once lives in history forever.
- `npx create-next-app@latest` pulls from npm at scaffold time; pin the resulting `next` version in `package.json` (no `^` drift for the initial commit is optional but note the version in the README).
- No `dangerouslySetInnerHTML` introduced here (phase-04 adds exactly one, for JSON-LD, with static content).

## Rollback

Single commit. `git reset --hard` / delete all non-`plans` files. Nothing deployed yet, no external state touched.

## Next Steps

- **Unblocks:** phase-02 (deployment pipeline), and after that phase-03 + phase-04 in parallel.
- **Hand-off facts phase-02 needs:** `out/` is the artifact dir; build command is `npm run build:nofetch` until phase-03 lands.
