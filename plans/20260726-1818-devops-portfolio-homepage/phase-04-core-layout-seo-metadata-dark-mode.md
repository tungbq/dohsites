# Phase 04 — Core Layout, SEO, Metadata & Dark Mode

## Context Links

- Plan: [plan.md](plan.md) · Depends on: [phase-01](phase-01-project-scaffold-and-static-export-config.md)
- Research: [researcher-01 §3 SEO](research/researcher-01-nextjs-seo-deployment.md), [§4 Dark Mode](research/researcher-01-nextjs-seo-deployment.md)
- Runs in parallel with: [phase-03](phase-03-github-data-pipeline-and-daily-refresh.md) (disjoint files)
- Consumed by: [phase-05](phase-05-homepage-content-sections.md)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** ~2.5h
- **Description:** Root layout shell (header/nav/footer/skip-link), full metadata + OG/Twitter + JSON-LD, sitemap/robots, and flash-free dark mode. Everything that wraps content, before content exists.

## Key Insights

1. **Do not hand-roll the anti-flash script.** researcher-01 §4's snippet is subtly wrong: when the user has explicitly selected "system" (`localStorage.theme === 'system'`), both branches are false → no `dark` class → the flash it exists to prevent. next-themes ships its own correct script and injects it into the document itself. **Verify** it lands in the built HTML (`grep` `out/index.html`) rather than assuming — and only hand-write one if it is genuinely absent.
2. **Tailwind v4 dark mode is a CSS declaration, not a config key.** `darkMode: 'class'` (researcher-01 §4) is v3. v4 needs `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (added in phase-01). Without it, `next-themes` toggles a `.dark` class that no utility responds to — the toggle appears to do nothing.
3. **`suppressHydrationWarning` on `<html>` is mandatory**, because next-themes mutates the class/style before React hydrates. Omitting it produces a hydration error in dev on every load.
4. **`metadataBase` must include the base path**: `new URL('https://tungbq.github.io/dohsites')`. Getting this wrong yields OG image URLs missing `/dohsites` — social previews break while the site looks fine. Interaction between `metadataBase` and `basePath` for file-based OG images is a known sharp edge → assert against the built HTML, not the source.
5. **Sitemap URLs must match `trailingSlash: true`.** Emit `.../dohsites/` and `.../dohsites/projects/`. Mismatched slashes = self-referencing redirect warnings in Search Console.
6. **The theme toggle's `mounted` guard returns `null` pre-mount** → the button pops into existence on hydration, causing CLS in the header. Reserve its box with fixed dimensions and render a neutral placeholder instead of `null`.
7. **OG images are real assets that must be produced**, 1200×630 JPG. Not a code task — schedule it explicitly or ship a plain generated placeholder; a missing file makes the whole `app/opengraph-image.jpg` convention a no-op with no error.

## Requirements

**Functional**
- Root layout renders skip-link, `<header>` + `<nav>`, `<main>`, `<footer>` on every route.
- Theme toggles light/dark/system, persists across reloads, no flash on hard refresh in dark.
- `/sitemap.xml` and `/robots.txt` present in `out/`.
- OG + Twitter meta and JSON-LD `Person` present in `out/index.html`.

**Non-functional**
- Zero CLS from the header/theme toggle.
- No `next/font` network fetch at runtime (self-hosted at build).
- All colors meet WCAG AA 4.5:1 in **both** themes.
- Layout adds < 5 KB JS beyond the theme provider.

## Architecture

```
app/layout.tsx (Server Component)
├── <html lang="en" suppressHydrationWarning>
├── <head>: JSON-LD Person (single <script type="application/ld+json">)
└── <body class={geist.variable}>
    └── <ThemeProvider>                    'use client' wrapper over next-themes
        ├── <SkipLink href="#main">
        ├── <SiteHeader>  ── <ThemeToggle> 'use client', mounted-guarded
        ├── <main id="main">{children}</main>
        └── <SiteFooter>
