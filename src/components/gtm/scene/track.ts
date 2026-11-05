// Track geometry shared by every layer: twin white rails along any curve (with sleepers and
// posts), thin connector tubes, and the rounded slab used for the plinth and the trays.
import * as THREE from 'three';
import { CH_Y, type Vec } from './layout';
import { place } from './materials';

export const RAIL_R = 0.026;
export const RAIL_Z = 0.07;
type Part = { g: THREE.BufferGeometry; m?: THREE.Matrix4 };

export const curveOf = (pts: Vec[], tension = 0.35) =>
  new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', tension);

/** Twin rails along a polyline (points at rail height), with sleepers and support posts.
 *  `caps` puts small end stops on open ends, so a break reads as deliberate. */
export function twinRail(pts: Vec[], opts: { posts?: boolean; caps?: [boolean, boolean]; postFrom?: number } = {}): Part[] {
  const curve = curveOf(pts);
  const len = curve.getLength();
  const n = Math.max(8, Math.ceil(len / 0.08));
  const sp = curve.getSpacedPoints(n);
  const tan = new THREE.Vector3(), nrm = new THREE.Vector3();
  const sides: THREE.Vector3[][] = [[], []];
  sp.forEach((p, i) => {
    curve.getTangentAt(i / n, tan);
    nrm.set(-tan.z, 0, tan.x).normalize();
    sides[0].push(p.clone().addScaledVector(nrm, RAIL_Z));
    sides[1].push(p.clone().addScaledVector(nrm, -RAIL_Z));
  });
  const parts: Part[] = sides.map((s) => ({ g: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(s), n, RAIL_R, 8, false) }));
  const at = (d: number) => {
    const u = Math.min(1, Math.max(0, d / len));
    const p = curve.getPointAt(u), t = curve.getTangentAt(u);
    return { p, ry: Math.atan2(-t.z, t.x) };
  };
  for (let d = 0.12; d < len - 0.05; d += 0.42) {
    const { p, ry } = at(d);
    parts.push({ g: new THREE.BoxGeometry(0.05, 0.026, 0.24), m: place(p.x, p.y - 0.03, p.z, ry) });
  }
  if (opts.posts !== false) {
    for (let d = opts.postFrom ?? 0.3; d < len - 0.15; d += 0.95) {
      const { p } = at(d);
      const h = p.y - 0.04;
      if (h > 0.05) parts.push({ g: new THREE.CylinderGeometry(0.022, 0.03, h, 8), m: place(p.x, h / 2, p.z) });
    }
  }
  const [c0, c1] = opts.caps ?? [false, false];
  if (c0) { const { p, ry } = at(0.015); parts.push({ g: new THREE.BoxGeometry(0.03, 0.07, 0.2), m: place(p.x, p.y, p.z, ry) }); }
  if (c1) { const { p, ry } = at(len - 0.015); parts.push({ g: new THREE.BoxGeometry(0.03, 0.07, 0.2), m: place(p.x, p.y, p.z, ry) }); }
  return parts;
}

/** A straight run of rails along x at z, at rail height. */
export const straightRail = (x0: number, x1: number, z = 0, opts?: Parameters<typeof twinRail>[1]) =>
  twinRail([[x0, CH_Y, z], [(x0 + x1) / 2, CH_Y, z], [x1, CH_Y, z]], opts);

/** A thin connector tube along points (charcoal infrastructure, drawn with setDrawRange). */
export const tubeAlong = (pts: Vec[], r: number, seg = 64, tension = 0.2) =>
  new THREE.TubeGeometry(curveOf(pts, tension), seg, r, 8, false);

/** Reveal a tube from its start: p in 0..1 (TubeGeometry index count is radial*6 per segment). */
export function drawTube(m: THREE.Mesh, p: number) {
  const g = m.geometry;
  const step = 8 * 6;
  g.setDrawRange(0, Math.round((Math.min(1, Math.max(0, p)) * g.index!.count) / step) * step);
  m.visible = p > 0.001;
}

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

export const shadowed = <T extends THREE.Mesh>(m: T) => { m.castShadow = true; m.receiveShadow = true; return m; };
export const disposeGroup = (g: THREE.Object3D) => g.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
