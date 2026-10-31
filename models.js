// Modèles 3D du jeu : chats, souris, meubles et pièces.
// Tout est construit à partir de formes simples, sans fichier externe,
// pour que le jeu reste léger et fonctionne hors connexion.
import * as THREE from "./vendor/three.module.min.js";

// Unités : 1 unité 3D = 100 pixels de l'ancien plateau 2D.
export const UNIT = 100;

// ---------------------------------------------------------------------------
// Matériaux
// ---------------------------------------------------------------------------

const gradientMap = (() => {
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const texture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
})();

export function toon(color, options = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, ...options });
}

const OUTLINE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x1b1430, side: THREE.BackSide });

function addOutline(mesh, scale = 1.07) {
  const outline = new THREE.Mesh(mesh.geometry, OUTLINE_MATERIAL);
  outline.scale.setScalar(scale);
  outline.userData.isOutline = true;
  mesh.add(outline);
  return mesh;
}

export function shade(hex, amount) {
  // amount > 0 éclaircit, amount < 0 assombrit.
  const color = new THREE.Color(hex);
  return amount >= 0 ? color.lerp(new THREE.Color(0xffffff), amount) : color.lerp(new THREE.Color(0x000000), -amount);
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ---------------------------------------------------------------------------
// Géométries partagées
// ---------------------------------------------------------------------------

const GEO = {
  sphere: new THREE.SphereGeometry(1, 28, 18),
  smallSphere: new THREE.SphereGeometry(1, 14, 10),
  // Sphère couchée : son axe suit la colonne vertébrale (axe Z).
  spineSphere: new THREE.SphereGeometry(1, 32, 20).rotateX(Math.PI / 2),
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 24),
  cone: new THREE.ConeGeometry(1, 1, 4),
  roundCone: new THREE.ConeGeometry(1, 1, 18),
  disc: new THREE.CylinderGeometry(1, 1, 1, 24).rotateX(Math.PI / 2),
};

function part(geometry, material, scale, position, { shadow = true, outline = 0 } = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  if (Array.isArray(scale)) mesh.scale.set(...scale);
  else mesh.scale.setScalar(scale);
  if (position) mesh.position.set(...position);
  mesh.castShadow = shadow;
  if (outline) addOutline(mesh, outline);
  return mesh;
}

// ---------------------------------------------------------------------------
// Fourrure (textures peintes)
// ---------------------------------------------------------------------------
// Sur la sphère couchée, l'axe horizontal de la texture fait le tour du corps
// (ventre à x = 25 %, dos à x = 75 %) et l'axe vertical suit la colonne.

function bodyFurTexture(fur) {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = fur.base;
    g.fillRect(0, 0, w, h);

    const spine = g.createLinearGradient(w * 0.55, 0, w * 0.95, 0);
    spine.addColorStop(0, "rgba(0,0,0,0)");
    spine.addColorStop(0.5, fur.spine);
    spine.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = spine;
    g.fillRect(0, 0, w, h);

    if (fur.stripe) {
      g.strokeStyle = fur.stripe;
      g.lineCap = "round";
      for (let y = 10; y < h; y += 19) {
        g.lineWidth = 5 + ((y * 7) % 5);
        g.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const wave = Math.sin(x * 0.07 + y) * 4 + Math.sin(x * 0.19 + y * 0.3) * 2;
          if (x === 0) g.moveTo(x, y + wave);
          else g.lineTo(x, y + wave);
        }
        g.stroke();
      }
    }

    const belly = g.createLinearGradient(w * 0.25 - fur.bellyWidth, 0, w * 0.25 + fur.bellyWidth, 0);
    belly.addColorStop(0, "rgba(0,0,0,0)");
    belly.addColorStop(0.3, fur.belly);
    belly.addColorStop(0.7, fur.belly);
    belly.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = belly;
    g.fillRect(0, 0, w, h);
  });
}

// Tête : la face regarde vers x = 25 % de la texture, le haut est en haut.
function headFurTexture(fur) {
  return canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = fur.base;
    g.fillRect(0, 0, w, h);
    const face = w * 0.25;
    if (fur.stripe) {
      g.strokeStyle = fur.stripe;
      g.lineCap = "round";
      g.lineWidth = 5;
      // Le « M » du front et des rayures sur l'arrière du crâne.
      for (const offset of [-18, -7, 7, 18]) {
        g.beginPath();
        g.moveTo(face + offset, 18);
        g.lineTo(face + offset * 0.6, 48);
        g.stroke();
      }
      for (let x = face + 50; x < face + 210; x += 16) {
        g.beginPath();
        g.moveTo(x % w, 8);
        g.lineTo((x + 6) % w, 56);
        g.stroke();
      }
      g.lineWidth = 3;
      for (const side of [-1, 1]) {
        g.beginPath();
        g.moveTo(face + side * 26, 62);
        g.lineTo(face + side * 46, 70);
        g.stroke();
      }
    }
    if (fur.blaze) {
      // Liseré blanc du chat noir et blanc : fin sur le front, large sur le museau.
      g.fillStyle = fur.belly;
      g.beginPath();
      g.moveTo(face - 3, 40);
      g.lineTo(face + 3, 40);
      g.lineTo(face + 34, h);
      g.lineTo(face - 34, h);
      g.closePath();
      g.fill();
    }
    const cheeks = g.createRadialGradient(face, h * 0.85, 4, face, h * 0.85, 46);
    cheeks.addColorStop(0, fur.cheek);
    cheeks.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = cheeks;
    g.fillRect(0, 0, w, h);
  });
}

