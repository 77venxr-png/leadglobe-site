'use client';
// The services centrepiece: five tabs, a split panel (copy + numbered capabilities | live workflow).
// All five panels stay in the DOM, stacked in one grid cell, so the section keeps the height of
// the tallest panel and never jumps when the tab changes. Inactive panels are hidden and inert.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { services, type ServiceSlug } from '@/data/site';
import { ease, prefersReducedMotion } from '@/engine/env';
import { Workflow } from './flow/workflows';

export const TAB_EVENT = 'lg:select-service';

export function ServiceTabs() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const first = useRef(true);

  const select = useCallback((i: number, focus = false) => {
    setActive(i);
    const tab = tabs.current[i];
    if (!tab) return;
    if (focus) tab.focus({ preventScroll: true });
    // Keep the selected tab visible in the horizontal scroller (phones) without moving the page.
    const list = tab.parentElement!;
    const left = tab.offsetLeft; // .svc__tabs is position: relative, so this is list-relative
    if (left < list.scrollLeft || left + tab.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: left - 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }, []);

  // Other parts of the page (hero orbit chips) can open a tab.
  useEffect(() => {
    const on = (e: Event) => {
      const i = services.findIndex((s) => s.slug === (e as CustomEvent<ServiceSlug>).detail);
      if (i >= 0) select(i);
    };
    addEventListener(TAB_EVENT, on);
    return () => removeEventListener(TAB_EVENT, on);
  }, [select]);

  // Incoming panel: copy rises in, numbered list staggers.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const panel = panels.current[active];
    if (!panel || prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(panel.querySelectorAll('[data-rise]'), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: ease.out, stagger: 0.05 })
      .fromTo(panel.querySelectorAll('.caps li'), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: ease.out, stagger: 0.035 }, 0.12)
      .fromTo(panel.querySelector('.flow'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: ease.out }, 0.05);
    return () => { tl.kill(); };
  }, [active]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = services.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    select(to, true);
  };

  return (
    <div className="svc">
      <div className="svc__tabs" role="tablist" aria-label="leadglobe services" data-lenis-prevent-horizontal>
        {services.map((s, i) => (
          <button
            key={s.slug}
            ref={(el) => { tabs.current[i] = el; }}
            className="svc__tab"
            role="tab"
            id={`tab-${s.slug}`}
            aria-selected={active === i}
            aria-controls={`panel-${s.slug}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="svc__tab-num" aria-hidden="true">0{i + 1}</span>
            <span>{s.tab}</span>
          </button>
        ))}
      </div>

      <div className="svc__stage">
        {services.map((s, i) => (
          <div
            key={s.slug}
            ref={(el) => { panels.current[i] = el; }}
            className={`svc__panel${active === i ? ' is-active' : ''}`}
            role="tabpanel"
            id={`panel-${s.slug}`}
            aria-labelledby={`tab-${s.slug}`}
            inert={active !== i}
            tabIndex={active === i ? 0 : -1}
          >
            <div className="svc__copy">
              <p className="label" data-rise>{s.label}</p>
              <h3 className="svc__headline" data-rise>{s.headline}</h3>
              <p className="svc__desc" data-rise>{s.description}</p>
              <Link className="arrow-link" href={`/services/${s.slug}/`} data-rise>
                <span>learn more<span className="sr-only"> about {s.tab}</span></span>
                <span className="arrow-link__arrow" aria-hidden="true">→</span>
              </Link>
              <ol className="caps" aria-label={`${s.tab} capabilities`}>
                {s.capabilities.map((c, k) => (
                  <li key={c.name}><span className="caps__n" aria-hidden="true">0{k + 1}</span>{c.name}</li>
                ))}
              </ol>
            </div>
            <div className="svc__visual">
              <Workflow slug={s.slug} active={active === i} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
