# Career Loop Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tell the player when their club drops them, stop offering an NBA player nothing but European clubs, and name every trophy after the competition that awarded it.

**Architecture:** Three independent changes to `src/game`, each surfaced by one or two components. The trophy work is a *derivation layer* — a new `src/game/trophies.ts` reads a finished `Season` and returns named trophies for display. `AwardId`, the award weight table and `legacy.ts` scoring are untouched, so career scoring and the existing tests keep working.

**Tech Stack:** TypeScript (strict), Next 15 App Router, React 19, Tailwind, vitest. Node 22. No new dependencies.

Spec: `docs/superpowers/specs/2026-07-27-career-loop-features-design.md`

## Global Constraints

- **Do not bump `SAVE_VERSION`.** Wave 1 must load an in-progress career. `save.ts:44` discards any save whose version differs.
- **Do not change the `AwardId` union** (`types.ts:202-223`) or `AWARD_INFO` weights (`awards.ts:139-140`). `legacy.ts` scores off them.
- **Every user-facing string ships in both `es` and `en`.** `src/i18n/dictionary.ts` exports `es` and `en`; a test asserts the key sets match exactly. Content strings that interpolate data (club names, competition names) are built as `Localized` objects in the game layer instead — follow `pendingPlacementNote` at `engine.ts:151-155`.
- **No `Math.random()` anywhere in `src/game`.** Randomness comes from an `Rng` threaded explicitly. Anything derived from a season must be a pure function of that season so a replayed seed reproduces it.
- **Spanish is the source of truth** for the dictionary key set.
- Verify with: `npm test`, `npm run typecheck`, `npm run lint`. All three must pass before each commit.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/game/offers.ts` (modify) | Free agency. Gains an `OfferSlate` return and the tier-1 fix. |
| `src/game/trophies.ts` (create) | Turns a finished `Season` into named `Trophy` values. Display-only; no scoring. |
| `src/game/types.ts` (modify) | `Season.cupId`, `GameState.pendingRenewalNote`. |
| `src/game/engine.ts` (modify) | Wires the slate note into state; records `cupId` on the season. |
| `src/game/create.ts` (modify) | Initialises `pendingRenewalNote`. |
| `src/components/OffersScreen.tsx` (modify) | Renders the renewal note. |
| `src/components/AwardReveal.tsx` (modify) | Renders named championship labels. |
| `src/components/SeasonResultScreen.tsx` (modify) | Passes trophies down. |
| `src/components/RetirementScreen.tsx` (modify) | Cabinet grouped by competition. |
| `src/game/__tests__/offers.test.ts` (modify) | Existing 7 `generateOffers` call sites move to `.offers`. |
| `src/game/__tests__/trophies.test.ts` (create) | Trophy derivation. |

---

## Task 1: An NBA player hears from NBA clubs

**Files:**
- Modify: `src/game/offers.ts:224-233`
- Test: `src/game/__tests__/offers.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no new exports. `candidateLeagues` stays private.

**Context you need:** `candidateLeagues` builds the league pool for a shortlist. Its last filter is `if (league.tier === 1) return false`. That guard exists to stop free agency becoming the reliable route *into* the NBA — without it, draft night stops mattering. But it never asks where the player already is, so it also fires for an NBA player, whose only NBA option is then the separate `nbaSuitor` call.

`nbaSuitor` already returns `null` when `player.currentLeagueId === 'nba'` (`offers.ts:274`), so it needs **no change** — the two paths cannot double up.

- [ ] **Step 1: Write the failing tests**

Add to `src/game/__tests__/offers.test.ts`, at the end of the file:

```ts
describe('free agency inside the NBA', () => {
  /** An NBA-calibre player already on an NBA roster. */
  function nbaPlayer() {
    const p = player()
    p.currentLeagueId = 'nba'
    p.currentTeamId = 'bos'
    p.age = 27
    p.attributes.shooting = 88
    p.attributes.athleticism = 86
    p.attributes.defense = 84
    p.attributes.iq = 84
    p.attributes.handling = 82
    p.attributes.strength = 80
    p.hidden.hype = 80
    return p
  }

  it('offers an NBA player mostly NBA clubs', () => {
    let nba = 0
    let total = 0
    for (let i = 0; i < 60; i++) {
      const offers = generateOffers(
        nbaPlayer(),
        getCountry('US'),
        new Rng(`stay-${i}`),
        season({ leagueId: 'nba', teamId: 'bos', rating: 80 }),
      )
      for (const offer of offers) {
        total++
        if (offer.leagueId === 'nba') nba++
      }
    }
    expect(total).toBeGreaterThan(0)
    // Not "all" — a declining NBA player should still hear from Europe.
    expect(nba / total).toBeGreaterThan(0.6)
  })

  it('still refuses to let free agency be the way into the NBA', () => {
    // A solid third-tier player is exactly who this guard protects the draft from.
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 29
    p.hidden.hype = 20

    for (let i = 0; i < 80; i++) {
      const offers = generateOffers(
        p,
        getCountry('ES'),
        new Rng(`gate-${i}`),
        season({ rating: 62 }),
      )
      expect(offers.every((o) => o.leagueId !== 'nba')).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run the tests to verify the first one fails**

Run: `npx vitest run src/game/__tests__/offers.test.ts -t "free agency inside the NBA"`

Expected: `offers an NBA player mostly NBA clubs` FAILS (the ratio will be near 0, since only `nbaSuitor` can produce an NBA offer and it returns null for an NBA player). `still refuses to let free agency be the way into the NBA` PASSES already — it is a regression guard, and it passing now is the point.

- [ ] **Step 3: Make the tier-1 exclusion conditional**

In `src/game/offers.ts`, inside `candidateLeagues`, replace:

```ts
    // NBA interest is handled on its own terms below, never through the tier
    // pool — left in the pool it becomes an escalator that quietly turns free
    // agency into the main route to the best league in the world.
    if (league.tier === 1) return false
