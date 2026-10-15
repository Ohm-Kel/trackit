# Landing page performance and SEO

Lighthouse measurements of the public landing page, what changed, and the
checks that keep it there.

## Method

- Production build (`vite build`) served by `vite preview`, measured at
  `/landing` and at `/`. Signed-out visitors to `/` are redirected to
  `/landing` on the client.
- Lighthouse 12.8.2 CLI with Chromium 141 (headless), default settings:
  mobile uses simulated throttling (150 ms RTT, 1.6 Mbps, 4x CPU slowdown),
  and desktop uses `--preset=desktop`.
- Each figure is the median of three runs. Run-to-run spread was at most
  1 point.

To repeat a measurement:

```bash
cd frontend
VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=x npm run build
npx vite preview --port 4180 &
CHROME_PATH=/path/to/chrome npx lighthouse@12 http://127.0.0.1:4180/landing --view            # mobile
CHROME_PATH=/path/to/chrome npx lighthouse@12 http://127.0.0.1:4180/landing --preset=desktop --view
```

`npm run test:lighthouse` runs the CI assertions described below.

## Results

### `/landing`

| | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Mobile, before | 86 | 100 | 96 | 91 | 2.2 s | 3.9 s | 10 ms | 0 | 528 KB |
| Mobile, after | **96** | 100 | 96 | **100** | 2.1 s | **2.3 s** | 0 ms | 0 | **168 KB** |
| Desktop, before | 100 | 92 | 96 | 91 | 0.5 s | 0.8 s | 0 ms | 0 | 528 KB |
| Desktop, after | 100 | **100** | 96 | **100** | 0.5 s | **0.5 s** | 0 ms | 0 | **168 KB** |

### `/` (signed out, redirected to `/landing`)

| | Performance | Accessibility | Best practices | SEO | LCP |
|---|---|---|---|---|---|
| Mobile, before | 86 | 100 | 96 | 91 | 3.9 s |
| Mobile, after | **96** | 100 | 96 | **100** | **2.3 s** |
| Desktop, before | 100 | 92 | 96 | 91 | 0.8 s |
| Desktop, after | 100 | **100** | 96 | **100** | **0.5 s** |

The redirect itself costs nothing measurable. It happens on the client,
before any page chunk is requested, so `/` scores the same as `/landing`.
Best practices is 96 locally in both cases, because the Vercel Analytics
script (`/_vercel/insights/script.js`) only exists on Vercel and returns a
404 from `vite preview`.

## What Lighthouse found, and what changed

| Finding (before) | Change |
|---|---|
| **LCP 3.9 s on mobile, 88% of it render delay.** The LCP element is the hero `<h1>`, drawn by JavaScript. The landing page is a lazy chunk that was only requested after the entry chunk had downloaded and run, which added a sequential round trip. | `vite-plugins/preload.js` adds `<link rel="modulepreload">` for the landing chunk and its icon chunks, so they download in parallel with the entry. LCP fell to 2.3 s. Signed-in users download this 7 KB (gzip) chunk once, and it stays cached. |
| **SEO 91: `robots.txt` is not valid.** There was no robots.txt, so the SPA fallback served `index.html` in its place. | `vite-plugins/site.js` generates `robots.txt` and `sitemap.xml` from `VITE_SITE_URL`. |
| **Accessibility 92 on desktop.** The "5 days" chip in the hero preview had 4.49:1 contrast. | It is darkened to pass AA. |
| **360 KB "other" transfer.** The favicon was the 640 px logo PNG (369 KB). | `favicon.ico` is 7.6 KB, plus a 180 px `apple-touch-icon` (20 KB). |
| Not scored by Lighthouse: `og:url` was `https://trackit.app` (not this site); `og:image` and `twitter:image` were relative, so social cards had no image; the Open Graph and Twitter titles differed from `<title>`; there was no canonical link or structured data; and app routes could be indexed. | Absolute URLs built from `VITE_SITE_URL`, one title and description everywhere, `<link rel="canonical">` to `/landing`, WebApplication JSON-LD, and `X-Robots-Tag: noindex` on app routes (vercel.json and nginx.conf). |
| Not scored: the social card was a 471 KB 640×640 PNG, which `summary_large_image` crops. | 1200×630 progressive JPEG, 52 KB. JPEG rather than WebP, because some link-preview scrapers do not support WebP. |
| Not scored on `vite preview`: Vercel's default `Cache-Control` makes browsers revalidate hashed `/assets/` files on every visit. | vercel.json marks `/assets/` as `immutable` for a year, as nginx.conf already did. |

