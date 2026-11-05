# leadglobe: design notes

## Brief

- **Subject:** leadglobe, a go-to-market services agency. Five service lines: GTM services
  (outbound, research, signals, handoff), account-based marketing, paid media, content
  engineering, RevOps.
- **Audience:** founders, revenue leaders and marketing leads at businesses that need GTM work
  executed, not advised on. Any industry, any segment.
- **Job of the site:** explain exactly what leadglobe builds and runs, show it as real
  operational workflows, and start a conversation ("Discuss your GTM needs").
- **Assets:** the orbit logo kit (lowercase horizontal lockup, black, is the primary). Wordmark
  is Geist 600, lowercase.
- **Owner direction:** white, black and light pink only (no blue/violet gradient). Lowercase
  consistently, matching the wordmark. Stripe clarity, Linear precision, Apple restraint.

### Assumptions (also in `src/data/site.ts`)
- Contact email `hello@leadglobe.co` and domain `leadglobe.co` are placeholders.
- No address, phone, legal pages, clients, testimonials, numbers or partners were supplied, so
  none are shown. Footer legal links render only once configured.
- The five reference screenshots mentioned in the brief were not received; the services
  section is built from the written spec.
- Sample records inside the workflow illustrations (Northwind Freight, Halcyon Labs…) are
  fictional and labelled as illustrative.

## Concepts

| | A. Orbit (identity) | B. Run log (material) | C. One graph (formal) |
|---|---|---|---|
| Idea | The logo's tilted orbit is the site's geometry: work circles the account (the globe) and signals travel the orbit into results | The site reads like an operations console: every section is a job with a status, timestamp and output | The whole site is one connected node graph; sections are nodes, scrolling walks the edges |
| Signature | Each workflow runs live: a pink signal travels the connectors from input to result card, which settles to "done" | Status chips tick from queued to running to done as you scroll | A single line threads down the page linking every section |
| Anchor | leadglobe's own mark: a globe wrapped by an open orbit at -30° | GTM work is literally queued operational jobs | GTM is a pipeline of linked steps |
| O / F / Fe / P | 4 / 5 / 4 / 2 | 3 / 4 / 5 / 3 | 3 / 3 / 3 / 4 |

**Pick A.** It is built from leadglobe's own mark, so it can't move to another agency; steal
B's status chips for the result cards (they carry real state, not decoration).

## Concept card

```
Idea:        Work orbits the account: leadglobe runs the loop that turns signals into outcomes.
Metaphor:    an orbit around a globe (the logo), drawn as fine engineering lines.
Signature:   live workflows. A pink signal travels each workflow's connectors from source
             chips to the result card; the result card's status settles to "done". Tab
             switches re-draw the connectors. Hero: the five services ride a -30° orbit
             around the globe.
Emotion:     calm precision. "These people have the system already running."
Motion verb: route. Things travel along a line and lock into place (draw, travel, settle).
Screenshot:  the services panel: black tab, numbered list, workflow with a pink pulse
             mid-connector.
```

## System

### Palette (white / black / light pink)
| Role | Hex | Use |
|---|---|---|
| ground | `#FFFFFF` | page |
| ground-2 | `#FAF8F9` | alternating sections, dotted fields |
| ink | `#0B0B12` | text, active tab, dark result cards (logo ink) |
| muted | `#5D5D69` | supporting copy (7.0:1 on white) |
| line | `rgb(11 11 18 / 0.10)` | hairlines, card borders |
| pink | `#F7D6E0` | the accent: signal, badges, highlights, CTA fill. Always with ink text |
| pink-deep | `#E9A8BC` | connector nodes, signal core (graphics only, never text) |
| curtain | ink | page transition |

No blue, no gradient. Pink never carries text colour, only fills.

