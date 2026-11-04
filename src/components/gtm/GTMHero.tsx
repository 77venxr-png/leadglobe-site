'use client';
// Home hero visual: the revenue engine. Owns the DOM (poster, canvas, projected labels, stage
// strip, pause) and the clock; three.js loads lazily after the page has painted and only runs
// while the figure is on screen. Reduced motion: one still 3D frame of the finished state.
// No WebGL, Save-Data or very low memory: the poster image (a capture of that same frame).
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { isTouch, onScroll, prefersReducedMotion } from '@/engine';
import { CYCLE, stations } from './scene/layout';
import { STAGES, STILL_T } from './scene/GTMAnimationController';
import type { GTMSceneHandle, SceneInput } from './scene/GTMScene';

const TAGS = [...stations.map((s) => s.name), 'prospects', 'revenue'];
const SHORT: Record<string, string> = { 'gtm strategy': 'strategy', 'paid media': 'paid' };
const STEP_NAMES = ['siloed', 'leaking', 'connected', 'running', 'revenue'];

export function GTMHero() {
  const figRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLParagraphElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fig = figRef.current!, canvas = canvasRef.current!;
    const params = new URLSearchParams(location.search);
    const forced = params.get('gtm-still'); // QA and poster capture: freeze at this loop time
    const reduce = prefersReducedMotion();
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (forced === null && (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2))) {
      fig.dataset.mode = 'poster';
      return;
    }
    const still = reduce || forced !== null;
    const stillT = forced ? parseFloat(forced) || STILL_T : STILL_T;
    const lowPower = matchMedia('(max-width: 899px)').matches || isTouch();
    const input: SceneInput = { pointerX: 0, pointerY: 0, scroll: 0, time: 0 };
    const tags = [...tagsRef.current!.children] as HTMLElement[];
    const steps = [...stepsRef.current!.children] as HTMLElement[];
    const pos = new Float32Array((TAGS.length + 1) * 2);
    let handle: GTMSceneHandle | null = null;
    let disposed = false, visible = false, t = 0, lastStage = -1;

    const applyDom = (r: { state: { stage: number; label: number; t: number }; activity: Float32Array }) => {
      handle!.project(pos);
      tags.forEach((el, i) => {
        el.style.transform = `translate3d(${pos[i * 2].toFixed(1)}px, ${pos[i * 2 + 1].toFixed(1)}px, 0) translate(-50%, -100%)`;
        if (i < stations.length) el.classList.toggle('is-active', r.activity[i] > 0.3);
      });
      tags[tags.length - 1].style.opacity = String(1 - r.state.label); // the final label takes over from "revenue"
      const f = finalRef.current!, k = TAGS.length;
      f.style.opacity = String(r.state.label);
      f.style.transform = `translate3d(${pos[k * 2].toFixed(1)}px, ${(pos[k * 2 + 1] + (1 - r.state.label) * 6).toFixed(1)}px, 0) translate(-50%, -100%)`;
      if (r.state.stage !== lastStage) {
        lastStage = r.state.stage;
        steps.forEach((s, i) => s.classList.toggle('is-on', i === lastStage));
      }
      barRef.current!.style.transform = `scaleX(${(r.state.t / CYCLE).toFixed(4)})`;
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
    // After first paint and the hero intro have had the main thread.
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
          {TAGS.map((name, i) => (
            <span key={name} className={`gtm__tag${i === stations.length ? ' gtm__tag--in' : ''}${i === stations.length + 1 ? ' gtm__tag--out' : ''}`}>{SHORT[name] ? <><span className="gtm__long">{name}</span><span className="gtm__short">{SHORT[name]}</span></> : name}</span>
          ))}
        </div>
        <p ref={finalRef} className="gtm__final" aria-hidden="true">one connected gtm engine.</p>
      </div>
      <div className="gtm__bar">
        <div className="gtm__track" aria-hidden="true">
          <ol ref={stepsRef} className="gtm__steps">
            {STAGES.map((s, i) => (
              <li key={s} className={i === 0 ? 'is-on' : undefined}><b>0{i + 1}</b> <span>{STEP_NAMES[i]}</span></li>
            ))}
          </ol>
          <i className="gtm__progress"><i ref={barRef} /></i>
        </div>
        <button type="button" className="gtm__pause" onClick={toggle} aria-pressed={paused}>
          {paused ? 'play' : 'pause'}<span className="sr-only"> animation</span>
        </button>
      </div>
      <figcaption id="gtm-caption" className="sr-only">
        An animated model of a go-to-market system. Six stations, GTM strategy, outbound, paid media,
        content, ABM and RevOps, start out disconnected, and potential customers fall through the gaps
        between them. A central engine then connects every station, the gaps close, and the same
        customers flow through each station into revenue: one connected GTM engine.
      </figcaption>
    </figure>
  );
}
