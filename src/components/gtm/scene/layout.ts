// Shared geometry and timing of the connected revenue engine. Pure data: no three.js objects.
// Model space: x runs left → right (intelligence → channels → pipeline), z towards the camera,
// y up with the deck top at 0. The scene turns the whole model by an aspect-dependent yaw.
//
//   A  gtm intelligence   market tray + strategy frame, then select · signal · enrich on a feed track
//   B  connected execution five parallel lanes (stacked in z), one channel module each, cross-links,
//                          a manifold that merges them into one intake
//   C  sales pipeline      six stations, side chutes for dropouts, a closed-lost branch, closed won
//   R  revops              a lower front ledge with the data bus, taps from every layer, four
//                          instruments; a feedback line along the back edge returns to the strategy

export type Vec = [number, number, number];

// Yaw and camera elevation follow the frame's aspect: a wide frame (the pinned desktop panorama)
// shows the engine almost left to right; a squarer frame (phones) turns it diagonal to fit.
export const YAW_WIDE = -0.26; // radians, at aspect >= 2.2
export const YAW_SQUARE = -0.7; // at aspect <= 1.1
export const EL_WIDE = 44; // degrees
export const EL_SQUARE = 52;

// ------------------------------------------------------------------ plinth
/** Upper deck carries A, B and C. Its top is y = 0. */
export const DECK = { x0: -9.0, x1: 8.1, z0: -2.55, z1: 2.3, h: 0.26, r: 0.5 };
/** Lower base slab under the deck, reaching out at the front: the revops ledge. */
export const BASE = { x0: -9.15, x1: 8.25, z0: -2.4, z1: 3.15, h: 0.2, r: 0.55 };
export const LEDGE_Y = -DECK.h; // top of the base slab
export const BUS_Z = 2.72;
export const BUS_Y = LEDGE_Y + 0.07;

// ------------------------------------------------------------------ track
export const CH_Y = 0.34; // rail height
export const SPHERE_R = 0.1;
export const SY = CH_Y + 0.105; // token centre riding the twin rails

// A: intelligence
export const MARKET = { x: -7.6, z: -0.15, cols: 6, rows: 5, gap: 0.34, y: 0.24 };
export const marketSlots: Vec[] = (() => {
  const s: Vec[] = [];
  for (let c = 0; c < MARKET.cols; c++) for (let r = 0; r < MARKET.rows; r++) {
    s.push([MARKET.x + (c - (MARKET.cols - 1) / 2) * MARKET.gap, MARKET.y, MARKET.z + (r - (MARKET.rows - 1) / 2) * MARKET.gap]);
  }
  return s;
})();
export const FRAME = { w: MARKET.cols * MARKET.gap + 0.5, d: MARKET.rows * MARKET.gap + 0.5, y: 0.62 };
export const FEED_X0 = -6.4; // where the feed track leaves the market
export const SELECT_X = -6.0;
export const SIGNAL_X = -5.2;
export const ENRICH_X = -4.4;
export const SPLIT_X = -3.9; // the splitter fans out from here

// B: channels (parallel lanes, stacked in z)
export const LANE_X0 = -3.4;
export const LANE_X1 = -0.9;
export const MODULE_X = -2.15;
export const LANE_Z = [-1.6, -0.8, 0, 0.8, 1.6];
export const MODULE_DZ = -0.36; // module sits just behind its lane
export const channels = [
  { id: 'outbound', name: 'outbound', detail: 'sequences · follow-ups' },
  { id: 'linkedin', name: 'linkedin', detail: 'social selling' },
  { id: 'content', name: 'content', detail: 'thought leadership' },
  { id: 'paid', name: 'paid media', detail: 'account-level reach' },
  { id: 'abm', name: 'abm', detail: 'buying committees' },
] as const;
export type ChannelId = (typeof channels)[number]['id'];
/** Cross-links between lanes: coordination. abm also reaches linkedin. */
export const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]];
export const DRAIN_X = -0.72; // prelude: lanes end in drains here
export const INTAKE_X = 0.2;

