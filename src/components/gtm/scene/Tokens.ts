// Account tokens: matte black spheres. Each connected token owns one market slot and runs its route
// once per LOOP (select → signal → enrich → its channel lane → intake → stations → its fate). An
// instance never outlives its cycle, so the loop has no seam. Everything is a pure function of time,
// and the scoreboard counts and every mechanism's activity are read from the same schedules.
import * as THREE from 'three';
import { smooth } from './GTMAnimationController';
import {
  BUS_Y, BUS_Z, CHUTE_DX, CH_Y, CONNECT, DECK, DRAIN_X, DWELL, ENRICH_X, FEED_X0, INTAKE_X, LANE_X0, LANE_X1, LEDGE_Y, LIFE,
  LOOP, LOST, LOST_BRANCH_X, MODULE_X, N_STAGES, PRELUDE_SPEED, SELECT_X, SIGNAL_X, SPEED, SPHERE_R, SPLIT_X, SY,
  TRACK_END, WON, LANE_Z, marketSlots, preludeSpecs, stations, tokenSpecs, type Vec,
} from './layout';
import type { Materials } from './materials';

const SAMPLES_PER_UNIT = 24;
type Stop = { s: number; dwell: number; kind: string };
type Key = { t: number; s: number; ease: boolean };
type Route = {
  xyz: Float32Array; cum: Float32Array; L: number;
  keys: Key[]; end: number; // path end time (s at L)
  stopT: Record<string, number>; // dwell start time per stop kind
  selectS: number;
};

function bake(pts: Vec[], stops: { at: Vec; dwell: number; kind: string }[], speed: number, ease: boolean): Route {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const n = Math.ceil(curve.getLength() * SAMPLES_PER_UNIT);
  const sp = curve.getSpacedPoints(n);
  const xyz = new Float32Array(sp.length * 3);
  const cum = new Float32Array(sp.length);
  sp.forEach((p, i) => { xyz.set([p.x, p.y, p.z], i * 3); if (i) cum[i] = cum[i - 1] + p.distanceTo(sp[i - 1]); });
  const L = cum[cum.length - 1];
  // stop arc positions: the nearest sample after the previous stop
  const v = new THREE.Vector3();
  let from = 0;
  const S: Stop[] = stops.map((st) => {
    let best = from, bd = Infinity;
    v.set(...st.at);
    for (let i = from; i < sp.length; i++) { const d = sp[i].distanceToSquared(v); if (d < bd) { bd = d; best = i; } }
    from = best;
    return { s: cum[best], dwell: st.dwell, kind: st.kind };
  });
  const keys: Key[] = [{ t: 0, s: 0, ease }];
  const stopT: Record<string, number> = {};
  let t = 0, s = 0;
  for (const st of S) {
    t += (st.s - s) / speed; s = st.s;
    keys.push({ t, s, ease: true });
    stopT[st.kind] = t;
    t += st.dwell;
    keys.push({ t, s, ease });
  }
  t += (L - s) / speed;
  keys.push({ t, s: L, ease });
  return { xyz, cum, L, keys, end: t, stopT, selectS: S.find((x) => x.kind === 'select')?.s ?? Infinity };
}

/** Arc position at route time tau (moves between stops ease in and out, like a mechanism). */
function sAt(r: Route, tau: number) {
  const k = r.keys;
  if (tau <= 0) return 0;
  if (tau >= r.end) return r.L;
  let i = 1;
  while (i < k.length - 1 && k[i].t < tau) i++;
  const a = k[i - 1], b = k[i];
  if (b.t === a.t) return b.s;
  const u = (tau - a.t) / (b.t - a.t);
  const e = b.ease ? u * u * (3 - 2 * u) : u;
  return a.s + (b.s - a.s) * e;
}