const FURS = {
  tabby: {
    base: "#8f7150",
    spine: "#5b4532",
    stripe: "#35261b",
    belly: "#cdb38b",
    bellyWidth: 46,
    cheek: "#d8c29b",
    muzzle: "#e4d3b4",
    eye: "#c8cb4a",
    paw: "#a88a64",
    tailRings: ["#8f7150", "#35261b"],
    tailTip: "#2a1f17",
    earInner: "#e7a49a",
    nose: "#d9837a",
  },
  tuxedo: {
    base: "#18161d",
    spine: "#0d0c10",
    stripe: null,
    belly: "#f3efe6",
    bellyWidth: 58,
    cheek: "rgba(0,0,0,0)",
    blaze: true,
    muzzle: "#f3efe6",
    eye: "#e6d23f",
    paw: "#f3efe6",
    tailRings: ["#18161d", "#18161d"],
    tailTip: "#18161d",
    earInner: "#d99a9a",
    nose: "#2b2026",
  },
};

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export function createCat(kind = "tabby") {
  const fur = FURS[kind];
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);

  const bodyMaterial = toon(0xffffff, { map: bodyFurTexture(fur) });
  const headMaterial = toon(0xffffff, { map: headFurTexture(fur) });
  const baseMaterial = toon(fur.base);
  const muzzleMaterial = toon(fur.muzzle);
  const pawMaterial = toon(fur.paw);
  const pinkMaterial = toon(fur.earInner);
  const noseMaterial = toon(fur.nose);
  const eyeMaterial = toon(fur.eye, { emissive: new THREE.Color(fur.eye), emissiveIntensity: 0.25 });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x0b0a0d });
  const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Corps
  const torso = new THREE.Group();
  torso.position.set(0, 0.34, 0);
  rig.add(torso);
  torso.add(part(GEO.spineSphere, bodyMaterial, [0.19, 0.17, 0.36], [0, 0, 0], { outline: 1.06 }));
  torso.add(part(GEO.sphere, kind === "tuxedo" ? muzzleMaterial : bodyMaterial, [0.15, 0.16, 0.14], [0, -0.01, 0.23]));
  torso.add(part(GEO.sphere, baseMaterial, [0.16, 0.15, 0.15], [0, 0.03, -0.22]));

  // Tête
  const head = new THREE.Group();
  head.position.set(0, 0.17, 0.34);
  torso.add(head);
  head.add(part(GEO.sphere, headMaterial, [0.15, 0.135, 0.14], [0, 0, 0], { outline: 1.07 }));
  for (const side of [-1, 1]) {
    head.add(part(GEO.sphere, muzzleMaterial, [0.05, 0.04, 0.045], [side * 0.032, -0.05, 0.115]));
    // Yeux
    const eye = part(GEO.smallSphere, eyeMaterial, [0.032, 0.034, 0.02], [side * 0.058, 0.022, 0.118], { shadow: false });
    eye.rotation.y = side * 0.35;
    eye.add(part(GEO.smallSphere, pupilMaterial, [0.32, 0.85, 0.5], [0, 0, 0.62], { shadow: false }));
    eye.add(part(GEO.smallSphere, glintMaterial, [0.16, 0.16, 0.2], [0.3, 0.35, 0.8], { shadow: false }));
    head.add(eye);
    // Oreilles
    const ear = new THREE.Group();
    ear.position.set(side * 0.085, 0.105, -0.01);
    ear.rotation.set(-0.15, side * -0.3, side * -0.32);
    ear.add(part(GEO.cone, baseMaterial, [0.058, 0.11, 0.03], [0, 0.04, 0], { outline: 1.12 }));
    ear.add(part(GEO.cone, pinkMaterial, [0.036, 0.075, 0.012], [0, 0.03, 0.017], { shadow: false }));
    head.add(ear);
    // Moustaches
    for (const tilt of [-0.12, 0.08]) {
      const whisker = part(GEO.box, glintMaterial, [0.12, 0.003, 0.003], [side * 0.1, -0.05, 0.12], { shadow: false });
      whisker.rotation.set(0, side * -0.25, side * tilt);
      head.add(whisker);
    }
  }
  head.add(part(GEO.sphere, noseMaterial, [0.022, 0.016, 0.016], [0, -0.022, 0.148], { shadow: false }));
  head.add(part(GEO.sphere, muzzleMaterial, [0.035, 0.025, 0.03], [0, -0.085, 0.09]));

  // Pattes : avant à z > 0, arrière à z < 0
  const legs = [];
  const legLayout = [
    { x: -0.1, z: 0.22, phase: 0 },
    { x: 0.1, z: 0.22, phase: Math.PI },
    { x: -0.1, z: -0.23, phase: Math.PI },
    { x: 0.1, z: -0.23, phase: 0 },
  ];
  legLayout.forEach(({ x, z, phase }, index) => {
    const leg = new THREE.Group();
    leg.position.set(x, 0.3, z);
    const front = index < 2;
    const upperMaterial = front && kind === "tuxedo" ? muzzleMaterial : baseMaterial;
    const capsule = new THREE.CapsuleGeometry(0.045, 0.19, 4, 10);
    const upper = new THREE.Mesh(capsule, upperMaterial);
    upper.position.y = -0.13;
    upper.castShadow = true;
    addOutline(upper, 1.12);
    leg.add(upper);
    leg.add(part(GEO.sphere, pawMaterial, [0.052, 0.036, 0.068], [0, -0.265, 0.018], { outline: 1.1 }));
    leg.userData.phase = phase;
    leg.userData.front = front;
    rig.add(leg);
    legs.push(leg);
  });

  // Queue : une chaîne de segments que l'on fait onduler
  const tailSegments = [];
  let parent = new THREE.Group();
  parent.position.set(0, 0.4, -0.33);
  rig.add(parent);
  const segmentCount = 10;
  for (let index = 0; index < segmentCount; index += 1) {
    const segment = index === 0 ? parent : new THREE.Group();
    if (index > 0) {
      segment.position.z = -0.065;
      parent.add(segment);
    }
    const radius = 0.034 - index * 0.0016;
    const color = index >= segmentCount - 2 ? fur.tailTip : fur.tailRings[index % 2];
    const piece = part(GEO.smallSphere, toon(color), [radius, radius, 0.05], [0, 0, -0.03]);
    segment.add(piece);
    segment.rotation.x = index === 0 ? 0.55 : 0.12;
    tailSegments.push(segment);
    parent = segment;
  }

  root.userData = { rig, torso, head, legs, tailSegments, kind, materials: [bodyMaterial, headMaterial] };
  root.traverse((object) => {
    if (object.isMesh && !object.userData.isOutline) object.receiveShadow = false;
  });
  return root;
}