```

with:

```ts
    // The escalator this blocks is the one *into* the NBA: left open, free
    // agency becomes the reliable route to the best league in the world and
    // draft night stops mattering. A player already there is not climbing
    // anything by re-signing, and shutting them out produced the opposite
    // absurdity — an NBA starter whose every option was in Europe.
    if (league.tier === 1 && player.currentLeagueId !== 'nba') return false
```

No other change. `tierForPlayer` already returns 1 for an NBA-calibre player, so `wanted` becomes `{1, 2}`, and the existing distance weighting (`distance === 0 ? 6 : distance === 1 ? 2 : 0.5`) makes NBA clubs the bulk of the slate on its own. As a career declines, `tierForPlayer` drops out of tier 1 and Europe returns with no special case.

- [ ] **Step 4: Run the tests to verify both pass**

Run: `npx vitest run src/game/__tests__/offers.test.ts`

Expected: PASS, including the pre-existing `NBA interest outside the draft` block — those tests cover players *outside* the NBA and must be unaffected.

- [ ] **Step 5: Run the full suite**

Run: `npm test`

Expected: all pass. If `engine.test.ts` career-simulation invariants fail, an NBA career is now retaining players it previously exported — check the failure before assuming the test is wrong.

- [ ] **Step 6: Commit**

```bash
git add src/game/offers.ts src/game/__tests__/offers.test.ts
git commit -m "An NBA player should hear from NBA clubs

candidateLeagues dropped every tier-1 league from the pool unconditionally.
The guard is right — left open, free agency becomes the route into the NBA
and draft night stops mattering — but it never asked where the player already
was, so an NBA starter's whole shortlist came from Europe."
```

---

## Task 2: Free agency reports a declined renewal

**Files:**
- Modify: `src/game/offers.ts:314-392`
- Modify: `src/game/types.ts` (`GameState`)
- Modify: `src/game/engine.ts:95`, `:115-133`
- Modify: `src/game/create.ts:121`
- Test: `src/game/__tests__/offers.test.ts`

**Interfaces:**
- Consumes: `renewalOdds(player, lastSeason)` — already exported from `offers.ts`.
- Produces:
  ```ts
  export interface OfferSlate {
    offers: ContractOffer[]
    renewalDeclined: Localized | null
  }
  export function generateOffers(
    player: Player, country: Country, rng: Rng, lastSeason?: Season | null,
  ): OfferSlate
  ```
  `GameState.pendingRenewalNote: Localized | null`.

**Context you need:** `generateOffers` currently returns `ContractOffer[]`. On a failed renewal roll it just omits the club and says nothing. There are **8 call sites**: `engine.ts:118` and 7 in `offers.test.ts` (lines 86, 101, 147, 156, 166, 182, 197). All 8 change to read `.offers`.

There is also a latent bug to fix here: when the renewal roll fails, the current club is **not** added to `usedTeams`, so the general loop can draw it again and offer it as though it were a new club. Add it to `usedTeams` either way.

- [ ] **Step 1: Write the failing tests**

Add to `src/game/__tests__/offers.test.ts` inside the existing `describe('renewals', ...)` block:

```ts
  it('says so when the club walks away, and stays quiet when it does not', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'

    let declinedSeen = 0
    let renewedSeen = 0
    for (let i = 0; i < 60; i++) {
      const slate = generateOffers(p, getCountry('ES'), new Rng(`note-${i}`), season({ rating: 44 }))
      const renewed = slate.offers.some((o) => o.isCurrentClub)
      // The note and the renewal are exact opposites — never both, never neither.
      expect(Boolean(slate.renewalDeclined)).toBe(!renewed)
      renewed ? renewedSeen++ : declinedSeen++
    }
    expect(declinedSeen).toBeGreaterThan(0)
    expect(renewedSeen).toBeGreaterThan(0)
  })

  it('names the club and the reason, identically for the same season', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'
    p.age = 36

    const hurt = season({ rating: 40, gamesPlayed: 4, gamesMissed: 30 })
    const first = generateOffers(p, getCountry('ES'), new Rng('reason-a'), hurt).renewalDeclined
    const again = generateOffers(p, getCountry('ES'), new Rng('reason-b'), hurt).renewalDeclined

    expect(first).not.toBeNull()
    // Availability outranks age: this player missed most of the year.
    expect(first!.es).toContain('Baskonia')
    expect(first!.es).toContain('físic')
    expect(first!.en).toContain('Baskonia')
    // Pure function of the season, so a replayed seed narrates the same way.
    expect(again).toEqual(first)
  })

  it('never reports a declined renewal for a player who had no club', () => {
    const p = player()
    // Straight out of the youth system: there is nothing to decline.
    p.currentLeagueId = 'youth'
    const slate = generateOffers(p, getCountry('ES'), new Rng('youth'), null)
    expect(slate.renewalDeclined).toBeNull()
  })

  it('does not re-offer the club that just dropped you as though it were new', () => {
    const p = player()
    p.currentLeagueId = 'acb'
    p.currentTeamId = 'acb_bas'

    for (let i = 0; i < 80; i++) {
      const slate = generateOffers(p, getCountry('ES'), new Rng(`dup-${i}`), season({ rating: 44 }))
      if (!slate.renewalDeclined) continue
      expect(slate.offers.every((o) => o.teamId !== 'acb_bas')).toBe(true)
    }
  })
