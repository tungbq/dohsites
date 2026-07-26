# dohsites

[![Deploy to GitHub Pages](https://github.com/tungbq/dohsites/actions/workflows/deploy.yml/badge.svg)](https://github.com/tungbq/dohsites/actions/workflows/deploy.yml)

DevOps portfolio homepage for [tungbq](https://github.com/tungbq), built with Next.js and deployed as a static export to GitHub Pages.

**Live:** https://tungbq.github.io/dohsites/

> Repo Settings → Pages → Source must be set to **GitHub Actions** (not "Deploy from a branch") for the workflow below to publish anything.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/dohsites](http://localhost:3000/dohsites) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Quality baseline (2026-07-26)

No local Chrome and a zero-quota PageSpeed Insights API meant a real Lighthouse
score couldn't be captured this pass — numbers below are placeholders, not
measurements. Re-run `npx lighthouse https://tungbq.github.io/dohsites/ --view`
or https://pagespeed.web.dev/ once a scoring tool is available, and replace
this table.

| Category | Score | Notes |
|---|---|---|
| Performance | not measured | see First Load JS below |
| Accessibility | not measured | manual pass done, see `docs/accessibility-checklist.md` |
| Best Practices | not measured | zero console-error sources found in static review |
| SEO | not measured | meta/canonical/sitemap/robots verified present |

**What was actually verified** (static analysis of `out/` + live HTTP checks, no browser):
- First Load JS: **206 KB gzip** across 10 script chunks referenced by `/index.html` (react-dom 70.8 KB, Next.js RSC/client runtime ~78 KB, Fuse.js 15.5 KB, page code the rest) — **3% over the 200 KB target**. Accepted: the overage is framework floor cost for App Router + client-side dark mode + fuzzy search, all locked-decision features; cutting further means dropping one of those.
- Avatar: fixed to request a 256px GitHub avatar (`&s=256`) instead of the unsized default — 14 KB vs 37 KB.
- Fonts: Geist is self-hosted via `next/font`, confirmed no `fonts.googleapis.com`/`fonts.gstatic.com` request in the build output.
- Contrast: every `@theme` color pair (fg/bg, muted/bg, accent/bg, all against both `background` and `surface`) computed ≥ 6.7:1 in light and dark — see git history for the WCAG math.
- Focus visibility: global `:focus-visible { outline: 2px solid var(--accent) }` added after finding the project-search input had explicitly disabled its outline with no replacement.
- Heading order: single `<h1>`, no skipped levels, verified by grepping every `<h1>`–`<h6>` in the built HTML.
- No secrets/tokens in `out/` or `data/` (`grep -riE 'ghp_|github_pat_|"token"'` → no matches).
- All 19 external links resolve (200/301); GH Pages serves HTTPS with HSTS.
- **Not verified** (no browser automation tool in this environment): keyboard-only tab order, 200%/400% zoom, screen-reader announcement of the live filter count, actual console errors on the deployed page.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