// moving : de 0 (immobile) à 1 (pleine course). swat : coup de patte de 0 à 1.
export function animateCat(cat, time, moving, { swat = 0, turn = 0 } = {}) {
  const { rig, torso, head, legs, tailSegments } = cat.userData;
  const stride = time * 13;
  legs.forEach((leg, index) => {
    const swing = Math.sin(stride + leg.userData.phase) * 0.75 * moving;
    leg.rotation.x = swing;
    leg.position.y = 0.3 + Math.max(0, Math.cos(stride + leg.userData.phase)) * 0.03 * moving;
    if (swat > 0 && index === 1) leg.rotation.x = -1.9 * swat + swing * (1 - swat);
  });
  rig.position.y = Math.abs(Math.sin(stride)) * 0.025 * moving + Math.sin(time * 2.2) * 0.004;
  torso.rotation.x = Math.sin(stride * 2) * 0.03 * moving - swat * 0.18;
  torso.rotation.z = -turn * 0.08;
  head.rotation.x = -Math.sin(stride * 2) * 0.04 * moving + Math.sin(time * 1.3) * 0.03;
  head.rotation.y = Math.sin(time * 0.7) * 0.12 * (1 - moving) + turn * 0.25;
  tailSegments.forEach((segment, index) => {
    const base = index === 0 ? 0.55 - moving * 0.35 : 0.12 + moving * 0.02;
    segment.rotation.x = base + Math.sin(time * 3 - index * 0.5) * 0.03;
    segment.rotation.y = Math.sin(time * (2.2 + moving * 3) - index * 0.55) * (0.12 + moving * 0.05);
  });
}

// ---------------------------------------------------------------------------
// Souris
// ---------------------------------------------------------------------------

export function createMouse(golden = false) {
  const root = new THREE.Group();
  const rig = new THREE.Group();
  root.add(rig);
  const furColor = golden ? 0xf3b72e : 0x9b9aa6;
  const bodyMaterial = toon(furColor, golden ? { emissive: new THREE.Color(0xffa600), emissiveIntensity: 0.32 } : {});
  const bellyMaterial = toon(golden ? 0xffe39a : 0xd9d6de, golden ? { emissive: new THREE.Color(0xffc23a), emissiveIntensity: 0.2 } : {});
  const pinkMaterial = toon(0xf0a0a4);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x0c0a10 });
  const glintMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const body = new THREE.Group();
  body.position.y = 0.085;
  rig.add(body);
  body.add(part(GEO.spineSphere, bodyMaterial, [0.085, 0.075, 0.12], [0, 0, 0], { outline: 1.08 }));
  body.add(part(GEO.sphere, bellyMaterial, [0.068, 0.05, 0.09], [0, -0.025, 0.012]));

  const head = new THREE.Group();
  head.position.set(0, 0.03, 0.115);
  body.add(head);
  head.add(part(GEO.sphere, bodyMaterial, [0.064, 0.058, 0.07], [0, 0, 0], { outline: 1.08 }));
  head.add(part(GEO.sphere, bodyMaterial, [0.036, 0.032, 0.055], [0, -0.012, 0.06]));
  head.add(part(GEO.smallSphere, pinkMaterial, [0.013, 0.012, 0.012], [0, -0.008, 0.112], { shadow: false }));
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.048, 0.055, -0.01);
    ear.rotation.set(-0.15, side * 0.35, side * -0.25);
    ear.add(part(GEO.disc, bodyMaterial, [0.046, 0.046, 0.012], [0, 0, 0], { outline: 1.1 }));
    ear.add(part(GEO.disc, pinkMaterial, [0.032, 0.032, 0.008], [0, 0, 0.006], { shadow: false }));
    head.add(ear);
    head.add(part(GEO.smallSphere, eyeMaterial, [0.013, 0.015, 0.012], [side * 0.032, 0.014, 0.05], { shadow: false }));
    head.add(part(GEO.smallSphere, glintMaterial, [0.004, 0.004, 0.004], [side * 0.032 + 0.004, 0.019, 0.061], { shadow: false }));
  }

  const feet = [];
  [
    [-0.05, 0.07, 0],
    [0.05, 0.07, Math.PI],
    [-0.05, -0.06, Math.PI],
    [0.05, -0.06, 0],
  ].forEach(([x, z, phase]) => {
    const foot = part(GEO.smallSphere, pinkMaterial, [0.02, 0.012, 0.03], [x, 0.012, z], { shadow: false });
    foot.userData.phase = phase;
    foot.userData.baseZ = z;
    rig.add(foot);
    feet.push(foot);
  });

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.07, -0.11),
    new THREE.Vector3(0.02, 0.05, -0.2),
    new THREE.Vector3(-0.03, 0.03, -0.3),
    new THREE.Vector3(0.03, 0.025, -0.4),
    new THREE.Vector3(0.0, 0.04, -0.48),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 24, 0.009, 6, false), pinkMaterial);
  tail.castShadow = true;
  const tailPivot = new THREE.Group();
  tailPivot.add(tail);
  rig.add(tailPivot);

  root.scale.setScalar(1.35);
  root.userData = { rig, body, head, feet, tailPivot, golden, bodyMaterial };
  return root;
}

