// Matte black spheres: potential customers. Every position is a pure function of loop time,
// so the loop is exact and a still frame can be rendered at any t.
import * as THREE from 'three';
import { RESET_AT, smooth } from './GTMAnimationController';
import { CH_Y, PAD_R, R, SPHERE_R, at, brokenRoutes, connectedRoutes, drains, stations, type RouteSpec } from './layout';
import type { Materials } from './materials';

type Route = RouteSpec & { xyz: Float32Array; cum: Float32Array; L: number; dwellS: number; travel: number };

const SAMPLES = 220;
const G = 7.5; // gravity for falls (scaled to the model)

function bake(spec: RouteSpec): Route {
  const curve = new THREE.CatmullRomCurve3(spec.pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
  const pts = curve.getSpacedPoints(SAMPLES);
  const xyz = new Float32Array(pts.length * 3);
  const cum = new Float32Array(pts.length);
  pts.forEach((p, i) => {
    xyz.set([p.x, p.y, p.z], i * 3);
    if (i) cum[i] = cum[i - 1] + p.distanceTo(pts[i - 1]);
  });
  const L = cum[cum.length - 1];
  let dwellS = -1;
  if (spec.dwellAt) {
    let best = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - spec.dwellAt![0], p.z - spec.dwellAt![2]);
      if (d < best) { best = d; dwellS = cum[i]; }
    });
  }
  return { ...spec, xyz, cum, L, dwellS, travel: L / spec.speed + (spec.dwell ?? 0) };
}

function sample(r: Route, s: number, out: THREE.Vector3) {
  const { cum, xyz } = r;
  if (s <= 0) return out.set(xyz[0], xyz[1], xyz[2]);
  if (s >= r.L) { const i = cum.length - 1; return out.set(xyz[i * 3], xyz[i * 3 + 1], xyz[i * 3 + 2]); }
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] < s) lo = mid; else hi = mid; }
  const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return out.set(
    xyz[lo * 3] + (xyz[hi * 3] - xyz[lo * 3]) * f,
    xyz[lo * 3 + 1] + (xyz[hi * 3 + 1] - xyz[lo * 3 + 1]) * f,
    xyz[lo * 3 + 2] + (xyz[hi * 3 + 2] - xyz[lo * 3 + 2]) * f,
  );
}

/** Distance along the route at local time tau (seconds since spawn), honouring the dwell. */
function distanceAt(r: Route, tau: number) {
  const s = tau * r.speed;
  if (r.dwellS < 0 || s <= r.dwellS) return s;
  const after = tau - (r.dwell ?? 0);
  return Math.max(r.dwellS, after * r.speed);
}

const stationXZ = stations.map((s) => at(s.deg, R, 0));
/** Spheres pass *through* stations: hidden inside the body, visible on the channels. */
function stationHide(p: THREE.Vector3) {
  let f = 1;
  for (const c of stationXZ) {
    const d = Math.hypot(p.x - c[0], p.z - c[2]);
    if (d < PAD_R) f = Math.min(f, smooth(0.3, 0.58, d));
  }
  return f;
}

export function createSpheres(mat: Materials) {
  const routes = [...brokenRoutes, ...connectedRoutes].map(bake);
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(SPHERE_R, 24, 16), mat.sphere, routes.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const activity = new Float32Array(stations.length);
  const pulses = new Float32Array(drains.length);
  const p = new THREE.Vector3(), prev = new THREE.Vector3(), dir = new THREE.Vector3();
  const m4 = new THREE.Matrix4();

  return {
    mesh,
    activity,
    pulses,
    update(t: number) {
      activity.fill(0);
      pulses.fill(0);
      routes.forEach((r, i) => {
        const tau = t - r.spawn;
        let scale = 0;
        if (tau >= 0) {
          scale = Math.min(1, tau / 0.28);
          const end = r.travel;
          if (tau < end) {
            sample(r, distanceAt(r, tau), p);
          } else {
            const tf = tau - end; // time since the route ran out
            sample(r, r.L, p);
            sample(r, r.L - 0.05, prev);
            dir.subVectors(p, prev).setY(0).normalize();
            if (r.fate === 'fall') {
              // roll off the open channel end, drop to the plinth, sink into the drain
              const drop = p.y - SPHERE_R;
              const tLand = Math.sqrt((2 * drop) / G);
              const tt = Math.min(tf, tLand);
              const d = drains[r.drain ?? 0];
              p.addScaledVector(dir, tt * 0.9);
              p.y -= 0.5 * G * tt * tt;
              if (tf > tLand) {
                const k = smooth(0, 0.45, tf - tLand);
                p.x += (d[0] - p.x) * k;
                p.z += (d[2] - p.z) * k;
                p.y = SPHERE_R * (1 - k * 0.9);
                scale *= 1 - smooth(0.15, 0.6, tf - tLand);
              }
              const near = tf - tLand;
              pulses[r.drain ?? 0] = Math.max(pulses[r.drain ?? 0], Math.exp(-(((near - 0.25) / 0.28) ** 2)));
            } else if (r.fate === 'stuck') {
              p.addScaledVector(dir, -0.035 * Math.abs(Math.sin(tf * 14)) * Math.exp(-tf * 2.5));
              scale *= 1 - smooth(1.1, 1.55, tf);
            } else if (r.fate === 'fade') {
              scale *= 1 - smooth(0, 0.6, tf);
              p.y += smooth(0, 0.6, tf) * 0.05;
            } else {
              // resting in the revenue bowl until the loop resets
              scale *= 1 - smooth(RESET_AT + 0.1 + i * 0.008, RESET_AT + 0.6, t);
            }
          }
          if (p.y > CH_Y) scale *= stationHide(p);
          // station activity: a sphere inside a station lights it up
          stationXZ.forEach((c, k) => {
            const d = Math.hypot(p.x - c[0], p.z - c[2]);
            if (d < 0.8 && tau < r.travel + 0.1) activity[k] = Math.max(activity[k], 1 - smooth(0.15, 0.8, d));
          });
        }
        m4.makeScale(scale || 1e-4, scale || 1e-4, scale || 1e-4).setPosition(p);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() { mesh.geometry.dispose(); },
  };
}
