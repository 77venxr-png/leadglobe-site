// The central engine: five machined parts that drop in and lock, then turn together.
// base (charcoal) · track (porcelain, the spheres ride it) · gear (charcoal) · hub (porcelain) ·
// crown (charcoal with the one pink accent ring).
import * as THREE from 'three';
import { CH_Y, ENGINE_R, TRACK_R } from './layout';
import { gearGeometry, puckGeometry, type Materials } from './materials';

const DROP = 1.7; // parts fall in from this height

export function createEngine(mat: Materials) {
  const group = new THREE.Group();
  const shadowed = (m: THREE.Mesh) => { m.castShadow = true; m.receiveShadow = true; return m; };

  const base = shadowed(new THREE.Mesh(puckGeometry(ENGINE_R + 0.07, 0.14, 0.03, 64), mat.charcoal));

  // Track: a porcelain ring with a shallow groove the spheres ride in, top at channel height.
  const tp = [[TRACK_R - 0.17, 0.14], [TRACK_R + 0.17, 0.14], [TRACK_R + 0.17, CH_Y + 0.02], [TRACK_R + 0.08, CH_Y + 0.03],
    [TRACK_R + 0.05, CH_Y - 0.01], [TRACK_R - 0.05, CH_Y - 0.01], [TRACK_R - 0.08, CH_Y + 0.03], [TRACK_R - 0.17, CH_Y + 0.02]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  tp.push(tp[0].clone());
  const track = new THREE.Group();
  track.add(shadowed(new THREE.Mesh(new THREE.LatheGeometry(tp, 72), mat.porcelain)));
  // index marks on the track: small charcoal ticks every 30°, so its rotation reads
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.012, 0.09), mat.charcoal, 12);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    m4.makeRotationY(-a).setPosition(Math.cos(a) * (TRACK_R + 0.125), CH_Y + 0.025, Math.sin(a) * (TRACK_R + 0.125));
    ticks.setMatrixAt(i, m4);
  }
  track.add(ticks);

  const gear = new THREE.Group();
  const g = shadowed(new THREE.Mesh(gearGeometry(0.66, 0.58, 22, 0.14, 0.2), mat.charcoal));
  g.position.y = 0.21;
  gear.add(g);

  const hub = new THREE.Group();
  hub.add(shadowed(new THREE.Mesh(puckGeometry(0.34, 0.52, 0.05, 48), mat.porcelain)));
  hub.children[0].position.y = 0.14;
  // four porcelain spokes from hub to gear rim
  for (let i = 0; i < 4; i++) {
    const s = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.08), mat.porcelain));
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    s.position.set(Math.cos(a) * 0.42, 0.31, Math.sin(a) * 0.42);
    s.rotation.y = -a;
    hub.add(s);
  }

  const crown = new THREE.Group();
  const cap = shadowed(new THREE.Mesh(puckGeometry(0.3, 0.05, 0.015, 48), mat.charcoal));
  const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 56).rotateX(Math.PI / 2), mat.pink));
  ring.position.y = 0.06;
  const pin = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 16), mat.porcelain));
  pin.position.y = 0.1;
  crown.add(cap, ring, pin);
  crown.position.y = 0.66;

  const parts = [base, track, gear, hub, crown];
  const restY = parts.map((p) => p.position.y);
  parts.forEach((p) => group.add(p));

  // Engine contact shadow (fake AO), fades with assembly.
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat.ao.clone());
  ao.scale.setScalar((ENGINE_R + 0.6) * 2);
  ao.position.y = 0.003;
  ao.renderOrder = -1;
  group.add(ao);

  let angle = 0;

  return {
    group,
    /** engine: assembly per part (0..1, may overshoot); spin 0..1; returns the engine speed (rad/s) */
    update(assembly: number[], spin: number, dt: number) {
      parts.forEach((p, i) => {
        const a = assembly[i];
        p.visible = a > 0.001;
        p.position.y = restY[i] + (1 - a) * DROP;
        const s = Math.min(1, 0.6 + 0.4 * a);
        p.scale.setScalar(s);
      });
      (ao.material as THREE.MeshBasicMaterial).opacity = Math.min(1, assembly[0]);
      const speed = 0.55 * spin;
      angle += speed * dt;
      track.rotation.y = angle * 0.5;
      gear.rotation.y = -angle;
      hub.rotation.y = angle * 0.35;
      crown.rotation.y = angle * 1.4;
      return speed;
    },
    dispose() {
      group.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
      (ao.material as THREE.Material).dispose();
    },
  };
}
