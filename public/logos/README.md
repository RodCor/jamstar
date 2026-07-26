# Club logos

Drop real logo files here, named after the team id they belong to:

    lal.svg        Los Angeles Lakers
    el_rma.png     Real Madrid (EuroLeague)
    lnb_boc.webp   Boca Juniors (LNB)

Team ids are the first argument of each `t(...)` call in `src/data/teams.ts`.
Accepted formats: `.svg`, `.png`, `.webp`, `.jpg`, `.avif`.

Then run:

    npm run logos

That regenerates `src/data/logos.ts`. Any club without a file here keeps its
generated crest, so a partial set works fine.

Club logos are copyrighted artwork as well as trademarks — make sure you have
permission before publishing a build that includes them.
