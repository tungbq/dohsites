# Phase 05 — Homepage Content Sections

## Context Links

- Plan: [plan.md](plan.md) · Depends on: [phase-03](phase-03-github-data-pipeline-and-daily-refresh.md) (data), [phase-04](phase-04-core-layout-seo-metadata-dark-mode.md) (shell)
- Research: [researcher-02 §4 Search/Filter](research/researcher-02-github-data-ux-patterns.md), [§5 Portfolio structure](research/researcher-02-github-data-ux-patterns.md), [§3 Stats widgets](research/researcher-02-github-data-ux-patterns.md)
- Followed by: [phase-06](phase-06-accessibility-and-performance-polish.md)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~3h
- **Description:** The actual page — hero with live stats, about + tech stack, featured projects, and the full searchable/filterable project grid. Single-page MVP with in-page anchors.

## Key Insights

1. **The full project list must exist in the static HTML.** The obvious build ("client component fetches/filters, renders results") ships an empty `<div>` to crawlers and no-JS users — fatal for a portfolio whose entire point is SEO + reliability. Correct shape: a **Server Component** renders every card into HTML and passes the same array as props into a thin client wrapper that only *hides* non-matching cards after hydration. Cards are server-rendered children; the client owns filter state, not card markup.
2. **Filter state resets on hydration — that's fine; losing content isn't.** Since the server renders all cards visible, the pre-hydration state is "everything shown", which is the correct default. No layout jump.
3. **Fuse.js must be lazily constructed and memoized.** Building the index on every keystroke over 20 items is harmless but sloppy; `useMemo` on the array. ~8–10 KB gz is the entire interactive JS budget for this page — do not add a second search/UI library.
4. **Search + filters compose, they don't override.** Search narrows, then category, then language. Empty result state must be explicit ("No projects match…" + a Clear button), not a blank region.
5. **`aria-live="polite"` on the results container**, `aria-pressed` on filter buttons, a real `<label>` on the input. Screen-reader users otherwise get zero feedback that filtering happened (researcher-02 §4).
6. **github-readme-stats SVGs are third-party runtime images** — they can 503 (public instance is heavily rate-limited; self-hosting is a second deployment to own). Mandatory: explicit `width`/`height` (CLS), `loading="lazy"`, meaningful `alt`, and a text fallback that already carries the same numbers from `data/github.json`. **Open question (plan.md Q5):** the hero can render those stats as native HTML with zero external dependency, since phase-03's `getProfileStats()` already has them. Locked decision says self-hosted SVG — implement that, but keep the text stats in the hero so the page is never dependent on the widget rendering.
7. **Impact metrics over feature lists** (researcher-02 §5). Cards lead with the curated `impact` string when present, then stars/forks. Star counts alone read as vanity; "1.8k stars, used as a study path by X" reads as adoption.
8. **CSS-only animations, and gated on `prefers-reduced-motion`.** Fade/translate on scroll via `animation-timeline`/IntersectionObserver is tempting — the locked decision is CSS-first. A single `@media (prefers-reduced-motion: reduce)` block disabling all transitions is required, not optional.
9. **`<img>` over `next/image` for the remote SVG widgets.** With `images.unoptimized: true`, `next/image` adds wrapper markup and zero benefit for an external SVG. Use `next/image` only for the local avatar (fixed dimensions, `priority`).

## Requirements

**Functional**
- Hero: name, title line, one-sentence positioning, CTAs (GitHub, Projects anchor), live text stats (repos, followers, total stars).
- About: 2–3 sentence bio + tech-stack badge grid grouped by area (IaC / Orchestration / Cloud / CI-CD / Observability).
- Featured: up to 3 curated projects with impact metrics.
- Projects: all curated projects as cards; fuzzy search + category filter + language filter, composable; result count; empty state; clear-all.
- Stats section: github-readme-stats SVGs (stats card + top languages), lazy, sized, alt-texted.
- Footer already provided by phase-04.

**Non-functional**
- Total page JS < 200 KB (target: well under, ~60–90 KB with React + Fuse).
- All cards present in `out/index.html` (verifiable by grep).
- Fully usable with JS disabled (minus filtering).
- Keyboard-operable; visible focus on every interactive element.
- LCP element (hero heading or avatar) < 2.5 s.

## Architecture

