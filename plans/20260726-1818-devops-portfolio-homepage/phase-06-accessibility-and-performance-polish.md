# Phase 06 — Accessibility & Performance Polish

## Context Links

- Plan: [plan.md](plan.md) · Depends on: [phase-05](phase-05-homepage-content-sections.md)
- Research: [researcher-02 §6 Accessibility & Performance Baseline](research/researcher-02-github-data-ux-patterns.md)

## Overview

- **Priority:** P2 (quality gate, not a blocker to first publish)
- **Status:** pending
- **Effort:** ~1.5h
- **Description:** Measure the deployed site, fix what misses the bar, and record the numbers. Audit-and-fix, not new features.

## Key Insights

1. **Audit the deployed URL, not localhost.** `next dev` scores are meaningless (unminified, HMR overhead) and even `next start` doesn't exist for a static export. Real GH Pages serving (compression, caching headers, real latency, real third-party SVG fetch) is the only representative target.
2. **Lighthouse needs Chrome; this WSL box may not have one.** Verify before relying on the local CLI. Fallback ladder: PageSpeed Insights web UI (same Lighthouse engine, runs against the public URL — works with zero local setup) → Chrome DevTools on Windows against the live URL → `npx lighthouse` in WSL only if a Chrome binary is present.
3. **Automated a11y catches ~30–40% of issues.** Lighthouse 100 is necessary, not sufficient. Manual passes required: keyboard-only traversal, 200% zoom, focus visibility, and one screen-reader sanity check of the filter `aria-live` announcement.
4. **The likely misses are known in advance** (from phase-05 hand-off): remote SVG widgets (render-blocking-ish, CLS, third-party), the avatar as LCP, and contrast on muted text in dark mode. Check those three first rather than sweeping.
5. **Best Practices score dings on third-party content and console errors** — a 503 from the stats origin during the audit run will cost points. Run the audit twice; if the widget is flaky, that is data for plan.md Q5, not noise to ignore.
6. **Record the baseline in the repo.** A score with no artifact is a claim. Commit the numbers (and date) to the README so regressions are visible later.
7. **Do not add a Lighthouse CI workflow for MVP.** One more workflow, one more flake source, for a single-page site that changes weekly. YAGNI — revisit if the site grows routes.

## Requirements

**Functional**
- Lighthouse (mobile, deployed URL): Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
- Every automated a11y violation fixed or explicitly justified.
- Manual keyboard/zoom/contrast passes clean.

**Non-functional**
- LCP < 2.5 s, CLS < 0.1, TBT < 200 ms (mobile throttled).
- First Load JS < 200 KB.
- No console errors or warnings on the deployed site.

## Architecture

```
deployed site ──► PageSpeed Insights / Lighthouse ──► scores + opportunities
                                                          │
                    ┌─────────────────────────────────────┤
                    ▼                    ▼                ▼
              perf fixes           a11y fixes       SEO/BP fixes
           (image sizes,       (contrast, labels,  (meta, canonical,
            lazy, fonts)        focus, headings)    console errors)
                    └──────────► re-audit ──► record in README
```

Fixes land in files owned by phases 04/05 — this phase runs **after** both are merged, never in parallel with them.

## Related Code Files

**Modify (as findings dictate)**
- `app/globals.css` — contrast tokens, focus-visible rings, reduced-motion
- `components/sections/*`, `components/projects/*` — alt text, heading order, aria
- `components/layout/*` — landmarks, skip-link behavior
- `public/avatar.jpg` — recompression
- `README.md` — recorded scores + audit date

**Create**
- `docs/accessibility-checklist.md` (short, repeatable manual pass)

## Implementation Steps

1. **Confirm tooling:** `which google-chrome chromium chromium-browser` in WSL. If none, use PageSpeed Insights against `https://tungbq.github.io/dohsites/` — do not sink time installing Chrome in WSL for a one-off audit.
2. **Baseline run** (mobile + desktop). Save the four scores and the opportunities list before changing anything.
3. **Performance pass, in likely-impact order:**
   - Avatar: correct intrinsic size, compressed < 60 KB, `priority`, explicit dims.
   - Remote stats SVGs: `loading="lazy"`, explicit dims, below the fold.
   - Fonts: confirm `next/font` self-hosting (no runtime Google Fonts request in the Network tab) and `display: swap`.
   - Check `next build` First Load JS; if > 200 KB, find the offender before optimizing anything else.
