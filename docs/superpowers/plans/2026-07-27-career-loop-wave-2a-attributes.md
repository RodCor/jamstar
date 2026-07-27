# Career Loop Wave 2a — Attribute Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the game's seven attributes with five named for what they do, without silently rebalancing the simulation, and quiet the two screens that render them.

**Architecture:** One atomic rename-and-reweight of `AttributeKey` across `src/game` and `src/data` — the tree does not typecheck halfway, so it is a single task. Then a distribution guard asserting the merged model still produces careers like the old one, a `SAVE_VERSION` bump, and two UI tasks.

**Tech Stack:** TypeScript (strict), Next 15, React 19, Tailwind, vitest. Node 22. No new dependencies.

Spec: `docs/superpowers/specs/2026-07-27-career-loop-features-design.md`, section "Wave 2 — the model change", items 5 and 7. Item 6 (perk rarity) is Wave 2b and is **not** in this plan.

## Global Constraints

- **`Country.strength` and `Team.strength` are NOT player attributes.** `strength` means three different things in this codebase. Only `Attributes.strength` / the `AttributeKey` union renames. Touching `src/data/countries.ts`'s `strength: 72` or the `strength` argument of `t(...)` in `src/data/teams.ts` corrupts the data layer.
- **`PlayStyle.scoringBias`, `playmakingBias`, `defenseBias` are NOT attributes.** They are stat-generation multipliers and keep their names. Two of the new attributes now echo them; do not "unify" them.
- **Every user-facing string exists in both `es` and `en`** in `src/i18n/dictionary.ts`. A test asserts the key sets match exactly. Spanish is the source of truth.
- **No `Math.random()` anywhere in `src/game`.** Randomness comes from an `Rng` threaded explicitly. The single sanctioned exception is seed-string generation in `src/game/rng.ts`.
- The determinism guarantee is *same seed + same decisions → same career*, not *same career as before this wave*. `engine.test.ts`'s reproducibility test must still pass **within** the new model.
- Verify with `npm test`, `npm run typecheck`, `npm run lint` before every commit.

---

## The mapping

| New | Absorbs | Spanish label | English label |
|---|---|---|---|
| `scoring` | shooting | Anotación | Scoring |
| `playmaking` | handling, part of iq | Generación | Playmaking |
| `defense` | defense (unchanged) | Defensa | Defense |
| `physical` | athleticism, strength | Físico | Physical |
| `mental` | leadership, rest of iq | Mentalidad | Mental |

**Three conversion cases, which do not share an answer:**

1. **Additive contribution formulas** — sum the coefficients. `handling * 0.075 + iq * 0.05` becomes `playmaking * 0.125`. Carrying only `0.075` forward would lose 40% of the term, and doing that across the codebase would deflate the whole game.
2. **Normalised weight maps** — sum; `weightSum` makes it self-normalising.
3. **Per-attribute scalars** (`DECLINE_RATE`, `PEAK_AGE`) — summing is meaningless. This plan gives the chosen literals.

---

## Task 1: The merge

**Files:**
- Modify: `src/game/types.ts`, `src/game/progression.ts`, `src/game/stats.ts`, `src/game/minigame.ts`, `src/game/awards.ts`, `src/game/create.ts`, `src/data/styles.ts`, `src/game/events/*.ts` (6 files), `src/components/display.ts`, `src/i18n/dictionary.ts`
- Modify as the compiler demands: `src/game/ladder.ts`, `src/game/offers.ts`, `src/game/draft.ts`, `src/game/national.ts`, `src/game/cup.ts`, `src/game/engine.ts`
- Test: `src/game/__tests__/*.test.ts` — existing fixtures name attributes and must be updated

**Interfaces:**
- Produces: `AttributeKey = 'scoring' | 'playmaking' | 'defense' | 'physical' | 'mental'`, and `ATTRIBUTE_KEYS` in that order.

- [ ] **Step 1: Change the type and the key list**

In `src/game/types.ts`:

```ts
export type AttributeKey = 'scoring' | 'playmaking' | 'defense' | 'physical' | 'mental'

export const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  'scoring',
  'playmaking',
  'defense',
  'physical',
  'mental',
]
```

Update the `Attributes` interface to those five keys, keeping each doc comment's intent and rewriting it for the merged meaning.

- [ ] **Step 2: Run the typechecker and collect the work list**

Run: `npm run typecheck 2>&1 | tee /tmp/attr-errors.txt` (or redirect anywhere convenient).

