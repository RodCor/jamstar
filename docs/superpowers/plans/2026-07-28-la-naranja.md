# La Naranja — Rename, Spanish README, and a Voice Pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the game to *La Naranja*, replace the README with Spanish copy written to sell the game, and take the machine-written cadence out of every piece of text in the project.

**Architecture:** Four passes over text, then verification. Nothing here changes behaviour. The one exception is the storage rename, which needs a migration so nobody loses a career.

**Tech Stack:** TypeScript (strict), Next 15, React 19, vitest.

This lands on `feat/career-loop-wave-3`, extending PR #11 — `main` does not yet have the Wave 3 work, so a branch off it would conflict with everything.

## Global Constraints

- **No behaviour changes.** Every distribution row in `career-distribution.test.ts` must come out byte-identical. If one moves, something was edited that should not have been — stop and report.
- **Never touch a number while editing prose.** In `src/data/perks.ts` and `src/game/events/*.ts` you may change `name`, `description`, `title`, `body`, choice `label` and outcome text **only**. Not `bonus`, `effects`, `weight`, `rarity`, `stages`, `positions`, `minAge`, `maxAge`, `requires`, `id`, or any `hidden`/`attributes` object. The balance behind those was settled over many measured rounds.
- **Do not touch `src/game/__fixtures__/career-baseline.json`, `SAVE_VERSION` (it is 4), the gain ladder in `progression.ts`, `stageForAge`, or any assertion band or tolerance.**
- Every dictionary key exists in both `es` and `en`, with matching `{placeholders}` — a test asserts all three.
- Spanish is **Rioplatense**: *vos*, *tenés*, *jugás*, *tirás*, *pibes*, *cancha*, *plata*. Written as Spanish, not translated from English.
- Verify with `npm test`, `npm run typecheck`, `npm run lint` before each commit.

---

## What "humanify" means here, concretely

The project's text has a measurable set of tics. Counted across `src/` and `README.md`:

| Marker | Count |
|---|---|
| em-dash `—` | 294 (220 in code comments, 35 in README) |
| "actually" | 49 |
| "deliberately" | 17 |
| "genuinely" | 12 |
| "not just …" | 5 |
| "which is exactly …" | 4 |
| "the whole point" | 3 |

Beyond the counts, the recognisable habits are:

- **The em-dash pivot** — a clause, a dash, then a restatement of the same idea with more emphasis. Twice a paragraph.
- **The corrective frame.** "This is not X. It is Y." Used even when nobody proposed X.
- **Insistence adverbs.** *Genuinely, actually, deliberately, precisely* doing work that the sentence should do on its own.
- **The triad.** Three parallel clauses where two would land harder.
- **Explaining the joke.** A vivid line, then a sentence explaining why it was the right line.
- **Uniform paragraph length.** Every one three to four sentences, so the rhythm never varies.

**What to keep:** the actual reasoning. These comments explain *why* things are the way they are, and much of that was expensive to learn. Cut the mannerisms, keep the content. A comment that gets shorter and still says the same thing is a win; one that loses a fact is a loss.

**A test you can apply:** read it aloud. If it sounds like someone explaining their work to a colleague, it stays. If it sounds like an essay about the work, rewrite it.

---

## Task 1: The rename, with a storage migration

**Files:** `package.json`, `src/app/layout.tsx`, `src/i18n/dictionary.ts`, `src/i18n/LocaleProvider.tsx`, `src/game/save.ts`, `src/components/shareCard.ts`, `src/components/RetirementScreen.tsx`

The name is **La Naranja** — it is the ball, and it does not translate. Use it in both languages.

- [ ] **Step 1: Rename the visible occurrences.**

| Where | From | To |
|---|---|---|
| `package.json` `name` | `hoop-glory` | `la-naranja` |
| `layout.tsx` metadata title | `Hoop Glory — Simulá tu carrera de básquet` | keep the tagline, swap the name |
| `layout.tsx` openGraph title | `Hoop Glory` | `La Naranja` |
| `dictionary.ts` `appName` (both locales) | `Hoop Glory` | `La Naranja` |
| `shareCard.ts` header + both share-text lines | `🏀 HOOP GLORY` | `🏀 LA NARANJA` |
| `RetirementScreen.tsx` download filename | `hoop-glory-…` | `la-naranja-…` |

- [ ] **Step 2: Migrate the storage keys.** `src/game/save.ts` holds `hoop-glory:run`, `:archive`, `:daily`; `src/i18n/LocaleProvider.tsx` holds `hoop-glory:locale`.

Rename all four to `la-naranja:*`, and add a one-time migration: on read, if the new key is absent and the old one is present, copy it across and remove the old. **The archive matters most** — it holds completed careers and has survived every version bump so far, so losing it would be worse than any save break this project has shipped.

Put the migration where the keys live, keep it small, and comment it with a note that it can be deleted once players have had time to reopen the game.

- [ ] **Step 3: Write a test** in `src/game/__tests__/save-compat.test.ts` (it already shims `localStorage`): seed the three old `hoop-glory:*` keys, read through the new API, and assert the data comes back and the old keys are gone. Cover the archive explicitly.

- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint`. Then `grep -rn "Hoop Glory\|hoop-glory\|HOOP GLORY" src/ package.json` and confirm the only hits are inside the migration.

- [ ] **Step 5: Commit.**

---

## Task 2: The README, in Spanish

**Files:** `README.md`

Replace it. The current one is 333 lines of English written for a developer auditing the repo — deployment instructions, test counts, an architecture tour. It reads like documentation of an internal project.

Write it in **Spanish**, for someone deciding whether to play. Sell the game.

The strongest material is already true and does not need embellishing:

- Your country decides your route. An Argentine goes cantera → Liga Nacional → Europe → NBA. A Serbian goes academy → ABA → EuroLeague. Twenty-one countries, each with its own path, and events that only happen where you are from — the *potrero*, the *Doppellizenz*, a bone-age X-ray at twelve.
- Every attribute is a trade-off, stated plainly at creation rather than hidden.
- Finals are played, not simulated. Free throws with the arena screaming, the last shot, reading the inbound pass.
- A rival, picked at creation and simulated in parallel for twenty years, who you are measured against at the end.
- The draft is a moment you can see coming, with a projection that firms up as you get closer.
- Two modes, one of them a daily where everyone on earth gets the same seed.
- Bilingual, and it saves in the browser with no account.

Keep a short technical section at the end — how to run it, where it deploys — but it is a footnote, not the body. Cut the test counts, the architecture tour, the balance-methodology section and the badge-scraper instructions; that belongs in the code and its comments, where it already is.

**Write it as Spanish.** Not a translation of the current English. Rioplatense.

- [ ] **Step 1:** Draft it. Aim for something a person reads to the end — that is a fraction of the current length.
- [ ] **Step 2:** Apply the voice test above to your own draft before committing. The failure mode here is writing marketing slop instead of technical slop.
- [ ] **Step 3: Commit.**

---

## Task 3: Code comments

**Files:** `src/**/*.ts`, `src/**/*.tsx` — comments only

Roughly 220 em-dashes and the adverb tics live here, across about forty files. This is the largest pass and the one where content is easiest to lose.

- [ ] **Step 1:** Work file by file. For each comment: keep every fact and every reason, cut the mannerisms. Shorter is better if nothing is lost.
- [ ] **Step 2:** Some comments carry hard-won measurements — the `coachTrust` surplus in `career-distribution.test.ts`, the `mvpsPerCareer` retirement note, the `LIMITER_MARGIN` justification, the Top 1% perk-shape note in `perks.ts`. **Keep every number and every causal claim in those.** They exist because someone lost time rediscovering the fact. Trim the prose around them, not the substance.
- [ ] **Step 3:** Do not touch code. Only comment text. A diff line that is not a comment is a mistake — check before committing.
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint`. All rows identical.
- [ ] **Step 5: Commit.**

---

## Task 4: In-game text

**Files:** `src/game/events/*.ts`, `src/data/perks.ts`, `src/i18n/dictionary.ts`

This is the text players read, and it is the highest-risk pass — reviewers repeatedly rated the event and perk writing as concrete, physical and idiomatically Rioplatense, so the failure mode is making it worse.

- [ ] **Step 1: Read before editing.** Go through `src/game/events/origin.ts` and `youth.ts` first. Much of it is already good: the caretaker cutting you a key, the list going up in March, hearing about two missed free throws in the bakery for a month. **Leave those alone.**
- [ ] **Step 2: Fix only what is actually wrong** — the same tics as elsewhere. In this text they show up as: a vivid line followed by a sentence explaining it; the em-dash pivot inside a card body; outcome text that editorialises about the choice instead of describing what happened.
- [ ] **Step 3: The dictionary** is UI chrome and mostly terse already. Check the longer strings — the draft panel hints, the legacy verdicts, the balance copy.
- [ ] **Step 4: Never touch a number, a gate, an id or a `stages` array.** Prose only. Verify with a diff review before committing: every changed line should be inside a string.
- [ ] **Step 5:** `npm test`, `npm run typecheck`, `npm run lint`. Distribution rows identical, dictionary parity intact.
- [ ] **Step 6: Commit.**

---

## Task 5: Verify

- [ ] **Step 1:** `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] **Step 2:** `MSYS_NO_PATHCONV=1 STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/jamstar npm run build`
- [ ] **Step 3:** `grep -rn "Hoop Glory\|hoop-glory\|HOOP GLORY" src/ package.json README.md` — only the migration should match.
- [ ] **Step 4:** Re-count the markers from the table at the top and report before/after. The em-dash count will not reach zero and should not; an em-dash is correct punctuation in Spanish and sometimes in English. Report the drop and judge whether what remains is doing real work.
- [ ] **Step 5:** Confirm `git log --oneline --all -- src/game/__fixtures__/career-baseline.json` still shows exactly one commit, `SAVE_VERSION` is 4, and every distribution row is unchanged.
- [ ] **Step 6:** Report a sample of before/after text — two code comments, two event cards, and a paragraph of the README — so the voice change can be judged rather than counted.
