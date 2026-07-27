# Career Loop Wave 2b — Perk Rarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the preseason perk choice matter for a whole career — five earned rarity tiers, and a pool deep enough that it never runs dry.

**Architecture:** `Perk` gains a `rarity`. Drawing becomes two stages: roll a rarity per slot from a distribution weighted by how last season went, then fill it with an unowned perk of that rarity. The pool grows from 24 to ~53. Magnitudes are re-derived against the growth ladder Wave 2a retuned.

**Tech Stack:** TypeScript (strict), Next 15, React 19, Tailwind, vitest. Node 22.

Spec: `docs/superpowers/specs/2026-07-27-career-loop-features-design.md`, section "Wave 2 — the model change", item 6.

## Global Constraints

- **Attributes are now `scoring`, `playmaking`, `defense`, `physical`, `mental`.** Wave 2a merged them. Every perk's `bonus` uses these five keys and nothing else.
- **Magnitudes must be re-derived, not copied from the spec.** Spec §6's table (Basic 2–3 growth points … Top 1% 9–10) was written against the *seven*-attribute growth ladder. Wave 2a scaled `spendGrowthPoint`'s gain by **0.675**, and perk bonuses route through that same function — so the spec's numbers now buy about a third less than their author intended. Divide by 0.675 (multiply by ≈1.48) and use the table in Task 2.
- **Do NOT change the gain ladder** in `src/game/progression.ts` (`0.101 / 0.27 / 0.574 / 1.013 / 1.552`). It was set by measurement in Wave 2a and any change re-opens the whole balance question.
- **Do NOT touch `src/game/__fixtures__/career-baseline.json`.** It records pre-merge behaviour and is the only copy.
- **`rpg` has the least headroom of any guarded metric** (+7.52% against a ±12% band). Perks that multiply `rebounding` push directly on it. Check `career-distribution.test.ts` after the pool lands.
- **The distribution guard is a weak net for perks.** It catches formula-level deflation in `stats.ts`, not a few attribute points on a fraction of the cohort. Perk balance needs the dedicated check in Task 5.
- Every user-facing string exists in both `es` and `en`. Perk names and descriptions carry their own `{es, en}` in the data layer, so they do NOT go in `src/i18n/dictionary.ts` — only UI chrome does.
- No `Math.random()` in `src/game`. Do not change `SAVE_VERSION` (it is 4).
- Verify with `npm test`, `npm run typecheck`, `npm run lint` before every commit.

---

## Task 1: Rarity, standing, and the two-stage draw

**Files:** `src/data/perks.ts` (type only), `src/game/perks.ts`, `src/game/__tests__/perks.test.ts` (create)

**Interfaces produced:**
```ts
export type PerkRarity = 'basic' | 'silver' | 'gold' | 'legend' | 'top1'
export const PERK_RARITIES: readonly PerkRarity[]   // weakest → strongest
// on Perk:
rarity: PerkRarity
// in src/game/perks.ts:
export function standingFor(lastSeason: Season | null): number       // 0..1
export function rarityOdds(standing: number): Record<PerkRarity, number>
export function drawPerkChoices(player: Player, rng: Rng, lastSeason: Season | null): string[]
```

**Context:** `drawPerkChoices(player, rng)` currently picks 3 by `weight` from everything unowned and age-eligible. It gains a third parameter. Its caller is `src/game/engine.ts:194`; the last season is `state.seasons[state.seasons.length - 1] ?? null`.

- [ ] **Step 1: Write the failing tests** in a new `src/game/__tests__/perks.test.ts`:

- `standingFor(null)` is 0 — a rookie has earned nothing.
- `standingFor` rises monotonically with `rating`, and awards add to it: a season with `rating: 84` plus `mvp` plus `league_champion` scores above one with `rating: 84` alone.
- `rarityOdds(1)` puts more mass on `legend` + `top1` than `rarityOdds(0)` does, and `rarityOdds(0).top1` is 0.
- Every `rarityOdds(s)` sums to 1 for s = 0, 0.25, 0.5, 0.75, 1.
- `drawPerkChoices` returns 3 **distinct** ids, none already owned, across 20 consecutive draws for a player who takes one each time — at both `standing` extremes.
- A player owning every `top1` perk still gets 3 options: exhausted rarities fall **down** a tier, never up. Assert specifically that no `top1` id is returned when all are owned and that the result is still length 3.

- [ ] **Step 2:** Run them; confirm they fail on the missing exports.

- [ ] **Step 3: Implement.** `standingFor` uses the spec's formula:

```ts
standing = clamp(
  (lastSeason.rating - 50) / 40
    + (hasMajorAward ? 0.15 : 0)     // mvp, dpoy, finals_mvp
    + (wonTitle ? 0.15 : 0)          // league_champion or cup_champion
    + (madeAllStar ? 0.05 : 0),
  0, 1,
)
```

`rarityOdds` interpolates linearly between these two endpoints and renormalises so the result sums to exactly 1:

| standing | basic | silver | gold | legend | top1 |
|---|---|---|---|---|---|
| 0 | 0.45 | 0.38 | 0.15 | 0.02 | 0 |
| 1 | 0.05 | 0.20 | 0.40 | 0.27 | 0.08 |

