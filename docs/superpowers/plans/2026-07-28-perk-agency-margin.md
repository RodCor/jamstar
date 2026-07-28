# The perk-agency invariant holds by about 6%, and that is thinner than it looks

## What the invariant asserts, and where

`src/game/__tests__/legacy.test.ts`, the test
`rewards perks chosen to suit the position with better careers`. It plays 90
careers where perks are chosen to suit the player's position (`focused`)
against 90 where the first listed perk is always taken (`casual`), and
asserts:

```ts
expect(avg(focused)).toBeGreaterThan(avg(casual))
expect(eliteRate(focused)).toBeGreaterThan(eliteRate(casual))
```

Its own comment says why it exists: *"Player agency has to actually matter —
this is the whole point of the perk screen."* It is the only test in the
suite that asserts the perk screen is worth using.

Note the form of the assertion: a bare `greaterThan`, with no numeric
threshold. It passes at +0.01% exactly as loudly as at +50%. Nothing in the
file records how much margin there actually is, so nothing in the file tells
a reader that the property is close to its edge.

## The measured margin

Across the four commits of Wave 3 that touched the event decks, the gap in
mean legacy score sat between **+6.00% and +8.02%** — stable, but that is
the whole of it. On the assertion's own scale the property is worth about six
percent, not a comfortable multiple.

| events at | focused | casual | gap |
|---|---|---|---|
| `e84ecff` (ladder fix) | 1047.62 | 988.31 | +6.00% |
| `9ca6946` (development retarget) | 1051.70 | 976.54 | +7.70% |
| `6a5a4c0` (hype retarget) | 1049.86 | 971.88 | +8.02% |
| morale + `coachTrust` on target | 993.62 | 997.21 | **−0.36% — FAILS** |
| morale on target, `coachTrust` reverted (**shipped**) | 1044.14 | 981.20 | +6.42% |

## What inverted it

Bringing one effect channel onto its own target. Wave 3's early event decks
were priced against the effective pool they displace, channel by channel.
Four of the five channels — attributes, hype, wear, morale — were brought
onto target and cost nothing. Bringing the fifth, `coachTrust`, onto target
at `youth` and `breakout` improved the distribution guard markedly and
**inverted this invariant**: `focused` fell 5.4% while `casual` *rose* 2.6%,
an 8.4pp collapse from a single channel, recovered exactly by reverting that
one channel.

The direction is the finding. It is not that both cohorts got worse — the
careless player got *better*. That is what makes it a design property rather
than a balance wobble.

## The mechanism

`src/game/stats.ts`, in `determineRole`:

```ts
const trust = (player.hidden.coachTrust - 50) * 0.28
const score = gap + trust - youthPenalty + rng.gauss(0, 5)
```

`determineRole` decides minutes, and minutes are how an attribute advantage
becomes production. `coachTrust` is therefore not one reward channel among
five — it is *the channel through which the other four pay out*. A player
who invested in the right attributes only converts that investment if they
are on the floor.

So throttling early `coachTrust` is not a uniform tax. It costs the player
whose advantage is in attributes almost everything, and costs the player who
has no attribute advantage nothing, because there was nothing to convert.
Compressing this channel compresses the reward for playing well, specifically.

## Why the surplus was left in place

The shipped decks carry a deliberate `coachTrust` surplus at `youth` (+0.27)
and `breakout` (+0.54) against their effective-pool targets. Every other
channel is on target at every stage.

That is a decision, not an oversight. A tidier distribution guard is not
worth breaking the thing the perk screen exists to do — and the distribution
guard's own docblock says it is a weak net for data-level changes anyway, so
the rows that would have improved are the rows least able to justify the
trade. The cost of the decision is recorded rather than hidden: `rpg.mean`
and `ringsPerCareer` both sit closer to their bands than they would have,
and `mvpsPerCareer` did not come back inside its band in either
configuration (see `2026-07-28-mvp-metric-followup.md`).

## It has a second trigger, and no effect value has to change to pull it

The paragraph above describes someone deliberately retargeting the channel.
That is the obvious way to break this. It is not the likely one.