function sample(r: Route, s: number, out: THREE.Vector3) {
  const { cum, xyz } = r;
  const last = cum.length - 1;
  if (s <= 0) return out.set(xyz[0], xyz[1], xyz[2]);
  if (s >= r.L) return out.set(xyz[last * 3], xyz[last * 3 + 1], xyz[last * 3 + 2]);
  let lo = 0, hi = last;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < s) lo = mid; else hi = mid; }
  const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return out.set(
    xyz[lo * 3] + (xyz[hi * 3] - xyz[lo * 3]) * f,
    xyz[lo * 3 + 1] + (xyz[hi * 3 + 1] - xyz[lo * 3 + 1]) * f,
    xyz[lo * 3 + 2] + (xyz[hi * 3 + 2] - xyz[lo * 3 + 2]) * f,
  );
}

const run = (x0: number, x1: number, z = 0, y = SY, step = 0.7): Vec[] => {
  const out: Vec[] = [];
  const n = Math.max(1, Math.round(Math.abs(x1 - x0) / step));
  for (let i = 1; i <= n; i++) out.push([x0 + ((x1 - x0) * i) / n, y, z]);
  return out;
};

/** Market → feed → splitter → lane → (lane end). Shared by both runs. */
function front(slot: Vec, lane: number): Vec[] {
  const z = LANE_Z[lane];
  return [
    slot, [slot[0] + 0.22, 0.46, slot[2] * 0.6], // low enough to pass under the scan bar [FEED_X0 - 0.2, SY + 0.04, 0], [FEED_X0, SY, 0],
    ...run(FEED_X0, SPLIT_X), [SPLIT_X + 0.25, SY, z * 0.15], [LANE_X0 - 0.12, SY, z * 0.92], [LANE_X0, SY, z],
    ...run(LANE_X0, LANE_X1, z),
  ];
}

const WON_SLOTS: Vec[] = [[WON.x - 0.13, 0.24, WON.z - 0.12], [WON.x + 0.13, 0.24, WON.z + 0.12]];
const LOST_SLOTS: Vec[] = [[LOST.x - 0.12, 0.24, LOST.z + 0.1], [LOST.x + 0.12, 0.24, LOST.z - 0.1]];

function connectedRoute(spec: (typeof tokenSpecs)[number], outcomeIndex: number) {
  const slot = marketSlots[spec.slot];
  const z = LANE_Z[spec.lane];
  const pts: Vec[] = [...front(slot, spec.lane), [-0.35, SY, z * 0.4], [INTAKE_X, SY, 0]];
  const stops = [
    { at: [SELECT_X, SY, 0] as Vec, dwell: DWELL.select, kind: 'select' },
    { at: [SIGNAL_X, SY, 0] as Vec, dwell: DWELL.signal, kind: 'signal' },
    { at: [ENRICH_X, SY, 0] as Vec, dwell: DWELL.enrich, kind: 'enrich' },
    { at: [MODULE_X, SY, z] as Vec, dwell: DWELL.module, kind: 'module' },
  ];
  const lastStation = Math.min(spec.fate, stations.length - 1);
  let x = INTAKE_X;
  for (let k = 0; k <= lastStation; k++) {
    pts.push(...run(x, stations[k].x));
    x = stations[k].x;
    stops.push({ at: [x, SY, 0], dwell: DWELL.station, kind: `st${k}` });
  }
  if (spec.fate <= 3) {
    // dropout: off the track into the side chute, down to the revops ledge, captured on the bus
    const cx = x + CHUTE_DX;
    const floorY = (zz: number) => CH_Y - 0.06 + ((0.05 - (CH_Y - 0.06)) * (zz - 0.3)) / (DECK.z1 - 0.1 - 0.3);
    pts.push([cx - 0.12, SY + 0.02, 0.08], [cx, floorY(0.35) + SPHERE_R + 0.015, 0.38], [cx, floorY(1.3) + SPHERE_R + 0.015, 1.3],
      [cx, 0.05 + SPHERE_R + 0.02, DECK.z1 - 0.1], [cx, LEDGE_Y + SPHERE_R + 0.12, DECK.z1 + 0.22],
      [cx, LEDGE_Y + SPHERE_R, BUS_Z - 0.26], [cx + 0.04, LEDGE_Y + SPHERE_R * 0.8, BUS_Z - 0.12], [cx + 0.06, BUS_Y, BUS_Z]); // absorbed into the bus
  } else if (spec.fate === 4) {
    pts.push(...run(x, LOST_BRANCH_X), [LOST_BRANCH_X + 0.3, SY - 0.01, 0.25], [LOST.x - 0.55, SY - 0.06, LOST.z - 0.3],
      [LOST.x - 0.3, 0.44, LOST.z], LOST_SLOTS[outcomeIndex]);
  } else {
    pts.push(...run(x, TRACK_END), [WON.x - 0.4, 0.46, WON.z], WON_SLOTS[outcomeIndex]);
  }
  return bake(pts, stops, SPEED, false);
}