```

Then update the **7 existing** `generateOffers(...)` call sites in this file to read `.offers`. For example line 86 becomes:

```ts
      const offers = generateOffers(p, getCountry('ES'), new Rng(`renew-${i}`), season()).offers
```

Apply the same `.offers` suffix at lines 101, 147, 156, 166, 182 and 197.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/game/__tests__/offers.test.ts`

Expected: FAIL — `Property 'offers' does not exist on type 'ContractOffer[]'` at every updated site, and the four new tests fail on `slate.renewalDeclined` being undefined.

- [ ] **Step 3: Return a slate from `generateOffers`**

In `src/game/offers.ts`, add the `Localized` import to the existing type import block:

```ts
import type {
  ContractOffer,
  Country,
  League,
  Localized,
  Player,
  PlayerRole,
  Season,
  Team,
} from './types'
```

Add above `generateOffers`:

```ts
/**
 * Why a club let a player go, in its own words.
 *
 * `renewalOdds` already computes the three terms that sink the odds, so the
 * message can say which one did it rather than being generically sad. Checked
 * in order of what the player would most obviously recognise, and a pure
 * function of the season just played — no RNG, so a replayed seed narrates it
 * identically.
 */
function declineNote(player: Player, team: Team, lastSeason: Season | null): Localized {
  if (lastSeason && lastSeason.gamesMissed > lastSeason.gamesPlayed) {
    return {
      es: `${team.name.es} no te renueva. No quieren arriesgar otra temporada con tu historial físico.`,
      en: `${team.name.en} are letting you go. They will not risk another year on your injury record.`,
    }
  }
  if (player.age > 33) {
    return {
      es: `${team.name.es} no te renueva. El club decidió rejuvenecer el plantel.`,
      en: `${team.name.en} are letting you go. The club is getting younger.`,
    }
  }
  if (lastSeason && lastSeason.rating < 52) {
    return {
      es: `${team.name.es} no te renueva. El cuerpo técnico quiere otro perfil para el puesto.`,
      en: `${team.name.en} are letting you go. The coaching staff wants a different profile.`,
    }
  }
  return {
    es: `${team.name.es} no te renueva. No hubo oferta y no te dieron motivos.`,
    en: `${team.name.en} are letting you go. No offer came, and no reason with it.`,
  }
}

/** The shortlist, plus what the player's own club decided. */
export interface OfferSlate {
  offers: ContractOffer[]
  /** Set only when there was a club to keep the player and it chose not to. */
  renewalDeclined: Localized | null
}
```

Change the signature and the renewal block. Replace:

```ts
export function generateOffers(
  player: Player,
  country: Country,
  rng: Rng,
  /** Last season, which is what the club is actually deciding on. */
  lastSeason: Season | null = null,
): ContractOffer[] {
```

with:

```ts
export function generateOffers(
  player: Player,
  country: Country,
  rng: Rng,
  /** Last season, which is what the club is actually deciding on. */
  lastSeason: Season | null = null,
): OfferSlate {
```

Replace the renewal block:

```ts
  // A renewal, when the club still rates you — which, after a good season, is
  // very nearly always.
  if (rng.chance(renewalOdds(player, lastSeason))) {
    const team = getTeam(currentTeamId)
    offers.push(makeOffer(team, { isCurrentClub: true }))
    usedTeams.add(team.id)
  }
```

with:

