// The pipeline: the fragmented white channels (with their gaps and drains), the prospect hopper,
// the revenue bowl, and what leadglobe adds: charcoal bridges, radial rails and pink lock collars.
import * as THREE from 'three';
import {
  CH_R, CH_Y, ENGINE_R, HOPPER, HOPPER_R, BOWL, BOWL_RIM_Y, PAD_DEG, R, SPUR_END, SPUR_GAP,
  arc, at, drains, radial, rad, rails, ringGaps, stations, type Vec,
} from './layout';
import { merge, place, type Materials } from './materials';

const v3 = (p: Vec) => new THREE.Vector3(p[0], p[1], p[2]);
const tube = (pts: Vec[], r = CH_R, seg?: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(v3), false, 'centripetal');
  return new THREE.TubeGeometry(curve, seg ?? Math.max(8, pts.length * 3), r, 8, false);
};
const centred = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox();
  const c = new THREE.Vector3();
  g.boundingBox!.getCenter(c);
  g.translate(-c.x, -c.y, -c.z);
  return { g, c };
};

export function createPipeline(mat: Materials) {
  const group = new THREE.Group();
  const white: { g: THREE.BufferGeometry; m?: THREE.Matrix4 }[] = [];
  const post = (p: Vec) => white.push({ g: new THREE.CylinderGeometry(0.022, 0.03, CH_Y, 8), m: place(p[0], CH_Y / 2, p[2]) });

  // Ring channels between neighbouring stations, interrupted by the gaps.
  const stops: [number, number][] = [];
  stations.forEach((s, k) => {
    const a = s.deg + PAD_DEG - 1.5;
    const b = (k === stations.length - 1 ? 360 : stations[k + 1].deg) - PAD_DEG + 1.5;
    let from = a;
    for (const g of ringGaps) {
      if (g.deg > a && g.deg < b) { stops.push([from, g.deg - g.half]); from = g.deg + g.half; }
    }
    stops.push([from, b]);
  });
  for (const [a, b] of stops) {
    white.push({ g: tube(arc(a, b, R, CH_Y)) });
    for (let d = a + 6; d < b - 3; d += 17) post(at(d, R, 0));
  }
  // Spur from the hopper to the ring (works), and the broken spur to the revenue bowl.
  white.push({ g: tube(radial(270, R, HOPPER_R - 0.4, CH_Y)) });
  post(at(270, 3.75, 0));
  white.push({ g: tube(radial(90, R, SPUR_GAP.from, CH_Y)) });
  white.push({ g: new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), m: place(0, CH_Y, SPUR_GAP.from + 0.01, 0, Math.PI / 2) }); // end stop
  white.push({ g: tube(radial(90, SPUR_GAP.to, SPUR_END + 0.06, CH_Y)) });
  post(at(90, SPUR_GAP.to + 0.06, 0));

  const channels = new THREE.Mesh(merge(white), mat.channel);
  channels.castShadow = true;
  channels.receiveShadow = true;
  group.add(channels);

  // Bridges: charcoal pieces that close each gap (scale in from their centre).
  const bridgeGeoms = [
    ...ringGaps.map((g) => tube(arc(g.deg - g.half - 1.2, g.deg + g.half + 1.2, R, CH_Y), CH_R * 1.15)),
    tube(radial(90, SPUR_GAP.from - 0.04, SPUR_GAP.to + 0.04, CH_Y), CH_R * 1.15),
  ];
  const bridges = bridgeGeoms.map((geo) => {
    const { g, c } = centred(geo);
    const m = new THREE.Mesh(g, mat.charcoal);
    m.position.copy(c);
    m.castShadow = true;
    m.scale.setScalar(0);
    group.add(m);
    return m;
  });

  // Radial rails from the engine, drawn outward.
  const railMeshes = rails.map((r) => {
    const g = tube(radial(r.deg, ENGINE_R - 0.06, r.to, CH_Y), 0.042, 48);
    const m = new THREE.Mesh(g, mat.charcoal);
    m.castShadow = true;
    g.setDrawRange(0, 0);
    group.add(m);
    return { m, total: g.index!.count, step: 8 * 6 };
  });
  // Rail supports under each rail end: tiny charcoal posts that rise with the collars.
  const collars = new THREE.InstancedMesh(new THREE.TorusGeometry(0.062, 0.022, 10, 28), mat.pink, rails.length);
  const supports = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.026, CH_Y, 8), mat.charcoal, rails.length * 2);
  collars.castShadow = supports.castShadow = true;
  group.add(collars, supports);

  // Drains under the gaps: a dark core in a pink ring. Close (scale to 0) once bridged.
  const drainRing = new THREE.InstancedMesh(new THREE.RingGeometry(0.1, 0.17, 40).rotateX(-Math.PI / 2), mat.drain, drains.length);
  const drainCore = new THREE.InstancedMesh(new THREE.CircleGeometry(0.1, 32).rotateX(-Math.PI / 2), mat.drainCore, drains.length);
  group.add(drainRing, drainCore);

  // Hopper (prospects arrive) at the back, revenue bowl at the front.
  const hopperProfile = [[0, 0], [0.36, 0], [0.37, 0.4], [0.5, 0.72], [0.52, 0.78], [0.47, 0.78], [0.33, 0.46], [0, 0.44]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const hopper = new THREE.Mesh(new THREE.LatheGeometry(hopperProfile, 40), mat.porcelain);
  hopper.position.set(HOPPER[0], 0, HOPPER[2]);
  const hopperRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 8, 48).rotateX(Math.PI / 2), mat.charcoal);
  hopperRim.position.set(HOPPER[0], 0.785, HOPPER[2]);
  const bowlProfile = [[0, 0], [0.3, 0], [0.33, 0.06], [0.5, 0.2], [0.6, 0.42], [0.62, BOWL_RIM_Y], [0.56, BOWL_RIM_Y], [0.5, 0.37], [0.38, 0.22], [0, 0.16]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 48), mat.porcelain);
  bowl.position.set(BOWL[0], 0, BOWL[2]);
  const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.59, 0.024, 8, 56).rotateX(Math.PI / 2), mat.pink);
  bowlRim.position.set(BOWL[0], BOWL_RIM_Y + 0.005, BOWL[2]);
  for (const m of [hopper, hopperRim, bowl, bowlRim]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  return {
    group,
    update(st: { rails: number[]; collars: number[]; bridges: number[]; drains: number }, pulses: Float32Array) {
      bridges.forEach((b, i) => b.scale.setScalar(Math.max(1e-4, st.bridges[i])));
      railMeshes.forEach(({ m, total, step }, i) => {
        const n = Math.round((st.rails[i] * total) / step) * step;
        m.geometry.setDrawRange(0, n);
        m.visible = n > 0;
      });
      rails.forEach((r, i) => {
        const c = Math.max(1e-4, st.collars[i]);
        p.set(...at(r.deg, r.to - 0.04, CH_Y));
        q.setFromAxisAngle(yAxis, -rad(r.deg)).multiply(new THREE.Quaternion().setFromAxisAngle(yAxis, Math.PI / 2));
        collars.setMatrixAt(i, m4.compose(p, q, s.setScalar(c)));
        // two supports per rail: near the end and midway, growing up from the plinth
        const mid = (ENGINE_R + r.to) / 2;
        [r.to - 0.25, mid].forEach((rr, j) => {
          p.set(...at(r.deg, rr, CH_Y / 2));
          p.y = (CH_Y / 2) * c;
          supports.setMatrixAt(i * 2 + j, m4.compose(p, q.identity(), s.set(c, c, c)));
        });
      });
      collars.instanceMatrix.needsUpdate = true;
      supports.instanceMatrix.needsUpdate = true;
      drains.forEach((d, i) => {
        const k = st.drains * (1 + 0.55 * pulses[i]);
        m4.makeScale(Math.max(1e-4, k), 1, Math.max(1e-4, k)).setPosition(d[0], 0.004 + i * 1e-4, d[2]);
        drainRing.setMatrixAt(i, m4);
        m4.makeScale(Math.max(1e-4, st.drains), 1, Math.max(1e-4, st.drains)).setPosition(d[0], 0.005 + i * 1e-4, d[2]);
        drainCore.setMatrixAt(i, m4);
      });
      drainRing.instanceMatrix.needsUpdate = true;
      drainCore.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    },
  };
}
