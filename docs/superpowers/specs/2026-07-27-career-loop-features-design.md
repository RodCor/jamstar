# Career loop: trophies, offers, perks and a quieter UI

Design for seven changes to Hoop Glory, agreed 2026-07-27.

Three of them are corrections — the game already models the thing and fails to
say so. Three are genuine additions. One is a display change that turned into a
model change.

They ship in **two waves**. Wave 1 keeps existing careers alive — it adds one
optional field to a persisted type and nothing more — so it can go out on its
own and be judged in a real career. Wave 2 bumps `SAVE_VERSION` and ends every
in-progress career, so it lands as one piece.

---

## Wave 1 — corrections

### 1. Say so when a club will not re-sign you

**Now.** `generateOffers` rolls `renewalOdds(player, lastSeason)` and, on a
failure, simply does not add the current club to the shortlist
(`src/game/offers.ts:352`). The player sees a list without their own club on it
and is told nothing. The most consequential thing that can happen at contract
time is invisible.

**Change.** Add `pendingRenewalNote: Localized | null` to `GameState`,
alongside the existing `pendingPlacementNote` (`types.ts:412`) and following the
same lifecycle: cleared at the top of the season advance (`engine.ts:95`), set
when offers are generated, read by `OffersScreen`.

`generateOffers` returns the note with the offers rather than setting state
itself, so it stays a pure function:

```ts
export interface OfferSlate {
  offers: ContractOffer[]
  /** Set when the club had a player to keep and chose not to. */
  renewalDeclined: Localized | null
}
```

`renewalDeclined` is null when there was no club to renew with — the youth
league, and the first professional contract, both of which go through
`generateFirstOffers`.

**The message names a reason.** `renewalOdds` already computes the three terms
that sink the odds, so the message can say which one did it rather than being
generically sad. Reasons are checked in this order and the first match wins:

| Condition | Reason shown |
|---|---|
| `lastSeason.gamesMissed > lastSeason.gamesPlayed` | the club will not carry the injury risk |
| `player.age > 33` | the club is getting younger |
| `lastSeason.rating < 52` | the coaching staff wants a different profile |
| otherwise | plain "will not renew", no reason |

Wording is a single localized string per reason, with the club name
interpolated. No RNG: the reason is a pure function of the season just played,
so a replayed seed produces the same message.

```
Gimnasia de Comodoro no te renovará.
El cuerpo técnico quiere otro perfil para el puesto.
```

**Display.** A panel above the offer list on `OffersScreen`, in the same "bad
news" register as an injury chip (`border-rose-400/25 text-rose-300`). It is not
a chip and not a headline — it is the frame for the whole screen, and the reason
the list looks the way it does.

### 2. An NBA player should mostly hear from NBA clubs

**Now.** `candidateLeagues` (`src/game/offers.ts:207-234`) ends with:

```ts
if (league.tier === 1) return false
```

The comment above it is correct about why it exists: left in the pool, free
agency became the reliable route into the NBA and draft night stopped mattering.
But the guard does not ask where the player currently is, so it also fires for
someone already in the NBA. Such a player gets at most one NBA option — the
separate `nbaSuitor` call at `offers.ts:359` — and the rest of the shortlist is
filled from EuroLeague and the domestic tier-3 leagues.

**Change.** Make the exclusion conditional on not already being there:

```ts
// The escalator this blocks is the one *into* the NBA. A player already in it
// is not climbing anything by re-signing, and shutting them out produced the
// opposite absurdity: an NBA starter whose options were all in Europe.
if (league.tier === 1 && player.currentLeagueId !== 'nba') return false
```

and skip the `nbaSuitor` step when `player.currentLeagueId === 'nba'`, since the
pool now covers it and the two paths would otherwise double up.

**No new tuning.** `tierForPlayer` returns 1 for an NBA-calibre player, so
`wanted` becomes `{1, 2}` and the existing distance weighting
(`distance === 0 ? 6 : distance === 1 ? 2 : 0.5`) already makes NBA clubs the
bulk of the slate with the occasional European offer. As a career declines,
`tierForPlayer` drops out of tier 1 on its own and Europe returns without a
special case. This is the behaviour we want and it falls out of code that is
already there.

### 3 & 4. Named trophies

