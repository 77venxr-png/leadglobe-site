'use client';
// Home hero visual: a sales pipeline that leaks, then gets fixed, told in three chapters.
// Desktop (fine pointer, â‰¥ 900px): the figure is pinned and scroll is the clock, so the reader
// moves the story. Phones / touch: the same story autoplays on a 13 s loop with a pause button.
// Reduced motion: one still 3D frame of the fixed pipeline. No WebGL / Save-Data: the poster image.
// Owns the DOM (poster, canvas, service tags, chapter captions, scoreboard) and the clock; three.js
// loads lazily after first paint and only renders while the figure is on screen.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { isTouch, prefersReducedMotion } from '@/engine';
import { hero } from '@/data/site';
import { CYCLE, RUN1_AT, fixedCounts, services, stages, wasCounts } from './scene/layout';
import { CHAPTER_T, STILL_T, chapterAt } from './scene/GTMAnimationController';
import type { GTMSceneHandle, SceneInput } from './scene/GTMScene';

/** Same query as the pinned layout in globals.css (`.story`). */
export const SCROLL_MQ = '(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

const N_STAGE = stages.length;
const N_SVC = services.length;
const N_TAGS = N_SVC + 1; // services + gtm strategy
const SHORT: Record<string, string> = { opportunity: 'opp', 'closed won': 'won', 'paid media': 'paid' };
const label = (name: string) => (SHORT[name]
  ? <><span className="gtm__long">{name}</span><span className="gtm__short">{SHORT[name]}</span></>
  : name);

// Scroll map: four short holds (start, between chapters, end) and three equal chapter spans.
const HOLD = 0.05;
const SPAN = (1 - HOLD * 4) / 3;
const chapterStart = (i: number) => HOLD + i * (SPAN + HOLD);
/** Scroll progress (0â€“1 across the pinned distance) to story time. */
function scrollToStory(p: number) {
  for (let i = 2; i >= 0; i--) {
    const a = chapterStart(i);
    if (p >= a) {
      const [t0, t1] = CHAPTER_T[i];
      return t0 + (t1 - t0) * Math.min(1, (p - a) / SPAN);
    }
  }
  return 0;
}
const chapterOf = (p: number) => (p < chapterStart(1) - HOLD / 2 ? 0 : p < chapterStart(2) - HOLD / 2 ? 1 : 2);

