// The connected revenue engine: renderer, camera, soft studio light, the two-tier plinth, and the
// four layers (intelligence, channels, pipeline, revops) plus the account tokens.
// Loaded lazily by GTMHero. It never runs its own loop: the caller drives frame() from gsap.ticker.
import * as THREE from 'three';
import { createChannels } from './Channels';
import { createIntelligence } from './Intelligence';
import { createPipeline } from './RevenuePipeline';
import { PLAQUE_X, createRevOps } from './RevOps';
import { createTokens } from './Tokens';
import { story } from './GTMAnimationController';
import {
  BASE, BUS_Z, CH_Y, DECK, EL_SQUARE, EL_WIDE, ENRICH_X, FB_DUR, FEEDBACK_Z, FOCUS_X, FRAME, INTAKE_X, LANE_Z, LEDGE_Y, LOST,
  MARKET, MODULE_DZ, MODULE_X, SELECT_X, SIGNAL_X, WON, YAW_SQUARE, YAW_WIDE, stations, type Vec,
} from './layout';
import { createMaterials } from './materials';
import { slab } from './track';

export type SceneInput = { pointerX: number; pointerY: number; scroll: number; time: number };
export type GTMSceneHandle = ReturnType<typeof createGTMScene>;

/** Label anchor indices (see the v5 contract). */
export const ANCHOR = {
  layer: [0, 1, 2, 3],
  intel: [4, 5, 6, 7],
  channel: [8, 9, 10, 11, 12],
  lost: 13,
  intake: 14,
  revops: [15, 16, 17, 18],
  feedback: 19,
  score: [20, 21, 22, 23, 24, 25],
} as const;
export const N_ANCHORS = 26;
/** Anchors whose pill hangs below the point (the rest sit above it). */
export const HANGS: ReadonlySet<number> = new Set([3, 7, 13, 15, 16, 17, 18]);

/** Label anchors in model space, in ANCHOR order. */
const anchors: Vec[] = [
  // layer pills
  [MARKET.x + 0.55, FRAME.y + 0.5, MARKET.z - FRAME.d / 2],
  [MODULE_X, 1.2, LANE_Z[0] + MODULE_DZ - 0.15],
  [stations[2].x, 1.32, 0],
  [(BASE.x0 + BASE.x1) / 2, LEDGE_Y - BASE.h, BASE.z1],
  // intelligence details
  [MARKET.x - 0.45, FRAME.y + 0.06, MARKET.z + FRAME.d / 2],
  [SELECT_X, 0.95, 0],
  [SIGNAL_X, 1.25, -0.42],
  [ENRICH_X, 0.02, 0.66],
  // channel modules (above each module)
  ...LANE_Z.map((z) => [MODULE_X, 0.72, z + MODULE_DZ] as Vec),
  // pipeline details
  [LOST.x, 0.3, LOST.z + 0.45],
  [INTAKE_X, CH_Y + 0.36, 0],
  // revops instruments (front ledge, hang below) and the feedback line
  ...PLAQUE_X.map((x) => [x, LEDGE_Y, BUS_Z + 0.36] as Vec),
  [-0.5, 0.14, FEEDBACK_Z],
  // scoreboard columns: stations at track level, then closed won
  ...stations.map((s) => [s.x, CH_Y, 0] as Vec),
  [WON.x, 0.02, WON.z],
];