export function animateMouse(mouse, time, speed = 1) {
  const { rig, body, head, feet, tailPivot } = mouse.userData;
  const stride = time * 24 * speed;
  rig.position.y = Math.abs(Math.sin(stride)) * 0.012;
  body.rotation.x = Math.sin(stride * 2) * 0.05;
  head.rotation.y = Math.sin(time * 5) * 0.15;
  feet.forEach((foot) => {
    foot.position.z = foot.userData.baseZ + Math.sin(stride + foot.userData.phase) * 0.025;
  });
  tailPivot.rotation.y = Math.sin(time * 9) * 0.25;
}

// ---------------------------------------------------------------------------
// Meubles
// ---------------------------------------------------------------------------
// Chaque meuble est construit dans un repère local : largeur sur X, profondeur
// sur Z, dos du meuble vers -Z (contre le mur le plus proche).

function nearestWallRotation(obstacle, world) {
  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  const distances = [
    { rotation: 0, value: obstacle.y },
    { rotation: Math.PI, value: world.height - (obstacle.y + obstacle.height) },
    { rotation: Math.PI / 2, value: obstacle.x },
    { rotation: -Math.PI / 2, value: world.width - (obstacle.x + obstacle.width) },
  ];
  // Les meubles au milieu de la pièce gardent l'orientation par défaut.
  const nearest = distances.sort((a, b) => a.value - b.value)[0];
  if (nearest.value > 140) return { rotation: centerY > world.height / 2 ? Math.PI : 0, free: true, centerX };
  return { rotation: nearest.rotation, free: false, centerX };
}

function addBox(group, material, width, height, depth, x, y, z, { shadow = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(GEO.box, material);
  mesh.scale.set(width, height, depth);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = receive;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, material, radiusTop, radiusBottom, height, x, y, z, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addLegs(group, material, width, depth, height, inset = 0.08, radius = 0.035) {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(group, material, radius, radius * 0.8, height, sx * (width / 2 - inset), height / 2, sz * (depth / 2 - inset), 10);
    }
  }
}

function seat(group, color, width, depth, cushions) {
  const main = toon(color);
  const light = toon(shade(color, 0.18));
  const dark = toon(shade(color, -0.25));
  const legMaterial = toon(0x3b2a33);
  const arm = Math.min(0.2, width * 0.14);
  addLegs(group, legMaterial, width - 0.05, depth - 0.05, 0.1, 0.06, 0.03);
  addBox(group, main, width, 0.3, depth, 0, 0.25, 0);
  addBox(group, main, width, 0.52, depth * 0.24, 0, 0.62, -depth / 2 + depth * 0.12);
  addBox(group, dark, arm, 0.32, depth, -width / 2 + arm / 2, 0.55, 0);
  addBox(group, dark, arm, 0.32, depth, width / 2 - arm / 2, 0.55, 0);
  const inner = width - arm * 2;
  const cushionWidth = inner / cushions;
  for (let index = 0; index < cushions; index += 1) {
    const x = -inner / 2 + cushionWidth * (index + 0.5);
    addBox(group, light, cushionWidth - 0.03, 0.12, depth * 0.7, x, 0.46, depth * 0.1);
    addBox(group, light, cushionWidth - 0.05, 0.36, 0.12, x, 0.7, -depth / 2 + depth * 0.27);
  }
}

function table(group, color, width, depth, height, legColor = 0x5a3c33) {
  addBox(group, toon(color), width, 0.07, depth, 0, height, 0);
  addLegs(group, toon(legColor), width, depth, height - 0.03);
}

