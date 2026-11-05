# leadglobe: research and creative direction report

Date: 2026-11-05. Branch: `feature/ai-native-creative-direction` (cut from `master` @ `0a81f76`).

## 1. Skills: what was actually found

| Requested | Status | What was used instead |
|---|---|---|
| `awards` | **Not found.** Not in the session skill list, `ListSkills`, `SearchSkills` or `~/.claude/skills`. | `anthropic-skills:luxury-web-design` (loaded, read): editorial restraint, motion durations, anti-pattern list. Plus `design:design-critique`, `design:accessibility-review`, `design:ux-copy` for the review stages. |
| `agent-reach` | **Not found** (same searches). | Direct GitHub page fetches (WebFetch) plus one web search. `gh` CLI is unusable: the token is invalid and the GitHub API answers "access to this repository is not enabled for this session". |

Where `luxury-web-design` conflicts with the owner's direction in `DESIGN.md`, the owner's direction wins:
Geist rather than a serif display face, `#FFFFFF` ground, and lowercase. The skill's motion and
composition rules apply: one major moment per section, expo-out, 700 to 1400 ms reveals, no
bouncy springs, no three-card feature grids, and a calm page.

## 2. Repository inspection (baseline)

- Next 16.4.3, React 19.3, GSAP 3.15 (SplitText and ScrollTrigger), Lenis 1.3, three 0.181. No R3F, on purpose: there is one clock, set by `gsap.ticker`.
- `DESIGN.md` is a thorough design log (hero v1 to v5). Owner constraints: white, black and light pink only; lowercase; Stripe clarity, Linear precision, Apple restraint; no invented clients, metrics or testimonials.
- Baseline health on master: `next build`, `tsc --noEmit` and `eslint` all pass. Playwright at 1440x900 and iPhone 13 showed 0 console errors and 0 horizontal overflow.
- **No git remote is configured** and GitHub access is not enabled for this session, so the branch can be committed locally but **cannot be pushed** from here.

### Critique of the current site
1. **"AI-native" is a label, not an experience.** The phrase appears once, as an 11 px mono eyebrow. Nothing on the page shows what AI does, where humans stay in control, or why that makes the agency different from a traditional GTM shop. This is the biggest gap against the positioning.
2. The hero says the same thing twice: the h1 "strategy + connected execution…" is followed immediately by the visual title "strategy + connected execution closes the gaps.". The owner asked to keep the visual line, so the fix belongs in what comes after it, not in removing it.
3. Between the engine and services there is no "how the work actually runs" moment. The page jumps from a 3D metaphor to a tab UI.
4. The craft is high: the token system, the one-clock motion engine, reduced-motion and no-WebGL fallbacks, and the SSR-safe engine. **No rebuild is warranted**, only targeted additions.

## 3. GitHub research

Star counts are as displayed on each repo page on 2026-11-05. GitHub rounds them, so "33.5k" is the most precise figure available.

