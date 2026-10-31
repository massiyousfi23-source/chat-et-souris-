import { createWorld } from "./scene3d.js?v=3d1";

(() => {
  "use strict";

  const WORLD = Object.freeze({ width: 900, height: 700, margin: 34 });
  const SCORE = Object.freeze({ gray: 10, gold: 100, trap: 50 });
  const STORAGE_KEYS = Object.freeze({
    best: "chat-souris-best-score",
    sound: "chat-souris-sound",
  });

  const LEVELS = [
    {
      id: "salon",
      name: "SALON POP",
      label: "LE SALON POP",
      target: 8,
      seconds: 65,
      grayCount: 3,
      playerSpeed: 242,
      mouseSpeed: [86, 122],
      trapChance: 0.24,
      goldEvery: 3,
      floor: ["#62d8d6", "#45c3cb"],
      wall: "#fff0ce",
      accent: "#ff6f61",
      rug: { x: 275, y: 245, width: 350, height: 245, color: "#7a5cff" },
      start: { x: 470, y: 615 },
      obstacles: [
        { type: "sofa", x: 75, y: 72, width: 330, height: 102, color: "#ff6f61" },
        { type: "coffee", x: 370, y: 333, width: 170, height: 98, color: "#ffd34e" },
        { type: "tv", x: 650, y: 74, width: 172, height: 66, color: "#302b79" },
        { type: "plant", x: 748, y: 472, width: 92, height: 92, color: "#6ce5a0" },
        { type: "armchair", x: 76, y: 470, width: 132, height: 122, color: "#ff5da8" },
      ],
      hidingSpots: [
        { x: 418, y: 126, obstacle: 0 },
        { x: 552, y: 382, obstacle: 1 },
        { x: 735, y: 518, obstacle: 3 },
      ],
    },
    {
      id: "cuisine",
      name: "CUISINE SOLAIRE",
      label: "LA CUISINE SOLAIRE",
      target: 10,
      seconds: 62,
      grayCount: 4,
      playerSpeed: 252,
      mouseSpeed: [98, 136],
      trapChance: 0.34,
      goldEvery: 3,
      floor: ["#ffd86a", "#f9b94f"],
      wall: "#fffbdf",
      accent: "#17bfc8",
      rug: { x: 340, y: 440, width: 250, height: 175, color: "#ff6f61" },
      start: { x: 455, y: 620 },
      obstacles: [
        { type: "counter", x: 58, y: 65, width: 270, height: 82, color: "#8b6bdf" },
        { type: "island", x: 276, y: 230, width: 348, height: 145, color: "#fff5dc" },
        { type: "fridge", x: 721, y: 67, width: 120, height: 124, color: "#65dce0" },
        { type: "dining", x: 80, y: 474, width: 225, height: 122, color: "#ff7e74" },
        { type: "pantry", x: 650, y: 488, width: 175, height: 78, color: "#73c78f" },
      ],
      hidingSpots: [
        { x: 338, y: 110, obstacle: 0 },
        { x: 636, y: 304, obstacle: 1 },
        { x: 706, y: 135, obstacle: 2 },
        { x: 634, y: 528, obstacle: 4 },
      ],
    },
    {
      id: "chambre",
      name: "CHAMBRE NÉON",
      label: "LA CHAMBRE NÉON",
      target: 12,
      seconds: 59,
      grayCount: 4,
      playerSpeed: 260,
      mouseSpeed: [108, 148],
      trapChance: 0.43,
      goldEvery: 3,
      floor: ["#b98cff", "#835ed8"],
      wall: "#ffe1ef",
      accent: "#ff5da8",
      rug: { x: 250, y: 385, width: 400, height: 235, color: "#44e5e7" },
      start: { x: 125, y: 620 },
      obstacles: [
        { type: "bed", x: 68, y: 76, width: 365, height: 232, color: "#ff7eb8" },
        { type: "nightstand", x: 462, y: 102, width: 82, height: 82, color: "#ffd34e" },
        { type: "dresser", x: 630, y: 78, width: 190, height: 82, color: "#ff9868" },
        { type: "ottoman", x: 354, y: 470, width: 175, height: 102, color: "#6950bf" },
        { type: "wardrobe", x: 680, y: 425, width: 154, height: 190, color: "#45b6c9" },
      ],
      hidingSpots: [
        { x: 446, y: 178, obstacle: 0 },
        { x: 556, y: 145, obstacle: 1 },
        { x: 616, y: 120, obstacle: 2 },
        { x: 542, y: 522, obstacle: 3 },
        { x: 664, y: 536, obstacle: 4 },
      ],
    },
  ];

  const elements = {
    body: document.body,
    canvas: document.querySelector("#gameCanvas"),
    boardFrame: document.querySelector("#boardFrame"),
    scoreValue: document.querySelector("#scoreValue"),
    bestValue: document.querySelector("#bestValue"),
    roomValue: document.querySelector("#roomValue"),
    timerValue: document.querySelector("#timerValue"),
    timerCard: document.querySelector(".stat-card--timer"),
    missionValue: document.querySelector("#missionValue"),
    statusLabel: document.querySelector("#statusLabel"),
    pauseButton: document.querySelector("#pauseButton"),
    pauseLabel: document.querySelector("#pauseLabel"),
    soundButton: document.querySelector("#soundButton"),
    helpButton: document.querySelector("#helpButton"),
    overlay: document.querySelector("#gameOverlay"),
    overlayKicker: document.querySelector("#overlayKicker"),
    overlayTitle: document.querySelector("#overlayTitle"),
    overlayMessage: document.querySelector("#overlayMessage"),
    overlayRewards: document.querySelector("#overlayRewards"),
    overlayPortraitImage: document.querySelector("#overlayPortraitImage"),
    primaryAction: document.querySelector("#primaryAction"),
    primaryActionLabel: document.querySelector("#primaryActionLabel"),
    shareButton: document.querySelector("#shareButton"),
    trackProgress: document.querySelector("#trackProgress"),
    stages: [...document.querySelectorAll(".stage")],
    directionButtons: [...document.querySelectorAll("[data-direction]")],
    helpDialog: document.querySelector("#helpDialog"),
    helpClose: document.querySelector("#helpClose"),
    helpPlay: document.querySelector("#helpPlay"),
    toast: document.querySelector("#toast"),
    trapBanner: document.querySelector("#trapBanner"),
    dangerFlash: document.querySelector("#dangerFlash"),
    celebrationCanvas: document.querySelector("#celebrationCanvas"),
    radarCanvas: document.querySelector("#radarCanvas"),
    labelLayer: document.querySelector("#labelLayer"),
    touchStick: document.querySelector("#touchStick"),
  };

  // Commandes « derrière le chat » : avancer / reculer et tourner.
  const CONTROLS = Object.freeze({ turnSpeed: 3.1, backwardFactor: 0.6, stickRadius: 56 });
  // Un peu de marge pour attraper : en 3D, les distances sont plus dures à juger.
  const CATCH_BONUS = 8;

  const celebrationContext = elements.celebrationCanvas.getContext("2d");
  let world3d = null;
  const imageSources = {
    hero: "./assets/characters/hero-sprite.png",
    villain: "./assets/characters/villain-sprite.png",
    grayMouse: "./assets/characters/mouse-gray-sprite.png",
    goldMouse: "./assets/characters/mouse-gold-sprite.png",
  };

  let bestScore = readStoredNumber(STORAGE_KEYS.best);
  let soundEnabled = readStoredValue(STORAGE_KEYS.sound, "on") !== "off";
  let audioContext = null;
  let game = createGame();
  let overlayAction = "start";
  let animationFrameId = null;
  let lastFrameAt = 0;
  let canvasScale = 1;
  let pixelRatio = 1;
  let toastTimer = null;
  // Joystick tactile : on pose le doigt sur le jeu et on le fait glisser.
  const stick = { pointer: null, startX: 0, startY: 0, turn: 0, forward: 0 };
  let helpPausedGame = false;
  let celebration = createCelebration();
  const heldDirections = new Set();

  function createGame() {
    return {
      state: "idle",
      levelIndex: 0,
      score: 0,
      caught: 0,
      timeLeft: LEVELS[0].seconds,
      elapsed: 0,
      player: createPlayer(LEVELS[0].start),
      mice: [],
      goldMouse: null,
      trap: null,
      particles: [],
      floatTexts: [],
      nextGoldAt: LEVELS[0].goldEvery,
      goldCount: 0,
    };
  }

  function createPlayer(start) {
    return {
      x: start.x,
      y: start.y,
      radius: 34,
      angle: -Math.PI / 2,
      moving: false,
      turn: 0,
      bob: 0,
      invulnerable: 0,
    };
  }

  function createCelebration() {
    return {
      active: false,
      elapsed: 0,
      nextBurst: 0,
      colors: [],
      particles: [],
    };
  }

  function readStoredValue(key, fallback) {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function readStoredNumber(key) {
    const value = Number.parseInt(readStoredValue(key, "0"), 10);
    return Number.isFinite(value) ? value : 0;
  }

  function writeStoredValue(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // The game remains fully playable when storage is unavailable.
    }
  }

  function currentLevel() {
    return LEVELS[game.levelIndex];
  }

  function setGameState(state) {
    game.state = state;
    elements.body.dataset.gameState = state;
    elements.statusLabel.textContent =
      {
        idle: "EN ATTENTE",
        playing: "CHASSE EN COURS",
        paused: "EN PAUSE",
        trap: "ATTENTION !",
        "level-complete": "PIÈCE TERMINÉE",
        "game-over": "TEMPS ÉCOULÉ",
        victory: "APPART CONQUIS",
      }[state] ?? "EN ATTENTE";
    elements.pauseLabel.textContent = state === "paused" ? "Reprendre" : "Pause";
    elements.pauseButton.disabled = !["playing", "paused"].includes(state);
  }

  function startNewGame() {
    ensureAudioContext();
    game = createGame();
    setupLevel(0);
    hideOverlay();
    showToast("La chasse commence !");
    playSound("start");
  }

  function setupLevel(index) {
    const level = LEVELS[index];
    game.levelIndex = index;
    game.caught = 0;
    game.timeLeft = level.seconds;
    game.player = createPlayer(level.start);
    game.mice = [];
    game.goldMouse = null;
    game.trap = null;
    game.particles = [];
    game.floatTexts = [];
    game.nextGoldAt = level.goldEvery;
    game.goldCount = 0;
    elements.body.dataset.room = level.id;
    setGameState("playing");
    ensureGrayMice();
    updateInterface();
  }

  function pauseGame(showPauseOverlay = true) {
    if (game.state !== "playing") return;
    setGameState("paused");
    heldDirections.clear();
    releaseStick();
    updatePressedButtons();
    if (showPauseOverlay) {
      showOverlay({
        kicker: "PETITE PAUSE",
        title: "ON REPREND<br><em>LA CHASSE ?</em>",
        message: "Le chronomètre est arrêté. Les souris t'attendent dans la pièce.",
        button: "REPRENDRE",
        action: "resume",
        portrait: "hero",
        rewards: false,
      });
    }
    updateInterface();
  }

  function resumeGame() {
    ensureAudioContext();
    if (game.state !== "paused") return;
    setGameState("playing");
    hideOverlay();
    lastFrameAt = performance.now();
    updateInterface();
  }

  function completeLevel() {
    if (game.state !== "playing") return;
    setGameState("level-complete");
    const level = currentLevel();
    const timeBonus = Math.max(0, Math.ceil(game.timeLeft)) * 2;
    addScore(timeBonus);
    updateBestScore();
    playSound("level");

    if (game.levelIndex === LEVELS.length - 1) {
      finishGame();
      return;
    }

    showOverlay({
      kicker: `${level.label} EST NETTOYÉ`,
      title: `BRAVO !<br><em>+${timeBonus} TEMPS</em>`,
      message: `Tu as attrapé ${level.target} souris. La pièce suivante est plus rapide et ses trésors sont plus risqués.`,
      button: "PIÈCE SUIVANTE",
      action: "next-level",
      portrait: "hero",
      rewards: false,
      celebrationColors: ["#44e5e7", "#ffd34e", "#ff5da8", "#ffffff"],
    });
    updateInterface();
  }

  function finishGame() {
    setGameState("victory");
    updateBestScore();
    showOverlay({
      kicker: "APPARTEMENT CONQUIS",
      title: `ROI DE LA<br><em>CHASSE</em>`,
      message: `Score final : ${formatScore(game.score)}. Même le méchant n'a pas réussi à protéger toutes les souris dorées.`,
      button: "REJOUER",
      action: "restart",
      portrait: "hero",
      rewards: false,
      share: true,
      celebrationColors: ["#44e5e7", "#ffd34e", "#ff5da8", "#9d6cff", "#ffffff"],
    });
    playSound("victory");
    updateInterface();
  }

  function gameOver() {
    if (!["playing", "trap"].includes(game.state)) return;
    setGameState("game-over");
    game.timeLeft = 0;
    updateBestScore();
    playSound("lose");
    showOverlay({
      kicker: "TEMPS ÉCOULÉ",
      title: `LES SOURIS<br><em>ONT FILÉ</em>`,
      message: `Tu termines avec ${formatScore(game.score)} points dans ${currentLevel().label.toLowerCase()}.`,
      button: "RECOMMENCER",
      action: "restart",
      portrait: "villain",
      rewards: false,
      share: true,
    });
    updateInterface();
  }

  function showOverlay({
    kicker,
    title,
    message,
    button,
    action,
    portrait = "hero",
    rewards = false,
    share = false,
    celebrationColors = null,
  }) {
    overlayAction = action;
    elements.overlayKicker.textContent = kicker;
    elements.overlayTitle.innerHTML = title;
    elements.overlayMessage.textContent = message;
    elements.primaryActionLabel.textContent = button;
    elements.overlayRewards.hidden = !rewards;
    elements.shareButton.hidden = !share;
    elements.overlayPortraitImage.src = imageSources[portrait] ?? imageSources.hero;
    elements.overlay.classList.remove("is-hidden");
    if (celebrationColors) startCelebration(celebrationColors);
    else stopCelebration();
  }

  function hideOverlay() {
    elements.overlay.classList.add("is-hidden");
    elements.shareButton.hidden = true;
    stopCelebration();
  }

  function handlePrimaryAction() {
    ensureAudioContext();
    switch (overlayAction) {
      case "resume":
        resumeGame();
        break;
      case "next-level":
        setupLevel(game.levelIndex + 1);
        hideOverlay();
        playSound("start");
        break;
      case "reload":
        window.location.reload();
        break;
      case "restart":
      case "start":
      default:
        startNewGame();
        break;
    }
    elements.canvas.focus({ preventScroll: true });
  }

  function updateBestScore() {
    if (game.score <= bestScore) return;
    bestScore = game.score;
    writeStoredValue(STORAGE_KEYS.best, bestScore);
  }

  function addScore(amount) {
    game.score = Math.max(0, game.score + amount);
    updateBestScore();
  }

  function updateInterface() {
    const level = currentLevel();
    elements.scoreValue.textContent = formatScore(game.score);
    elements.bestValue.textContent = formatScore(bestScore);
    elements.roomValue.textContent = level.name;
    elements.timerValue.textContent = formatTime(game.timeLeft);
    elements.missionValue.textContent = `${Math.min(game.caught, level.target)} / ${level.target}`;
    elements.timerCard.classList.toggle("is-urgent", game.timeLeft <= 10 && game.state === "playing");

    const roomProgress = Math.min(1, game.caught / level.target);
    const totalProgress = (game.levelIndex + roomProgress) / LEVELS.length;
    elements.trackProgress.style.width = `${Math.max(0, totalProgress * 100)}%`;
    elements.stages.forEach((stage, index) => {
      stage.classList.toggle("is-active", index === game.levelIndex);
      stage.classList.toggle("is-complete", index < game.levelIndex || game.state === "victory");
    });
  }

  function formatScore(value) {
    return Math.max(0, Math.round(value)).toString().padStart(4, "0");
  }

  function formatTime(value) {
    const total = Math.max(0, Math.ceil(value));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function loop(timestamp) {
    const delta = Math.min(0.034, Math.max(0, (timestamp - lastFrameAt) / 1000 || 0));
    lastFrameAt = timestamp;
    update(delta);
    draw(timestamp, delta);
    animationFrameId = window.requestAnimationFrame(loop);
  }

  function update(delta) {
    updateParticles(delta);
    updateFloatTexts(delta);
    updateCelebration(delta);

    if (game.player.invulnerable > 0) game.player.invulnerable -= delta;

    if (game.state === "trap") {
      updateTrap(delta);
      return;
    }

    if (game.state !== "playing") return;

    game.elapsed += delta;
    game.timeLeft -= delta;
    if (game.timeLeft <= 0) {
      gameOver();
      return;
    }

    updatePlayer(delta);
    updateGrayMice(delta);
    updateGoldenMouse(delta);
    checkCatches();

    if (game.state === "playing" && game.caught >= currentLevel().target) completeLevel();
    updateInterface();
  }

  function updatePlayer(delta) {
    const input = readInputVector();
    const player = game.player;
    const level = currentLevel();

    // Tourner sur place ou en courant.
    player.turn = input.turn;
    player.angle += input.turn * CONTROLS.turnSpeed * delta;

    if (Math.abs(input.forward) > 0.05) {
      const factor = input.forward > 0 ? input.forward : input.forward * CONTROLS.backwardFactor;
      const speed = level.playerSpeed * factor;
      moveCircle(player, Math.cos(player.angle) * speed * delta, Math.sin(player.angle) * speed * delta, player.radius);
      player.moving = true;
      player.bob += delta * 11;
    } else {
      player.moving = Math.abs(input.turn) > 0.05;
      player.bob += delta * 3;
    }
  }

  // Renvoie { turn, forward } entre -1 et 1.
  // Flèches / ZQSD : haut = avancer, bas = reculer, gauche / droite = tourner.
  function readInputVector() {
    let turn = 0;
    let forward = 0;
    if (heldDirections.has("left")) turn -= 1;
    if (heldDirections.has("right")) turn += 1;
    if (heldDirections.has("up")) forward += 1;
    if (heldDirections.has("down")) forward -= 1;
    if (stick.pointer !== null) {
      turn += stick.turn;
      forward += stick.forward;
    }
    return { turn: clamp(turn, -1, 1), forward: clamp(forward, -1, 1) };
  }

  function moveCircle(entity, dx, dy, radius) {
    const originalX = entity.x;
    entity.x = clamp(entity.x + dx, WORLD.margin + radius, WORLD.width - WORLD.margin - radius);
    if (collidesWithFurniture(entity.x, entity.y, radius)) entity.x = originalX;

    const originalY = entity.y;
    entity.y = clamp(entity.y + dy, WORLD.margin + radius, WORLD.height - WORLD.margin - radius);
    if (collidesWithFurniture(entity.x, entity.y, radius)) entity.y = originalY;
  }

  function collidesWithFurniture(x, y, radius) {
    return currentLevel().obstacles.some((obstacle) => circleRectangleCollision(x, y, radius, obstacle));
  }

  function circleRectangleCollision(x, y, radius, rectangle) {
    const nearestX = clamp(x, rectangle.x, rectangle.x + rectangle.width);
    const nearestY = clamp(y, rectangle.y, rectangle.y + rectangle.height);
    const dx = x - nearestX;
    const dy = y - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function ensureGrayMice() {
    const desired = currentLevel().grayCount;
    while (game.mice.length < desired) game.mice.push(createGrayMouse());
  }

  function createGrayMouse() {
    const level = currentLevel();
    const position = findFreePosition(24, 150);
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(level.mouseSpeed[0], level.mouseSpeed[1]);
    return {
      x: position.x,
      y: position.y,
      radius: 20,
      angle,
      speed,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      wanderIn: randomBetween(0.7, 1.8),
      bob: Math.random() * Math.PI * 2,
    };
  }

  function findFreePosition(radius, minimumPlayerDistance = 0) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = randomBetween(WORLD.margin + radius, WORLD.width - WORLD.margin - radius);
      const y = randomBetween(WORLD.margin + radius, WORLD.height - WORLD.margin - radius);
      if (collidesWithFurniture(x, y, radius + 7)) continue;
      if (distance(x, y, game.player.x, game.player.y) < minimumPlayerDistance) continue;
      return { x, y };
    }
    return { x: WORLD.width - 90, y: WORLD.height - 90 };
  }

  function updateGrayMice(delta) {
    game.mice.forEach((mouse) => updateMovingMouse(mouse, delta));
  }

  function updateMovingMouse(mouse, delta) {
    mouse.wanderIn -= delta;
    mouse.bob += delta * 10;
    if (mouse.wanderIn <= 0) {
      const currentAngle = Math.atan2(mouse.velocityY, mouse.velocityX);
      const nextAngle = currentAngle + randomBetween(-1.05, 1.05);
      mouse.velocityX = Math.cos(nextAngle) * mouse.speed;
      mouse.velocityY = Math.sin(nextAngle) * mouse.speed;
      mouse.wanderIn = randomBetween(0.65, 1.75);
    }

    const previousX = mouse.x;
    mouse.x += mouse.velocityX * delta;
    if (
      mouse.x < WORLD.margin + mouse.radius ||
      mouse.x > WORLD.width - WORLD.margin - mouse.radius ||
      collidesWithFurniture(mouse.x, mouse.y, mouse.radius)
    ) {
      mouse.x = previousX;
      mouse.velocityX *= -1;
      mouse.wanderIn = randomBetween(0.3, 0.8);
    }

    const previousY = mouse.y;
    mouse.y += mouse.velocityY * delta;
    if (
      mouse.y < WORLD.margin + mouse.radius ||
      mouse.y > WORLD.height - WORLD.margin - mouse.radius ||
      collidesWithFurniture(mouse.x, mouse.y, mouse.radius)
    ) {
      mouse.y = previousY;
      mouse.velocityY *= -1;
      mouse.wanderIn = randomBetween(0.3, 0.8);
    }
    mouse.angle = Math.atan2(mouse.velocityY, mouse.velocityX);
  }

  function maybeSpawnGoldenMouse() {
    if (game.goldMouse || game.caught < game.nextGoldAt || game.caught >= currentLevel().target) return;
    const level = currentLevel();
    const spot = level.hidingSpots[game.goldCount % level.hidingSpots.length];
    const obstacle = level.obstacles[spot.obstacle];
    const escapeAngle = Math.atan2(
      spot.y - (obstacle.y + obstacle.height / 2),
      spot.x - (obstacle.x + obstacle.width / 2),
    );
    const speed = randomBetween(level.mouseSpeed[0] * 0.82, level.mouseSpeed[1] * 0.92);
    game.goldMouse = {
      x: spot.x,
      y: spot.y,
      radius: 22,
      angle: escapeAngle,
      speed,
      velocityX: Math.cos(escapeAngle) * speed,
      velocityY: Math.sin(escapeAngle) * speed,
      wanderIn: 1.2,
      bob: 0,
      hidden: true,
      coverObstacle: spot.obstacle,
      trap: Math.random() < level.trapChance,
      revealPulse: 0,
    };
    game.goldCount += 1;
    game.nextGoldAt += level.goldEvery;
    showToast("Une lueur dorée se cache derrière un meuble…");
    playSound("hint");
  }

  function updateGoldenMouse(delta) {
    maybeSpawnGoldenMouse();
    const mouse = game.goldMouse;
    if (!mouse) return;
    mouse.bob += delta * 8;
    mouse.revealPulse += delta;

    if (mouse.hidden) {
      if (distance(mouse.x, mouse.y, game.player.x, game.player.y) < 145) {
        mouse.hidden = false;
        mouse.x += Math.cos(mouse.angle) * 26;
        mouse.y += Math.sin(mouse.angle) * 26;
        spawnBurst(mouse.x, mouse.y, ["#ffd34e", "#fff4aa", "#ffffff"], 18, 125);
        addFloatText(mouse.x, mouse.y - 28, "TROUVÉE !", "#ffd34e");
        playSound("reveal");
      }
      return;
    }

    updateMovingMouse(mouse, delta);
  }

  function checkCatches() {
    const player = game.player;
    for (let index = game.mice.length - 1; index >= 0; index -= 1) {
      const mouse = game.mice[index];
      if (distance(player.x, player.y, mouse.x, mouse.y) > player.radius + mouse.radius + CATCH_BONUS) continue;
      game.mice.splice(index, 1);
      game.caught += 1;
      addScore(SCORE.gray);
      addFloatText(mouse.x, mouse.y - 25, `+${SCORE.gray}`, "#ffffff");
      spawnBurst(mouse.x, mouse.y, ["#d8d8e2", "#ffffff", currentLevel().accent], 14, 105);
      playSound("catch");
      ensureGrayMice();
    }

    const gold = game.goldMouse;
    if (!gold || gold.hidden) return;
    if (distance(player.x, player.y, gold.x, gold.y) > player.radius + gold.radius + CATCH_BONUS) return;

    game.goldMouse = null;
    if (gold.trap) {
      triggerTrap(gold);
      return;
    }

    addScore(SCORE.gold);
    addFloatText(gold.x, gold.y - 30, `+${SCORE.gold}`, "#ffd34e", 1.3);
    spawnBurst(gold.x, gold.y, ["#ffd34e", "#ff9f45", "#fff7ba", "#ffffff"], 34, 180);
    showToast("Trésor doré ! +100 points");
    playSound("gold");
  }

  function triggerTrap(goldMouse) {
    setGameState("trap");
    heldDirections.clear();
    releaseStick();
    updatePressedButtons();
    const player = game.player;
    const angleToPlayer = Math.atan2(player.y - goldMouse.y, player.x - goldMouse.x);
    const targetDistance = 86;
    game.trap = {
      elapsed: 0,
      x: goldMouse.x,
      y: goldMouse.y,
      startX: goldMouse.x,
      startY: goldMouse.y,
      targetX: player.x - Math.cos(angleToPlayer) * targetDistance,
      targetY: player.y - Math.sin(angleToPlayer) * targetDistance,
      angle: angleToPlayer,
      swatted: false,
      goldAngle: goldMouse.angle,
    };
    elements.trapBanner.hidden = false;
    elements.trapBanner.classList.remove("is-visible");
    void elements.trapBanner.offsetWidth;
    elements.trapBanner.classList.add("is-visible");
    window.setTimeout(() => {
      elements.trapBanner.hidden = true;
      elements.trapBanner.classList.remove("is-visible");
    }, 1700);
    spawnBurst(goldMouse.x, goldMouse.y, ["#ffd34e", "#ff5da8", "#2b173f"], 36, 195);
    playSound("trap");
    updateInterface();
  }

  function updateTrap(delta) {
    const trap = game.trap;
    if (!trap) return;
    trap.elapsed += delta;

    if (trap.elapsed >= 1.18 && !trap.swatted) {
      trap.swatted = true;
      addScore(-SCORE.trap);
      game.player.invulnerable = 1.1;
      const knockbackAngle = trap.angle;
      moveCircle(game.player, Math.cos(knockbackAngle) * 70, Math.sin(knockbackAngle) * 70, game.player.radius);
      addFloatText(game.player.x, game.player.y - 48, `−${SCORE.trap}`, "#ff426d", 1.45);
      spawnBurst(game.player.x, game.player.y, ["#ff426d", "#ffffff", "#9d6cff"], 30, 210);
      triggerHitEffects();
      playSound("hit");
      updateInterface();
    }

    if (trap.elapsed >= 2.25) {
      game.trap = null;
      setGameState("playing");
      showToast("Coup de patte : −50 points");
      lastFrameAt = performance.now();
      updateInterface();
    }
  }

  function triggerHitEffects() {
    elements.boardFrame.classList.remove("is-shaking");
    elements.dangerFlash.classList.remove("is-active");
    void elements.boardFrame.offsetWidth;
    elements.boardFrame.classList.add("is-shaking");
    elements.dangerFlash.classList.add("is-active");
    window.setTimeout(() => elements.boardFrame.classList.remove("is-shaking"), 420);
    window.setTimeout(() => elements.dangerFlash.classList.remove("is-active"), 500);
    if (navigator.vibrate) navigator.vibrate([65, 35, 90]);
  }

  function spawnBurst(x, y, colors, count = 18, speed = 120) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * randomBetween(0.35, 1);
      const life = randomBetween(0.45, 0.95);
      game.particles.push({
        x,
        y,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
        life,
        maximumLife: life,
        size: randomBetween(2.5, 7),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        spin: randomBetween(-6, 6),
      });
    }
  }

  function updateParticles(delta) {
    game.particles = game.particles.filter((particle) => {
      particle.life -= delta;
      if (particle.life <= 0) return false;
      particle.velocityY += 110 * delta;
      particle.velocityX *= 0.986;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      particle.rotation += particle.spin * delta;
      return true;
    });
  }

  function addFloatText(x, y, text, color, scale = 1) {
    game.floatTexts.push({ x, y, text, color, scale, life: 1.05, maximumLife: 1.05 });
  }

  function updateFloatTexts(delta) {
    game.floatTexts = game.floatTexts.filter((item) => {
      item.life -= delta;
      item.y -= 42 * delta;
      return item.life > 0;
    });
  }

  function resizeCanvas() {
    const bounds = elements.boardFrame.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasScale = bounds.width / WORLD.width;
    world3d?.resize(bounds.width, bounds.height, pixelRatio);

    elements.celebrationCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    elements.celebrationCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    celebrationContext.setTransform(canvasScale * pixelRatio, 0, 0, canvasScale * pixelRatio, 0, 0);
  }

  function draw(timestamp, delta) {
    world3d?.render(game, currentLevel(), timestamp, delta);
    drawCelebration();
  }

  function startCelebration(colors) {
    celebration = createCelebration();
    celebration.active = true;
    celebration.colors = colors;
    celebration.nextBurst = 0;
  }

  function stopCelebration() {
    celebration = createCelebration();
    celebrationContext.clearRect(0, 0, WORLD.width, WORLD.height);
  }

  function updateCelebration(delta) {
    if (!celebration.active) return;
    celebration.elapsed += delta;
    celebration.nextBurst -= delta;
    if (celebration.nextBurst <= 0 && celebration.elapsed < 9) {
      launchCelebrationBurst();
      celebration.nextBurst = randomBetween(0.28, 0.56);
    }
    celebration.particles = celebration.particles.filter((particle) => {
      particle.life -= delta;
      if (particle.life <= 0) return false;
      particle.velocityY += 155 * delta;
      particle.velocityX *= 0.991;
      particle.x += particle.velocityX * delta;
      particle.y += particle.velocityY * delta;
      return true;
    });
  }

  function launchCelebrationBurst() {
    const centerX = randomBetween(100, WORLD.width - 100);
    const centerY = randomBetween(75, WORLD.height * 0.52);
    const color = celebration.colors[Math.floor(Math.random() * celebration.colors.length)];
    const count = 30;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + Math.random() * 0.08;
      const speed = randomBetween(80, 185);
      const life = randomBetween(0.7, 1.25);
      celebration.particles.push({
        x: centerX,
        y: centerY,
        previousX: centerX,
        previousY: centerY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        color,
        life,
        maximumLife: life,
        width: randomBetween(1.5, 3.6),
      });
    }
  }

  function drawCelebration() {
    celebrationContext.save();
    celebrationContext.setTransform(canvasScale * pixelRatio, 0, 0, canvasScale * pixelRatio, 0, 0);
    celebrationContext.clearRect(0, 0, WORLD.width, WORLD.height);
    celebrationContext.globalCompositeOperation = "lighter";
    celebration.particles.forEach((particle) => {
      const opacity = clamp(particle.life / particle.maximumLife, 0, 1);
      celebrationContext.save();
      celebrationContext.globalAlpha = opacity;
      celebrationContext.strokeStyle = particle.color;
      celebrationContext.lineWidth = particle.width;
      celebrationContext.lineCap = "round";
      celebrationContext.shadowColor = particle.color;
      celebrationContext.shadowBlur = 8;
      celebrationContext.beginPath();
      celebrationContext.moveTo(particle.x - particle.velocityX * 0.025, particle.y - particle.velocityY * 0.025);
      celebrationContext.lineTo(particle.x, particle.y);
      celebrationContext.stroke();
      celebrationContext.restore();
    });
    celebrationContext.restore();
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothstep(edgeOne, edgeTwo, value) {
    const normalized = clamp((value - edgeOne) / (edgeTwo - edgeOne), 0, 1);
    return normalized * normalized * (3 - 2 * normalized);
  }

  function randomBetween(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function distance(xOne, yOne, xTwo, yTwo) {
    return Math.hypot(xTwo - xOne, yTwo - yOne);
  }

  function ensureAudioContext() {
    if (!soundEnabled) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playSound(type) {
    if (!soundEnabled) return;
    const audio = ensureAudioContext();
    if (!audio) return;
    const patterns = {
      start: [[330, 0, 0.08], [494, 0.09, 0.1], [659, 0.2, 0.13]],
      catch: [[520, 0, 0.055], [720, 0.055, 0.08]],
      hint: [[880, 0, 0.05], [1170, 0.1, 0.06]],
      reveal: [[620, 0, 0.055], [930, 0.07, 0.08], [1240, 0.16, 0.1]],
      gold: [[660, 0, 0.07], [990, 0.08, 0.08], [1320, 0.18, 0.14]],
      trap: [[220, 0, 0.11], [165, 0.12, 0.17]],
      hit: [[115, 0, 0.15]],
      level: [[494, 0, 0.07], [659, 0.09, 0.08], [988, 0.2, 0.16]],
      victory: [[392, 0, 0.08], [523, 0.09, 0.08], [659, 0.18, 0.1], [1046, 0.3, 0.22]],
      lose: [[330, 0, 0.12], [247, 0.13, 0.14], [196, 0.28, 0.2]],
    };
    (patterns[type] ?? patterns.catch).forEach(([frequency, delay, duration]) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type === "hit" || type === "trap" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, audio.currentTime + delay);
      gain.gain.setValueAtTime(0.0001, audio.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(type === "hit" ? 0.13 : 0.08, audio.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(audio.currentTime + delay);
      oscillator.stop(audio.currentTime + delay + duration + 0.02);
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    elements.soundButton.setAttribute("aria-pressed", String(soundEnabled));
    elements.soundButton.setAttribute("aria-label", soundEnabled ? "Couper le son" : "Activer le son");
    writeStoredValue(STORAGE_KEYS.sound, soundEnabled ? "on" : "off");
    if (soundEnabled) {
      ensureAudioContext();
      playSound("catch");
      showToast("Son activé");
    } else {
      showToast("Son coupé");
    }
  }

  async function shareScore() {
    const text = `J'ai marqué ${game.score} points dans Chat & Souris — La chasse de l'appart !`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Chat & Souris", text, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        showToast("Score copié !");
      } else {
        showToast(text);
      }
    } catch (error) {
      if (error?.name !== "AbortError") showToast("Partage indisponible");
    }
  }

  function directionForKey(key) {
    const normalized = key.toLowerCase();
    if (["arrowup", "w", "z"].includes(normalized)) return "up";
    if (["arrowdown", "s"].includes(normalized)) return "down";
    if (["arrowleft", "a", "q"].includes(normalized)) return "left";
    if (["arrowright", "d"].includes(normalized)) return "right";
    return null;
  }

  function updatePressedButtons() {
    elements.directionButtons.forEach((button) => {
      button.classList.toggle("is-pressed", heldDirections.has(button.dataset.direction));
    });
  }

  function handleKeyDown(event) {
    const direction = directionForKey(event.key);
    if (direction) {
      event.preventDefault();
      if (game.state === "idle") return;
      heldDirections.add(direction);
      updatePressedButtons();
      return;
    }
    if (event.key.toLowerCase() === "p" || event.key === " ") {
      event.preventDefault();
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
    }
  }

  function handleKeyUp(event) {
    const direction = directionForKey(event.key);
    if (!direction) return;
    event.preventDefault();
    heldDirections.delete(direction);
    updatePressedButtons();
  }

  function bindDirectionButton(button) {
    const direction = button.dataset.direction;
    const press = (event) => {
      event.preventDefault();
      ensureAudioContext();
      if (game.state !== "playing") return;
      heldDirections.add(direction);
      button.setPointerCapture?.(event.pointerId);
      updatePressedButtons();
    };
    const release = (event) => {
      event.preventDefault();
      heldDirections.delete(direction);
      updatePressedButtons();
    };
    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function beginSwipe(event) {
    if (game.state !== "playing" || stick.pointer !== null) return;
    event.preventDefault();
    stick.pointer = event.pointerId;
    stick.startX = event.clientX;
    stick.startY = event.clientY;
    stick.turn = 0;
    stick.forward = 0;
    try {
      elements.canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // Certains navigateurs refusent la capture : le joystick marche quand même.
    }
    ensureAudioContext();
    const frame = elements.boardFrame.getBoundingClientRect();
    elements.touchStick.style.left = `${event.clientX - frame.left}px`;
    elements.touchStick.style.top = `${event.clientY - frame.top}px`;
    elements.touchStick.style.setProperty("--knob-x", "0px");
    elements.touchStick.style.setProperty("--knob-y", "0px");
    elements.touchStick.classList.add("is-active");
  }

  function moveSwipe(event) {
    if (event.pointerId !== stick.pointer || game.state !== "playing") return;
    const radius = CONTROLS.stickRadius;
    let dx = event.clientX - stick.startX;
    let dy = event.clientY - stick.startY;
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    const deadZone = 0.12;
    const soften = (value) =>
      Math.abs(value) < deadZone ? 0 : Math.sign(value) * ((Math.abs(value) - deadZone) / (1 - deadZone));
    stick.turn = soften(dx / radius);
    stick.forward = soften(-dy / radius);
    elements.touchStick.style.setProperty("--knob-x", `${dx}px`);
    elements.touchStick.style.setProperty("--knob-y", `${dy}px`);
  }

  function endSwipe(event) {
    if (event.pointerId !== stick.pointer) return;
    releaseStick();
  }

  function releaseStick() {
    stick.pointer = null;
    stick.turn = 0;
    stick.forward = 0;
    elements.touchStick?.classList.remove("is-active");
  }

  function openHelp() {
    helpPausedGame = game.state === "playing";
    if (helpPausedGame) pauseGame(false);
    if (typeof elements.helpDialog.showModal === "function") elements.helpDialog.showModal();
    else elements.helpDialog.setAttribute("open", "");
  }

  function closeHelp() {
    if (elements.helpDialog.open && typeof elements.helpDialog.close === "function") elements.helpDialog.close();
    else elements.helpDialog.removeAttribute("open");
    if (helpPausedGame && game.state === "paused") resumeGame();
    helpPausedGame = false;
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    });
  }

  function bindEvents() {
    elements.primaryAction.addEventListener("click", handlePrimaryAction);
    elements.shareButton.addEventListener("click", shareScore);
    elements.pauseButton.addEventListener("click", () => {
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
    });
    elements.soundButton.addEventListener("click", toggleSound);
    elements.helpButton.addEventListener("click", openHelp);
    elements.helpClose.addEventListener("click", closeHelp);
    elements.helpPlay.addEventListener("click", closeHelp);
    elements.helpDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeHelp();
    });
    elements.directionButtons.forEach(bindDirectionButton);
    elements.canvas.addEventListener("pointerdown", beginSwipe);
    elements.canvas.addEventListener("pointermove", moveSwipe);
    elements.canvas.addEventListener("pointerup", endSwipe);
    elements.canvas.addEventListener("pointercancel", endSwipe);
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && game.state === "playing") pauseGame();
    });
  }

  async function initialize() {
    elements.bestValue.textContent = formatScore(bestScore);
    elements.soundButton.setAttribute("aria-pressed", String(soundEnabled));
    elements.soundButton.setAttribute("aria-label", soundEnabled ? "Couper le son" : "Activer le son");
    bindEvents();
    try {
      world3d = createWorld({
        canvas: elements.canvas,
        radarCanvas: elements.radarCanvas,
        labelLayer: elements.labelLayer,
        world: WORLD,
      });
      world3d.setLevel(currentLevel());
    } catch (error) {
      console.error(error);
      showOverlay({
        kicker: "3D INDISPONIBLE",
        title: "OUPS…",
        message: "Ton navigateur ne peut pas afficher la 3D (WebGL). Essaie avec Chrome, Safari ou Firefox à jour.",
        button: "RÉESSAYER",
        action: "reload",
      });
    }
    resizeCanvas();
    updateInterface();
    registerServiceWorker();
    lastFrameAt = performance.now();
    if (!animationFrameId) animationFrameId = window.requestAnimationFrame(loop);
  }

  // Mode test (ajouter ?debug à l'adresse) : donne accès à l'état du jeu
  // depuis la console du navigateur. Inactif en temps normal.
  if (new URLSearchParams(window.location.search).has("debug")) {
    window.chatSouris = {
      get game() {
        return game;
      },
      setupLevel,
      hideOverlay,
      triggerTrap,
      update,
      draw,
      levels: LEVELS,
    };
  }

  initialize();
})();
