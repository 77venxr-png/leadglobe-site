# Studio status

The director updates this file after every stage. Read it first in any new session.

**Branch:** `feature/ai-native-creative-direction` (pushed to origin). `master` is untouched.
**Concept:** `docs/concept-v6-the-proof.md` (approved with 4 director amendments).

| Stage | Role(s) | Scope | Status |
|---|---|---|---|
| 0 | director | research report, studio setup | done |
| 1 | design-system-steward | type and spacing tokens in `:root`; remove pink used as text; drop `--c-pink-2`; DESIGN.md System section | in progress (`wip/s1-tokens`) |
| 2 | editorial-typographer | site-wide type migration onto the new tokens; mono audit (35 → ≤10); remove eyebrows except the hero's; drop noun-heading full stops | next |
| 3 | frontend-engineer → motion-director | the proof: replace `AgentConsole.tsx` with Dana's annotated email and the human edit; pin ≤200vh | queued |
| 4 | webgl-engineer (+ frontend-engineer) | engine head, leader-line labels, new scoreboard; regenerate the poster; story and camera unchanged | queued |
| 5 | frontend-engineer + motion-director | services index, about, engagement, faq, contact, service-page lists | queued |
| QA | visual-qa | after stages 3 and 5 | queued |

## Open owner decisions
- Confirm the AI operating-model claims (console, FAQ, page titles): agents research, monitor signals, draft and route; a person approves anything brand-facing; the approver is "your team".
- Retire the orbit on service pages? (It stays until decided.)
- The proof's draft email and its edit are illustrative copy, OWNER TO CONFIRM.

## Not yet integrated
- `wip/hero-polish` and `wip/system-polish`: earlier workers, stopped mid-task. Superseded by concept v6; mine them for the verified fixes only (three.js lazy split, pause controls, a11y fixes).