| Repo | Stars | License | Verdict for leadglobe |
|---|---|---|---|
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 117.6k | MIT | **In use.** Keep. |
| [motiondivision/motion](https://github.com/motiondivision/motion) | 34.9k | MIT | Skip. It duplicates GSAP and adds a second animation clock. |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | 33.5k | MIT | Skip. Its own render loop breaks the one-clock rule (already decided in DESIGN.md, and that decision still holds). |
| [greensock/GSAP](https://github.com/greensock/GSAP) | 30.2k | GreenSock "standard no-charge" license (not OSI; free incl. commercial, all plugins) | **In use.** Use SplitText (in use) and Flip more. |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 23.1k | MIT | Reference only. The aesthetic is Tailwind-generic, the anti-pattern this brand avoids. Its "animated beam" idea validates connector-based storytelling. |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | 17.1k | MIT | **In use.** Already driven from gsap.ticker, as the docs recommend. |
| [barbajs/barba](https://github.com/barbajs/barba) | 13.0k | MIT | Skip. The Next router plus `src/engine/transition.ts` already covers it. |
| [theatre-js/theatre](https://github.com/theatre-js/theatre) | 12.9k | Apache-2.0 core / **AGPL-3.0 studio** | Skip. The studio is AGPL and development has moved to a private repo, which is a maintenance risk. |
| [pmndrs/drei](https://github.com/pmndrs/drei) | 10.1k | MIT | Pattern only: `View` (one renderer, scissored viewports) is the right model if a second 3D scene is ever added. Avoid a second WebGL context. |
| [pmndrs/leva](https://github.com/pmndrs/leva) | 6.3k | MIT | Optional dev-only tuning panel. Not adopted; it would be a new dependency for little gain. |
| [oframe/ogl](https://github.com/oframe/ogl) | 4.7k | Unlicense | Skip. It would be a second WebGL lib next to three. |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | 3.0k | Zlib | Skip for now. The porcelain look doesn't need bloom or DOF, and each pass costs GPU time on phones. |
| [codrops (org)](https://github.com/codrops) | PageTransitions 2.3k, HoverEffectIdeas 1.6k… | varies per repo | Technique reference. No code to be copied. |
| [pmndrs/react-postprocessing](https://github.com/pmndrs/react-postprocessing) | 1.5k | MIT | Skip (R3F-only). |
| [darkroomengineering/satus](https://github.com/darkroomengineering/satus) | 1.0k | MIT | **Architecture validation.** Darkroom's Next 16 starter uses Lenis, GSAP, and R3F behind a feature flag. This is the same layering leadglobe already has. |
| [14islands/r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig) | 989 | MIT | Pattern only: DOM proxies drive GL placement. leadglobe already projects labels from 3D to the DOM, which is the inverse of the same idea. |

I could not reliably read maintenance signals (last commit or release dates) from the fetched pages, so none are claimed above.

### Most valuable techniques (applied to this codebase)
1. **One clock.** gsap.ticker drives Lenis, ScrollTrigger and three. Every new interactive piece must subscribe to it, not to its own `requestAnimationFrame`. The repo already does this; it is the rule to protect.
2. **Pure function of time.** State is `story(t)`, so scrubbing, reduced motion (render one `t`) and posters all come free. The new AI console uses the same model.
3. **Masked SplitText line reveals** for display copy. These are already in the engine and should be reused rather than reinvented.
4. **GSAP Flip** for state changes in DOM UIs (a run-log row moving from "drafted" to "approved"), instead of hand-tuned keyframes.
5. **No new runtime dependencies.** The best-starred libraries mostly duplicate capabilities the repo already has. Bundle discipline is a design value here.

## 4. Creative direction

```
Idea:        ai does the work at machine speed; people make the calls. leadglobe is the system
             in between, and you can watch it run.
Metaphor:    the operations console. The engine above shows the shape of the system; the console
             shows a single shift inside it.
Signature:   a live run log. Named agents (research, signals, writing, routing) post work as
             rows; a row can't go out until a human approval chip turns ink. The pink signal from
             the workflows marks the one row that's waiting on a person.
Emotion:     calm control. "It's already running, and nothing ships without us."
Motion verb: route (unchanged). Rows arrive, wait at the gate, then settle as approved.
```

Rules carried forward: white, black and pink; lowercase display text; Geist and Geist Mono; pink as fill only; sample records labelled as illustrative; no invented metrics, clients or AI capability claims beyond what the owner confirms.

**Positioning copy is a proposal.** Statements about how leadglobe uses AI (agents research and draft; humans approve) are flagged in `site.ts` as `OWNER TO CONFIRM`. They match the FAQ's existing "approval step first" promise, but the owner must confirm them before launch.

### Proposed hero lede alternatives (not applied, OWNER TO CONFIRM)
The current `hero.copy` is unchanged. These are the copy agent's options, approved for tone:
- A: "We set your go-to-market strategy, then run outbound, ABM, paid media, content and RevOps as one connected system, with AI agents doing the groundwork and people approving what ships, so qualified buyers stop slipping through the gaps between teams and tools."
- B: "We set your go-to-market strategy, then run outbound, ABM, paid media, content and RevOps as one connected system. AI agents do the research and drafting, your team makes the calls, and qualified buyers stop slipping through the gaps between teams and tools."

Claims to confirm before launch: AI agents do research, signal monitoring, drafting and routing; a person approves everything brand-facing (email, ads and posts); the approver is the client ("your team"); the agent log is real and the client can see it.

## 5. Agent structure

| Agent | Responsibility | Tools / skills | Output gate (my review) |
|---|---|---|---|
| **Copy & UX** | AI-native section copy and lede options, in brand voice | `design:ux-copy` guidance, DESIGN.md, site.ts (read-only) | No claims beyond the brief, lowercase rules, and nothing that breaks positioning |
| **Interaction engineer** | `AgentConsole` component: DOM/SVG, GSAP on the engine clock, reduced-motion still, mobile layout | Code edits in an isolated worktree | Diff review, build/tsc/lint pass, screenshots at 3 widths |
| **QA (a11y & performance)** | axe-core, keyboard pass, responsive sweep 360 to 1920, JS weight and CLS/LCP via Playwright | Playwright and axe-core (both already in devDeps) | Every finding is either fixed or explicitly waived |

I did the research directly with web fetches rather than through an agent, so the figures above come from first-hand fetches.

## 6. Roadmap

1. **Stage 0 (done):** inspect the repo, verify skills, research, run a baseline build/tsc/lint and screenshots, and write this report.
2. **Stage 1:** the copy agent drafts the AI-native section copy. I review it and it lands in `site.ts`.
3. **Stage 2:** the engineer agent builds `AgentConsole` and places it between the engine and services. I review the diff and screenshots.
4. **Stage 3:** integrate. Tokens for any new values go in `:root`, and `DESIGN.md` gets a "v6: the console" entry.
5. **Stage 4:** the QA agent runs a11y, responsive and performance checks. Fixes are applied, then checks re-run.
6. **Stage 5:** commit on the feature branch. Push is **blocked**: there is no remote and no GitHub access in this session. Attach the repo (or add a remote) and push with `git push -u origin feature/ai-native-creative-direction`.

## 7. External skill libraries (added 2026-11-05)

The owner supplied 16 skill repositories. All 16 were shallow-cloned into the session scratchpad
as **read-only reference material**: they are not vendored into this repo, and no script, `npx`
command, hook or installer from them is run. A quick scan for embedded commands, network calls and
agent-directed instructions found only documentation mentions of `npx impeccable` and
`npx svgo`, and workers are told not to run them. Owner rules in DESIGN.md override every skill.

| Role | Skills used |
|---|---|
| System polish (CSS, a11y, components) | pbakaus/impeccable · vercel-labs/agent-skills `web-design-guidelines`, `react-best-practices` · emilkowalski/skills `review-animations` · greensock/gsap-skills `gsap-react`, `gsap-scrolltrigger` · jpoindexter/typography-skills `microtypography` · akillness/jeo-skills `responsive-design` |
| Hero polish (three.js, motion) | CloudAI-X/threejs-skills `threejs-performance` · greensock/gsap-skills `gsap-performance`, `gsap-react` · typography-skills `hierarchy-and-scale` · emilkowalski `review-animations` |
| Creative director review | smixs/creative-director-skill · typography-skills `typography-audit` · emilkowalski `emil-design-eng` |
| Not used (out of scope) | RobLe3/cc-blender-skill, remotion-dev/skills (video); msitarzewski/agency-agents (role prompts, no skills); coreyhaines31/marketingskills (CRO copy would add claims needing owner confirmation); wshobson/agents, plugin87, nextlevelbuilder (overlap with the above). No LangChain anywhere. |