`drawPerkChoices` rolls a rarity per slot with `rng.weighted`, then picks an unowned, age- and position-eligible perk of that rarity using the existing `weight` field as the tie-break. If that rarity has none available, step **down** one tier and retry; if `basic` is also empty, take any eligible perk. Draw without replacement so the three are distinct.

- [ ] **Step 4:** Update the caller at `src/game/engine.ts:194` to pass the last season.
- [ ] **Step 5:** Run the new tests, then the full suite. Commit.

---

## Task 2: Tag the existing 24 and re-derive magnitudes

**Files:** `src/data/perks.ts`

**Context:** the 24 existing perks have no `rarity`, and their `bonus` totals were tuned against the old growth ladder. This task classifies them and rescales them. It adds no new perks.

**The re-derived magnitude table.** Spec §6's growth-point figures were authored against the pre-2a ladder; these are those figures divided by 0.675 and rounded to whole points:

| Rarity | Total growth points across `bonus` | Passive `effects` |
|---|---|---|
| Basic | 3–4 | none, or one weak |
| Silver | 6 | one |
| Gold | 7–9 | two |
| Legend | 10–12 | two, strong |
| Top 1% | 13–15 | one unique, not available at any lower tier |

- [ ] **Step 1:** Add `rarity: PerkRarity` as a **required** field on `Perk` so the compiler names every perk that lacks one.
- [ ] **Step 2:** Assign a rarity to each of the 24 by what it currently does — a perk with one small bonus and no passive is Basic; one with two strong passives is Legend. Do not invent Top 1% entries here; that tier is new content and belongs to Task 3.
- [ ] **Step 3:** Adjust each perk's `bonus` so its total lands in its tier's band. Keep the *shape* — a shooting perk stays a scoring perk — and scale the numbers.
- [ ] **Step 4:** Add a `PERK_BUDGET` table and a test in `src/game/__tests__/perks.test.ts` asserting **every** perk's bonus total falls inside its rarity's band. This is what stops the pool drifting as it grows in Task 3.
- [ ] **Step 5:** Run the full suite. The distribution guard may move — report the numbers. If any metric leaves its band, stop and report rather than adjusting the guard.
- [ ] **Step 6:** Commit.

---

## Task 3: Grow the pool to ~53

**Files:** `src/data/perks.ts`

**Context:** a 20-season career takes 20 perks. With 24 in the pool and age gates thinning it further, the late-career choice degrades to whatever is left. The target spread is roughly **14 Basic, 14 Silver, 12 Gold, 8 Legend, 5 Top 1%**, so no tier empties in a normal career.

- [ ] **Step 1:** Count what Task 2 produced per tier and write down the gap to those targets.
- [ ] **Step 2:** Author the missing perks. For each: `id`, `name` and `description` in **both** Spanish and English, `bonus` totalling its tier's band, `effects` per the table, and `weight`. Add `positions`, `minAge` or `maxAge` only where the perk genuinely belongs to a kind of player or a stage of a career.

**On the writing, which is most of this task.** The existing 24 are the standard to match — read them first. They are concrete and physical, they describe a thing that happens on a court, and they never state their own numbers. "Recibís y soltás sin pensarlo. Un cierre de bloqueo tarde y ya es tarde." Not "Improves shooting by 3." Spanish is not a translation of the English here; both read as though written in that language. Keep that.

The five **Top 1%** perks are the rarest thing in the game and most players will never see one. Each should be a distinct, memorable identity rather than a bigger version of a Gold — the kind of thing that makes a career worth retelling.

- [ ] **Step 3:** Verify no duplicate ids and that the budget test from Task 2 passes for every new perk.
- [ ] **Step 4:** Run the full suite, including the exhaustion test from Task 1 — with the full pool it should pass comfortably. Report the distribution guard's numbers, watching `rpg` in particular.
- [ ] **Step 5:** Commit.

---

## Task 4: Show the rarity

**Files:** `src/components/PreseasonScreen.tsx`, `src/i18n/dictionary.ts`

- [ ] **Step 1:** Give each perk card a rarity label with its own colour — Basic slate, Silver zinc-300, Gold amber-400, Legend violet-400, Top 1% a flame gradient. The tier should be legible before the player reads the name.
- [ ] **Step 2:** Cap the effect chips at three, then `+N`. A Top 1% perk otherwise renders six and the card becomes unreadable at exactly the moment it should feel best.
- [ ] **Step 3:** Rarity names are UI chrome, so they go in `src/i18n/dictionary.ts` in **both** `es` and `en` (`perkRarityBasic` … `perkRarityTop1`).
- [ ] **Step 4:** Run the suite, typecheck and lint. Commit.

---

## Task 5: Verify, including a perk-specific balance check

- [ ] **Step 1:** `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] **Step 2:** `MSYS_NO_PATHCONV=1 STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build`
- [ ] **Step 3:** Confirm `src/game/__fixtures__/career-baseline.json` is untouched: `git log --oneline --all -- src/game/__fixtures__/career-baseline.json` shows exactly one commit.
- [ ] **Step 4: The check the distribution guard cannot do.** Write a test that drives 120 careers taking **only the highest-rarity option offered** and 120 taking **only the lowest**, and asserts the greedy cohort ends with a higher mean peak rating than the timid one — but by less than 25%. This is the real question the rarity system raises: does chasing rarity matter, and does it break the game? Report both means.
- [ ] **Step 5:** Report the distribution guard's per-metric margins, with `rpg` called out explicitly.
