// Layer A, gtm intelligence: the market tray under the strategy frame (icp & market segmentation),
// then a short feed track through three pads: target account selection (a hoop that marks the
// account with a pink ring), buying signals & intent (a mast whose disc pulses), contact enrichment
// (a dock whose clamp reaches the account), and the splitter that aims each account at its channel.
import * as THREE from 'three';
import { CH_Y, ENRICH_X, FEED_X0, FRAME, MARKET, SELECT_X, SIGNAL_X, SPLIT_X } from './layout';
import { merge, puckGeometry, type Materials } from './materials';
import { disposeGroup, shadowed, slab, straightRail, twinRail } from './track';

const DROP = 1.6;
const SY_HOOP = CH_Y + 0.1; // the selection hoop is centred on the token's path
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg);

export function createIntelligence(mat: Materials) {
  const group = new THREE.Group();
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) => {
    const o = shadowed(new THREE.Mesh(g, m));
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  // ---- market tray
  add(slab(MARKET.cols * MARKET.gap + 0.32, MARKET.rows * MARKET.gap + 0.32, 0.12, 0.14), mat.porcelain, MARKET.x, 0, MARKET.z);

  // ---- feed track: a ramp off the tray, then straight to the splitter
  group.add(shadowed(new THREE.Mesh(merge([
    ...twinRail([[MARKET.x + MARKET.cols * MARKET.gap / 2 + 0.05, 0.2, 0], [FEED_X0 - 0.15, CH_Y - 0.03, 0], [FEED_X0, CH_Y, 0]], { posts: false }),
    ...straightRail(FEED_X0, SPLIT_X + 0.1, 0, { postFrom: 0.5 }),
  ]), mat.channel)));

  // ---- strategy frame with its scan bar (drops in when the system connects)
  const strategy = new THREE.Group();
  strategy.position.set(MARKET.x, 0, MARKET.z);
  const sBody = new THREE.Group();
  strategy.add(sBody);
  const { w: fw, d: fd, y: fy } = FRAME;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(cyl(0.02, fy, 10), mat.charcoal, (x * fw) / 2, fy / 2, (z * fd) / 2, sBody);
  for (const [w, d, x, z] of [[fw, 0.03, 0, -fd / 2], [fw, 0.03, 0, fd / 2], [0.03, fd, -fw / 2, 0], [0.03, fd, fw / 2, 0]]) {
    add(box(w + 0.03, 0.03, d), mat.charcoal, x, fy, z, sBody);
  }
  const bar = new THREE.Group();
  bar.add(shadowed(new THREE.Mesh(box(fw, 0.05, 0.09), mat.porcelain)));
  const edge = new THREE.Mesh(box(fw - 0.06, 0.012, 0.03), mat.pink);
  edge.position.y = -0.03;
  bar.add(edge);
  bar.position.y = fy - 0.02;
  sBody.add(bar);
  group.add(strategy);
  const scanZ = (scan: number) => -fd / 2 + 0.1 + scan * (fd - 0.2);

  // ---- target account selection: two posts and a hoop around the track; a pink lip marks the pick
  add(puckGeometry(0.2, 0.05, 0.015, 28), mat.porcelain, SELECT_X, 0, 0);
  for (const z of [-0.3, 0.3]) add(box(0.07, 0.62, 0.07), mat.porcelain, SELECT_X, 0.33, z);
  const hoop = add(new THREE.TorusGeometry(0.21, 0.025, 10, 32).rotateY(Math.PI / 2), mat.charcoal, SELECT_X, SY_HOOP, 0);
  const lip = add(new THREE.TorusGeometry(0.21, 0.012, 8, 32).rotateY(Math.PI / 2), mat.pink, SELECT_X + 0.035, SY_HOOP, 0);
  add(box(0.08, 0.06, 0.66), mat.porcelain, SELECT_X, 0.66, 0);

  // ---- buying signals & intent: a mast behind the track with a disc that pulses, and a ripple ring
  const mz = -0.42;
  add(puckGeometry(0.16, 0.06, 0.015, 24), mat.porcelain, SIGNAL_X, 0, mz);
  add(cyl(0.018, 1.0, 10), mat.charcoal, SIGNAL_X, 0.5, mz);
  add(puckGeometry(0.11, 0.035, 0.012, 24), mat.porcelain, SIGNAL_X, 1.0, mz);
  const disc = add(puckGeometry(0.065, 0.03, 0.01, 24), mat.pink, SIGNAL_X, 1.035, mz);
  const rippleMat = new THREE.MeshBasicMaterial({ color: (mat.pulse as THREE.MeshBasicMaterial).color, transparent: true, opacity: 0, depthWrite: false });
  const ripple = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 6, 32).rotateX(Math.PI / 2), rippleMat);
  ripple.position.set(SIGNAL_X, 1.05, mz);
  group.add(ripple);
  add(box(0.04, 0.04, 0.34), mat.charcoal, SIGNAL_X, CH_Y + 0.17, mz + 0.2); // arm to the track

  // ---- contact enrichment: a dock in front of the track; its clamp reaches the account
  const dz = 0.46;
  add(box(0.42, 0.34, 0.32), mat.porcelain, ENRICH_X, 0.17, dz);
  add(box(0.3, 0.03, 0.2), mat.charcoal, ENRICH_X, 0.355, dz);
  const clamp = new THREE.Group();
  clamp.add(shadowed(new THREE.Mesh(box(0.06, 0.05, 0.3), mat.porcelain)));
  const jaw = shadowed(new THREE.Mesh(box(0.16, 0.06, 0.04), mat.charcoal));
  jaw.position.z = -0.17;
  clamp.add(jaw);
  clamp.position.set(ENRICH_X, CH_Y + 0.12, dz - 0.2);
  group.add(clamp);

  // ---- splitter: a puck under the junction with a charcoal diverter blade
  add(puckGeometry(0.26, 0.07, 0.02, 32), mat.porcelain, SPLIT_X + 0.15, 0, 0);
  add(cyl(0.03, CH_Y - 0.08, 10), mat.charcoal, SPLIT_X + 0.15, (CH_Y - 0.08) / 2 + 0.07, 0);
  const blade = new THREE.Group();
  const bl = shadowed(new THREE.Mesh(box(0.36, 0.035, 0.035), mat.charcoal));
  bl.position.x = 0.18;
  blade.add(bl);
  blade.position.set(SPLIT_X + 0.15, CH_Y - 0.06, 0);
  group.add(blade);

  let bladeAngle = 0;

  return {
    group,
    scanZ,
    update(st: { strategy: number; connected: number }, act: { select: number; signal: number; enrich: number; splitZ: number }, scan: number, t: number, dt: number) {
      strategy.visible = st.strategy > 0.002;
      sBody.position.y = (1 - st.strategy) * DROP;
      bar.position.z = scanZ(scan);
      // selection marks only once the system is connected
      const sel = act.select * st.connected;
      lip.scale.setScalar(1 + sel * 0.18);
      hoop.rotation.x = sel * 0.6;
      const sig = act.signal * st.connected;
      disc.scale.set(1 + sig * 0.5, 1 + sig * 1.4, 1 + sig * 0.5);
      const ph = (t * 0.9) % 1;
      const rs = 1 + (sig > 0.05 ? ph * 2.2 : 0);
      ripple.scale.set(rs, 1, rs);
      rippleMat.opacity = sig > 0.05 ? (1 - ph) * 0.8 * sig : 0;
      clamp.position.z = dz - 0.2 - act.enrich * st.connected * 0.12;
      const target = Math.atan2(-act.splitZ, 1.6) * 0.9;
      bladeAngle += (target - bladeAngle) * Math.min(1, dt * 6);
      blade.rotation.y = bladeAngle;
    },
    dispose() { disposeGroup(group); rippleMat.dispose(); },
  };
}

