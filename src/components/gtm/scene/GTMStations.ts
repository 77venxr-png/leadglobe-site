// Stage gates the track passes through (accounts → opportunity), and the five service modules that
// dock behind the handoffs once leadglobe connects the pipeline. Each module keeps one moving
// mechanism: idle while docking, then locked to the engine's rhythm.
import * as THREE from 'three';
import { CH_Y, MODULE_Z, handoffs, services, stages, type ServiceId } from './layout';
import { gearGeometry, merge, place, puckGeometry, type Materials } from './materials';

type Spinner = { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; own: number; ratio: number };
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg);
const DROP = 1.6;

export function createStations(mat: Materials) {
  const group = new THREE.Group();
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const o = new THREE.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  };

  // ---- gates: porcelain arches over the track, one per stage before closed won
  const gateParts: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
  stages.slice(0, -1).forEach((s) => {
    for (const z of [-0.34, 0.34]) {
      gateParts.push({ g: puckGeometry(0.11, 0.05, 0.015, 20), m: place(s.x, 0, z) });
      gateParts.push({ g: box(0.09, 0.86, 0.09), m: place(s.x, 0.48, z) });
    }
    gateParts.push({ g: box(0.13, 0.1, 0.82), m: place(s.x, 0.95, 0) });
  });
  group.add(mesh(merge(gateParts), mat.porcelain));
  // a charcoal index plate on each beam
  const plates = stages.slice(0, -1).map((s) => ({ g: box(0.135, 0.03, 0.5), m: place(s.x, 1.01, 0) }));
  group.add(mesh(merge(plates), mat.charcoal));

  // ---- service modules
  const spinners: Spinner[] = [];
  const modules = services.map((svc, k) => {
    const root = new THREE.Group();
    root.position.set(handoffs[k].x, 0, MODULE_Z);
    const body = new THREE.Group();
    root.add(body);
    group.add(root);
    const P = (g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) => { const o = mesh(g, mat.porcelain); o.position.set(x, y, z); o.rotation.y = ry; body.add(o); return o; };
    const C = (g: THREE.BufferGeometry, x: number, y: number, z: number) => { const o = mesh(g, mat.charcoal); o.position.set(x, y, z); body.add(o); return o; };
    const spin = (obj: THREE.Object3D, axis: Spinner['axis'], own: number, ratio: number, x: number, y: number, z: number) => {
      obj.position.set(x, y, z);
      body.add(obj);
      spinners.push({ obj, axis, own, ratio });
    };

    P(puckGeometry(0.44, 0.08), 0, 0, 0);
    // docking arm reaching to the track, ends in a clamp just behind the rail
    P(box(0.1, 0.06, 0.7), 0, CH_Y + 0.02, 0.5);
    C(box(0.16, 0.1, 0.08), 0, CH_Y + 0.02, 0.86);
    C(cyl(0.025, CH_Y), 0, CH_Y / 2, 0.42);

    const id: ServiceId = svc.id;
    if (id === 'outbound') {
      P(box(0.56, 0.3, 0.42), 0, 0.23, -0.05);
      C(box(0.4, 0.04, 0.3), 0, 0.4, -0.05);
      P(cyl(0.035, 0.22), 0.1, 0.52, -0.08);
      const sweep = new THREE.Group();
      const a = mesh(box(0.34, 0.03, 0.045), mat.charcoal); a.position.x = 0.13;
      const tip = mesh(new THREE.SphereGeometry(0.042, 16, 12), mat.charcoal); tip.position.x = 0.3;
      sweep.add(a, tip);
      spin(sweep, 'y', -1.6, 1, 0.1, 0.64, -0.08);
    } else if (id === 'paid') {
      P(puckGeometry(0.28, 0.12), 0, 0.08, 0);
      const bb = new THREE.Group();
      const l = mesh(cyl(0.02, 0.38, 10), mat.charcoal), r = l.clone();
      l.position.set(-0.25, 0.19, 0); r.position.set(0.25, 0.19, 0);
      const panel = mesh(box(0.72, 0.38, 0.04), mat.porcelain); panel.position.y = 0.53;
      const rim = mesh(box(0.76, 0.035, 0.055), mat.charcoal); rim.position.y = 0.33;
      bb.add(l, r, panel, rim);
      spin(bb, 'y', 0.5, 0.5, 0, 0.2, 0);
    } else if (id === 'content') {
      [[0.11, 0], [0.17, 0.14], [0.23, -0.1]].forEach(([y, ry]) => P(box(0.58, 0.055, 0.42), 0, y, 0, ry));
      C(box(0.045, 0.22, 0.44), -0.31, 0.2, 0);
      const sheet = new THREE.Group();
      const g = new THREE.Mesh(box(0.54, 0.032, 0.4), mat.glass);
      const spine = mesh(box(0.54, 0.012, 0.028), mat.charcoal); spine.position.set(0, 0.022, 0.18);
      sheet.add(g, spine);
      spin(sheet, 'y', 0.6, 0.5, 0, 0.3, 0);
    } else if (id === 'abm') {
      P(puckGeometry(0.32, 0.28), 0, 0.08, 0);
      C(cyl(0.045, 0.1), 0, 0.41, 0);
      const outer = mesh(new THREE.TorusGeometry(0.22, 0.018, 10, 48), mat.charcoal);
      const inner = mesh(new THREE.TorusGeometry(0.13, 0.016, 10, 40), mat.charcoal);
      inner.rotation.y = Math.PI / 2;
      outer.add(inner);
      const dot = mesh(new THREE.SphereGeometry(0.045, 16, 12), mat.pink);
      outer.add(dot);
      spin(outer, 'y', -1.1, 1, 0, 0.7, 0);
    } else if (id === 'revops') {
      P(box(0.62, 0.26, 0.5), 0, 0.21, 0);
      C(box(0.5, 0.035, 0.1), 0, 0.355, 0);
      const g1 = mesh(gearGeometry(0.19, 0.155, 12, 0.055, 0.035), mat.charcoal);
      const g2 = mesh(gearGeometry(0.135, 0.104, 9, 0.055, 0.028), mat.charcoal);
      g1.rotation.x = g2.rotation.x = Math.PI / 2;
      const h1 = new THREE.Group(); h1.add(g1);
      const h2 = new THREE.Group(); h2.add(g2);
      spin(h1, 'z', 1.2, 1, -0.11, 0.56, 0);
      spin(h2, 'z', -1.6, -12 / 9, 0.195, 0.505, 0);
    }
    return { root, body };
  });

  // Activity lights: a puck on each module pad, grey at rest, pink while its handoff is working.
  const lights = new THREE.InstancedMesh(puckGeometry(0.07, 0.045, 0.015, 24), mat.pink, services.length);
  const off = new THREE.Color(0xdcd6d5), on = new THREE.Color(0xe58fab), tmp = new THREE.Color();
  const m4 = new THREE.Matrix4();
  group.add(lights);

  const angles = new Float32Array(spinners.length);

  return {
    group,
    update(st: { modules: number[]; sync: number }, dt: number, engineSpeed: number, activity: Float32Array) {
      modules.forEach((m, k) => {
        const a = st.modules[k];
        m.root.visible = a > 0.002;
        m.body.position.y = (1 - a) * DROP;
        m.body.scale.setScalar(0.6 + 0.4 * Math.min(1, a));
      });
      spinners.forEach((sp, i) => {
        angles[i] += (sp.own * (1 - st.sync) + engineSpeed * sp.ratio * st.sync) * dt;
        sp.obj.rotation[sp.axis] = angles[i];
      });
      services.forEach((_, k) => {
        const a = activity[k] * Math.min(1, st.modules[k]);
        lights.setColorAt(k, tmp.copy(off).lerp(on, a));
        const s = Math.max(1e-4, Math.min(1, st.modules[k]));
        m4.makeScale(s * (1 + a * 0.25), s * (1 + a * 0.9), s * (1 + a * 0.25))
          .setPosition(handoffs[k].x + 0.3, 0.08 + (1 - Math.min(1, st.modules[k])) * DROP, MODULE_Z + 0.28);
        lights.setMatrixAt(k, m4);
      });
      lights.instanceColor!.needsUpdate = true;
      lights.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    },
  };
}