function cabinet(group, color, width, depth, height, { top = null, doors = 2, drawers = 0 } = {}) {
  const body = toon(color);
  const detail = toon(shade(color, -0.22));
  const handle = toon(0xfff3d6);
  addBox(group, body, width, height, depth, 0, height / 2, 0);
  if (top) addBox(group, toon(top), width + 0.06, 0.06, depth + 0.06, 0, height + 0.03, 0);
  const frontZ = depth / 2 + 0.006;
  if (drawers) {
    const drawerHeight = (height - 0.1) / drawers;
    for (let index = 0; index < drawers; index += 1) {
      const y = 0.08 + drawerHeight * (index + 0.5);
      addBox(group, detail, width - 0.12, drawerHeight - 0.05, 0.012, 0, y, frontZ, { shadow: false });
      addBox(group, handle, 0.14, 0.025, 0.03, 0, y, frontZ + 0.012, { shadow: false });
    }
  } else if (doors) {
    const doorWidth = (width - 0.08) / doors;
    for (let index = 0; index < doors; index += 1) {
      const x = -width / 2 + 0.04 + doorWidth * (index + 0.5);
      addBox(group, detail, doorWidth - 0.04, height - 0.14, 0.012, x, height / 2, frontZ, { shadow: false });
      const handleX = x + (index % 2 === 0 ? doorWidth / 2 - 0.08 : -doorWidth / 2 + 0.08);
      addBox(group, handle, 0.025, Math.min(0.22, height * 0.2), 0.03, handleX, height * 0.55, frontZ + 0.012, { shadow: false });
    }
  }
}

function screenTexture(accent) {
  return canvasTexture(256, 160, (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#2b1d73");
    gradient.addColorStop(0.55, accent);
    gradient.addColorStop(1, "#44e5e7");
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.85)";
    g.font = "bold 46px sans-serif";
    g.textAlign = "center";
    g.fillText("🐭", w / 2, h / 2 + 16);
  });
}