**Now.** Winning the NBA and winning LEB Oro both push the award id
`league_champion`, rendered from a static table as `Campeón / Champion`
(`awards.ts:139`). Cups collapse the same way into `cup_champion`,
`Campeón de Copa / Cup Champion` — even though `CUPS` carries real names and
`cupHeadline` already uses them. Losing a final records nothing at all.

**Change: a derivation layer, not a schema change.** `AwardId` stays exactly as
it is. Legacy scoring (`legacy.ts:36-37, 83-86`), the award weight table and the
existing tests all key off those ids and none of them need to move. A new module
turns a finished season into the trophies it produced, for display only.

```ts
// src/game/trophies.ts
export type TrophyResult = 'champion' | 'finalist'

export interface Trophy {
  competition: CompetitionKind      // 'league' | 'cup' | 'world_cup' | ...
  competitionId: string             // league id or cup id
  name: Localized                   // "NBA", "Copa del Rey"
  result: TrophyResult
}

/** Every trophy a season produced, won or lost. */
export function trophiesFor(season: Season): Trophy[]
```

`Season` gains one field to make this derivable:

```ts
/**
 * The cup contested this season, so the trophy can be named after the fact.
 * Optional: seasons recorded before this field existed do not have it.
 */
cupId?: string | null
/**
 * How the cup final went: true won, false reached it and lost, null never got
 * there. Winning already pushes an award id; losing pushes nothing, so without
 * this a beaten finalist has no record anywhere.
 */
cupWon?: boolean | null
```

It is set in `finalizeSeason` from `state.cupRun`, which is nulled at the start
of the next season and so cannot be read later. `leagueId` is already on
`Season`, so league trophies need nothing new.

**This is an additive change to a persisted type, so it must not break a save
mid-career.** `save.ts:44` rejects a save only on a version mismatch, and Wave 1
does not bump the version — so a career saved before this ships will load with
`cupId` absent on every past season. `trophiesFor` treats absent as "no cup
contested" and returns only the league trophy. The player loses cup names on
seasons already played and gets them from here on, which is the right trade
against ending their career for a label.

Derivation:

| Season state | Trophy |
|---|---|
| `playoffResult === 'champion'` | league, `champion` |
| `playoffResult === 'finals'` | league, `finalist` |
| `cupId` set and `cupWon === true` | cup, `champion` |
| `cupId` set and `cupWon === false` | cup, `finalist` |
| `cupWon === null` (went out before the final) | none — most cup runs end this way |

**Where the names surface.**

- **Award chips and `AwardReveal`.** Both currently read the static
  `AWARD_INFO[id]` label. They take a `trophies` prop and render the named
  version for the two championship ids, falling back to the static label for
  everything else (MVP, DPOY and the rest are already named correctly).
- **Retirement cabinet.** A new block grouping trophies by competition, ordered
  by how many were won. It sits *below* the existing `titles / cups` counter
  strip rather than replacing it — the strip is the at-a-glance summary, and
  removing it would take "seasons played" with it, since they share a row.
- **Share card and headlines.** The league final stake at `engine.ts:374`
  already interpolates `league.name`; the cup stake at `engine.ts:353` already
  interpolates `cup.name`. Both are correct and stay. `finalHeadline` and
  `cupHeadline` likewise. The gap was only ever in the award labels and the
  cabinet.

```
🏆 Campeón NBA          🏆 Copa del Rey
🏅 Finalista NBA        🥈 Final Copa del Rey

NBA           ×2 títulos, ×1 final
Liga ACB      ×1 título
Copa del Rey  ×3
```

Finalist trophies are display-only and carry no legacy points. A finals loss
already costs the player the title; giving it a score would double-count.

---

## Wave 2 — the model change

Everything below lands together and bumps `SAVE_VERSION`.

### 5. Five attributes instead of seven

**Now.** `ATTRIBUTE_KEYS` (`types.ts:26`) is
`shooting, handling, athleticism, defense, strength, iq, leadership`, drawn as
seven progress bars on the preseason screen.

**Change.** Five, named for what they do rather than for a body part:

| New | Absorbs |
|---|---|
| `scoring` | shooting |
| `playmaking` | handling, the passing half of iq |
| `defense` | defense |
| `physical` | athleticism, strength |
| `mental` | iq, leadership |

