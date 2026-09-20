// Run on any ebay.com page (browser javascript tool) AFTER replacing __IDS__ with the JSON array
// "ebay_ids" from collector/picks.json. Checks whether the fly's current picks are still for sale.
// Conservative: a pick is only reported gone when eBay's own page data gives a status other than ACTIVE.
// A missing marker (security page, layout change, network error) means "unknown", never "gone".
const ids = __IDS__.slice(0, 30), gone = [];
for (const id of ids) {
  try {
    const t = await (await fetch('/itm/' + id)).text();
    const m = t.match(/"listingStatus":"([A-Za-z_]+)"/);
    if (m && m[1] !== 'ACTIVE') gone.push(id);
  } catch (e) {}
  await new Promise(r => setTimeout(r, 1200));
}
JSON.stringify({kind: 'gone', ids: gone})