const FURNITURE_BUILDERS = {
  sofa: (group, ob, w, d) => seat(group, ob.color, w, d, 3),
  armchair: (group, ob, w, d) => seat(group, ob.color, w, d, 1),
  coffee: (group, ob, w, d) => {
    table(group, ob.color, w, d, 0.42);
    addBox(group, toon(0xff5da8), 0.28, 0.03, 0.2, -w * 0.2, 0.47, 0, { shadow: false });
    addCylinder(group, toon(0xffffff), 0.05, 0.045, 0.1, w * 0.22, 0.5, 0.05, 14);
  },
  tv: (group, ob, w, d, level) => {
    cabinet(group, ob.color, w, d, 0.45, { doors: 3 });
    const screenWidth = w * 0.86;
    addBox(group, toon(0x14122a), screenWidth, 0.6, 0.06, 0, 0.82, -d * 0.15);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(screenWidth - 0.06, 0.52),
      new THREE.MeshBasicMaterial({ map: screenTexture(level.accent) }),
    );
    screen.position.set(0, 0.82, -d * 0.15 + 0.032);
    group.add(screen);
  },
  plant: (group, ob, w, d) => {
    const radius = Math.min(w, d) * 0.36;
    addCylinder(group, toon(0xff8a5b), radius, radius * 0.75, 0.46, 0, 0.23, 0);
    addCylinder(group, toon(0x5b3a2b), radius * 0.92, radius * 0.92, 0.03, 0, 0.45, 0);
    const leaf = toon(ob.color);
    const darkLeaf = toon(shade(ob.color, -0.25));
    for (let index = 0; index < 9; index += 1) {
      const angle = (index / 9) * Math.PI * 2;
      const tilt = 0.35 + (index % 3) * 0.18;
      const mesh = new THREE.Mesh(GEO.sphere, index % 2 ? leaf : darkLeaf);
      mesh.scale.set(0.09, 0.42, 0.05);
      mesh.position.set(Math.cos(angle) * 0.14, 0.82 + (index % 3) * 0.08, Math.sin(angle) * 0.14);
      mesh.rotation.set(Math.sin(angle) * tilt, 0, -Math.cos(angle) * tilt);
      mesh.castShadow = true;
      group.add(mesh);
    }
  },
  counter: (group, ob, w, d) => {
    cabinet(group, ob.color, w, d, 0.9, { top: 0xfff4dc, doors: 3 });
    addCylinder(group, toon(0xd8d8e2), 0.015, 0.015, 0.25, w * 0.15, 1.05, -d * 0.3, 8);
  },
  island: (group, ob, w, d) => {
    cabinet(group, ob.color, w - 0.2, d - 0.3, 0.88, { top: 0xff6f61, doors: 4 });
    for (const x of [-w * 0.3, 0, w * 0.3]) {
      addCylinder(group, toon(0xffd34e), 0.13, 0.13, 0.06, x, 0.62, d / 2 - 0.05, 18);
      addCylinder(group, toon(0x3b2a33), 0.025, 0.025, 0.6, x, 0.3, d / 2 - 0.05, 8);
    }
    for (const [x, color] of [[-0.85, 0xff5da8], [0.9, 0x44e5e7]]) {
      addCylinder(group, toon(0xfff9ec), 0.17, 0.15, 0.03, x, 0.93, 0, 20);
      addCylinder(group, toon(color), 0.11, 0.11, 0.035, x, 0.935, 0, 20);
    }
  },
  fridge: (group, ob, w, d) => {
    const body = toon(ob.color);
    addBox(group, body, w, 1.95, d, 0, 0.975, 0);
    addBox(group, toon(shade(ob.color, -0.3)), w - 0.02, 0.02, 0.012, 0, 1.3, d / 2 + 0.006, { shadow: false });
    addBox(group, toon(0xfff3d6), 0.04, 0.4, 0.04, -w / 2 + 0.12, 1.55, d / 2 + 0.03);
    addBox(group, toon(0xfff3d6), 0.04, 0.5, 0.04, -w / 2 + 0.12, 0.85, d / 2 + 0.03);
    addBox(group, toon(0xffd34e), 0.12, 0.12, 0.012, 0.15, 1.6, d / 2 + 0.008, { shadow: false });
    addBox(group, toon(0xff5da8), 0.1, 0.14, 0.012, 0.3, 1.45, d / 2 + 0.008, { shadow: false });
  },
  dining: (group, ob, w, d) => {
    const tableWidth = w - 0.6;
    table(group, ob.color, tableWidth, d * 0.8, 0.72);
    const chair = toon(shade(ob.color, -0.15));
    for (const side of [-1, 1]) {
      const x = side * (tableWidth / 2 + 0.17);
      addBox(group, chair, 0.3, 0.05, 0.32, x, 0.42, 0);
      addBox(group, chair, 0.05, 0.45, 0.32, x + side * 0.13, 0.66, 0);
      addLegs({ add: (mesh) => { mesh.position.x += x; group.add(mesh); } }, toon(0x3b2a33), 0.28, 0.3, 0.42, 0.03, 0.018);
    }
    addCylinder(group, toon(0x44e5e7), 0.06, 0.04, 0.16, 0, 0.84, 0, 12);
  },
  pantry: (group, ob, w, d) => cabinet(group, ob.color, w, d, 1.45, { top: 0xfff4dc, doors: 2 }),
  bed: (group, ob, w, d) => {
    const frame = toon(0x6a4a8a);
    addBox(group, frame, w, 0.3, d, 0, 0.15, 0);
    addBox(group, toon(0xfff6ee), w - 0.08, 0.16, d - 0.08, 0, 0.38, 0);
    addBox(group, toon(ob.color), w - 0.04, 0.12, d * 0.64, 0, 0.48, d * 0.17);
    addBox(group, toon(shade(ob.color, 0.35)), w - 0.04, 0.05, 0.16, 0, 0.56, d * 0.17 - d * 0.32 + 0.08);
    addBox(group, frame, w + 0.04, 1.05, 0.1, 0, 0.52, -d / 2 + 0.05);
    for (const side of [-1, 1]) {
      const pillow = new THREE.Mesh(GEO.sphere, toon(0xffffff));
      pillow.scale.set(w * 0.2, 0.07, 0.17);
      pillow.position.set(side * w * 0.23, 0.52, -d / 2 + 0.3);
      pillow.castShadow = true;
      group.add(pillow);
    }
  },
  nightstand: (group, ob, w, d) => {
    cabinet(group, ob.color, w, d, 0.5, { drawers: 2 });
    addCylinder(group, toon(0xfff3d6), 0.08, 0.1, 0.05, 0, 0.53, 0, 14);
    addCylinder(group, toon(0xfff3d6), 0.015, 0.015, 0.25, 0, 0.67, 0, 8);
    const shadeMesh = addCylinder(group, toon(0xff5da8, { emissive: new THREE.Color(0xff8cc6), emissiveIntensity: 0.5 }), 0.07, 0.14, 0.16, 0, 0.84, 0, 16);
    shadeMesh.castShadow = false;
  },
  dresser: (group, ob, w, d) => {
    cabinet(group, ob.color, w, d, 0.85, { drawers: 3, top: shade(ob.color, 0.3) });
    addBox(group, toon(0xbfeff5, { emissive: new THREE.Color(0x9fe6f0), emissiveIntensity: 0.2 }), w * 0.55, 0.55, 0.04, 0, 1.25, -d / 2 + 0.04);
    addCylinder(group, toon(0x44e5e7), 0.05, 0.05, 0.16, w * 0.32, 0.96, 0, 12);
  },
  ottoman: (group, ob, w, d) => {
    const main = toon(ob.color);
    addBox(group, main, w, 0.34, d, 0, 0.21, 0);
    addBox(group, toon(shade(ob.color, 0.2)), w - 0.06, 0.08, d - 0.06, 0, 0.42, 0);
    addLegs(group, toon(0x3b2a33), w, d, 0.05, 0.08, 0.03);
    const button = toon(shade(ob.color, -0.3));
    for (let ix = -1; ix <= 1; ix += 1) {
      for (const iz of [-1, 1]) {
        addBox(group, button, 0.04, 0.02, 0.04, ix * w * 0.28, 0.465, iz * d * 0.2, { shadow: false });
      }
    }
  },
  wardrobe: (group, ob, w, d) => {
    cabinet(group, ob.color, w, d, 1.95, { doors: 2, top: shade(ob.color, -0.2) });
    addBox(group, toon(0xffd34e), 0.35, 0.25, 0.3, -w * 0.15, 2.1, 0);
  },
};