```ts
  // A renewal, when the club still rates you — which, after a good season, is
  // very nearly always.
  let renewalDeclined: Localized | null = null
  // Out of the youth system there is no club to renew with, and nothing to
  // report: that path goes through `generateFirstOffers`.
  if (player.currentLeagueId !== 'youth') {
    const team = getTeam(currentTeamId)
    if (rng.chance(renewalOdds(player, lastSeason))) {
      offers.push(makeOffer(team, { isCurrentClub: true }))
    } else {
      renewalDeclined = declineNote(player, team, lastSeason)
    }
    // Reserved either way. Left out on a decline, the club could be drawn again
    // by the general loop and offered back as though it were a stranger.
    usedTeams.add(team.id)
  }
```

Finally change the two `return` statements. Replace `if (leagues.length === 0) return offers` with:

```ts
  if (leagues.length === 0) return { offers, renewalDeclined }
```

and replace the closing sort-and-return:

```ts
  // Best first — but "best" is deliberately ambiguous, which is the point.
  return offers.sort((a, b) => {
    const tierDiff = getLeague(a.leagueId).tier - getLeague(b.leagueId).tier
    return tierDiff !== 0 ? tierDiff : b.salary - a.salary
  })
}
```

with:

```ts
  // Best first — but "best" is deliberately ambiguous, which is the point.
  offers.sort((a, b) => {
    const tierDiff = getLeague(a.leagueId).tier - getLeague(b.leagueId).tier
    return tierDiff !== 0 ? tierDiff : b.salary - a.salary
  })
  return { offers, renewalDeclined }
}
```

- [ ] **Step 4: Run the offers tests**

Run: `npx vitest run src/game/__tests__/offers.test.ts`

Expected: PASS. If `names the club and the reason` fails on `'físic'`, check that the fixture club `acb_bas` is Baskonia in `src/data/teams.ts` and adjust the expected substring to the club's actual Spanish name.

- [ ] **Step 5: Add the state field**

In `src/game/types.ts`, directly after `pendingPlacementNote` in `GameState`:

```ts
  /**
   * Set when the player's club chose not to re-sign them, so free agency can
   * say so instead of presenting a list with a silent hole in it.
   */
  pendingRenewalNote: Localized | null
```

In `src/game/create.ts`, beside `pendingPlacementNote: null` (line 121):

```ts
    pendingRenewalNote: null,
```

- [ ] **Step 6: Wire it through the engine**

In `src/game/engine.ts`, add to the reset block after line 95:

```ts
  next.pendingRenewalNote = null
```

Replace the offers block at lines 115-133:

```ts
  const slate =
    player.currentLeagueId === 'youth'
      ? { offers: generateFirstOffers(player, country, yearRng(next, 'first-offers')), renewalDeclined: null }
      : generateOffers(
          player,
          country,
          yearRng(next, 'offers'),
          // What the club is actually deciding on: the year you just played.
          next.seasons[next.seasons.length - 1] ?? null,
        )

  next.pendingRenewalNote = slate.renewalDeclined

  if (slate.offers.length === 0) {
    // Nobody called. Stay put rather than stall the career.
    return openPreseason(next)
  }

  next.pendingOffers = slate.offers
  next.phase = 'offers'
  return next
}
```

Note the note is assigned **before** the empty-shortlist check, so a player nobody called still learns their club dropped them.

- [ ] **Step 7: Verify the whole suite and the types**

Run: `npm test && npm run typecheck && npm run lint`

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/game/offers.ts src/game/types.ts src/game/create.ts src/game/engine.ts src/game/__tests__/offers.test.ts
git commit -m "Say so when a club will not re-sign you

generateOffers rolled the renewal, omitted the club on a failure and told
nobody. The most consequential thing that happens at contract time was a hole
in a list. It now returns a slate carrying the reason — availability, age or
form, whichever actually sank the odds.

Also reserves the club on a decline. Left unreserved it could be drawn again
by the general loop and offered back as though it were a stranger."
```

---

## Task 3: The renewal note on screen

**Files:**
- Modify: `src/components/OffersScreen.tsx`

No prop plumbing: `OffersScreen` already receives the whole `state`, so `Game.tsx` does not change.

**Interfaces:**
- Consumes: `GameState.pendingRenewalNote` from Task 2.
- Produces: no new exports.

**Context you need:** `OffersScreen` already receives the whole `state` (`{ state, onAccept }`), so no prop plumbing is needed. The note is content, already localized, so it needs no dictionary key — render it with `L()`.

- [ ] **Step 1: Render the note**

In `src/components/OffersScreen.tsx`, directly after the closing `</div>` of the existing header panel and before `<div className="space-y-2">`:

```tsx
      {state.pendingRenewalNote && (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/5 px-4 py-3">
          <p className="text-sm leading-snug text-rose-200">{L(state.pendingRenewalNote)}</p>
        </div>
      )}
