import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage } from './stage.js';

/**
 * Máquina de corte cromada, en despiece. Modelo propio (sin marcas):
 * `P.explode` separa las piezas y las etiquetas HTML siguen a su ancla 3D.
 */
export function createClipper(canvas, labelEls) {
  const stage = createStage(canvas);
  const { scene, camera } = stage;
  const P = { explode: 0, rot: -0.55, zoom: 1, x: 0 };

  const key = new DirectionalLight('#ffffff', 2.4);
  key.position.set(5, 7, 9);
  const rim = new DirectionalLight('#cfe0ff', 1.6);
  rim.position.set(-6, 2, -5);
  scene.add(key, rim);

  const M = (color, roughness, metalness, extra = {}) => new MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const chrome = M('#ffffff', 0.05, 1, { envMapIntensity: 2.3 });
  const satin = M('#c9ccd0', 0.32, 1);
  const black = M('#101010', 0.35, 0.6);
  const copper = M('#b9673a', 0.35, 1);
  const cell = M('#2450c4', 0.35, 0.3);
  const board = M('#1f6b4a', 0.6, 0.1);

  const group = new Group();
  scene.add(group);
  const parts = [];
  const anchors = {};

  const add = (name, object, base, off, anchor) => {
    object.position.set(...base);
    group.add(object);
    parts.push({ object, base: new Vector3(...base), off: new Vector3(...off) });
    if (anchor) {
      const a = new Object3D();
      a.position.set(...anchor);
      object.add(a);
      anchors[name] = a;
    }
    return object;
  };

  const teeth = (width, count, h, d, mat) => {
    const g = new Group();
    const step = width / count;
    for (let i = 0; i < count; i++) {
      const t = new Mesh(new BoxGeometry(step * 0.5, h, d), mat);
      t.position.set(-width / 2 + step * (i + 0.5), 0, 0);
      g.add(t);
    }
    return g;
  };

  // Silueta del cuerpo: hombros anchos, cintura y base redondeada
  const outline = (k = 1, top = 1.8, bottom = -1.8) => {
    const s = new Shape();
    const side = (sx) => [
      [0.5 * k * sx, top],
      [0.62 * k * sx, top, 0.62 * k * sx, top - 0.14],
      [0.62 * k * sx, 1.15],
      [0.62 * k * sx, 0.7, 0.5 * k * sx, 0.6, 0.5 * k * sx, 0.2],
      [0.46 * k * sx, bottom + 0.35],
      [0.46 * k * sx, bottom, 0.2 * k * sx, bottom],
    ];
    const r = side(1);
    s.moveTo(0, top);
    s.lineTo(...r[0]);
    s.quadraticCurveTo(...r[1]);
    s.lineTo(...r[2]);
    s.bezierCurveTo(...r[3]);
    s.lineTo(...r[4]);
    s.quadraticCurveTo(...r[5]);
    const l = side(-1);
    s.lineTo(l[5][2], l[5][3]);
    s.quadraticCurveTo(l[5][0], l[5][1], l[4][0], l[4][1]);
    s.lineTo(l[3][4], l[3][5]);
    s.bezierCurveTo(l[3][2], l[3][3], l[3][0], l[3][1], l[2][0], l[2][1]);
    s.lineTo(l[1][2], l[1][3]);
    s.quadraticCurveTo(l[1][0], l[1][1], l[0][0], l[0][1]);
    s.closePath();
    return s;
  };
  const extrude = (shape, depth, bevel) =>
    new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 24 });

  // Cuchilla fija (oscura) y móvil (acero)
  const fixed = new Group();
  fixed.add(new Mesh(new BoxGeometry(1.22, 0.36, 0.1), black));
  const ft = teeth(1.22, 20, 0.26, 0.1, black);
  ft.position.y = 0.3;
  fixed.add(ft);
  fixed.rotation.x = -0.25;
  add('fija', fixed, [0, 2.32, -0.1], [0, 1.85, 0], [0.63, 0.1, 0]);

  const moving = new Group();
  moving.add(new Mesh(new BoxGeometry(1.04, 0.26, 0.07), satin));
  const mt = teeth(1.04, 24, 0.2, 0.07, satin);
  mt.position.y = 0.22;
  moving.add(mt);
  moving.rotation.x = -0.25;
  add('movil', moving, [0, 2.3, 0.02], [0, 1.25, 0], [0.54, 0.05, 0]);

  // Cabezal
  const head = new Mesh(new RoundedBoxGeometry(1.2, 0.42, 0.78, 4, 0.1), black);
  add('cabezal', head, [0, 1.93, 0], [0, 0.7, 0], [0.61, 0, 0]);

  // Motor
  const motor = new Group();
  const can = new Mesh(new CylinderGeometry(0.3, 0.3, 0.8, 40), satin);
  const coil = new Mesh(new CylinderGeometry(0.315, 0.315, 0.42, 40), copper);
  const shaft = new Mesh(new CylinderGeometry(0.06, 0.06, 0.35, 16), satin);
  shaft.position.y = 0.55;
  motor.add(can, coil, shaft);
  add('motor', motor, [0, 1.0, 0], [0, 0.2, 0], [0.33, 0, 0]);

  // Placa
  add('placa', new Mesh(new BoxGeometry(0.56, 0.8, 0.05), board), [0, 0.05, -0.08], [0, -0.15, 0]);

  // Batería
  const battery = new Group();
  battery.add(new Mesh(new CylinderGeometry(0.27, 0.27, 1.15, 40), cell));
  const cap = new Mesh(new CylinderGeometry(0.275, 0.275, 0.08, 40), satin);
  cap.position.y = 0.58;
  const cap2 = cap.clone();
  cap2.position.y = -0.58;
  battery.add(cap, cap2);
  add('bateria', battery, [0, -0.9, 0], [0, -0.55, 0], [0.29, 0, 0]);

  // Medallón grabado con las iniciales de la casa
  const medallion = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#c4c7cb';
    x.fillRect(0, 0, 256, 256);
    x.strokeStyle = '#5d6166';
    x.lineWidth = 5;
    x.beginPath();
    x.arc(128, 128, 104, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = '#3c3f43';
    x.textAlign = 'center';
    x.font = '400 96px "Bodoni Moda Variable", Didot, serif';
    x.fillText('FL', 128, 150);
    x.font = '600 20px "Instrument Sans Variable", Arial, sans-serif';
    x.fillText('L E A L', 128, 190);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    const g = new Group();
    const ring = new Mesh(new TorusGeometry(0.21, 0.025, 12, 48), chrome);
    const face = new Mesh(new CircleGeometry(0.2, 48), new MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.85 }));
    g.add(ring, face);
    return g;
  };

  const screw = (x, y, z) => {
    const s = new Group();
    const h = new Mesh(new CylinderGeometry(0.055, 0.055, 0.04, 20), satin);
    h.rotation.x = Math.PI / 2;
    const slot = new Mesh(new BoxGeometry(0.075, 0.014, 0.01), black);
    slot.position.z = 0.022;
    const slot2 = slot.clone();
    slot2.rotation.z = Math.PI / 2;
    s.add(h, slot, slot2);
    s.position.set(x, y, z);
    return s;
  };

  // Carcasa frontal: cromo pulido con panel en relieve, medallón y tornillos
  const front = new Group();
  front.add(new Mesh(extrude(outline(), 0.3, 0.07), chrome));
  const panel = new Mesh(extrude(outline(0.7, 1.52, -1.5), 0.03, 0.035), chrome);
  panel.position.z = 0.37;
  const med = medallion();
  med.position.set(0, 0.72, 0.445);
  front.add(panel, med, screw(0.3, 1.36, 0.44), screw(-0.3, 1.36, 0.44), screw(0.2, -1.34, 0.44), screw(-0.2, -1.34, 0.44));
  const dot = new Mesh(new CylinderGeometry(0.045, 0.045, 0.03, 16), black);
  dot.rotation.x = Math.PI / 2;
  dot.position.set(0, -1.34, 0.445);
  front.add(dot);
  add('frontal', front, [0, 0, 0.07], [-1.75, 0, 0.15]);

  // Carcasa trasera con argolla para colgar
  const back = new Group();
  const backShell = new Mesh(extrude(outline(), 0.3, 0.07), chrome);
  backShell.position.z = -0.3;
  const loop = new Mesh(new TorusGeometry(0.17, 0.055, 14, 36), chrome);
  loop.position.set(0.12, -1.98, -0.15);
  const sw = new Mesh(new RoundedBoxGeometry(0.1, 0.3, 0.16, 3, 0.04), black);
  sw.position.set(-0.52, -0.25, -0.12);
  back.add(backShell, loop, sw);
  add('carcasa', back, [0, 0, -0.07], [-3.2, 0, -0.15], [-0.5, -0.7, -0.15]);

  // Palanca lateral
  const lever = new Group();
  const arm = new Mesh(new RoundedBoxGeometry(0.1, 0.78, 0.2, 3, 0.045), chrome);
  arm.rotation.z = 0.3;
  const guard = new Mesh(new RoundedBoxGeometry(0.09, 0.9, 0.3, 3, 0.04), black);
  guard.position.set(0.1, 0.12, -0.02);
  guard.rotation.z = 0.42;
  const pivotA = new Mesh(new SphereGeometry(0.085, 20, 14), chrome);
  pivotA.position.set(-0.11, 0.36, 0.1);
  const pivotB = pivotA.clone();
  pivotB.position.set(0.1, -0.34, 0.1);
  lever.add(guard, arm, pivotA, pivotB);
  lever.position.set(-0.74, 1.3, 0.13);
  back.add(lever);

  const labels = labelEls.map((el) => ({ el, anchor: anchors[el.dataset.part] })).filter((l) => l.anchor);

  let baseZ = 14;
  let portrait = false;
  stage.setResize(({ aspect }) => {
    portrait = aspect < 0.9;
    baseZ = 4.6 / ((portrait ? 0.4 : 0.68) * stage.viewHeight(1));
  });

  const v = new Vector3();
  stage.setFrame((dt, t) => {
    const z = baseZ * P.zoom;
    camera.position.set(0, 0.25, z);
    camera.lookAt(0, 0.25, 0);
    const viewW = stage.viewHeight(z) * stage.size.aspect;
    group.position.x = portrait ? viewW * 0.01 * P.explode : viewW * (0.08 + 0.1 * P.explode) * P.x;
    group.position.y = portrait ? -0.75 * (1 - P.explode) : 0;
    group.rotation.y = P.rot + Math.sin(t * 0.5) * 0.06;
    group.rotation.x = 0.12;
    group.rotation.z = -0.1 * (1 - P.explode);
    for (const p of parts) p.object.position.copy(p.base).addScaledVector(p.off, P.explode);

    group.updateMatrixWorld();
    for (const l of labels) {
      l.anchor.getWorldPosition(v).project(camera);
      const x = (v.x * 0.5 + 0.5) * stage.size.w;
      const y = (-v.y * 0.5 + 0.5) * stage.size.h;
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });

  return { P, start: stage.start, stop: stage.stop };
}
