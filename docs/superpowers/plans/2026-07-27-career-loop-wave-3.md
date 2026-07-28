# Career Loop Wave 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete a dead subsystem the README still advertises, and make a career's events depend on where the player is from — so replaying from the same country stops feeling like the same story.

**Architecture:** Two independent pieces. The first is a deletion. The second adds a country-gated event deck plus new cards for the three early career stages, which are where the deck is thinnest and where every career begins.

**Tech Stack:** TypeScript (strict), Next 15, React 19, vitest. Node 22. No new dependencies.

## Global Constraints

- **`allStarsPerCareer` has 0.54pp of headroom** against its ±12% band — the tightest guard in the repo. Events grant attributes, so new cards push directly on it. New cards must be **net-neutral in expectation**: a good outcome that grants points needs a bad outcome that costs them, at comparable probability. Measure, do not assume.
- **Do NOT touch `src/game/__fixtures__/career-baseline.json`.** It records pre-merge behaviour, has exactly one commit in its history, and is the only copy.
- **Do NOT change the gain ladder** in `src/game/progression.ts` (`0.101 / 0.27 / 0.574 / 1.013 / 1.552`), `SAVE_VERSION` (it is 4), or any assertion band in `career-distribution.test.ts` or `perk-rarity-policy.test.ts`.
- **Do NOT touch `src/data/perks.ts`.** Its balance was settled across five measured fix rounds.
- Every user-facing string ships in both `es` and `en`. Event text carries its own `{es, en}` via `loc()` in the data layer — nothing event-related goes in `src/i18n/dictionary.ts`.
- The Spanish is **Rioplatense** — *vos*, *tirás*, *jugás*, *pibes*. It is written as Spanish, not translated from the English. Both texts should read as though written by someone who watches basketball in that language.
- No `Math.random()` in `src/game`. Randomness comes from `ctx.rng`.
- Verify with `npm test`, `npm run typecheck`, `npm run lint` before every commit.

---

## Task 1: Delete the growth-point scaffolding

**Files:** `src/game/progression.ts`, `src/game/perks.ts`, `README.md`, `src/game/__tests__/` as the compiler demands

**Context you need — this is a deletion, and the reason matters.**

`ageOneYear` ends by granting an annual allowance: `player.growthPoints += growthPointsFor(player.age, rng)`. Nothing ever spends it. `takePerk` runs `player.growthPoints = 0` before `autoSpendGrowth` is reached, so the allowance is granted and discarded every season of every career.

This is not an oversight to repair. Commit `69d07c7` ("Rework progression: perks, free agency, draft night and national teams") deleted the preseason allocation UI and added that zeroing in the same change — **perks replaced manual allocation**, and "Perks spend exactly what they grant" is the intended behaviour. What survived the rework is the old system's plumbing.

**Repairing the discard instead of deleting it would be wrong**: it would add roughly 60–100 spendable points per career and invalidate the 0.675 gain-ladder calibration, the 257-point perk pool and every assertion band at once.

- [ ] **Step 1: Confirm the deletion is inert before making it.**

There is one path where the allowance survives: `autoTakePerk` returns early when `perkChoices` is empty, so nothing zeroes it and `autoSpendGrowth` spends it. With a 53-perk pool this should be vanishingly rare, but confirm rather than assume — add a temporary `console.log` in `autoSpendGrowth` when `player.growthPoints > 0`, run `npx vitest run src/game/__tests__/career-distribution.test.ts`, and record how many of the 240 careers hit it. **Remove the log afterwards.** Report the count in your report; it is the evidence that this deletion changes nothing.

- [ ] **Step 2: Delete `growthPointsFor`** from `src/game/progression.ts`, and the `player.growthPoints += growthPointsFor(player.age, rng)` line at the end of `ageOneYear`.

- [ ] **Step 3: Decide `autoSpendGrowth`'s fate and say why.** With the allowance gone, its only remaining caller feeds it a player whose `growthPoints` is always zero, so it becomes a no-op loop. Either delete it and its call in `simulateSeason`, or keep it with a comment explaining what would have to change for it to do anything again. **Pick one, implement it, and justify the choice in your report** — do not leave it undocumented either way.