```

This is deliberately a panel rather than a chip: it is the frame for the whole screen and the reason the list looks the way it does, not one attribute of it.

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run typecheck && npm run lint`

Expected: PASS. If `L` is reported unused-before-defined, confirm the component already destructures `const { t, L, locale } = useT()` — it does at line 16.

- [ ] **Step 3: See it in the real app**

Run: `npm run dev`, create a career, and play until a club drops you. Faster: temporarily force it by changing `renewalOdds` to `return 0` at the top of its body, reload, advance one season, confirm the panel appears above the offers and names your club — then **revert that edit**.

Expected: a rose-bordered panel above the offer list naming your club and a reason.

- [ ] **Step 4: Commit**

```bash
git add src/components/OffersScreen.tsx
git commit -m "Show the declined renewal above the offers"
```

---

## Task 4: A season remembers which cup it contested

**Files:**
- Modify: `src/game/types.ts` (`Season`)
- Modify: `src/game/engine.ts` (`finalizeSeason`, ~line 543)
- Test: `src/game/__tests__/trophies.test.ts` (created in Task 5; this task is verified through the existing engine suite)

**Interfaces:**
- Produces: `Season.cupId?: string | null` and `Season.cupWon?: boolean | null`.

**Context you need:** `state.cupRun` is nulled at the start of the next season (`engine.ts:90`), so which cup was played cannot be recovered later. `finalizeSeason` is the only place it is still available alongside the season being closed.

The field is **optional** on purpose. Wave 1 does not bump `SAVE_VERSION`, so a career saved before this ships loads with `cupId` absent on every past season. Absent means "no cup contested".

- [ ] **Step 1: Add the field**

In `src/game/types.ts`, in the `Season` interface directly after `playoffResult: PlayoffResult`:

```ts
  /**
   * The cup contested this season, so the trophy can be named after the fact —
   * `state.cupRun` is cleared before the next season and cannot be read later.
   *
   * Optional: seasons recorded before this field existed do not carry it, and
   * Wave 1 deliberately does not bump `SAVE_VERSION` to force them out.
   */
  cupId?: string | null
  /**
   * How the cup final went: `true` won, `false` reached it and lost, `null`
   * never got there. A loss is recorded nowhere else — the winner gets an
   * award id, the runner-up got nothing at all.
   */
  cupWon?: boolean | null
```

- [ ] **Step 2: Record it**

In `src/game/engine.ts`, in `finalizeSeason`, replace:

```ts
  // The cup is a trophy in its own right, not a footnote of the league season.
  if (state.cupRun?.won) season.awards.unshift('cup_champion')
```

with:

```ts
  // The cup is a trophy in its own right, not a footnote of the league season.
  if (state.cupRun?.won) season.awards.unshift('cup_champion')
  // Which cup and how it ended, so the trophy can be named once `cupRun` is
  // gone. `won === false` is the only record a losing finalist ever gets.
  season.cupId = state.cupRun?.cupId ?? null
  season.cupWon = state.cupRun?.won ?? null
```

- [ ] **Step 3: Verify nothing regressed**

Run: `npm test && npm run typecheck`

Expected: PASS. `engine.test.ts` drives whole careers, so a crash here would surface immediately.

- [ ] **Step 4: Commit**

```bash
git add src/game/types.ts src/game/engine.ts
git commit -m "Record which cup a season contested, and how it ended

state.cupRun is cleared before the next season starts, so the trophy could not
be named after the fact. Losing a cup final was recorded nowhere at all —
winning pushes an award id and losing pushes nothing.

Optional fields: an in-progress save keeps loading and simply shows no cup name
on seasons already played."
```

---

## Task 5: `trophiesFor` — naming what was won

**Files:**
- Create: `src/game/trophies.ts`
- Test: `src/game/__tests__/trophies.test.ts`

**Interfaces:**
- Consumes: `Season.cupId` (Task 4); `getLeague` from `@/data/leagues`; `getCup` from `@/data/cups`.
- Produces:
  ```ts
  export type TrophyResult = 'champion' | 'finalist'
  export interface Trophy {
    kind: 'league' | 'cup'
    competitionId: string
    name: Localized       // "NBA", "Copa del Rey"
    result: TrophyResult
  }
  export function trophiesFor(season: Season): Trophy[]
  export function trophyLabel(trophy: Trophy): Localized
  ```

**Context you need:** `getCup(id)` throws on an unknown id (`cups.ts:158`), so guard before calling it — a save from a build where a cup was renamed must not crash the retirement screen.

A cup **final loss** has no award id: winning pushes `cup_champion`, losing pushes nothing. Task 4's `season.cupWon` is what makes it recoverable — `false` means "reached the final and lost", `null` means "never got there". Do not try to derive a loss from the absence of `cup_champion`; that is also true of every season that went out in the quarter-finals.

- [ ] **Step 1: Write the module's test first**