export function createGTMScene(canvas: HTMLCanvasElement, opts: { lowPower: boolean }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 1.5,
    powerPreference: opts.lowPower ? 'low-power' : 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = opts.lowPower ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  // Low power: the shadow map is re-rendered every third frame only (it is the costliest pass).
  renderer.shadowMap.autoUpdate = !opts.lowPower;
  let frames = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 140);
  const mat = createMaterials();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3eeec, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(4, 13, 7);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(opts.lowPower ? 1024 : 2048);
  const sc = key.shadow.camera as THREE.OrthographicCamera;
  sc.left = sc.bottom = -10.5;
  sc.right = sc.top = 10.5;
  sc.near = 2;
  sc.far = 40;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4f6, 0.45);
  rim.position.set(-8, 4, -4);
  scene.add(rim);

  // Model root: everything in model space, turned by an aspect-dependent yaw.
  const root = new THREE.Group();
  root.rotation.y = YAW_SQUARE;
  scene.add(root);

  // Upper deck (A, B, C sit on it). The revops base slab belongs to RevOps.
  const deck = new THREE.Mesh(slab(DECK.x1 - DECK.x0, DECK.z1 - DECK.z0, DECK.h, DECK.r, 0.06), mat.plinth);
  deck.position.set((DECK.x0 + DECK.x1) / 2, -DECK.h, (DECK.z0 + DECK.z1) / 2);
  deck.receiveShadow = true;
  deck.castShadow = true;
  root.add(deck);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.08 }));
  ground.position.y = LEDGE_Y - BASE.h - 0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  // Fake ambient occlusion: soft contact blobs under the trays and the module bay.
  const aoSpots: [number, number, number][] = [
    [MARKET.x, MARKET.z, 3.0], [WON.x, WON.z, 1.4], [LOST.x, LOST.z, 1.3], [MODULE_X, -0.36, 2.6],
  ];
  const ao = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat.ao, aoSpots.length);
  const m4 = new THREE.Matrix4();
  aoSpots.forEach(([x, z, s], i) => ao.setMatrixAt(i, m4.makeScale(s, 1, s).setPosition(x, 0.003, z)));
  ao.renderOrder = -1;
  root.add(ao);

  const intel = createIntelligence(mat);
  const channels = createChannels(mat);
  const pipeline = createPipeline(mat);
  const revops = createRevOps(mat);
  const tokens = createTokens(mat);
  root.add(intel.group, channels.group, pipeline.group, revops.group, tokens.mesh, tokens.rings);
  root.updateMatrixWorld(true);

  // Camera rig: frames the whole two-tier plinth (and the pills above it) for any aspect ratio.
  // Wide frames turn the engine towards left-to-right and lower the camera; square ones keep the
  // diagonal so the long model still fits.
  const box = new THREE.Box3(
    new THREE.Vector3(BASE.x0, LEDGE_Y - BASE.h, DECK.z0 - 0.1),
    new THREE.Vector3(BASE.x1, 1.4, BASE.z1),
  );
  const local = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(
    i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z,
  ));
  const corners = local.map((c) => c.clone());
  const BASE_TARGET = new THREE.Vector3((BASE.x0 + BASE.x1) / 2, 0.0, 0.25);
  const target = new THREE.Vector3();
  const modelTarget = new THREE.Vector3();
  const cam = { az: Number.NaN, el: Number.NaN, fx: BASE_TARGET.x, dolly: 0 };
  let baseEl = EL_SQUARE;
  let fitDist = 30;
  const v = new THREE.Vector3();

  function orient(aspect: number) {
    const k = THREE.MathUtils.smoothstep(aspect, 1.1, 2.2);
    root.rotation.y = THREE.MathUtils.lerp(YAW_SQUARE, YAW_WIDE, k);
    baseEl = THREE.MathUtils.lerp(EL_SQUARE, EL_WIDE, k);
    root.updateMatrixWorld(true);
    local.forEach((c, i) => corners[i].copy(c).applyMatrix4(root.matrixWorld));
  }
  function aim(fx: number) {
    target.copy(modelTarget.set(fx, BASE_TARGET.y, BASE_TARGET.z)).applyMatrix4(root.matrixWorld);
  }
  function pose(az: number, el: number, d: number) {
    camera.position.set(
      target.x + d * Math.cos(el) * Math.sin(az),
      target.y + d * Math.sin(el),
      target.z + d * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }
  function fit() {
    aim(BASE_TARGET.x);
    const az = THREE.MathUtils.degToRad(-2), el = THREE.MathUtils.degToRad(baseEl);
    let d = 34;
    for (let i = 0; i < 6; i++) {
      pose(az, el, d);
      let m = 0;
      for (const c of corners) {
        v.copy(c).project(camera);
        m = Math.max(m, Math.abs(v.x) / 0.97, Math.abs(v.y) / 0.92);
      }
      d *= m;
    }
    fitDist = d;
  }

  function placeCamera(input: SceneInput, focus: number, dt: number, snap: boolean) {
    // focus: lean 25% towards the focused layer and dolly in a little (chapter 3 = the whole engine)
    const f = Math.min(3, Math.max(0, Math.round(focus)));
    const goalX = THREE.MathUtils.lerp(BASE_TARGET.x, FOCUS_X[f], 0.25);
    const goalD = f < 3 ? 0.07 : 0;
    const k = snap ? 1 : 1 - Math.exp(-dt * 2.2);
    cam.fx += (goalX - cam.fx) * k;
    cam.dolly += (goalD - cam.dolly) * k;
    aim(cam.fx);
    const idle = Math.sin((input.time / 26) * Math.PI * 2);
    const az = THREE.MathUtils.degToRad(-2 + idle * 1.2 + input.pointerX * 2);
    const el = THREE.MathUtils.degToRad(baseEl + input.scroll * 7 - input.pointerY * 2);
    if (snap || Number.isNaN(cam.az)) { cam.az = az; cam.el = el; }
    cam.az += (az - cam.az) * 0.06;
    cam.el += (el - cam.el) * 0.06;
    pose(cam.az, cam.el, fitDist * (1 + 0.04 * (1 - Math.cos(cam.az)) - cam.dolly));
  }

  /** Strategy scan: rests at the middle; one there-and-back sweep when a feedback pulse arrives
   *  home (and once as the system connects). */
  function scanAt(t: number) {
    let arrive = t >= 6.0 ? 6.0 : -Infinity;
    for (const o of tokens.act.outcomes) { const a = o.at + FB_DUR; if (a <= t && a > arrive) arrive = a; }
    const ph = (t - arrive) / 1.4;
    return ph >= 0 && ph <= 1 ? 0.5 + 0.45 * Math.sin(Math.PI * 2 * ph) : 0.5;
  }

  let width = 1, height = 1;

  return {
    setSize(w: number, h: number, dpr: number) {
      width = w; height = h;
      // webgl.md: DPR <= 2 (1.5 on low-power devices), enforced here regardless of the caller.
      renderer.setPixelRatio(Math.min(dpr, opts.lowPower ? 1.5 : 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      orient(w / h);
      fit();
      cam.az = Number.NaN; // re-seat the camera at the new pose
    },
    /** Render at time t (seconds since first play, never wraps) with the given focus chapter. */
    frame(t: number, dt: number, input: SceneInput, focus: number, snap = false) {
      const st = story(t);
      tokens.update(t);
      intel.update(st, tokens.act, scanAt(t), t, dt);
      channels.update(st, tokens.act, t, dt);
      pipeline.update(tokens.act, t);
      revops.update(st, tokens.act, tokens.counts, t);
      placeCamera(input, focus, dt, snap);
      if (opts.lowPower) renderer.shadowMap.needsUpdate = snap || frames++ % 3 === 0;
      // State stays a pure function of t, so skipping the draw while hidden costs nothing on return.
      if (snap || typeof document === 'undefined' || !document.hidden) renderer.render(scene, camera);
      return { state: st, counts: tokens.counts, lost: tokens.act.lost };
    },
    /** Screen positions (CSS px, relative to the canvas) of every label anchor. */
    project(out: Float32Array) {
      anchors.forEach((a, i) => {
        v.set(a[0], a[1], a[2]).applyMatrix4(root.matrixWorld).project(camera);
        out[i * 2] = (v.x * 0.5 + 0.5) * width;
        out[i * 2 + 1] = (-v.y * 0.5 + 0.5) * height;
      });
    },
    dispose() {
      intel.dispose();
      channels.dispose();
      pipeline.dispose();
      revops.dispose();
      tokens.dispose();
      scene.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
      Object.values(mat).forEach((m) => { (m as THREE.Material).dispose(); (m as THREE.MeshBasicMaterial).map?.dispose(); });
      renderer.dispose();
    },
  };
}
