# Research: GitHub Data Fetching & UX Patterns for Static DevOps Portfolio

**Date:** 2026-07-26  
**Status:** Complete  
**Scope:** Build-time GitHub API fetching, data refresh patterns, stats widgets, search/filter UI, portfolio benchmarks, performance baselines.

---

## Recommendations (TL;DR)

1. **GitHub Data Fetching:** Use Next.js Pages Router with `getStaticProps` + `GITHUB_TOKEN` at build time. REST API (`/users/{user}/repos`) is simpler than GraphQL for this scope. Fetch unauthenticated? Stick to 60 req/hr and cache aggressively. Fetch authenticated (via GitHub Actions secret)? 5000 req/hr, zero rate-limit concern.

2. **Data Freshness:** Schedule a daily GitHub Actions cron (e.g., `0 5 * * *`) that triggers `next build && next export`, commits updated JSON data file to repo, and GitHub Pages auto-deploys. Repos stay fresh without client-side API calls.

3. **Stats Widgets:** Use `github-readme-stats` (self-hosted on Vercel or your own Node.js) for SVG cards (stars, contributions, language breakdown). Hotlink SVG endpoints in static pages. Avoid client-side `react-github-calendar` on a static site—client JS adds overhead, requires API calls, and breaks accessibility when JS fails. SVG is cacheable, serverless-friendly, zero JS.

4. **Search/Filter:** Client-side `Fuse.js` (~8 KB gzipped) for fuzzy search across ~15-20 repos grouped by category. Tag-based filters (category, language, year) sufficient—cmdk command-palette overkill for this dataset size. Use lightweight filter buttons + search input, minimal JS.

5. **Portfolio Structure:** Hero (name + title + GitHub stats badge), About (bio + tech stack), Projects grid grouped by category (Basics / Labs / Practice / Toolkit / Hubs), Blog/Changelog as stretch. Emphasize *impact metrics* (stars, forks, contributions) over feature count. Tech badges (Terraform, K8s, AWS/GCP/Azure, monitoring stack) build credibility fast.

6. **Performance Baseline:** Target Lighthouse **95+ Performance, 95+ Accessibility, 95+ Best Practices**. Semantic HTML (article, section, header, footer, nav), lazy-load images, minimize CSS-in-JS. Static export = fast by default; compress images (next/image + sharp), use webp. No CLS (content layout shift) on this kind of page.

---

## 1. Fetching GitHub Repo Data at BUILD TIME

### Pattern: Next.js Static Generation with API Fetch

#### Pages Router (getStaticProps, recommended for this use case)

**How it works:**
- `getStaticProps` runs at `next build` time, fetches GitHub API, returns data as `props` to the page component.
- Build output is pure HTML/JSON (no runtime API calls).
- Static export (`output: 'export'` in next.config.js) bakes static HTML files.

**Example pattern:**
```javascript
// pages/projects.jsx
export async function getStaticProps() {
  const token = process.env.GITHUB_TOKEN; // from GitHub Actions secret or local .env.local
  const headers = token 
    ? { 'Authorization': `token ${token}` }
    : {};

  const res = await fetch('https://api.github.com/users/tungbq/repos', {
    headers,
  });
  const repos = await res.json();

  return {
    props: { repos },
    revalidate: 86400, // ISR: 24h (ignored in static export; for preview)
  };
}

export default function ProjectsPage({ repos }) {
  return (
    <>
      {repos.map(repo => (
        <article key={repo.id}>
          <h2>{repo.name}</h2>
          <p>{repo.description}</p>
          <span>{repo.stargazers_count} ⭐</span>
        </article>
      ))}
    </>
  );
}
```

**Next.js App Router (static export, limited pattern):**
- App Router does NOT have `getStaticProps`. Instead, use a **build-time script** that pre-fetches data and writes JSON.
- Alternatively: fetch at page load with `fetch()` if your page is not static export (use Vercel instead of GitHub Pages for dynamic behavior).
- **For GitHub Pages static export:** build-time script is the pattern.