**Conversion rule for every existing formula.** There are three cases and they
do not share an answer. An earlier draft of this spec gave one rule for all
three — "take the same coefficient, not the sum" — which was wrong, and would
have quietly deflated every formula that referenced two now-merged attributes.
Assists, for instance, were `handling * 0.075 + iq * 0.05`; carrying `0.075`
forward loses 40% of the term.

1. **Additive contribution formulas** (`stats.ts`, `minigame.ts`) — **sum the
   coefficients.** If `playmaking` stands in for what `handling` and `iq` both
   used to say, then `playmaking * 0.125` preserves the mean where
   `handling * 0.075 + iq * 0.05` produced it. The total weight is unchanged;
   it is merely concentrated in one attribute. Outcomes do spread wider, since
   two attributes no longer average each other out — that is a consequence of
   having fewer, more meaningful attributes, and is intended.

2. **Normalised weight maps** (`overallRating`, `POSITION_WEIGHTS`) — sum, and
   the existing `weightSum` division makes it self-normalising.

3. **Per-attribute scalars** (`DECLINE_RATE`, `PEAK_AGE`) — summing is
   meaningless; these are chosen values and the plan states each as a literal
   with its reasoning.

**The `iq` split is not mechanical.** `iq` divides between `playmaking` and
`mental` differently at each of its ~20 sites, so the plan enumerates every one
with its target rather than leaving it to judgement at implementation time.

**A behavioural guard is required.** A systematic deflation of every formula
passes the entire existing suite — the "plausible basketball bands" test has
bands wide enough to hide it. So the distribution of 240 seeded careers is
captured from the seven-attribute model *before* the merge and committed as a
fixture, and the merged model is asserted to land within a stated band of it.
This must be captured first: once the merge lands it cannot be reconstructed.

**Call sites**, by weight of change:

- `src/game/progression.ts` (26 references) — growth, decline and wear curves.
  Per-attribute decline rates need re-picking: `physical` should fall fastest
  after 30, `mental` should not fall at all.
- `src/game/stats.ts` (19) — the box-score generator.
- `src/game/awards.ts` (10) — DPOY and All-Defensive key off `defense`.
- `src/game/create.ts` (7) — starting spreads.
- `src/data/styles.ts` — every `PlayStyle.bonus`.
- `src/data/perks.ts` — every `Perk.bonus` (rewritten wholesale in §6 anyway).
- `src/data/countries.ts`, `src/game/events/*.ts`, `draft.ts`, `ladder.ts`,
  `minigame.ts`, `national.ts`, `offers.ts`, `cup.ts` — scattered single
  references.

**Saves are dropped, deliberately.** `save.ts:44` is
`if (state.version !== SAVE_VERSION) return null`, and there is no migration
path. A conversion would have to invent a `playmaking` number from a player who
never had one, which is a guess dressed as continuity. Bumping the version and
losing in-progress careers is the honest option and was accepted.

**Display: all five, as numbers.** The original request was to filter by
position. At seven attributes that was clearly right; at five it costs a centre
sight of their own playmaking to save one line. So: all five, plain numbers, no
bars, with the delta since last preseason, ordered by position relevance and the
defining two emphasised. This was flagged and accepted.

```
PG                          C
  Playmaking   85  +4         Physical     84  +2
  Scoring      78  +3         Defense      81  +5
  Mental       72  +1         Scoring      66  −1
  Physical     80  −1         Mental       74  +2
  Defense      64  +2         Playmaking   52  +1
```

**Box score is position-trimmed**, as agreed. Three numbers that define the
position, plus games played and TS% as the honest efficiency line; the rest
behind a tap.

| Position | Leads with |
|---|---|
| PG | PTS · AST · STL |
| SG | PTS · AST · 3P% |
| SF | PTS · REB · STL |
| PF | PTS · REB · BLK |
| C | PTS · REB · BLK |

### 6. Perk rarity

**Now.** 24 perks, one taken per preseason, repeats already blocked by
`eligiblePerks` (`perks.ts:19`). The failure is arithmetic: a twenty-season
career draws twenty of twenty-four, and the age gates (`minAge`, `maxAge`) mean
the late-career pool is far smaller than the raw count suggests. `drawPerkChoices`
returns fewer than three, then none. The choice stops being a choice.

**Change.** Five rarities, and a pool large enough to feed them.

