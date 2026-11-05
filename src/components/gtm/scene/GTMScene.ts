// The sales-pipeline scene: renderer, camera, soft studio light, plinth, and the four modules.
// Loaded lazily by GTMHero. It never runs its own loop: the caller drives frame() from gsap.ticker.
import * as THREE from 'three';
import { createSpheres } from './CustomerSpheres';
import { createEngine } from './GTMEngine';
import { createStations } from './GTMStations';
import { createPipeline, slab } from './RevenuePipeline';
import { story, type StoryState } from './GTMAnimationController';
import {
  CH_Y, EL_SQUARE, EL_WIDE, MARKET, MODULE_Z, PLINTH, TRAY, YAW_SQUARE, YAW_WIDE, handoffs, stages, type Vec,
} from './layout';
import { createMaterials } from './materials';

export type SceneInput = { pointerX: number; pointerY: number; scroll: number; time: number };
export type GTMSceneHandle = ReturnType<typeof createGTMScene>;

/** Label anchors in model space: 6 stages (track level: the scoreboard aligns its columns to
 *  their screen x), 5 services (above the modules), gtm strategy (above the market). */
export const anchors: Vec[] = [
  ...stages.slice(0, -1).map((s) => [s.x, CH_Y, 0] as Vec),
  [TRAY[0], 0.02, TRAY[2]],
  ...handoffs.map((h) => [h.x, 1.0, MODULE_Z - 0.05] as Vec),
  [MARKET.x, 0.7, MARKET.z - 1.45],
];
export const N_ANCHORS = anchors.length;

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
  const camera = new THREE.PerspectiveCamera(22, 1, 1, 120);
  const mat = createMaterials();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3eeec, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(4, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(opts.lowPower ? 1024 : 2048);
  const sc = key.shadow.camera as THREE.OrthographicCamera;
  sc.left = sc.bottom = -8.5;
  sc.right = sc.top = 8.5;
  sc.near = 2;
  sc.far = 34;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4f6, 0.45);
  rim.position.set(-8, 4, -4);
  scene.add(rim);

  // Model root: everything in pipeline space, turned so the won end comes towards the camera.
  const root = new THREE.Group();
  root.rotation.y = YAW_SQUARE;
  scene.add(root);

  const plinth = new THREE.Mesh(slab(PLINTH.x1 - PLINTH.x0, PLINTH.z1 - PLINTH.z0, PLINTH.h, PLINTH.r, 0.06), mat.plinth);
  plinth.position.set((PLINTH.x0 + PLINTH.x1) / 2, -PLINTH.h, (PLINTH.z0 + PLINTH.z1) / 2);
  plinth.receiveShadow = true;
  root.add(plinth);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.08 }));
  ground.position.y = -PLINTH.h - 0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  // Fake ambient occlusion: soft contact blobs under the trays and the module bays.
  // (Only under things that are always there; modules and hub bring their own shadows.)
  const aoSpots: [number, number, number][] = [[MARKET.x, MARKET.z, 3.0], [TRAY[0], TRAY[2], 1.7]];
  const ao = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat.ao, aoSpots.length);
  const m4 = new THREE.Matrix4();
  aoSpots.forEach(([x, z, s], i) => ao.setMatrixAt(i, m4.makeScale(s, 1, s).setPosition(x, 0.003, z)));
  ao.renderOrder = -1;
  root.add(ao);

  const stationsM = createStations(mat);
  const pipeline = createPipeline(mat);
  const engine = createEngine(mat);
  const spheres = createSpheres(mat, engine.scanZ);
  root.add(stationsM.group, pipeline.group, engine.group, spheres.mesh, spheres.rings);
  root.updateMatrixWorld(true);

  // Camera rig: frames the whole plinth (and the service tags above it) for any aspect ratio.
  // Wide frames turn the track towards left-to-right and lower the camera; square ones keep the
  // diagonal so the long model still fits.
  const box = new THREE.Box3(new THREE.Vector3(PLINTH.x0, -PLINTH.h, PLINTH.z0 - 0.2), new THREE.Vector3(PLINTH.x1, 1.35, PLINTH.z1 + 0.15));
  const local = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(
    i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z,
  ));
  const corners = local.map((c) => c.clone());
  const target = new THREE.Vector3();
  const cam = { az: Number.NaN, el: Number.NaN };
  let baseEl = EL_SQUARE;
  let fitDist = 30;
  const v = new THREE.Vector3();

  function orient(aspect: number) {
    const k = THREE.MathUtils.smoothstep(aspect, 1.1, 2.2);
    root.rotation.y = THREE.MathUtils.lerp(YAW_SQUARE, YAW_WIDE, k);
    baseEl = THREE.MathUtils.lerp(EL_SQUARE, EL_WIDE, k);
    root.updateMatrixWorld(true);
    local.forEach((c, i) => corners[i].copy(c).applyMatrix4(root.matrixWorld));
    target.set(0.0, 0.1, -0.85).applyMatrix4(root.matrixWorld);
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
    const az = THREE.MathUtils.degToRad(-2), el = THREE.MathUtils.degToRad(baseEl);
    let d = 30;
    for (let i = 0; i < 6; i++) {
      pose(az, el, d);
      let m = 0;
      for (const c of corners) {
        v.copy(c).project(camera);
        m = Math.max(m, Math.abs(v.x) / 0.97, Math.abs(v.y) / 0.94);
      }
      d *= m;
    }
    fitDist = d;
  }

  function placeCamera(st: StoryState, input: SceneInput) {
    const idle = Math.sin((input.time / 26) * Math.PI * 2);
    const az = THREE.MathUtils.degToRad(-2 + idle * 1.2 + input.pointerX * 2);
    const el = THREE.MathUtils.degToRad(baseEl + input.scroll * 7 - input.pointerY * 2);
    if (Number.isNaN(cam.az)) { cam.az = az; cam.el = el; }
    cam.az += (az - cam.az) * 0.06;
    cam.el += (el - cam.el) * 0.06;
    pose(cam.az, cam.el, fitDist * (1 + 0.04 * (1 - Math.cos(cam.az)) - 0.015 * st.dolly));
  }

  let width = 1, height = 1;

  return {
    setSize(w: number, h: number, dpr: number) {
      width = w; height = h;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      orient(w / h);
      fit();
      cam.az = Number.NaN; // re-seat the camera at the new pose
    },
    /** Render the story at loop time t. dt drives the integrated spins. */
    frame(t: number, dt: number, input: SceneInput, snap = false) {
      const st = story(t);
      spheres.update(st.t, st.scan);
      const speed = engine.update(st, dt);
      stationsM.update(st, dt, speed, spheres.activity);
      pipeline.update(st, spheres.pulses);
      if (snap) cam.az = Number.NaN;
      placeCamera(st, input);
      if (opts.lowPower) renderer.shadowMap.needsUpdate = snap || frames++ % 3 === 0;
      renderer.render(scene, camera);
      return { state: st, counts: spheres.counts, activity: spheres.activity };
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
      stationsM.dispose();
      pipeline.dispose();
      engine.dispose();
      spheres.dispose();
      scene.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); });
      Object.values(mat).forEach((m) => { (m as THREE.Material).dispose(); (m as THREE.MeshBasicMaterial).map?.dispose(); });
      renderer.dispose();
    },
  };
}
