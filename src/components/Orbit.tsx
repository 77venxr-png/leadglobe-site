'use client';
// Hero visual, drawn from the logo's own geometry: a solid globe (the business) wrapped by an orbit
// tilted -30°. The five services sit on the orbit and pass work to each other along it: one
// service lights up with what it is doing, a packet travels the orbit to the next service, that
// service responds, and the result drops down its spoke into the business, where the outcome is
// named. Five short handoffs play in turn; hovering or focusing a service plays the one it starts.
// The orbit breathes (slow tilt drift) and leans toward the pointer. One clock (gsap.ticker),
// paused off screen. Under reduced motion, and before JS, the first handoff is shown at rest.
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { services, type ServiceSlug } from '@/data/site';
import { isTouch, prefersReducedMotion } from '@/engine/env';
import { TAB_EVENT } from './ServiceTabs';

gsap.registerPlugin(ScrollTrigger);

const W = 600;
const H = 540;
const CX = 300;
const CY = 270;
const A = 262; // orbit semi-axes
const B = 112;
const R = 84; // globe
const TILT = -30;
// Where each service sits on the orbit (parameter angle, degrees), clear of the globe.
// Order follows `services`: gtm, abm, paid, content, revops.
const SLOTS = [230, 140, 320, 45, 200];
// Short names for the nodes on phones, where the full names don't fit on the orbit.
const SHORT: Record<ServiceSlug, string> = {
  'gtm-services': 'gtm',
  'account-based-marketing': 'abm',
  'paid-media': 'paid',
  'content-engineering': 'content',
  revops: 'revops',
};

// What each service shows it is doing. Index 0 is its resting activity. Sample activity only.
const STATUS = [
  ['researching accounts', 'guide added to sequence', 'reply: interested'],
  ['mapping buyers', 'tier 1 list updated', 'account engaged'],
  ['2 campaigns live', 'ad click, variant b', 'audience refreshed'],
  ['drafting a guide', 'guide published'],
  ['syncing crm', 'source recorded', 'routed to owner', 'engagement synced'],
];

// The handoffs: service `from` (showing status fromS) passes work along the orbit to `to`
// (status toS), and the result reaches the business as `outcome`. Each service starts one.
const STORIES = [
  { from: 2, fromS: 1, to: 4, toS: 1, outcome: 'visit attributed' },
  { from: 3, fromS: 1, to: 0, toS: 1, outcome: 'outreach with context' },
  { from: 0, fromS: 2, to: 4, toS: 2, outcome: 'handoff to sales' },
  { from: 1, fromS: 1, to: 2, toS: 2, outcome: 'target accounts reached' },
  { from: 4, fromS: 3, to: 1, toS: 2, outcome: 'pipeline view updated' },
];

// Story timeline (seconds from the story's start).
const LEAD = 0.5; // source lights up before the packet leaves
const HOLD = 1.9; // outcome stays before the next story
const travelTime = (d: number) => 0.8 + (Math.abs(d) / 180) * 0.9;
function timeline(i: number) {
  const d = delta(STORIES[i]);
  const arrive = LEAD + travelTime(d);
  const spoke = arrive + 0.3;
  const land = spoke + 0.6;
  return { d, arrive, spoke, land, end: land + HOLD };
}

/** Shortest way round the orbit from one slot to another (a tie goes the front way). */
function delta(s: { from: number; to: number }) {
  return ((SLOTS[s.to] - SLOTS[s.from] + 540) % 360) - 180;
}

function point(tDeg: number, tiltDeg: number) {
  const t = (tDeg * Math.PI) / 180;
  const k = (tiltDeg * Math.PI) / 180;
  const x = A * Math.cos(t);
  const y = B * Math.sin(t);
  return { x: CX + x * Math.cos(k) - y * Math.sin(k), y: CY + x * Math.sin(k) + y * Math.cos(k), front: Math.sin(t) > 0 };
}

