# leadglobe: concept v6, "the proof"

2026-11-05. Evidence: `home-*.png` and `revops-*.png` here. Software WebGL kept the engine in its prelude, so I judged its composition only.

## 1. Diagnosis

Weights: T typography .25, C composition .25, M motion .20, Co colour .15, D details .15.

| Section | T | C | M | Co | D | Total | What keeps it from 10 |
|---|---|---|---|---|---|---|---|
| hero intro | 6 | 5 | 5 | 5 | 7 | **5.6** | h1 80px over 17px (4.7:1). Template head: eyebrow, split, two pills. |
| engine head | 4 | 4 | 6 | 5 | 6 | **4.9** | `.gtm__title` repeats the h1, with four small lines stacked under it. |
| engine scene + score | 4 | 6 | 7 | 7 | 7 | **6.0** | Best object on the site, under 10 capsule tags. `.gtm__score` is the hero-metric template. |
| console | 3 | 3 | 4 | 4 | 5 | **3.7** | 8 equal rows, 16 pills, the idea said 4 times, CSS loops, a pink border-left, an empty panel on phones (`home-390-v03`). |
| services | 4 | 4 | 6 | 5 | 6 | **4.9** | Cards four deep, capsule tabs, double numbering, a third CTA strip. |
| about + why | 4 | 3 | 4 | 5 | 4 | **3.9** | The h2 duplicates principle 01. A 2x2 feature grid. An orphaned h3. Pink numerals. |
| engagement | 4 | 4 | 3 | 4 | 5 | **4.0** | Mono "you get" labels in off-palette `--c-pink-2` cards. |
| faq | 5 | 5 | 4 | 5 | 6 | **5.0** | Competent; stock h2. |
| contact | 5 | 4 | 3 | 6 | 6 | **4.7** | Brave pink field; stock headline, mono labels. |
| footer | 4 | 4 | 3 | 5 | 6 | **4.3** | Repeats the tagline. Mono heads. |
| /services/revops | 5 | 5 | 6 | 4 | 5 | **5.0** | The orbit is a second metaphor. Pink text. A numbered 3x2 grid. Ticks inside a card. |

**Site: 4.6.** Engineering craft 7; design 4.

**Five generic habits**
1. **One template, ten times:** eyebrow, a 57px h2 with a full stop, a muted intro at cols 8–12. Nothing is ever loudest.
2. **Mono as costume:** 35 `--f-mono` declarations. When everything sounds like a machine, the machine voice means nothing.
3. **Dashboard furniture:** 12 `999px` capsules, nested cards, and 01/02/03 on lists whose order means nothing.
4. **Flat scale, flat rhythm:** apart from the h1, all type sits between 11 and 57px. Every section has the same padding and the same `data-reveal="up"`.
5. **Saying it twice; pink spread thin:** pink appears as tint, pill, border and **text**. The text uses break the owner rule at globals.css:447, 471, 472, 499, 522, 739 and 900–907.

## 2. Concept card

**Insight:** revenue leaders want AI's speed but won't let it speak for their brand, because AI outbound has come to mean spam.

```
Idea:        ai does the work. people make the calls. The site shows where the call is made.
Metaphor:    the printer's proof. The machine sets the copy and notes its sources in the
             margin; a person marks it up and signs it off.
Grammar:     mono = machine (small, many, margin) · Geist display = person (big, few) ·
             pink = the person's highlighter (fill, never text) · ink rule = the decision.
Signature:   Dana Reyes's draft as a proof. Agent notes draw hairlines to the words they
             support; the page waits; one ink strike, one pink highlight; grey turns to ink;
             "people make the calls." lands at 195px.
Emotion:     defensive hope (Tier 3): "it's fast, and nothing goes out we didn't decide."
Motion verb: mark (point, strike, highlight, sign). It extends "route" onto words.
Screenshot:  the approved proof with crop marks, margin notes, a strike on a pink band, and
             "people make / the calls." filling the width.
```

Beyond the starting idea: the proof becomes the **whole site's** grammar, the mark is an **edit** (judgement, not a rubber stamp), and the split h2 completes at approval.

**Score 8.1:** originality 7 (annotated proofs are known), fit 9, emotion 8, feasibility 8, scale 8, simplicity 9. It isn't a 9 because it rests on the draft: AI-sounding copy defeats it.

**Rejected**
- **Mission control** (the run log scaled up). A dashboard as the hero that any AI SDR tool could wear. It shows volume rather than judgement, and it invites invented metrics.
- **Two clocks** (agents race, the human ticks once). Speed is the saturated AI claim, it needs numbers we don't have, and it makes the person look slow.

