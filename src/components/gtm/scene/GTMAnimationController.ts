// The story, as pure functions of time (seconds since the figure first played). No three.js here.
//   0 – 5     prelude, played once: five vendors, no shared system. Accounts reach the channels
//             unselected and leak out where each channel ends.
//   5 – 6.8   connect: strategy frame drops in, the manifold joins the lanes to one intake, the
//             revops bus draws along the ledge, taps rise, lanes link up, the feedback line draws.
//   6.4 →     connected loop (LOOP s): see Tokens.ts. Never resets; the prelude does not repeat.
import { gsap } from 'gsap';
import { CONNECT, LOOP, channels } from './layout';

const back = gsap.parseEase('back.out(1.3)');
const out = gsap.parseEase('expo.out');
const inOut = gsap.parseEase('power3.inOut');

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const seg = (t: number, a: number, d: number, ease: (p: number) => number) => ease(clamp01((t - a) / d));

export const STATUS_AT = 5.0; // status line flips from "before" to "after"

export type StoryState = {
  t: number;
  connected: number; // 0 during the prelude, 1 once everything has plugged in
  strategy: number; // strategy frame assembly (may overshoot)
  manifold: number[]; // per lane: manifold section dropped in
  drains: number; // prelude drains visible
  links: number; // lane cross-links drawn
  bus: number; // revops bus drawn
  taps: number; // taps from every layer to the bus
  plaques: number; // revops instruments
  feedback: number; // feedback line drawn
  status: 0 | 1;
};

export function story(t: number): StoryState {
  return {
    t,
    connected: smooth(5.0, 6.6, t),
    strategy: seg(t, 5.0, 0.6, back),
    manifold: channels.map((_, k) => seg(t, 5.2 + k * 0.1, 0.55, back)),
    drains: 1 - seg(t, 5.7, 0.5, out),
    links: seg(t, 5.7, 0.8, inOut),
    bus: seg(t, 5.3, 1.1, inOut),
    taps: seg(t, 5.9, 0.6, out),
    plaques: seg(t, 6.0, 0.6, back),
    feedback: seg(t, 6.1, 0.9, inOut),
    status: t < STATUS_AT ? 0 : 1,
  };
}

/** Reduced motion and the poster: connected, counts full, a token resting in closed won. */
export const STILL_T = CONNECT + 2 * LOOP + 7.2;