Expected: a large number of errors. This list IS your work list — every site the compiler names must be converted per the rules below. Events (`src/game/events/*.ts`) are typed `Partial<Attributes>`, so every one of their ~120 references appears here; they are mechanical 1:1 renames with the sum rule where a single object mentions two merging attributes (e.g. `{ athleticism: -2, strength: 3 }` becomes `{ physical: 1 }`).

- [ ] **Step 3: `src/game/progression.ts` — the scalars**

Replace `DECLINE_RATE` and `PEAK_AGE` with these literals. Do not derive them; they are chosen.

```ts
/**
 * How fast each attribute falls once past its peak, in points per year.
 * Physical is the gamble and mental is the hedge — that contrast is what makes
 * an ageing career interesting, so the merge preserves it at the extremes.
 */
const DECLINE_RATE: Record<AttributeKey, number> = {
  physical: 0.75,   // between athleticism's 1.0 and strength's 0.45, weighted to the explosion you lose first
  defense: 0.5,
  playmaking: 0.3,  // handling's old rate; the hands go slowly
  scoring: 0.15,    // a jump shot survives almost everything
  mental: -0.3,     // negative: experience keeps accruing into the late 30s
}

/** Age at which each attribute stops growing on its own and starts to fade. */
const PEAK_AGE: Record<AttributeKey, number> = {
  physical: 25,
  playmaking: 27,
  defense: 28,
  scoring: 30,
  mental: 40,
}
```

Update the two style modifiers inside `ageOneYear`:

```ts
      if (key === 'physical' && style.id === 'highlight') delta *= 1.25
      if (key === 'mental' && style.id === 'highlight') delta *= 0.7
```

- [ ] **Step 4: `src/game/progression.ts` — collapse the duplicated weight map**

`POSITION_WEIGHTS` (module const) and the inline `weights` object inside `overallRating` are currently **byte-identical duplicates**. Delete the inline copy and have `overallRating` read `POSITION_WEIGHTS`. Then replace the map with:

```ts
/**
 * Positional value of each attribute. Drives both rating and auto-spending.
 *
 * Each row sums to 1, though `overallRating` normalises anyway. The old
 * seven-key rows folded in here: handling and part of iq into playmaking,
 * athleticism and strength into physical, leadership and the rest of iq into
 * mental — with iq leaning toward playmaking for guards, who read the floor
 * with the ball, and toward mental for bigs, who read it without.
 */
const POSITION_WEIGHTS: Record<string, Partial<Record<AttributeKey, number>>> = {
  PG: { playmaking: 0.38, scoring: 0.22, physical: 0.16, mental: 0.14, defense: 0.1 },
  SG: { scoring: 0.3, playmaking: 0.24, physical: 0.22, defense: 0.16, mental: 0.08 },
  SF: { physical: 0.34, scoring: 0.22, defense: 0.2, playmaking: 0.18, mental: 0.06 },
  PF: { physical: 0.44, defense: 0.24, scoring: 0.16, playmaking: 0.08, mental: 0.08 },
  C: { physical: 0.48, defense: 0.28, scoring: 0.1, mental: 0.09, playmaking: 0.05 },
}
```

- [ ] **Step 5: `src/game/stats.ts` — the box-score formulas**

Convert exactly as follows. Three of these are sums; the rest are 1:1.

| Line | Was | Becomes |
|---|---|---|
| scoringBase | `a.shooting*0.3 + a.athleticism*0.16 + a.handling*0.08` | `a.scoring*0.3 + a.physical*0.16 + a.playmaking*0.08` |
| rebounds | `(a.strength*0.1 + a.athleticism*0.055)` | `(a.physical*0.155)` — **sum** |
| assists | `(a.handling*0.075 + a.iq*0.05)` | `(a.playmaking*0.125)` — **sum** |
| steals | `(a.defense*0.022 + a.athleticism*0.012)` | `(a.defense*0.022 + a.physical*0.012)` |
| blocks | `(a.defense*0.016 + a.athleticism*0.012)` | `(a.defense*0.016 + a.physical*0.012)` |
| turnovers | `- a.iq*0.012 - a.handling*0.008` | `- a.playmaking*0.020` — **sum** |
| FT% | `38 + a.shooting*0.14 + a.iq*0.05` | `38 + a.scoring*0.14 + a.mental*0.05` — iq here is composure at the line |
| 3P% | `24 + a.shooting*0.16 …` | `24 + a.scoring*0.16 …` |
| FG% | `52 + a.shooting*0.28 …` | `52 + a.scoring*0.28 …` |

