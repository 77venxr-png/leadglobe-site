// Shared geometry of the revenue engine model. Pure data: no three.js objects, no time.
// World units. The plinth top is y = 0; the camera looks from +z, so 90° is the front.
//   x = r·cos(θ), z = r·sin(θ)

export const CYCLE = 12; // seconds per loop

export const R = 3.0; // station ring radius
export const PLINTH_R = 4.9;
export const PLINTH_H = 0.28;
export const CH_Y = 0.32; // channel / rail centre height
export const CH_R = 0.035; // channel tube radius
export const SPHERE_R = 0.1;
export const SY = CH_Y + CH_R + SPHERE_R - 0.005; // sphere centre height when riding a channel
export const PAD_R = 0.62; // station pad radius
export const TRACK_R = 1.0; // engine track radius (spheres ride it)
export const ENGINE_R = 1.18;
export const HOPPER_R = 4.3; // radius of the prospect hopper (back) and the revenue bowl (front)
export const BOWL_RIM_Y = 0.5;

export type Vec = [number, number, number];

export const rad = (deg: number) => (deg * Math.PI) / 180;
export const at = (deg: number, r = R, y = SY): Vec => [r * Math.cos(rad(deg)), y, r * Math.sin(rad(deg))];

export const stations = [
  { id: 'paid', name: 'paid media', deg: 0 },
  { id: 'revops', name: 'revops', deg: 60 },
  { id: 'abm', name: 'abm', deg: 120 },
  { id: 'content', name: 'content', deg: 180 },
  { id: 'strategy', name: 'gtm strategy', deg: 240 },
  { id: 'outbound', name: 'outbound', deg: 300 },
] as const;
export type StationId = (typeof stations)[number]['id'];

export const HOPPER: Vec = at(270, HOPPER_R, 0);
export const BOWL: Vec = at(90, HOPPER_R, 0);

/** Station footprint on the ring, in degrees either side of its centre. */
export const PAD_DEG = (Math.asin(PAD_R / R) * 180) / Math.PI;

/** Gaps in the fragmented ring (centre angle, half width in degrees). Bridged when connected. */
export const ringGaps = [30, 150, 210].map((deg) => ({ deg, half: 7 }));
/** Gap in the spur from the ring (90°) to the revenue bowl: radii from → to. */
export const SPUR_GAP = { from: 3.2, to: 3.48 };
export const SPUR_END = HOPPER_R - 0.68; // where the spur meets the bowl rim

/** Radial rails grown by the engine: one per station, plus the feed (270°) and the output (90°). */
export const rails = [
  ...stations.map((s) => ({ deg: s.deg, to: R - PAD_R + 0.02, kind: 'station' as const })),
  { deg: 270, to: R, kind: 'feed' as const },
  { deg: 90, to: R, kind: 'output' as const },
];

/** Drains: where the fragmented pipeline loses spheres. Ring gaps plus the spur gap. */
export const drains: Vec[] = [
  ...ringGaps.map((g) => at(g.deg, R, 0)),
  at(90, (SPUR_GAP.from + SPUR_GAP.to) / 2, 0),
];

// ------------------------------------------------------------------------------- path helpers

/** Points along an arc on a circle, from a to b degrees (either direction), every ~5°. */
export function arc(a: number, b: number, r = R, y = SY): Vec[] {
  const n = Math.max(2, Math.ceil(Math.abs(b - a) / 5));
  return Array.from({ length: n + 1 }, (_, i) => at(a + ((b - a) * i) / n, r, y));
}
/** Points along a radial line at `deg`, from radius r0 to r1. */
export function radial(deg: number, r0: number, r1: number, y = SY): Vec[] {
  const n = Math.max(2, Math.ceil(Math.abs(r1 - r0) / 0.3));
  return Array.from({ length: n + 1 }, (_, i) => at(deg, r0 + ((r1 - r0) * i) / n, y));
}
/** Shortest signed angle from a to b, in degrees. */
export const turn = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

export const join = (...parts: Vec[][]) => {
  const out: Vec[] = [];
  for (const p of parts) for (const v of p) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(v[0] - last[0], v[1] - last[1], v[2] - last[2]) > 1e-3) out.push(v);
  }
  return out;
};

// ------------------------------------------------------------------------------- routes

export type Fate = 'fall' | 'stuck' | 'fade' | 'bowl';
export type RouteSpec = {
  pts: Vec[];
  spawn: number; // loop time the sphere appears
  speed: number; // units per second
  fate: Fate;
  drain?: number; // index into drains for 'fall'
  dwellAt?: Vec; // pause at this point (inside a station) for `dwell` seconds
  dwell?: number;
  station?: number; // the station that works on it (connected spheres)
};