```
app/page.tsx  (Server Component)
├── <HeroSection stats={getProfileStats()} />                    server
├── <AboutSection /> + <TechStackSection />                      server, static content
├── <FeaturedProjects projects={getFeaturedProjects()} />        server
├── <ProjectsExplorer                                            'use client' — state only
│      projects={getAllProjects()}
│      categories={getCategories()} languages={getLanguages()}>
│     └── renders <ProjectCard> from props (HTML present pre-hydration)
└── <GithubStatsSection />                                       server, <img> SVGs

lib/projects.ts ──(build time)──> serialized props ──> static HTML
```

**Filter pipeline (client, pure):**
`projects → (search ? fuse.search(q) : all) → filter(category) → filter(language) → sorted by order`
Extracted to `lib/filter-projects.ts` as a pure function so it is unit-testable without React.

**Card anatomy:** `<article>` → `<h3>` title (link to repo) → curated blurb → impact line (if any) → tag chips → `⭐ stars · forks · language` → footer link. `<h2>` per section, single `<h1>` in hero.

## Related Code Files

**Create**
- `app/page.tsx` (replaces phase-01 placeholder)
- `components/sections/hero-section.tsx`
- `components/sections/about-section.tsx`
- `components/sections/tech-stack-section.tsx`
- `components/sections/featured-projects.tsx`
- `components/sections/github-stats-section.tsx`
- `components/projects/projects-explorer.tsx` (`'use client'`)
- `components/projects/project-card.tsx`
- `components/projects/filter-button-group.tsx`
- `components/ui/badge.tsx`, `components/ui/stat.tsx`
- `lib/filter-projects.ts` + `lib/filter-projects.test.mjs`
- `content/tech-stack.ts`, `content/about.ts`
- `public/avatar.jpg`

**Modify**
- `lib/site-config.ts` — add `statsBaseUrl` (self-hosted github-readme-stats origin)

**Do NOT touch** — `app/layout.tsx`, `components/layout/*`, `components/theme-*` (phase-04); `scripts/`, `data/`, `.github/` (phase-03)

## Implementation Steps

1. **Content first:** write `content/about.ts` (bio, 2–3 sentences) and `content/tech-stack.ts` (grouped badge lists). Real copy, not lorem — layout decisions depend on real string lengths.
2. **`components/ui/badge.tsx` + `stat.tsx`** — the two primitives every section reuses (DRY).
3. **`hero-section.tsx`** — single `<h1>`; role line; positioning sentence; CTA buttons (`<a>` styled as buttons, not `<div onClick>`); `<Stat>` row from `getProfileStats()`; avatar via `next/image` with explicit dims + `priority`.
4. **`about-section.tsx` / `tech-stack-section.tsx`** — `<section aria-labelledby>` + `<h2>`; badges as a `<ul>` of `<li>`, grouped with sub-headings.
5. **`project-card.tsx`** — pure presentational `<article>`. No client hooks so it can render on the server inside the client wrapper.
6. **`lib/filter-projects.ts`** — pure `filterProjects({ projects, query, category, language, fuse })`. Unit test: search match, category narrowing, composed search+filter, empty result, "All" passthrough.
7. **`filter-button-group.tsx`** — `<fieldset>`/`<legend>` (visually hidden legend), `<button aria-pressed>` per option, `All` first. Not a `<select>` — buttons are discoverable and one interaction cheaper.
8. **`projects-explorer.tsx`** (`'use client'`) — holds `query`/`category`/`language`; `useMemo` Fuse over `props.projects` with `keys: ['title','blurb','description','tags','repo']`, `threshold: 0.3`; renders `<ProjectCard>` for the filtered set; `aria-live="polite"` region announcing "N projects"; Clear button when any filter is active; labelled search input with `type="search"`.
9. **`featured-projects.tsx`** — server, up to 3 cards, visually distinct (larger, impact metric emphasized).
10. **`github-stats-section.tsx`** — `<img src={`${siteConfig.statsBaseUrl}/api?username=tungbq&show_icons=true`}>` and `/api/top-langs?...&layout=compact`, each with `width`/`height`, `loading="lazy"`, descriptive `alt`. Theme-aware via `&theme=` — note the SVG cannot react to the class-based toggle without swapping `src` on the client; simplest correct answer is a neutral `&theme=transparent`-style param that reads acceptably in both. Verify visually in both themes.
11. **`app/page.tsx`** — compose sections in order, matching the header anchor ids (`#about`, `#stack`, `#projects`).
12. **CSS animations** — one `fade-in-up` keyframe + stagger via `animation-delay`; wrap in `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation: none !important; transition: none !important; } }`.
13. **Verify server-rendered content:**
    ```bash
    npm run build
    grep -c '<article' out/index.html      # == number of curated projects (+featured)
    ```
    Then load the page with JS disabled — all cards visible, links work.