export function buildFurniture(obstacle, level, world) {
  const group = new THREE.Group();
  const orientation = nearestWallRotation(obstacle, world);
  const sideways = Math.abs(Math.abs(orientation.rotation) - Math.PI / 2) < 0.01;
  const width = (sideways ? obstacle.height : obstacle.width) / UNIT;
  const depth = (sideways ? obstacle.width : obstacle.height) / UNIT;
  const inner = new THREE.Group();
  inner.rotation.y = orientation.rotation;
  group.add(inner);
  const build = FURNITURE_BUILDERS[obstacle.type] ?? ((g, ob, w, d) => cabinet(g, ob.color, w, d, 0.6));
  build(inner, obstacle, width, depth, level);

  group.position.set(
    (obstacle.x + obstacle.width / 2 - world.width / 2) / UNIT,
    0,
    (obstacle.y + obstacle.height / 2 - world.height / 2) / UNIT,
  );

  // Matériaux propres à chaque meuble pour pouvoir le rendre transparent
  // quand il se trouve entre la caméra et le chat.
  const materials = [];
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.material = object.material.clone();
    materials.push(object.material);
  });
  const box = new THREE.Box3().setFromObject(group);
  group.userData = { materials, height: box.max.y, opacity: 1, obstacle };
  return group;
}

// ---------------------------------------------------------------------------
// Pièce : sol, murs, tapis et décor
// ---------------------------------------------------------------------------

function floorTexture(level) {
  return canvasTexture(1024, 800, (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, level.floor[0]);
    gradient.addColorStop(1, level.floor[1]);
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,.16)";
    g.lineWidth = 3;
    if (level.id === "salon") {
      // Parquet en chevrons simplifié : lames décalées
      const plank = 52;
      for (let y = 0; y < h; y += plank) {
        const offset = (y / plank) % 2 ? 90 : 0;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
        for (let x = -offset; x < w; x += 180) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x, y + plank);
          g.stroke();
        }
      }
    } else if (level.id === "cuisine") {
      const tile = 80;
      for (let x = 0; x < w; x += tile) {
        for (let y = 0; y < h; y += tile) {
          g.fillStyle = ((x + y) / tile) % 2 === 0 ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.04)";
          g.fillRect(x, y, tile, tile);
        }
      }
    } else {
      for (let y = 0; y < h; y += 38) {
        g.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const wave = Math.sin(x * 0.02 + y) * 6;
          if (x === 0) g.moveTo(x, y + wave);
          else g.lineTo(x, y + wave);
        }
        g.stroke();
      }
    }
  });
}

function rugTexture(color) {
  return canvasTexture(512, 360, (g, w, h) => {
    const radius = 64;
    const rounded = (inset, r) => {
      g.beginPath();
      g.roundRect(inset, inset, w - inset * 2, h - inset * 2, r);
    };
    rounded(0, radius);
    g.fillStyle = color;
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.22)";
    g.lineWidth = 7;
    for (let inset = 24; inset < 110; inset += 24) {
      rounded(inset, Math.max(10, radius - inset * 0.6));
      g.stroke();
    }
  });
}

function pictureTexture(colorOne, colorTwo) {
  return canvasTexture(256, 160, (g, w, h) => {
    g.fillStyle = "#fff5e5";
    g.fillRect(0, 0, w, h);
    const gradient = g.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, colorOne);
    gradient.addColorStop(1, colorTwo);
    g.fillStyle = gradient;
    g.fillRect(16, 16, w - 32, h - 32);
    g.fillStyle = "rgba(255,255,255,.55)";
    g.beginPath();
    g.arc(w * 0.68, h * 0.42, 22, 0, Math.PI * 2);
    g.fill();
  });
}

function windowTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#7fd7ff");
    sky.addColorStop(1, "#ffe6b8");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.9)";
    for (const [x, y, r] of [[70, 80, 26], [100, 72, 32], [135, 84, 24], [190, 150, 20], [215, 145, 26]]) {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#fff8ec";
    g.fillRect(w / 2 - 6, 0, 12, h);
    g.fillRect(0, h / 2 - 6, w, 12);
  });
}

export const ROOM_HEIGHT = 2.2;

