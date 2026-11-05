// The story, as pure functions of loop time. No three.js here: the scene modules read this state.
// 0–4.9 leaking pipeline · 4.9–6.6 strategy + connection · 6.3–11 connected run · 11–12.3 revenue
// · 12.3–13 reset back to frame 0.
import { gsap } from 'gsap';
import { CYCLE, handoffs } from './layout';

const back = gsap.parseEase('back.out(1.3)');
const out = gsap.parseEase('expo.out');
const inOut = gsap.parseEase('power3.inOut');
const easeIn = gsap.parseEase('power2.in');

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const seg = (t: number, a: number, d: number, ease: (p: number) => number) => ease(clamp01((t - a) / d));

export const RESET_AT = 12.3;
const kept = (t: number, i = 0) => 1 - seg(t, RESET_AT + i * 0.05, 0.45, easeIn);

export const STAGES = ['leaking', 'fixing', 'connected', 'revenue'] as const;

/** The three told chapters: 0 leaking, 1 gaps closing, 2 connected run + revenue. */
export const chapterAt = (stage: number) => (stage >= 2 ? 2 : stage);

/** Scroll story: where each chapter starts and ends in loop time. The scroll map gives every
 *  chapter an equal share of the pinned distance, with a short hold between them. */
export const CHAPTER_T: [number, number][] = [[0, 4.9], [4.9, 6.6], [6.6, 12.05]];

export type StoryState = {
  t: number;
  stage: number;
  hub: number; // engine hub assembly (may overshoot)
  spine: number; // spine draw progress
  strategy: number; // strategy unit assembly
  scan: number; // strategy scan progress across the market, 0..1
  modules: number[]; // service module assembly per handoff
  bridges: number[]; // bridge per handoff
  drains: number; // leak drains visibility
  sync: number; // module mechanisms locked to the engine
  spin: number; // engine rotation speed factor
  label: number; // "one connected gtm engine."
  services: number; // service / strategy tags visibility
  dolly: number;
};

export function story(time: number): StoryState {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;
  const modules = handoffs.map((_, i) => seg(t, 5.25 + i * 0.13, 0.6, back) * kept(t, 4 - i));
  const bridges = handoffs.map((_, i) => seg(t, 5.75 + i * 0.13, 0.45, back) * kept(t, 2));
  return {
    t,
    stage: t < 4.9 ? 0 : t < 6.6 ? 1 : t < 11.0 ? 2 : t < RESET_AT ? 3 : 0,
    hub: seg(t, 4.9, 0.6, back) * kept(t, 5),
    spine: seg(t, 5.05, 0.9, inOut) * kept(t, 3),
    strategy: seg(t, 5.15, 0.6, back) * kept(t, 4),
    scan: smooth(5.85, 6.55, t) * (1 - smooth(RESET_AT, RESET_AT + 0.4, t)),
    modules,
    bridges,
    drains: Math.max(1 - seg(t, 5.9, 0.6, out), seg(t, RESET_AT + 0.3, 0.4, out)),
    sync: smooth(5.6, 6.6, t) * (1 - smooth(RESET_AT, CYCLE, t)),
    spin: smooth(5.3, 6.3, t) * (1 - smooth(RESET_AT, RESET_AT + 0.5, t)),
    label: smooth(11.0, 11.5, t) * (1 - smooth(12.1, 12.45, t)),
    services: smooth(5.6, 6.2, t) * (1 - smooth(RESET_AT - 0.1, RESET_AT + 0.3, t)),
    dolly: smooth(4.9, 8, t) * (1 - smooth(RESET_AT, CYCLE, t)),
  };
}

/** Reduced motion and the static poster: connected, tray full, counts and "was" visible. */
export const STILL_T = 11.6;