// C: pipeline
export const stations = [
  { id: 'reached', name: 'accounts reached', x: 0.8 },
  { id: 'engaged', name: 'accounts engaged', x: 2.05 },
  { id: 'meetings', name: 'meetings booked', x: 3.3 },
  { id: 'qualified', name: 'qualified opps', x: 4.55 },
  { id: 'proposal', name: 'proposal & negotiation', x: 5.8 },
] as const;
export const WON = { x: 7.3, z: 0, name: 'closed won' };
export const LOST = { x: 6.8, z: 1.55, name: 'closed lost' };
export const TRACK_END = 6.75;
export const LOST_BRANCH_X = 6.15;
export const CHUTE_DX = 0.45; // dropout chutes leave the track just after their station
export const N_STAGES = stations.length + 1; // + closed won (the scoreboard columns)

/** Feedback line: from the lost tray, round the right edge, along the back, up to the strategy frame. */
export const FEEDBACK_X = 7.9;
export const FEEDBACK_Z = -2.3;
export const feedbackPath: Vec[] = [
  [LOST.x + 0.45, 0.1, LOST.z], [FEEDBACK_X, 0.1, LOST.z], [FEEDBACK_X, 0.1, WON.z], [FEEDBACK_X, 0.1, FEEDBACK_Z + 0.25],
  [FEEDBACK_X - 0.25, 0.1, FEEDBACK_Z], [MARKET.x + 0.3, 0.1, FEEDBACK_Z], [MARKET.x + 0.05, 0.1, FEEDBACK_Z + 0.2],
  [MARKET.x, FRAME.y * 0.6, MARKET.z - FRAME.d / 2 - 0.02], [MARKET.x, FRAME.y, MARKET.z - FRAME.d / 2],
];
/** Where on the feedback line each origin joins (fraction of its length, measured in the scene). */
export const TAP_XS = [ENRICH_X, MODULE_X, ...stations.map((s) => s.x), WON.x]; // revops taps

// ------------------------------------------------------------------ timing
export const SPEED = 1.5; // units per second on the track (connected run)
export const PRELUDE_SPEED = 2.2;
export const CONNECT = 6.4; // first connected spawn; the system has plugged in by now
export const LOOP = 18; // seconds per connected cycle
export const LIFE = LOOP - 0.6; // a token's instance never outlives its cycle (no pops)
export const FB_DUR = 3.2; // feedback pulse travel time

/** Stop kinds a token dwells at (seconds). */
export const DWELL = { select: 0.3, signal: 0.3, enrich: 0.4, module: 0.5, station: 0.35 };

/**
 * Fate: index of the last station reached. 0–3 drop out after that station (side chute to the
 * revops ledge), 4 = closed lost (after proposal), 5 = closed won.
 * Per cycle: reached 20 → engaged 15 → meetings 10 → qualified 6 → proposal 4 → won 2 / lost 2.
 */
export type TokenSpec = { slot: number; lane: number; fate: number; spawn: number };
const FATES = [0, 2, 5, 1, 0, 3, 1, 2, 4, 0, 1, 2, 5, 0, 1, 3, 2, 4, 0, 1];
const LANES = [0, 1, 2, 3, 4, 2, 0, 4, 1, 3, 3, 0, 4, 1, 2, 1, 3, 2, 0, 4];
const SLOTS = [12, 3, 17, 26, 8, 21, 14, 0, 28, 10, 6, 19, 24, 2, 15, 29, 9, 22, 5, 13];
export const tokenSpecs: TokenSpec[] = FATES.map((fate, i) => ({ slot: SLOTS[i], lane: LANES[i], fate, spawn: i * 0.85 }));

/** Prelude (disconnected): a few accounts, no selection, they reach the channels and leak out. */
const PRE_SLOTS = [1, 7, 11, 16, 20, 23, 25, 27];
export const preludeSpecs = PRE_SLOTS.map((slot, i) => ({ slot, lane: [2, 0, 3, 1, 4, 2, 0, 3][i], spawn: 0.3 + i * 0.25 }));

/** Final per-cycle counts (server render, no-JS and poster fallback). Stations then won. */
export const cycleCounts = [
  ...stations.map((_, k) => FATES.filter((f) => f >= k).length),
  FATES.filter((f) => f === 5).length,
];
export const lostPerCycle = FATES.filter((f) => f === 4).length;

/** Layer centres (x) the camera leans towards when a chapter has focus. 3 = whole engine. */
export const FOCUS_X = [-6.2, -2.2, 3.8, 0];
