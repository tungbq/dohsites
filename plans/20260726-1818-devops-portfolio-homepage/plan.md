---
title: "DevOps Portfolio Homepage (tungbq/dohsites)"
description: "Next.js 15 static-export portfolio for GitHub user tungbq, deployed to GitHub Pages with build-time GitHub data and daily refresh."
status: pending
priority: P2
effort: 13h
branch: main
tags: [nextjs, static-export, github-pages, portfolio, seo, tailwind-v4]
created: 2026-07-26
---

# DevOps Portfolio Homepage

Static portfolio at `https://tungbq.github.io/dohsites`. Next.js 15 App Router, `output: 'export'`, Tailwind v4, GitHub repo data baked at build time, redeployed daily by cron.

## Locked Decisions (do not re-litigate)

| Aspect | Decision |
|---|---|
| Hosting | GH Pages **project page**, `basePath`/`assetPrefix` = `/dohsites` |
| OG images | Static `.jpg` files (next/og incompatible with export) |
| Styling | Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`) |
| Dark mode | `next-themes`, `attribute="class"`, anti-flash verified |
| Animation | CSS/Tailwind only; Motion deferred until proven need |
| GitHub data | Build-time fetch script → trimmed JSON committed to repo → daily cron |
| Stats widgets | `github-readme-stats` self-hosted SVG; no contribution heatmap in MVP |
| Search/filter | Fuse.js + tag filter buttons (not cmdk) |
| Quality bar | Lighthouse 95+ Perf / A11y / Best Practices, 90+ SEO |

## Phases

| # | Phase | Depends on | Effort | Status |
|---|---|---|---|---|
| 01 | [Project scaffold & static export config](phase-01-project-scaffold-and-static-export-config.md) | — | 2h | pending |
| 02 | [GitHub Pages deployment pipeline](phase-02-github-pages-deployment-pipeline.md) | 01 | 1.5h | pending |
| 03 | [GitHub data pipeline & daily refresh](phase-03-github-data-pipeline-and-daily-refresh.md) | 01, 02 | 2.5h | pending |
| 04 | [Core layout, SEO, metadata, dark mode](phase-04-core-layout-seo-metadata-dark-mode.md) | 01 | 2.5h | pending |
| 05 | [Homepage content sections](phase-05-homepage-content-sections.md) | 03, 04 | 3h | pending |
| 06 | [Accessibility & performance polish](phase-06-accessibility-and-performance-polish.md) | 05 | 1.5h | pending |

**Parallelizable:** 03 and 04 after 02 lands (disjoint file ownership — see each phase's Related Code Files).

## Critical Path

`01 → 02 → 03 → 05 → 06` (04 rides alongside 03).

Phase 02 deliberately deploys an empty shell **before** any content exists. Rationale: `basePath`/`assetPrefix`/`.nojekyll`/trailing-slash bugs all present as 404s, and debugging them against a 3-file site is trivial vs. against a finished homepage.

## Research Inputs

- [researcher-01: Next.js static export, SEO, GH Pages](research/researcher-01-nextjs-seo-deployment.md)
- [researcher-02: GitHub data, UX patterns, perf baseline](research/researcher-02-github-data-ux-patterns.md)

## Corrections Applied to Research

Two research snippets are wrong and would break the build if copied verbatim — corrected in phases 01/04:
1. **Tailwind setup** (researcher-01 §6) shows v3 syntax (`@tailwind base;`, `autoprefixer`, `tailwind.config.ts` `darkMode: 'class'`). v4 uses `@import "tailwindcss";`, `@tailwindcss/postcss`, and `@custom-variant dark (...)`.
2. **Anti-flash script** (researcher-01 §4) mishandles `localStorage.theme === 'system'` → flash for system-dark users. next-themes injects its own correct script; do not hand-roll a duplicate.

Also superseded: researcher-02 recommends Pages Router `getStaticProps`; the locked stack is App Router + build-time script (researcher-02 §1 documents this alternate pattern).

## Open Questions (need user decision — see phase files)

1. **Custom domain timing** — stay on `/dohsites` or plan a `tungbq.dev` cutover? Affects `basePath`, sitemap, OG absolute URLs. Deferring is cheap now, costs a re-deploy later.
2. **Analytics** — none / Plausible / Umami / GoatCounter? GH Pages has no first-party option. Impacts Best-Practices score and privacy copy.
3. **Blog/CMS strategy** — Markdown-in-repo vs external CMS vs no blog. Currently out of scope; sitemap reserves the route.
4. **Contribution heatmap** — skipped for MVP per research. Confirm text stats suffice.
5. **github-readme-stats hosting** — self-hosting a Vercel instance is a second deployment to own. Since `data/github.json` already carries stars/forks/languages, native HTML widgets are an option with zero external dependency. Flagged, not decided (see phase 05).