Create `src/game/__tests__/trophies.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { trophiesFor, trophyLabel } from '../trophies'
import type { Season } from '../types'

function season(over: Partial<Season> = {}): Season {
  return {
    year: 2035, age: 26, stage: 'prime', teamId: 'bos', leagueId: 'nba', role: 'star',
    gamesPlayed: 82, gamesMissed: 0, minutesPerGame: 34, points: 24, rebounds: 6,
    assists: 5, steals: 1.2, blocks: 0.6, turnovers: 2.4, fgPct: 0.5, threePct: 0.38,
    ftPct: 0.85, tsPct: 0.61, rating: 80, teamWins: 58, teamLosses: 24,
    playoffResult: 'none', awards: [], salary: 1, injuries: [], headlines: [],
    ...over,
  }
}

describe('trophiesFor', () => {
  it('names a league title after the league', () => {
    const [trophy] = trophiesFor(season({ playoffResult: 'champion' }))
    expect(trophy.kind).toBe('league')
    expect(trophy.result).toBe('champion')
    expect(trophyLabel(trophy).en).toBe('NBA Champion')
    expect(trophyLabel(trophy).es).toBe('Campeón NBA')
  })

  it('records a finals loss, which nothing did before', () => {
    const [trophy] = trophiesFor(season({ playoffResult: 'finals' }))
    expect(trophy.result).toBe('finalist')
    expect(trophyLabel(trophy).en).toBe('NBA finalist')
  })

  it('names a cup after the cup, not after "cup"', () => {
    const trophies = trophiesFor(
      season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: true, awards: ['cup_champion'] }),
    )
    const cup = trophies.find((tr) => tr.kind === 'cup')!
    expect(cup.competitionId).toBe('copa_rey')
    expect(trophyLabel(cup).en).toBe('Copa del Rey')
  })

  it('records a lost cup final, which has no award id at all', () => {
    const trophies = trophiesFor(season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: false }))
    const cup = trophies.find((tr) => tr.kind === 'cup')!
    expect(cup.result).toBe('finalist')
    expect(trophyLabel(cup).en).toBe('Copa del Rey final')
  })

  it('gives nothing to a cup run that never reached the final', () => {
    // cupWon null means they went out earlier — not a finalist.
    expect(trophiesFor(season({ leagueId: 'acb', cupId: 'copa_rey', cupWon: null }))).toEqual([])
  })

  it('gives a season that won nothing no trophies', () => {
    expect(trophiesFor(season({ playoffResult: 'semifinals' }))).toEqual([])
  })

  it('survives a season saved before cupId existed', () => {
    const old = season({ playoffResult: 'champion', awards: ['cup_champion'] })
    delete (old as { cupId?: unknown }).cupId
    delete (old as { cupWon?: unknown }).cupWon
    // The league title still lands; the unnameable cup is simply dropped.
    expect(trophiesFor(old)).toHaveLength(1)
  })

  it('does not crash on a cup id the data no longer knows', () => {
    const trophies = trophiesFor(
      season({ cupId: 'copa_that_was_removed', cupWon: true, awards: ['cup_champion'] }),
    )
    expect(trophies).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/game/__tests__/trophies.test.ts`

Expected: FAIL — `Cannot find module '../trophies'`.

- [ ] **Step 3: Write the module**

Create `src/game/trophies.ts`:

