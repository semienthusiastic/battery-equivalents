# TravelPlugGuide

Static site that helps travellers check adapter and voltage compatibility.

## What’s inside
- `index.html` — interactive checker UI (fast, single-file CSS)
- `app.js` — fetches `data.json`, renders results, flags, badges
- `data.json` — country dataset (sample included; replace with full set)
- `generate.js` — builds `/countries/*.html` landing pages for SEO
- `sitemap.js` — creates `sitemap.xml`
- `minify.js` — placeholder (no-op), kept for Netlify build compatibility
- `netlify.toml` — build settings for Netlify
- `robots.txt` — simple allow-all + sitemap

## Deploy
1. Push all files to GitHub (root of repo).
2. Netlify: set site to build with the included `netlify.toml` (auto-detected).
3. Deploy. The build will:
   - read `data.json`
   - generate `/countries/*.html`
   - produce `sitemap.xml` using your deploy URL

## Customize
- Replace `YOURTAGHERE` in `app.js` with your Amazon Associates tag.
- Replace `data.json` with your full dataset (array or map). Keys supported:
  - `name`/`country`, `iso2`/`alpha2`/`code`, `plugs`/`plug_types`, `voltage`, `frequency`

## Local build
```bash
node generate.js && node minify.js && SITE_URL=http://localhost:8080 node sitemap.js
```