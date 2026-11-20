# Deep Field

**[www.jleiros.com/deepfield](https://www.jleiros.com/deepfield/)**: a universe explorer that runs in
the browser. Fly from the Solar System to the edge of the observable universe on real star, galaxy,
exoplanet and small-body catalogues. Vite · TypeScript · Three.js.

Deep Field is a modified fork of **[Your Eyes In Space](https://github.com/berkcomba/youreyesinspace)**
by Berk Comba / [BigBrains](https://bigbrains.com.tr) (the original runs at
[youreyesinspace.com](https://www.youreyesinspace.com)). It is not affiliated with or endorsed by
BigBrains. "Your Eyes In Space" and its logo are trademarks of BigBrains, so this fork uses its own
name and logo.

## Changes from the original

Based on upstream commit
[`0eac11e`](https://github.com/berkcomba/youreyesinspace/commit/0eac11e20b8588df7972146fc3cfea6fbbcd3ac3)
(2026-11-20) and modified by Joachim Leiros on 2026-11-20:

- **Editorial content removed.** The guided tours, Academy lessons, sky events, narration audio and
  their translations are © BigBrains, all rights reserved (see `LICENSE-CONTENT.md`), and are not
  part of this fork. `src/data/tours.ts`, `lessons.ts` and `events.ts` keep their types and helpers
  with empty data; the Tours, Academy and Events buttons are hidden.
- **Server features off.** Streamer mode and multiplayer need the original's relay and room servers;
  the Voyager card plays removed event audio; the donation prompt and usage beacon belong to the
  original site. All four are disabled.
- **Rebranded** to Deep Field with a new logo; the About panel and welcome pages credit the original.
- **Static hosting.** Assets load from Vite's `base` (`/deepfield/`), so the site runs from a
  GitHub Pages project path, deployed by `.github/workflows/pages.yml`. The encyclopedia (static
  site generator) is not built.
- Rover terrain from the removed tour media is replaced by the generated ground.
- **Restyled** to match [jleiros.com](https://www.jleiros.com): GitHub-dark palette, blue accent,
  Lato throughout. The loading screen shows a percentage: the start-up data downloads are counted
  byte by byte against their sizes recorded at build time (`src/ui/LoadProgress.ts`).

## Develop

```sh
npm ci
npm run dev        # http://localhost:5173/deepfield/
npm run build:app  # typecheck + production build into dist/
```

`BASE=/ npm run build:app` builds for a site root instead of `/deepfield/`.

## Licence

The code is licensed under the **GNU AGPL-3.0-or-later** (see `LICENSE`), © 2026 BigBrains, with
modifications © 2026 Joachim Leiros under the same licence. The AGPL covers use over a network, so
this repository is the source of exactly what is deployed.

Third-party data, models, imagery and music keep their own licences and credits: see `NOTICE.md`
and the in-app "Controls and sources" panel.