**Example App Router pattern:**
```javascript
// app/projects/page.jsx
// (requires pre-fetched data via build script, see below)
import { readFile } from 'fs/promises';

export default async function ProjectsPage() {
  const repos = JSON.parse(
    await readFile(new URL('../../data/repos.json', import.meta.url), 'utf8')
  );
  return (
    // ... render repos
  );
}
```

Then in a build script (`scripts/fetch-github-data.js`):
```javascript
const fs = require('fs');
const token = process.env.GITHUB_TOKEN;
const headers = token ? { 'Authorization': `token ${token}` } : {};

fetch('https://api.github.com/users/tungbq/repos', { headers })
  .then(r => r.json())
  .then(repos => {
    fs.writeFileSync('data/repos.json', JSON.stringify(repos, null, 2));
  });
```

Run in `package.json`: `"build": "node scripts/fetch-github-data.js && next build"`

#### REST API vs GraphQL

**REST (`/users/{user}/repos`):**
- Simpler query (no GraphQL syntax).
- Returns array of repos with basic fields: `name`, `description`, `stargazers_count`, `forks_count`, `language`, `topics`, `updated_at`.
- **Rate limits:** 60 req/hr unauthenticated, 5000 req/hr with token.
- One request fetches ~30 repos (paginated); for ~247 public repos, requires ~8-9 paginated requests.

**GraphQL (v4):**
- More control: fetch only fields you need, fewer round-trips with nested queries.
- GraphQL endpoint: `https://api.graphql.github.com/graphql` (POST).
- **Rate limits:** 5000 points/hr per authenticated user (complex queries cost more points).
- Better for: complex filtering (e.g., repos with >100 stars AND created after 2023).

**Recommendation:** REST API is sufficient. Single loop with pagination, fast, easy to cache. GraphQL adds complexity for minimal gain at this scale.

#### Rate Limit Strategy

**Unauthenticated (60 req/hr):**
- Each repo is 1 request (with pagination, ~1 req per 30 repos).
- For 247 repos: ~8-9 requests. Regenerate daily = 8-9 reqs/day. Well under 60/hr limit.
- No secret needed; cost = 0.
- Risk: public IP might be rate-limited if many users hit same endpoint.

**Authenticated with GITHUB_TOKEN (5000 req/hr):**
- No rate-limit concern. Costs 1 GitHub PAT per GitHub Actions run.
- PAT needed: `repo` scope (or `public_repo` for public repos only).
- Store as GitHub Actions secret: `Settings → Secrets and variables → Actions → GITHUB_TOKEN` (GitHub provides this automatically, or create a PAT manually).
- **Recommendation:** Use authenticated for scheduled rebuilds in CI/CD. Unauthenticated for local dev builds.

#### Data Persistence

**Option A: Commit JSON to repo (recommended for small datasets like ~100 KB repos.json):**
- Build fetches GitHub API, writes to `public/data/repos.json` or `src/data/repos.json`.
- Commit & push via GitHub Actions.
- Pages read from committed file.
- Pro: Version history, rollback possible, human-readable.
- Con: Adds commit noise if refreshed frequently (once daily is fine).

**Option B: GitHub Actions artifact:**
- Fetch, write JSON to artifact, download during deploy job.
- Pro: No repo clutter.
- Con: Artifacts only retained for 1 day by default; harder to inspect/debug.

**Recommendation:** Commit to repo. 247 repos × ~1 KB per entry = ~100-200 KB. Negligible.

---

## 2. Keeping Data Fresh with Scheduled Workflows

### GitHub Actions Scheduled Rebuild Pattern

**Workflow file:** `.github/workflows/scheduled-rebuild.yml`