```

**Theme data flow:** next-themes inline script (head, pre-paint) reads `localStorage.theme` → resolves `system` via `matchMedia` → sets `.dark` on `<html>` → Tailwind's `@custom-variant dark` matches → paint is already correct. React hydrates and `ThemeToggle` takes over.

**Metadata resolution:** `metadata` export in `layout.tsx` (+ `metadataBase`) → Next resolves `app/opengraph-image.jpg` and `app/twitter-image.jpg` by file convention → absolute URLs in `<meta>` → copied into `out/`.

## Related Code Files

**Create**
- `app/sitemap.ts`, `app/robots.ts`
- `app/opengraph-image.jpg` (1200×630), `app/opengraph-image.alt.txt`
- `app/twitter-image.jpg`, `app/twitter-image.alt.txt`
- `app/icon.png` / `app/favicon.ico`
- `components/theme-provider.tsx`, `components/theme-toggle.tsx`
- `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `components/layout/skip-link.tsx`
- `components/seo/person-json-ld.tsx`
- `lib/site-config.ts` (name, title, description, URL, socials — single source for metadata + JSON-LD + footer; DRY)

**Modify**
- `app/layout.tsx` (placeholder from phase-01)
- `app/globals.css` (theme tokens under `@theme`; `@custom-variant` already present)

**Do NOT touch** — `app/page.tsx` (phase-05), `scripts/`, `content/`, `lib/projects.ts`, `data/`, `.github/` (phase-03), `package.json` (phase-01)

## Implementation Steps

1. **`lib/site-config.ts`** — export `siteConfig`: `name`, `title`, `description`, `url: 'https://tungbq.github.io/dohsites'`, `author`, `socials { github, linkedin, x }`, `keywords`. Everything below imports from here.
2. **`app/globals.css`** — add design tokens in `@theme` (colors, radii, font vars) with explicit light/dark values; keep the palette small (bg, surface, fg, muted, accent, border).
3. **`components/theme-provider.tsx`** — `'use client'`, re-export next-themes' `ThemeProvider` with `attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange`.
4. **`app/layout.tsx`** — `<html lang="en" suppressHydrationWarning>`; export `metadata` (title template, description, `metadataBase`, `openGraph`, `twitter: { card: 'summary_large_image' }`, `alternates.canonical`) and `viewport`/`colorScheme` per Next 15 (`themeColor` belongs in the `viewport` export, not `metadata` — it warns otherwise). Compose header/main/footer.
5. **`components/seo/person-json-ld.tsx`** — `Person` schema from `siteConfig`, one `<script type="application/ld+json" dangerouslySetInnerHTML>`. Content is fully static — no user/API input reaches it.
6. **`components/theme-toggle.tsx`** — `'use client'`, `mounted` guard, cycles light → dark → system, `aria-label` + `aria-pressed`/`title`, fixed `h-9 w-9`. Pre-mount: render the same-sized disabled placeholder, **not** `null`.
7. **`site-header.tsx`** — `<header>` + `<nav aria-label="Main">`, in-page anchors (`#projects`, `#about`, `#stack`) since the MVP is a single page; `<ThemeToggle>` right-aligned. **`site-footer.tsx`** — socials from `siteConfig`, copyright, "data refreshed daily" note.
8. **`skip-link.tsx`** — visually hidden until `:focus-visible`, targets `#main`.
9. **`app/sitemap.ts`** — homepage entry (`.../dohsites/`) with trailing slash; add future routes only when they exist (do not list `/blog` before it ships — it becomes a 404 in the sitemap).
10. **`app/robots.ts`** — allow all, `sitemap: '<url>/sitemap.xml'`.
11. **OG images** — produce two 1200×630 JPGs (name + title + subtle brand mark), under 200 KB each; write matching `.alt.txt`. Placeholder is acceptable for the first pass, but the file must exist.
12. **Verify against build output**, not source:
    ```bash
    npm run build:nofetch
    grep -o 'og:image[^>]*' out/index.html          # absolute, contains /dohsites
    grep -c 'application/ld+json' out/index.html    # 1
    ls out/sitemap.xml out/robots.txt
    grep -o 'localStorage' out/index.html | head -1 # next-themes script present
    ```