`Player.growthPoints` itself stays: `takePerk` and `developFromSeason` both still use it as a short-lived counter within a single call.

- [ ] **Step 4: Fix the README.** It currently promises:

> **Growth points are your main lever.** Every preseason you allocate points across your attributes. Returns diminish steeply, so specialising is a genuinely different build from spreading points evenly — and both beat leaving them unspent (anything you skip gets allocated for you, but without focus).

There is no allocation screen and there has not been one since `69d07c7`. Replace that paragraph with an honest description of what actually shapes a player: natural growth and decline by age, in-season form, and the perk taken each preseason. Keep the paragraph's register — it sits among other feature descriptions and should read like them.

While you are there, check the surrounding README claims against the code and fix anything else that has drifted. Report what you found.

- [ ] **Step 5: Verify.** `npm test`, `npm run typecheck`, `npm run lint`. The nine distribution metrics **must come out identical** — that is the proof the deleted code was inert. If any moves, stop and report: it would mean the allowance was reaching players more often than Step 1 suggested.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "Delete the growth-point allowance nothing could spend

ageOneYear granted an annual allowance and takePerk zeroed it before
autoSpendGrowth ever ran, every season of every career. Not an oversight:
69d07c7 replaced manual allocation with perks and left the old plumbing
behind. The README still described the screen that commit deleted."
```

---

## Task 2: A country-gated event deck

**Files:** create `src/game/events/origin.ts`; modify `src/game/events/index.ts`, `src/game/events/helpers.ts`

**Context.** `EventContext` already carries `country`, and several cards interpolate `ctx.country.name` into their text. No card is *gated* on country, so every player sees the same deck with different nouns in it.

The 21 countries are: AR US ES FR RS LT GR IT TR BR CA AU NG SN CM CN DE SI DO MX UY.

- [ ] **Step 1: Add the gate helper** to `src/game/events/helpers.ts`, beside the existing `gate` object:

```ts
  /**
   * Cards that only make sense if you grew up somewhere specific.
   *
   * Takes several codes because basketball cultures do not stop at borders —
   * the same street court exists eitherside of the Río de la Plata, and the
   * same academy pipeline runs through half of Europe. Listing them together
   * beats writing the same card twice with different flags on it.
   */
  fromCountry:
    (...codes: string[]) =>
    (ctx: EventContext) =>
      codes.includes(ctx.player.countryCode),
