// sitemap.js - builds sitemap.xml using data.json
const fs = require('fs');
const path = require('path');
const siteUrl = (process.env.SITE_URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/,'') || 'https://example.com';
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'data.json'),'utf8'));
const list = Array.isArray(data) ? data : Object.entries(data).map(([k,v])=>({name:k, ...v}));

function slugify(name){ return encodeURIComponent(name.toLowerCase().replace(/\s+/g,'-')); }

const urls = [
  `${siteUrl}/`,
  `${siteUrl}/countries/`
];

list.forEach(c=>{
  const name = c.name || c.country || '';
  if(!name) return;
  urls.push(`${siteUrl}/countries/${slugify(name)}.html`);
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(__dirname,'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml with ${urls.length} URLs created.`);