13. **Manual dark-mode test:** set dark, hard-refresh, watch for a white flash; repeat with system preference dark and stored value `system`. Keyboard-test the toggle and skip-link.

## Todo List

- [ ] `lib/site-config.ts` as single metadata source
- [ ] `@theme` tokens with AA-contrast light + dark values
- [ ] `theme-provider.tsx` client wrapper
- [ ] `app/layout.tsx`: `suppressHydrationWarning`, metadata, viewport/themeColor, landmarks
- [ ] JSON-LD `Person` rendered once
- [ ] `theme-toggle.tsx` with mounted guard + sized placeholder (no CLS)
- [ ] header/nav, footer, skip-link
- [ ] `app/sitemap.ts` (trailing slashes) + `app/robots.ts`
- [ ] OG + Twitter JPGs (1200×630) + alt.txt files
- [ ] favicon/icon
- [ ] Built HTML verified: og:image absolute w/ `/dohsites`, JSON-LD, sitemap, robots, theme script
- [ ] No-flash confirmed for dark and for stored `system`
- [ ] Skip-link + toggle reachable and operable by keyboard

## Success Criteria

| Criterion | Verification |
|---|---|
| Metadata complete | `out/index.html` has title, description, og:*, twitter:card |
| OG URL correct | og:image absolute and contains `/dohsites/` |
| Structured data valid | Google Rich Results Test on the deployed URL → Person detected, 0 errors |
| Sitemap/robots emitted | `out/sitemap.xml`, `out/robots.txt` exist; URLs use trailing slashes |
| No FOUC | hard refresh in dark: no white frame (record/step through if unsure) |
| Dark mode actually applies | toggling changes computed background (proves `@custom-variant` works) |
| No hydration errors | dev console clean |
| No CLS from header | Lighthouse CLS contribution 0 on the shell |
| Contrast | key text pairs ≥ 4.5:1 in both themes (contrast checker) |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Copied v3 `darkMode: 'class'` → toggle does nothing visible | Med × High | `@custom-variant` from phase-01; success criterion asserts computed style changes |
| Hand-rolled anti-flash script duplicates/conflicts with next-themes' | Med × Med | Verify built HTML first (step 12); only add manually if absent |
| `metadataBase` + `basePath` double/missing prefix on OG URL | Med × High | Assert on built HTML (step 12), not on source |
| Missing `suppressHydrationWarning` → hydration error spam | Med × Low | Explicit in step 4 |
| Theme toggle popping in → CLS | Med × Med | Sized placeholder instead of `null` (step 6) |
| Sitemap lists routes that don't exist yet | Med × Med | Only ship existing routes (step 9) |
| OG image asset never actually created → silent no-op | Med × Med | Todo item + `ls out/opengraph-image*` check |
| Dark palette fails contrast | Med × Med | Check tokens at definition time, re-verify in phase-06 |

## Security Considerations

- Exactly one `dangerouslySetInnerHTML` (JSON-LD), fed only by the static `siteConfig` — no user or API input. Any future dynamic JSON-LD must be JSON-escaped first.
- Publish only already-public identity data (GitHub/LinkedIn handles). No email address in JSON-LD or footer (scraper bait) — use a contact link instead.
- `rel="noopener noreferrer"` on all external links; `target="_blank"` only where intended.
- next-themes writes a single non-sensitive `localStorage` key; no cookies → no consent banner needed (revisit if analytics is adopted — plan.md Q2).
- No inline event handlers or remote script tags → keeps a future strict CSP viable.

## Rollback

Self-contained and additive: revert this phase's commits and the site falls back to the phase-02 shell. No data, workflow, or external state involved.

## Next Steps

- **Unblocks:** phase-05 (renders inside `<main>`, imports `siteConfig` and theme tokens).
- **Hand-off to phase-05:** available tokens/utilities from `@theme`, landmark structure (page content must start at `<h1>` inside `#main`, no extra `<main>`), and `siteConfig` for any repeated identity strings.
- **Carried question:** analytics choice (plan.md Q2) would insert a script tag here — left out deliberately.
