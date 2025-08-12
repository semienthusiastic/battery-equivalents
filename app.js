// -------- Config --------
const DATA_URL = './data.json';
const AFFILIATE_TAG = 'YOURTAGHERE';

// -------- Helpers --------
const $ = (id) => document.getElementById(id);
function isoToFlag(iso2) {
  if (!iso2 || iso2.length !== 2) return '🌐';
  const base = 0x1F1E6, A = 'A'.charCodeAt(0);
  return String.fromCodePoint(...iso2.toUpperCase().split('').map(c => base + (c.charCodeAt(0) - A)));
}
function normalizeCountry(raw) {
  const name = raw.name || raw.country || raw.country_name || raw.countryName || '';
  const iso2 = (raw.iso2 || raw.alpha2 || raw.code || '').toUpperCase();
  const plugs = raw.plugs || raw.plug_types || raw.plugTypes || raw.types || [];
  const voltage = Number(raw.voltage || raw.voltage_v || raw.volts || raw.v || 0);
  const freq = raw.frequency || raw.frequency_hz || raw.hz || raw.freq || 0;
  const freqText = typeof freq === 'number' && freq > 0 ? `${freq}Hz` : String(freq || '').replace(/hz$/i, 'Hz');
  return { name, iso2, plugs, voltage, freqText };
}
function sameVoltage(fromV, toV) { return Math.abs(Number(fromV) - Number(toV)) <= 15; }
function needsAdapterShape(destPlugs, fromPlugs) { return !destPlugs.some(p => fromPlugs.includes(p)); }
function parseDeviceLabel(str) {
  if (!str) return null;
  if (/(100|110)\s*[–\-]?\s*240\s*V/i.test(str)) return { dual: true };
  if (/\b120\s*V\b/i.test(str) && !/240\s*V/i.test(str)) return { dual: false };
  return null;
}

// -------- State --------
const el = {
  from: $('from'), to: $('to'),
  fromFlag: $('fromFlag'), toFlag: $('toFlag'),
  dual: $('dual'), deviceLabel: $('deviceLabel'),
  tip: $('tip'), vf: $('vf'), plugBadges: $('plugBadges'),
  buy: $('buy'), emoji: $('emoji'), headline: $('headline'), subtext: $('subtext'),
  resultBox: $('resultBox'),
};
let countries = []; let byIso = new Map();

function populateSelects() {
  el.from.innerHTML = countries.map(c => `<option value="${c.iso2}">${c.name}</option>`).join('');
  el.to.innerHTML   = countries.map(c => `<option value="${c.iso2}">${c.name}</option>`).join('');
}
function updateFlags(fromIso, toIso) {
  el.fromFlag.textContent = isoToFlag(fromIso);
  el.toFlag.textContent = isoToFlag(toIso);
}
function render() {
  const fromIso = el.from.value, toIso = el.to.value;
  const from = byIso.get(fromIso), to = byIso.get(toIso);
  if (!from || !to) return;
  updateFlags(fromIso, toIso);
  const parsed = parseDeviceLabel(el.deviceLabel.value.trim());
  const isDual = parsed ? parsed.dual : el.dual.checked;
  const adapterNeeded = needsAdapterShape(to.plugs, from.plugs);
  const voltageOK = sameVoltage(from.voltage, to.voltage);
  el.resultBox.classList.remove('ok','warn','bad');
  if (!adapterNeeded && (voltageOK || isDual)) {
    el.emoji.textContent = '✅';
    el.headline.textContent = `No adapter needed for ${to.name}.`;
    el.subtext.textContent = voltageOK ? 'Voltage compatible too — you should be good to go!' : 'Voltage differs, but your dual-voltage devices will work.';
    el.resultBox.classList.add('ok');
  } else if (adapterNeeded && (voltageOK || isDual)) {
    el.emoji.textContent = '🔌';
    el.headline.textContent = `You’ll need a plug adapter for ${to.name}.`;
    el.subtext.textContent = voltageOK ? 'Voltage is compatible — adapter only.' : 'Voltage differs, but dual-voltage devices are fine — adapter only.';
    el.resultBox.classList.add('warn');
  } else if (!adapterNeeded && !voltageOK && !isDual) {
    el.emoji.textContent = '⚠️';
    el.headline.textContent = `Adapter not needed, but voltage differs in ${to.name}.`;
    el.subtext.textContent = 'Use a converter for single-voltage devices.';
    el.resultBox.classList.add('warn');
  } else {
    el.emoji.textContent = '⛔';
    el.headline.textContent = `You’ll need an adapter and likely a converter for ${to.name}.`;
    el.subtext.textContent = 'Voltage system differs and device may be single-voltage.';
    el.resultBox.classList.add('bad');
  }
  el.vf.textContent = `${to.voltage || '—'}V · ${to.freqText || '—'}`;
  el.plugBadges.innerHTML = (to.plugs || []).map(p => `<span class="badge">Type ${p}</span>`).join('');
  const q = encodeURIComponent(`travel adapter ${to.name}`);
  el.buy.href = `https://www.amazon.com/s?k=${q}${AFFILIATE_TAG ? `&tag=${AFFILIATE_TAG}` : ''}`;
}
async function boot() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load dataset: ${res.status}`);
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : Object.entries(raw).map(([k, v]) => ({ name: k, ...v }));
    countries = list.map(normalizeCountry).filter(c => c.name && c.iso2);
    countries.forEach(c => { if (!Array.isArray(c.plugs)) c.plugs = []; });
    byIso = new Map(countries.map(c => [c.iso2, c]));
    populateSelects();
    const loc = (navigator.language || '').toUpperCase();
    const likelyFrom = (loc.includes('-') && byIso.get(loc.split('-')[1])) ? loc.split('-')[1] : (byIso.has('GB') ? 'GB' : countries[0].iso2);
    el.from.value = likelyFrom;
    el.to.value = byIso.has('JP') ? 'JP' : (countries.find(c => c.iso2 !== likelyFrom)?.iso2 || countries[0].iso2);
    el.from.addEventListener('change', render);
    el.to.addEventListener('change', render);
    el.dual.addEventListener('change', render);
    el.deviceLabel.addEventListener('input', render);
    render();
  } catch (e) {
    console.error(e);
    document.getElementById('headline').textContent = 'Sorry — problem loading country data.';
    document.getElementById('subtext').textContent = 'Please try again in a moment.';
  }
}
boot();