```

- [ ] **Step 2: Author the deck** in a new `src/game/events/origin.ts`, exporting `ORIGIN_EVENTS: GameEvent[]`, and register it in `index.ts`'s `ALL_EVENTS`.

**The coverage requirement, which Task 4 will assert:** every one of the 21 countries must have **at least 4** eligible origin cards, and at least **2** of those must include `'youth'` in `stages`. A player from Cameroon must not get a thinner early game than one from Spain.

Group by shared culture so the authoring stays honest rather than repetitive. Suggested groupings, which you may adjust if a card reads better differently:

| Grouping | Codes | The kind of thing that happens |
|---|---|---|
| Río de la Plata | AR UY | the potrero, the club social, long bus trips to a league game |
| Brazil | BR | futsal feet, the beach court, a club that is a football club |
| Latin America | DO MX | the diaspora scout, playing up an age group against grown men |
| Balkans | RS SI | the academy system, a coach who has produced internationals before |
| Baltics / Central Europe | LT DE | basketball as the national sport, a town that turns out for a youth game |
| Mediterranean | ES IT GR TR | the cantera, a club with a hundred years of history, a hostile away end |
| France | FR | the INSEP pathway, the choice between the federation and a club |
| North America | US CA | AAU, the recruiting circus, a school that wants you for football too |
| West Africa | NG SN CM | the academy that scouts you at a camp, the visa, the family decision |
| Oceania | AU | the institute programme, distance |
| China | CN | the sports-school system, a club that owns your development |

**Write to the house style.** Read `src/game/events/youth.ts` first — it is the standard. Cards are concrete and physical, they describe a thing happening to a person, and they never state their own numbers. A choice is a real dilemma with a cost on both sides, not an obvious right answer. Use `event()`, `loc()`, `outcome()`, `gamble()` and `gate` from `./helpers` rather than hand-rolling the shapes.

**Net-neutrality:** across the whole new deck, attribute grants and costs should roughly cancel. A `gamble` whose win grants +4 and whose loss costs −2 at 70% odds is net positive; balance it elsewhere. This is a soft constraint on the deck as a whole, not a rule per card — but it is what keeps `allStarsPerCareer` inside its 0.54pp.

- [ ] **Step 3:** Run `npm test`. Report the distribution guard's nine metrics, calling out `allStarsPerCareer` and `rpg.mean` explicitly. **If either leaves its band, stop and report the numbers rather than adjusting a band or the fixture** — the response would be to rebalance the new cards, and that is a decision to make on evidence.

- [ ] **Step 4: Commit.**

---

## Task 3: Thicken the early stages

**Files:** `src/game/events/youth.ts`, and `src/game/events/pro.ts` or a new file if it reads better

**Context — this is the other half of the repetition problem.** Events per stage today:

| Stage | Cards |
|---|---|
| youth | 8 |
| development | 8 |
| breakout | 9 |
| prime | 23 |
| veteran | 29 |
| twilight | 12 |

`EVENT_CHANCE` is 0.82, so a career draws roughly one event per season. Every career passes through youth, development and breakout with only 8–9 cards available at each — so the opening act of every replay is drawn from nearly the same small hand, while the prime and veteran years vary widely. Country gating alone would not fix this; it can even worsen it, since a gated card is unavailable to everyone else.

- [ ] **Step 1:** Add cards until `youth`, `development` and `breakout` each have **at least 16** eligible (counting the origin cards from Task 2 that carry those stages, since they are eligible for the countries they gate to — but a player from any single country must still reach 16, so most of these must be ungated).

Cover situations the existing early deck does not: a coach who plays you out of position, a teammate's family moving away, a first paid game, a scout who says something that lodges, an academic problem, a growth plateau while everyone else grows, a first real defeat.

- [ ] **Step 2:** Same measurement and stop-condition as Task 2 Step 3.

- [ ] **Step 3: Commit.**

---

## Task 4: Guard the coverage, then verify

**Files:** create `src/game/__tests__/event-coverage.test.ts`

**Context.** "Not repetitive" is the point of this wave, and nothing currently measures it. These assertions are what stop the deck quietly thinning again — the same role the pool-level perk guard plays.

- [ ] **Step 1: Write the coverage test.** For every one of the 21 country codes, build a minimal `EventContext` (or reuse the career harness in `career-distribution.test.ts` if that is cleaner — your call, say which and why) and assert:

1. Every country has **≥ 4** eligible origin-gated cards.
2. Every country has **≥ 2** origin-gated cards available at the `youth` stage.
3. For every country, and for each of `youth`, `development` and `breakout`, the total eligible pool is **≥ 16**.
4. No two events anywhere in `ALL_EVENTS` share an `id`. A duplicate id would make `findEvent` return the wrong card and is the kind of thing that only bites once a deck gets large.

Comment the file with what it is protecting: that these are floors on *variety per player*, not on total deck size, and that a country falling below them means someone from there replays the same opening every time.

- [ ] **Step 2: Full verification.**

```
npm test
npm run typecheck
npm run lint
npm run build
MSYS_NO_PATHCONV=1 STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build
```

- [ ] **Step 3: Confirm the fixture is untouched** — `git log --oneline --all -- src/game/__fixtures__/career-baseline.json` must show exactly one commit.

- [ ] **Step 4: Report the final numbers** — the nine distribution metrics with their margins, the per-stage event counts before and after, and the minimum per-country eligible count across all 21. Those three figures are what this wave is for.
