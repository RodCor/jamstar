# Follow-up: earn `mvpsPerCareer` back as an assertion

## What the row measured

`mvpsPerCareer`, in `src/game/__tests__/career-distribution.test.ts`, is the mean
number of MVP awards accumulated per career across the 240-career baseline
cohort — `mean(careers.map((c) => c.mvps))`. It started life as an asserted
guard row (±12% band), same as `ringsPerCareer` and `allStarsPerCareer`.

## Why it was retired

`src/data/leagues.ts` sets `hasMvp: true` on nearly every league, but the
leagues differ enormously in how reachable an MVP actually is — winning an
NBA MVP and winning a EuroLeague MVP are not the same odds, and both are
"an MVP" to this row. `mvpsPerCareer` is decided on that all-or-nothing,
one-per-league-season threshold, so whenever the cohort's *league-tier
distribution* shifts, the row moves — even when every player in the cohort
is exactly as good as before. That is composition drift, not a quality
regression, and a guard meant to catch uniform deflation should not fire on
composition. `peakRating.mean` and `peakRating.p90` are the rows that
actually detect quality regressions here, and they stayed flat through all
three drifts below.

## The three-wave evidence trail

1. **Seven-attribute merge.** The row drifted when the baseline was
   recaptured on the new attribute model. First sign the metric was
   sensitive to something other than player quality.
2. **Perk rarity landing.** Drifted again, sharply — a 4.4% change in total
   perk magnitude moved this row ~27 percentage points on the same cohort
   while `peakRating` moved under 1%, roughly a 30x amplification gap. This
   is when the band was widened from ±12% to ±30% and unasserted was still
   on the table but not yet taken.
3. **This wave (Wave 3).** Drifted a third time — current reading is
   **+35.14%** (0.6250 vs. baseline 0.4625), which is outside even the
   widened ±30% band — on a change that did not meaningfully alter player
   quality: the early-stage event decks were rebalanced against the pool a
   real career actually draws from, not against the raw deck listing.
   `development`'s cards were matched closely to the pool they displace on
   all five effect channels; `youth`/`breakout` were matched on attributes,
   hype, wear and morale, with a deliberate `coachTrust` surplus (see the
   long comment on this row in `career-distribution.test.ts` for why that
   surplus is a decision, not an oversight). Through all three drifts,
   `peakRating.mean` and `peakRating.p90` barely moved. A row that fails
   three times for three unrelated upstream causes, while the rows that
   measure quality stay flat, is not measuring what this guard exists to
   catch — hence: printed, not asserted.

Widening the band a second time was considered and rejected: the paragraph
that justified the first widening already said widening isn't the fix, and
doing it again would just teach the next reader that the band moves
whenever it's inconvenient.

## What would earn the assertion back

**MVPs per season played *in an MVP-awarding league*** — not per career.
Dividing by seasons actually spent somewhere an MVP could be won removes the
league-placement confound at the source instead of tolerating it behind a
wide band, because it stops counting a career's seasons in non-MVP-relevant
or unreachable-tier leagues against the denominator. That version deserves a
tight band (±12%, in line with the other asserted rows) precisely because it
no longer amplifies composition shifts the way the current one does.

## What's needed to pick this up

- Implement the new metric (seasons in an MVP-awarding league is already on
  `Season`/`League` — `league.hasMvp` — so this is a `computeTotals`-level
  change plus a `career-distribution.test.ts` row, not a simulation change).
- Capture a **fresh baseline figure** for it. The current
  `career-baseline.json` fixture has no such number — it was captured before
  this metric existed. Per the fixture's own rule ("never edited to match
  new behaviour"), the new figure must come from a comparably clean point in
  history rather than from `HEAD`. That point is the parent of **`2af1dfa`**
  (the Wave 1 merge commit) — i.e. the tree immediately before Wave 1
  landed — using the same 240-career harness this file already runs.
- Add the row as asserted with a ±12% band, and only then remove the
  `mvpsPerCareer` print-only row (or keep both, if the old figure remains
  useful evidence — that's a judgment call for whoever picks this up).
