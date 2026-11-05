// Layer B, connected execution: five channel lanes side by side (stacked in z, so they read as
// parallel, never as consecutive stages). The splitter fans accounts into the lanes; each lane has
// one channel mechanism; thin cross-links carry a pulse between channels whenever one works an
// account (coordination); a manifold merges every lane into one intake to the pipeline.
// Prelude: no manifold, no links. Each lane ends at a pink drain where accounts leak out.
import * as THREE from 'three';
import {
  CH_Y, DRAIN_X, INTAKE_X, LANE_X0, LANE_X1, LANE_Z, LINKS, MODULE_DZ, MODULE_X, SPLIT_X, channels, type ChannelId, type Vec,
} from './layout';
import { merge, place, puckGeometry, type Materials } from './materials';
import { disposeGroup, drawTube, shadowed, straightRail, tubeAlong, twinRail } from './track';

const DROP = 1.4;
const MOD_S = 0.56; // channel modules are the v3 service modules at a smaller scale
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg);
type Spinner = { obj: THREE.Object3D; axis: 'x' | 'y' | 'z'; speed: number };

export function createChannels(mat: Materials) {
  const group = new THREE.Group();
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => shadowed(new THREE.Mesh(g, m));

  // ---- rails: splitter fan + five lanes (always there: the vendors exist even when disconnected)
  const rails = LANE_Z.flatMap((z) => [
    ...twinRail([[SPLIT_X, CH_Y, 0], [SPLIT_X + 0.25, CH_Y, z * 0.15], [LANE_X0 - 0.12, CH_Y, z * 0.92], [LANE_X0, CH_Y, z]], { posts: false }),
    ...straightRail(LANE_X0, LANE_X1, z, { caps: [false, true], postFrom: 0.4 }),
  ]);
  group.add(mesh(merge(rails), mat.channel));

  // ---- manifold: one section per lane, dropping in when the system connects
  const manifold = LANE_Z.map((z) => {
    const g = new THREE.Group();
    g.add(mesh(merge(twinRail([[LANE_X1, CH_Y, z], [-0.35, CH_Y, z * 0.4], [INTAKE_X, CH_Y, 0]], { posts: false })), mat.charcoal));
    group.add(g);
    return g;
  });

  // ---- prelude drains at the end of every lane
  const drainRing = new THREE.InstancedMesh(new THREE.RingGeometry(0.11, 0.18, 32).rotateX(-Math.PI / 2), mat.drain, LANE_Z.length);
  const drainCore = new THREE.InstancedMesh(new THREE.CircleGeometry(0.11, 32).rotateX(-Math.PI / 2), mat.drainCore, LANE_Z.length);
  group.add(drainRing, drainCore);

  // ---- channel modules
  const spinners: Spinner[] = [];
  const tops: THREE.Vector3[] = [];
  channels.forEach((ch, k) => {
    const root = new THREE.Group();
    root.position.set(MODULE_X, 0, LANE_Z[k] + MODULE_DZ);
    root.scale.setScalar(MOD_S);
    group.add(root);
    const P = (g: THREE.BufferGeometry, x: number, y: number, z: number, ry = 0) => { const o = mesh(g, mat.porcelain); o.position.set(x, y, z); o.rotation.y = ry; root.add(o); return o; };
    const C = (g: THREE.BufferGeometry, x: number, y: number, z: number) => { const o = mesh(g, mat.charcoal); o.position.set(x, y, z); root.add(o); return o; };
    const spin = (obj: THREE.Object3D, axis: Spinner['axis'], speed: number, x: number, y: number, z: number) => { obj.position.set(x, y, z); root.add(obj); spinners.push({ obj, axis, speed }); };
    P(puckGeometry(0.42, 0.08), 0, 0, 0);
    // arm to the lane: the channel touches the account as it passes
    P(box(0.08, 0.05, 0.5), 0.36, CH_Y / MOD_S, 0.3);
    const id: ChannelId = ch.id;
    let top = 0.7;
    if (id === 'outbound') {
      P(box(0.56, 0.3, 0.42), 0, 0.23, -0.05);
      C(box(0.4, 0.04, 0.3), 0, 0.4, -0.05);
      P(cyl(0.035, 0.22), 0.1, 0.52, -0.08);
      const sweep = new THREE.Group();
      const a = mesh(box(0.34, 0.03, 0.045), mat.charcoal); a.position.x = 0.13;
      const tip = mesh(new THREE.SphereGeometry(0.042, 16, 12), mat.charcoal); tip.position.x = 0.3;
      sweep.add(a, tip);
      spin(sweep, 'y', -1.2, 0.1, 0.64, -0.08);
    } else if (id === 'linkedin') {
      // three linked nodes on posts: a relationship graph
      const nodes: [number, number, number][] = [[-0.2, 0.46, -0.12], [0.2, 0.56, -0.14], [0.02, 0.36, 0.18]];
      const net = new THREE.Group();
      nodes.forEach(([x, y, z], i) => {
        const post = mesh(cyl(0.022, y, 10), mat.charcoal); post.position.set(x, y / 2, z); root.add(post);
        const n = mesh(puckGeometry(0.1, 0.06, 0.02, 24), i === 1 ? mat.charcoal : mat.porcelain); n.position.set(x, y, z); net.add(n);
      });
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
        const pa = new THREE.Vector3(...nodes[a]).setY(nodes[a][1] + 0.03), pb = new THREE.Vector3(...nodes[b]).setY(nodes[b][1] + 0.03);
        const rod = mesh(cyl(0.012, pa.distanceTo(pb), 8), mat.charcoal);
        rod.position.copy(pa).add(pb).multiplyScalar(0.5);
        rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
        net.add(rod);
      }
      const dot = mesh(new THREE.SphereGeometry(0.035, 12, 10), mat.pink); dot.position.set(0.2, 0.64, -0.14); net.add(dot);
      root.add(net);
      top = 0.7;
    } else if (id === 'content') {
      [[0.11, 0], [0.17, 0.14], [0.23, -0.1]].forEach(([y, ry]) => P(box(0.58, 0.055, 0.42), 0, y, 0, ry));
      C(box(0.045, 0.22, 0.44), -0.31, 0.2, 0);
      const sheet = new THREE.Group();
      sheet.add(new THREE.Mesh(box(0.54, 0.032, 0.4), mat.glass));
      const sp = mesh(box(0.54, 0.012, 0.028), mat.charcoal); sp.position.set(0, 0.022, 0.18); sheet.add(sp);
      spin(sheet, 'y', 0.4, 0, 0.3, 0);
      top = 0.5;
    } else if (id === 'paid') {
      P(puckGeometry(0.28, 0.12), 0, 0.08, 0);
      const bb = new THREE.Group();
      const l = mesh(cyl(0.02, 0.38, 10), mat.charcoal), r = l.clone();
      l.position.set(-0.25, 0.19, 0); r.position.set(0.25, 0.19, 0);
      const panel = mesh(box(0.72, 0.38, 0.04), mat.porcelain); panel.position.y = 0.53;
      const rim = mesh(box(0.76, 0.035, 0.055), mat.charcoal); rim.position.y = 0.33;
      bb.add(l, r, panel, rim);
      spin(bb, 'y', 0.35, 0, 0.2, 0);
      top = 0.95;
    } else if (id === 'abm') {
      P(puckGeometry(0.32, 0.28), 0, 0.08, 0);
      C(cyl(0.045, 0.1), 0, 0.41, 0);
      const outer = mesh(new THREE.TorusGeometry(0.22, 0.018, 10, 32), mat.charcoal);
      const inner = mesh(new THREE.TorusGeometry(0.13, 0.016, 10, 32), mat.charcoal);
      inner.rotation.y = Math.PI / 2;
      outer.add(inner);
      const dot = mesh(new THREE.SphereGeometry(0.045, 16, 12), mat.pink);
      outer.add(dot);
      spin(outer, 'y', -0.8, 0, 0.7, 0);
      top = 0.95;
    }
    tops.push(new THREE.Vector3(MODULE_X, top * MOD_S, LANE_Z[k] + MODULE_DZ));
  });

  // ---- activity lights: a puck on each module pad, pink while that channel works an account
  const lights = new THREE.InstancedMesh(puckGeometry(0.05, 0.035, 0.012, 20), mat.light, channels.length);
  group.add(lights);
  const off = new THREE.Color(0xdcd6d5), on = new THREE.Color(0xe58fab), tmp = new THREE.Color();

  // ---- cross-links between channel modules (coordination): thin arcs behind the modules
  const LX = MODULE_X - 0.32;
  const linkEnd = (k: number): Vec => [LX, 0.05, LANE_Z[k] + MODULE_DZ];
  const links = LINKS.map(([a, b]) => {
    const pa = linkEnd(a), pb = linkEnd(b);
    const span = Math.abs(b - a);
    const h = 0.72 + 0.12 * span; // clears the tokens riding the lanes it crosses
    const pts: Vec[] = [pa, [LX, h * 0.8, pa[2] + (pb[2] - pa[2]) * 0.2], [LX - 0.04 * span, h, (pa[2] + pb[2]) / 2], [LX, h * 0.8, pa[2] + (pb[2] - pa[2]) * 0.8], pb];
    const m = mesh(tubeAlong(pts, 0.016, 48, 0.4), mat.charcoal);
    group.add(m);
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.4);
    return { m, curve, a, b };
  });
  // feet where links meet the deck
  group.add(mesh(merge(LANE_Z.map((z) => ({ g: puckGeometry(0.045, 0.04, 0.012, 16), m: place(LX, 0, z + MODULE_DZ) }))), mat.charcoal));
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 12, 10), mat.pulse, links.length);
  pulses.frustumCulled = false;
  group.add(pulses);

  const m4 = new THREE.Matrix4();
  const v = new THREE.Vector3();
  const hidden = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);

  return {
    group,
    /** Label anchors: top of each module. */
    tops,
    update(st: { manifold: number[]; drains: number; links: number; connected: number }, act: { lanes: Float32Array; laneStart: Float64Array; drainHit: Float64Array }, t: number, dt: number) {
      manifold.forEach((g, k) => {
        const a = st.manifold[k];
        g.visible = a > 0.002;
        g.position.y = (1 - a) * DROP;
      });
      LANE_Z.forEach((z, k) => {
        const hit = Math.exp(-(((t - act.drainHit[k] - 0.2) / 0.3) ** 2));
        const s = Math.max(1e-4, st.drains * (1 + 0.5 * hit));
        drainRing.setMatrixAt(k, m4.makeScale(s, 1, s).setPosition(DRAIN_X + 0.03, 0.004, z));
        const c = Math.max(1e-4, st.drains);
        drainCore.setMatrixAt(k, m4.makeScale(c, 1, c).setPosition(DRAIN_X + 0.03, 0.005, z));
        const a = act.lanes[k] * st.connected;
        lights.setColorAt(k, tmp.copy(off).lerp(on, a));
        lights.setMatrixAt(k, m4.makeScale(1, 1 + a * 1.2, 1).setPosition(MODULE_X - 0.18, 0.045, z + MODULE_DZ + 0.16));
      });
      drainRing.instanceMatrix.needsUpdate = drainCore.instanceMatrix.needsUpdate = true;
      lights.instanceColor!.needsUpdate = lights.instanceMatrix.needsUpdate = true;
      spinners.forEach((s) => { s.obj.rotation[s.axis] += s.speed * dt; });
      links.forEach((l, i) => {
        drawTube(l.m, st.links);
        // a pulse leaves whichever end most recently worked an account
        const ta = act.laneStart[l.a], tb = act.laneStart[l.b];
        const fromA = ta >= tb;
        const u = (t - (fromA ? ta : tb)) / 0.9;
        if (st.links < 0.99 || u < 0 || u > 1) { pulses.setMatrixAt(i, hidden); return; }
        l.curve.getPointAt(fromA ? u : 1 - u, v);
        const s = Math.sin(Math.PI * u);
        pulses.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(v));
      });
      pulses.instanceMatrix.needsUpdate = true;
    },
    dispose() { disposeGroup(group); },
  };
}
