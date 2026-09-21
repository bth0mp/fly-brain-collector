# Fly Brain Collector

A simulated fruit fly brain builds its own collection on a budget.

Scientists mapped every neuron and connection in a real fruit fly's brain (the
[FlyWire connectome](https://flywire.ai/)), and [Shiu et al. (Nature, 2024)](https://www.nature.com/articles/s41586-024-07763-9)
turned that wiring into a runnable spiking model. This project runs that model on your PC and lets it "shop":

1. Claude reads listings for you in a browser (eBay, the VCoins marketplace for the ancient coins theme, plus any dealer sites you add) and drops them in an inbox folder.
2. Each listing's title gets a plain-text score: how well it is identified, how famous it is, whether it is certified, how prestigious the type is.
3. The score sets how hard the fly's **sugar-tasting neurons** are stimulated. The whole brain (~127,000 neurons) then runs for one simulated second.
4. We read one neuron at the end of the chain: **MN9**, the motor neuron that makes a fly stick out its proboscis to eat. The faster it fires, the more the fly "wants" the item.
5. After every judgement the whole collection is re-picked to fit the budget, so items get swapped in and out all week. There are three lists: a budget for items, a separate budget for equipment, and a dream list with no limit.

A local dashboard shows it live, including a replay of the real spikes from each evaluation.

**It never buys or bids on anything.** The output is shopping lists with links.

## The honest part

The fly has no idea what a coin (or a Charizard) is. All of the judgement is in the theme's scoring rules, which a person wrote.
The brain is a real connectome doing a real simulation, but in this setup it acts as a simple transfer function: more sugar drive in,
more MN9 firing out. It is the same trick as the "fly brain plays Doom" demos, stated plainly. Title-only scoring also cannot verify
authenticity, so replicas can slip through. Check every item and seller yourself before buying anything.

## What you need

- Python 3.10+ and git
- About 16 GB of RAM free while it runs (4 worker processes, each with a full copy of the connectome; lower `N_PROC` in `fly_collector.py` if needed)
- The [Claude desktop app](https://claude.com/download) (Code tab) to do the browsing. Each search uses your Claude usage.
- Windows is what this was built and run on. The code has macOS/Linux branches for file locking and background launch, but they are untested.

## Quick start

You can download the zip from the [Releases page](https://github.com/bth0mp/fly-brain-collector/releases/latest) instead of using `git clone`.
This runs on your own computer. It cannot run on GitHub itself: it needs about 16 GB of RAM and the Claude desktop app to do the browsing.

**1. Get the code and install it** (about 10 minutes, mostly downloads)

```bash
git clone https://github.com/bth0mp/fly-brain-collector
cd fly-brain-collector
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python fly_collector.py setup    # fetches the brain model and connectome (~200 MB) from the authors' repo
python fly_collector.py demo     # offline self-check: should end with "demo ok"
```

For the simulation to run at a sensible speed, Brian2 needs a C++ compiler
([instructions](https://brian2.readthedocs.io/en/stable/introduction/install.html#requirements-for-c-code-generation)).
Expect roughly 75 seconds per listing on a modern desktop.

**2. Pick what the fly collects**

```bash
python fly_collector.py themes
python fly_collector.py theme pokemon_cards
```

| Theme | Collects | Status |
|---|---|---|
| `ancient_coins` | Ancient Roman & Greek coins | Ran for six days; rules tuned against ~1,900 real listings |
| `us_coins` | Classic (pre-1965) US coins | Rules pass the offline self-check; not yet run against live listings |
| `world_banknotes` | World paper money | Same |
| `pokemon_cards` | Single Pokemon cards | Same |
| `fossils` | Fossils | Same |

**3. Start the fly**

```bash
python fly_collector.py start
```

It runs in the background and opens a dashboard at **http://127.0.0.1:8765**. At this point the fly is awake but has nothing to
look at: the page says "Idle - waiting for new listings".

**4. Give it eyes (Claude does the browsing)**

```bash
python fly_collector.py instructions
```

This writes `collector/<theme>/browser_poll.md` with your folder paths filled in, and prints a sentence to paste into the Claude
desktop app (Code tab, opened in this folder). That sentence asks Claude to create a scheduled task, every 3 hours, that follows
the instructions file: read-only browsing, never logging in, bidding, buying or submitting forms, and skipping any site that blocks it.
Click **Run now** once on the new task so its browser permissions get approved. Scheduled tasks only run while the Claude app is open,
and each search uses your Claude usage.

**5. Watch**

Within a few minutes of the first search, listings appear in "Next under the lens", the brain starts running, and the cabinet fills up.
Then leave it alone for the week. `python fly_collector.py status` prints the current lists; `python fly_collector.py stop` ends it.

## What happens during a run

| When | What happens |
|---|---|
| Every 3 hours (or when you press **Search now**) | Claude opens the theme's eBay searches, its VCoins searches if it has any, and a rotating few of its other sites in a browser, and writes what it finds as small JSON files into `collector/<theme>/inbox/`. It also checks whether the fly's current picks are still for sale. |
| Continuously | The collector picks up inbox files, throws out anything the theme's rules reject (replicas, lots, things priced too low to be real), scores the rest from their titles, and queues them best-looking first. |
| About every 75 seconds | One listing goes through the brain: its score becomes sugar-neuron stimulation, the ~127,000-neuron model runs for four one-second trials, and MN9's firing rate becomes that listing's "want". |
| After every judgement | All three lists are rebuilt: the best set of items that fits the budget (a knapsack over "want"), one of each kind of equipment within the equipment budget, and the top of everything for the dream list. Anything that entered or left is logged as a swap. |
| At the deadline (the theme's `days`, 6 by default) | The collector stops. `collector/<theme>/collection.md` is the final shopping list with links. Nothing was bought. |

The collector does not survive a reboot or sleep; run `start` again and it resumes with the same deadline. Each theme keeps its own
state under `collector/<theme>/`. Delete that theme's `state.json` for a fresh run.

## Make your own theme

A theme is one JSON file in `themes/`: budgets, the scoring rules (regexes for what identifies an item, a fame table, certification,
prestige tiers, words that reject a listing, and "too cheap to be real" rules), equipment categories, eBay searches, other sites to
visit, and a few example titles that `demo` checks. Copy one, edit it, and run `python fly_collector.py demo` to validate it.
A theme can also list VCoins search URLs under `searches.vcoins` (put `<DATE>` where the "newer than" date goes; see `ancient_coins.json`). Add your own dealer sites to the theme's `sites` list; tags are `[auction]` (watchlist only, never in the budget), `[dream]`
(no price cap) and `[supply]` (equipment). After changing a theme, run `instructions` again so Claude's instructions match.

## Troubleshooting

- **"brain model not found"**: run `python fly_collector.py setup`.
- **Dashboard says COLLECTOR OFFLINE**: the background process is not running (reboot, sleep, or `stop`). Run `start` again.
- **Nothing ever appears in the queue**: the browser poll is not running. Check the scheduled task exists in the Claude app, that the app is open, and that you clicked Run now once. Its summary says what it visited and skipped.
- **Each listing takes many minutes**: Brian2 has no C++ compiler and is running in slow mode; see the link in step 1.
- **Out of memory**: lower `N_PROC` near the top of `fly_collector.py` (each worker needs about 3 GB).
- **An obvious replica got picked**: add a word to the theme's `exclude` rule or a `too_cheap` rule, then stop and start. Rejected listings are dropped on restart.
- **eBay shows a security page**: the poll skips eBay for that run by design. Do not work around it.

## The dashboard

- **The brain**: every glint is a real spike from the latest simulation (one trial, the 300 busiest neurons, slowed 8x). The threads are
  the 700 strongest real synaptic links between them, with pulses following real spikes (warm = excitatory, cool = inhibitory).
  Neuron positions and the outline are stylised, not anatomical.
- **The cabinet / workbench / dream list**: the three lists, with links. Swaps are counted and logged.
- **Search now**: drops a request file that the next browser poll honours (or a Claude session watching for it can act on at once).
- **Skins**: five looks, chosen with the swatches in the header: Patina, Marble, Terminal, Ember, Abyss.

The page is served on localhost only, has three fixed routes, and inserts listing titles as plain text.

## Credits and licences

- Brain model: [philshiu/Drosophila_brain_model](https://github.com/philshiu/Drosophila_brain_model) (MIT), from Shiu et al., *A Drosophila computational brain model reveals sensorimotor processing*, Nature 634, 210-219 (2024). It is fetched by `setup`, not redistributed here.
- Connectome: FlyWire (Dorkenwald et al., Nature 2024; Schlegel et al.; Eckstein et al.). FlyWire connectivity data is CC BY-NC 4.0, so keep your use non-commercial.
- Simulator: [Brian2](https://brian2.readthedocs.io/).
- This project's own code: MIT. Built with [Claude Code](https://claude.com/claude-code).

Be a good guest on the sites you read: this polls a handful of pages every few hours, and it is designed to stop, not work around,
when a site says no.
