# Draft Outlook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make draft night something the player can see coming, understand their standing in, and act on — instead of a verdict that arrives without warning.

**Architecture:** One pure function in `src/game/draft.ts` derives everything from the same `draftStock` the draft itself uses, so the projection cannot lie. Two surfaces render it: a persistent one-line reminder, and a fuller panel where decisions get made.

**Tech Stack:** TypeScript (strict), Next 15, React 19, Tailwind, vitest. Node 22.

This lands on `feat/career-loop-wave-3`, extending PR #11.

## Global Constraints

- **The projection must be derived from `draftStock`, not re-invented.** If the displayed range and the actual draft disagree, the feature is worse than nothing. `runDraft` and the outlook share one code path for both.
- **Hype is a hidden stat by design** (`types.ts:39` — "Hidden state the player feels but never sees as a raw number"). Do not print it, and do not add a bar or a percentage for it. Express it qualitatively.
- **This wave's guards stay green.** `rpg.mean` has ~2.8pp of headroom and `legacy.test.ts`'s perk-agency invariant has about 6% — neither should move, because nothing here changes simulation inputs. If a distribution row moves at all, something is wrong: stop and report.
- Do NOT touch `src/game/__fixtures__/career-baseline.json`, `src/data/perks.ts`, `SAVE_VERSION` (it is 4), the gain ladder in `progression.ts`, `stageForAge`, or any event card or assertion band.
- Every user-facing string exists in both `es` and `en` in `src/i18n/dictionary.ts`; a test asserts the key sets match. Spanish is the source of truth and is **Rioplatense**.
- No `Math.random()` in `src/game`. The outlook must be a **pure function with no `Rng`** — it is read on every render and must not consume randomness or vary between reads.
- TypeScript is strict. Comments explain *why*, not *what*.
- Verify with `npm test`, `npm run typecheck`, `npm run lint` before every commit.

---

## What exists today

`src/game/draft.ts` already has everything the projection needs, all of it private:

```ts
function draftStock(player, country) {
  return overallRating(player) * 0.86 + player.hidden.hype * 0.22 + country.strength * 0.06
}
```

and inside `runDraft`:

```ts
const centre = clamp(Math.round(96 - stock * 1.05), 1, TOTAL_PICKS)   // TOTAL_PICKS = 58
const spread = clamp(Math.round(18 - stock * 0.12), 4, 16)
const projectedRange = [clamp(centre - spread, 1, 58), clamp(centre + spread, 1, 58)]
```

The range is currently shown **only on draft night**, in `DraftScreen.tsx`. Before that the player sees nothing: not when the draft is coming, not where they stand, not what would move it.

`isDraftEligible` is the other half, and its shape is the interesting part:

```ts
if (player.draftDone) return false
if (player.currentLeagueId === 'youth') return false
if (player.currentLeagueId === 'nba') return false
if (player.age < 19) return false
if (player.currentLeagueId === 'ncaa') return seasonsPlayed >= 4 || player.age >= 22 || overallRating(player) > 66
return player.age >= 22 || overallRating(player) > 58
```

So the draft is **not on a fixed date**. It happens at 22 regardless, or sooner if the player is good enough to force it. That uncertainty is worth surfacing rather than hiding — "at 22 it happens to you, sooner if you make it happen" is a more interesting thing to know than a countdown.

---

## Task 1: `draftOutlook()`

**Files:**
- Modify: `src/game/draft.ts`
- Create: `src/game/__tests__/draft-outlook.test.ts`

**Interfaces produced:**

```ts
export type DraftTier = 'lottery' | 'first_round' | 'second_round' | 'fringe'
export type DraftLimiter = 'ability' | 'exposure' | null

export interface DraftOutlook {
  /** True once `isDraftEligible` would fire this season. */
  eligibleNow: boolean
  /** Seasons until age 22, when eligibility stops being optional. 0 once reached. */
  seasonsUntilForced: number
  /** True when a good season could pull the draft forward — the rating gate is close. */
  couldDeclareEarly: boolean
  /** Same maths the draft itself uses. */
  projectedRange: [number, number]
  tier: DraftTier
  /** Which side of the stock formula is furthest behind, or null when balanced. */
  limiter: DraftLimiter
}

export function draftOutlook(player: Player, country: Country, seasonsPlayed: number): DraftOutlook | null
```

**Returns `null`** when there is no draft to look forward to: `draftDone`, already in the NBA, or past the age where it could still happen. Callers render nothing in that case. Deciding this in the game layer rather than in each component keeps the rule in one place.

- [ ] **Step 1: Write the failing tests.**