- [ ] **Step 6: `src/game/minigame.ts` — selection weights and difficulty**

In the `weights` map, **keep the expression structure** so the style multiplier still applies to only the term it applied to before:

```ts
    clutch_three: a.scoring * 1.2 * (style.id === 'sharpshooter' ? 2.2 : 1),
    free_throw: 55 + a.scoring * 0.35,
    defensive_stop: a.defense * 1.1 * (style.id === 'lockdown' ? 2.4 : 1) + (isBig ? 35 : 0),
    fast_break:
      a.physical * 1.0 * (style.id === 'highlight' ? 2.4 : 1) + a.physical * 0.35,
    play_recall: a.mental * 1.1 * (style.id === 'floor_general' ? 2.2 : 1) + a.mental * 0.4,
```

In `relevantAttribute`, two of these collapse to a single term:

```ts
    case 'clutch_three':
      return a.scoring * 0.8 + a.mental * 0.2
    case 'free_throw':
      return a.scoring * 0.7 + a.mental * 0.3
    case 'defensive_stop':
      return a.defense * 0.6 + a.mental * 0.4
    case 'fast_break':
      return a.physical * 1.0
    case 'play_recall':
      return a.mental * 1.0
```

- [ ] **Step 7: `src/game/create.ts` — starting spreads**

```ts
  PG: { playmaking: 17, scoring: 4, mental: 3, defense: -2, physical: -8 },
  SG: { scoring: 10, playmaking: 5, physical: -1 },
  SF: { physical: 6, defense: 4, scoring: 2 },
  PF: { physical: 10, defense: 6, playmaking: -6, scoring: -4 },
  C: { physical: 10, defense: 8, playmaking: -12, scoring: -8 },
```

- [ ] **Step 8: `src/data/styles.ts` — style bonuses**

Apply the mapping to every style's `bonus`, summing where one object names two merging attributes. `scorer`'s `{ shooting: 8, handling: 3, defense: -3, leadership: -1 }` becomes `{ scoring: 8, playmaking: 3, defense: -3, mental: -1 }`. Leave `scoringBias`, `playmakingBias`, `defenseBias`, `injuryFactor` and `hypeFactor` untouched.

- [ ] **Step 9: `src/game/awards.ts` and the remaining compiler errors**

`awards.ts:47`'s `player.attributes.defense` is unchanged in name and meaning. Work through the rest of the typecheck list mechanically.

- [ ] **Step 10: Labels, in both languages**

In `src/components/display.ts`, `ATTRIBUTE_KEY` and `ATTRIBUTE_HELP_KEY` become five entries each (`attrScoring`, `attrPlaymaking`, `attrDefense`, `attrPhysical`, `attrMental`, plus the `…Help` variants).

In `src/i18n/dictionary.ts`, **delete the seven old `attr*` and `attr*Help` keys and add five of each, in BOTH `es` and `en`**:

```ts
  attrScoring: 'Anotación',
  attrPlaymaking: 'Generación',
  attrDefense: 'Defensa',
  attrPhysical: 'Físico',
  attrMental: 'Mentalidad',

  attrScoringHelp: 'Puntos y eficiencia de tiro. Envejece bien.',
  attrPlaymakingHelp: 'Asistencias, manejo y menos pérdidas.',
  attrDefenseHelp: 'Robos, tapones y premios defensivos.',
  attrPhysicalHelp: 'Explosión, rebote y aguante — pero más lesiones y la caída más dura después de los 30.',
  attrMentalHelp: 'Decisiones, momentos decisivos y una carrera más larga.',
```

English:

```ts
  attrScoring: 'Scoring',
  attrPlaymaking: 'Playmaking',
  attrDefense: 'Defense',
  attrPhysical: 'Physical',
  attrMental: 'Mental',

  attrScoringHelp: 'Points and shooting efficiency. Ages well.',
  attrPlaymakingHelp: 'Assists, ball handling and fewer turnovers.',
  attrDefenseHelp: 'Steals, blocks and defensive awards.',
  attrPhysicalHelp: 'Explosion, rebounding and durability — but more injuries and the steepest fall after 30.',
  attrMentalHelp: 'Decisions, big moments and a longer career.',
```

- [ ] **Step 11: Update the test fixtures**

