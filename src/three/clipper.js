import { BoxGeometry, CylinderGeometry, DirectionalLight, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStage } from './stage.js';

/**
 * Máquina de corte en despiece. Modelo propio hecho con primitivas:
 * `P.explode` separa las piezas y las etiquetas HTML siguen a su ancla 3D.
 */
export function createClipper(canvas, labelEls) {
  const stage = createStage(canvas);
  const { scene, camera } = stage;
  const P = { explode: 0, rot: -0.55, zoom: 1, x: 0 };

  const key = new DirectionalLight('#fff3e0', 2.6);
  key.position.set(5, 7, 9);
  const rim = new DirectionalLight('#cfe0ff', 1.4);
  rim.position.set(-6, 2, -5);
  scene.add(key, rim);

  const M = (color, roughness, metalness) => new MeshStandardMaterial({ color, roughness, metalness });
  const black = M('#141312', 0.38, 0.35);
  const gold = M('#c9a24a', 0.25, 1);
  const steel = M('#d9dce0', 0.2, 1);
  const dark = M('#2b2a29', 0.5, 0.7);
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
      const t = new Mesh(new BoxGeometry(step * 0.55, h, d), mat);
      t.position.set(-width / 2 + step * (i + 0.5), 0, 0);
      g.add(t);
    }
    return g;
  };

  // Cuchilla fija
  const fixed = new Group();
  fixed.add(new Mesh(new BoxGeometry(1.2, 0.42, 0.1), steel));
  const ft = teeth(1.2, 18, 0.26, 0.1, steel);
  ft.position.y = 0.33;
  fixed.add(ft);
  add('fija', fixed, [0, 2.2, -0.12], [0, 1.9, 0], [0.62, 0.1, 0]);

  // Cuchilla móvil
  const moving = new Group();
  moving.add(new Mesh(new BoxGeometry(1.02, 0.3, 0.07), gold));
  const mt = teeth(1.02, 22, 0.2, 0.07, gold);
  mt.position.y = 0.24;
  moving.add(mt);
  add('movil', moving, [0, 2.2, 0], [0, 1.3, 0], [0.53, 0.05, 0]);

  // Cabezal
  const head = new Mesh(new RoundedBoxGeometry(1.14, 0.5, 0.86, 4, 0.1), dark);
  add('cabezal', head, [0, 1.72, 0], [0, 0.75, 0], [0.58, 0, 0]);

  // Motor
  const motor = new Group();
  const can = new Mesh(new CylinderGeometry(0.31, 0.31, 0.8, 40), steel);
  const coil = new Mesh(new CylinderGeometry(0.325, 0.325, 0.42, 40), copper);
  const shaft = new Mesh(new CylinderGeometry(0.06, 0.06, 0.35, 16), steel);
  shaft.position.y = 0.55;
  motor.add(can, coil, shaft);
  add('motor', motor, [0, 0.85, 0], [0, 0.25, 0], [0.34, 0, 0]);

  // Placa
  add('placa', new Mesh(new BoxGeometry(0.62, 0.8, 0.05), board), [0, -0.05, -0.1], [0, -0.2, 0]);

  // Batería
  const battery = new Group();
  battery.add(new Mesh(new CylinderGeometry(0.28, 0.28, 1.15, 40), cell));
  const pole = new Mesh(new CylinderGeometry(0.285, 0.285, 0.08, 40), steel);
  pole.position.y = 0.58;
  const pole2 = pole.clone();
  pole2.position.y = -0.58;
  battery.add(pole, pole2);
  add('bateria', battery, [0, -0.95, 0.02], [0, -0.75, 0], [0.3, 0, 0]);

  // Base de carga
  add('base', new Mesh(new CylinderGeometry(0.36, 0.3, 0.2, 40), gold), [0, -1.72, 0], [0, -1.35, 0]);

  // Carcasa (dos mitades)
  const shell = (z) => {
    const g = new Group();
    g.add(new Mesh(new RoundedBoxGeometry(1.08, 3.3, 0.44, 6, 0.2), black));
    const band = new Mesh(new BoxGeometry(1.1, 0.07, 0.46), gold);
    band.position.y = 0.95;
    g.add(band);
    if (z > 0) {
      const lever = new Mesh(new RoundedBoxGeometry(0.16, 0.6, 0.2, 3, 0.06), gold);
      lever.position.set(0.58, 1.05, -0.05);
      const sw = new Mesh(new RoundedBoxGeometry(0.34, 0.6, 0.06, 3, 0.03), dark);
      sw.position.set(0, 0.2, 0.22);
      g.add(lever, sw);
    }
    return g;
  };
  add('carcasa', shell(1), [0, 0, 0.22], [1.05, 0, 0.9], [0.5, -0.9, 0.2]);
  add('trasera', shell(-1), [0, 0, -0.22], [-1.05, 0, -0.9]);

  const labels = labelEls
    .map((el) => ({ el, anchor: anchors[el.dataset.part] }))
    .filter((l) => l.anchor);

  let baseZ = 14;
  let portrait = false;
  stage.setResize(({ aspect }) => {
    portrait = aspect < 0.9;
    baseZ = 4.4 / ((portrait ? 0.4 : 0.7) * stage.viewHeight(1));
  });

  const v = new Vector3();
  stage.setFrame((dt, t) => {
    const z = baseZ * P.zoom;
    camera.position.set(0, 0.25, z);
    camera.lookAt(0, 0.25, 0);
    const viewW = stage.viewHeight(z) * stage.size.aspect;
    group.position.x = portrait ? -viewW * 0.12 * P.explode : viewW * 0.08 * P.x;
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