4. **Accessibility pass:**
   - Headings: one `<h1>`, no skipped levels (`document.querySelectorAll('h1,h2,h3')` walk).
   - Contrast: sample body text, muted text, badges, and button states in **both** themes; fix tokens, not one-off classes.
   - `:focus-visible` ring on every interactive element, ≥ 3:1 against its background.
   - Keyboard-only traversal: skip-link → nav → theme toggle → search → each filter button → each card link. No traps, order matches visual order.
   - Zoom to 200% and 400%: no horizontal scroll, no clipped text.
   - Screen reader: change a filter, confirm the count is announced.
   - Alt text: descriptive for avatar and stats widgets; decorative icons `aria-hidden`.
5. **Best Practices / SEO pass:** zero console errors; all links resolve (no 404s from the header anchors); canonical present; `lang="en"`; images have dimensions; sitemap/robots reachable on the live host.
6. **Fix, redeploy, re-audit.** Iterate until all four thresholds are met.
7. **Record** final scores + date in `README.md`; write `docs/accessibility-checklist.md` as the reusable manual pass.
8. **Log any accepted miss** with its reason (e.g. a Best-Practices deduction caused solely by the third-party stats origin) — an explicitly accepted gap is fine; an unexplained one is not.

## Todo List

- [ ] Audit tooling confirmed (local Chrome or PSI)
- [ ] Baseline scores captured before any fix
- [ ] Avatar optimized (< 60 KB, sized, `priority`)
- [ ] Remote SVGs lazy + sized
- [ ] Fonts self-hosted, no runtime font request
- [ ] First Load JS < 200 KB verified
- [ ] Heading hierarchy validated
- [ ] Contrast AA in light **and** dark
- [ ] `:focus-visible` on all interactive elements
- [ ] Keyboard traversal clean, order matches visual
- [ ] 200% zoom clean
- [ ] `aria-live` filter announcement verified with a screen reader
- [ ] Alt text audited; decorative icons hidden
- [ ] Zero console errors on deployed site
- [ ] All four Lighthouse thresholds met
- [ ] Scores + date in README; `docs/accessibility-checklist.md` written
- [ ] Accepted misses documented with rationale

## Success Criteria

| Criterion | Target | Verification |
|---|---|---|
| Performance | ≥ 95 | Lighthouse mobile, deployed URL |
| Accessibility | ≥ 95 | Lighthouse + manual checklist |
| Best Practices | ≥ 95 | Lighthouse |
| SEO | ≥ 90 | Lighthouse |
| LCP | < 2.5 s | Lighthouse metrics |
| CLS | < 0.1 | Lighthouse metrics |
| TBT | < 200 ms | Lighthouse metrics |
| First Load JS | < 200 KB | `next build` output |
| Keyboard | 100% reachable | manual traversal |
| Contrast | AA both themes | contrast checker |
| Console | 0 errors | devtools on deployed site |

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| No Chrome in WSL blocks local Lighthouse | High × Low | PSI against the public URL (step 1) — no local install needed |
| Third-party stats SVG caps Best Practices/Perf | Med × Med | Measure with and without; feeds plan.md Q5 decision rather than a silent workaround |
| Dark-mode contrast failures require palette rework | Med × Med | Fix at the `@theme` token level so both themes stay consistent |
| Chasing the last 2–3 points burns hours | Med × Med | Timebox to ~1.5h; document accepted misses (step 8) |
| Fixes here regress phase-05 behavior | Low × Med | Re-run `npm test` + the JS-disabled and filter checks after each fix batch |
| Scores drift after future content changes | Med × Low | Checklist committed to `docs/` makes the pass repeatable |

## Security Considerations

- Lighthouse "Best Practices" flags missing CSP and insecure requests — for a static GH Pages site, HTTPS is enforced by the host; a CSP would need `<meta http-equiv>` since no response headers are configurable. Evaluate but do not ship a broken CSP for points.
- Verify no third-party origin beyond the intended stats host appears in the Network tab (would indicate an accidental dependency).
- Confirm `data/github.json` and the built HTML contain no tokens or private data before declaring done: `grep -riE 'ghp_|github_pat_|token' out/ data/` → expect no matches.
- Confirm GH Pages serves over HTTPS with "Enforce HTTPS" enabled in repo settings.

## Rollback

Fixes are small and independent; revert individual commits. Worst case the site returns to phase-05 state — functional, just below target scores.

## Next Steps

- **Post-MVP backlog (not scheduled):** custom domain cutover (plan.md Q1), analytics (Q2), blog/CMS (Q3), contribution heatmap (Q4), per-project detail pages with `SoftwareSourceCode` JSON-LD, URL-synced filter state, Lighthouse CI workflow.
- **Before any of the above:** resolve plan.md open questions with the user — Q1 in particular changes `basePath`, sitemap, and OG absolute URLs, and is cheapest to do before external links accumulate.