Existing tests set attributes by name (`src/game/__tests__/offers.test.ts`, `legacy.test.ts`, `minigame.test.ts`). Convert them with the same rules. Do NOT change any assertion's expected *outcome* to make a test pass — if an assertion now fails on a value rather than a name, stop and report it; that is a signal the merge changed behaviour, which is Task 2's business.

- [ ] **Step 12: Verify**

Run: `npm test`, `npm run typecheck`, `npm run lint`. All must pass.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Merge seven attributes into five

Named for what they do rather than for a body part. Handling and the on-ball
half of IQ become playmaking; athleticism and strength become physical;
leadership and the rest of IQ become mental.

Formulas that referenced two now-merged attributes sum their coefficients —
carrying one forward would have quietly deflated the game. Decline rates and
peak ages are chosen values, not sums. The duplicated position-weight map is
collapsed to one."
```

---

## Task 2: The distribution guard

**Files:**
- Create: `src/game/__tests__/career-distribution.test.ts`
- Read: `src/game/__fixtures__/career-baseline.json` (already committed)

**Context you need:** the fixture holds the aggregate career distribution of the **seven**-attribute model — 240 seeded careers, captured before the merge. A systematic deflation passes every other test in this suite; `engine.test.ts`'s "plausible basketball bands" has bands wide enough to hide a 40% drop. This test is the only thing that catches it.

- [ ] **Step 1: Write the test**

Drive 240 careers exactly as the fixture was captured: seeds `baseline::0` … `baseline::239`, an `Rng` per career seeded `baseline::<i>`, positions cycling `PG,SG,SF,PF,C`, styles cycling `scorer, floor_general, sharpshooter, lockdown, highlight, franchise`, countries cycling `US,ES,AR,RS,FR`, number `(i % 55) + 1`, hand `right`, name `P<i>`. At each phase pick randomly from the `Rng` (`rng.int(0, n-1)` for offers/events, `rng.pick` for perks, `rng.int(0, rounds)` for minigames). Aggregate mean/p10/p50/p90 of career PPG, RPG, APG, seasons and peak rating, plus rings/MVPs/All-Stars per career.

Assert each **mean** is within **±12%** of the fixture, and `seasons.mean` within ±8% (career length is structural — a big move there means ageing broke, not that scoring drifted).

Give the test a comment naming what it is for: that it exists to catch a uniform deflation of the formulas, which no other test in the suite can see.

- [ ] **Step 2: Run it**

Run: `npx vitest run src/game/__tests__/career-distribution.test.ts`

If it fails, **do not widen the band to make it pass.** Report the actual numbers against the fixture — a mean outside the band means a coefficient was carried forward instead of summed, and the fix belongs in Task 1's files.

- [ ] **Step 3: Commit**

```bash
git add src/game/__tests__/career-distribution.test.ts
git commit -m "Guard the merged model against the seven-attribute baseline

A uniform deflation of every formula passes the entire rest of the suite."
```

---

## Task 3: Bump the save version

**Files:** `src/game/create.ts`, `src/game/__tests__/save-compat.test.ts`

**Context:** a save written before this wave holds seven-attribute players. Loading one into five-attribute code gives every player `undefined` for all five attributes — arithmetic on `undefined` yields `NaN` and the career silently rots. The version bump is what discards those saves, and it is required, not optional.

`save-compat.test.ts` has a canary asserting `SAVE_VERSION === 3`. **It will fail. That is the canary working.** Update it in the same commit, keeping its explanatory comment, rather than deleting it.

- [ ] **Step 1:** In `src/game/create.ts`, `export const SAVE_VERSION = 4`.
- [ ] **Step 2:** In `save-compat.test.ts`, change the canary to `toBe(4)` and update its comment to say the bump happened here and why (the attribute model changed shape, so old saves cannot be read).
- [ ] **Step 3:** Run `npm test`. The round-trip test still constructs its state via `createGame`, so it keeps passing at the new version.
- [ ] **Step 4:** Commit.

```bash
git add src/game/create.ts src/game/__tests__/save-compat.test.ts
git commit -m "Bump SAVE_VERSION to 4 — the attribute model changed shape

