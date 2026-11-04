'use client';
// Home hero visual: a sales pipeline that leaks, then gets fixed. Owns the DOM (poster, canvas,
// projected labels with live stage counts, stage strip, pause) and the clock; three.js loads lazily
// after the page has painted and only runs while the figure is on screen.
// Reduced motion: one still 3D frame of the fixed pipeline. No WebGL / Save-Data: the poster image.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { isTouch, onScroll, prefersReducedMotion } from '@/engine';
import { CYCLE, RUN1_AT, services, stages, wasCounts } from './scene/layout';
import { STAGE_NAMES, STILL_T } from './scene/GTMAnimationController';
import type { GTMSceneHandle, SceneInput } from './scene/GTMScene';

// Stage counts and the market tag hang below their anchor (on the plinth in front of the track).
const hangs = (i: number) => i < stages.length || i === stages.length + services.length + 1; // + 1: after the strategy tag

const N_STAGE = stages.length;
const N_SVC = services.length;
const SHORT: Record<string, string> = { opportunity: 'opp', 'closed won': 'won', 'paid media': 'paid' };
const label = (name: string) => (SHORT[name]
  ? <><span className="gtm__long">{name}</span><span className="gtm__short">{SHORT[name]}</span></>
  : name);

export function GTMHero() {
  const figRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fig = figRef.current!, canvas = canvasRef.current!;
    const params = new URLSearchParams(location.search);
    const forced = params.get('gtm-still'); // QA and poster capture: freeze at this loop time
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (forced === null && (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2))) {
      fig.dataset.mode = 'poster';
      return;
    }
    const still = prefersReducedMotion() || forced !== null;
    const stillT = forced ? parseFloat(forced) || STILL_T : STILL_T;
    const lowPower = matchMedia('(max-width: 899px)').matches || isTouch();
    const input: SceneInput = { pointerX: 0, pointerY: 0, scroll: 0, time: 0 };
    const tags = [...tagsRef.current!.children] as HTMLElement[];
    const countEls = tags.slice(0, N_STAGE).map((el) => el.querySelector<HTMLElement>('.gtm__n')!);
    const shownCounts = new Int32Array(N_STAGE).fill(-1);
    const steps = [...stepsRef.current!.children] as HTMLElement[];
    const pos = new Float32Array(tags.length * 2);
    let handle: GTMSceneHandle | null = null;
    let disposed = false, visible = false, t = 0, lastStage = -1, lastRun = -1;

    type Frame = { state: { stage: number; label: number; services: number; t: number }; counts: Int32Array; activity: Float32Array };
    const applyDom = (r: Frame) => {
      handle!.project(pos);
      const st = r.state;
      tags.forEach((el, i) => {
        if (i === tags.length - 1) return; // final label: placed by CSS
        el.style.transform = `translate3d(${pos[i * 2].toFixed(1)}px, ${pos[i * 2 + 1].toFixed(1)}px, 0) translate(-50%, ${hangs(i) ? '0%' : '-100%'})`;
      });
      for (let g = 0; g < N_STAGE; g++) {
        if (r.counts[g] !== shownCounts[g]) { shownCounts[g] = r.counts[g]; countEls[g].textContent = String(r.counts[g]); }
      }
      for (let k = 0; k < N_SVC; k++) {
        const el = tags[N_STAGE + k];
        el.style.opacity = String(st.services);
        el.classList.toggle('is-active', r.activity[k] > 0.35 && st.services > 0.9);
      }
      tags[N_STAGE + N_SVC].style.opacity = String(st.services); // gtm strategy
      tags[tags.length - 1].style.opacity = String(st.label);
      const run = st.t >= RUN1_AT ? 1 : 0;
      if (run !== lastRun) { lastRun = run; fig.classList.toggle('is-fixed', run === 1); }
      if (st.stage !== lastStage) {
        lastStage = st.stage;
        steps.forEach((s, i) => s.classList.toggle('is-on', i === lastStage));
      }
      barRef.current!.style.transform = `scaleX(${(st.t / CYCLE).toFixed(4)})`;
    };

    const dpr = () => Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);
    const resize = () => {
      if (!handle) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      handle.setSize(width, height, dpr());
      if (still) applyDom(handle.frame(stillT, 0, input, true));
    };
    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '80px' });

    // Phones and touch devices render at 30 fps so scrolling keeps the main thread.
    const minStep = lowPower ? 1 / 31 : 0;
    let acc = 0;
    const tick = (_time: number, deltaMs: number) => {
      if (!handle || !visible || pausedRef.current || document.hidden) return;
      acc += deltaMs / 1000;
      if (acc < minStep) return;
      const dt = Math.min(acc, 1 / 15);
      acc = 0;
      t = (t + dt) % CYCLE;
      input.time += dt;
      applyDom(handle.frame(t, dt, input));
    };
    const onMove = (e: PointerEvent) => {
      input.pointerX = (e.clientX / innerWidth) * 2 - 1;
      input.pointerY = (e.clientY / innerHeight) * 2 - 1;
    };
    const hero = fig.closest('section') ?? fig;
    const offScroll = onScroll(({ y }) => { input.scroll = Math.min(1, Math.max(0, y / Math.max(1, hero.clientHeight))); });

    const start = async () => {
      const mod = await import('./scene/GTMScene');
      if (disposed) return;
      try {
        handle = mod.createGTMScene(canvas, { lowPower });
      } catch {
        fig.dataset.mode = 'poster'; // no WebGL
        return;
      }
      ro.observe(canvas);
      io.observe(fig);
      const { width, height } = canvas.getBoundingClientRect();
      handle.setSize(Math.max(2, width), Math.max(2, height), dpr());
      if (still) {
        applyDom(handle.frame(stillT, 0, input, true));
        fig.dataset.mode = 'still';
        return;
      }
      applyDom(handle.frame(0, 0, input, true));
      fig.dataset.mode = 'gl';
      if (!isTouch()) addEventListener('pointermove', onMove, { passive: true });
      gsap.ticker.add(tick);
    };
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 250));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => { void start(); }, { timeout: 1200 });

    return () => {
      disposed = true;
      cancel(id);
      gsap.ticker.remove(tick);
      removeEventListener('pointermove', onMove);
      offScroll();
      ro.disconnect();
      io.disconnect();
      handle?.dispose();
    };
  }, []);

  const toggle = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  return (
    <figure ref={figRef} className="gtm" aria-labelledby="gtm-caption">
      <div className="gtm__stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- static fallback only, shown without WebGL */}
        <img className="gtm__poster" src="/hero/gtm-engine.png" alt="" width={1208} height={1088} loading="lazy" decoding="async" />
        <canvas ref={canvasRef} className="gtm__canvas" aria-hidden="true" />
        <div ref={tagsRef} className="gtm__tags" aria-hidden="true">
          {stages.map((s, g) => (
            <span key={s.id} className={`gtm__tag gtm__tag--stage${g === N_STAGE - 1 ? ' gtm__tag--won' : ''}`}>
              {label(s.name)} <b className="gtm__n">0</b>
              <span className="gtm__was">was {wasCounts[g]}</span>
            </span>
          ))}
          {services.map((s) => <span key={s.id} className="gtm__tag gtm__tag--svc">{label(s.name)}</span>)}
          <span className="gtm__tag gtm__tag--svc gtm__tag--strategy">gtm strategy</span>
          <span className="gtm__tag gtm__tag--in">the market</span>
          <span className="gtm__final">one connected gtm engine.</span>
        </div>
      </div>
      <div className="gtm__bar">
        <div className="gtm__track" aria-hidden="true">
          <ol ref={stepsRef} className="gtm__steps">
            {STAGE_NAMES.map((s, i) => (
              <li key={s} className={i === 0 ? 'is-on' : undefined}><b>0{i + 1}</b> <span>{s}</span></li>
            ))}
          </ol>
          <i className="gtm__progress"><i ref={barRef} /></i>
        </div>
        <button type="button" className="gtm__pause" onClick={toggle} aria-pressed={paused}>
          {paused ? 'play' : 'pause'}<span className="sr-only"> animation</span>
        </button>
      </div>
      <figcaption id="gtm-caption" className="sr-only">
        An animated sales pipeline. Accounts leave the market and pass through stages: contacted,
        replied, meeting, opportunity and closed won. Without strategy and with disconnected teams, prospects
        leak out at every handoff and none close. Then GTM strategy picks the right accounts, outbound,
        paid media, content, ABM and RevOps each close one handoff, and one connected engine links them:
        far more accounts reach every stage, and nine close.
      </figcaption>
    </figure>
  );
}
