# Badges

Real logo files, named after the id they belong to, in the folder for their kind:

    lal.svg                 team id     — first argument of each `t(...)` in `src/data/teams.ts`
    el_rma.png              team id
    leagues/acb.svg         league id   — `id:` of each entry in `src/data/leagues.ts`
    cups/copa_rey.png       cup id      — `id:` of each entry in `src/data/cups.ts`

Accepted formats: `.svg`, `.png`, `.webp`, `.jpg`, `.avif`.

## Filling this folder

    npm run logos:fetch     # download from Wikipedia into these folders
    npm run logos           # regenerate src/data/logos.ts from what is here

`logos:fetch` writes `_report.json` listing everything it could not resolve. Fix
those by putting a direct URL in `scripts/logo-sources.json`, then re-run it with
`--only=<id> --force`.

Anything without a file here keeps its generated crest, so a partial set works
fine. A handful of competitions are deliberately left generated because they have
no badge of their own — see `NO_REAL_BADGE` in `scripts/fetch-logos.mjs`.

## Check what you got

The scraper reports what it *downloaded*, not whether the picture is right — a
club whose article search drifts one place lands a real logo belonging to someone
else. Look at the files before shipping them.

## Rights

Club, league and cup logos are copyrighted artwork as well as trademarks — make
sure you have permission before publishing a build that includes them.
