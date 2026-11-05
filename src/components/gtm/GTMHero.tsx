'use client';
// Home hero visual: the connected revenue engine. A short disconnected prelude plays once (five
// vendors, accounts leak out where each channel ends), then the system plugs in and runs
// continuously: intelligence -> parallel channels -> sales pipeline, revops underneath, feedback home.
// Desktop (fine pointer, >= 900px): the figure is pinned and scroll moves the focus through four
// chapters (A, B, C, revops). Phones / touch: the focus advances on a timer. The engine clock never
// depends on scroll. Reduced motion: one still connected frame. No WebGL / Save-Data: the poster.
// Owns the DOM (title, chapter captions, status line, projected pills, scoreboard) and the clock;
// three.js loads lazily after first paint and only renders while the figure is on screen.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { isTouch, prefersReducedMotion } from '@/engine';
import { hero } from '@/data/site';
import { CONNECT, LOST, WON, channels, cycleCounts, lostPerCycle, stations } from './scene/layout';
import { STILL_T } from './scene/GTMAnimationController';
import { ANCHOR, HANGS, N_ANCHORS, type GTMSceneHandle, type SceneInput } from './scene/GTMScene';

/** Same query as the pinned layout in globals.css (`.story`). */
export const SCROLL_MQ = '(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

const V = hero.visual;
const N_CH = V.chapters.length;
const CHAPTER_S = 6; // autoplay: seconds per chapter once connected

/** A projected pill: its anchor, the chapter it belongs to (-1 = always, a layer title), and when
 *  its part of the engine exists (so nothing is labelled before it has been built). */
type Pill = { a: number; ch: number; text: string; detail?: string; layer?: boolean; needs?: 'bus' | 'plaques' | 'feedback' | 'connected' };
const PILLS: Pill[] = [
  ...V.layers.map((text, i): Pill => ({ a: ANCHOR.layer[i], ch: -1, text, layer: true, needs: i === 3 ? 'bus' : undefined })),
  ...V.intel.map((text, i): Pill => ({ a: ANCHOR.intel[i], ch: 0, text })),
  ...channels.map((c, i): Pill => ({ a: ANCHOR.channel[i], ch: 1, text: c.name, detail: c.detail })),
  { a: ANCHOR.lost, ch: 2, text: V.lost, needs: 'connected' },
  { a: ANCHOR.intake, ch: 2, text: V.intake, needs: 'connected' },
  ...V.revops.map((text, i): Pill => ({ a: ANCHOR.revops[i], ch: 3, text, needs: 'plaques' })),
  { a: ANCHOR.feedback, ch: 3, text: V.feedback, needs: 'feedback' },
];
const LOST_PILL = PILLS.findIndex((p) => p.a === ANCHOR.lost);
const SCORE = [...stations.map((s) => s.name), WON.name];

type Frame = {
  state: { status: 0 | 1; connected: number; bus: number; plaques: number; feedback: number };
  counts: Int32Array;
  lost: number;
};

