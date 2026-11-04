'use client';
// A workflow canvas: nodes laid out on a CSS grid, connectors measured from the real DOM and
// drawn in an SVG underneath, and a pink signal that routes along them (the site's motion verb).
//
//   <Flow edges={[['a', 'rec'], ['rec', 'out']]} areas={…} areasMobile={…} cols="…" result="out">
//     <Node id="a">…</Node> …
//   </Flow>
//
// Edges run in levels: every edge that leaves a node with no incoming edge plays first, then the
// next level, so merging sources arrive together. The loop is paused off screen and when the
// flow is not `active` (an inactive tab). Under reduced motion the connectors draw statically
// and every status shows its final state.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, prefersReducedMotion } from '@/engine/env';

gsap.registerPlugin(ScrollTrigger);

type Edge = [from: string, to: string];
type Side = 'left' | 'right' | 'top' | 'bottom';
type Wire = { key: string; from: string; to: string; d: string; start: [number, number]; end: [number, number] };

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Flow({
  edges,
  areas,
  areasMobile,
  cols,
  colsMobile = '1fr',
  result,
  active = true,
  label,
  children,
}: {
  edges: Edge[];
  areas: string;
  areasMobile: string;
  cols: string;
  colsMobile?: string;
  result: string;
  active?: boolean;
  label: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const [size, setSize] = useState<[number, number]>([0, 0]);

  // Measure nodes and route the connectors. Re-runs on any size change of the canvas.
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const rect = (id: string) => {
        const n = el.querySelector<HTMLElement>(`[data-node="${id}"]`);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top, w: r.width, h: r.height };
      };
      type R = NonNullable<ReturnType<typeof rect>>;
      const routed = edges
        .map(([from, to]) => {
          const a = rect(from);
          const b = rect(to);
          if (!a || !b) return null;
          const out: Side = b.l >= a.r - 4 ? 'right' : b.t >= a.b - 4 ? 'bottom' : b.r <= a.l + 4 ? 'left' : 'top';
          const inn: Side = ({ right: 'left', left: 'right', bottom: 'top', top: 'bottom' } as const)[out];
          return { from, to, a, b, out, inn };
        })
        .filter((x): x is { from: string; to: string; a: R; b: R; out: Side; inn: Side } => !!x);

      // Spread several connectors that meet the same side of one node, so they arrive side by side.
      const slot = (list: typeof routed, key: (e: (typeof routed)[number]) => string) => {
        const groups = new Map<string, number[]>();
        list.forEach((e, i) => groups.set(key(e), [...(groups.get(key(e)) || []), i]));
        const pos = new Array<number>(list.length).fill(0.5);
        groups.forEach((ids) => ids.forEach((i, k) => (pos[i] = ids.length === 1 ? 0.5 : 0.3 + (0.4 * k) / (ids.length - 1))));
        return pos;
      };
      const inSlots = slot(routed, (e) => `${e.to}:${e.inn}`);
      const outSlots = slot(routed, (e) => `${e.from}:${e.out}`);

      const anchor = (r: R, side: Side, f: number): [number, number] =>
        side === 'left' ? [r.l, r.t + r.h * f]
        : side === 'right' ? [r.r, r.t + r.h * f]
        : side === 'top' ? [r.l + r.w * f, r.t]
        : [r.l + r.w * f, r.b];

      setWires(
        routed.map((e, i) => {
          let s = anchor(e.a, e.out, outSlots[i]);
          let t = anchor(e.b, e.inn, inSlots[i]);
          const vertical = e.out === 'top' || e.out === 'bottom';
          // Vertical neighbours that overlap horizontally get one straight line.
          if (vertical) {
            const lo = Math.max(e.a.l, e.b.l) + 16;
            const hi = Math.min(e.a.r, e.b.r) - 16;
            if (hi > lo && inSlots[i] === 0.5 && outSlots[i] === 0.5) {
              const x = Math.min(Math.max((s[0] + t[0]) / 2, lo), hi);
              s = [x, s[1]];
              t = [x, t[1]];
            }
          }
          return { key: `${e.from}-${e.to}`, from: e.from, to: e.to, start: s, end: t, d: elbow(s, t, vertical) };
        }),
      );
      setSize([box.width, box.height]);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll('[data-node]').forEach((n) => ro.observe(n));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [edges]);

  // The signal loop.
  useEffect(() => {
    const el = root.current;
    if (!el || !wires.length || !active || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const level = levels(edges);
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true });
      const nodes = (id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`);
      const reset = () => {
        el.querySelectorAll('[data-node]').forEach((n) => n.classList.remove('is-hit', 'is-done'));
      };
      tl.add(reset);
      const maxLevel = Math.max(...wires.map((w) => level.get(w.from) ?? 0));
      let at = 0.2;
      for (let lv = 0; lv <= maxLevel; lv++) {
        const these = wires.filter((w) => (level.get(w.from) ?? 0) === lv);
        if (!these.length) continue;
        these.forEach((w) => {
          const path = el.querySelector<SVGPathElement>(`.flow__wire[data-key="${w.key}"]`);
          const dot = el.querySelector<SVGCircleElement>(`.flow__signal[data-key="${w.key}"]`);
          if (!path || !dot) return;
          const len = path.getTotalLength();
          const p = { v: 0 };
          tl.set(dot, { autoAlpha: 1 }, at);
          tl.to(p, {
            v: 1,
            duration: 0.55 + len / 520,
            ease: 'power2.inOut',
            onUpdate: () => {
              const pt = path.getPointAtLength(p.v * len);
              dot.setAttribute('cx', String(pt.x));
              dot.setAttribute('cy', String(pt.y));
            },
          }, at);
          tl.to(dot, { autoAlpha: 0, duration: 0.2 }, '>-0.05');
          tl.add(() => nodes(w.to)?.classList.add('is-hit'), '<');
        });
        at = tl.duration() + 0.15;
      }
      tl.add(() => nodes(result)?.classList.add('is-done'));
      tl.to({}, { duration: 1.8 });

      el.classList.add('is-live');
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
    }, el);
    return () => {
      ctx.revert();
      el.classList.remove('is-live');
      el.querySelectorAll('[data-node]').forEach((n) => n.classList.remove('is-hit', 'is-done'));
    };
  }, [wires, active, edges, result]);

  // When this flow becomes the active tab, its connectors draw in.
  useEffect(() => {
    const el = root.current;
    if (!el || !active || !wires.length || prefersReducedMotion()) return;
    const paths = el.querySelectorAll<SVGPathElement>('.flow__wire');
    const tw = gsap.fromTo(paths,
      { strokeDashoffset: (_i, p: SVGPathElement) => p.getTotalLength() },
      { strokeDashoffset: 0, duration: 0.9, ease: ease.out, stagger: 0.06 });
    paths.forEach((p) => gsap.set(p, { strokeDasharray: p.getTotalLength() }));
    return () => { tw.kill(); };
  }, [active, wires]);

  const style = { '--areas': areas, '--areas-m': areasMobile, '--cols': cols, '--cols-m': colsMobile } as CSSProperties;

  return (
    <figure className="flow" ref={root} style={style}>
      <svg className="flow__wires" width={size[0]} height={size[1]} viewBox={`0 0 ${size[0] || 1} ${size[1] || 1}`} aria-hidden="true">
        {wires.map((w) => (
          <g key={w.key}>
            <path className="flow__wire" data-key={w.key} d={w.d} />
            <rect className="flow__port" x={w.start[0] - 3} y={w.start[1] - 3} width="6" height="6" />
            <rect className="flow__port" x={w.end[0] - 3} y={w.end[1] - 3} width="6" height="6" />
            <circle className="flow__signal" data-key={w.key} r="4.5" cx={w.start[0]} cy={w.start[1]} />
          </g>
        ))}
      </svg>
      {/* Reading order of every workflow, aligned to the desktop columns. */}
      <ol className="flow__stages" aria-hidden="true">
        <li>input</li>
        <li>the work</li>
        <li>outcome</li>
      </ol>
      <div className="flow__grid">{children}</div>
      <figcaption className="flow__caption">{label}</figcaption>
    </figure>
  );
}

/** Depth of every node from the sources, so edges can play in levels. */
function levels(edges: Edge[]) {
  const depth = new Map<string, number>();
  const incoming = new Map<string, string[]>();
  edges.forEach(([f, t]) => incoming.set(t, [...(incoming.get(t) || []), f]));
  const visit = (n: string, seen = new Set<string>()): number => {
    if (depth.has(n)) return depth.get(n)!;
    if (seen.has(n)) return 0;
    seen.add(n);
    const d = Math.max(-1, ...(incoming.get(n) || []).map((p) => visit(p, seen))) + 1;
    depth.set(n, d);
    return d;
  };
  edges.forEach(([f, t]) => { visit(f); visit(t); });
  return depth;
}

/** Orthogonal connector with small rounded corners. */
function elbow([sx, sy]: [number, number], [ex, ey]: [number, number], vertical: boolean) {
  const r = 8;
  if (vertical) {
    if (Math.abs(sx - ex) < 1) return `M${sx},${sy} V${ey}`;
    const my = (sy + ey) / 2;
    const dy = Math.sign(ey - sy) || 1;
    const dx = Math.sign(ex - sx);
    const k = Math.min(r, Math.abs(ex - sx) / 2, Math.abs(my - sy));
    return `M${sx},${sy} V${my - dy * k} Q${sx},${my} ${sx + dx * k},${my} H${ex - dx * k} Q${ex},${my} ${ex},${my + dy * k} V${ey}`;
  }
  if (Math.abs(sy - ey) < 1) return `M${sx},${sy} H${ex}`;
  const mx = (sx + ex) / 2;
  const dx = Math.sign(ex - sx) || 1;
  const dy = Math.sign(ey - sy);
  const k = Math.min(r, Math.abs(ey - sy) / 2, Math.abs(mx - sx));
  return `M${sx},${sy} H${mx - dx * k} Q${mx},${sy} ${mx},${sy + dy * k} V${ey - dy * k} Q${mx},${ey} ${mx + dx * k},${ey} H${ex}`;
}

/** One node on the canvas. `area` places it on the grid. */
export function Node({ id, area, className = '', children }: { id: string; area?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flow__node ${className}`} data-node={id} style={{ gridArea: area || id }}>
      {children}
    </div>
  );
}