While raising the origin deck's weights so that a career actually meets its
country, the invariant inverted again — **without a single effect magnitude
being edited.** Weight alone did it. In a deck where one card is drawn per
season, a card's weight *is* its share of the effective pool, so raising a
group of cards raises how much of the pool's channel profile those cards
write. The origin deck is `coachTrust`-poor at breakout: **0.01 against the
rest of the pool's 1.38**. Tripling it uniformly took its share of breakout
pool weight to **28.7%**, dragged pool `coachTrust` from 1.38 to 1.03, and
the margin went with it:

| origin weights | mean legacy gap (n=200) | elite-rate delta (n=200) |
|---|---|---|
| as shipped in Wave 3 | +7.17% | +0.100 |
| uniform x3 | +2.71% | **+0.010** |
| final, tier-differentiated | +6.68% | +0.070 |

At the suite's own n=90 the uniform version landed on the wrong side and
`legacy.test.ts` failed. The fix was not to back off the exposure target but
to stop lifting the deck uniformly: the origin cards are `coachTrust`-*rich*
at youth (2.12 vs 1.39), development (1.85 vs 1.34) and prime (3.43 vs 0.58)
and poor only at breakout, so the breakout-eligible tier was lifted least.
That reached the exposure target with the margin intact.

The general lesson, which is the one worth carrying: **anything that changes
the mix of cards a player draws early is a `coachTrust` change, whether or
not it touches a `coachTrust` value.** New cards, retired cards, re-gated
cards, re-weighted cards, a change to stage lengths — all of them move the
effective pool's profile on this channel, and this invariant is what notices.

## The actual risk, and why it is not silent breakage

**The surplus is self-guarding.** Anyone who "tidies" the `coachTrust`
channel onto target reproduces the inversion, and `legacy.test.ts` fails.
The suite catches it, immediately, with a name that says what broke.

The risk is the step after that. A contributor who hits that failure, sees a
small unexplained surplus in the event decks, and reads it as sloppiness has
every incentive to conclude the test is the problem — to loosen it, mark it
flaky, or "fix" it by nudging something else until the numbers pass. The
comment in `career-distribution.test.ts` says the surplus is deliberate; it
does not have room to say the invariant is worth only 6%, that the failure
mode is an inversion rather than a shortfall, or that this exact experiment
has already been run and its results are known.

This document is that record. If the suite ever fails on
`rewards perks chosen to suit the position with better careers` after a
change to event-card effects, event-card *weights*, minutes, or
`coachTrust`, the first thing to check is whether the change compressed the
early `coachTrust` of the effective pool — and the answer is already above.
Note the failure mode: it is an inversion, so the careless cohort will look
like it improved. That is the signature, and it is the opposite of what a
"casual players got nerfed" reading would predict.

## If someone wants to remove the surplus properly

The surplus is a workaround for a real tension: effective-pool matching and
player agency pull opposite ways on one channel. Removing it honestly means
addressing the tension rather than the symptom — for instance, decoupling
minutes from `coachTrust` alone so that an attribute advantage has a second
route onto the floor. That is a larger piece of work than a weight edit, and
it should re-measure the table at the top of this document before and after.

**The cheaper prerequisite, and it should come first: give the invariant a
numeric floor at a larger n.** The elite-rate leg currently runs 90 careers
per cohort against a bare `greaterThan`. The true margin is about +0.07, and
+0.07 is not reliably resolved at n=90 — during the weight work a
configuration whose true margin was +0.010 passed at some seeds and failed at
others, and one whose true margin was +0.070 passed. A test that cannot
distinguish those two is not measuring the property it names; it is sampling
it. Concretely: raise the cohort to 200 per side and assert an elite-rate
delta of at least about **+0.05**, chosen below the +0.07 measured here with
room for ordinary drift. That converts this document's central claim — the
invariant is worth roughly 6%, and the failure mode is inversion — from prose
into something the suite enforces, and it is a prerequisite for any work that
deliberately moves this channel, because otherwise there is no instrument
sensitive enough to tell whether the work succeeded.
