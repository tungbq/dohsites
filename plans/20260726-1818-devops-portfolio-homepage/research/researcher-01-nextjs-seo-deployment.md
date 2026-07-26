# Research: Next.js 15 Static Export, SEO & GitHub Pages Deployment

**Date:** 2026-07-26  
**Scope:** Next.js 15.x App Router, static export (`output: 'export'`), GitHub Pages deployment, SEO optimization, dark mode, animations, styling.

---

## Recommendations (Executive Summary)

1. **Deployment model:** Use GitHub Pages project page (tungbq.github.io/dohsites) with `basePath: '/dohsites'` + `assetPrefix` to avoid custom domain complexity. Static export fully supported, no build-time surprises.

2. **OG images:** Use static `.jpg` files in `app/opengraph-image.jpg` + `twitter-image.jpg`. `ImageResponse` (next/og) DOES NOT work reliably with static export (known GitHub issue #55890). Static files guaranteed to build and deploy.

3. **Animation library:** Use CSS/Tailwind for simple animations (no bundle cost). If dynamic animations needed: Motion (~12 KB gzipped, formerly Framer Motion) > Framer Motion (32-46 KB) >> GSAP (23 KB for core, +10 KB for ScrollTrigger). Motion recommended for static portfolios.

4. **Dark mode:** Use `next-themes` v0.2.3+ with anti-flash inline script in root layout. Works cleanly with static export; localStorage hydration deferred to client. No server-side theme detection needed.

5. **Styling:** Tailwind CSS v4 is NOW recommended for Next.js 15 (70% smaller CSS output than v3). No `tailwind.config.js` needed; v4 auto-scans. Just import `@tailwind base;` in CSS entry file.

6. **SEO:** Use App Router Metadata API (`generateMetadata`, static `metadata` exports) + file-based `sitemap.ts` and `robots.ts`. `next/og` incompatibility means use static metadata + JSON-LD for rich snippets. Person schema for portfolio works great.

---

## 1. Static Export Mechanics

### Config Setup
```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Optional but recommended for GitHub Pages project site:
  basePath: '/dohsites',
  assetPrefix: '/dohsites/',
  // Required for next/image with static export:
  images: {
    unoptimized: true, // OR use custom loader (e.g., Cloudinary)
  },
  // Optional trailing slash handling:
  // trailingSlash: true,
  // distDir: 'out',
};

export default nextConfig;
```

### What WORKS under `output: 'export'`
- **Server Components** — run during build, generate static HTML
- **Client Components** — prerendered to HTML + JS bundle for client hydration
- **Static routes** — all paths precompiled at build time
- **App Router file conventions** — layouts, pages, error boundaries
- **`generateStaticParams()`** for dynamic routes (MUST define all params at build time)
- **Route Handlers** (GET only, static responses, no Request-time APIs)
- **`next/image`** with `unoptimized: true` or custom loader (Cloudinary, etc.)
- **Static metadata** (favicon.ico, opengraph-image.jpg, twitter-image.jpg)

### What DOES NOT WORK (Unsupported)
- **Dynamic routes WITHOUT `generateStaticParams()`** — static export requires all params known at build time
- **`dynamicParams: true`** — can't handle unknown routes at runtime
- **Route Handlers with `Request` object** — no runtime server to handle requests
- **Cookies/Headers** — no access to request context during static generation
- **Rewrites/Redirects/Headers** — no server to evaluate them at request time
- **Incremental Static Regeneration (ISR)** — no revalidation after deploy
- **Draft Mode** — editorial workflow not supported
- **Server Actions** — require server runtime
- **`next/image` default loader** — requires on-the-fly optimization server (need `unoptimized: true`)
- **`ImageResponse` (next/og)** for DYNAMIC OG images — NOT compatible with static export (GitHub issue [#55890](https://github.com/vercel/next.js/discussions/55890))
- **Intercepting Routes** — require server-side middleware

### Key Gotchas
1. **Build-time fetch errors block deployment** — all Server Component fetches must succeed or build fails. Use error boundaries + graceful fallbacks.
2. **Trailing slash inconsistency** — set `trailingSlash` config consistently; mismatches cause 404s.
3. **next/image with static export** — always use `unoptimized: true` (images won't be resized/optimized on deploy). Consider hosting images on CDN and using `remotePatterns`.
4. **OG image generation** — `ImageResponse` won't work; use static files only.
5. **`generateStaticParams()` must return complete list** — incomplete lists + `dynamicParams: false` = 404 for missing routes.

---

## 2. GitHub Pages Deployment Path & Workflow

### Option A: Project Page (RECOMMENDED for tungbq/dohsites)
- **URL:** `https://tungbq.github.io/dohsites`
- **Requires:** `basePath: '/dohsites'` + `assetPrefix: '/dohsites/'` in next.config
- **Pros:** No DNS setup, uses existing GitHub Pages infrastructure, works out of box
- **Cons:** All paths include `/dohsites/` prefix

### Option B: User/Org Site (if renaming repo to tungbq.github.io)
- **URL:** `https://tungbq.github.io`
- **Requires:** Repo named `tungbq.github.io`, NO basePath/assetPrefix needed
- **Pros:** No path prefix, cleaner URLs
- **Cons:** Requires repo rename (only ONE user site per account)

### Option C: Custom Domain
- **URL:** `yourdomain.com`
- **Requires:** CNAME file in /public, DNS A/ALIAS records pointing to GitHub Pages IPs
- **Pros:** Full domain control, no path prefix, professional
- **Cons:** Domain registration cost, DNS setup complexity

**Decision:** Proceed with **Option A** (project page) for now. Upgrade to custom domain later if site gains traction.

### GitHub Actions Workflow (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Next.js to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Next.js
        run: npm run build
        env:
          NEXT_PUBLIC_BASEPATH: /dohsites

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Setup Checklist
1. Create `.github/workflows/deploy.yml` (above)
2. Commit & push to main
3. Go to repo **Settings → Pages → Source**: Change from "Deploy from branch" to **GitHub Actions**
4. Add `.nojekyll` file to `/public` (tells GitHub Pages to skip Jekyll processing)
5. Redeploy via **Actions** tab or push to trigger workflow
6. Site available at `https://tungbq.github.io/dohsites` within 5-10 min

### Why `actions/upload-pages-artifact` + `actions/deploy-pages`?
- Official GitHub actions (maintained, no third-party risk)
- Handles artifact upload, permissions, and deployment automatically
- Cleaner than manual Git push or third-party actions like `peaceiris/actions-gh-pages`

---

## 3. SEO for Static Next.js Sites

### Metadata API (App Router)

**Static Metadata** (preferred for portfolio):
```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tung Bui | DevOps Engineer',
  description: 'Portfolio & insights on DevOps, infrastructure-as-code, and cloud automation.',
  openGraph: {
    title: 'Tung Bui | DevOps Engineer',
    description: 'Portfolio & insights on DevOps, infrastructure-as-code, and cloud automation.',
    url: 'https://tungbq.github.io/dohsites',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tung Bui | DevOps Engineer',
    description: 'Portfolio & insights on DevOps, infrastructure-as-code, and cloud automation.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html>{children}</html>
}
```

**Dynamic Metadata** (for blog posts, project pages):
```tsx
// app/projects/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const slug = (await params).slug
  // Fetch during build; must succeed or build fails
  const project = await fetch(`https://api.example.com/projects/${slug}`).then(r => r.json())

  return {
    title: project.title,
    description: project.summary,
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  // ...
}
```

### Static OG Images (Recommended)

Since `ImageResponse` doesn't work reliably with static export, use static files:

```
app/
├── opengraph-image.jpg       (1200×630px, for homepage)
├── opengraph-image.alt.txt   ("Tung Bui | DevOps Engineer")
├── twitter-image.jpg         (1200×630px, Twitter card)
└── projects/
    └── [slug]/
        ├── opengraph-image.jpg
        └── opengraph-image.alt.txt
```

**Alt text file example** (`app/opengraph-image.alt.txt`):
```
Tung Bui | DevOps Engineer & Open Source Contributor
```

**Pros of static OG images:**
- Guaranteed to work with static export
- Fast delivery (no generation overhead)
- Consistent branding

**Con:**
- Can't generate per-page custom text/images at build time
- Workaround: Pre-generate images with Satori locally, commit as static files

### Sitemap & Robots (File Conventions)

**`app/sitemap.ts`** (auto-served as `/sitemap.xml`):
```tsx
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tungbq.github.io/dohsites',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://tungbq.github.io/dohsites/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://tungbq.github.io/dohsites/projects',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://tungbq.github.io/dohsites/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}
```

**`app/robots.ts`** (auto-served as `/robots.txt`):
```tsx
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/.well-known/'],
    },
    sitemap: 'https://tungbq.github.io/dohsites/sitemap.xml',
  }
}
```

### JSON-LD Structured Data (Person Schema for Portfolio)

Add to root layout or dedicated component:

```tsx
// app/layout.tsx (or components/schema-org.tsx)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Tung Bui',
    url: 'https://tungbq.github.io/dohsites',
    description: 'DevOps Engineer, open source contributor',
    jobTitle: 'DevOps Engineer',
    sameAs: [
      'https://github.com/tungbq',
      'https://twitter.com/tungbq',
      'https://linkedin.com/in/tungbq',
    ],
    image: 'https://tungbq.github.io/dohsites/avatar.jpg',
  }

  return (
    <html>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**For projects**, use `SoftwareSourceCode` schema:
```tsx
{
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: 'Project Name',
  description: 'Brief description',
  url: 'https://tungbq.github.io/dohsites/projects/my-project',
  codeRepository: 'https://github.com/tungbq/my-project',
  license: 'MIT',
  programmingLanguage: ['Go', 'TypeScript', 'Rust'],
}
```

### SEO Checklist
- [ ] Static metadata on root layout + per-page overrides
- [ ] Sitemap.ts includes all major routes
- [ ] Robots.ts configured correctly
- [ ] Static OG images placed (1200×630px JPG)
- [ ] JSON-LD Person schema in head
- [ ] All links use relative paths (handled by basePath)
- [ ] Favicon in `/public/favicon.ico`
- [ ] Meta viewport tag (auto-added by Next.js)
- [ ] Test with Google's Rich Results Test

---

## 4. Dark Mode with Static Export

### next-themes Setup (Recommended)

**Install:**
```bash
npm install next-themes
```

**Root Layout** (`app/layout.tsx`):
```tsx
import { ThemeProvider } from 'next-themes'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Portfolio',
  colorScheme: 'light dark', // Let browser know both modes supported
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* Anti-flash script: prevents white flash on dark-mode users */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || 
                    (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Theme Toggle Component** (`components/theme-toggle.tsx`):
```tsx
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

**Tailwind Config** (`tailwind.config.ts`):
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

### Why This Works with Static Export
- **Anti-flash script** runs BEFORE hydration, adds `dark` class if localStorage says so
- **Server Components** ignore localStorage (no error), just render static HTML
- **Client Components** hydrate on client, theme syncs from localStorage
- **No ISR revalidation needed** — theme is client-side only
- **No request context required** — all decisions happen client-side

### FOUC Prevention
The inline script (anti-flash) is CRITICAL. Without it:
1. Page renders with light theme (no localStorage on server)
2. JS loads, next-themes reads localStorage
3. Dark class added to HTML
4. Flash of light → dark (janky UX)

With the script:
1. Script runs in `<head>`, before React
2. Detects localStorage + system preference
3. Adds dark class BEFORE page paints
4. No flash ✓

---

## 5. Animation Library Comparison

| Metric | Motion | Framer Motion | GSAP | CSS/Tailwind |
|--------|--------|---------------|------|-------------|
| **Gzipped Size** | ~12 KB | 32-46 KB | 23 KB (core) | 0 KB (built-in) |
| **Learning Curve** | Shallow (React) | Shallow (React) | Steep | Very shallow |
| **Static Export** | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes |
| **Use Case** | Simple animations | Complex sequences | Heavy animations | Lightweight portfolio |
| **Browser APIs** | Native + Framer | React spring physics | Proprietary engine | CSS3 animations |
| **GSAP vs Motion** | Motion 12 KB smaller | N/A | Core 23 KB; +10 KB ScrollTrigger | N/A |

### Recommendation for DevOps Portfolio
**Use CSS/Tailwind animations FIRST.** Add Motion only if dynamic sequences needed.

**Why:**
- Portfolio sites rarely need complex interactions
- CSS animations have zero runtime cost
- Tailwind v4 includes `animate-*` utilities out of box
- Motion adds 12 KB if you later need programmability

### CSS Animation Examples (Tailwind v4)

```tsx
// Simple fade-in on scroll
export function FadeIn() {
  return (
    <div className="animate-fade-in">
      <h1>Hello</h1>
    </div>
  )
}

// In tailwind.config.ts
export default {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
}
```

### Motion (if you upgrade later)

```tsx
'use client'

import { motion } from 'motion/react'

export function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-white p-4 rounded"
    >
      <h2>Card with animation</h2>
    </motion.div>
  )
}
```

**Install:** `npm install motion`

---

## 6. Tailwind CSS v4 Setup with Next.js 15

### Key Changes in Tailwind v4
- **No config file needed** — v4 auto-scans `app/` and `components/` (if exists)
- **CSS-first approach** — use `@theme` directive in CSS files instead of config object
- **70% smaller CSS** — typical output 6-12 KB gzipped (vs 20-30 KB v3)
- **Faster builds** — no PostCSS plugin overhead

### Setup

**1. Install:**
```bash
npm install -D tailwindcss postcss autoprefixer
```

**2. Create `postcss.config.mjs`:**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**3. Create `app/globals.css` (or `styles/globals.css`):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**4. Import in `app/layout.tsx`:**
```tsx
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

**5. (Optional) Create `tailwind.config.ts` only if you need custom theme:**
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'devops-blue': '#0066cc',
      },
    },
  },
}

export default config
```

### Upgrade from Tailwind v3
If adding v4 to existing v3 project:
1. Remove old `tailwind.config.js`
2. Update `postcss.config.js` to use v4 syntax
3. Update CSS entry (`@tailwind base;` is now all that's needed)
4. Run `npm run build` to test
5. Check for v4 breaking changes in your custom config (if any)

### Performance Gain
**Before (Tailwind v3):** ~25-30 KB gzipped  
**After (Tailwind v4):** ~6-12 KB gzipped  
**Savings:** 70% reduction → ~17 KB saved (faster page loads)

---

## 7. Implementation Checklist

### Phase 1: Core Setup
- [ ] Initialize Next.js 15 with `create-next-app` + TypeScript
- [ ] Configure `next.config.mjs` with `output: 'export'` + `basePath` + `images: { unoptimized: true }`
- [ ] Setup Tailwind CSS v4 (no config file needed)
- [ ] Setup dark mode with `next-themes` + anti-flash script

### Phase 2: SEO & Metadata
- [ ] Create root metadata (title, description, OG, Twitter)
- [ ] Add static OG images (1200×630px JPG)
- [ ] Create `app/sitemap.ts`
- [ ] Create `app/robots.ts`
- [ ] Add JSON-LD Person schema to layout

### Phase 3: GitHub Pages Deployment
- [ ] Add `basePath: '/dohsites'` + `assetPrefix` to config
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Add `.nojekyll` to `/public`
- [ ] Push to GitHub and test deployment

### Phase 4: Content & Styling
- [ ] Build homepage, about, projects, blog sections
- [ ] Use CSS animations for interactions (no Motion initially)
- [ ] Test dark mode (toggle + system preference)
- [ ] Validate with Google's Rich Results Test

---

## Unresolved Questions

1. **Custom domain future:** When is the site ready to move to a custom domain? Estimate timeline for switching from `tungbq.github.io/dohsites` to `tungbq.dev` or similar.

2. **Analytics:** Should we add Vercel Analytics, Plausible, or another privacy-respecting tool? (Vercel Analytics works with static export if deployed to Vercel, but GitHub Pages requires external service).

3. **Search-engine discoverability for blog:** Will static SEO (sitemap + metadata + schema) be sufficient for Google rankings, or should we consider a content strategy (e.g., cross-posting to Dev.to, hashnode)?

4. **Image hosting strategy:** Store images locally in `/public` or use external CDN (Cloudinary, Vercel Image Optimization not available with static export)?

5. **Update frequency:** For a static site, content updates require new deployment. Should we add a headless CMS (Contentful, Sanity) for blog post management, or keep it Git-based (Markdown in repo)?

---

## Sources

- [Next.js Static Exports Guide](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images)
- [Next.js Metadata API](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [OpenGraph Image Conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [GitHub Pages Static Export Deployment](https://github.com/gregrickaby/nextjs-github-pages)
- [GitHub Actions Next.js Workflow](https://github.com/actions/starter-workflows/blob/main/pages/nextjs.yml)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS v4 Next.js Setup](https://tailwindcss.com/docs/guides/nextjs)
- [Motion (Framer Motion Rebranded) Docs](https://motion.dev)
- [GSAP vs Motion Comparison](https://motion.dev/docs/gsap-vs-motion)
- [JSON-LD Structured Data for Next.js](https://nextjs.org/docs/app/guides/json-ld)
- [Dark Mode FOUC Prevention](https://www.notanumber.in/blog/fixing-react-dark-mode-flickering)
