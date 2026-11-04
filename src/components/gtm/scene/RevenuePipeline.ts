// The pipeline itself: a white twin-rail track from the market to the closed-won tray, broken at
// every handoff (pink drains below catch what leaks), and the charcoal bridges that close the gaps.
import * as THREE from 'three';
import {
  CH_Y, GAP_HALF, MARKET, TRACK_END, TRACK_START, TRAY, handoffs, type Vec,
} from './layout';
import { merge, place, type Materials } from './materials';

const RAIL_R = 0.026;
const RAIL_Z = 0.07;

const rail = (x0: number, x1: number, z: number, y = CH_Y) =>
  new THREE.CylinderGeometry(RAIL_R, RAIL_R, x1 - x0, 10).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, y, z);

/** Rounded rectangular slab (lies flat, top at y = h). */
export function slab(w: number, d: number, h: number, r: number, bevel = 0.02) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

export function createPipeline(mat: Materials) {
  const group = new THREE.Group();
  const shadowed = (m: THREE.Mesh) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- white track, interrupted at every handoff
  const white: { g: THREE.BufferGeometry; m?: THREE.Matrix4 }[] = [];
  const cuts = [TRACK_START - 0.45, ...handoffs.flatMap((h) => [h.x - GAP_HALF, h.x + GAP_HALF]), TRACK_END + 0.25];
  for (let i = 0; i < cuts.length; i += 2) {
    const [a, b] = [cuts[i], cuts[i + 1]];
    white.push({ g: rail(a, b, -RAIL_Z) }, { g: rail(a, b, RAIL_Z) });
    for (let x = a + 0.12; x < b - 0.05; x += 0.42) {
      white.push({ g: new THREE.BoxGeometry(0.05, 0.026, 0.24), m: place(x, CH_Y - 0.03, 0) }); // sleepers
    }
    for (let x = a + 0.3; x < b - 0.2; x += 0.95) {
      white.push({ g: new THREE.CylinderGeometry(0.022, 0.03, CH_Y - 0.04, 8), m: place(x, (CH_Y - 0.04) / 2, 0) }); // posts
    }
    // open rail ends at a gap get small end caps, so the break reads as deliberate damage, not a seam
    if (i > 0) white.push({ g: new THREE.BoxGeometry(0.03, 0.07, 0.2), m: place(a + 0.015, CH_Y, 0) });
    if (i < cuts.length - 2) white.push({ g: new THREE.BoxGeometry(0.03, 0.07, 0.2), m: place(b - 0.015, CH_Y, 0) });
  }
  group.add(shadowed(new THREE.Mesh(merge(white), mat.channel)));

  // ---- bridges: charcoal rails that slide in across each gap (scale along x from the centre)
  const bridges = handoffs.map((h) => {
    const parts = [
      { g: rail(-GAP_HALF - 0.04, GAP_HALF + 0.04, -RAIL_Z, 0) }, { g: rail(-GAP_HALF - 0.04, GAP_HALF + 0.04, RAIL_Z, 0) },
      { g: new THREE.BoxGeometry(0.05, 0.026, 0.24), m: place(-0.14, -0.03, 0) },
      { g: new THREE.BoxGeometry(0.05, 0.026, 0.24), m: place(0.14, -0.03, 0) },
    ];
    const m = shadowed(new THREE.Mesh(merge(parts), mat.charcoal));
    m.position.set(h.x, CH_Y, 0);
    m.scale.set(1e-4, 1, 1);
    group.add(m);
    return m;
  });

  // ---- drains under each gap: where prospects leak out of the pipeline
  const drainRing = new THREE.InstancedMesh(new THREE.RingGeometry(0.12, 0.2, 40).rotateX(-Math.PI / 2), mat.drain, handoffs.length);
  const drainCore = new THREE.InstancedMesh(new THREE.CircleGeometry(0.12, 32).rotateX(-Math.PI / 2), mat.drainCore, handoffs.length);
  group.add(drainRing, drainCore);

  // ---- market tray (left) and closed-won tray (right)
  const market = shadowed(new THREE.Mesh(slab(MARKET.cols * MARKET.gap + 0.32, MARKET.rows * MARKET.gap + 0.32, 0.12, 0.14), mat.porcelain));
  market.position.set(MARKET.x, 0, MARKET.z);
  group.add(market);
  const won = shadowed(new THREE.Mesh(slab(1.02, 1.02, 0.12, 0.12), mat.porcelain));
  won.position.set(TRAY[0], 0, TRAY[2]);
  group.add(won);
  const rimParts = [
    { g: new THREE.BoxGeometry(0.98, 0.07, 0.035), m: place(0, 0.155, -0.47) },
    { g: new THREE.BoxGeometry(0.98, 0.07, 0.035), m: place(0, 0.155, 0.47) },
    { g: new THREE.BoxGeometry(0.035, 0.07, 0.98), m: place(-0.47, 0.155, 0) },
    { g: new THREE.BoxGeometry(0.035, 0.07, 0.98), m: place(0.47, 0.155, 0) },
  ];
  const rim = shadowed(new THREE.Mesh(merge(rimParts), mat.pink));
  rim.position.set(TRAY[0], 0, TRAY[2]);
  group.add(rim);

  const m4 = new THREE.Matrix4();
  const drainAt: Vec[] = handoffs.map((h) => [h.x, 0, 0]);

  return {
    group,
    update(st: { bridges: number[]; drains: number }, pulses: Float32Array) {
      bridges.forEach((b, i) => {
        const v = Math.max(1e-4, st.bridges[i]);
        b.scale.set(v, 1, 1);
        b.visible = v > 1e-3;
      });
      drainAt.forEach((d, i) => {
        const k = Math.max(1e-4, st.drains * (1 + 0.5 * pulses[i]));
        drainRing.setMatrixAt(i, m4.makeScale(k, 1, k).setPosition(d[0], 0.004, d[2]));
        const c = Math.max(1e-4, st.drains);
        drainCore.setMatrixAt(i, m4.makeScale(c, 1, c).setPosition(d[0], 0.005, d[2]));
      });
      drainRing.instanceMatrix.needsUpdate = true;
      drainCore.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    },
  };
}
