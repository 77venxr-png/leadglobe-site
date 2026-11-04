// The revenue engine scene: renderer, camera, soft studio light, plinth, and the four modules.
// Loaded lazily by GTMHero. It never runs its own loop: the caller drives frame() from gsap.ticker.
import * as THREE from 'three';
import { createSpheres } from './CustomerSpheres';
import { createEngine } from './GTMEngine';
import { createStations } from './GTMStations';
import { createPipeline } from './RevenuePipeline';
import { story, type StoryState } from './GTMAnimationController';
import { BOWL, HOPPER, PLINTH_H, PLINTH_R, R, at, stations, type StationId, type Vec } from './layout';
import { createMaterials, puckGeometry } from './materials';

export type SceneInput = { pointerX: number; pointerY: number; scroll: number; time: number };
export type GTMSceneHandle = ReturnType<typeof createGTMScene>;

/** Top of each station's structure, so its tag sits right on it. */
const TOPS: Record<StationId, number> = { paid: 1.08, revops: 0.9, abm: 1.06, content: 0.5, strategy: 1.02, outbound: 0.86 };
/** Anchors the DOM labels follow: six stations, prospects, revenue, then the final label (same spot as revenue). */
export const anchors: Vec[] = [
  ...stations.map((s) => at(s.deg, R, TOPS[s.id] + 0.08)),
  [HOPPER[0], 1.0, HOPPER[2]],
  [BOWL[0], -0.42, BOWL[2] + 0.75],
  [BOWL[0], -0.42, BOWL[2] + 0.75],
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
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 80);
  const mat = createMaterials();

  // Light: a big soft key from the upper right-front, a sky/ground fill, a faint rim from the left.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3eeec, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(5.5, 11, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(opts.lowPower ? 1024 : 2048);
  const sc = key.shadow.camera as THREE.OrthographicCamera;
  sc.left = sc.bottom = -6.2;
  sc.right = sc.top = 6.2;
  sc.near = 2;
  sc.far = 30;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4f6, 0.45);
  rim.position.set(-7, 4, -3);
  scene.add(rim);

  // Plinth: a porcelain disc the model stands on, casting a soft shadow onto the page.
  const plinth = new THREE.Mesh(puckGeometry(PLINTH_R, PLINTH_H, 0.08, 96), mat.plinth);
  plinth.position.y = -PLINTH_H;
  plinth.receiveShadow = true;
  scene.add(plinth);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.08 }));
  ground.position.y = -PLINTH_H - 0.001;
  ground.receiveShadow = true;
  scene.add(ground);
  // The space the engine will occupy: a faint etched ring in the plinth.
  const etch = new THREE.Mesh(new THREE.RingGeometry(1.24, 1.27, 96).rotateX(-Math.PI / 2), mat.etch);
  etch.position.y = 0.002;
  scene.add(etch);

  // Fake ambient occlusion: soft contact blobs under stations, hopper and bowl.
  const aoSpots: [number, number, number][] = [
    ...stations.map((s) => { const p = at(s.deg, R, 0); return [p[0], p[2], 1.75] as [number, number, number]; }),
    [HOPPER[0], HOPPER[2], 1.5], [BOWL[0], BOWL[2], 1.7],
  ];
  const ao = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat.ao, aoSpots.length);
  const m4 = new THREE.Matrix4();
  aoSpots.forEach(([x, z, s], i) => ao.setMatrixAt(i, m4.makeScale(s, 1, s).setPosition(x, 0.003, z)));
  ao.renderOrder = -1;
  scene.add(ao);

  const stationsM = createStations(mat);
  const pipeline = createPipeline(mat);
  const engine = createEngine(mat);
  const spheres = createSpheres(mat);
  scene.add(stationsM.group, pipeline.group, engine.group, spheres.mesh);

  // Camera rig: a slow orbit around a fixed target, nudged by pointer and scroll.
  const target = new THREE.Vector3(0, 0.15, 0.25);
  const cam = { az: Number.NaN, el: Number.NaN }; // NaN: snap to the target pose on the first frame
  let aspect = 1;
  let fitDist = 20;
  const halfW = PLINTH_R + 0.42; // what must fit horizontally (plinth plus labels)
  const halfH = 3.4;

  function fit() {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    fitDist = Math.max(halfH / t, halfW / (t * aspect));
  }

  function placeCamera(st: StoryState, input: SceneInput) {
    const idle = Math.sin((input.time / 26) * Math.PI * 2);
    const az = THREE.MathUtils.degToRad(-4 + idle * 2.5 + input.pointerX * 5);
    const el = THREE.MathUtils.degToRad(34 + input.scroll * 9 - input.pointerY * 3);
    cam.az += (az - cam.az) * 0.06;
    cam.el += (el - cam.el) * 0.06;
    const d = fitDist * (1 - 0.02 * st.dolly);
    camera.position.set(
      target.x + d * Math.cos(cam.el) * Math.sin(cam.az),
      target.y + d * Math.sin(cam.el),
      target.z + d * Math.cos(cam.el) * Math.cos(cam.az),
    );
    camera.lookAt(target);
  }

  const v = new THREE.Vector3();
  let width = 1, height = 1;

  return {
    setSize(w: number, h: number, dpr: number) {
      width = w; height = h;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      fit();
    },
    /** Render the story at loop time t. dt drives the integrated spins. Returns the story state. */
    frame(t: number, dt: number, input: SceneInput, snap = false) {
      const st = story(t);
      spheres.update(st.t);
      const speed = engine.update(st.engine, st.spin, dt);
      stationsM.update(dt, speed, st.sync, spheres.activity);
      pipeline.update(st, spheres.pulses);
      if (snap) { cam.az = Number.NaN; } // first frame: jump straight to the target pose
      if (Number.isNaN(cam.az)) {
        cam.az = THREE.MathUtils.degToRad(-4 + input.pointerX * 5);
        cam.el = THREE.MathUtils.degToRad(34 + input.scroll * 9);
      }
      placeCamera(st, input);
      if (opts.lowPower) renderer.shadowMap.needsUpdate = snap || frames++ % 3 === 0;
      renderer.render(scene, camera);
      return { state: st, activity: spheres.activity };
    },
    /** Screen positions (CSS px, relative to the canvas) of every label anchor. */
    project(out: Float32Array) {
      anchors.forEach((a, i) => {
        v.set(a[0], a[1], a[2]).project(camera);
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
      Object.values(mat).forEach((m) => { (m as THREE.Material).dispose(); const map = (m as THREE.MeshBasicMaterial).map; map?.dispose(); });
      renderer.dispose();
    },
  };
}
