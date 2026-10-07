# CraftCalc — Free Minecraft Circle, Portal & Build Calculators

A static Astro site with 4 free browser-based tools for Minecraft builders:

| Tool | URL | What it does |
|---|---|---|
| Circle Generator | `/circle-generator/` | Pixel-perfect circles and ovals with copyable build plans (outline/filled/ring) |
| Sphere Generator | `/sphere-generator/` | Layer-by-layer sphere, dome and bowl plans with exact radii |
| Nether Portal Calculator | `/nether-portal-calculator/` | Coordinate conversion at the 8:1 ratio, both directions |
| Beacon Calculator | `/beacon-calculator/` | Pyramid block counts, ingots and effect radius per level |

Plus support pages: home, all-tools hub, guide, about, methodology, contact, changelog, HTML sitemap, privacy, terms, 404.

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output to dist/
npm run preview    # serve the build locally
```

Node 22+ required. No environment variables, no backend, no database.

## Verification

```bash
node scripts/test-math.mjs   # 28 tests (circle rasterization, sphere layers, portal ratio, beacon mechanics, XP)
node scripts/test-dom.mjs    # 17 DOM tests (loads built pages in jsdom, runs the tools)
```

Both must pass before deploy. The DOM tests execute the actual bundled scripts and verify rendered grids (e.g. r=10 circle is 4-fold symmetric).

## Project structure

```
src/
├── data/site.ts         # Site name, domain, contact email
├── lib/craft.ts         # Pure math functions (circle/sphere/portal/beacon/XP)
├── layouts/Base.astro   # <head> SEO: title, meta, canonical, OG, JSON-LD graph
├── components/          # Header, Footer, Breadcrumbs, Faq, ToolCard, TrustBlock
├── styles/global.css    # Design system (dark theme, blocky green accent)
└── pages/               # One directory per route; tool pages carry their own client script
public/                  # robots.txt, favicon.svg, og-default.png, logo-512.png
scripts/
├── test-math.mjs        # Formula tests
├── test-dom.mjs         # Browser-behavior tests (jsdom + esbuild)
└── gen-assets.py        # Regenerates OG image / logo / favicon (PIL)
```

## Editing guide

- **Change copy**: each page's text lives in its own `src/pages/<tool>/index.astro`.
- **Change colors/spacing**: `src/styles/global.css` variables at `:root`.
- **Update example numbers**: recompute with `node scripts/test-math.mjs`; never hand-wave numbers.
- **Regenerate images**: `python3 scripts/gen-assets.py`.
- **Domain change**: `src/data/site.ts` + `astro.config.mjs` (site:) + `public/robots.txt` sitemap line.

## SEO implementation notes

- SSG: all content (headings, tool shells, FAQ answers, internal links, JSON-LD) is in the server HTML. Tools hydrate as plain inline scripts.
- One H1 per page; titles ≤ 60 chars, meta ≤ 155 (audited before ship).
- JSON-LD: Organization + WebSite sitewide; BreadcrumbList on subpages; WebApplication on every tool; Article on guides. No fake ratings.
- Canonicals self-referencing; sitemap-index generated; robots.txt allows CSS/JS.
- E-E-A-T: methodology page with formulas and sources (Minecraft Wiki mechanics), changelog, contact, privacy.
- Privacy: zero trackers; all math client-side.
- Not affiliated with Mojang Studios or Microsoft.

## Deploy (Cloudflare Pages)

| Setting | Value |
|---|---|
| Framework preset | Astro (or None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(empty — repo root)* |
| Node version | 22+ required; set env var `NODE_VERSION=22` if the build fails on an older default |

After deploy:
1. Add your custom domain (`craftcalc.top`) in Cloudflare Pages → Custom domains.
2. Submit `https://<domain>/sitemap-index.xml` in Google Search Console + Bing Webmaster Tools.
3. Post-deploy checks: canonicals point at the production domain; 404 returns a real 404.

## Accuracy policy

- Game mechanics (portal ratio, beacon ranges, XP formulas) follow documented Minecraft Wiki values, re-checked at release; changes ship with changelog entries.
- Circle/sphere maths uses standard algorithms (midpoint circle, layer stacking) with hand-verified test cases.
