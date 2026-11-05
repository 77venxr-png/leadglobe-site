// Shared geometry of the sales-pipeline model. Pure data: no three.js objects, no time.
// Pipeline space: the track runs along +x at z = 0 (market on the left, closed won on the right);
// service modules dock behind it (âˆ’z). The scene rotates the whole model by a yaw so the won end
// comes towards the camera.

export const CYCLE = 13; // seconds per loop
// Yaw and camera elevation follow the frame's aspect: a wide frame (the pinned desktop panorama)
// shows the track almost left to right; a squarer frame (phones) turns it diagonal to fit.
export const YAW_WIDE = -0.3; // radians, at aspect >= 2.2
export const YAW_SQUARE = -0.74; // at aspect <= 1.1: market far left, closed won near right
export const EL_WIDE = 42; // degrees
export const EL_SQUARE = 50;

export const CH_Y = 0.34; // track centre height
export const CH_R = 0.04; // track rail radius
export const SPHERE_R = 0.1;
export const SY = CH_Y + 0.105; // sphere centre height riding the twin rails
export const GAP_HALF = 0.28; // half width of a leaking handoff

export type Vec = [number, number, number];

/** Pipeline stages (gates). The last one is the closed-won tray, not a gate. */
export const stages = [
  { id: 'accounts', name: 'accounts', x: -4.8 },
  { id: 'contacted', name: 'contacted', x: -2.85 },
  { id: 'replied', name: 'replied', x: -0.9 },
  { id: 'meeting', name: 'meeting', x: 1.05 },
  { id: 'opportunity', name: 'opportunity', x: 3.0 },
  { id: 'won', name: 'closed won', x: 5.0 },
] as const;

/** Handoffs between consecutive stages: where the siloed pipeline leaks, and where a service docks. */
export const handoffs = stages.slice(0, -1).map((s, i) => ({ x: (s.x + stages[i + 1].x) / 2 }));

/** The service that fixes each handoff (same order as handoffs). */
export const services = [
  { id: 'outbound', name: 'outbound' },
  { id: 'paid', name: 'paid media' },
  { id: 'content', name: 'content' },
  { id: 'abm', name: 'abm' },
  { id: 'revops', name: 'revops' },
] as const;
export type ServiceId = (typeof services)[number]['id'];
export const MODULE_Z = -1.05;

export const TRACK_START = -5.15;
export const TRACK_END = 4.75;
export const TRAY: Vec = [5.55, 0, 0];

/** The market: a 5 Ã— 7 grid of prospect accounts on a tray at the left. */
export const MARKET = { x: -6.45, z: -0.15, cols: 5, rows: 7, gap: 0.34, y: 0.24 };
export const marketSlots: Vec[] = (() => {
  const s: Vec[] = [];
  for (let c = 0; c < MARKET.cols; c++) for (let r = 0; r < MARKET.rows; r++) {
    s.push([MARKET.x + (c - (MARKET.cols - 1) / 2) * MARKET.gap, MARKET.y, MARKET.z + (r - (MARKET.rows - 1) / 2) * MARKET.gap]);
  }
  return s;
})();

/** Spine of the connected engine (behind the modules) and its hub. */
export const SPINE_Z = -1.75;
export const HUB: Vec = [-0.4, 0, -2.05];
export const STRATEGY: Vec = [MARKET.x, 0, MARKET.z];

/** Plinth: a rounded slab under everything. */
export const PLINTH = { x0: -7.55, x1: 6.55, z0: -2.8, z1: 1.05, h: 0.26, r: 0.55 };

/** Resting places in the closed-won tray (3 Ã— 3). */
export const traySlots: Vec[] = Array.from({ length: 9 }, (_, i) => [
  TRAY[0] + ((i % 3) - 1) * 0.27, 0.24, TRAY[2] + (Math.floor(i / 3) - 1) * 0.27,
]);

// ------------------------------------------------------------------------------- runs

/** fate: index of the handoff where the sphere leaks, or 5 = closed won. */
export type SphereSpec = { run: 0 | 1; slot: number; spawn: number; speed: number; fate: number; tray?: number };

// Run 0 (no strategy, disconnected): 16 random accounts, 6/4/3/2/1 leak, none closes.
const LEAK0 = [0, 1, 0, 2, 0, 1, 3, 0, 2, 1, 0, 4, 1, 2, 3, 0]; // fate per sphere, mixed order
const SLOTS0 = [2, 30, 9, 21, 33, 14, 5, 26, 11, 17, 0, 23, 32, 7, 28, 19];
// Run 1 (strategy picks the fit accounts, every handoff bridged): 1/2/1/2/1 leak, 9 close.
// Winners go first so the tray fills while the late ones leak early.
const FATE1 = [5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 1, 2, 1, 3, 4, 3];
const SLOTS1 = [8, 15, 22, 29, 10, 16, 24, 3, 18, 31, 1, 12, 25, 6, 20, 27];

export const RUN1_AT = 6.3; // when the connected run starts (counts switch over)

export const sphereSpecs: SphereSpec[] = [
  ...LEAK0.map((fate, i) => ({ run: 0 as const, slot: SLOTS0[i], spawn: 0.55 + i * 0.16, speed: 3.6, fate })),
  ...FATE1.map((fate, i) => ({ run: 1 as const, slot: SLOTS1[i], spawn: RUN1_AT + 0.25 + i * 0.15, speed: 4.1, fate, tray: fate === 5 ? i : undefined })),
];

/** Final per-stage counts of the leaking run (what "was" shows during the connected run). */
export const wasCounts = stages.map((_, g) => LEAK0.filter((f) => f >= g).length);
/** Final per-stage counts of the connected run (server render, no-JS and poster fallback). */
export const fixedCounts = stages.map((_, g) => FATE1.filter((f) => f >= g).length);
