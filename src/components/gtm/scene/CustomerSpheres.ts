// Matte black spheres: prospect accounts. They start in the market tray; run 0 sends random ones
// down the broken pipeline, run 1 sends the ones strategy marked (pink ring) down the connected one.
// Every position is a pure function of loop time, and the stage counts are read from the same data.
import * as THREE from 'three';
import { RESET_AT, smooth } from './GTMAnimationController';
import {
  GAP_HALF, RUN1_AT, SPHERE_R, SY, TRACK_END, TRACK_START, TRAY, handoffs, marketSlots, sphereSpecs, stages, traySlots,
  type SphereSpec, type Vec,
} from './layout';
import type { Materials } from './materials';

type Route = SphereSpec & { xyz: Float32Array; cum: Float32Array; L: number; travel: number; entryS: number };

const SAMPLES = 240;
const G = 7.5;
const REGROW = RESET_AT + 0.3; // market refills from here

function bake(spec: SphereSpec): Route {
  const s = marketSlots[spec.slot];
  const pts: Vec[] = [s, [s[0] + 0.35, 0.6, s[2] * 0.5], [TRACK_START - 0.4, SY + 0.06, 0], [TRACK_START, SY, 0]];
  const endX = spec.fate < 5 ? handoffs[spec.fate].x - GAP_HALF + 0.08 : TRACK_END + 0.2;
  for (let x = TRACK_START + 0.8; x < endX - 0.2; x += 0.8) pts.push([x, SY, 0]);
  pts.push([endX, SY, 0]);
  if (spec.fate === 5) {
    const slot = traySlots[spec.tray ?? 0];
    pts.push([TRAY[0] - 0.25, 0.56, slot[2] * 0.4], slot);
  }
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const sp = curve.getSpacedPoints(SAMPLES);
  const xyz = new Float32Array(sp.length * 3);
  const cum = new Float32Array(sp.length);
  let entryS = 0;
  sp.forEach((p, i) => {
    xyz.set([p.x, p.y, p.z], i * 3);
    if (i) cum[i] = cum[i - 1] + p.distanceTo(sp[i - 1]);
    if (!entryS && p.x >= TRACK_START) entryS = cum[i];
  });
  const L = cum[cum.length - 1];
  return { ...spec, xyz, cum, L, travel: L / spec.speed, entryS };
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

export function createSpheres(mat: Materials, scanZ: (scan: number) => number) {
  const bySlot: (Route | null)[] = marketSlots.map(() => null);
  sphereSpecs.forEach((s) => { bySlot[s.slot] = bake(s); });
  const n = marketSlots.length;

  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(SPHERE_R, 24, 16), mat.sphere, n);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  // pink "qualified" ring around each account strategy picked
  const qualified = sphereSpecs.filter((s) => s.run === 1).map((s) => s.slot);
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(SPHERE_R + 0.03, 0.016, 8, 32).rotateX(Math.PI / 2), mat.pink, qualified.length);
  rings.frustumCulled = false;

  const activity = new Float32Array(handoffs.length);
  const pulses = new Float32Array(handoffs.length);
  const counts = new Int32Array(stages.length);
  const p = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const pos = Array.from({ length: n }, () => new THREE.Vector3());
  const scl = new Float32Array(n);

  return {
    mesh,
    rings,
    activity,
    pulses,
    counts,
    update(t: number, scan: number) {
      activity.fill(0);
      pulses.fill(0);
      counts.fill(0);
      const run = t < RUN1_AT ? 0 : 1;
      for (let i = 0; i < n; i++) {
        const r = bySlot[i];
        const slot = marketSlots[i];
        let scale = 1;
        p.set(slot[0], slot[1], slot[2]);
        if (r && t >= r.spawn && t < REGROW) {
          const tau = t - r.spawn;
          const s = tau * r.speed;
          let x: number; // furthest x reached on the track, for the counts
          if (tau < r.travel) {
            sample(r, s, p);
            x = s >= r.entryS ? p.x : -Infinity;
            if (r.run === 1) handoffs.forEach((h, k) => {
              if (s >= r.entryS) activity[k] = Math.max(activity[k], 1 - Math.min(1, Math.abs(p.x - h.x) / 0.5));
            });
          } else {
            const tf = tau - r.travel;
            sample(r, r.L, p);
            x = Infinity;
            if (r.fate < 5) {
              // fall through the gap onto the plinth, then sink into the drain
              const drop = p.y - SPHERE_R;
              const tLand = Math.sqrt((2 * drop) / G);
              const tt = Math.min(tf, tLand);
              const d = handoffs[r.fate].x;
              p.x += tt * 0.9;
              p.y -= 0.5 * G * tt * tt;
              if (tf > tLand) {
                const k = smooth(0, 0.4, tf - tLand);
                p.x += (d - p.x) * k;
                p.y = SPHERE_R * (1 - k * 0.9);
                scale = 1 - smooth(0.12, 0.55, tf - tLand);
              }
              pulses[r.fate] = Math.max(pulses[r.fate], Math.exp(-(((tf - tLand - 0.2) / 0.28) ** 2)));
            } else {
              scale = 1 - smooth(RESET_AT, RESET_AT + 0.25, t); // resting in the closed-won tray
            }
          }
          if (r.run === run) {
            for (let g = 0; g < stages.length - 1; g++) if (r.fate >= g && x >= stages[g].x) counts[g]++;
            if (r.fate === 5 && tau >= r.travel) counts[stages.length - 1]++;
          }
        } else if (r && t >= REGROW) {
          scale = smooth(REGROW, REGROW + 0.45, t);
        }
        pos[i].copy(p);
        scl[i] = scale;
        m4.makeScale(scale || 1e-4, scale || 1e-4, scale || 1e-4).setPosition(p);
        mesh.setMatrixAt(i, m4);
      }
      // qualified rings: appear as the scan bar passes, ride with the sphere
      const sz = scanZ(scan);
      qualified.forEach((slot, j) => {
        const shown = scan > 0 ? smooth(-0.05, 0.12, sz - marketSlots[slot][2]) : 0;
        const s = Math.max(1e-4, shown * scl[slot]);
        m4.makeScale(s, s, s).setPosition(pos[slot]);
        rings.setMatrixAt(j, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
      rings.instanceMatrix.needsUpdate = true;
    },
    dispose() { mesh.geometry.dispose(); rings.geometry.dispose(); },
  };
}