### Type
- **Geist** (the wordmark's family) via `next/font/google`. Display 600, tracking -0.035em to
  -0.02em by size; body 400 at 17px / 1.55.
- **Geist Mono** 500 for labels and workflow annotations at 11.5 to 12px, tracking 0.02em.
- **Lowercase** for display headings, nav, tabs, buttons and labels (matches the wordmark).
  Body copy and sample data in the workflow UIs stay in normal case for legibility. "gtm" is
  written lowercase in headings, "GTM" in body copy.
- Scale: hero t-xl clamp(2.6rem → 5.4rem), h2 clamp(2rem → 3.4rem), h3 1.5 to 2rem.

### Grid and rhythm
12 columns, fluid gutter, 1320px max content width. Hang text from column 1 and column 7.
Section moods: hero (airy), services (tight, framed), how it works (normal), principles
(normal, dark), engagement (tight), FAQ (normal), CTA (airy), footer.

### Shape
One radius rule: 14px for cards, 999px for chips and buttons, 3px for connector nodes
(square nodes per brief). Shadows: one soft level `0 1px 2px rgb(11 11 18/.04), 0 8px 24px
rgb(11 11 18/.06)`.

### Motion language
- Eases from the engine: `out` for entrances, `soft` for UI, `inOut` for the curtain.
- Route: connectors draw (stroke-dashoffset) 0.7s, signal travels 1.6s per segment, result
  card settles (y 8 → 0, status chip flips to done).
- Tab change: outgoing panel fades 0.18s, incoming copy rises 12px, workflow redraws. Height
  is fixed per breakpoint so nothing jumps.
- Idle: the signal keeps looping through the active workflow (paused off screen, off under
  reduced motion); the hero orbit drifts slowly.
- Hovers: buttons flood from the pointer (ink → pink or pink → ink), nav and links draw an
  underline, arrows travel 4px. Tabs: a pink underline slides to hover target.
- No loader: a services site should show its content at once (theatre scaled to the brief).
- Page transition: an ink panel sweeps along the orbit's -30° angle.

### Composition plan
```
HERO      | eyebrow · h1 (cols 1-8)          | lede · two CTAs (cols 9-12)
STORY     | pinned full-width revenue engine: visual title · status · 01-04 caption · 3D engine
          | (intelligence → 5 parallel channels → pipeline, revops base) · six-column scoreboard
          | (scroll = focus, the engine runs on its own clock)
SERVICES  | ─ full width tab bar (5) ───────────────────────────────────────────── |
          | label · h3 · copy · learn more   | workflow canvas (dotted, cards+connectors)    |
          | 01..06 numbered list             |                                                |
HOW       | h2 left (cols 1-5) | 5 steps as a horizontal route line with square nodes (cols 1-12)
WHY       | dark field: h2 + 4 principles in a 2x2 asymmetric list (not cards)
ENGAGE    | sticky h2 left | 5 stages stacked right, each with "what you get"
FAQ       | h2 left cols 1-4 | accordion cols 6-12
CTA       | pink field, big lowercase line, button
FOOTER    | logo, nav columns, contact, small print
```

### Genericness test
- A generic model would use Inter + blue/violet gradient + three feature cards. Changed: Geist
  from the wordmark, white/black/pink only, no feature cards (principles are a numbered
  ruled list on a dark field, engagement is a sticky timeline).
- Generic "how it works" is 5 icon cards. Changed: a single route line with square nodes and a
  signal that travels it, the same element as the workflows.
- Generic hero is a dashboard screenshot. Changed: the logo's own orbit, carrying the five
  services.

## Hero v2: handoffs in orbit (2026-10-26)

Concepts weighed for "five services moving one business forward":
1. Relay pipeline (lanes converging into the business). Clear cause and flow, but reads as a generic SaaS funnel, loses "around the business", and turns into a list on phones.
2. Layered stack (signal / work / system / outcome planes). Explains layers, but stock isometric look, no service-to-service relationships, weak on mobile.
3. Handoffs in orbit (chosen). The logo's own geometry. The still frame already reads as business at the centre with five capabilities around it; motion adds what was missing: services pass work to each other along the orbit, and each handoff delivers a named outcome into the business.

Mechanics (`src/components/Orbit.tsx`, one gsap.ticker driver):
- Five stories, one started by each service: paid → revops (visit attributed), content → gtm (outreach with context), gtm → revops (handoff to sales), abm → paid (target accounts reached), revops → abm (pipeline view updated).
- Each story: source node turns ink and shows its activity; a pink packet travels the shortest way round the orbit (behind the globe when on the back half), leaving a fading trail; the receiver turns ink and responds; a pulse drops down its spoke; the globe ripples and names the outcome.
- Hover or focus a service: its story plays. Click: opens its tab (home) or its page (service pages).
- Reduced motion and no-JS: the first handoff is drawn at rest (both nodes lit, trail, outcome), so the still frame still explains a handoff.
- Phones (orbit container ≤ 520px): short names on the nodes, statuses hidden, one ink caption line under the orbit narrates the current handoff.
- Outcomes describe the work's intended contribution, not results. Activity lines are sample data.

## Hero v3: the leaking sales pipeline (2026-11-04)

Owner brief: a 3D hero that tells leakage, then connection, then revenue in one loop. First
version was a ring of stations around an engine; the owner's verdict was "the visual doesn't
deliver sales intuition". Rebuilt as a straight sales pipeline: anyone who has seen a funnel
report should read it in three seconds as "prospects leaking out of my pipeline, then fixed".
The orbit stays on the service pages; the home hero gets the pipeline.

```
Idea:        Prospects leak out between disconnected GTM teams; strategy plus connected
             execution closes every gap, and the stage counts prove it.
Metaphor:    a porcelain architectural model on a plinth: market tray, a rail track through
             real sales stages, a closed-won tray.
Signature:   the gaps close. GTM strategy scans the market and marks the right accounts, a
             charcoal spine draws along the back, each service module docks at a handoff and
             bridges its gap, and the marked accounts ride all the way into closed won while
             the counters climb past the "was" numbers.
Emotion:     recognition ("that's my pipeline"), then relief.
Motion verb: route (unchanged). Spheres travel the rails, parts drop in and lock, the spine draws.
Screenshot:  the fixed pipeline, counts "16 / 15 / 13 / 12 / 10 / 9" beside "was 16 / 10 / 6 /
             3 / 1 / 0", nine accounts in the pink closed-won tray.
```

Scene (model space, turned -0.74 rad so the track runs diagonally towards the camera):
- Left: the market tray (5 x 7 accounts). Right: the closed-won tray with a pink rim.
- Track: white twin rails through accounts, contacted, replied, meeting, opportunity, closed won.
  Broken at each of the five handoffs; a pink drain under each gap catches what falls.
- Behind each handoff: one service module (outbound, paid media, content, abm, revops) with a
  docking arm. Behind everything: the charcoal spine (leadglobe) from the strategy frame.
- Labels: stage counts hang on the plinth in front of the track; service tags float above the
  modules; "one connected gtm engine." sits in the empty corner (bottom left; top right on
  narrow containers) so it never covers the model.

Loop (13 s), a pure function of time (`story(t)`):
- 0 to 4.9 run 0, leaking: 16 random accounts go down the broken track, 0 close.
- 4.9 to 6.6 fixing: strategy frame drops and scans (16 accounts get pink rings), spine draws,
  modules dock, bridges slide in, drains close.
- 6.3 to 11 run 1, connected: the 16 marked accounts flow, 9 reach closed won; "was N" appears.
- 11 to 12.3 revenue label, 12.3 to 13 reset and the market refills.

Implementation: plain three (lazy `import()` after first paint, only while the hero is visible),
driven by gsap.ticker. No R3F: it brings its own render loop and would break the one-clock rule.
Modules in `src/components/gtm/scene/`: layout (constants, sphere fates, routes),
GTMAnimationController (time to state), GTMStations (gates, service modules), RevenuePipeline
(rails, bridges, drains, trays), GTMEngine (spine, hub, strategy scanner), CustomerSpheres
(accounts, rings, live counts), GTMScene (renderer, camera, lights, frame, label projection).
`GTMHero.tsx` owns the DOM: poster, canvas, projected labels with live counts, stage strip, pause.
Phones and touch: 30 fps cap, DPR 1.25, shadow map updated every third frame.
Fallbacks: reduced motion renders one still 3D frame at t 11.6 (the fixed pipeline); no WebGL,
Save-Data or low-memory devices get `public/hero/gtm-engine.png`, a capture of the same frame
(`?gtm-still=11.6`). Regenerate it whenever the scene changes.

## Hero v4: the pipeline, full width, told by scroll (2026-11-05)

Owner verdict on v3: the message lands, but it looked clumsy: small and compact. Cause: a long
diagonal model squeezed into cols 7-12 at 1 : 0.9, thirteen 11px pills on the track at once, and
the proof numbers ("was 3 → 12") as the smallest text on screen.

```
Idea:        Same story, given the room it needs: one wide panorama, and scroll is the clock.
Signature:   the reader closes the gaps by scrolling; the scoreboard climbs past the struck-out
             old numbers.
Screenshot:  chapter 03, 9 accounts in the pink tray, scoreboard 16 / ~10~ 15 / ~6~ 13 / ~3~ 12 /
             ~1~ 10 / ~0~ 9.
```

Layout:
- Intro: h1 cols 1-8, lede + CTAs hang at cols 9-12. The pipeline's top edge shows in the fold.
- `.story`: on desktop with a fine pointer (`SCROLL_MQ` in `GTMHero.tsx`, the same query in
  globals.css) the section is 340vh and `.story__pin` sticks under the header. The stage runs
  nearly edge to edge (gutter only, up to 1840px); caption and footer re-align to the content column.
- Three chapters (`hero.chapters` in site.ts), one big caption at a time: 01 leaks (t 0-4.9),
  02 gaps close (4.9-6.6), 03 closed won (6.6-12.05). Each chapter gets an equal share of the scroll
  with short holds between them (`CHAPTER_T`, `scrollToStory`). The shown time eases towards the
  scroll target, so wheel steps glide; spheres and counts are pure functions of t, so scrubbing
  back works.
- Scoreboard: six big tabular numbers under the stages (columns placed at each stage's projected
  screen x), stage name in mono, the leaking run's count struck through (pink) from chapter 03.
- Tags on the model: all five services + gtm strategy while the modules dock, then only the service
  whose handoff a sphere is crossing. "the market" and the final pill are gone; the caption says it.

Camera: yaw and elevation follow the frame aspect (`YAW_WIDE/-SQUARE`, `EL_WIDE/-SQUARE` in
layout.ts). Wide frames turn the track to nearly left to right at 42°; square frames (phones) keep
the v3 diagonal at 50°.

Modes: phones / touch / < 900px autoplay the 13 s loop unpinned (pause in the footer row, scoreboard
cut to accounts / meeting / closed won). Reduced motion: unpinned still frame, chapter 03. Poster
(no WebGL): unpinned, even six-column scoreboard with the fixed counts. The poster image is now a
16 : 9 capture at the wide camera.

## Hero v5: the connected revenue engine (2026-11-05)

Brief: the visual has to show the whole GTM system rather than just the leaking pipeline, and it
keeps the line "strategy + connected execution closes the gaps." v4's message held, but the story
was about one track only.

```
Idea:        One machine with three layers and revops underneath. After a short disconnected
             prelude (five vendors; accounts leak out where each channel ends), it plugs in and
             runs continuously.
Signature:   the moment the bus draws under the deck and the status line flips from
             "before: five vendors, no shared system" to "now: one connected gtm system".
Screenshot:  chapter 03, accounts moving through the pipeline, a won account's pulse running
             home along the feedback line, scoreboard 20 / 15 / 10 / 6 / 4 / 2.
```

The engine, in reading order (geometry in `scene/layout.ts`):
- A, gtm intelligence: a strategy frame with four instruments (icp & market segmentation, target
  account selection, buying signals & intent, contact enrichment). It picks the accounts.
- B, connected execution: five channels side by side (outbound, linkedin, content, paid media,
  abm). They are parallel lanes, not consecutive stages, and they coordinate with each other.
- C, sales pipeline: accounts reached → engaged → meetings booked → qualified opps → proposal &
  negotiation → closed won (the only pink object), with a closed lost branch into a grey tray.
- revops, the connective tissue rather than a station: a base slab under the whole deck. A charcoal
  bus runs along its ledge with taps up from every layer, and four plaques sit on it (crm & data
  integrity, attribution & measurement, pipeline analytics, conversion optimization). A feedback
  line runs from the outcome trays back to the strategy frame.

Clock and focus:
- The clock is continuous and starts at 0 the first time the figure is on screen. The prelude
  (0-6.4 s, `CONNECT`) plays once, then the engine cycles every `LOOP` s. It never wraps back to
  the prelude.
- Desktop with a fine pointer (`SCROLL_MQ`): `.story` is 400vh and the pin sticks under the header.
  Scroll does not scrub time. It moves the focus through four chapters (`floor(progress * 4)`),
  and the camera leans towards that layer. Phones / touch / < 900px: the focus advances every 6 s
  after the prelude, with a pause button in the footer. Reduced motion: one still frame at
  `STILL_T` in chapter 04. No WebGL, Save-Data or low memory: the poster image, chapter 04, and an
  even six-column scoreboard with the per-cycle counts.

Head (`hero.visual` in site.ts):
- The visual's title: display 600, h3 scale, balanced.
- The status line in mono: a hollow square while the system is disconnected, a pink-filled square
  once it is connected. The text stays ink or muted, never pink.
- Index 01-04 plus a one-line caption. The old caption exits fast and upwards (0.22 s); the new
  one enters slower with expo out from below (0.6-0.9 s, 0.16 s delay). Forward always reads as
  upward travel.
  - 01 strategy creates direction.
  - 02 connected execution creates pipeline.
  - 03 revenue is the outcome.
  - 04 revops connects every stage, and every outcome sharpens the next decision.

Pills: two tiers.
- Tier 1, always on: the four layer titles, with an ink outline, a step larger, and a square
  marker.
- Tier 2, the focused chapter only: hairline, round muted marker, 0.35 s fade.
  - Chapter 01: the intel instruments.
  - Chapter 02: the channels as "name · detail", with the detail dropping below 760px.
  - Chapter 03: "closed lost · n" (live count) and "engagement signals".
  - Chapter 04: the revops plaques and "feedback loop".
- At most ~10 pills are visible at once. No pill appears before its part of the engine is built.
- Revops plaques and the revops layer pill hang below their anchor (`HANGS`). Everything else sits
  above its anchor.

Scoreboard: six columns placed at the projected x of each station and closed won. Live counts.
Station names may wrap to two lines (max 11ch) so columns about 1.25 units apart don't collide at
1280px. Closed won sits in a pink pill. The v4 "was" strike-through is gone, because the story is
no longer before/after numbers.
