import { ACESFilmicToneMapping, PMREMGenerator, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Escenario WebGL mínimo: renderer transparente, entorno de estudio y bucle que solo corre cuando se le pide. */
export function createStage(canvas, { fov = 30 } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(fov, 1, 0.1, 200);
  const size = { w: 1, h: 1, aspect: 1 };
  let onFrame = () => {};
  let onResize = () => {};
  let running = false;
  let raf = 0;
  let last = 0;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    size.w = w;
    size.h = h;
    size.aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = size.aspect;
    camera.updateProjectionMatrix();
    onResize(size);
    if (!running) draw(performance.now());
  }
  new ResizeObserver(resize).observe(canvas);

  function draw(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    onFrame(dt, now / 1000);
    renderer.render(scene, camera);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    draw(now);
  }

  return {
    renderer,
    scene,
    camera,
    size,
    /** alto visible (unidades de mundo) a una distancia z de la cámara */
    viewHeight: (z) => 2 * Math.tan((camera.fov * Math.PI) / 360) * z,
    setFrame(fn) {
      onFrame = fn;
    },
    setResize(fn) {
      onResize = fn;
      resize();
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