`logo.png` (used on the sign-in, sign-up and sidebar, not on the landing
page) went from 369 KB at 640 px to 69 KB at 360 px, which is still 2x its
largest display size. A 360 px `logo.webp` (8 KB) is available for those
pages.

### Tried and not kept

- **Preloading the Inter font.** This made mobile LCP worse (2.5 s),
  because the font competes with the JavaScript for bandwidth.
- **Rendering the landing page without waiting for the session check.**
  This made no measurable difference, because the check resolves within a
  tick when there is no session. It would also flash the landing page at
  signed-in users before their redirect, so the spinner stays.

### Remaining opportunities (outside this change)

- **Unused JavaScript, about 68 KB.** Most of it is supabase-js, which
  the landing page only needs to check for a session. Loading it later
  means moving `AuthProvider` out of the entry (`main.jsx` and `App.jsx`).
- **FCP of 2.1 s on mobile.** Nothing paints until React renders.
  Prerendering the landing HTML at build time would paint at
  CSS-download time. It needs `hydrateRoot` in `main.jsx`; otherwise
  `createRoot` replaces the prerendered markup with the Suspense spinner.
- **Render-blocking CSS, an estimated 150 ms.** The one stylesheet (14 KB
  gzip) covers the whole app. Inlining the landing page's critical CSS
  would remove it.
- **The landing page does not use the Inter font.** It asks for
  `'Inter'`, but the self-hosted font is registered as
  `'Inter Variable'`, so it renders in the system font. Switching costs
  about 0.2 s of mobile LCP and 48 KB (measured), so it is a design
  decision rather than a bug fix.
- **The logo `<img>` tags** on the sign-in, sign-up and sidebar have no
  `width` and `height`, and could use `logo.webp` through `<picture>`.

## Guardrails in CI

- **`e2e/seo.spec.js`** (Playwright, desktop and mobile) checks:
  - one title across `<title>`, Open Graph and Twitter
  - a description of at most 160 characters
  - absolute canonical, `og:url` and image URLs
  - that the social image's real size matches `og:image:width` and
    `og:image:height` (1.91:1)
  - icon sizes, and `width`/`height` on every `<img>`
  - valid JSON-LD with no CSP violation
  - the landing chunk preload
  - layout shift under 0.1
  - that `robots.txt` and the sitemap list only `/landing`
- **`src/test/site.test.js`** checks `VITE_SITE_URL` handling and the
  `vercel.json` noindex pattern: app routes are matched, and `/`,
  `/landing` and files are not.
- **Lighthouse CI** (`lighthouserc.json`, the `lighthouse` job) runs
  Lighthouse three times on mobile `/landing` and asserts on the median
  run:

  | Assertion | Threshold | Now | Before |
  |---|---|---|---|
  | Performance | ≥ 0.90 | 0.96 | 0.86 |
  | Accessibility, SEO | = 1 | 1, 1 | 1, 0.91 |
  | Best practices | ≥ 0.95 | 1 (see below) | 0.96 |
  | LCP | ≤ 3.2 s | 2.3 s | 3.9 s |
  | CLS, TBT | ≤ 0.1, ≤ 300 ms | 0, 0 ms | 0, 10 ms |
  | Script, CSS, total transfer | ≤ 200, 25, 300 KB | 152, 14, 168 KB | 152, 14, 528 KB |

  The build from before this change fails four of these assertions.

  **Why Lighthouse CI rather than only a bundle-size budget.** The
  regressions fixed here (a missing preload, a bad robots.txt, a 369 KB
  favicon, low contrast) do not all show up as JavaScript size. To stop
  runner noise from failing the job:
  - Lighthouse uses simulated throttling, which models network timing
    instead of measuring it.
  - Assertions use the median of three runs.
  - Score thresholds sit 6 points (and LCP 0.9 s) below today's values.
  - The byte budgets are deterministic.

  `errors-in-console` is skipped only because of the Vercel Analytics 404
  described above, which is why best practices reads 1 in CI. If the job
  still proves flaky, drop the score and timing assertions and keep the
  byte budgets.
