// RevOps, the connective tissue: not a station. A lower base slab reaches out under the whole deck;
// along its front ledge runs the charcoal data bus, with a thin tap down from intelligence, the
// channels and every pipeline stage. Four small instruments sit on the ledge: crm & data integrity,
// attribution & measurement, pipeline analytics (bars follow the live stage counts), conversion
// optimization. A feedback line runs from the outcome trays along the back edge to the strategy
// frame; every won or lost account sends a pulse home.
import * as THREE from 'three';
import {
  BASE, BUS_Y, BUS_Z, DECK, FB_DUR, FEEDBACK_X, LEDGE_Y, N_STAGES, TAP_XS, WON, feedbackPath, type Vec,
} from './layout';
import { merge, place, puckGeometry, type Materials } from './materials';
import { curveOf, disposeGroup, drawTube, shadowed, slab, tubeAlong } from './track';

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
/** Instrument positions (x) on the ledge, in label order. */
export const PLAQUE_X = [-5.6, -1.8, 2.4, 6.0];
const PZ = BUS_Z + 0.2;
const TOP = LEDGE_Y + 0.1;

export function createRevOps(mat: Materials) {
  const group = new THREE.Group();
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => shadowed(new THREE.Mesh(g, m));

  // ---- base slab (the ledge)
  const base = new THREE.Mesh(slab(BASE.x1 - BASE.x0, BASE.z1 - BASE.z0, BASE.h, BASE.r, 0.05), mat.base);
  base.position.set((BASE.x0 + BASE.x1) / 2, LEDGE_Y - BASE.h, (BASE.z0 + BASE.z1) / 2);
  base.receiveShadow = true;
  group.add(base);

  // ---- the bus
  const bx0 = BASE.x0 + 0.45, bx1 = BASE.x1 - 0.45;
  const bus = mesh(tubeAlong([[bx0, BUS_Y, BUS_Z], [(bx0 + bx1) / 2, BUS_Y, BUS_Z], [bx1, BUS_Y, BUS_Z]], 0.04, 200), mat.charcoal);
  group.add(bus);
  const caps = mesh(merge([{ g: puckGeometry(0.07, 0.05, 0.015, 20), m: place(bx0, LEDGE_Y, BUS_Z) }, { g: puckGeometry(0.07, 0.05, 0.015, 20), m: place(bx1, LEDGE_Y, BUS_Z) }]), mat.charcoal);
  group.add(caps);

  // ---- taps: from the deck's front edge down to the bus (grow from the bus up)
  const tapFrom = new THREE.Vector3(0, BUS_Y, BUS_Z), tapTo = new THREE.Vector3(0, 0.02, DECK.z1 - 0.06);
  const tapLen = tapFrom.distanceTo(tapTo);
  const tapGeo = new THREE.CylinderGeometry(0.014, 0.014, tapLen, 8).translate(0, tapLen / 2, 0);
  const tapQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tapTo.clone().sub(tapFrom).normalize());
  const taps = TAP_XS.map((x) => {
    const m = mesh(tapGeo, mat.charcoal);
    m.position.set(x, BUS_Y, BUS_Z);
    m.quaternion.copy(tapQ);
    group.add(m);
    return m;
  });
  const tapFeet = mesh(merge(TAP_XS.map((x) => ({ g: puckGeometry(0.035, 0.025, 0.01, 14), m: place(x, 0, DECK.z1 - 0.06) }))), mat.charcoal);
  group.add(tapFeet);

  // ---- instruments
  const plaques = PLAQUE_X.map((x, i) => {
    // the group pivots on the ledge, so instruments grow up out of it; children keep model-space y
    const outer = new THREE.Group();
    outer.position.set(x, LEDGE_Y, PZ);
    const g = new THREE.Group();
    g.position.y = -LEDGE_Y;
    outer.add(g);
    g.add(mesh(box(0.66, 0.1, 0.28).translate(0, LEDGE_Y + 0.05, 0), mat.porcelain));
    g.add(mesh(box(0.54, 0.014, 0.18).translate(0, TOP + 0.007, 0), mat.charcoal));
    group.add(outer);
    if (i === 0) { // crm & data integrity: clean, aligned record rows
      for (let r = 0; r < 3; r++) g.add(mesh(box(0.4 - r * 0.06, 0.012, 0.022).translate(-0.04 + r * 0.03, TOP + 0.02, -0.05 + r * 0.05), mat.porcelain));
    } else if (i === 1) { // attribution & measurement: touchpoints joined into one path
      const pts: Vec[] = [[-0.2, TOP + 0.03, 0.04], [-0.07, TOP + 0.03, -0.04], [0.06, TOP + 0.03, 0.03], [0.2, TOP + 0.03, -0.03]];
      pts.forEach((p, k) => g.add(mesh(puckGeometry(0.026, 0.02, 0.006, 14).translate(p[0], TOP + 0.014, p[2]), k === 3 ? mat.pink : mat.porcelain)));
      g.add(mesh(tubeAlong(pts, 0.006, 24, 0), mat.porcelain));
    } else if (i === 3) { // conversion optimization: a dial with a slowly settling needle
      g.add(mesh(puckGeometry(0.075, 0.02, 0.006, 24).translate(0, TOP + 0.014, 0), mat.porcelain));
    }
    return outer;
  });
  // pipeline analytics: six bars following the live stage counts
  const bars = new THREE.InstancedMesh(box(0.05, 1, 0.05).translate(0, 0.5, 0), mat.porcelain, N_STAGES);
  bars.castShadow = true;
  group.add(bars);
  const needle = mesh(box(0.012, 0.01, 0.07).translate(0, 0, 0.035), mat.pink);
  needle.position.set(PLAQUE_X[3], TOP + 0.04, PZ);
  group.add(needle);

  // ---- feedback line: outcome trays → back edge → strategy frame
  const fbCurve = curveOf(feedbackPath, 0.2);
  const feedback = mesh(new THREE.TubeGeometry(fbCurve, 260, 0.02, 8, false), mat.charcoal);
  group.add(feedback);
  const stub = mesh(tubeAlong([[WON.x + 0.42, 0.1, WON.z], [FEEDBACK_X, 0.1, WON.z]], 0.02, 8, 0), mat.charcoal);
  group.add(stub);
  // where a won account's pulse joins the line
  const v = new THREE.Vector3();
  let wonU = 0, best = Infinity;
  for (let i = 0; i <= 400; i++) { fbCurve.getPointAt(i / 400, v); const d = (v.x - FEEDBACK_X) ** 2 + (v.z - WON.z) ** 2; if (d < best) { best = d; wonU = i / 400; } }

  const fbPulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 14, 10), mat.pulse, 4);
  const tapPulses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 12, 8), mat.pulse, TAP_XS.length);
  fbPulses.frustumCulled = tapPulses.frustumCulled = false;
  group.add(fbPulses, tapPulses);

  const m4 = new THREE.Matrix4();
  const hidden = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);
  const tapDir = tapTo.clone().sub(tapFrom);

  return {
    group,
    update(
      st: { bus: number; taps: number; plaques: number; feedback: number },
      act: { station: Float64Array; laneStart: Float64Array; outcomes: { at: number; lost: boolean }[] },
      counts: Int32Array, t: number,
    ) {
      drawTube(bus, st.bus);
      caps.visible = st.bus > 0.98;
      taps.forEach((m) => { m.scale.set(1, Math.max(1e-4, st.taps), 1); m.visible = st.taps > 0.002; });
      tapFeet.visible = st.taps > 0.9;
      plaques.forEach((g) => { const a = Math.max(1e-4, st.plaques); g.scale.set(a, a, a); g.visible = st.plaques > 0.002; });
      needle.visible = st.plaques > 0.9;
      needle.rotation.y = -0.6 + 0.35 * Math.sin(t * 0.4);
      for (let k = 0; k < N_STAGES; k++) {
        const h = 0.02 + 0.11 * (counts[k] / 20) * st.plaques;
        bars.setMatrixAt(k, m4.makeScale(1, h, 1).setPosition(PLAQUE_X[2] - 0.2 + k * 0.08, TOP + 0.014, PZ));
      }
      bars.instanceMatrix.needsUpdate = true;
      drawTube(feedback, st.feedback);
      stub.visible = st.feedback > 0.98;

      // feedback pulses: every outcome sends one home along the line
      for (let i = 0; i < 4; i++) {
        const o = act.outcomes[i];
        const u = o ? (t - o.at) / FB_DUR : -1;
        if (!o || u < 0 || u > 1 || st.feedback < 0.99) { fbPulses.setMatrixAt(i, hidden); continue; }
        const u0 = o.lost ? 0 : wonU;
        fbCurve.getPointAt(u0 + (1 - u0) * u, v);
        const s = Math.min(1, u * 8, (1 - u) * 8);
        fbPulses.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(v));
      }
      fbPulses.instanceMatrix.needsUpdate = true;

      // tap pulses: activity drops down to the bus, then travels along it towards the analytics
      const laneLatest = Math.max(...act.laneStart);
      TAP_XS.forEach((x, i) => {
        const at = i === 0 ? laneLatest - 1.4 : i === 1 ? laneLatest : act.station[i - 2];
        const u = (t - at) / 1.3;
        if (u < 0 || u > 1 || st.taps < 0.99) { tapPulses.setMatrixAt(i, hidden); return; }
        if (u < 0.35) v.set(x, 0, 0).add(tapTo).setX(x).addScaledVector(tapDir, -u / 0.35); // down the tap
        else v.set(x + Math.sign(PLAQUE_X[2] - x || 1) * (u - 0.35) * 1.6, BUS_Y + 0.05, BUS_Z); // along the bus
        const s = Math.min(1, (1 - u) * 4);
        tapPulses.setMatrixAt(i, m4.makeScale(s, s, s).setPosition(v));
      });
      tapPulses.instanceMatrix.needsUpdate = true;
    },
    dispose() { disposeGroup(group); },
  };
}