```yaml
name: Daily Rebuild & Deploy

on:
  schedule:
    - cron: '0 5 * * *'  # 5 AM UTC daily
  workflow_dispatch:     # manual trigger fallback

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Fetch GitHub data
        run: node scripts/fetch-github-data.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build static site
        run: npm run build
      
      - name: Commit & push (if changed)
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data/repos.json
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "chore: refresh GitHub repo data" && git push)
      
      - name: Deploy to Pages
        uses: actions/deploy-pages@v3
```

**Key notes:**
- Cron syntax is UTC. `0 5 * * *` = 5 AM UTC daily (~1 PM/2 PM IST for India, adjust as needed).
- `workflow_dispatch` allows manual trigger from Actions tab for testing.
- `GITHUB_TOKEN` is auto-injected by GitHub; no manual setup needed (5000 req/hr).
- Build runs `fetch-github-data.js` → writes JSON → `next build` reads JSON.
- Commit only if data changed (`git diff --quiet` check avoids noisy empty commits).
- GitHub Pages auto-deploys after push (if Pages is configured to deploy from GitHub Actions).

**Important caveat:** GitHub scheduled runs are "best-effort" and can be delayed 5–15 minutes. No SLA. If delays are unacceptable, use external cron service (e.g., EasyCron, Cronitor) to POST webhook to GitHub Actions instead.

**Troubleshooting:**
- Scheduled workflow pauses after 60 days with no repo activity (push). Add a maintenance push or use `workflow_dispatch` manually if needed.
- If "API rate limit exceeded" still happens: Check if `GITHUB_TOKEN` is actually being injected. Verify `env: { GITHUB_TOKEN: ... }` in step.

---

## 3. Contribution Graph & GitHub Stats Widgets

### Approach A: Static SVG Widgets (Recommended)

**Tool: `github-readme-stats` (self-hosted on Vercel or own Node.js)**

**How it works:**
1. Deploy `github-readme-stats` to Vercel (or self-host Node.js).
2. Endpoints generate SVG dynamically (cached by CDN or GitHub).
3. Embed in static pages as `<img src="https://your-vercel-instance/api/top-langs?username=tungbq&layout=compact" />`.
4. SVG renders as image; no client JS needed.

**Setup (Vercel self-hosted):**
```bash
git clone https://github.com/anuraghazra/github-readme-stats.git
cd github-readme-stats
# Deploy to Vercel via Vercel CLI or web UI
# Set environment variable: GITHUB_TOKEN (PAT with repo scope)
```

**Example static page:**
```jsx
// pages/stats.jsx
export default function StatsPage() {
  const statsUrl = process.env.NEXT_PUBLIC_STATS_URL || 'https://github-readme-stats.vercel.app';
  return (
    <section>
      <h2>GitHub Stats</h2>
      <img 
        src={`${statsUrl}/api/top-langs?username=tungbq&layout=compact`}
        alt="Top Languages" 
        loading="lazy"
      />
      <img 
        src={`${statsUrl}/api?username=tungbq&show_icons=true`}
        alt="GitHub Stats" 
        loading="lazy"
      />
      <img 
        src={`${statsUrl}/api/pin?username=tungbq&repo=devops-basics`}
        alt="devops-basics repo" 
        loading="lazy"
      />
    </section>
  );
}
```

**Pros:**
- No client JS.
- Cacheable by CDN/browser (SVG image).
- Works on static export.
- Rate limits handled server-side (your Vercel instance, not client).
- Automatic refresh every 24 hours (cached by GitHub).

**Cons:**
- Requires self-hosted Vercel instance (free tier works for low traffic).
- If your instance hits rate limits, images fail. **Solution:** Verify `GITHUB_TOKEN` is set on Vercel; PAT with `repo` scope = 5000 req/hr limit.
- Contribution graph (heatmap) not available via SVG.

**Rate limit issue on public Vercel instance:**
The public `github-readme-stats.vercel.app` instance is shared by thousands of users and hits rate limits frequently (returns 503). Self-hosting fixes this: your Vercel instance has its own 5000 req/hr quota.

### Approach B: Client-Side React Component (NOT Recommended for Static Export)

