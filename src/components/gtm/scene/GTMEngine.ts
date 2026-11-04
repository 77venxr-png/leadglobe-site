// leadglobe's part of the model: the engine hub, the charcoal spine that runs behind the pipeline
// and branches into every service module, and the gtm strategy unit that scans the market and
// marks the accounts worth pursuing.
import * as THREE from 'three';
import { HUB, MARKET, MODULE_Z, SPINE_Z, handoffs } from './layout';
import { gearGeometry, puckGeometry, type Materials } from './materials';

const SPINE_Y = 0.09;
const DROP = 1.6;

const tubeAlong = (pts: THREE.Vector3[], r: number, seg = 64) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.2), seg, r, 8, false);

export function createEngine(mat: Materials) {
  const group = new THREE.Group();
  const shadowed = <T extends THREE.Mesh>(m: T) => { m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- spine: from the strategy unit, along the back, to the last module. Drawn left to right.
  const x0 = MARKET.x + 0.2, x1 = handoffs[handoffs.length - 1].x + 0.05;
  const spinePts = [new THREE.Vector3(x0, SPINE_Y, MARKET.z - 1.45), new THREE.Vector3(x0 + 0.5, SPINE_Y, SPINE_Z),
    new THREE.Vector3(HUB[0], SPINE_Y, SPINE_Z), new THREE.Vector3(x1, SPINE_Y, SPINE_Z)];
  const spineGeo = tubeAlong(spinePts, 0.05, 160);
  const spine = shadowed(new THREE.Mesh(spineGeo, mat.charcoal));
  spineGeo.setDrawRange(0, 0);
  group.add(spine);
  const spineLen = x1 - x0 + 0.02; // arc length (the tube is built arc-length uniform)
  // branches from the spine forward into each module
  const branches = handoffs.map((h) => {
    const g = tubeAlong([new THREE.Vector3(h.x, SPINE_Y, SPINE_Z), new THREE.Vector3(h.x, SPINE_Y, MODULE_Z - 0.38)], 0.04, 12);
    const m = shadowed(new THREE.Mesh(g, mat.charcoal));
    g.setDrawRange(0, 0);
    group.add(m);
    return { m, at: (h.x - x0 + 0.02) / spineLen };
  });

  // ---- hub: a small machined engine sitting on the spine
  const hub = new THREE.Group();
  hub.position.set(HUB[0], 0, HUB[2]);
  const hubParts = new THREE.Group();
  hub.add(hubParts);
  hubParts.add(shadowed(new THREE.Mesh(puckGeometry(0.6, 0.12, 0.03, 56), mat.charcoal)));
  const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.06, 14, 64).rotateX(Math.PI / 2), mat.porcelain));
  ring.position.y = 0.18;
  const gear = shadowed(new THREE.Mesh(gearGeometry(0.38, 0.32, 18, 0.1, 0.12), mat.charcoal));
  gear.position.y = 0.2;
  const core = shadowed(new THREE.Mesh(puckGeometry(0.2, 0.36, 0.04, 40), mat.porcelain));
  core.position.y = 0.12;
  const crown = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 10, 40).rotateX(Math.PI / 2), mat.pink));
  crown.position.y = 0.49;
  hubParts.add(ring, gear, core, crown);
  group.add(hub);

  // ---- strategy unit: a charcoal frame over the market with a scan bar
  const fw = MARKET.cols * MARKET.gap + 0.5, fd = MARKET.rows * MARKET.gap + 0.5, fy = 0.62;
  const strategy = new THREE.Group();
  strategy.position.set(MARKET.x, 0, MARKET.z);
  const sBody = new THREE.Group();
  strategy.add(sBody);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const p = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, fy, 10), mat.charcoal));
    p.position.set((x * fw) / 2, fy / 2, (z * fd) / 2);
    sBody.add(p);
  }
  for (const [w, d, x, z] of [[fw, 0.03, 0, -fd / 2], [fw, 0.03, 0, fd / 2], [0.03, fd, -fw / 2, 0], [0.03, fd, fw / 2, 0]]) {
    const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.03, d), mat.charcoal));
    b.position.set(x, fy, z);
    sBody.add(b);
  }
  const bar = new THREE.Group();
  const beam = shadowed(new THREE.Mesh(new THREE.BoxGeometry(fw, 0.05, 0.09), mat.porcelain));
  const edge = new THREE.Mesh(new THREE.BoxGeometry(fw - 0.06, 0.012, 0.03), mat.pink);
  edge.position.y = -0.03;
  bar.add(beam, edge);
  bar.position.y = fy - 0.02;
  sBody.add(bar);
  group.add(strategy);

  const scanZ = (scan: number) => MARKET.z - fd / 2 + 0.1 + scan * (fd - 0.2);
  let angle = 0;

  return {
    group,
    /** Frame of the market scan bar, so spheres can light up as it passes. */
    scanZ,
    update(st: { hub: number; spine: number; strategy: number; scan: number; spin: number }, dt: number) {
      const total = spineGeo.index!.count, step = 8 * 6;
      spineGeo.setDrawRange(0, Math.round((st.spine * total) / step) * step);
      spine.visible = st.spine > 0.001;
      branches.forEach((b) => {
        const p = Math.min(1, Math.max(0, (st.spine - b.at + 0.1) / 0.1)); // grows as the spine reaches it
        const g = b.m.geometry;
        g.setDrawRange(0, Math.round((p * g.index!.count) / step) * step);
        b.m.visible = p > 0;
      });
      hub.visible = st.hub > 0.002;
      hubParts.position.y = (1 - st.hub) * DROP;
      hubParts.scale.setScalar(0.6 + 0.4 * Math.min(1, st.hub));
      strategy.visible = st.strategy > 0.002;
      sBody.position.y = (1 - st.strategy) * DROP;
      bar.position.z = scanZ(st.scan) - MARKET.z;
      const speed = 0.6 * st.spin;
      angle += speed * dt;
      ring.rotation.y = angle * 0.5;
      gear.rotation.y = -angle;
      crown.rotation.y = angle * 1.3;
      return speed;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    },
  };
}