export function buildRoom(level, world) {
  const group = new THREE.Group();
  const roomWidth = world.width / UNIT;
  const roomDepth = world.height / UNIT;
  const wallInset = 0.24;
  const innerWidth = roomWidth - wallInset * 2;
  const innerDepth = roomDepth - wallInset * 2;

  // Sol
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomDepth),
    new THREE.MeshToonMaterial({ map: floorTexture(level), gradientMap }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Tapis
  const rug = level.rug;
  const rugMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(rug.width / UNIT, rug.height / UNIT),
    new THREE.MeshToonMaterial({ map: rugTexture(rug.color), gradientMap, transparent: true, alphaTest: 0.5 }),
  );
  rugMesh.rotation.x = -Math.PI / 2;
  rugMesh.position.set(
    (rug.x + rug.width / 2 - world.width / 2) / UNIT,
    0.006,
    (rug.y + rug.height / 2 - world.height / 2) / UNIT,
  );
  rugMesh.receiveShadow = true;
  group.add(rugMesh);

  // Murs (épais, pour bien recevoir la lumière)
  const wallMaterial = toon(level.wall);
  const baseboardMaterial = toon(level.accent);
  const trimMaterial = toon(shade(level.wall, -0.12));
  // Chaque mur a ses propres matériaux : il devient transparent quand la
  // caméra passe derrière lui.
  const walls = [
    { side: "north", x: 0, z: -roomDepth / 2 + wallInset / 2, width: roomWidth, rotation: 0 },
    { side: "south", x: 0, z: roomDepth / 2 - wallInset / 2, width: roomWidth, rotation: Math.PI },
    { side: "west", x: -roomWidth / 2 + wallInset / 2, z: 0, width: roomDepth, rotation: Math.PI / 2 },
    { side: "east", x: roomWidth / 2 - wallInset / 2, z: 0, width: roomDepth, rotation: -Math.PI / 2 },
  ];
  const wallsBySide = {};
  walls.forEach((wall) => {
    const holder = new THREE.Group();
    holder.position.set(wall.x, 0, wall.z);
    holder.rotation.y = wall.rotation;
    addBox(holder, wallMaterial.clone(), wall.width, ROOM_HEIGHT, wallInset, 0, ROOM_HEIGHT / 2, 0, { shadow: false });
    addBox(holder, baseboardMaterial.clone(), wall.width - wallInset * 2, 0.12, 0.04, 0, 0.06, wallInset / 2 + 0.02, { shadow: false });
    addBox(holder, trimMaterial.clone(), wall.width, 0.06, wallInset + 0.06, 0, ROOM_HEIGHT, 0, { shadow: false });
    group.add(holder);
    wallsBySide[wall.side] = { side: wall.side, holder, opacity: 1 };
  });

  // Décor mural : tableaux, fenêtre et porte
  const north = -innerDepth / 2 + 0.005;
  const sideForRotation = (rotation) =>
    ({ 0: "north", [String(Math.PI / 2)]: "west", [String(-Math.PI / 2)]: "east" })[String(rotation)] ?? "south";
  const addWallPlane = (texture, width, height, x, y, z, rotation = 0, basic = false) => {
    const material = basic
      ? new THREE.MeshBasicMaterial({ map: texture })
      : new THREE.MeshToonMaterial({ map: texture, gradientMap });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    // Rattaché au mur pour disparaître avec lui.
    wallsBySide[sideForRotation(rotation)].holder.attach(mesh);
    return mesh;
  };
  const toX = (px) => (px - world.width / 2) / UNIT;
  if (level.id === "salon") {
    addWallPlane(pictureTexture("#ffd34e", "#ff5da8"), 1.0, 0.6, toX(550), 1.45, north);
    addWallPlane(windowTexture(), 1.1, 1.0, -innerWidth / 2 + 0.005, 1.35, 0.6, Math.PI / 2, true);
  } else if (level.id === "cuisine") {
    addWallPlane(windowTexture(), 1.2, 0.9, toX(520), 1.45, north, 0, true);
    addWallPlane(pictureTexture("#44e5e7", "#9d6cff"), 0.7, 0.5, innerWidth / 2 - 0.005, 1.45, 0.5, -Math.PI / 2);
  } else {
    addWallPlane(pictureTexture("#44e5e7", "#ffd34e"), 0.8, 0.55, toX(584), 1.5, north);
    addWallPlane(windowTexture(), 1.1, 1.0, innerWidth / 2 - 0.005, 1.35, -0.6, -Math.PI / 2, true);
  }
  // Porte sur le mur du fond (côté sud)
  const door = new THREE.Group();
  door.position.set(innerWidth / 2 - 1.3, 0, innerDepth / 2 - 0.01);
  door.rotation.y = Math.PI;
  addBox(door, toon(shade(level.accent, -0.15)), 0.9, 1.8, 0.04, 0, 0.9, 0, { shadow: false });
  addBox(door, toon(0xfff3d6), 0.06, 0.06, 0.06, 0.33, 0.95, 0.03, { shadow: false });
  group.add(door);
  wallsBySide.south.holder.attach(door);

  // Petit jouet qui roule (décor)
  const toyColors = { salon: [0xffd34e, 0xff5da8], cuisine: [0x44e5e7, 0x9d6cff], chambre: [0xff5da8, 0xffd34e] }[level.id];
  const toyPosition = { salon: [586, 575], cuisine: [615, 610], chambre: [590, 595] }[level.id];
  const toy = new THREE.Group();
  const ball = new THREE.Mesh(GEO.sphere, toon(toyColors[0]));
  ball.scale.setScalar(0.12);
  ball.castShadow = true;
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 24), toon(toyColors[1]));
  toy.add(ball, band);
  toy.position.set(toX(toyPosition[0]), 0.12, (toyPosition[1] - world.height / 2) / UNIT);
  group.add(toy);
  group.userData.toy = toy;

  Object.values(wallsBySide).forEach((wall) => {
    wall.materials = [];
    wall.holder.traverse((object) => {
      if (object.isMesh) wall.materials.push(object.material);
    });
  });
  group.userData.walls = Object.values(wallsBySide);
  group.userData.bounds = { halfWidth: innerWidth / 2, halfDepth: innerDepth / 2 };
  return group;
}
