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

Deploys to Vercel as-is; it is a static Next.js app with no server dependencies.

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
  rival.ts         the parallel rival career
  legacy.ts        career totals and the final verdict
  save.ts          localStorage
  events/          the event decks, one file per career stage
src/data/          leagues, clubs, countries, people, play styles
src/i18n/          UI dictionary + locale provider
src/components/    screens and widgets
```

### Determinism is load-bearing

The entire simulation runs off a seeded PRNG. `Math.random()` appears nowhere in
`src/game` — an `Rng` instance is threaded explicitly through every call that
needs randomness, and subsystems use `rng.fork(label)` so the rival's career can
never shift the stream for your events.

This is what makes the daily mode fair, makes a shared seed replay exactly, and
makes the whole engine testable. Replaying a seed with the same decisions
reproduces a career byte for byte, and a test asserts it.

### Balance

Calibrated across hundreds of simulated careers so the population looks like real
basketball. A player who never touches the preseason screen reaches the NBA about
10% of the time and mostly retires a solid pro; a player who allocates
deliberately reaches it around 30% and produces real stars. Achievements are
weighted by the tier they were earned at — a title in the LEB Oro counts, but it
is not an NBA ring, and the legacy score says so.

---

## Swapping the name data

**All real names live in three files**: `src/data/teams.ts` (clubs),
`src/data/people.ts` (rival players, coaches, agents) and `src/data/countries.ts`
(nations and national teams). The engine only ever refers to clubs by `id`, so
replacing these with a licence-safe set requires **no changes to `src/game`**.

To build a fully fictional version: rewrite the `name` fields in `teams.ts`, swap
`REAL_STARS` in `people.ts` for generated names, and leave every `id` untouched.
The test suite will confirm nothing broke.

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

37 tests covering the things that actually break:

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

---

## Licence

MIT — see [LICENSE](LICENSE).