```ts
export type PerkRarity = 'basic' | 'silver' | 'gold' | 'legend' | 'top1'
```

**Rarity is earned.** Odds are a function of last season's rating and what it
won — a Top 1% perk is what an MVP year pays out, and a poor year still yields
Basic and Silver so nobody is left without a choice.

```
Rating 84, MVP, champion   →  basic 5%  silver 20%  gold 40%  legend 27%  top1 8%
Rating 54, no awards       →  basic 45% silver 38%  gold 15%  legend 2%   top1 0%
```

The distribution is computed from a single 0–1 `standing` score, interpolating
linearly between the two endpoint distributions above:

```ts
standing = clamp(
  (lastSeason.rating - 50) / 40      // 50 → 0.0, 90 → 1.0
    + (hasMajorAward ? 0.15 : 0)     // mvp, dpoy, finals_mvp
    + (wonTitle ? 0.15 : 0)          // league_champion or cup_champion
    + (madeAllStar ? 0.05 : 0),
  0, 1,
)
```

A rookie preseason has no prior season; `standing` is 0 and the slate is Basic
and Silver, which is correct — nothing has been earned yet. One number to tune,
built from figures the simulation already produces.

**Drawing.** Roll a rarity per slot, then take an unowned perk of that rarity.
If that rarity is exhausted, fall **down** one tier and retry, never up — the
scarcity of Legend must not become a back door to it. Slots are drawn without
replacement so the three options are always distinct.

**Magnitude scales with rarity.**

| Rarity | Growth points | Passives |
|---|---|---|
| Basic | 2–3 | none, or one weak |
| Silver | 4 | one |
| Gold | 5–6 | two |
| Legend | 7–8 | two, strong |
| Top 1% | 9–10 | a unique passive not available elsewhere |

**Pool size.** Roughly 53 perks — about 14 Basic, 14 Silver, 12 Gold, 8 Legend,
5 Top 1% — so a twenty-season career never exhausts a tier and always has three
distinct options. That is ~29 new perks to write in both languages, and it is
the single largest piece of work in either wave.

**Runaway power needs no new guard.** `takePerk` routes every bonus through
`spendGrowthPoint` (`perks.ts:67-73`), so diminishing returns already cap an
elite attribute regardless of how many Legend perks are stacked on it. The
rarity system changes how fast you approach the ceiling, not where it is.

**Card display.** Rarity as a coloured label on the perk card. At most three
effect chips, then `+N`; a Top 1% perk otherwise renders six chips and the card
becomes unreadable at exactly the moment it should feel best.

### 7. A quieter UI

Season result card and preseason screen only. Contract offers and character
creation were considered and deliberately left alone.

**Season card.** Currently a six-cell stat grid, then a four-cell grid, then up
to five chips (role, record, playoff result, salary, injury), then headlines.
After: one stat row of the three position numbers plus games and TS%, one chip
line, then headlines. Roughly half the elements.

**Preseason.** Five numbers replacing seven bars (§5), and the perk card chip
cap (§6).

---

## Testing

Existing coverage is 61 tests across 5 files; all must pass. The attribute
rename touches most of them mechanically.

New:

- **Renewal note** appears exactly when the slate contains no `isCurrentClub`
  offer and the player had a club; never on the first contract or out of youth.
- **Reason selection** is a pure function of the last season — same season, same
  reason, no RNG.
- **NBA slate**: a player with `currentLeagueId === 'nba'` and an NBA-tier rating
  gets a majority of NBA offers; a declining one starts seeing tier 2 again.
- **Anti-escalator holds**: a tier-3 player still cannot be offered the NBA
  through free agency. This is the regression the change most risks.
- **Trophies** name the right competition for a league title, a cup title and
  both finals losses; a season with neither produces none.
- **Perk draw** returns three distinct unowned perks for twenty consecutive
  seasons without exhausting, at both ends of the standing scale.
- **Rarity odds** shift monotonically with standing, and the fallback moves down
  tiers only.

## Sequencing

Wave 1 is independent and ships first. It adds one optional field to `Season`
but does not bump `SAVE_VERSION`, so an in-progress career survives it and the
changes can be verified without starting over.

Wave 2 lands as one commit — the attribute merge, the perk pool and the UI trim
are not separable, since the perk pool is written against the new attribute
names and the preseason screen renders both.