```ts
/**
 * What a season actually won, named after the competition that awarded it.
 *
 * Winning the NBA and winning LEB Oro both push the award id `league_champion`,
 * which the award table renders as a flat "Champion" — so the biggest night of
 * a career reads the same as a second-division title. This turns a finished
 * season into named trophies for display.
 *
 * Display only, deliberately. `AwardId` and the award weights stay exactly as
 * they are, so `legacy.ts` scoring and every test keyed to those ids are
 * untouched. A trophy is a label, not a score.
 *
 * Losing finals appear here and nowhere else. A league runner-up was already
 * in `playoffResult`; a cup runner-up had no record at all until `Season.cupWon`,
 * because winning pushes an award id and losing pushes nothing.
 */

import type { Localized, Season } from './types'
import { getLeague } from '@/data/leagues'
import { CUPS } from '@/data/cups'

export type TrophyResult = 'champion' | 'finalist'

export interface Trophy {
  kind: 'league' | 'cup'
  /** League id or cup id. */
  competitionId: string
  /** The competition's own name — "NBA", "Copa del Rey". */
  name: Localized
  result: TrophyResult
}

const CUP_INDEX = new Map(CUPS.map((cup) => [cup.id, cup]))

/** Every trophy this season produced, won or lost. Empty for most seasons. */
export function trophiesFor(season: Season): Trophy[] {
  const trophies: Trophy[] = []

  if (season.playoffResult === 'champion' || season.playoffResult === 'finals') {
    const league = getLeague(season.leagueId)
    trophies.push({
      kind: 'league',
      competitionId: league.id,
      name: league.name,
      result: season.playoffResult === 'champion' ? 'champion' : 'finalist',
    })
  }

  // `getCup` throws on an unknown id, and a season stored by an older build may
  // name a cup this one no longer has. An unnameable trophy is dropped rather
  // than taking the retirement screen down with it.
  const cup = season.cupId ? CUP_INDEX.get(season.cupId) : undefined
  // `cupWon` is null for a run that never reached the final, which is not a
  // runner-up — most cup runs end that way and none of them are trophies.
  if (cup && (season.cupWon === true || season.cupWon === false)) {
    trophies.push({
      kind: 'cup',
      competitionId: cup.id,
      name: cup.name,
      result: season.cupWon ? 'champion' : 'finalist',
    })
  }

  return trophies
}

/**
 * How a trophy is written on a chip.
 *
 * A cup is already a proper noun — "Copa del Rey" needs no decoration. A league
 * is not: "NBA" is a competition, "Campeón NBA" is a thing you won.
 */
export function trophyLabel(trophy: Trophy): Localized {
  if (trophy.kind === 'cup') {
    return trophy.result === 'champion'
      ? trophy.name
      : { es: `Final ${trophy.name.es}`, en: `${trophy.name.en} final` }
  }
  return trophy.result === 'champion'
    ? { es: `Campeón ${trophy.name.es}`, en: `${trophy.name.en} Champion` }
    : { es: `Finalista ${trophy.name.es}`, en: `${trophy.name.en} finalist` }
}

/** The emoji a trophy wears, so a title never looks like a runner-up. */
export function trophyIcon(trophy: Trophy): string {
  if (trophy.result === 'finalist') return trophy.kind === 'cup' ? '🥈' : '🏅'
  return '🏆'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/game/__tests__/trophies.test.ts`

Expected: PASS, all six.

If `names a league title after the league` fails on the label, check `LEAGUES` in `src/data/leagues.ts` — the NBA's `name.en` is `'NBA'` and `name.es` is `'NBA'`, so the expected strings hold. For `Copa del Rey`, `CUPS` gives `name.en === 'Copa del Rey'`.

- [ ] **Step 5: Commit**

```bash
git add src/game/trophies.ts src/game/__tests__/trophies.test.ts
git commit -m "Derive named trophies from a finished season

Winning the NBA and winning LEB Oro both rendered as 'Champion'. This names
each title after the competition that awarded it, and records finals losses,
which nothing did before.

Display only: AwardId and the award weights are untouched, so legacy scoring
and its tests do not move."
```

---

## Task 6: Named trophies on screen

**Files:**
- Modify: `src/components/AwardReveal.tsx`
- Modify: `src/components/SeasonResultScreen.tsx`
- Modify: `src/components/RetirementScreen.tsx`
- Modify: `src/i18n/dictionary.ts`

**Interfaces:**
- Consumes: `trophiesFor`, `trophyLabel`, `trophyIcon`, `Trophy` from Task 5.
- Produces: no new exports.

**Context you need:** `AwardReveal` currently takes `{ awards, cupId }` and renders `AWARD_INFO[headline]`. `RetirementScreen` shows flat `rings` / `cups` counters (lines 137-138) built by `computeTotals`. Both `es` and `en` need any new dictionary key or the key-parity test fails.

- [ ] **Step 1: Add the cabinet heading to both dictionaries**

In `src/i18n/dictionary.ts`, add to `es` next to `rings: 'Títulos'`:

```ts
  trophyCabinet: 'Vitrina',
```

and to `en` next to `rings: 'Titles'`:

```ts
  trophyCabinet: 'Trophy cabinet',
```

- [ ] **Step 2: Name the championship in `AwardReveal`**

In `src/components/AwardReveal.tsx`, replace the `cupId` prop with a trophy. Change the import line added in the logo work:

```tsx
import { cupLogoPathFor } from '@/data/logos'
import { CupCrest } from './CompetitionCrest'
import { trophyLabel, type Trophy } from '@/game/trophies'
```

Change the signature:

```tsx
export function AwardReveal({
  awards,
  /** Trophies this season produced, so a title is named after its competition. */
  trophies = [],
}: {
  awards: AwardId[]
  trophies?: Trophy[]
}) {
```

Replace the `badge` line and the headline label. After `const major = info.weight >= 45`:

```tsx
  // A championship is named after what it won; every other award already is.
  const titled =
    headline === 'league_champion' || headline === 'cup_champion'
      ? trophies.find((tr) => tr.result === 'champion' &&
          (headline === 'cup_champion' ? tr.kind === 'cup' : tr.kind === 'league'))
      : undefined
  const heading = titled ? trophyLabel(titled)[locale] : info[locale]

  const cupTrophy = trophies.find((tr) => tr.kind === 'cup' && tr.result === 'champion')
  const badge =
    headline === 'cup_champion' && cupTrophy && cupLogoPathFor(cupTrophy.competitionId)
      ? cupTrophy.competitionId
      : null
```

