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
HERO      | eyebrow · h1 (cols 1-7)          | orbit visual (cols 7-12): globe + -30° ring, 5 service chips ride it
          | copy · two CTAs                  |
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

## Hero v3: the revenue engine (2026-11-04)

Owner brief: a miniature 3D GTM ecosystem that tells one story in a 12 s loop: siloed stations,
leaking pipeline, leadglobe connects them, connected execution, revenue. The orbit stays on the
service pages; the home hero gets the engine.

```
Idea:        Opportunities leak between disconnected GTM teams; leadglobe connects them into one engine.
Metaphor:    a porcelain architectural model on a plinth: stations, channels, a central mechanism.
Signature:   the gaps close. Charcoal rails grow out of the assembling engine into every station,
             the broken white channels are bridged, and the same black spheres that fell
             through the gaps now flow through every station into the revenue bowl.
Emotion:     calm precision, then relief: "nothing gets lost any more".
Motion verb: route (unchanged). Spheres travel lines, parts drop in and lock, rails draw.
Screenshot:  the assembled model, bowl filling, "one connected gtm engine." above the hub.
```

Scene plan (world units, plinth radius 4.9, channel height 0.34):
- Six stations on a ring (r 3.0, every 60°): paid media 0°, revops 60°, abm 120°, content 180°,
  gtm strategy 240°, outbound 300°. Back gap (270°): the prospect hopper. Front gap (90°): the
  revenue bowl, nearest the camera.
- Fragmented (white channels): ring arcs with gaps at 30°, 150°, 210° and a broken spur to the
  bowl. Pink drain rings mark the gaps. Station mechanisms spin at their own speeds.
- Connected (charcoal = leadglobe): engine drops in part by part, 8 radial rails draw out from it,
  gaps are bridged in charcoal, drains close, station mechanisms lock to the engine's rhythm.
- Loop (12 s): 0 siloed, 1.2–4.6 leakage, 4.6–6.2 connect, 6.0–10.2 flow, 9.8–11.2 revenue label,
  11.2–12 reset (reverse assembly) back to frame 0.

Implementation: plain three (lazy `import()` after first paint, only when the hero is visible),
driven by gsap.ticker. No R3F: it brings its own render loop and would break the one-clock rule.
Modules in `src/components/gtm/scene/`: layout (geometry constants, routes), GTMAnimationController
(pure time → state), GTMStations, RevenuePipeline, GTMEngine, CustomerSpheres, GTMScene (renderer,
camera, lights, per-frame apply). `GTMHero.tsx` owns the DOM: poster image, canvas, projected
labels, stage strip, pause button.
Fallbacks: reduced motion renders one still 3D frame of the finished state; no WebGL, Save-Data
or low-memory devices keep the poster image (a capture of that same frame).
