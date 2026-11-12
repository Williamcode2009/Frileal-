import {
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SphereGeometry,
} from 'three';
import { createStage } from './stage.js';

const TAU = Math.PI * 2;
const R = 1; // radio del poste
const H = 10; // alto
const PITCH = 6; // avance de la hélice por vuelta
const TURNS = H / PITCH;
const WIDTH = PITCH / 8; // 4 cintas → mitad color, mitad blanco
const SEG = 150;
const RED = '#b81f17';
const BLUE = '#17337f';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);

/**
 * Poste de barbero cuyas franjas son cintas reales: giran como hélice
 * y, al avanzar el scroll, se sueltan, se aplanan y se cortan.
 * `P` son los parámetros que anima la línea de tiempo de GSAP.
 */
export function createPole(canvas) {
  const stage = createStage(canvas);
  const { scene, camera } = stage;

  const P = { camY: 3.9, x: 0, core: 1, unwind: 0, wave: 1, split: 0, zoom: 1, rise: 1, lift: 1 };

  const key = new DirectionalLight('#fff4e6', 1.5);
  key.position.set(4, 6, 8);
  scene.add(key);

  const root = new Group();
  scene.add(root);

  // Núcleo blanco
  const core = new Mesh(
    new CylinderGeometry(R * 0.992, R * 0.992, H, 64, 1, true),
    new MeshStandardMaterial({ color: '#f6f1e7', roughness: 0.32, metalness: 0.05 }),
  );
  root.add(core);

  // Remates cromados
  const chrome = new MeshStandardMaterial({ color: '#dcdcdc', roughness: 0.14, metalness: 1 });
  const caps = new Group();
  const top = new Group();
  top.position.y = H / 2;
  const ring = new Mesh(new CylinderGeometry(1.15, 1.15, 0.55, 64), chrome);
  ring.position.y = 0.2;
  const dome = new Mesh(new SphereGeometry(1.1, 48, 24, 0, TAU, 0, Math.PI / 2), chrome);
  dome.scale.y = 0.62;
  dome.position.y = 0.47;
  const neck = new Mesh(new CylinderGeometry(0.1, 0.16, 0.4, 24), chrome);
  neck.position.y = 1.3;
  const finial = new Mesh(new SphereGeometry(0.3, 32, 24), chrome);
  finial.position.y = 1.72;
  top.add(ring, dome, neck, finial);
  const bulbMat = new MeshStandardMaterial({ color: '#fff', emissive: new Color('#ffe9bf'), emissiveIntensity: 2.4 });
  for (let i = 0; i < 12; i++) {
    const b = new Mesh(new SphereGeometry(0.075, 16, 12), bulbMat);
    const a = (i / 12) * TAU;
    b.position.set(Math.cos(a) * 1.17, 0.2, Math.sin(a) * 1.17);
    top.add(b);
  }
  const bottom = new Mesh(new CylinderGeometry(1.15, 1.15, 0.55, 64), chrome);
  bottom.position.y = -H / 2 - 0.2;
  caps.add(top, bottom);
  root.add(caps);

  // Cintas: 4 franjas × 2 mitades (para el corte final)
  const ribbons = [];
  for (let i = 0; i < 4; i++) {
    const mat = new MeshStandardMaterial({ color: i % 2 ? BLUE : RED, roughness: 0.78, metalness: 0, envMapIntensity: 0.45, side: DoubleSide });
    for (let half = 0; half < 2; half++) {
      const geo = new PlaneGeometry(1, 1, SEG, 3);
      const mesh = new Mesh(geo, mat);
      mesh.frustumCulled = false;
      root.add(mesh);
      ribbons.push({ i, half, geo, uv: geo.attributes.uv, pos: geo.attributes.position, bandY: 1.05 - i * 0.7 });
    }
  }

  // Confeti al fondo
  const COUNT = 150;
  const cPos = new Float32Array(COUNT * 3);
  const cCol = new Float32Array(COUNT * 3);
  const cVel = new Float32Array(COUNT);
  const palette = [RED, BLUE, '#c9a24a', '#b9b2a6'].map((c) => new Color(c));
  for (let i = 0; i < COUNT; i++) {
    cPos[i * 3] = (Math.random() - 0.5) * 26;
    cPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    cPos[i * 3 + 2] = -2 - Math.random() * 8;
    palette[i % palette.length].toArray(cCol, i * 3);
    cVel[i] = 0.12 + Math.random() * 0.3;
  }
  const cGeo = new BufferGeometry();
  cGeo.setAttribute('position', new BufferAttribute(cPos, 3));
  cGeo.setAttribute('color', new BufferAttribute(cCol, 3));
  const confetti = new Points(cGeo, new PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.75 }));
  confetti.frustumCulled = false;
  scene.add(confetti);

  let baseZ = 10;
  let portrait = false;
  stage.setResize(({ aspect }) => {
    portrait = aspect < 0.9;
    // el poste ocupa ~58 % del ancho en vertical y ~21 % en horizontal
    const frac = portrait ? 0.58 : 0.21;
    baseZ = (2 * R) / (frac * stage.viewHeight(1) * aspect);
  });

  stage.setFrame((dt, t) => {
    const z = baseZ * P.zoom;
    const viewH = stage.viewHeight(z);
    const viewW = viewH * stage.size.aspect;
    // en vertical, el poste vive en la mitad superior mientras hay texto abajo
    const shift = portrait ? viewH * 0.14 * P.lift : 0;
    camera.position.set(0, P.camY - shift, z);
    camera.lookAt(0, P.camY - shift, 0);

    root.position.y = -P.rise * 9;
    core.position.x = caps.position.x = P.x;
    core.scale.x = core.scale.z = Math.max(P.core, 0.001);
    core.visible = P.core > 0.01;
    caps.visible = P.unwind < 0.02;

    const spin = t * 0.55 + P.rise * 5;
    const L = Math.max(viewW * 1.5, 12);
    const S = 0.9; // desfase: la cinta se suelta de arriba hacia abajo
    for (const r of ribbons) {
      const phase = (r.i / 4) * TAU;
      const dir = r.half ? 1 : -1;
      for (let k = 0; k < r.pos.count; k++) {
        const u = (r.half + r.uv.getX(k)) * 0.5;
        const v = r.uv.getY(k) - 0.5;
        const e = smooth(clamp01(P.unwind * (1 + S) - (1 - u) * S));

        const th = phase + TAU * TURNS * u + spin;
        const rad = R * 1.012 * (1 + Math.sin(Math.PI * e) * 1.3);
        const hx = Math.cos(th) * rad + P.x;
        const hz = Math.sin(th) * rad;
        const hy = (u - 0.5) * H + v * WIDTH;

        const w = P.wave;
        const fx = (u - 0.5) * L + dir * P.split * viewW * (portrait ? 0.46 : 0.36);
        const fy = P.camY + r.bandY * (1 + P.split * 0.9) + v * 0.46 + Math.sin(u * 9 + t * 1.3 + r.i * 1.9) * 0.4 * w;
        const fz = Math.cos(u * 7 + t * 1.1 + r.i * 1.3) * 0.7 * w + r.i * 0.03;

        r.pos.setXYZ(k, lerp(hx, fx, e), lerp(hy, fy, e), lerp(hz, fz, e));
      }
      r.pos.needsUpdate = true;
      r.geo.computeVertexNormals();
    }

    for (let i = 0; i < COUNT; i++) {
      let y = cPos[i * 3 + 1] - cVel[i] * dt;
      if (y < -8) y = 8;
      cPos[i * 3 + 1] = y;
    }
    cGeo.attributes.position.needsUpdate = true;
    confetti.position.y = P.camY;
  });

  return { P, start: stage.start, stop: stage.stop };
}
