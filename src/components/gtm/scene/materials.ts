// Materials and small geometry helpers shared by every scene module. Palette from DESIGN.md:
// porcelain white, charcoal ink, blush pink for signals only, glass used once.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Materials = ReturnType<typeof createMaterials>;

export function createMaterials() {
  return {
    porcelain: new THREE.MeshStandardMaterial({ color: 0xf7f5f4, roughness: 0.86, metalness: 0 }),
    channel: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0xf8f6f5, roughness: 0.95, metalness: 0 }),
    charcoal: new THREE.MeshStandardMaterial({ color: 0x1c1c23, roughness: 0.55, metalness: 0.08 }),
    sphere: new THREE.MeshStandardMaterial({ color: 0x131318, roughness: 0.42, metalness: 0.05 }),
    pink: new THREE.MeshStandardMaterial({ color: 0xe9a8bc, roughness: 0.6, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xe8eef0, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.42 }),
    etch: new THREE.MeshBasicMaterial({ color: 0xdcd7d6 }),
    drain: new THREE.MeshBasicMaterial({ color: 0xe9a8bc, transparent: true }),
    drainCore: new THREE.MeshBasicMaterial({ color: 0x2a2a31, transparent: true }),
    ao: new THREE.MeshBasicMaterial({ map: aoTexture(), transparent: true, depthWrite: false, opacity: 1 }),
  };
}

/** Soft radial contact shadow, used as fake ambient occlusion under every object. */
function aoTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(20,18,24,0.30)');
  grad.addColorStop(0.45, 'rgba(20,18,24,0.14)');
  grad.addColorStop(1, 'rgba(20,18,24,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A toothed gear, extruded along y (lies flat). Non-indexed: never merge with indexed geometry. */
export function gearGeometry(rOuter: number, rRoot: number, teeth: number, depth: number, bore = 0) {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: [number, number][] = [
      [rRoot, a], [rOuter, a + step * 0.18], [rOuter, a + step * 0.48], [rRoot, a + step * 0.66],
    ];
    pts.forEach(([r, ang], j) => {
      const x = r * Math.cos(ang), y = r * Math.sin(ang);
      if (i === 0 && j === 0) s.moveTo(x, y); else s.lineTo(x, y);
    });
  }
  s.closePath();
  if (bore > 0) {
    const h = new THREE.Path();
    h.absarc(0, 0, bore, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -depth / 2, 0);
  return g;
}

/** Rounded puck (a cylinder with a soft top edge), via lathe. */
export function puckGeometry(r: number, h: number, bevel = 0.03, segments = 40) {
  const p = [
    new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r, h - bevel),
    new THREE.Vector2(r - bevel * 0.3, h - bevel * 0.3), new THREE.Vector2(r - bevel, h), new THREE.Vector2(0, h),
  ];
  return new THREE.LatheGeometry(p, segments);
}

/** Merge geometries that share attributes; each item may carry a placement matrix. */
export function merge(parts: { g: THREE.BufferGeometry; m?: THREE.Matrix4 }[]) {
  const gs = parts.map(({ g, m }) => {
    const c = g; // inputs must be indexed (box, cylinder, lathe, tube, torus), not extrude
    if (m) c.applyMatrix4(m);
    c.deleteAttribute('uv');
    return c;
  });
  const out = mergeGeometries(gs, false);
  gs.forEach((g) => g.dispose());
  return out!;
}

export const place = (x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(s, s, s),
  );
