'use client';
// "how it works": the five steps sit on one route line with square nodes, the same element as the
// workflow connectors. A pink signal travels the line and each node lights as it passes.
// Horizontal on desktop, vertical on phones. Still under reduced motion.
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { howItWorks } from '@/data/site';
import { usePage } from '@/engine/next';
import { isMobile, prefersReducedMotion } from '@/engine/env';

export function Route() {
  const root = useRef<HTMLDivElement>(null);

  usePage(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const dot = el.querySelector<HTMLElement>('.route__signal')!;
    const nodes = [...el.querySelectorAll<HTMLElement>('.route__node')];
    const build = () => {
      const vertical = isMobile();
      const box = el.getBoundingClientRect();
      const pos = nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return vertical ? r.top + r.height / 2 - box.top : r.left + r.width / 2 - box.left;
      });
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
      tl.add(() => nodes.forEach((n) => n.classList.remove('is-lit')));
      tl.set(dot, { autoAlpha: 1, x: vertical ? 0 : pos[0], y: vertical ? pos[0] : 0 });
      pos.forEach((p, i) => {
        if (i > 0) tl.to(dot, { [vertical ? 'y' : 'x']: p, duration: 1.1, ease: 'power2.inOut' });
        tl.add(() => nodes[i].classList.add('is-lit'));
        tl.to({}, { duration: 0.25 });
      });
      tl.to(dot, { autoAlpha: 0, duration: 0.3 });
      return tl;
    };
    let tl = build();
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'bottom top',
      onToggle: (s) => (s.isActive ? tl.play() : tl.pause()),
    });
    const ro = new ResizeObserver(() => {
      const playing = tl.isActive();
      tl.kill();
      tl = build();
      if (playing || st.isActive) tl.play();
    });
    ro.observe(el);
    return () => { ro.disconnect(); tl.kill(); st.kill(); nodes.forEach((n) => n.classList.remove('is-lit')); };
  });

  return (
    <div className="route" ref={root}>
      <span className="route__line" aria-hidden="true" />
      <span className="route__signal" aria-hidden="true" />
      <ol className="route__list">
        {howItWorks.steps.map((s, i) => (
          <li key={s.name} className="route__step">
            <span className="route__node" aria-hidden="true" />
            <p className="label">0{i + 1} / {s.name}</p>
            <h3 className="route__title">{s.title}</h3>
            <p className="route__text">{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