**Tool: `react-github-calendar`**

**Problem:**
- Requires client JS execution.
- Makes API call from browser to GitHub; subject to CORS and client-side rate limits (60 req/hr unauthenticated).
- API token in client code = security risk (exposes auth).
- Breaks if JS fails to load.
- Not ideal for static export (site is static, but component adds client overhead).

**Use only if:**
- Interactivity needed (hover tooltips, drill-down).
- Traffic is low enough that 60 req/hr limit is acceptable.
- Server-side rendering is available (Vercel, not GitHub Pages).

### Recommendation for DevOps Portfolio

**Use `github-readme-stats` (SVG, self-hosted):**
- ✅ Aligns with static-export philosophy.
- ✅ Zero client JS.
- ✅ Rate limits handled server-side.
- ✅ Cacheable.
- ✅ Simple embeds.

**Skip client-side calendar for this scope.** Static site + SVG stats is faster and more reliable. If you later want contribution drill-down, add a separate React component for it (but not critical for initial launch).

---

## 4. Search/Filter UX Patterns for ~15-20 Curated Repos

### Dataset Size & Complexity

- ~15-20 curated repos (not all 247).
- Grouped by category: Basics, Labs, Practice, Toolkit, Hubs, Tools.
- Metadata per repo: name, description, stars, language, topics.

### Approach A: Tag-Based Filter Buttons + Search Input (Lightweight, Recommended)

**UI Layout:**
```
┌─ Search ─────────────────────┐
│ [Fuse.js search input]        │
├─────────────────────────────┤
│ Filters:                      │
│ [All] [Basics] [Labs] ...     │
│ Language: [All] [Go] [HCL]... │
├─────────────────────────────┤
│ Results:                      │
│ [Repo Card 1] [Repo Card 2]   │
│ ...                           │
```

**Implementation (React + Fuse.js):**