function arc(from: number, to: number, tilt: number) {
  const pts: string[] = [];
  for (let d = from; d <= to; d += 4) {
    const p = point(d, tilt);
    pts.push(`${pts.length ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/** A stretch of orbit split into the part behind the globe and the part in front, so each can
 *  be drawn in its own layer and the globe hides what passes behind it. */
function trail(from: number, d: number, tilt: number) {
  const out = { back: '', front: '' };
  if (Math.abs(d) < 0.5) return out;
  const steps = Math.max(2, Math.ceil(Math.abs(d) / 3));
  let prev: 'back' | 'front' | null = null;
  for (let s = 0; s <= steps; s++) {
    const p = point(from + (d * s) / steps, tilt);
    const side = p.front ? 'front' : 'back';
    const xy = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    out[side] += `${side === prev ? 'L' : 'M'}${xy} `;
    // Close the gap at the crossover so the two halves meet.
    if (prev && side !== prev) out[prev] += `L${xy} `;
    prev = side;
  }
  return out;
}

const first = STORIES[0];
const firstTrail = trail(SLOTS[first.from], delta(first), TILT);

/** On the home page the nodes open the matching tab. On a service page (current) they link to the
 *  service pages, with the current one lit. */
export function Orbit({ current }: { current?: ServiceSlug }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const qa = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];
    const back = q<SVGPathElement>('.orbit__back');
    const front = q<SVGPathElement>('.orbit__front');
    const trailBack = q<SVGPathElement>('.orbit__trail--back');
    const trailFront = q<SVGPathElement>('.orbit__trail--front');
    const sigBack = q<SVGCircleElement>('.orbit__signal--back');
    const sigFront = q<SVGCircleElement>('.orbit__signal--front');
    const pulse = q<SVGCircleElement>('.orbit__pulse');
    const ripple = q<SVGCircleElement>('.orbit__ripple');
    const chips = qa<HTMLElement>('.orbit__chip');
    const spokes = qa<SVGLineElement>('.orbit__spoke');
    const statuses = chips.map((c) => [...c.querySelectorAll<HTMLElement>('.orbit__status > span')]);
    const outcomes = qa<SVGTextElement>('.orbit__outcome');
    // The phone caption sits under the orbit, outside this element.
    const tickers = [...(el.parentElement?.querySelectorAll<HTMLElement>('.orbit__ticker > span') ?? [])];

    // GSAP owns the nodes' transform from here: centring moves from the CSS translate (kept for
    // the no-JS render) to xPercent/yPercent, which stay correct when a node changes width.
    chips.forEach((c) => { c.style.translate = 'none'; gsap.set(c, { xPercent: -50, yPercent: -50 }); });

    const lean = { v: 0 };
    const aim = { v: 0 };
    const onMove = (e: PointerEvent) => { aim.v = (e.clientX / innerWidth - 0.5) * 8; };
    if (!isTouch()) addEventListener('pointermove', onMove, { passive: true });

    // Story state. The first story is already drawn at rest; the loop starts with the second.
    let story = 1;
    let start = gsap.ticker.time + 1.2;
    let shownOutcome = 0;
    const play = (i: number) => { story = i; start = gsap.ticker.time; };
    const onEnter = (e: Event) => {
      const i = chips.indexOf((e.currentTarget as HTMLElement).closest('.orbit__chip') as HTMLElement);
      const s = STORIES.findIndex((x) => x.from === i);
      if (s >= 0 && s !== story) play(s);
    };
    const links = chips.map((c) => c.querySelector('a')!);
    links.forEach((a) => { a.addEventListener('pointerenter', onEnter); a.addEventListener('focus', onEnter); });

    const setStatus = (node: number, idx: number) =>
      statuses[node].forEach((s, k) => s.classList.toggle('is-shown', k === idx));

    const tick = (time: number) => {
      const r = gsap.ticker.deltaRatio();
      lean.v += (aim.v - lean.v) * (1 - Math.pow(0.94, r));
      const tilt = TILT + Math.sin(time * 0.35) * 2.2 + lean.v;
      back.setAttribute('d', arc(180, 360, tilt));
      front.setAttribute('d', arc(0, 180, tilt));

      const box = el.getBoundingClientRect();
      const nodes = SLOTS.map((slot) => point(slot, tilt));
      chips.forEach((c, i) => {
        const base = point(SLOTS[i], TILT);
        gsap.set(c, { x: ((nodes[i].x - base.x) / W) * box.width, y: ((nodes[i].y - base.y) / H) * box.height });
        spokes[i].setAttribute('x1', nodes[i].x.toFixed(1));
        spokes[i].setAttribute('y1', nodes[i].y.toFixed(1));
      });

      // Advance the story.
      let e = time - start;
      if (e < 0) return; // first story still on show
      let tl = timeline(story);
      if (e >= tl.end) { play((story + 1) % STORIES.length); e = 0; tl = timeline(story); }
      const s = STORIES[story];
      const a = SLOTS[s.from];

      // Nodes: the source lights up from the start, the receiver when the packet arrives.
      chips.forEach((c, i) => {
        const on = (i === s.from && e < tl.end) || (i === s.to && e >= tl.arrive);
        c.classList.toggle('is-on', on);
        setStatus(i, i === s.from ? s.fromS : i === s.to && e >= tl.arrive ? s.toS : 0);
      });

      // Packet along the orbit, leaving a pink trail that fades after arrival.
      const k = gsap.parseEase('power2.inOut')(Math.min(1, Math.max(0, (e - LEAD) / (tl.arrive - LEAD))));
      const tr = trail(a, tl.d * k, tilt);
      trailBack.setAttribute('d', tr.back);
      trailFront.setAttribute('d', tr.front);
      const fade = e < tl.arrive ? 1 : Math.max(0, 1 - (e - tl.arrive) / 1.2);
      trailBack.style.opacity = trailFront.style.opacity = String(e < LEAD ? 0 : fade);
      const p = point(a + tl.d * k, tilt);
      const travelling = e >= LEAD && e < tl.arrive;
      const hidden = !p.front && Math.hypot(p.x - CX, p.y - CY) < R + 4; // behind the globe
      for (const c of [sigBack, sigFront]) { c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); }
      sigBack.style.opacity = travelling && !p.front && !hidden ? '1' : '0';
      sigFront.style.opacity = travelling && p.front ? '1' : '0';

      // The result drops down the receiver's spoke into the business.
      const to = nodes[s.to];
      const reach = 1 - (R + 4) / Math.hypot(to.x - CX, to.y - CY);
      const sp = Math.min(1, Math.max(0, (e - tl.spoke) / (tl.land - tl.spoke)));
      const inSpoke = e >= tl.spoke && e < tl.land;
      pulse.setAttribute('cx', (to.x + (CX - to.x) * sp * reach).toFixed(1));
      pulse.setAttribute('cy', (to.y + (CY - to.y) * sp * reach).toFixed(1));
      pulse.style.opacity = inSpoke ? '1' : '0';
      spokes.forEach((l, i) => l.classList.toggle('is-hot', i === s.to && e >= tl.arrive && e < tl.land + 0.6));

      // On landing: a ripple from the globe, and the outcome is named.
      const rp = (e - tl.land) / 0.9;
      ripple.setAttribute('r', String(R + 4 + Math.min(1, Math.max(0, rp)) * 26));
      ripple.style.opacity = rp >= 0 && rp < 1 ? String(0.9 * (1 - rp)) : '0';
      if (e >= tl.land && shownOutcome !== story) {
        shownOutcome = story;
        outcomes.forEach((o, i) => o.classList.toggle('is-shown', i === story));
        tickers.forEach((t, i) => t.classList.toggle('is-shown', i === story));
      }
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
    });
    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      removeEventListener('pointermove', onMove);
      links.forEach((a) => { a.removeEventListener('pointerenter', onEnter); a.removeEventListener('focus', onEnter); });
      chips.forEach((c) => { gsap.set(c, { clearProps: 'transform' }); c.style.translate = ''; });
    };
  }, []);

  const startPt = point(SLOTS[first.from] + delta(first), TILT);
  return (
    <div className="orbit-wrap">
      <div className="orbit" ref={root}>
        <svg className="orbit__layer orbit__layer--back" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {SLOTS.map((slot, i) => {
            const p = point(slot, TILT);
            return <line key={slot} className={`orbit__spoke${i === first.to ? ' is-hot' : ''}`} x1={p.x} y1={p.y} x2={CX} y2={CY} />;
          })}
          <circle className="orbit__pulse" r="4" cx={CX} cy={CY} />
          <path className="orbit__back" d={arc(180, 360, TILT)} />
          <path className="orbit__trail orbit__trail--back" d={firstTrail.back} />
          <circle className="orbit__signal orbit__signal--back" r="6" cx={startPt.x} cy={startPt.y} />
        </svg>
        <svg className="orbit__layer orbit__layer--front" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <circle className="orbit__ripple" cx={CX} cy={CY} r={R} />
          <circle className="orbit__globe" cx={CX} cy={CY} r={R} />
          <text className="orbit__core" x={CX} y={CY - 5} textAnchor="middle">your business</text>
          {STORIES.map((s, i) => (
            <text key={s.outcome} className={`orbit__outcome${i === 0 ? ' is-shown' : ''}`} x={CX} y={CY + 15} textAnchor="middle">
              → {s.outcome}
            </text>
          ))}
          <path className="orbit__front" d={arc(0, 180, TILT)} />
          <path className="orbit__trail orbit__trail--front" d={firstTrail.front} />
          <circle className="orbit__signal orbit__signal--front" r="6" cx={startPt.x} cy={startPt.y} />
        </svg>
        <ul className="orbit__chips" aria-label={current ? 'all services' : 'services'}>
          {services.map((s, i) => {
            const p = point(SLOTS[i], TILT);
            const shown = i === first.from ? first.fromS : i === first.to ? first.toS : 0;
            const inner = (
              <>
                <span className="orbit__n" aria-hidden="true">0{i + 1}</span>
                <span className="orbit__name">
                  <span className="orbit__label">{s.tab}</span>
                  <span className="orbit__status" aria-hidden="true">
                    {STATUS[i].map((t, k) => <span key={t} className={k === shown ? 'is-shown' : undefined}>{t}</span>)}
                  </span>
                </span>
                <span className="orbit__short" aria-hidden="true">{SHORT[s.slug]}</span>
              </>
            );
            const on = i === first.from || i === first.to;
            return (
              <li
                key={s.slug}
                className={`orbit__chip${p.front ? ' is-front' : ''}${on ? ' is-on' : ''}`}
                style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
              >
                {current ? (
                  <a href={`/services/${s.slug}/`} aria-current={s.slug === current ? 'page' : undefined}>{inner}</a>
                ) : (
                  <a href="#services" onClick={() => dispatchEvent(new CustomEvent(TAB_EVENT, { detail: s.slug }))}>{inner}</a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {/* Phones: the nodes carry short names only, so one line narrates the current handoff. */}
      <p className="orbit__ticker" aria-hidden="true">
        {STORIES.map((s, i) => (
          <span key={s.outcome} className={i === 0 ? 'is-shown' : undefined}>
            <b>{SHORT[services[s.from].slug]} → {SHORT[services[s.to].slug]}</b> {STATUS[s.to][s.toS]}, {s.outcome}
          </span>
        ))}
      </p>
    </div>
  );
}
