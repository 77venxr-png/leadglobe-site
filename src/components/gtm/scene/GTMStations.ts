// Six miniature stations around the ring. Static parts are merged into three meshes (porcelain,
// charcoal, glass-free); each station keeps one moving mechanism that runs at its own speed while
// siloed and locks to the engine's rhythm once connected.
import * as THREE from 'three';
import { CH_Y, PAD_R, R, at, rad, stations, type StationId } from './layout';
import { gearGeometry, merge, place, puckGeometry, type Materials } from './materials';

type Part = { g: THREE.BufferGeometry; m: THREE.Matrix4 };
type Spinner = { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; own: number; ratio: number };

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 20) => new THREE.CylinderGeometry(r, r, h, seg);

export function createStations(mat: Materials) {
  const group = new THREE.Group();
  const porcelain: Part[] = [];
  const charcoal: Part[] = [];
  const spinners: Spinner[] = [];

  stations.forEach((s) => {
    const [x, , z] = at(s.deg, R, 0);
    const th = rad(s.deg);
    const face = Math.atan2(-Math.cos(th), -Math.sin(th)); // local +z points at the engine
    const base = place(x, 0, z, face);
    const P = (g: THREE.BufferGeometry, m: THREE.Matrix4) => porcelain.push({ g, m: base.clone().multiply(m) });
    const C = (g: THREE.BufferGeometry, m: THREE.Matrix4) => charcoal.push({ g, m: base.clone().multiply(m) });
    /** A moving part, placed in station space. */
    const spin = (obj: THREE.Object3D, axis: Spinner['axis'], own: number, ratio: number, lx: number, ly: number, lz: number) => {
      const holder = new THREE.Group();
      holder.position.set(x, 0, z);
      holder.rotation.y = face;
      obj.position.set(lx, ly, lz);
      holder.add(obj);
      group.add(holder);
      spinners.push({ obj, axis, own, ratio });
    };
    const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => {
      const o = new THREE.Mesh(g, m);
      o.castShadow = true;
      o.receiveShadow = true;
      return o;
    };

    // Pad and the three channel ports every station shares (both ring sides, one towards the engine).
    P(puckGeometry(PAD_R, 0.1), new THREE.Matrix4());
    P(cyl(0.075, 0.16, 16), place(PAD_R - 0.06, CH_Y, 0, 0, 0, Math.PI / 2));
    P(cyl(0.075, 0.16, 16), place(-PAD_R + 0.06, CH_Y, 0, 0, 0, Math.PI / 2));
    P(cyl(0.075, 0.16, 16), place(0, CH_Y, PAD_R - 0.06, 0, Math.PI / 2));

    const id: StationId = s.id;
    if (id === 'strategy') {
      // stepped tower with a turning compass arm on top
      P(box(0.72, 0.26, 0.72), place(0, 0.23, 0));
      P(box(0.52, 0.24, 0.52), place(0, 0.48, 0));
      P(box(0.32, 0.3, 0.32), place(0, 0.75, 0));
      C(cyl(0.035, 0.05), place(0, 0.925, 0));
      const arm = new THREE.Group();
      arm.add(mesh(box(0.42, 0.022, 0.035), mat.charcoal));
      arm.children[0].position.x = 0.1;
      spin(arm, 'y', 0.9, 1, 0, 0.955, 0);
    } else if (id === 'outbound') {
      // sending block with a sweeping antenna arm
      P(box(0.74, 0.36, 0.56), place(0, 0.28, 0));
      C(box(0.5, 0.05, 0.4), place(0, 0.485, 0));
      P(cyl(0.04, 0.24), place(0.12, 0.62, -0.06));
      const sweep = new THREE.Group();
      const a = mesh(box(0.38, 0.03, 0.05), mat.charcoal);
      a.position.x = 0.14;
      const tip = mesh(new THREE.SphereGeometry(0.045, 16, 12), mat.charcoal);
      tip.position.x = 0.33;
      sweep.add(a, tip);
      spin(sweep, 'y', -1.6, 1, 0.12, 0.75, -0.06);
    } else if (id === 'paid') {
      // turning billboard on a round base
      P(puckGeometry(0.32, 0.14), place(0, 0.1, 0));
      const bb = new THREE.Group();
      const postL = mesh(cyl(0.022, 0.42, 10), mat.charcoal);
      const postR = postL.clone();
      postL.position.set(-0.28, 0.21, 0);
      postR.position.set(0.28, 0.21, 0);
      const panel = mesh(box(0.8, 0.42, 0.045), mat.porcelain);
      panel.position.y = 0.58;
      const rim = mesh(box(0.84, 0.04, 0.06), mat.charcoal);
      rim.position.y = 0.36;
      bb.add(postL, postR, panel, rim);
      spin(bb, 'y', 0.45, 0.5, 0, 0.24, 0);
    } else if (id === 'content') {
      // a stack of pages; the glass top sheet turns
      [[0.13, 0], [0.2, 0.14], [0.27, -0.1]].forEach(([y, r]) => P(box(0.66, 0.06, 0.48), place(0, y, 0, r)));
      C(box(0.05, 0.26, 0.5), place(-0.36, 0.23, 0));
      const sheet = new THREE.Group();
      const g = new THREE.Mesh(box(0.62, 0.035, 0.46), mat.glass);
      g.castShadow = false;
      const spine = mesh(box(0.62, 0.012, 0.03), mat.charcoal);
      spine.position.set(0, 0.024, 0.2);
      sheet.add(g, spine);
      spin(sheet, 'y', 0.6, 0.5, 0, 0.345, 0);
    } else if (id === 'abm') {
      // targeting gyroscope: two nested rings on a drum
      P(puckGeometry(0.36, 0.3), place(0, 0.1, 0));
      C(cyl(0.05, 0.12), place(0, 0.46, 0));
      const outer = mesh(new THREE.TorusGeometry(0.25, 0.02, 10, 48), mat.charcoal);
      const inner = mesh(new THREE.TorusGeometry(0.15, 0.018, 10, 40), mat.charcoal);
      inner.rotation.y = Math.PI / 2;
      outer.add(inner);
      const dot = mesh(new THREE.SphereGeometry(0.05, 16, 12), mat.porcelain);
      outer.add(dot);
      spin(outer, 'y', -1.1, 1, 0, 0.78, 0);
    } else if (id === 'revops') {
      // a block with two meshing gears standing on it
      P(box(0.72, 0.28, 0.6), place(0, 0.24, 0));
      C(box(0.56, 0.04, 0.12), place(0, 0.4, 0));
      const g1 = mesh(gearGeometry(0.21, 0.17, 12, 0.06, 0.04), mat.charcoal);
      const g2 = mesh(gearGeometry(0.15, 0.115, 9, 0.06, 0.03), mat.charcoal);
      g1.rotation.x = Math.PI / 2;
      g2.rotation.x = Math.PI / 2;
      const h1 = new THREE.Group(); h1.add(g1);
      const h2 = new THREE.Group(); h2.add(g2);
      spin(h1, 'z', 1.2, 1, -0.13, 0.62, 0);
      spin(h2, 'z', -1.2 * (12 / 9), -12 / 9, 0.215, 0.56, 0);
    }
  });

  const pMesh = new THREE.Mesh(merge(porcelain), mat.porcelain);
  const cMesh = new THREE.Mesh(merge(charcoal), mat.charcoal);
  for (const m of [pMesh, cMesh]) { m.castShadow = true; m.receiveShadow = true; group.add(m); }

  // Activity lights: one small puck per station on the engine side, grey at rest, pink when working.
  const lights = new THREE.InstancedMesh(puckGeometry(0.075, 0.045, 0.015, 24), mat.pink, stations.length);
  const off = new THREE.Color(0xdcd6d5), on = new THREE.Color(0xe58fab), tmp = new THREE.Color();
  const m4 = new THREE.Matrix4();
  stations.forEach((s, k) => {
    const [x, , z] = at(s.deg, R - PAD_R + 0.13, 0.1);
    lights.setMatrixAt(k, m4.makeTranslation(x, 0.1, z));
    lights.setColorAt(k, off);
  });
  lights.receiveShadow = true;
  group.add(lights);

  const angles = new Float32Array(spinners.length);

  return {
    group,
    /** dt: frame delta (s); engineSpeed: rad/s of the engine; sync 0..1; activity per station 0..1 */
    update(dt: number, engineSpeed: number, sync: number, activity: Float32Array) {
      spinners.forEach((sp, i) => {
        const v = sp.own * (1 - sync) + engineSpeed * sp.ratio * sync;
        angles[i] += v * dt;
        sp.obj.rotation[sp.axis] = angles[i];
      });
      for (let k = 0; k < stations.length; k++) {
        const a = activity[k];
        lights.setColorAt(k, tmp.copy(off).lerp(on, a));
        const [x, , z] = at(stations[k].deg, R - PAD_R + 0.13, 0.1);
        m4.makeScale(1 + a * 0.25, 1 + a * 0.8, 1 + a * 0.25).setPosition(x, 0.1, z);
        lights.setMatrixAt(k, m4);
      }
      lights.instanceColor!.needsUpdate = true;
      lights.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
    },
  };
}
