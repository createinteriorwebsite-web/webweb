# CREATE Interior Design — website

Static site (plain HTML / CSS / JS, no framework). Layout and typography follow a
gallery-style studio site: white canvas, light geometric uppercase headings (Jost),
Poppins body text, hamburger menu in a dark circle, dark full-screen menu overlay,
mosaic portfolio grid.

## Pages

| File | What |
| --- | --- |
| `index.html` | Home: animated hero, intro statement, logo slider, one-line portfolio reel, milestones timeline, Our Process (stacking cards), testimonials |
| `portfolio.html` | Portfolio: 4-column grid with filter bar; hovering a tile blooms it over a 2 x 2 block that plays the project's photos |
| `projects/<slug>/index.html` | One page per project (hero image, meta, text, gallery, prev/next) |
| `about.html`, `contact.html` | About Us (passion, ethos, achievements, designers, studio) and Contact Us |

## The hero (home page) — video version (current)

`assets/video/hero-1080.mp4` (desktop) / `hero-720.mp4` (phones), cut from the client's
house fly-through. Two parts, controlled by `HERO_VIDEO = { cut: 6.0 }` in `build.js` (12 s clip):

1. **Front** — the clip plays and holds on the house front (at 6.0 s, just before the middle) with the CREATE logo.
2. **Inside** — the first scroll plays the rest, zooming through the doors (an early scroll just lets it keep rolling, no jump). Scrolling is
   held while it plays; when it ends the headline fades in and the page is released.
   The hero then stays on the inside frame: scrolling back up never shows the front
   again (also remembered for the session).

Set `HERO_VIDEO = null` to go back to the photo collage hero below.

## The hero (home page) — photo collage version

1. **Preloader** (currently OFF; set `HERO_FLASH = true` in `build.js` to enable) —
   photos zoom from tiny to full screen a few times before the collage.
2. **Collage** — the Maplewoods bedroom sits in the centre of a magazine-style
   collage with the CREATE logo over it; the 7 photos around it fade in.
3. **Scroll** — the centre photo expands over the collage until it fills the screen;
   the CREATE headline and marquee fade in. It scrubs with the scroll.

Which photos are used is set in `build.js` (`centre`, `collage`, `flash`). The collage
positions are in `assets/js/hero.js` (`layout()`), as fractions of the viewport.

## Logo, colours & favicon

The brand is the new "CREATE Interior Architects" wordmark (October 2026). The source
photo is kept at `assets/img/brand/create-logo-source.jpeg`; from it:

* `assets/img/logo.png` — the wordmark in its bronze ink (#56452c), transparent background
* `assets/img/logo-white.png` — the same in white, used over the hero video and the dark menu
* `assets/img/favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` — the "C" on the beige

The page background is the paper beige behind the logo (#e1dbd1, `--bg` in
`assets/css/style.css`) and the accent colour (`--red`, kept as the variable name) is the
logo's bronze, used for the curtain wipe, the active nav underline, buttons and the red-sweep
highlight in the statement.

## Portfolio grid (portfolio.html)

Uniform 4-column grid. Hovering a tile makes the neighbouring tiles combine into one panel
that plays the project's photos while the rest of the grid dims. With every photo the panel
re-combines into a different block of cells, so its shape keeps changing:
2x2, a full row (4x1), 3x2, 2x2, the full two rows (4x2), 2x1, and round again. The block
always contains the cell under the pointer and never leaves the grid. The sequence and
pace are `SHAPES` and `STEP` in `assets/js/main.js`. Photos are decoded off-screen before
they are shown so the shape animation never stalls. Tiles filter by tag (`residential`,
`commercial`, `hdb`, `condo`, `landed`) and by the search box.

## Home reel

A single row of project covers scrolls sideways forever (pauses on hover); each links to
its project. "View all projects" goes to the portfolio page.

## Milestones (home)

A vertical line that fills as you scroll, with alternating photo / text entries. The
entries live in `MILESTONES` in `build.js`. **The years there are placeholders**; confirm
them with the client.

## Logo slider, Our Process, testimonials (home)

* **Logo slider** ("Brands we work with", directly under the hero): Hafary, Hansgrohe,
  Light Craft, SPACE Furniture, Floor Xpert, Miele, Goodrich. Files live in
  `assets/img/logos/` (taken from each brand's own website / Wikimedia Commons) and are
  listed in `LOGOS` in `build.js`. Shown in full colour.
* **Our Process**: four steps in `PROCESS` in `build.js`. Each is a photo with the words on
  it; the step title bars stack at the top of the screen as you scroll.
* **Testimonials**: `TESTIMONIALS` in `build.js`. **Placeholder quotes**; replace with real
  reviews. One quote shows at a time, fades to the next every 6.5 s (dots to jump).

## Photo viewer (project pages)

Click any photo on a project page: it zooms out of its place on the page into a dark
full-screen lightbox with a thumbnail strip along the bottom. Arrows, scroll, swipe, keys
or the strip move through every photo of every project, endlessly; closing zooms it back.
The photo list is generated into `assets/js/photos.js` by `build.js`.

## Page transitions

Internal links trigger a red curtain wipe (brand red from the logo), then the new page
slides it away.

## Editing content

* Project copy, tags, slogans, sizes and image order live in `data/projects.json`.
* Studio copy for About Us / Contact is in the templates inside `build.js`. The footer (`footer()` in `build.js`) lists pages, the first six projects and contact details.
* Contact details (email, phone, social links) are in the `SITE` object in `build.js`.

## Adding a project

1. Put the original photos in `assets/img/orig/`.
2. `node optimize.js` — makes `assets/img/web/*.jpg` (1800 px) and `assets/img/thumb/*.jpg` (700 px).
3. Add an entry to `data/projects.json` (first image = cover / hero).
4. `node build.js` — regenerates every HTML page.

## Running locally

```bash
python3 .claude/serve.py 8790
```

(`.claude/serve.py` is a tiny static server with HTTP Range support, which the hero video
needs for seeking; Python's default `http.server` lacks it.)

Then open <http://localhost:8790>. Deploy by uploading the folder (except
`assets/img/orig`, `build.js`, `optimize.js`, `data/`) to any static host.

## Contact form

The form has no backend: submitting opens the visitor's mail client with the fields
pre-filled (`data-mailto` on the form). Swap in a form service (Formspree, Netlify
Forms, etc.) by giving the form an `action` and removing `data-mailto` in `build.js`.

## Photo curation

`data/projects.json` holds the curated photo list (111 photos). `data/projects.full.json`
is the untouched list of all 180 and `data/unused-photos.txt` names the 69 that were
dropped as repeats or weak shots. The dropped files are still in `assets/img/`; nothing
was deleted. To bring a photo back, copy its entry from the full list into
`data/projects.json` and run `node build.js`.

## Repository layout & deploying

This repo is the complete, ready-to-host site. The HTML files at the root are generated by
`node build.js`; commit them along with any change to `build.js` or `data/`.

Not in the repo (kept on the working machine only, see `.gitignore`):

* `assets/img/orig/` — the original full-size photo dumps
* `assets/img/_unused/` — photos dropped during curation
* the raw source videos for the hero

Because of that, `node optimize.js` (which rebuilds `web/` and `thumb/` from `orig/`) only
works on a machine that has the originals. Building the pages with `node build.js` needs
nothing but Node.

To host it, point any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages) at the
repository root. There is no build step and all links are relative, so it also works from
a sub-path such as `https://<user>.github.io/webweb/`.