```jsx
// components/ProjectFilter.jsx
import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

const REPOS = [
  { name: 'devops-basics', category: 'Basics', language: 'Markdown', stars: 1868 },
  { name: 'devops-toolkit', category: 'Toolkit', language: 'Shell', stars: 60 },
  // ... more repos
];

const CATEGORIES = ['All', 'Basics', 'Labs', 'Practice', 'Toolkit', 'Hubs', 'Tools'];
const LANGUAGES = ['All', 'Go', 'HCL', 'YAML', 'Python', 'Shell'];

export default function ProjectFilter() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');

  const fuse = useMemo(() => new Fuse(REPOS, {
    keys: ['name', 'description', 'topics'],
    threshold: 0.3, // fuzzy match
  }), []);

  const results = useMemo(() => {
    let filtered = search ? fuse.search(search).map(r => r.item) : REPOS;
    
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }
    if (languageFilter !== 'All') {
      filtered = filtered.filter(r => r.language === languageFilter);
    }
    
    return filtered;
  }, [search, categoryFilter, languageFilter, fuse]);

  return (
    <section className="filters">
      <input
        type="text"
        placeholder="Search repos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search repositories"
      />
      
      <fieldset>
        <legend>Category</legend>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            aria-pressed={categoryFilter === cat}
            className={categoryFilter === cat ? 'active' : ''}
          >
            {cat}
          </button>
        ))}
      </fieldset>

      <fieldset>
        <legend>Language</legend>
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => setLanguageFilter(lang)}
            aria-pressed={languageFilter === lang}
            className={languageFilter === lang ? 'active' : ''}
          >
            {lang}
          </button>
        ))}
      </fieldset>

      <ol role="region" aria-live="polite" aria-label="Search results">
        {results.map(repo => (
          <li key={repo.name}>
            <h3>{repo.name}</h3>
            <p>{repo.description}</p>
            <span>⭐ {repo.stars}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

**Bundle size:**
- Fuse.js: ~8–10 KB gzipped.
- React: already in your app.
- **Total overhead: ~10 KB.** Acceptable for static site.

**Pros:**
- ✅ Lightweight.
- ✅ Fast (all filtering client-side).
- ✅ No server needed.
- ✅ Accessible (buttons with `aria-pressed`, search input with label).
- ✅ Fuzzy search handles typos.

### Approach B: Command Palette (cmdk) — Overkill

**Tool: `cmdk`**

**Pattern:**
- Cmd+K opens modal with searchable repo list.
- Fuzzy search across all fields.

**Why not here:**
- ~20 repos is small enough for tag filters.
- Command palette adds UX complexity (modal, keyboard only).
- Better suited for large internal tools (100+ items, power users).
- For a portfolio, discoverable buttons (category filters) are better.

**Use cmdk only if:**
- You want a slick "Dashboard" feel.
- You have 50+ items to search.
- Audience is technical (expects Cmd+K pattern).

**For your scope:** Skip cmdk. Tag filters + Fuse.js is simpler, faster, more inclusive.

### Recommendation

**Use Approach A (tag-based filters + Fuse.js search):**
- ✅ Matches dataset size.
- ✅ Minimal JS.
- ✅ Accessible.
- ✅ Fast.
- ✅ Familiar UX (not fancy, but clear).

---

## 5. DevOps/Engineer Portfolio Site Examples & Patterns

### Credibility Signals (Industry Patterns)

**Hero Section (first 3 seconds):**
- Name + title (e.g., "DevOps Engineer | Kubernetes | Infrastructure Automation").
- Tagline or mission (e.g., "Building resilient cloud infrastructure").
- CTA button: GitHub profile link, or "View Projects".
- Optional: GitHub stats badge (stars, followers, contributions).

**About Section:**
- Short bio (2–3 sentences).
- Tech stack badges: Terraform, Kubernetes, AWS/GCP/Azure, Docker, CI/CD tools (Jenkins, GitLab CI, GitHub Actions).
- Certifications or years of experience.

**Projects Grid (5–10 featured, grouped by category):**
- Project card structure:
  - Name + description (1–2 sentences).
  - Tech stack (badges or text: "Terraform | AWS | ECS").
  - Impact metric: "Reduced deployment time by 60%" or "Serves 10k+ daily active users".
  - Stars + link.
  - (Optional) Screenshot or diagram.

**Blog/Changelog Section (stretch goal):**
- 3–5 recent technical posts or release notes.
- Build credibility: "DevOp engineers who can communicate" stand out.
- Posts: "Lessons from a K8s migration", "Why we chose Terraform over CloudFormation", etc.

**Social Proof:**
- Stars per repo (social proof of adoption).
- Fork count (re-use, community trust).
- Contributions graph (activity).
- GitHub followers.

### Benchmark Examples (from research)

**Strong patterns (from community):**
1. **Hero with Live Stats:** Name + GitHub stats widget (stars, followers) auto-refresh daily.
2. **Impact Metrics, Not Feature Lists:** Instead of "Built 20 microservices", say "Reduced MTTR from 2h to 15m via automated alerting" (concrete, measurable).
3. **IaC Code Snippets:** Show 3–5 line Terraform or K8s manifest samples inline (build credibility fast).
4. **Incident Response Case Study:** "How we recovered from X outage in Y minutes" (real-world, actionable).
5. **Certifications & Badges:** AWS Solutions Architect, CKA, Terraform Associate (third-party credibility).

### Structure for tungbq's Site

**Homepage:**
```
┌─ Hero ───────────────────────────────┐
│ tungbq                                 │
│ DevOps Engineer | K8s | IaC            │
│ [GitHub] [LinkedIn] [Blog]             │
│ ⭐247 repos  👥270 followers           │
└─────────────────────────────────────┘

┌─ Featured Repos (3 with impact) ─────┐
│ [devops-basics ⭐1868]                 │
│ [AWSHub ⭐86]                          │
│ [devops-toolkit ⭐60]                  │
└─────────────────────────────────────┘

