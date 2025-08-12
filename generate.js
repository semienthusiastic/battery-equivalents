// generate.js - builds /countries/*.html from data.json
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data.json');
const OUT_DIR = path.join(__dirname, 'countries');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const siteUrl = process.env.SITE_URL || process.env.DEPLOY_PRIME_URL || '';

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

const tpl = (c)=>`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Plugs & Voltage in ${esc(c.name)} – TravelPlugGuide</title>
  ${siteUrl ? `<link rel="canonical" href="${siteUrl.replace(/\/$/,'')}/countries/${encodeURIComponent(c.name.toLowerCase().replace(/\\s+/g,'-'))}.html">` : ''}
  <meta name="description" content="Power plugs in ${esc(c.name)}: types ${esc((c.plugs||[]).join(', '))}, ${esc(c.voltage)}V, ${esc(c.freqText||c.frequency+'Hz')}. Do you need an adapter or converter?" />
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:24px;color:#0f172a}a{color:#0a6fae}</style>
</head>
<body>
  <h1>${esc(c.name)}: plug types, voltage & frequency</h1>
  <ul>
    <li><strong>Plug types:</strong> ${(c.plugs||[]).map(p=>`Type ${esc(p)}`).join(', ')||'—'}</li>
    <li><strong>Voltage:</strong> ${esc(c.voltage)}V</li>
    <li><strong>Frequency:</strong> ${esc(c.freqText|| (c.frequency? (c.frequency+'Hz'):'—'))}</li>
  </ul>
  <p><a href="../">Back to checker</a></p>
</body>
</html>`;

function normalizeCountry(raw) {
  const name = raw.name || raw.country || raw.country_name || raw.countryName || '';
  const plugs = raw.plugs || raw.plug_types || raw.plugTypes || raw.types || [];
  const voltage = Number(raw.voltage || raw.voltage_v || raw.volts || raw.v || 0);
  const freq = raw.frequency || raw.frequency_hz || raw.hz || raw.freq || 0;
  const freqText = typeof freq === 'number' && freq > 0 ? `${freq}Hz` : String(freq || '').replace(/hz$/i, 'Hz');
  return { name, plugs, voltage, freqText };
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const list = Array.isArray(data) ? data : Object.entries(data).map(([k,v])=>({name:k, ...v}));
const countries = list.map(normalizeCountry).filter(c=>c.name);

countries.forEach(c => {
  const fname = c.name.toLowerCase().replace(/\s+/g,'-') + '.html';
  fs.writeFileSync(path.join(OUT_DIR, fname), tpl(c), 'utf8');
});

console.log(`Generated ${countries.length} country pages.`);