A seven-attribute save read by five-attribute code gives every player undefined
for every attribute, and the arithmetic turns the career to NaN in silence.
Discarding is the honest option, and it is what the canary was for."
```

---

## Task 4: Five numbers instead of seven bars

**Files:** `src/components/PreseasonScreen.tsx`, `src/game/types.ts`, `src/game/engine.ts`

**Context:** `AttributePanel` currently draws a labelled progress bar per attribute. The spec calls for plain numbers with the change since last preseason, ordered by position, with the position's two defining attributes emphasised. A delta needs a snapshot, which does not exist yet — add one. `SAVE_VERSION` was bumped in Task 3, so adding a persisted field here costs nothing.

- [ ] **Step 1:** Add to `Player` in `src/game/types.ts`:

```ts
  /**
   * Attributes as they stood at the previous preseason, so the screen can show
   * what a year actually bought. Absent in a player's first preseason, when
   * there is nothing to compare against.
   */
  attributesLastYear?: Attributes
```

- [ ] **Step 2:** In `src/game/engine.ts`, snapshot it in `startOffseason` immediately **before** `ageOneYear(player, …)` runs:

```ts
  // Snapshot before ageing and growth, so the preseason screen can show the
  // year's net movement rather than only what the player chose to spend.
  player.attributesLastYear = { ...player.attributes }
```

- [ ] **Step 3:** Rewrite `AttributePanel` to render five rows: label, value, and the signed delta when `attributesLastYear` exists. No bars. Order by `POSITION_ORDER` below, and emphasise the first two (`text-slate-100 font-bold` versus `text-slate-400` for the rest).

```tsx
/** Which attributes matter most where, so the two that define you read first. */
const POSITION_ORDER: Record<Position, AttributeKey[]> = {
  PG: ['playmaking', 'scoring', 'mental', 'physical', 'defense'],
  SG: ['scoring', 'playmaking', 'physical', 'defense', 'mental'],
  SF: ['physical', 'scoring', 'defense', 'playmaking', 'mental'],
  PF: ['physical', 'defense', 'scoring', 'playmaking', 'mental'],
  C: ['physical', 'defense', 'scoring', 'mental', 'playmaking'],
}
```

Render a delta of 0 as nothing rather than "+0". Positive in `text-emerald-400`, negative in `text-rose-400`.

- [ ] **Step 4:** Run `npm test`, `npm run typecheck`, `npm run lint`, then commit.

---

## Task 5: Trim the season card

**Files:** `src/components/SeasonResultScreen.tsx`

**Context:** `SeasonCard` currently renders a six-cell stat grid, then a four-cell grid, then up to five chips, then headlines. The spec cuts it to one stat row of the three numbers that define the position plus games and TS%, with the rest behind a tap.

- [ ] **Step 1:** Replace the two grids with a single five-cell row driven by:

```tsx
/** The three numbers that define each position, plus the two that define a season. */
const BOX_LEAD: Record<Position, ('points' | 'rebounds' | 'assists' | 'steals' | 'blocks')[]> = {
  PG: ['points', 'assists', 'steals'],
  SG: ['points', 'assists', 'steals'],
  SF: ['points', 'rebounds', 'steals'],
  PF: ['points', 'rebounds', 'blocks'],
  C: ['points', 'rebounds', 'blocks'],
}
```

followed by games played and TS%.

`Season` does **not** carry a position, and `SeasonCard` is exported but used in exactly one place — `SeasonResultScreen.tsx:26`. So add a required `position: Position` prop and pass `state.player.position` from that one call site. A player's position never changes after creation (nothing in `src/game` ever assigns `player.position`), so the current player's position is correct for every past season.

- [ ] **Step 2:** Put the remaining numbers (the other two counting stats, minutes, FG%, 3P%) behind a "more" toggle using `useState`, collapsed by default.
- [ ] **Step 3:** Collapse the chip row to a single line: role, record, playoff result, salary. Keep the injury chip only when `gamesMissed > 0`, as now.
- [ ] **Step 4:** Any new label goes in both `es` and `en`.
- [ ] **Step 5:** Run `npm test`, `npm run typecheck`, `npm run lint`, then commit.

---

## Task 6: Verify the wave

- [ ] **Step 1:** `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] **Step 2:** `MSYS_NO_PATHCONV=1 STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build` (the `MSYS_NO_PATHCONV` prefix is needed on Git Bash, which otherwise rewrites `/jamstar` into a Windows path; CI runs Ubuntu and does not need it)
- [ ] **Step 3:** Confirm `src/game/__fixtures__/career-baseline.json` is unmodified — the guard is worthless if the baseline was edited to match the new numbers. `git diff main -- src/game/__fixtures__/` must be empty.
- [ ] **Step 4:** Report the distribution test's actual margins against the fixture, so the size of the behavioural shift is on the record rather than merely "within band".

Do **not** start the perk work. Wave 2b is a separate plan.