export function GTMHero() {
  const figRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLOListElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const scoreRef = useRef<HTMLOListElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fig = figRef.current!, canvas = canvasRef.current!;
    const story = fig.closest<HTMLElement>('.story');
    const pin = fig.closest<HTMLElement>('.story__pin');
    const tags = [...tagsRef.current!.children] as HTMLElement[];
    const lostN = tags[LOST_PILL].querySelector<HTMLElement>('.gtm__tagn')!;
    const chapters = [...chaptersRef.current!.children] as HTMLElement[];
    const status = statusRef.current!;
    const statusText = status.querySelector<HTMLElement>('span')!;
    const cols = [...scoreRef.current!.children] as HTMLElement[];
    const nums = cols.map((el) => el.querySelector<HTMLElement>('.gtm__n')!);
    const shownCounts = new Int32Array(cols.length).fill(-1);
    const shownPill = new Int8Array(PILLS.length).fill(-1);
    let lastChapter = -1, lastStatus = -1, lastLost = -1;

    const setChapter = (c: number) => {
      if (c === lastChapter) return;
      lastChapter = c;
      chapters.forEach((el, i) => el.classList.toggle('is-on', i === c));
      indexRef.current!.textContent = `0${c + 1}`;
    };
    const setStatus = (s: number) => {
      if (s === lastStatus) return;
      lastStatus = s;
      status.classList.toggle('is-on', s === 1);
      statusText.textContent = s === 1 ? V.status.after : V.status.before;
    };

    const params = new URLSearchParams(location.search);
    const forced = params.get('gtm-still'); // QA and poster capture: freeze at this time
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (forced === null && (nav.connection?.saveData || (nav.deviceMemory !== undefined && nav.deviceMemory < 2))) {
      fig.dataset.mode = 'poster';
      setChapter(N_CH - 1);
      setStatus(1);
      return;
    }
    const still = prefersReducedMotion() || forced !== null;
    const stillT = forced ? parseFloat(forced) || STILL_T : STILL_T;
    const lowPower = matchMedia('(max-width: 899px)').matches || isTouch();
    const scrollMq = matchMedia(SCROLL_MQ);
    const input: SceneInput = { pointerX: 0, pointerY: 0, scroll: 0, time: 0 };
    const pos = new Float32Array(N_ANCHORS * 2);
    let handle: GTMSceneHandle | null = null;
    let disposed = false, visible = false, t = 0;
    let storyTop = 0, storyRun = 1;

    const applyDom = (r: Frame, progress: number, chapter: number) => {
      handle!.project(pos);
      const st = r.state;
      // scoreboard: one column under each station, then closed won
      ANCHOR.score.forEach((a, g) => {
        cols[g].style.transform = `translate3d(${pos[a * 2].toFixed(1)}px, 0, 0) translateX(-50%)`;
        if (r.counts[g] !== shownCounts[g]) { shownCounts[g] = r.counts[g]; nums[g].textContent = String(r.counts[g]); }
      });
      if (r.lost !== lastLost) { lastLost = r.lost; lostN.textContent = String(r.lost); }
      // pills: layer titles always, details for the focused chapter, nothing before it is built
      PILLS.forEach((p, i) => {
        const built = !p.needs || (p.needs === 'connected' ? st.connected > 0.9 : st[p.needs] > (p.needs === 'bus' ? 0.5 : 0.9));
        const show = built && (p.layer || p.ch === chapter) ? 1 : 0;
        if (show !== shownPill[i]) { shownPill[i] = show; tags[i].classList.toggle('is-shown', show === 1); }
        if (!show) return;
        tags[i].style.transform = `translate3d(${pos[p.a * 2].toFixed(1)}px, ${pos[p.a * 2 + 1].toFixed(1)}px, 0) translate(-50%, ${HANGS.has(p.a) ? '0%' : '-100%'})`;
      });
      setChapter(chapter);
      setStatus(st.status);
      barRef.current!.style.transform = `scaleX(${Math.min(1, Math.max(0, progress)).toFixed(4)})`;
    };

    // The pin sticks at `top: var(--header)`: it starts when the story's top reaches the header
    // and ends when the story's bottom reaches the viewport bottom.
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
        applyDom(handle!.frame(stillT, 0, input, N_CH - 1, true), 1, N_CH - 1);
        return;
      }
      if (!pausedRef.current) t += dt;
      let chapter: number, progress: number;
      if (scrollMq.matches && story) {
        progress = scrollProgress();
        chapter = Math.min(N_CH - 1, Math.floor(progress * N_CH));
      } else {
        const k = t < CONNECT ? 0 : (t - CONNECT) / CHAPTER_S;
        chapter = Math.floor(k) % N_CH;
        progress = t < CONNECT ? 0 : (k % N_CH) / N_CH;
      }
      applyDom(handle!.frame(t, dt, input, chapter, snap), progress, chapter);
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
    // the clock only runs while the figure is on screen, so the prelude plays when it is first seen
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '0px' });

    // Phones and touch devices render at 30 fps so scrolling keeps the main thread.
    const minStep = lowPower ? 1 / 31 : 0;
    let acc = 0;
    const tick = (_time: number, deltaMs: number) => {
      if (!handle || !visible || document.hidden) return;
      acc += deltaMs / 1000;
      if (acc < minStep) return;
      const dt = Math.min(acc, 1 / 15);
      acc = 0;
      if (!pausedRef.current) input.time += dt;
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
        setChapter(N_CH - 1);
        setStatus(1);
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
    <figure ref={figRef} className="gtm" aria-labelledby="gtm-title" aria-describedby="gtm-caption">
      <div className="gtm__head">
        <h2 id="gtm-title" className="gtm__title">{V.title}</h2>
        <p ref={statusRef} className="gtm__status" aria-hidden="true"><i /><span>{V.status.after}</span></p>
        <div className="gtm__chapter" aria-hidden="true">
          <p className="gtm__index"><b ref={indexRef}>01</b> / 0{V.chapters.length}</p>
          <ol ref={chaptersRef} className="gtm__chapters">
            {V.chapters.map((c, i) => <li key={c} className={i === 0 ? 'is-on' : undefined}>{c}</li>)}
          </ol>
        </div>
        <p className="gtm__hint" aria-hidden="true">scroll through the engine</p>
      </div>
      <div className="gtm__stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- static fallback only, shown without WebGL */}
        <img className="gtm__poster" src="/hero/gtm-engine.png" alt="" width={1651} height={929} loading="lazy" decoding="async" />
        <canvas ref={canvasRef} className="gtm__canvas" aria-hidden="true" />
        <div ref={tagsRef} className="gtm__tags" aria-hidden="true">
          {PILLS.map((p, i) => (
            <span key={p.a} className={`gtm__tag ${p.layer ? 'gtm__tag--layer' : 'gtm__tag--detail'}`}>
              {p.text}
              {p.detail && <span className="gtm__tagd"> · {p.detail}</span>}
              {i === LOST_PILL && <> · <b className="gtm__tagn">{lostPerCycle}</b></>}
            </span>
          ))}
        </div>
      </div>
      <ol ref={scoreRef} className="gtm__score" aria-hidden="true">
        {SCORE.map((name, g) => (
          <li key={name} className={g === SCORE.length - 1 ? 'is-won' : undefined}>
            <b className="gtm__n">{cycleCounts[g]}</b>
            <span className="gtm__stagename">{name}</span>
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
        An animated model of a connected GTM revenue engine. It opens disconnected: five separate vendors,
        accounts reach each channel and leak out, and nothing reaches the pipeline. Then the system
        connects. GTM intelligence (ICP and market segmentation, target account selection, buying
        signals and intent, contact enrichment) picks the accounts. Five channels work them in parallel
        and coordinate with each other: outbound, LinkedIn, content, paid media and ABM. Their engagement
        feeds one sales pipeline: per cycle {cycleCounts[0]} accounts reached, {cycleCounts[1]} engaged,
        {` ${cycleCounts[2]}`} meetings booked, {cycleCounts[3]} qualified opportunities, {cycleCounts[4]} in
        proposal and negotiation, {cycleCounts[5]} closed won and {lostPerCycle} closed lost
        (the {LOST.name} branch). RevOps runs underneath every stage (CRM and data integrity,
        attribution and measurement, pipeline analytics, conversion optimization), and every won or lost
        outcome feeds back to the strategy to sharpen the next targeting decision.
      </figcaption>
    </figure>
  );
}
