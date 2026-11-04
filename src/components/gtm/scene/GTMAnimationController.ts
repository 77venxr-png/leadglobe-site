// The story, as pure functions of loop time. No three.js here: the scene modules read this state.
// 0–1.2 siloed · 1.2–4.6 leakage · 4.6–6.2 connect · 6.0–9.9 flow · 9.9–11.2 revenue · 11.2–12 reset
import { gsap } from 'gsap';
import { CYCLE, rails } from './layout';

const back = gsap.parseEase('back.out(1.35)');
const out = gsap.parseEase('expo.out');
const inOut = gsap.parseEase('power3.inOut');
const easeIn = gsap.parseEase('power2.in');

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const seg = (t: number, a: number, d: number, ease: (p: number) => number) => ease(clamp01((t - a) / d));

export const RESET_AT = 11.2;
/** 1 while built, falling to 0 over the reset; `i` staggers parts (reverse order of assembly). */
const kept = (t: number, i = 0) => 1 - seg(t, RESET_AT + i * 0.06, 0.55, easeIn);

export const STAGES = ['siloed', 'leaking', 'connecting', 'running', 'revenue'] as const;

export type StoryState = {
  t: number;
  stage: number; // index into STAGES
  engine: number[]; // assembly of each engine part, 0..1 (back ease: may overshoot)
  rails: number[]; // draw progress of each radial rail
  collars: number[]; // pink lock collars where rails meet stations
  bridges: number[]; // ring gaps + spur gap, 0..1
  drains: number; // visibility of the leak drains
  sync: number; // station mechanisms locked to the engine
  spin: number; // engine rotation speed factor
  label: number; // "one connected gtm engine."
  dolly: number; // camera push-in while connected
};

export const ENGINE_PARTS = 5;
export const BRIDGES = 4;

export function story(time: number): StoryState {
  const t = ((time % CYCLE) + CYCLE) % CYCLE;
  const engine = Array.from({ length: ENGINE_PARTS }, (_, i) =>
    seg(t, 4.6 + i * 0.16, 0.62, back) * kept(t, ENGINE_PARTS - 1 - i));
  const railsP = rails.map((_, i) => seg(t, 5.05 + i * 0.07, 0.75, inOut) * kept(t, 2));
  const collars = rails.map((_, i) => seg(t, 5.7 + i * 0.07, 0.4, back) * kept(t, 1));
  const bridges = Array.from({ length: BRIDGES }, (_, i) => seg(t, 5.35 + i * 0.12, 0.5, back) * kept(t, 2));
  const drains = Math.max(1 - seg(t, 5.25, 0.6, out), seg(t, RESET_AT + 0.3, 0.5, out));
  const sync = smooth(5.6, 6.6, t) * (1 - smooth(RESET_AT, CYCLE, t));
  const spin = smooth(5.2, 6.2, t) * (1 - smooth(RESET_AT, RESET_AT + 0.6, t));
  const label = smooth(9.9, 10.5, t) * (1 - smooth(11.0, 11.45, t));
  const dolly = smooth(4.6, 7.5, t) * (1 - smooth(RESET_AT, CYCLE, t));
  const stage = t < 1.2 ? 0 : t < 4.6 ? 1 : t < 6.0 ? 2 : t < 9.9 ? 3 : t < RESET_AT ? 4 : 0;
  return { t, stage, engine, rails: railsP, collars, bridges, drains, sync, spin, label, dolly };
}

/** The frame used for reduced motion and the static poster: built, bowl full, label shown. */
export const STILL_T = 10.7;