export function GTMHero() {
  const figRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLOListElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLOListElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fig = figRef.current!, canvas = canvasRef.current!;
    const story = fig.closest<HTMLElement>('.story');
    const tags = [...tagsRef.current!.children] as HTMLElement[];
    const chapters = [...chaptersRef.current!.children] as HTMLElement[];
    const cols = [...scoreRef.current!.children] as HTMLElement[];
    const nums = cols.map((el) => el.querySelector<HTMLElement>('.gtm__n')!);
    const shownCounts = new Int32Array(N_STAGE).fill(-1);
    let lastChapter = -1, lastFixed = -1, lastActive = -2, lastShown = -1;

    const setChapter = (c: number) => {
      if (c === lastChapter) return;
      lastChapter = c;
      chapters.forEach((el, i) => el.classList.toggle('is-on', i === c));
      indexRef.current!.textContent = `0${c + 1}`;
    };

    const params = new URLSearchParams(location.search);
    const forced = params.get('gtm-still'); // QA and poster capture: freeze at this loop time
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (forced === null && (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2))) {
      fig.dataset.mode = 'poster';
      setChapter(2);
      return;
    }
    const still = prefersReducedMotion() || forced !== null;
    const stillT = forced ? parseFloat(forced) || STILL_T : STILL_T;
    const lowPower = matchMedia('(max-width: 899px)').matches || isTouch();
    const scrollMq = matchMedia(SCROLL_MQ);
    const input: SceneInput = { pointerX: 0, pointerY: 0, scroll: 0, time: 0 };
    const pos = new Float32Array((N_STAGE + N_TAGS) * 2);
    let handle: GTMSceneHandle | null = null;
    let disposed = false, visible = false, t = 0, shownT = 0;
    let storyTop = 0, storyRun = 1;

    type Frame = { state: { stage: number; services: number; t: number }; counts: Int32Array; activity: Float32Array };
    const applyDom = (r: Frame, progress: number, chapter: number) => {
      handle!.project(pos);
      const st = r.state;
      // scoreboard: one column under each stage
      for (let g = 0; g < N_STAGE; g++) {
        cols[g].style.transform = `translate3d(${pos[g * 2].toFixed(1)}px, 0, 0) translateX(-50%)`;
        if (r.counts[g] !== shownCounts[g]) { shownCounts[g] = r.counts[g]; nums[g].textContent = String(r.counts[g]); }
      }
      const fixed = st.t >= RUN1_AT ? 1 : 0;
      if (fixed !== lastFixed) { lastFixed = fixed; fig.classList.toggle('is-fixed', fixed === 1); }
      // service tags: all of them while the modules dock, then only the one at work
      let active = -1, best = 0.35;
      for (let k = 0; k < N_SVC; k++) if (r.activity[k] > best) { best = r.activity[k]; active = k; }
      if (st.services < 0.9) active = -1;
      // 0 none, 1 active only, 2 all (while the modules dock in chapter 2)
      const shownMode = st.stage === 1 && st.t > 5.35 ? 2 : st.services < 0.5 ? 0 : 1;
      if (active !== lastActive || shownMode !== lastShown) {
        lastActive = active; lastShown = shownMode;
        for (let k = 0; k < N_SVC; k++) {
          tags[k].classList.toggle('is-active', k === active);
          tags[k].classList.toggle('is-shown', shownMode === 2 || (shownMode === 1 && k === active));
        }
        tags[N_SVC].classList.toggle('is-shown', shownMode === 2);
      }
      for (let k = 0; k < N_TAGS; k++) {
        const a = N_STAGE + k;
        tags[k].style.transform = `translate3d(${pos[a * 2].toFixed(1)}px, ${pos[a * 2 + 1].toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
      setChapter(chapter);
      barRef.current!.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    // The pin sticks at `top: var(--header)`: it starts when the story's top reaches the header
    // and ends when the story's bottom reaches the viewport bottom.
    const pin = fig.closest<HTMLElement>('.story__pin');
    const measure = () => {
      if (!story) return;
      const r = story.getBoundingClientRect();
      const offset = pin ? parseFloat(getComputedStyle(pin).top) || 0 : 0;
      storyTop = r.top + scrollY - offset;
      storyRun = Math.max(1, r.height - innerHeight + offset);
    };
    const scrollProgress = () => Math.min(1, Math.max(0, (scrollY - storyTop) / storyRun));

    const render = (dt: number, snap = false) => {
      if (still) {
        applyDom(handle!.frame(stillT, 0, input, true), 1, chapterAt(2));
        return;
      }
      if (scrollMq.matches && story) {
        const p = scrollProgress();
        const target = scrollToStory(p);
        // ease the shown time towards the scroll target so wheel steps glide
        shownT = snap ? target : shownT + (target - shownT) * (1 - Math.exp(-dt * 7));
        input.scroll = 0;
        applyDom(handle!.frame(shownT, dt, input, snap), p, chapterOf(p));
      } else {
        if (!pausedRef.current) t = (t + dt) % CYCLE;
        const r = handle!.frame(t, dt, input, snap);
        applyDom(r, t / CYCLE, chapterAt(r.state.stage));
      }
    };

    const dpr = () => Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 2);
    const resize = () => {
      measure();
      if (!handle) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (width < 2 || height < 2) return;
      handle.setSize(width, height, dpr());
      render(0, true);
    };
    const ro = new ResizeObserver(resize);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '80px' });

    // Phones and touch devices render at 30 fps so scrolling keeps the main thread.
    const minStep = lowPower ? 1 / 31 : 0;
    let acc = 0;
    const tick = (_time: number, deltaMs: number) => {
      if (!handle || !visible || document.hidden) return;
      if (pausedRef.current && !scrollMq.matches) return;
      acc += deltaMs / 1000;
      if (acc < minStep) return;
      const dt = Math.min(acc, 1 / 15);
      acc = 0;
      input.time += dt;
      render(dt);
    };
    const onMove = (e: PointerEvent) => {
      input.pointerX = (e.clientX / innerWidth) * 2 - 1;
      input.pointerY = (e.clientY / innerHeight) * 2 - 1;
    };

    const start = async () => {
      const mod = await import('./scene/GTMScene');
      if (disposed) return;
      try {
        handle = mod.createGTMScene(canvas, { lowPower });
      } catch {
        fig.dataset.mode = 'poster'; // no WebGL
        setChapter(2);
        return;
      }
      measure();
      ro.observe(canvas);
      if (story) ro.observe(story);
      io.observe(fig);
      const { width, height } = canvas.getBoundingClientRect();
      handle.setSize(Math.max(2, width), Math.max(2, height), dpr());
      render(0, true);
      fig.dataset.mode = still ? 'still' : 'gl';
      if (still) return;
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
      <div className="gtm__head" aria-hidden="true">
        <p className="gtm__index"><b ref={indexRef}>01</b> / 03</p>
        <ol ref={chaptersRef} className="gtm__chapters">
          {hero.chapters.map((c, i) => <li key={c} className={i === 0 ? 'is-on' : undefined}>{c}</li>)}
        </ol>
        <p className="gtm__hint">scroll to fix it</p>
      </div>
      <div className="gtm__stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- static fallback only, shown without WebGL */}
        <img className="gtm__poster" src="/hero/gtm-engine.png" alt="" width={1651} height={929} loading="lazy" decoding="async" />
        <canvas ref={canvasRef} className="gtm__canvas" aria-hidden="true" />
        <div ref={tagsRef} className="gtm__tags" aria-hidden="true">
          {services.map((s) => <span key={s.id} className="gtm__tag">{label(s.name)}</span>)}
          <span className="gtm__tag gtm__tag--strategy">gtm strategy</span>
        </div>
      </div>
      <ol ref={scoreRef} className="gtm__score" aria-hidden="true">
        {stages.map((s, g) => (
          <li key={s.id} className={g === N_STAGE - 1 ? 'is-won' : undefined}>
            <span className="gtm__nums"><s className="gtm__was">{wasCounts[g]}</s><b className="gtm__n">{fixedCounts[g]}</b></span>
            <span className="gtm__stagename">{label(s.name)}</span>
          </li>
        ))}
      </ol>
      <div className="gtm__foot">
        <i className="gtm__progress" aria-hidden="true"><i ref={barRef} /></i>
        <button type="button" className="gtm__pause" onClick={toggle} aria-pressed={paused}>
          {paused ? 'play' : 'pause'}<span className="sr-only"> animation</span>
        </button>
      </div>
      <figcaption id="gtm-caption" className="sr-only">
        An animated sales pipeline in three chapters. First, accounts leave the market and pass through
        contacted, replied, meeting, opportunity and closed won, but with no strategy and disconnected teams
        prospects leak out at every handoff: 16 accounts, 10 contacted, 6 replied, 3 meetings, 1 opportunity,
        none closed. Then GTM strategy picks the right accounts and outbound, paid media, content, ABM and
        RevOps each close one handoff. Finally the connected pipeline carries 16 accounts to 15 contacted,
        13 replied, 12 meetings, 10 opportunities and 9 closed won.
      </figcaption>
    </figure>
  );
}