function preludeRoute(spec: (typeof preludeSpecs)[number]) {
  const z = LANE_Z[spec.lane];
  const pts: Vec[] = [...front(marketSlots[spec.slot], spec.lane), [LANE_X1 + 0.12, SY - 0.04, z],
    [DRAIN_X, SY - 0.2, z], [DRAIN_X + 0.03, SPHERE_R * 0.6, z]];
  return bake(pts, [], PRELUDE_SPEED, false);
}

const bump = (tau: number, a: number, b: number) => smooth(a - 0.25, a, tau) * (1 - smooth(b, b + 0.3, tau));

export function createTokens(mat: Materials) {
  let wonI = 0, lostI = 0;
  const routes = tokenSpecs.map((s) => connectedRoute(s, s.fate === 5 ? wonI++ : s.fate === 4 ? lostI++ : 0));
  const pre = preludeSpecs.map(preludeRoute);
  if (process.env.NODE_ENV !== 'production') {
    routes.forEach((r, i) => { if (r.end > LIFE - 0.4) console.warn(`[gtm] token ${i} route ${r.end.toFixed(1)}s exceeds its cycle`); });
  }
  // arrival time (route time) at each scoreboard column: stations, then closed won
  const arrive = routes.map((r, i) => {
    const f = tokenSpecs[i].fate;
    return Array.from({ length: N_STAGES }, (_, k) => (k < stations.length ? (f >= k ? r.stopT[`st${k}`] : NaN) : f === 5 ? r.end : NaN));
  });

  const n = marketSlots.length;
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(SPHERE_R, 24, 16), mat.sphere, n);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(SPHERE_R + 0.03, 0.016, 8, 32).rotateX(Math.PI / 2), mat.pink, routes.length);
  rings.frustumCulled = false;

  const counts = new Int32Array(N_STAGES);
  const act = {
    select: 0, signal: 0, enrich: 0,
    lanes: new Float32Array(5), // channel module working
    laneStart: new Float64Array(5).fill(-1e9), // latest module dwell start (absolute t), for link pulses
    splitZ: 0, // lane the next token is heading for
    station: new Float64Array(N_STAGES).fill(-1e9), // latest arrival (absolute t), for plates and taps
    outcomes: [] as { at: number; lost: boolean }[], // won / lost arrivals that send a feedback pulse
    drainHit: new Float64Array(5).fill(-1e9),
    lost: 0, // lost per window
  };
  const p = new THREE.Vector3();
  const m4 = new THREE.Matrix4();

  function place(i: number, pos: THREE.Vector3 | Vec, s: number) {
    const k = Math.max(1e-4, s);
    if (Array.isArray(pos)) m4.makeScale(k, k, k).setPosition(pos[0], pos[1], pos[2]);
    else m4.makeScale(k, k, k).setPosition(pos);
    mesh.setMatrixAt(i, m4);
  }

  return {
    mesh, rings, counts, act,
    update(t: number) {
      act.select = act.signal = act.enrich = 0;
      act.lanes.fill(0);
      act.outcomes.length = 0;
      counts.fill(0);
      act.lost = 0;
      for (let i = 0; i < n; i++) place(i, marketSlots[i], 1);

      // prelude: leak at the end of every channel
      preludeSpecs.forEach((spec, j) => {
        const r = pre[j];
        const tau = t - spec.spawn;
        if (tau < 0) return;
        if (tau < r.end + 0.45) {
          sample(r, sAt(r, tau), p);
          place(spec.slot, p, 1 - smooth(r.end, r.end + 0.45, tau));
          if (tau >= r.end - 0.1) act.drainHit[spec.lane] = Math.max(act.drainHit[spec.lane], spec.spawn + r.end);
        } else {
          place(spec.slot, marketSlots[spec.slot], smooth(r.end + 1.2, r.end + 1.8, tau));
        }
      });

      // connected loop
      const tc = t - CONNECT;
      let nextSplit = Infinity;
      routes.forEach((r, j) => {
        const spec = tokenSpecs[j];
        // counts: exactly one arrival per cycle falls inside any LOOP-long window
        for (let k = 0; k < N_STAGES; k++) {
          const a = arrive[j][k];
          if (Number.isNaN(a)) continue;
          const c = Math.floor((tc - spec.spawn - a) / LOOP);
          if (c >= 0) {
            counts[k]++;
            act.station[k] = Math.max(act.station[k], CONNECT + spec.spawn + c * LOOP + a);
          }
        }
        if (spec.fate >= 4) {
          const c = Math.floor((tc - spec.spawn - r.end) / LOOP);
          if (c >= 0) {
            if (spec.fate === 4) act.lost++;
            act.outcomes.push({ at: CONNECT + spec.spawn + c * LOOP + r.end, lost: spec.fate === 4 });
          }
        }
        const md = r.stopT.module;
        const cm = Math.floor((tc - spec.spawn - md) / LOOP);
        if (cm >= 0) act.laneStart[spec.lane] = Math.max(act.laneStart[spec.lane], CONNECT + spec.spawn + cm * LOOP + md);

        if (tc < spec.spawn) { rings.setMatrixAt(j, m4.makeScale(1e-4, 1e-4, 1e-4)); return; }
        const tau = (tc - spec.spawn) % LOOP;
        if (tau >= LIFE) {
          place(spec.slot, marketSlots[spec.slot], smooth(LIFE, LIFE + 0.5, tau));
          rings.setMatrixAt(j, m4.makeScale(1e-4, 1e-4, 1e-4));
          return;
        }
        const s = sAt(r, tau);
        sample(r, s, p);
        let scale = 1;
        if (spec.fate <= 3) scale = 1 - smooth(r.end - 1.0, r.end, tau); // captured on the bus
        else scale = 1 - smooth(LIFE - 0.4, LIFE, tau);
        if (tau >= r.end && spec.fate <= 3) scale = 0;
        place(spec.slot, p, scale);
        const ring = smooth(r.selectS - 0.05, r.selectS + 0.15, s) * scale;
        rings.setMatrixAt(j, m4.makeScale(Math.max(1e-4, ring), Math.max(1e-4, ring), Math.max(1e-4, ring)).setPosition(p));

        const st = r.stopT;
        act.select = Math.max(act.select, bump(tau, st.select, st.select + DWELL.select));
        act.signal = Math.max(act.signal, bump(tau, st.signal, st.signal + DWELL.signal));
        act.enrich = Math.max(act.enrich, bump(tau, st.enrich, st.enrich + DWELL.enrich));
        act.lanes[spec.lane] = Math.max(act.lanes[spec.lane], bump(tau, md, md + DWELL.module));
        // splitter aims at the lane of the next token to arrive
        const toSplit = st.enrich + DWELL.enrich + 0.45 - tau;
        if (toSplit > -0.35 && toSplit < nextSplit) { nextSplit = toSplit; act.splitZ = LANE_Z[spec.lane]; }
      });
      act.outcomes.sort((a, b) => b.at - a.at);
      mesh.instanceMatrix.needsUpdate = true;
      rings.instanceMatrix.needsUpdate = true;
    },
    dispose() { mesh.geometry.dispose(); rings.geometry.dispose(); },
  };
}