Then replace the heading render `{info[locale]}` (line 58) with `{heading}`.

- [ ] **Step 3: Pass trophies from the season screen**

In `src/components/SeasonResultScreen.tsx`, add the import:

```tsx
import { trophiesFor } from '@/game/trophies'
```

and replace the `AwardReveal` call:

```tsx
      <AwardReveal awards={season.awards} trophies={trophiesFor(season)} />
```

`season` is already in scope at line 18. This also removes the `state.cupRun` read, which was the only thing keeping that coupling.

- [ ] **Step 4: Group the cabinet by competition**

In `src/components/RetirementScreen.tsx`, add:

```tsx
import { trophiesFor, trophyIcon, trophyLabel, type Trophy } from '@/game/trophies'
```

Add above the component's `return`, next to the existing `awardCounts` memo:

```tsx
  // Every trophy of the career, grouped by competition so "NBA ×2" reads as a
  // career rather than as two unrelated rings.
  const cabinet = useMemo(() => {
    const groups = new Map<string, { trophy: Trophy; titles: number; finals: number }>()
    for (const s of state.seasons) {
      for (const trophy of trophiesFor(s)) {
        const key = `${trophy.kind}:${trophy.competitionId}`
        const entry = groups.get(key) ?? { trophy, titles: 0, finals: 0 }
        if (trophy.result === 'champion') entry.titles++
        else entry.finals++
        groups.set(key, entry)
      }
    }
    return [...groups.values()].sort((a, b) => b.titles - a.titles || b.finals - a.finals)
  }, [state.seasons])
```

Then insert the cabinet block directly before the existing `{awardCounts.length > 0 && (` block:

```tsx
        {cabinet.length > 0 && (
          <div className="mt-4">
            <span className="label">{t('trophyCabinet')}</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {cabinet.map(({ trophy, titles, finals }) => (
                <span
                  key={`${trophy.kind}:${trophy.competitionId}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300"
                >
                  {trophyIcon({ ...trophy, result: titles > 0 ? 'champion' : 'finalist' })}{' '}
                  {trophyLabel({ ...trophy, result: titles > 0 ? 'champion' : 'finalist' })[locale]}
                  {titles > 1 && <span className="tnum font-bold text-flame-400"> ×{titles}</span>}
                  {finals > 0 && (
                    <span className="tnum text-slate-500"> · {finals} 🥈</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
```

Leave the `rings` / `cups` counters at lines 137-138 alone — they are the at-a-glance numbers and the cabinet is the detail below them.

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck && npm run lint`

Expected: all pass, including the dictionary key-parity test — that is what catches a `trophyCabinet` added to only one language.

- [ ] **Step 6: See it in the real app**

Run: `npm run dev`, play a career to retirement (or load one), and confirm the cabinet lists named competitions and the award reveal says "Campeón NBA" rather than "Campeón".

Faster path: in `src/game/stats.ts`, temporarily force `rollFinal` to return `'champion'`, play two seasons, check the reveal, then **revert**.

- [ ] **Step 7: Commit**

```bash
git add src/components/AwardReveal.tsx src/components/SeasonResultScreen.tsx src/components/RetirementScreen.tsx src/i18n/dictionary.ts
git commit -m "Name every trophy after the competition that awarded it

The award reveal said 'Campeón' whether you had just won the NBA or LEB Oro,
and the retirement screen counted rings without saying whose. The cabinet now
groups by competition, and finals appear at all."
```

---

## Task 7: Verify the wave end to end

**Files:** none modified.

- [ ] **Step 1: Full check**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

Expected: 61+ tests pass, no type or lint errors, build succeeds.

- [ ] **Step 2: Confirm an in-progress save still loads**

This is the constraint the whole wave was shaped around. Before pulling these changes, open the app, start a career and play three seasons so a save exists in `localStorage`. After the changes, reload.

Expected: the career resumes. Past seasons show no cup name (they were stored without `cupId`); the next completed season does.

If the save is discarded, someone bumped `SAVE_VERSION` — check `src/game/create.ts`. That is a Wave 2 change, not this one.

- [ ] **Step 3: Reproduce the Pages build**

```bash
STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build
```

Expected: succeeds. This is what CI runs on `main`.

- [ ] **Step 4: Commit any fixes and stop**

Wave 1 is done. Do **not** start the attribute merge — Wave 2 gets its own plan, written after this wave has been reviewed in a real career, because the ~53-perk pool has to be written against attribute names that do not exist yet.

---

## Wave 2 — not planned here

Wave 2 (attributes 7→5, perk rarity tiers, season-card and preseason trim) bumps `SAVE_VERSION` and ends in-progress careers. It gets its own plan once Wave 1 is reviewed, for a concrete reason: §6 requires ~29 new perks whose `bonus` keys are the *new* five attributes, so planning it before the merge lands would mean writing them twice.