const fromHopper = (): Vec[] => [[HOPPER[0], 0.78, HOPPER[2]], at(270, HOPPER_R - 0.45), ...radial(270, HOPPER_R - 0.6, R)];
const gapEdge = (gapDeg: number, side: -1 | 1) => gapDeg + side * 7.4;
const BROKEN_SPEED = 2.9;

/** Fragmented pipeline: every route ends badly. Spawns between 1.2 s and 3.6 s. */
export const brokenRoutes: RouteSpec[] = [
  // prospect → strategy → falls through the 210° gap
  { pts: join(fromHopper(), arc(270, gapEdge(210, 1))), spawn: 1.25, speed: BROKEN_SPEED, fate: 'fall', drain: 2 },
  // prospect → outbound → paid media → falls at 30°
  { pts: join(fromHopper(), arc(270, 360 + gapEdge(30, -1))), spawn: 1.55, speed: BROKEN_SPEED, fate: 'fall', drain: 0 },
  // abm → right past the revenue junction → stuck against the broken spur
  { pts: join(arc(120, 90), radial(90, R, SPUR_GAP.from - 0.02)), spawn: 1.9, speed: BROKEN_SPEED, fate: 'stuck' },
  // content → falls into the 210° gap from the other side
  { pts: join(arc(180, gapEdge(210, -1))), spawn: 2.25, speed: BROKEN_SPEED, fate: 'fall', drain: 2 },
  // revops → passes the revenue junction, wanders off through abm, falls at 150°
  { pts: join(arc(60, gapEdge(150, -1))), spawn: 2.5, speed: BROKEN_SPEED, fate: 'fall', drain: 1 },
  // prospect → outbound → paid media → just fades out on the channel (lost in a silo)
  { pts: join(fromHopper(), arc(270, 368)), spawn: 2.85, speed: BROKEN_SPEED, fate: 'fade' },
  // prospect → strategy → falls at 210° again
  { pts: join(fromHopper(), arc(270, gapEdge(210, 1))), spawn: 3.25, speed: BROKEN_SPEED, fate: 'fall', drain: 2 },
  // revops → revenue junction → queues behind the stuck one
  { pts: join(arc(60, 90), radial(90, R, SPUR_GAP.from - 0.24)), spawn: 3.45, speed: BROKEN_SPEED, fate: 'stuck' },
];

/** Resting places inside the revenue bowl, filled in arrival order. */
export const bowlSlots: Vec[] = (() => {
  const s: Vec[] = [];
  const y0 = 0.27, y1 = 0.43;
  for (let i = 0; i < 6; i++) s.push([BOWL[0] + 0.25 * Math.cos(rad(i * 60)), y0, BOWL[2] + 0.25 * Math.sin(rad(i * 60))]);
  s.push([BOWL[0], y0, BOWL[2]]);
  for (let i = 0; i < 4; i++) s.push([BOWL[0] + 0.14 * Math.cos(rad(45 + i * 90)), y1, BOWL[2] + 0.14 * Math.sin(rad(45 + i * 90))]);
  s.push([BOWL[0], y1 + 0.12, BOWL[2]]);
  return s;
})();

const CONNECTED_SPEED = 5.4;
const ORDER = [4, 5, 3, 0, 2, 1, 4, 5, 3, 0, 2, 1]; // strategy first, revops last

/** Connected pipeline: prospect → engine → a station → engine → revenue. Spawns 6.0 s to 8.0 s. */
export const connectedRoutes: RouteSpec[] = ORDER.map((k, i) => {
  const deg = stations[k].deg;
  const a1 = 270 + turn(270, deg); // shortest way round the engine to the station
  const a2 = a1 + turn(a1, 90); // and on to the output
  const slot = bowlSlots[i];
  const pts = join(
    fromHopper(),
    radial(270, R, TRACK_R),
    arc(270, a1, TRACK_R),
    radial(deg, TRACK_R, R),
    radial(deg, R, TRACK_R),
    arc(a1, a2, TRACK_R),
    radial(90, TRACK_R, SPUR_END),
    [[BOWL[0], BOWL_RIM_Y + 0.12, BOWL[2] - 0.3], slot],
  );
  return { pts, spawn: 6.0 + i * 0.17, speed: CONNECTED_SPEED, fate: 'bowl', dwellAt: at(deg), dwell: 0.22, station: k };
});