14. **Check the JS budget** in `next build` output; flag if First Load JS > 200 KB.

## Todo List

- [ ] `content/about.ts`, `content/tech-stack.ts` with real copy
- [ ] `badge.tsx`, `stat.tsx` primitives
- [ ] Hero with single `<h1>`, CTAs, live stats, sized avatar
- [ ] About + tech stack sections with proper landmarks/headings
- [ ] `project-card.tsx` (pure, server-renderable)
- [ ] `lib/filter-projects.ts` + tests green
- [ ] `filter-button-group.tsx` with `aria-pressed`
- [ ] `projects-explorer.tsx` — memoized Fuse, `aria-live`, empty state, clear-all
- [ ] Featured projects section (≤3, impact-led)
- [ ] GitHub stats SVGs: sized, lazy, alt, acceptable in both themes
- [ ] `app/page.tsx` composed; anchors match header nav
- [ ] CSS animations + `prefers-reduced-motion` guard
- [ ] All cards present in built HTML (grep verified)
- [ ] JS-disabled pass: content readable, links work
- [ ] First Load JS < 200 KB

## Success Criteria

| Criterion | Verification |
|---|---|
| Content is static HTML | `grep -c '<article' out/index.html` equals project count |
| Search works | typing a partial repo name narrows the grid |
| Filters compose | category + language + search applied together yield the intersection |
| Empty state | impossible combination shows message + working Clear |
| SR feedback | `aria-live` region announces the new count on filter change |
| Keyboard only | Tab reaches input, every filter button, every card link; visible focus |
| No-JS usable | all cards + links functional with JS off |
| Live data rendered | star counts match github.com for 2 spot-checked repos |
| Widget failure tolerated | blocking the stats origin still leaves stats readable in the hero |
| Bundle | First Load JS < 200 KB in build output |
| Reduced motion honored | OS setting on → no animation |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Client-only rendering of the grid → empty HTML for crawlers | Med × **High** | Server-render cards, client filters only (insight 1); grep assertion in step 13 |
| github-readme-stats 503 / rate-limited → broken images | **High** × Med | Self-hosted instance + hero text stats as the real source; `alt` text carries meaning |
| Self-hosted stats instance is an unowned second deployment | Med × Med | Flagged as plan.md Q5 — native HTML widgets are a zero-dependency alternative; user decides |
| SVG widget theme mismatch in dark mode | High × Low | Neutral theme param; visual check both modes (step 10) |
| Remote SVG without dimensions → CLS | Med × Med | Explicit width/height (step 10) |
| Fuse threshold too loose/tight | Med × Low | Start 0.3; tune against real repo names during step 8 |
| Card content overflow (long descriptions) | Med × Low | Clamp blurb to 2–3 lines; real copy in step 1 surfaces this early |
| Filter state lost on reload (no URL sync) | Low × Low | Accept for MVP — YAGNI; note as future enhancement |
| Avatar/hero image is LCP and unoptimized | Med × Med | Pre-compress to < 60 KB WebP/JPG, fixed dims, `priority` |

## Security Considerations

- All repo-derived strings (descriptions, topics) render as React text — auto-escaped. No `dangerouslySetInnerHTML` in this phase.
- Third-party image origin (`statsBaseUrl`) is the only external runtime request; it can see visitor IP/UA. Note it if a privacy page is added. Self-hosting keeps it under tungbq's control.
- External links: `rel="noopener noreferrer"`.
- No user input leaves the browser — search is purely client-side, nothing logged or transmitted.
- Avoid embedding an email address in the contact CTA (scraper bait); link to GitHub/LinkedIn.

## Rollback

Additive and page-local: revert this phase's commits → `app/page.tsx` returns to placeholder, shell + data pipeline unaffected. Individual sections can be removed independently since none share state.

## Next Steps

- **Unblocks:** phase-06 (audits this page).
- **Hand-off to phase-06:** known perf suspects are the avatar (LCP), the two remote SVGs, and Fuse in the client bundle.
- **Deferred (explicitly out of MVP scope):** blog/changelog section, per-project detail routes + `SoftwareSourceCode` JSON-LD, URL-synced filter state, contribution heatmap.
