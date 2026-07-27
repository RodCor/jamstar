# Logos

Drop real logo files here, named after the id they belong to. Three kinds live
in this one folder — clubs, leagues and cups — which is safe because no id is
shared between them:

    lal.svg          Los Angeles Lakers        (club)
    el_rma.png       Real Madrid, EuroLeague   (club)
    nba.svg          NBA                       (league)
    acb.png          Liga ACB                  (league)
    copa_rey.png     Copa del Rey              (cup)

Ids come from the first argument of each `t(...)` call in `src/data/teams.ts`,
and from the `id` field of each entry in `src/data/leagues.ts` and
`src/data/cups.ts`. Accepted formats: `.svg`, `.png`, `.webp`, `.jpg`, `.avif`.

To fetch them automatically instead of by hand:

    npm run logos:fetch -- --list      # what would be fetched, no network
    npm run logos:fetch -- --dry-run   # resolve URLs, download nothing
    npm run logos:fetch                # download

Either way, finish with:

    npm run logos

That regenerates `src/data/logos.ts`. Anything without a file here falls back
gracefully — clubs keep their generated crest, leagues and cups stay as plain
text — so a partial set works fine.

These are copyrighted artwork as well as trademarks. Make sure you have
permission before publishing a build that includes them.
