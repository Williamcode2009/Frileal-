/**
 * Esfera de fotografías en CSS 3D. Gira sola, se arrastra con el dedo o el mouse
 * y atenúa las fotos del lado lejano. Las fotos son botones reales (accesibles).
 */
export function createSphere(root, { reduced = false } = {}) {
  const rotor = root.querySelector('[data-sphere-rot]');
  const tiles = [...root.querySelectorAll('[data-tile]')];
  const N = tiles.length;
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  const items = tiles.map((el, i) => {
    const lat = Math.asin(1 - (2 * (i + 0.5)) / N) * 0.92;
    const lon = i * GOLDEN;
    el.style.transform = `rotateY(${lon}rad) rotateX(${-lat}rad) translateZ(var(--R))`;
    return { el, x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.cos(lon) };
  });

  const state = { yaw: 0.4, tilt: -0.18, vel: 0.14, scroll: 0 };
  const AUTO = reduced ? 0 : 0.14;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let visible = false;
  let raf = 0;
  let last = 0;

  function fit() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    const R = Math.min(w * 0.47, h * 0.42, 430);
    root.style.setProperty('--R', `${R.toFixed(0)}px`);
    root.style.setProperty('--tile', `${(R * 0.5).toFixed(0)}px`);
  }
  new ResizeObserver(fit).observe(root);
  fit();

  function render() {
    const yaw = state.yaw + state.scroll;
    rotor.style.transform = `rotateX(${state.tilt}rad) rotateY(${yaw}rad)`;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const ct = Math.cos(state.tilt);
    const st = Math.sin(state.tilt);
    for (const it of items) {
      const z1 = -it.x * sy + it.z * cy;
      const depth = it.y * st + z1 * ct; // 1 = al frente, -1 = al fondo
      const k = (depth + 1) / 2;
      it.el.style.opacity = (0.3 + 0.7 * k).toFixed(3);
      it.el.style.pointerEvents = depth > 0.15 ? 'auto' : 'none';
      it.el.tabIndex = depth > 0.15 ? 0 : -1;
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!dragging) {
      state.yaw += state.vel * dt;
      state.vel += (AUTO - state.vel) * Math.min(1, dt * 1.6);
      state.tilt += (-0.18 - state.tilt) * Math.min(1, dt * 1.2);
    }
    render();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }).observe(root);

  root.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    state.vel = 0;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    state.yaw += dx * 0.006;
    state.tilt = Math.max(-0.7, Math.min(0.7, state.tilt - dy * 0.004));
    state.vel = dx * 0.35;
  });
  const end = () => (dragging = false);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  // un arrastre no debe abrir la foto
  root.addEventListener('click', (e) => moved > 8 && (e.stopPropagation(), e.preventDefault()), true);

  render();
  return state;
}