- `draftOutlook` returns `null` for a player with `draftDone`, for one in the NBA, and for a 30-year-old who never got drafted.
- A 17-year-old in a domestic league gets a non-null outlook with `eligibleNow: false` and `seasonsUntilForced: 5`.
- `projectedRange` **exactly equals** the range `runDraft` produces for the same player and country. Assert this by calling both — it is the property the whole feature rests on, and a drift between them is the one bug that would make this worse than shipping nothing.
- Raising `overallRating` narrows the range (the `spread` term shrinks as stock rises) and moves it toward pick 1.
- `tier` is `'lottery'` when the range centre is ≤14, `'first_round'` when ≤30, `'second_round'` when ≤58, `'fringe'` when the stock is low enough that `runDraft` would likely not draft them at all.
- `limiter` is `'exposure'` for a player whose rating is strong but hype is low, `'ability'` for the reverse, and `null` when neither is notably behind.
- The function is pure: calling it twice on the same player returns deep-equal results, and it takes no `Rng`.

- [ ] **Step 2:** Run them, confirm they fail on the missing export.

- [ ] **Step 3: Implement.**

Export `draftStock` (or a small `stockFor` wrapper) so `runDraft` and `draftOutlook` share it, and factor the `centre`/`spread` arithmetic into one function both call. **Do not duplicate the formula** — that is exactly how the projection and the outcome drift apart.

For `limiter`, compare each term's contribution against a benchmark rather than inventing a scale. Hype starts around 12 and is bounded at 0-100; `overallRating` runs roughly 40-90. A defensible rule: compute the stock the player would have with hype held at 40, and the stock they would have with rating held at 60, and report whichever substitution improves stock more — that names the term further behind. State the benchmark values in a comment with the reasoning, and keep them together as named constants.

`seasonsUntilForced` is `Math.max(0, 22 - player.age)`.

`couldDeclareEarly` is true when the player is 19+ and within a few rating points of the gate that applies to them (>58, or >66 in the NCAA), so the hint can say a strong season might pull it forward. Pick the margin, name it as a constant, and justify it.

- [ ] **Step 4:** Run the tests, then the full suite. **The distribution rows must be untouched** — this task adds a read-only function and changes no simulation input. If a row moves, stop and report.

- [ ] **Step 5: Commit.**

---

## Task 2: Put it on screen

**Files:**
- Modify: `src/components/CareerStrip.tsx`, `src/components/PreseasonScreen.tsx`, `src/i18n/dictionary.ts`
- Possibly create: `src/components/DraftOutlook.tsx` if the panel earns its own file

**Two surfaces, doing different jobs.**

**The reminder — `CareerStrip.tsx`.** This is the always-visible header. Add one compact line, only when `draftOutlook` returns non-null. It answers "when" and "roughly where" at a glance and nothing more:

```
DRAFT · en 2 temporadas · mitad de 1ª ronda (#11–#24)
DRAFT · esta temporada · lotería (#4–#9)
```

Keep it to one line at 430px — this app is mobile-first and the strip is already dense. If it does not fit, shorten the copy rather than letting it wrap or scroll.

**The panel — `PreseasonScreen.tsx`.** This is where the player makes decisions, so it is where the hints belong. Render below the perk choice and above the attribute panel:

- when the draft is coming, and that 22 is the backstop — with `couldDeclareEarly` surfaced when true, since "a big season could pull this forward" is a genuine strategic fact;
- the projected tier and range, phrased as scouting language rather than a readout;
- **what is holding you back**, from `limiter`. Never print hype as a number. `'exposure'` reads as something like *"scouts rate the player, not the name — nobody outside your league has watched you play"*; `'ability'` as the reverse, that the reputation has outrun the game. `null` means say nothing rather than inventing a weakness;
- **what raises your stock this season** — concrete and true to the engine: a strong season, playing where scouts actually look, national-team call-ups. Do not promise anything the simulation does not model.

Both surfaces need dictionary keys in **both** `es` and `en`. The tier names and the hint copy are UI chrome, so they belong in `dictionary.ts`, not the data layer. Interpolated values (the pick numbers, the season count) go through the existing interpolation the dictionary already supports — check how `injuryOut` does it and follow that.

- [ ] **Step 1:** Add the dictionary keys, both languages.
- [ ] **Step 2:** Build the panel.
- [ ] **Step 3:** Add the strip line.
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint`. The dictionary key-parity test is the one most likely to catch a mistake here.
- [ ] **Step 5: Commit.**

---

## Task 3: Verify

- [ ] **Step 1:** `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] **Step 2:** `MSYS_NO_PATHCONV=1 STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build`
- [ ] **Step 3:** Confirm every distribution row is **unchanged** from before this work. Nothing here touches a simulation input, so any movement is a bug.
- [ ] **Step 4:** Confirm `git log --oneline --all -- src/game/__fixtures__/career-baseline.json` still shows exactly one commit.
- [ ] **Step 5:** Report the outlook for a sample of careers at ages 17 through 22 — the range, tier and limiter at each step — so the progression can be read at a glance and sanity-checked by a human. A projection that never moves, or that swings wildly season to season, is a design problem worth catching here rather than in play.
