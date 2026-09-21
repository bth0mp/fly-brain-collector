// Run on a VCoins search results page (browser javascript tool). Returns the exact text to save as one
// file in the collector's inbox. VCoins mixes "featured" adverts into the results, so the price range from
// the search URL is enforced here too. Returned listings are remembered in localStorage so later polls only
// get new ones; capped at 40 per call. Prices are in US$ (the search URL asks for that); dealers ship from
// all over the world and shipping is not shown in the results, so a flat $12 is added.
// Links are emitted in VCoins' short form (store number + product number), which the site accepts.
// What counts as a wanted item is decided by the theme's rules in the collector, not here.
const q = new URLSearchParams(location.search), lo = +q.get('searchBetween') || 0, hi = +q.get('searchBetweenAnd') || Infinity;
const seen = new Set(JSON.parse(localStorage.getItem('flySeen') || '[]'));
const junk = /\bpages\b|hardcover|paperback|\(author\)|\blots?\b|\bgroup\b/i;  // books and group lots
const rows = [];
for (const card of document.querySelectorAll('.item-info')) {
  if (rows.length >= 40) break;
  const a = card.querySelector('a[href*="/product/"]'), img = card.querySelector('.block-img img'), store = card.querySelector('a[id$="lnkStore"]');
  const ids = a && a.href.match(/\/stores\/[^/]+\/(\d+)\/product\/[^/]+\/(\d+)\//);
  if (!ids) continue;
  const url = `https://www.vcoins.com/en/stores/s/${ids[1]}/product/p/${ids[2]}/Default.aspx`, desc = card.querySelector('.description');
  const title = ((img && img.title) || (desc && desc.textContent) || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n)).replace(/\s+/g, ' ').trim();
  const m = card.innerText.match(/US\$\s*([\d,]+(?:\.\d+)?)/);
  const price = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
  if (!title || !price || price < lo || price > hi || seen.has(ids[2]) || junk.test(title)) continue;
  rows.push([url, title.slice(0, 130), +(price + 12).toFixed(2), 'vcoins: ' + (store ? store.textContent.trim() : '?')]);
  seen.add(ids[2]);
}
localStorage.setItem('flySeen', JSON.stringify([...seen].slice(-5000)));
JSON.stringify({kind: 'item', rows})
