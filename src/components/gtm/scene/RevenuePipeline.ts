// Layer C, the sales pipeline: one intake where every channel's engagement arrives, five station
// gates (accounts reached, engaged, meetings booked, qualified opps, proposal & negotiation), a
// side chute after each of the first four for the accounts that don't advance (they drop to the
// revops ledge), a closed-lost branch after proposal, and the closed-won tray with its pink rim.
import * as THREE from 'three';
import {
  CHUTE_DX, CH_Y, DECK, INTAKE_X, LOST, LOST_BRANCH_X, TRACK_END, WON, stations,
} from './layout';
import { merge, place, puckGeometry, type Materials } from './materials';
import { disposeGroup, shadowed, slab, straightRail, twinRail } from './track';

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

export function createPipeline(mat: Materials) {
  const group = new THREE.Group();
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => shadowed(new THREE.Mesh(g, m));

  // ---- track: intake to the won tray, plus the lost branch
  group.add(mesh(merge([
    ...straightRail(INTAKE_X, TRACK_END, 0, { caps: [false, true], postFrom: 0.25 }),
    ...twinRail([[LOST_BRANCH_X - 0.1, CH_Y, 0], [LOST_BRANCH_X + 0.3, CH_Y - 0.01, 0.25], [LOST.x - 0.55, CH_Y - 0.06, LOST.z - 0.3], [LOST.x - 0.38, CH_Y - 0.1, LOST.z]], { posts: true, caps: [false, true], postFrom: 0.4 }),
  ]), mat.channel));

  // ---- intake collar: where engagement from every channel arrives
  group.add(mesh(merge([
    { g: puckGeometry(0.24, 0.05, 0.015, 32), m: place(INTAKE_X, 0, 0) },
    { g: new THREE.CylinderGeometry(0.03, 0.03, CH_Y - 0.12, 10), m: place(INTAKE_X, (CH_Y - 0.12) / 2 + 0.05, 0) },
  ]), mat.porcelain));
  const intake = mesh(new THREE.TorusGeometry(0.2, 0.022, 10, 32).rotateY(Math.PI / 2), mat.charcoal);
  intake.position.set(INTAKE_X, CH_Y + 0.1, 0);
  group.add(intake);

  // ---- station gates (porcelain arches), a charcoal index plate on each beam
  const gate: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
  stations.forEach((s) => {
    for (const z of [-0.34, 0.34]) {
      gate.push({ g: puckGeometry(0.11, 0.05, 0.015, 20), m: place(s.x, 0, z) });
      gate.push({ g: box(0.09, 0.86, 0.09), m: place(s.x, 0.48, z) });
    }
    gate.push({ g: box(0.13, 0.1, 0.82), m: place(s.x, 0.95, 0) });
  });
  group.add(mesh(merge(gate), mat.porcelain));
  // plates: grey at rest, flash pink as an account arrives (instance colour)
  const plates = new THREE.InstancedMesh(box(0.135, 0.03, 0.5), mat.light, stations.length);
  plates.castShadow = true;
  stations.forEach((s, k) => plates.setMatrixAt(k, place(s.x, 1.01, 0)));
  group.add(plates);

  // ---- dropout chutes: shallow porcelain channels from the track down to the deck's front edge
  const z0 = 0.3, z1 = DECK.z1 - 0.1, y0 = CH_Y - 0.06, y1 = 0.05;
  const len = Math.hypot(z1 - z0, y1 - y0);
  const tilt = Math.atan2(y0 - y1, z1 - z0);
  const chute = (x: number) => {
    const g = new THREE.Group();
    g.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2);
    g.rotation.x = tilt;
    g.add(mesh(box(0.22, 0.022, len), mat.porcelain));
    for (const sx of [-0.12, 0.12]) { const w = mesh(box(0.02, 0.07, len), mat.porcelain); w.position.set(sx, 0.035, 0); g.add(w); }
    return g;
  };
  stations.slice(0, 4).forEach((s) => {
    group.add(chute(s.x + CHUTE_DX));
    // a short post under the high end
    const p = mesh(new THREE.CylinderGeometry(0.02, 0.025, y0 - 0.02, 8), mat.porcelain);
    p.position.set(s.x + CHUTE_DX, (y0 - 0.02) / 2, z0 + 0.05);
    group.add(p);
  });

  // ---- closed won tray (pink rim) and closed lost tray (matte grey rim)
  const tray = (x: number, z: number, rimMat: THREE.Material) => {
    const t = mesh(slab(0.82, 0.82, 0.12, 0.1), mat.porcelain);
    t.position.set(x, 0, z);
    group.add(t);
    const rim = mesh(merge([
      { g: box(0.8, 0.07, 0.035), m: place(0, 0.155, -0.385) }, { g: box(0.8, 0.07, 0.035), m: place(0, 0.155, 0.385) },
      { g: box(0.035, 0.07, 0.8), m: place(-0.385, 0.155, 0) }, { g: box(0.035, 0.07, 0.8), m: place(0.385, 0.155, 0) },
    ]), rimMat);
    rim.position.set(x, 0, z);
    group.add(rim);
  };
  tray(WON.x, WON.z, mat.pink);
  tray(LOST.x, LOST.z, mat.lost);

  const off = new THREE.Color(0x2a2a31), on = new THREE.Color(0xe58fab), tmp = new THREE.Color();

  return {
    group,
    update(act: { station: Float64Array }, t: number) {
      for (let k = 0; k < stations.length; k++) {
        const a = Math.exp(-(((t - act.station[k] - 0.15) / 0.35) ** 2));
        plates.setColorAt(k, tmp.copy(off).lerp(on, a));
      }
      plates.instanceColor!.needsUpdate = true;
      const engaged = Math.exp(-(((t - act.station[0] + 0.6) / 0.3) ** 2));
      intake.scale.setScalar(1 + engaged * 0.12);
    },
    dispose() { disposeGroup(group); },
  };
}
