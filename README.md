# 🏀 Hoop Glory

A browser career simulator for basketball, in Spanish and English. Pick an origin
country, a jersey number and a position, then live one basketball life — from a
youth academy at fourteen through retirement and a Hall of Fame verdict.

No account, no backend, no install. It runs entirely in the browser and saves to
`localStorage`.

Inspired by [Copero](https://copero.com.ar/juegos/simulador-carrera),
[El Ídolo](https://www.potrerofutbol.ar/el-idolo) and
[F1 Glory](https://f1-glory.vercel.app) — the same "choose your own adventure with
a stat sheet" genre, rebuilt for basketball.

---

## What it does

**Your origin country sets your ladder.** This is a real strategic choice, not a
flag. A player from the United States goes High School → NCAA → Draft → NBA. An
Argentine goes cantera → Liga Nacional → Europe → NBA. A Serbian goes academy →
ABA → EuroLeague → NBA. Twenty-one countries, each with its own route.

**Every attribute is a trade-off.** *Atletismo/Athleticism* buys explosion and
highlight plays but raises injury risk and falls off a cliff after 30.
*IQ* buys better event outcomes and a longer tail. *Físico/Strength* buys rebounds
and durability at the cost of quickness. Same for the six play styles — the
creation screen states each gamble plainly rather than hiding it.

**Growth points are your main lever.** Every preseason you allocate points across
your attributes. Returns diminish steeply, so specialising is a genuinely
different build from spreading points evenly — and both beat leaving them unspent
(anything you skip gets allocated for you, but without focus).

**Decisions with consequences.** Around fifty event cards across every career
stage — injuries and rehab choices, contract offers, the lucrative-but-career-
stalling move abroad, coach conflicts, national team call-ups and snubs, media
storms, family, burnout, and the long goodbye. Many resolve on a hidden roll, so
the safe choice is not always the right one.

**A rival for twenty years.** Picked at creation from the real-player pool and
position-matched, simulated in parallel on their own stream. You are measured
against them in points, rings and MVPs for your entire career, with event beats at
the first meeting, playoff series and retirement.

**Finals you have to actually win.** Reaching the last round is simulated;
winning it is not. Get to a final and you play for it — free throws with the
arena screaming, the last shot with the ring collapsing on you, or reading the
inbound pass with six seconds left. Which challenge you get depends on who you
built: a lockdown centre defends the last possession, a sharpshooter takes the
shot. The target shrinks with the opponent's strength and the level you are at,
and grows with the attribute the challenge tests. A title is never one lucky tap
— you need 2 of 3 domestically, 3 of 5 in the EuroLeague or the NBA.

**Club crests everywhere.** Every club, academy and college wears a badge built
from its real colours, in one of six silhouettes, on the preseason screen, the
season card, the career timeline, the final, and the shareable PNG. Real logo
files drop in without touching code — see *Club badges* below.

**Two modes.** *Mi Carrera / My Career* is a fresh run every time. *Carrera del
Día / Daily Career* gives everyone on earth the same country, club, events and
injuries for that date — so the only variable is how well you decide.

**Shareable ending.** A retirement card rendered to PNG plus a copyable text block,
both carrying the run's seed so anyone can replay your exact career.

**Fully bilingual.** Spanish and English, toggleable at any moment mid-career.
Every event card, award, verdict and headline exists in both languages by
construction — a card cannot be half-translated, and a test enforces it.

---

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build     # production build
npm run typecheck # tsc --noEmit
npm test          # vitest
npm run lint
```

---

## Deployment

Live at **https://rodcor.github.io/jamstar/**, published by
`.github/workflows/deploy.yml` on every push to `main`. The same workflow runs
lint, typecheck, the test suite and a build on every pull request.

The static export is **opt-in**, not baked in. `output: 'export'` would
permanently disable `next start`, SSR and API routes — and the daily mode is an
obvious candidate for a real leaderboard one day, which would need a backend. So
two env vars switch it on instead:

| Variable | Effect |
|---|---|
| `STATIC_EXPORT=true` | emit a fully static site into `out/` |
| `NEXT_PUBLIC_BASE_PATH=/jamstar` | serve from a subpath (GitHub project pages) |

Plain `npm run build` still produces a normal Next app, so Vercel remains a
one-command deploy with nothing to undo.

To reproduce the Pages build locally — including the subpath, which is where
asset bugs actually hide:

```bash
npm run export                      # or: STATIC_EXPORT=true npm run build
mkdir -p preview && cp -r out preview/jamstar
npx serve preview                   # then open http://localhost:3000/jamstar/
```

Serving `out/` at the root instead would mask exactly the `basePath` problems
this is meant to catch.

`basePath` covers `_next/*` and metadata automatically, but **not** a plain
`<img src="/…">`. Public assets referenced directly — the optional club logos —
go through `withBasePath()` in `src/lib/basePath.ts`.

If the first deploy fails to enable Pages, the workflow's `configure-pages` step
lacked the permission. Fix it once by hand: **Settings → Pages → Source: GitHub
Actions**, then re-run the workflow.

---

## How it is built

```
src/game/          the simulation — no React, no DOM, fully testable
  rng.ts           seeded PRNG; everything derives from this
  types.ts         domain types
  create.ts        character creation
  engine.ts        the season loop and phase machine
  ladder.ts        which league and club you belong in each year
  stats.ts         attributes + role + league → box score
  progression.ts   ageing, growth, decline, wear
  awards.ts        MVP, DPOY, All-League, international medals
  minigame.ts      the playable finals: challenge selection, difficulty, tuning
  rival.ts         the parallel rival career
  legacy.ts        career totals and the final verdict
  save.ts          localStorage
  events/          the event decks, one file per career stage
src/data/          leagues, clubs, countries, people, play styles, logo overrides
src/i18n/          UI dictionary + locale provider
src/components/    screens and widgets
  TeamCrest.tsx    club badges (SVG for the app, canvas twin for the share card)
  minigames/       the three finals challenges
```

### Determinism is load-bearing

The entire simulation runs off a seeded PRNG. `Math.random()` appears nowhere in
`src/game` — an `Rng` instance is threaded explicitly through every call that
needs randomness, and subsystems use `rng.fork(label)` so the rival's career can
never shift the stream for your events.

This is what makes the daily mode fair, makes a shared seed replay exactly, and
makes the whole engine testable. Replaying a seed with the same decisions
reproduces a career byte for byte, and a test asserts it.

Minigame results are **inputs**, not RNG draws — the engine is handed how many
attempts you converted, exactly the way it is handed which choice you picked on
an event card. So determinism holds as *same seed + same decisions + same
minigame results → same career*, and skill decides titles without ever making
the simulation unreproducible.

### Playable finals

`simulatePlayoffRun` stops at the final and reports whether you reached it. If
you did — and you were actually on the floor, not injured out of the season — the
season is parked as a draft in `draftSeason`, the phase switches to `minigame`,
and awards, salary and knock-on effects are all computed afterwards in
`finalizeSeason`. Finals you cannot contest fall back to `rollFinal`, so a player
who missed the whole year can still collect a ring from the bench, and both paths
share one finalisation routine so they can never drift apart.

### Balance

Calibrated across hundreds of simulated careers so the population looks like real
basketball. A player who never touches the preseason screen reaches the NBA about
10% of the time and mostly retires a solid pro; a player who allocates
deliberately reaches it around 30% and produces real stars. Achievements are
weighted by the tier they were earned at — a title in the LEB Oro counts, but it
is not an NBA ring, and the legacy score says so.

---

## Badges

Every club, academy and college gets a generated crest: one of six silhouettes
(shield, disc, roundel, hexagon, diamond, pennant) picked deterministically from
the team id, filled with that club's real colours and stamped with its
abbreviation. Nothing is fetched at runtime — the badges are inline SVG, which
also means they survive a strict CSP. The share card draws a canvas twin of the
same crest so the PNG matches what you saw in the app.

Leagues and cups have no colours to generate from, so they show a badge only
once a real logo exists and plain text before that.

**To use real logos:**

```bash
npm run logos:fetch -- --list      # what will be fetched; touches no network
npm run logos:fetch -- --dry-run   # resolve URLs, download nothing  ← read this
npm run logos:fetch                # ~181 files into public/logos/
npm run logos                      # regenerates src/data/logos.ts from that folder
git add public/logos src/data/logos.ts && git commit && git push
```

The logos have to be **committed** — Pages builds from the repository, so files
that only exist on your machine will not reach the live site.

**Do the dry run and read the lines before a real run.** `logos:fetch` resolves
each entry in order:

1. a manual URL from `scripts/logo-sources.json`, if one is set;
2. the NBA's own CDN — clean SVGs keyed by franchise id, clubs only;
3. **the logo named in the article's infobox**;
4. Wikidata's structured "logo image" (P154);
5. the article's lead image, and only if it looks like a badge at all.

Steps 3–5 are all Wikipedia, in decreasing order of *is this actually the badge*.
The order is the whole point. Relying on the lead image alone — which is all this
script did originally — fails on most club crests and quietly succeeds with an
arena photograph on the rest, because that API returns only **freely licensed**
images and a club crest is almost always non-free, uploaded under fair use. The
infobox names the real crest either way.

The other risk is the search itself: an ambiguous name does not fail, it succeeds
with the wrong badge. "Real Madrid" and "Flamengo" land on the football side;
"Copa del Rey", "Coppa Italia" and "Coupe de France" are all football tournaments
first; and every NCAA program's plain name is its football article. A hint table
pins ~130 of those to the right article, and the dry run prints where each one
resolved — the only place a wrong match is visible before it is on screen.

Useful flags:

```bash
npm run logos:fetch -- --kind=cup             # team | league | cup
npm run logos:fetch -- --league=nba           # one league at a time
npm run logos:fetch -- --only=lal,copa_rey
npm run logos:fetch -- --retry-failed         # just the ids in _report.json
npm run logos:fetch -- --force                # re-download existing
npm run logos:fetch -- --include-youth
```

It skips anything already downloaded, so re-running only fills gaps.

**When something comes back wrong.** Every download is recorded in
`public/logos/_sources.json` with the URL and the resolver that found it, and the
run prints a list of anything that came from step 5 — those are the ones worth
looking at. Fix one by putting a direct URL in `scripts/logo-sources.json`, which
beats every resolver, then re-run with `--force --only=<id>`.

Whatever cannot be resolved lands in `public/logos/_report.json`; `--retry-failed`
re-runs exactly those, which is usually what you want after a batch is lost to
rate limiting. The script backs off and retries on a 429 rather than giving up,
but Wikimedia throttles hard enough that a large run can still lose a tail.

Anything still missing keeps its generated crest (clubs) or stays text (leagues
and cups), so a partial set is fine.

Three ids are skipped by design, having no single real badge: `youth`,
`conference_tournament` and `cba_allstar_cup`. `coupe_france_b` is aliased to
`coupe_france`, since both French tiers enter the same trophy.

> Club logos are copyrighted artwork as well as trademarks. Fine for a hobby
> build; get permission before publishing one commercially.

## Swapping the name data

**All real names live in four files**: `src/data/teams.ts` (clubs),
`src/data/people.ts` (rival players, coaches, agents), `src/data/countries.ts`
(nations and national teams) and `src/data/cups.ts` (domestic cups). The engine
only ever refers to clubs by `id`, so replacing these with a licence-safe set
requires **no changes to `src/game`**.

To build a fully fictional version: rewrite the `name` fields in `teams.ts` and
`cups.ts`, swap `REAL_STARS` in `people.ts` for generated names, and leave every
`id` untouched. The test suite will confirm nothing broke.

Cups are opt-in per league: a league with no entry in `cups.ts` simply has no cup,
and the whole subsystem is skipped for it.

> **A note on names.** This project uses real league, club and player names for
> authenticity, in the same way the games that inspired it do. Those names are
> trademarks of their respective owners and no affiliation or endorsement is
> implied. If you intend to publish this commercially, use the swap described
> above or obtain the relevant licences. Player attributes and `ceiling` values
> are gameplay dials, not editorial judgements.

---

## Tests

```bash
npm test
```

47 tests covering the things that actually break:

- **Determinism** — same seed produces a byte-identical career; different seeds
  do not; `fork()` streams are independent and reproducible.
- **Termination and sanity** — 300 careers across every country, position and
  style all terminate, with no `NaN`, no negative stats, games played plus games
  missed always equalling the schedule, and every club/league id resolving.
- **Plausible bands** — nobody averages 42 points or 22 rebounds a game.
- **Data integrity** — no duplicate club, league, country or event ids (a
  duplicate id silently overwrites an entry in the lookup map).
- **Translation completeness** — the two dictionaries have identical key sets,
  matching `{placeholder}` tokens, no empty strings, and no untranslated prose;
  every event title and choice carries both languages.
- **Balance invariants** — deliberate growth-point spending measurably beats
  leaving it to the engine; elite outcomes stay rare for casual play; the legacy
  score scales with the level played at; the Hall of Fame flag can never
  contradict the legacy tier.
- **Playable finals** — a career where every final is won collects more titles
  than the same seeds losing every final; losing a contested final can never
  produce a title; no minigame is offered for a season the player sat out; the
  challenge is never against your own club; every difficulty and tuning value
  lands inside a playable range across 200 generated challenges; and no draft
  season is ever left dangling or committed twice.

---

## Licence

MIT — see [LICENSE](LICENSE).