┌─ All Projects (searchable grid) ─────┐
│ Basics | Labs | Practice | Toolkit... │
│ [search input]                        │
│ [15–20 project cards]                 │
└─────────────────────────────────────┘

┌─ Tech Stack (badges) ────────────────┐
│ Terraform | Kubernetes | AWS | Docker │
│ GitLab CI | Prometheus | Grafana      │
└─────────────────────────────────────┘

┌─ Blog/Changelog (stretch) ───────────┐
│ "K8s Lessons Learned" (2026-01-15)   │
│ "Terraform Module Library" (2025-12) │
└─────────────────────────────────────┘
```

---

## 6. Accessibility & Performance Baseline

### Lighthouse Targets for Static Sites

**Target scores (2025):**
- **Performance:** 95+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+

Static export sites can easily hit these; the challenge is assets (images, fonts).

### Semantic HTML Checklist

**Required elements:**
- `<header>` for site header/nav.
- `<nav>` for navigation links.
- `<main>` for main content.
- `<article>` for individual project cards.
- `<section>` for grouped content (hero, projects, blog).
- `<footer>` for site footer.
- Proper `<h1>` → `<h2>` → `<h3>` heading hierarchy (only one `<h1>` per page).
- `<img alt="...">` for all images (descriptive alt text).
- `<button>` for interactive elements (not `<div onClick>`).
- Form labels: `<label htmlFor="id">` paired with `<input id="id">`.

**Example structure:**
```jsx
export default function HomePage() {
  return (
    <>
      <header>
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/projects">Projects</a>
          <a href="/blog">Blog</a>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title">
          <h1 id="hero-title">tungbq</h1>
          <p>DevOps Engineer | K8s | IaC</p>
        </section>

        <section aria-labelledby="projects-title">
          <h2 id="projects-title">Featured Projects</h2>
          <article>
            <h3>devops-basics</h3>
            <img src="..." alt="devops-basics repository cover" loading="lazy" />
            <p>...</p>
          </article>
        </section>
      </main>

      <footer>
        <p>&copy; 2026 tungbq. All rights reserved.</p>
      </footer>
    </>
  );
}
```

### Performance Optimization

**Images:**
- Use `next/image` (automatic optimization, WebP, responsive sizes).
- Lazy-load off-screen images: `loading="lazy"` or Next.js `priority=false`.
- Compress: 80–90 KB per hero image, <30 KB per thumbnail.
- Modern format: WebP (fallback JPEG).

**CSS:**
- Avoid CSS-in-JS for static export (adds runtime overhead).
- Use Tailwind CSS (purges unused styles, ships ~20–50 KB).
- Or hand-written CSS (~5–10 KB if minimal).
- Critical CSS inlined in `<head>` (if needed for above-the-fold).

**Fonts:**
- System fonts (no web fonts) for fastest load: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- If custom fonts: use `next/font` with preload + swap strategy (FOUT, not FOIT).

**Lighthouse Metrics:**
- **LCP (Largest Contentful Paint):** <2.5s. Hit via hero image optimization.
- **FID (First Input Delay):** <100ms. Static export = near-zero JS, easy target.
- **CLS (Cumulative Layout Shift):** <0.1. Avoid dynamic content shifts; use fixed aspect ratios for images.

**Build output:**
- `next build` for static export generates `.html` + `.js` bundles.
- Analyze bundle: `npm run build && npx bundle-analyzer` (or Vercel analytics).
- Aim for <200 KB total JS for content-heavy site.

### Accessibility Audit Checklist (WCAG 2.1 AA)

Run `npx lighthouse https://your-site --chrome-flags="--headless" --output=html` locally.

**Common failures to avoid:**
- Missing alt text on images.
- Color contrast ratio <4.5:1 (text on background).
- Missing form labels.
- Keyboard navigation broken (tabindex=-1 overuse).
- Heading hierarchy skipped (e.g., h1 → h3, no h2).
- Missing ARIA labels on landmark regions.

