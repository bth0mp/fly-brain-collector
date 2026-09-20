// Run on an eBay search results page (browser javascript tool). Returns the exact text to save
// as one file in the collector's inbox. The search URL carries &fly=item, &fly=dream or &fly=supply
// (eBay ignores it) so this script knows what the page is for. Returned listings are remembered in
// localStorage so later polls only return new ones; capped at 40 per call (the rest come next poll).
const seen = new Set(JSON.parse(localStorage.getItem('flySeen') || '[]'));
const kind = new URLSearchParams(location.search).get('fly') === 'supply' ? 'supply' : 'item';
const rows = [];
for (const card of document.querySelectorAll('li.s-card')) {
  if (rows.length >= 40) break;
  const a = card.querySelector('a.s-card__link[href*="/itm/"]'), t = card.querySelector('.s-card__title');
  if (!a || !t) continue;
  const id = (a.href.match(/\/itm\/(\d{9,})/) || [])[1];
  const title = t.textContent.replace(/Opens in a new window or tab|new listing/gi, '').trim();
  const txt = card.innerText;
  if (!id || seen.has(id) || / to \$/.test(txt)) continue;  // price ranges are multi-variation listings
  const price = parseFloat(((txt.match(/\$([\d,]+\.\d\d)/) || [])[1] || '').replace(/,/g, ''));
  const ship = /\+\$([\d.]+) delivery/.exec(txt);
  const s = /^(\S+) ([\d.]+)% positive \(([\d.]+)(K?)\)/m.exec(txt);
  // only sellers with at least 98% positive feedback and 50+ ratings
  if (!price || !s || parseFloat(s[2]) < 98 || parseFloat(s[3]) * (s[4] ? 1000 : 1) < 50) continue;
  rows.push([id, title, +(price + (ship ? parseFloat(ship[1]) : /free/i.test(txt) ? 0 : 10)).toFixed(2), s[1]]);
  seen.add(id);
}
localStorage.setItem('flySeen', JSON.stringify([...seen].slice(-5000)));
JSON.stringify({kind, rows})
