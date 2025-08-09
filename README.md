# Battery Equivalents — Ready-to-Deploy Static Site

A fast, low-maintenance reference site for small battery equivalents (LR, SR, CR, A-series).

## Edit Your Domain (GUI)
1) Open `src/config.json` in GitHub and click **Edit**.
2) Set:
```json
"domain": "yourdomain.com",
"baseUrl": "https://www.yourdomain.com"
```
3) Commit changes (Netlify will rebuild automatically).

## Deploy with Netlify (GUI)
1) Create a GitHub repo → click **Upload files** and drag in everything from this folder.
2) In Netlify → **Add new site → Import from Git** → select your repo.
3) Build command: `npm run build` | Publish directory: `dist`.
4) After first deploy, go to **Domain management** and add your custom domain.
   - **Netlify DNS** (recommended): switch nameservers in your registrar to the ones Netlify shows.
   - **Keep registrar DNS**: set CNAME for `www` → `your-site.netlify.app` and A records for `@` → `75.2.60.5`, `99.83.190.102`.
5) Enable HTTPS (Let’s Encrypt) in **Domain management → HTTPS**.

## Update Content (GUI)
- Edit `src/data/batteries.json` in GitHub to add/modify items.
- Each commit triggers a new build; pages and sitemap update automatically.

## Monetization
- Add affiliate URLs inside each item’s `"affiliate"` field.
- Replace ad placeholders (`{{AD_*}}`) in templates or use Netlify Snippet Injection.

## Includes
- Templates for homepage, categories, item pages, comparisons, and guides.
- Schema.org (`WebSite` + SearchAction; `Product` on item pages).
- Canonicals based on `baseUrl`, plus generated `sitemap.xml` and `robots.txt`.
- Expanded `batteries.json` with ~50+ common batteries.

## Local Test (optional)
If you want to preview locally:
- Install Node.js, then run `npm install` and `npm run build`, and open `dist/index.html`.