**Testing:**
- Tab through site: all interactive elements reachable via keyboard.
- Zoom to 200%: layout doesn't break.
- Dark mode CSS media query: `prefers-color-scheme` (stretch goal).
- Screen reader (VoiceOver, NVDA): test at least one.

---

## Summary Table: Tech Choices

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Build-time fetch** | Pages Router + `getStaticProps` | Simplest, well-documented, static export compatible. |
| **GitHub Auth** | Authenticated PAT (5000 req/hr) | Zero rate-limit risk for scheduled rebuild. |
| **Data persistence** | Commit repos.json to repo | Versioned, human-readable, easy to debug. |
| **Refresh schedule** | Daily 5 AM UTC cron | Once daily sufficient for portfolio (repos don't change hourly). |
| **Stats widget** | github-readme-stats (self-hosted SVG) | No client JS, cacheable, rate limits handled server-side. |
| **Contribution graph** | Skip for MVP | SVG stats are sufficient; client-side calendar adds complexity. |
| **Search/filter** | Fuse.js + tag filters | Lightweight (~10 KB), no backend, fast, accessible. |
| **Command palette** | Skip | Overkill for ~20 repos; simpler UX wins. |
| **Portfolio structure** | Hero + About + Projects grid + Blog (stretch) | Standard pattern; emphasize impact metrics, not feature count. |
| **Performance target** | Lighthouse 95+ | Easily achievable with semantic HTML, lazy-load images, minimal JS. |

---

## Unresolved Questions

1. **Contribution graph on static site:** `github-readme-stats` does not offer a contribution heatmap (per API limitations). Is a heatmap must-have, or is text-based stats (stars, languages, contributions count) sufficient? → **Decision needed:** if heatmap required, must use client-side component + accept rate-limit / JS overhead.

2. **Blog/changelog CMS:** If added as stretch goal, use markdown files (git-based) or external CMS? Markdown is simpler for static export but requires manual deploy per post. External CMS (Ghost, Contentful) decouples but adds auth/cost. → **Defer to phase 2.**

3. **Dark mode toggle:** Mentioned as feature goal. Implement via CSS media query (`prefers-color-scheme`) only (automatic), or add JS toggle for user preference? → **Recommend: media query only for MVP** (no JS overhead, respects system preference).

4. **GitHub API pagination:** If repos grow to 500+, pagination overhead increases. Caching strategy (ETag, conditional requests) needed? → **Not urgent for ~247 repos**, but document for future.

---

## Sources

- [Next.js getStaticProps Documentation](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props)
- [Next.js Static Exports Guide](https://nextjs.org/docs/app/guides/static-exports)
- [GitHub Actions Scheduled Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [GitHub Actions Deploy to Pages](https://github.com/actions/deploy-pages)
- [github-readme-stats Repository](https://github.com/anuraghazra/github-readme-stats)
- [github-readme-stats Self-Hosting Guide](https://dev.to/uya0526design/self-host-your-github-stats-badge-on-vercel-fixing-the-broken-image-on-your-profile-readme-la0)
- [Fuse.js Documentation](https://www.fusejs.io/articles/using-fuse-with-react.html)
- [cmdk React Command Palette](https://www.npmjs.com/package/cmdk)
- [DevOps Portfolio Best Practices](https://dev.to/sanjaysundarmurthy/the-devops-engineers-guide-to-building-a-portfolio-that-actually-gets-you-hired-17jg)
- [Lighthouse Performance Scoring 2025](https://wpdeveloper.com/google-lighthouse-how-to-achieve-highest-score-in-2025/)
- [Semantic HTML Best Practices 2025](https://dev.to/gerryleonugroho/semantic-html-in-2025-the-bedrock-of-accessible-seo-ready-and-future-proof-web-experiences-2k01)
- [Web Almanac Accessibility 2025](https://almanac.httparchive.org/en/2025/accessibility)