## 3. Home page, in order (12 columns)

Key: P purpose · G grid · B largest type · X removed · M motion · m mobile.

**Hero.** P: the positioning in one breath. G: h1 at cols 1–11 with three manual breaks; lede at cols 7–11. B: h1 at `--t-display` (119px). X: the eyebrow; the ghost button becomes an `.arrow-link`. M: masked SplitText lines, 90ms stagger, 1.0s expo out; then the engine's edge rises (claim, then proof). m: 44px, full-width button.

**Engine** (scene, story and camera untouched). P: leakage, then connection, then revenue. G: the stacked title goes. The owner's line "strategy + connected execution closes the gaps." moves to the scene's empty bottom-left corner, shown once connected. Caption at cols 1–7; index and status share one mono line. B: the caption at `--t-h3` ink. X: capsule tags become mono text with a 1px leader and a square node (the proof's grammar); detail tags and the hint go. Scoreboard: five small mono counts; only closed won is large (`--t-l` on a pink block). Caption: "illustrative model. counts are sample data." M: leaders draw (0.5s expo out). m: one label at a time, two counts.

**The proof (#console), the first build**
- P: one email that proves the sentence.
- Desktop (≥1100px, fine pointer): 300vh, with a sticky stage of `100svh − header`.
  - Row 1: "ai does the work." at `--t-l`, cols 1–7. The existing `consoleSection.copy` at cols 9–12 is the only prose.
  - Row 2: the **sheet** at cols 4–9, white on `--c-bg-2`. Hairline crop marks replace the card border and shadow. To and subject in Geist 500. Body at `--t-read`/1.5, 34ch, starting `--c-muted` (draft). Mono status "draft 1 · writing agent".
  - Margins: cols 1–3 and 10–12 hold four mono notes. Each leader ends in a pink-deep square on its word. The facts come from `workflows.tsx` and `rows`:
    - research → "Northwind": "freight logistics, 240 employees"
    - signal → "three sales roles": "3 sales roles posted"
    - writing → subject: "step 1 of sequence"
    - routing → "Dana": "replies route to Sam K., AE"
  - Row 3, B: "people make the calls." at `--t-mega`, cols 1–12. Mono under it: "approved by your team", plus the illustrative caption.
  - Semantics: an sr-only `<h2>`, with the visual halves `aria-hidden`. The sheet is a `<figure>`, the notes an `<aside>`, the edit `<del>`/`<ins>`.

| Scroll | What happens | Trigger | Why |
|---|---|---|---|
| enter | Row 1 lines rise | 0.9s expo out | the claim |
| 0.10–0.55 | Four leaders draw to their words | scrub 0.6 | agents point at evidence |
| thresholds | Note text fades in (y 4px); the target word underlines | 0.4s expo out | text never scrubs |
| 0.55–0.70 | **Nothing moves.** "waiting for a person" and an ink "approve" button | — | stillness is the tension |
| 0.70 or click | Strike (0.5s expo inOut); replacement above; pink band sweeps in (0.6s); body muted→ink; notes dim to 40% | threshold or button | one human act transforms the work |
| 0.85 | The mega line rises, 120ms stagger | 1.1s expo out | the sentence completes |

- X: the 8-row table, pills, badges, panel bar, 3 points, agents `<dl>`, keyframe loops and border. The rows stay in `site.ts` for future per-service proofs.
- Reduced motion and no-JS: the final state, server-rendered and unpinned.
- m (<1100px or touch): linear and full width. Each note sits under its paragraph, with a square after the target word, and reveals on entry. The mark plays when the sheet's end reaches 60% of the viewport. "people / make the / calls." at 60px. Never reserve empty height.
- The draft (≤70 words) and the edit are **OWNER TO CONFIRM**: the edit implies people revise drafts.

**Services.** P: pick a line and see its workflow. G: cols 1–6 hold the five names as a vertical tablist, the selected one ink on a pink band, with its headline and link beneath. Workflow at cols 7–12, directly on the ground. B: the index at `--t-index`. X: capsule tabs, numbers, `.svc__panel` and the dotted card, the caps list, `.svc__cta`, the visible h2. M: the band sweeps across (0.5s expo out). m: the same list at 28px.

**About (ink).** P: the stance. G: three principles as run-in sentences at `--t-read`, cols 5–12. B: "execution over advice." at `--t-display`, cols 1–10. X: the h3, the duplicate principle, the grid, the pink numerals. M: only the headline rises. m: stacked.

**Engagement.** P: how to start. G: a run-in head ("working together" in ink at `--t-h3`, flowing into the intro), then three columns of text and output under a hairline, with a route line and nodes under the names. B: stage names at `--t-l`. X: "you get" labels and the pink-2 cards. M: the line draws on enter (0.9s) and the nodes fill. m: the line runs down the left.

**FAQ.** G: "questions" at cols 1–4 with no full stop; accordion at cols 5–12. B: the h2 at `--t-l`. X: the circle icon. M: grid-rows 0fr→1fr, 0.35s. m: full width.

**Contact (pink).** G: form at cols 5–12, labels in Geist 500 (people type here, so no mono). B: headline at `--t-display`. M: lines rise. m: one column. **Footer:** drop the repeated line and the mono heads.

## 4. Type and space system

| Token | Value | @1440 | Use |
|---|---|---|---|
| `--t-mega` | clamp(3.75rem, 0.5rem + 13vw, 13.5rem) | 195px | once per page |
| `--t-display` | clamp(2.75rem, 0.6rem + 7.6vw, 7.5rem) | 119px | h1, about, contact |
| `--t-l` | clamp(2.25rem, 1.2rem + 3.6vw, 4.75rem) | 71px | h2, stages, closed won |
| `--t-index` | clamp(1.75rem, 1rem + 2.6vw, 3.25rem) | 53px | lists that are the content |
| `--t-h3` | unchanged | 37px | captions, run-in heads |
| `--t-read` | clamp(1.125rem, 0.95rem + 0.55vw, 1.5rem) | 24px | proof body, ledes |
| `--t-mono` | 0.75rem, the only mono size | 12px | machine voice |

- Mega against body: 11.5:1. Tracking and leading: mega −0.06em/0.86; display −0.05em/0.92; l −0.04em/0.96; index and h3 −0.03em/1.05. Full stops on sentences only.
- **Mono:** only for what a machine wrote or measured (notes, counts, positions, status, captions). Delete the eyebrows. 35 declarations down to 10 or fewer.
- **Pink:** a fill where a person acted (highlighter, closed won, contact, `::selection`). Delete `--c-pink-2`.
- **Rhythm:** `--space-breathe` clamp(8rem, 4rem + 12vw, 16rem) around the hero, the proof and contact; `--space-section` clamp(5rem, 3rem + 6vw, 9rem); `--space-tight` clamp(3rem, 2rem + 3vw, 5rem) for faq and about. Hairlines replace cards.

## 5. Build order

1. **design-system-steward:** `src/app/globals.css` `:root` (§4 tokens) and the 10 pink-text selectors. Update the System section of `DESIGN.md`.
2. **editorial-typographer:** the type selectors and the mono audit in `globals.css`. Remove the eyebrows in `src/app/page.tsx` and `src/app/services/[slug]/page.tsx`. Update `Footer.tsx` and `ContactForm.tsx`. In `src/data/site.ts`, drop the noun-heading full stops and draft `consoleSection.proof` (OWNER TO CONFIRM).
3. **frontend-engineer, then motion-director:** the proof. Replace `src/components/AgentConsole.tsx` and the console CSS (globals.css 928–1027). The timing table becomes one ScrollTrigger timeline on `gsap.ticker`, with no CSS loops.
4. **webgl-engineer with frontend-engineer:** `src/components/gtm/GTMHero.tsx` and the `.gtm*` CSS (298–428). Touch `scene/GTMScene.tsx` only if anchors are needed. Regenerate `public/hero/gtm-engine.png`. Story and camera unchanged.
5. **frontend-engineer and motion-director:** `src/components/ServiceTabs.tsx`, plus about, engagement, faq and contact in `page.tsx` and `globals.css`, then the service-page lists. Retiring the orbit is an owner decision.

## Director's amendments (approved with changes, 2026-11-05)

1. **Proof pin ≤ 200vh.** The engine's 400vh pin comes straight before it; 300vh more would mean about 7 screens of pinned scrolling in a row.
2. **Keep the hero eyebrow "ai-native gtm agency"**, restyled to the new grammar. It is the only visible AI-native positioning in the fold. Every other eyebrow goes.
3. **h1 size is tuned by the editorial-typographer**, starting near 104px rather than 119px, so the lede stays in the fold at 1440x900.
4. **The orbit stays on service pages** until the owner decides. Noun headings drop the full stop (director's call).

Skill log verified with `.claude/agents/verify-skill-log.py`: 24 quotes, 0 failed, 6/6 skills.
