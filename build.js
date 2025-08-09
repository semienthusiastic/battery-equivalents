import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const CONFIG = JSON.parse(fs.readFileSync(path.join(SRC, 'config.json'), 'utf8'));
const BATTERIES = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'batteries.json'), 'utf8'));

function clean() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(path.join(DIST, 'battery'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'category'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'guides'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
}

function readTemplate(name) {
  return fs.readFileSync(path.join(SRC, 'templates', name), 'utf8');
}

function write(filePath, content) {
  const full = path.join(DIST, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function page(layout, options) {
  let html = layout
    .replaceAll('{{PAGE_TITLE}}', options.title || CONFIG.siteName)
    .replaceAll('{{META_DESCRIPTION}}', options.description || 'Find battery equivalents and replacements quickly.')
    .replaceAll('{{CANONICAL_URL}}', options.canonical || CONFIG.baseUrl)
    .replaceAll('{{SITE_NAME}}', CONFIG.siteName)
    .replaceAll('{{BASE_URL}}', CONFIG.baseUrl)
    .replaceAll('{{CONTENT}}', options.content || '')
  return html;
}

function canonical(pathname) {
  return `${CONFIG.baseUrl}${pathname}`;
}

function formatList(arr) {
  return (arr || []).join(', ');
}

function escapeHtml(s='') {
  return s.replaceAll('&', '&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function productJsonLdSimilar(names=[]) {
  return names.map(n => `"${escapeHtml(n)}"`).join(', ');
}

function navPopularLinks() {
  const candidates = ['LR44','CR2032','CR2025','SR626SW','A312'];
  const existing = candidates.filter(c => BATTERIES.some(b => String(b.code).toUpperCase() === c));
  return existing.map(code => `<li><a class="pill" href="/battery/${code}">${code}</a></li>`).join('');
}

function ad(name){
  if(!CONFIG.adPlacementsEnabled) return '';
  return `<!-- ${name} ad slot (replace with AdSense code) -->`;
}

function copyStatic() {
  fs.copyFileSync(path.join(SRC, 'assets', 'styles.css'), path.join(DIST, 'assets', 'styles.css'));
  fs.copyFileSync(path.join(SRC, 'assets', 'search.js'), path.join(DIST, 'assets', 'search.js'));
  fs.copyFileSync(path.join(SRC, 'data', 'batteries.json'), path.join(DIST, 'data', 'batteries.json'));
}

function buildHome() {
  const layout = readTemplate('layout.html');
  const body = readTemplate('index.html')
    .replaceAll('{{POPULAR_LINKS}}', navPopularLinks())
    .replaceAll('{{AD_HERO}}', ad('hero'));
  const html = page(layout, {
    title: `${CONFIG.siteName} — Battery Cross-Reference`,
    description: 'Lookup table for LR, SR, CR, and A-series battery equivalents and replacements.',
    canonical: canonical('/'),
    content: body
  });
  write('index.html', html);
}

function buildSearchPage() {
  const layout = readTemplate('layout.html');
  const content = `<section class="card"><h1>Search</h1><div id="search-results" aria-live="polite"></div></section>`;
  const html = page(layout, {
    title: `Search — ${CONFIG.siteName}`,
    description: 'Search battery codes and equivalents.',
    canonical: canonical('/search'),
    content
  });
  write('search/index.html', html);
}

function buildGuides() {
  const layout = readTemplate('layout.html');
  const tpl = readTemplate('page.html');

  const pages = [
    {
      slug: 'battery-codes',
      title: 'Battery Code Systems Explained',
      body: `<p>LR = alkaline button cells, SR = silver oxide, CR = lithium coin cells, A = zinc-air hearing aid sizes. Numbers typically encode diameter and height in tenths of millimeters (e.g., CR2032 is 20.0mm x 3.2mm).</p>`
    },
    {
      slug: 'identify-battery',
      title: 'How to Identify Your Battery',
      body: `<ol><li>Check the printed code on the battery.</li><li>Measure diameter and height.</li><li>Match chemistry: LR/SR (1.5V) vs CR (3V) vs A (1.45V).</li></ol>`
    },
    {
      slug: 'alkaline-vs-silver-oxide',
      title: 'Alkaline vs Silver Oxide',
      body: `<p>Silver oxide (SR) cells hold voltage more consistently under load, making them better for timekeeping devices like watches. Alkaline (LR) are cheaper but may have shorter life.</p>`
    },
    {
      slug: 'about',
      title: 'About',
      body: `<p>{{SITE_NAME}} is a fast, simple reference for battery equivalents. Data is compiled from manufacturer datasheets and common industry references.</p>`
    },
    {
      slug: 'contact',
      title: 'Contact',
      body: `<p>Questions or corrections? Email <a href="mailto:${CONFIG.supportEmail}">${CONFIG.supportEmail}</a>.</p>`
    }
  ];

  pages.forEach(p => {
    const body = tpl
      .replaceAll('{{TITLE}}', p.title)
      .replaceAll('{{BODY}}', p.body.replaceAll('{{SITE_NAME}}', CONFIG.siteName));
    const html = page(layout, {
      title: `${p.title} — ${CONFIG.siteName}`,
      description: `${p.title} for small batteries.`,
      canonical: canonical(`/guides/${p.slug}`),
      content: body
    });
    write(`guides/${p.slug}/index.html`, html);
  });
}

function buildBatteryPages() {
  const layout = readTemplate('layout.html');
  const tpl = readTemplate('battery.html');

  BATTERIES.forEach(b => {
    const equivalents = formatList(b.names);
    const uses = formatList(b.common_uses);
    const affBtns = Object.entries(b.affiliate || {}).map(([k, url]) => `<a class="button" href="${url}" rel="nofollow sponsored" target="_blank">Buy on ${k[0].toUpperCase()+k.slice(1)}</a>`).join('');

    const content = tpl
      .replaceAll('{{BATTERY_CODE}}', escapeHtml(b.code))
      .replaceAll('{{EQUIVALENTS}}', escapeHtml(equivalents))
      .replaceAll('{{CHEMISTRY}}', escapeHtml(b.chemistry || '—'))
      .replaceAll('{{VOLTAGE}}', escapeHtml(b.voltage || '—'))
      .replaceAll('{{DIAMETER}}', b.diameter_mm != null ? String(b.diameter_mm) : '—')
      .replaceAll('{{HEIGHT}}', b.height_mm != null ? String(b.height_mm) : '—')
      .replaceAll('{{USES}}', escapeHtml(uses || '—'))
      .replaceAll('{{NOTES}}', escapeHtml(b.notes || ''))
      .replaceAll('{{AFFILIATE_BUTTONS}}', affBtns || '')
      .replaceAll('{{COMPARE_LINKS}}', (b.compare_with || []).map(c => `<li><a href="/compare/${b.code}-vs-${c}">${b.code} vs ${c}</a></li>`).join(''))
      .replaceAll('{{AD_TOP}}', ad('top'))
      .replaceAll('{{SIMILAR_PRODUCTS}}', productJsonLdSimilar(b.names || []));

    const html = page(layout, {
      title: `${b.code} Equivalent & Replacements — ${CONFIG.siteName}`,
      description: `${b.code} equivalents: ${equivalents}. Specs, sizes, and where to buy.`,
      canonical: canonical(`/battery/${b.code}`),
      content
    });
    write(`battery/${b.code}/index.html`, html);
  });
}

function buildComparePages() {
  const layout = readTemplate('layout.html');
  const tpl = readTemplate('compare.html');

  const byCode = new Map(BATTERIES.map(b => [b.code, b]));

  const pairs = new Set();
  BATTERIES.forEach(b => {
    (b.compare_with || []).forEach(c => {
      const key = [b.code, c].sort().join('::');
      pairs.add(key);
    });
  });

  pairs.forEach(key => {
    const [aCode, bCode] = key.split('::');
    const A = byCode.get(aCode);
    const B = byCode.get(bCode);
    if (!A || !B) return;

    const content = tpl
      .replaceAll('{{A}}', escapeHtml(A.code))
      .replaceAll('{{B}}', escapeHtml(B.code))
      .replaceAll('{{A_CHEM}}', escapeHtml(A.chemistry || '—'))
      .replaceAll('{{B_CHEM}}', escapeHtml(B.chemistry || '—'))
      .replaceAll('{{A_VOLT}}', escapeHtml(A.voltage || '—'))
      .replaceAll('{{B_VOLT}}', escapeHtml(B.voltage || '—'))
      .replaceAll('{{A_DIA}}', A.diameter_mm != null ? String(A.diameter_mm) : '—')
      .replaceAll('{{B_DIA}}', B.diameter_mm != null ? String(B.diameter_mm) : '—')
      .replaceAll('{{A_HGT}}', A.height_mm != null ? String(A.height_mm) : '—')
      .replaceAll('{{B_HGT}}', B.height_mm != null ? String(B.height_mm) : '—')
      .replaceAll('{{A_USE}}', escapeHtml((A.common_uses || []).join(', ')))
      .replaceAll('{{B_USE}}', escapeHtml((B.common_uses || []).join(', ')))
      .replaceAll('{{AD_TOP}}', ad('top'));

    const title = `${A.code} vs ${B.code} — Which to use?`;
    const desc = `Compare ${A.code} and ${B.code}: chemistry, voltage, size, use-cases.`;
    const slug = `/compare/${A.code}-vs-${B.code}`.toLowerCase();

    const html = page(layout, {
      title,
      description: desc,
      canonical: canonical(slug),
      content
    });
    write(`${slug}/index.html`, html);
  });
}

function buildCategories() {
  const layout = readTemplate('layout.html');
  const tpl = readTemplate('category.html');

  const categories = [
    {
      slug: 'coin-cells',
      title: 'Coin Cells (CR)',
      intro: 'Lithium 3V coin cells used in key fobs, motherboards, and small devices.',
      filter: (b) => String(b.code).toUpperCase().startsWith('CR')
    },
    {
      slug: 'button-cells',
      title: 'Button Cells (LR/SR)',
      intro: 'Alkaline (LR) and Silver Oxide (SR) 1.5V/1.55V button cells for watches and small electronics.',
      filter: (b) => ['LR','SR'].some(p => String(b.code).toUpperCase().startsWith(p))
    },
    {
      slug: 'hearing-aid',
      title: 'Hearing Aid Batteries (A-series)',
      intro: 'Zinc-Air batteries commonly labelled A10, A13, A312, A675.',
      filter: (b) => String(b.code).toUpperCase().startsWith('A')
    }
  ];

  categories.forEach(cat => {
    const items = BATTERIES
      .filter(cat.filter)
      .sort((a,b) => a.code.localeCompare(b.code))
      .map(b => `<li><a href="/battery/${b.code}">${b.code}</a> — ${(b.names||[]).slice(0,6).join(', ')}</li>`)
      .join('');

    const content = tpl
      .replaceAll('{{CATEGORY_TITLE}}', cat.title)
      .replaceAll('{{CATEGORY_INTRO}}', cat.intro)
      .replaceAll('{{ITEMS}}', items)
      .replaceAll('{{AD_TOP}}', ad('top'));

    const html = page(layout, {
      title: `${cat.title} — ${CONFIG.siteName}`,
      description: `${cat.title} index.`,
      canonical: canonical(`/category/${cat.slug}`),
      content
    });
    write(`category/${cat.slug}/index.html`, html);
  });
}

function buildSitemapAndRobots() {
  const urls = [];

  function push(pathname) {
    urls.push(`${CONFIG.baseUrl}${pathname}`);
  }

  // Home + search
  push('/');
  push('/search');

  // Guides (hardcoded slugs)
  ['/guides/battery-codes','/guides/identify-battery','/guides/alkaline-vs-silver-oxide','/guides/about','/guides/contact'].forEach(push);

  // Categories
  ['/category/coin-cells','/category/button-cells','/category/hearing-aid'].forEach(push);

  // Batteries
  BATTERIES.forEach(b => push(`/battery/${b.code}`));

  // Compare pages
  const seen = new Set();
  BATTERIES.forEach(b => {
    (b.compare_with || []).forEach(c => {
      const arr = [b.code, c].sort();
      const slug = `/compare/${arr[0]}-vs-${arr[1]}`.toLowerCase();
      if(!seen.has(slug)) {
        seen.add(slug);
        push(slug);
      }
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');

  const robots = `User-agent: *
Allow: /

Sitemap: ${CONFIG.baseUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robots, 'utf8');
}

function run() {
  clean();
  copyStatic();
  buildHome();
  buildSearchPage();
  buildGuides();
  buildCategories();
  buildBatteryPages();
  buildComparePages();
  buildSitemapAndRobots();
  console.log('Build complete. See /dist');
}

run();
