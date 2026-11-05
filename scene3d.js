// Rendu 3D du jeu : scène, caméra derrière le chat, effets et radar.
// La logique du jeu (game.js) reste en 2D ; ce module la traduit en 3D
// à chaque image : x du plateau → X, y du plateau → Z.
import * as THREE from "./vendor/three.module.min.js";
import {
  UNIT,
  ROOM_HEIGHT,
  animateCat,
  animateMouse,
  buildFurniture,
  buildRoom,
  createCat,
  createMouse,
} from "./models.js?v=3d1";

const PARTICLE_LIMIT = 320;

export function createWorld({ canvas, radarCanvas, labelLayer, world }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 9 / 7, 0.05, 40);

  // Lumières
  const hemisphere = new THREE.HemisphereLight(0xfff6e8, 0x7b6bd6, 1.7);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-3.5, 6.5, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5.5;
  sun.shadow.camera.right = 5.5;
  sun.shadow.camera.top = 4.5;
  sun.shadow.camera.bottom = -4.5;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 16;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc9d8ff, 0.6);
  fill.position.set(4, 3, -3);
  scene.add(fill);

  // Personnages
  const hero = createCat("tabby");
  scene.add(hero);
  const villain = createCat("tuxedo");
  villain.scale.setScalar(1.12);
  villain.visible = false;
  scene.add(villain);
  const goldMesh = createMouse(true);
  goldMesh.visible = false;
  scene.add(goldMesh);
  const goldLight = new THREE.PointLight(0xffc53d, 0, 2.6, 1.6);
  scene.add(goldLight);
  const trapGold = createMouse(true);
  trapGold.visible = false;
  scene.add(trapGold);
  const mouseMeshes = new Map();
  const spareMice = [];

  // Halo doré : étincelles en orbite et colonne de lumière visible de loin
  const sparkleGroup = new THREE.Group();
  const sparkleMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true });
  const sparkleGeometry = new THREE.OctahedronGeometry(0.035);
  for (let index = 0; index < 7; index += 1) sparkleGroup.add(new THREE.Mesh(sparkleGeometry, sparkleMaterial));
  sparkleGroup.visible = false;
  scene.add(sparkleGroup);
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.3, 2.4, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd34e,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beacon.visible = false;
  scene.add(beacon);

  // Coup de patte : trois arcs lumineux
  const swipeGroup = new THREE.Group();
  const swipeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false });
  for (let index = 0; index < 3; index += 1) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.42 + index * 0.11, 0.02, 6, 32, 1.7), swipeMaterial);
    arc.rotation.x = -Math.PI / 2;
    arc.rotation.z = -1.05;
    swipeGroup.add(arc);
  }
  swipeGroup.visible = false;
  scene.add(swipeGroup);

  // Particules (confettis 3D)
  const particleMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    PARTICLE_LIMIT,
  );
  particleMesh.frustumCulled = false;
  particleMesh.count = 0;
  scene.add(particleMesh);
  const particleMatrix = new THREE.Matrix4();
  const particleQuaternion = new THREE.Quaternion();
  const particleEuler = new THREE.Euler();
  const particleColor = new THREE.Color();
  const particlePosition = new THREE.Vector3();
  const particleScale = new THREE.Vector3();

  // Pièce courante
  let room = null;
  let furniture = [];
  let currentLevelId = null;
  let bounds = { halfWidth: 4, halfDepth: 3 };

  // Caméra
  const cameraState = {
    yaw: 0,
    position: new THREE.Vector3(0, 6, 6),
    target: new THREE.Vector3(),
    initialized: false,
  };

  // Textes flottants (+10, TROUVÉE !…)
  const labelPool = new Map();
  const projected = new THREE.Vector3();
  let viewWidth = 1;
  let viewHeight = 1;

  // Radar
  const radar = radarCanvas.getContext("2d");
  let radarSize = 0;
  let radarRatio = 1;

  function to3(x, y, height = 0, target = new THREE.Vector3()) {
    return target.set((x - world.width / 2) / UNIT, height, (y - world.height / 2) / UNIT);
  }

  // Angle 2D (atan2(vy, vx)) → rotation Y d'un modèle qui regarde vers +Z.
  function yawFromAngle(angle) {
    return Math.PI / 2 - angle;
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose?.();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        material.map?.dispose?.();
        material.dispose?.();
      });
    });
  }

  function setLevel(level) {
    if (currentLevelId === level.id) return;
    currentLevelId = level.id;
    if (room) {
      scene.remove(room);
      disposeObject(room);
    }
    furniture.forEach((item) => {
      scene.remove(item);
      disposeObject(item);
    });
    room = buildRoom(level, world);
    scene.add(room);
    bounds = room.userData.bounds;
    furniture = level.obstacles.map((obstacle) => {
      const item = buildFurniture(obstacle, level, world);
      scene.add(item);
      return item;
    });
    const background = new THREE.Color(level.floor[1]).lerp(new THREE.Color(0x120f33), 0.82);
    scene.background = background;
    scene.fog = new THREE.Fog(background, 9, 18);
    hemisphere.groundColor.set(level.floor[0]).lerp(new THREE.Color(0x6a5acd), 0.4);
    cameraState.initialized = false;
  }

  // Qualité adaptative : si l'appareil peine, on baisse la résolution
  // puis on coupe les ombres, pour garder une partie fluide.
  const quality = { level: 0, maxRatio: [1.75, 1.25, 1, 0.8], frames: 0, slow: 0, deviceRatio: 1 };

  function adaptQuality(delta) {
    if (quality.level >= quality.maxRatio.length - 1) return;
    quality.frames += 1;
    if (delta > 1 / 40) quality.slow += 1;
    if (quality.frames < 90) return;
    if (quality.slow > 45) {
      quality.level += 1;
      renderer.setPixelRatio(Math.min(quality.deviceRatio, quality.maxRatio[quality.level]));
      renderer.setSize(viewWidth, viewHeight, false);
      if (quality.level >= 2) {
        renderer.shadowMap.enabled = false;
        scene.traverse((object) => {
          if (object.material && !Array.isArray(object.material)) object.material.needsUpdate = true;
        });
      }
    }
    quality.frames = 0;
    quality.slow = 0;
  }

  function resize(width, height, pixelRatio) {
    viewWidth = Math.max(1, width);
    viewHeight = Math.max(1, height);
    quality.deviceRatio = pixelRatio;
    renderer.setPixelRatio(Math.min(pixelRatio, quality.maxRatio[quality.level]));
    renderer.setSize(viewWidth, viewHeight, false);
    camera.aspect = viewWidth / viewHeight;
    camera.fov = camera.aspect < 1.05 ? 68 : 60;
    camera.updateProjectionMatrix();

    const radarBounds = radarCanvas.getBoundingClientRect();
    radarSize = radarBounds.width || 120;
    radarRatio = Math.min(pixelRatio, 2);
    radarCanvas.width = Math.round(radarSize * radarRatio);
    radarCanvas.height = Math.round(radarSize * radarRatio);
  }

  // ------------------------------------------------------------------------
  // Synchronisation avec l'état du jeu
  // ------------------------------------------------------------------------

  function syncHero(game, time, delta) {
    const player = game.player;
    to3(player.x, player.y, 0, hero.position);
    const targetYaw = yawFromAngle(player.angle);
    hero.rotation.y = targetYaw;
    const moving = player.moving ? 1 : 0;
    hero.userData.moveBlend = THREE.MathUtils.damp(hero.userData.moveBlend ?? 0, moving, 10, delta);
    animateCat(hero, time, hero.userData.moveBlend, { turn: player.turn ?? 0 });
    hero.visible = !(player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0);
  }

  function syncMice(game, time) {
    const alive = new Set(game.mice);
    for (const [mouse, mesh] of mouseMeshes) {
      if (alive.has(mouse)) continue;
      mesh.visible = false;
      spareMice.push(mesh);
      mouseMeshes.delete(mouse);
    }
    game.mice.forEach((mouse) => {
      let mesh = mouseMeshes.get(mouse);
      if (!mesh) {
        mesh = spareMice.pop() ?? createMouse(false);
        if (!mesh.parent) scene.add(mesh);
        mouseMeshes.set(mouse, mesh);
      }
      mesh.visible = true;
      to3(mouse.x, mouse.y, 0, mesh.position);
      mesh.rotation.y = yawFromAngle(mouse.angle);
      animateMouse(mesh, time + mouse.bob, mouse.speed / 110);
    });
  }

  function placeSparkles(x, y, time, strength, radius = 0.36) {
    sparkleGroup.visible = strength > 0.01;
    to3(x, y, 0, sparkleGroup.position);
    sparkleMaterial.opacity = strength;
    sparkleGroup.children.forEach((sparkle, index) => {
      const angle = time * 1.8 + (index / sparkleGroup.children.length) * Math.PI * 2;
      sparkle.position.set(Math.cos(angle) * radius, 0.18 + Math.sin(time * 4 + index) * 0.08, Math.sin(angle) * radius);
      sparkle.rotation.y = time * 3 + index;
    });
  }

  function syncGold(game, time) {
    const gold = game.goldMouse;
    beacon.visible = false;
    goldLight.intensity = 0;
    sparkleGroup.visible = false;
    goldMesh.visible = false;
    if (!gold) return;
    goldMesh.visible = true;
    to3(gold.x, gold.y, 0, goldMesh.position);
    goldMesh.rotation.y = yawFromAngle(gold.angle);
    if (gold.hidden) {
      // Cachée derrière le meuble : elle reste immobile et brille.
      const pulse = 0.5 + Math.sin(time * 5) * 0.5;
      goldMesh.scale.setScalar(1.2);
      animateMouse(goldMesh, time * 0.2, 0.2);
      beacon.visible = true;
      to3(gold.x, gold.y, 1.2, beacon.position);
      beacon.material.opacity = 0.14 + pulse * 0.12;
      beacon.rotation.y = time;
      goldLight.intensity = 1.4 + pulse;
      placeSparkles(gold.x, gold.y, time, 0.7);
    } else {
      goldMesh.scale.setScalar(1.35);
      animateMouse(goldMesh, time, gold.speed / 110);
      goldLight.intensity = 1.8;
      placeSparkles(gold.x, gold.y, time, 1);
    }
    to3(gold.x, gold.y, 0.45, goldLight.position);
  }

  function smoothstep(edgeOne, edgeTwo, value) {
    const t = THREE.MathUtils.clamp((value - edgeOne) / (edgeTwo - edgeOne), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // Reproduit la chorégraphie du piège de la version 2D.
  function syncTrap(game, time) {
    const trap = game.trap;
    villain.visible = false;
    trapGold.visible = false;
    swipeGroup.visible = false;
    if (!trap) return;
    const t = trap.elapsed;

    if (t < 0.68) {
      const goldProgress = 1 - smoothstep(0.18, 0.68, t);
      trapGold.visible = goldProgress > 0.02;
      to3(trap.startX, trap.startY, Math.sin(t * 9) * 0.05, trapGold.position);
      trapGold.rotation.y = yawFromAngle(trap.goldAngle) + t * 14;
      trapGold.scale.setScalar(1.35 * goldProgress * (0.8 + Math.sin(t * 24) * 0.18));
      placeSparkles(trap.startX, trap.startY, time, goldProgress, 0.5);
    }

    const reveal = smoothstep(0.2, 0.78, t);
    const approach = smoothstep(0.68, 1.16, t);
    const retreat = smoothstep(1.65, 2.24, t);
    const back = trap.angle + Math.PI;
    let x = THREE.MathUtils.lerp(trap.startX, trap.targetX, approach) + Math.cos(back) * retreat * 72;
    let y = THREE.MathUtils.lerp(trap.startY, trap.targetY, approach) + Math.sin(back) * retreat * 72;
    const lunge = t > 1.02 && t < 1.35 ? Math.sin(((t - 1.02) / 0.33) * Math.PI) * 22 : 0;
    x += Math.cos(trap.angle) * lunge;
    y += Math.sin(trap.angle) * lunge;
    const scale = Math.max(0, reveal * (1 - retreat * 0.6));
    villain.visible = scale > 0.02;
    to3(x, y, 0, villain.position);
    villain.scale.setScalar(1.12 * scale);
    villain.rotation.y = yawFromAngle(trap.angle);
    const swat = t > 0.95 && t < 1.5 ? Math.sin(((t - 0.95) / 0.55) * Math.PI) : 0;
    animateCat(villain, time, approach > 0 && approach < 1 ? 1 : 0, { swat });

    if (t > 1.08 && t < 1.48) {
      const progress = (t - 1.08) / 0.4;
      swipeGroup.visible = true;
      to3(game.player.x, game.player.y, 0.42, swipeGroup.position);
      swipeGroup.rotation.y = yawFromAngle(trap.angle) - Math.PI / 2;
      swipeMaterial.opacity = Math.sin(progress * Math.PI);
      swipeGroup.scale.setScalar(0.8 + progress * 0.4);
    }
  }

  function syncParticles(game) {
    const particles = game.particles;
    const count = Math.min(PARTICLE_LIMIT, particles.length);
    for (let index = 0; index < count; index += 1) {
      const particle = particles[index];
      const life = particle.life / particle.maximumLife;
      const height = 0.2 + Math.sin((1 - life) * Math.PI) * 0.55 + (1 - life) * 0.15;
      to3(particle.x, particle.y, height, particlePosition);
      particleEuler.set(particle.rotation, particle.rotation * 0.7, 0);
      particleQuaternion.setFromEuler(particleEuler);
      const size = (particle.size / UNIT) * 1.4 * Math.min(1, life * 2);
      particleScale.set(size, size, size * 0.4);
      particleMatrix.compose(particlePosition, particleQuaternion, particleScale);
      particleMesh.setMatrixAt(index, particleMatrix);
      particleMesh.setColorAt(index, particleColor.set(particle.color));
    }
    particleMesh.count = count;
    particleMesh.instanceMatrix.needsUpdate = true;
    if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;
  }

  function syncLabels(game) {
    const alive = new Set(game.floatTexts);
    for (const [item, element] of labelPool) {
      if (alive.has(item)) continue;
      element.remove();
      labelPool.delete(item);
    }
    game.floatTexts.forEach((item) => {
      let element = labelPool.get(item);
      if (!element) {
        element = document.createElement("span");
        element.className = "float-label";
        element.textContent = item.text;
        element.style.color = item.color;
        element.style.setProperty("--label-scale", item.scale);
        labelLayer.append(element);
        labelPool.set(item, element);
      }
      const rise = (1 - item.life / item.maximumLife) * 0.5;
      to3(item.x, item.y + 25, 0.75 + rise, projected).project(camera);
      const visible = projected.z < 1;
      element.style.opacity = visible ? Math.min(1, (item.life / item.maximumLife) * 2) : 0;
      element.style.transform = `translate(${((projected.x + 1) / 2) * viewWidth}px, ${((1 - projected.y) / 2) * viewHeight}px) translate(-50%, -50%) scale(var(--label-scale))`;
    });
  }

  // ------------------------------------------------------------------------
  // Caméra
  // ------------------------------------------------------------------------

  const desired = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();

  function updateCamera(game, time, delta) {
    const player = game.player;
    const following = ["playing", "trap", "paused"].includes(game.state);

    if (following) {
      const heroYaw = yawFromAngle(player.angle);
      if (!cameraState.initialized) cameraState.yaw = heroYaw;
      // La caméra rattrape doucement l'orientation du chat.
      let diff = heroYaw - cameraState.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      cameraState.yaw += diff * (1 - Math.exp(-4.5 * delta));

      const distance = 2.7;
      const height = 1.75;
      desired.set(
        hero.position.x - Math.sin(cameraState.yaw) * distance,
        height,
        hero.position.z - Math.cos(cameraState.yaw) * distance,
      );
      // La caméra peut passer derrière un mur (qui devient transparent),
      // mais ne s'éloigne pas trop de la pièce.
      const outside = 1.6;
      desired.x = THREE.MathUtils.clamp(desired.x, -bounds.halfWidth - outside, bounds.halfWidth + outside);
      desired.z = THREE.MathUtils.clamp(desired.z, -bounds.halfDepth - outside, bounds.halfDepth + outside);
      desired.y = height;
      lookTarget.set(
        hero.position.x + Math.sin(cameraState.yaw) * 1.7,
        0.2,
        hero.position.z + Math.cos(cameraState.yaw) * 1.7,
      );
    } else {
      // Écrans d'accueil et de fin : vue d'ensemble qui tourne lentement.
      const angle = time * 0.12;
      desired.set(Math.sin(angle) * 4.6, 4.4, Math.cos(angle) * 3.8);
      lookTarget.set(0, 0.2, 0);
    }

    if (!cameraState.initialized) {
      cameraState.position.copy(desired);
      cameraState.target.copy(lookTarget);
      cameraState.initialized = true;
    } else {
      const smoothing = following ? 7 : 2.2;
      cameraState.position.x = THREE.MathUtils.damp(cameraState.position.x, desired.x, smoothing, delta);
      cameraState.position.y = THREE.MathUtils.damp(cameraState.position.y, desired.y, smoothing * 0.7, delta);
      cameraState.position.z = THREE.MathUtils.damp(cameraState.position.z, desired.z, smoothing, delta);
      cameraState.target.x = THREE.MathUtils.damp(cameraState.target.x, lookTarget.x, smoothing * 1.4, delta);
      cameraState.target.y = THREE.MathUtils.damp(cameraState.target.y, lookTarget.y, smoothing * 1.4, delta);
      cameraState.target.z = THREE.MathUtils.damp(cameraState.target.z, lookTarget.z, smoothing * 1.4, delta);
    }
    camera.position.copy(cameraState.position);
    camera.lookAt(cameraState.target);
  }

  // Les meubles entre la caméra et le chat deviennent transparents.
  function segmentHitsRectangle(ax, az, bx, bz, rect) {
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dz = bz - az;
    const checks = [
      [-dx, ax - rect.minX],
      [dx, rect.maxX - ax],
      [-dz, az - rect.minZ],
      [dz, rect.maxZ - az],
    ];
    for (const [p, q] of checks) {
      if (p === 0) {
        if (q < 0) return false;
        continue;
      }
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
    return true;
  }

  function fade(materials, opacity) {
    const transparent = opacity < 0.98;
    materials.forEach((material) => {
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.depthWrite = !transparent;
        material.needsUpdate = true;
      }
      material.opacity = transparent ? opacity : 1;
    });
  }

  function updateOcclusion(game, delta) {
    const following = ["playing", "trap", "paused"].includes(game.state);
    // Murs : transparents quand la caméra est derrière eux.
    const behind = {
      north: camera.position.z < -bounds.halfDepth + 0.05,
      south: camera.position.z > bounds.halfDepth - 0.05,
      west: camera.position.x < -bounds.halfWidth + 0.05,
      east: camera.position.x > bounds.halfWidth - 0.05,
    };
    (room?.userData.walls ?? []).forEach((wall) => {
      const target = behind[wall.side] ? 0.12 : 1;
      const opacity = THREE.MathUtils.damp(wall.opacity, target, 12, delta);
      if (opacity === wall.opacity) return;
      wall.opacity = Math.abs(opacity - target) < 0.002 ? target : opacity;
      fade(wall.materials, wall.opacity);
    });

    furniture.forEach((item) => {
      const { obstacle, materials, height } = item.userData;
      let target = 1;
      if (following && height > 0.45) {
        const pad = 0.05;
        const rect = {
          minX: (obstacle.x - world.width / 2) / UNIT - pad,
          maxX: (obstacle.x + obstacle.width - world.width / 2) / UNIT + pad,
          minZ: (obstacle.y - world.height / 2) / UNIT - pad,
          maxZ: (obstacle.y + obstacle.height - world.height / 2) / UNIT + pad,
        };
        if (segmentHitsRectangle(camera.position.x, camera.position.z, hero.position.x, hero.position.z, rect)) target = 0.22;
      }
      let opacity = THREE.MathUtils.damp(item.userData.opacity, target, 10, delta);
      if (Math.abs(opacity - target) < 0.002) opacity = target;
      if (opacity === item.userData.opacity) return;
      item.userData.opacity = opacity;
      const transparent = opacity < 0.98;
      fade(materials, opacity);
      item.traverse((child) => {
        if (child.isMesh) child.castShadow = !transparent || opacity > 0.6;
      });
    });
  }

  // ------------------------------------------------------------------------
  // Radar (vue du dessus, orientée dans le sens du chat)
  // ------------------------------------------------------------------------

  function drawRadar(game, level, time) {
    if (!radarSize) return;
    const size = radarSize;
    const ctx = radar;
    ctx.setTransform(radarRatio, 0, 0, radarRatio, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const radius = size / 2 - 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(14, 11, 42, 0.72)";
    ctx.fill();
    ctx.clip();

    const player = game.player;
    const scale = (radius * 0.92) / 420;
    ctx.translate(center, center);
    ctx.rotate(-Math.PI / 2 - player.angle);
    ctx.scale(scale, scale);
    ctx.translate(-player.x, -player.y);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 3 / scale;
    ctx.beginPath();
    ctx.rect(24, 24, world.width - 48, world.height - 48);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    level.obstacles.forEach((obstacle) => ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height));

    const dot = (x, y, r, color) => {
      ctx.beginPath();
      ctx.arc(x, y, r / scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };
    game.mice.forEach((mouse) => dot(mouse.x, mouse.y, 4, "#e4e2ee"));
    const gold = game.goldMouse;
    if (gold) {
      const pulse = 5 + Math.sin(time * 6) * 1.6;
      dot(gold.x, gold.y, pulse + 3, "rgba(255, 211, 78, 0.3)");
      dot(gold.x, gold.y, gold.hidden ? 4 : 5, "#ffd34e");
    }
    ctx.restore();

    // Le chat au centre, pointe vers le haut, avec son champ de vision.
    ctx.save();
    ctx.translate(center, center);
    ctx.fillStyle = "rgba(68, 229, 231, 0.16)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#44e5e7";
    ctx.strokeStyle = "#0e0b2a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ------------------------------------------------------------------------

  let radarClock = 0;

  let lastPlayer = null;

  function render(game, level, timestamp, delta) {
    setLevel(level);
    // Nouvelle pièce ou nouvelle partie : la caméra se replace directement derrière le chat.
    if (game.player !== lastPlayer) {
      lastPlayer = game.player;
      if (["playing", "trap", "paused"].includes(game.state)) cameraState.initialized = false;
    }
    const time = timestamp / 1000;
    syncHero(game, time, delta);
    syncMice(game, time);
    syncGold(game, time);
    syncTrap(game, time);
    syncParticles(game);
    if (room?.userData.toy) {
      const toy = room.userData.toy;
      toy.rotation.z = time * 0.9;
      toy.position.y = 0.12 + Math.abs(Math.sin(time * 2.1)) * 0.03;
    }
    updateCamera(game, time, delta);
    updateOcclusion(game, delta);
    syncLabels(game);
    renderer.render(scene, camera);
    if (game.state === "playing") adaptQuality(delta);

    radarClock += delta;
    if (radarClock > 1 / 30) {
      radarClock = 0;
      drawRadar(game, level, time);
    }
  }

  return { render, resize, setLevel, ROOM_HEIGHT };
}
