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
      seconds: 55,
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
      seconds: 52,
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
      seconds: 49,
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
  };

  const context = elements.canvas.getContext("2d");
  const celebrationContext = elements.celebrationCanvas.getContext("2d");
  const images = {};
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
  let swipeDirection = null;
  let swipePointer = null;
  let swipeStart = null;
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

  async function loadAssets() {
    await Promise.all(
      Object.entries(imageSources).map(
        ([key, source]) =>
          new Promise((resolve) => {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => resolve();
            image.onerror = () => resolve();
            image.src = source;
            images[key] = image;
          }),
      ),
    );
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
    swipeDirection = null;
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
    const magnitude = Math.hypot(input.x, input.y);

    if (magnitude > 0) {
      const velocityX = (input.x / magnitude) * level.playerSpeed;
      const velocityY = (input.y / magnitude) * level.playerSpeed;
      moveCircle(player, velocityX * delta, velocityY * delta, player.radius);
      player.angle = Math.atan2(velocityY, velocityX);
      player.moving = true;
      player.bob += delta * 11;
    } else {
      player.moving = false;
      player.bob += delta * 3;
    }
  }

  function readInputVector() {
    const vector = { x: 0, y: 0 };
    const directions = new Set(heldDirections);
    if (swipeDirection) directions.add(swipeDirection);
    if (directions.has("left")) vector.x -= 1;
    if (directions.has("right")) vector.x += 1;
    if (directions.has("up")) vector.y -= 1;
    if (directions.has("down")) vector.y += 1;
    return vector;
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
      if (distance(player.x, player.y, mouse.x, mouse.y) > player.radius + mouse.radius) continue;
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
    if (distance(player.x, player.y, gold.x, gold.y) > player.radius + gold.radius) return;

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
    swipeDirection = null;
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
    elements.canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
    elements.canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
    context.setTransform(canvasScale * pixelRatio, 0, 0, canvasScale * pixelRatio, 0, 0);

    elements.celebrationCanvas.width = elements.canvas.width;
    elements.celebrationCanvas.height = elements.canvas.height;
    celebrationContext.setTransform(canvasScale * pixelRatio, 0, 0, canvasScale * pixelRatio, 0, 0);
  }

  function draw(timestamp, delta) {
    context.save();
    context.setTransform(canvasScale * pixelRatio, 0, 0, canvasScale * pixelRatio, 0, 0);
    context.clearRect(0, 0, WORLD.width, WORLD.height);
    drawRoom(timestamp);
    drawHiddenGoldenMouse(timestamp);
    currentLevel().obstacles.forEach((obstacle, index) => drawObstacle(obstacle, index));
    game.mice.forEach((mouse) => drawMouse(mouse, false, timestamp));
    if (game.goldMouse && !game.goldMouse.hidden) drawMouse(game.goldMouse, true, timestamp);
    drawPlayer(timestamp);
    if (game.trap) drawTrap(timestamp);
    drawParticles();
    drawFloatTexts();
    context.restore();
    drawCelebration();
  }

  function drawRoom(timestamp) {
    const level = currentLevel();
    const gradient = context.createLinearGradient(0, 0, WORLD.width, WORLD.height);
    gradient.addColorStop(0, level.floor[0]);
    gradient.addColorStop(1, level.floor[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD.width, WORLD.height);

    context.save();
    context.globalAlpha = 0.13;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    const spacing = 42;
    if (level.id === "salon") {
      for (let x = -WORLD.height; x < WORLD.width; x += spacing) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + WORLD.height, WORLD.height);
        context.stroke();
      }
    } else if (level.id === "cuisine") {
      for (let x = 0; x < WORLD.width; x += 70) {
        for (let y = 0; y < WORLD.height; y += 70) {
          context.globalAlpha = ((x + y) / 70) % 2 === 0 ? 0.16 : 0.06;
          context.fillStyle = "#ffffff";
          context.fillRect(x, y, 70, 70);
        }
      }
    } else {
      for (let y = 0; y < WORLD.height; y += 34) {
        context.beginPath();
        context.moveTo(0, y + Math.sin(timestamp / 700 + y) * 3);
        context.lineTo(WORLD.width, y + Math.cos(timestamp / 800 + y) * 3);
        context.stroke();
      }
    }
    context.restore();

    drawRug(level.rug);
    drawWalls(level);
    drawRoomDetails(level, timestamp);
  }

  function drawWalls(level) {
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.18)";
    context.fillRect(18, 18, WORLD.width - 36, 23);
    context.fillRect(18, 18, 23, WORLD.height - 36);
    context.fillStyle = level.wall;
    context.fillRect(0, 0, WORLD.width, 24);
    context.fillRect(0, 0, 24, WORLD.height);
    context.fillRect(0, WORLD.height - 24, WORLD.width, 24);
    context.fillRect(WORLD.width - 24, 0, 24, WORLD.height);
    context.fillStyle = "rgba(255,255,255,.34)";
    context.fillRect(24, 24, WORLD.width - 48, 4);
    context.restore();
  }

  function drawRug(rug) {
    context.save();
    context.shadowColor = "rgba(27, 11, 55, 0.25)";
    context.shadowBlur = 20;
    context.shadowOffsetY = 10;
    fillRoundedRect(rug.x, rug.y, rug.width, rug.height, 46, rug.color);
    context.shadowColor = "transparent";
    context.globalAlpha = 0.15;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 5;
    for (let inset = 18; inset < 72; inset += 17) {
      strokeRoundedRect(rug.x + inset, rug.y + inset, rug.width - inset * 2, rug.height - inset * 2, 34);
    }
    context.restore();
  }

  function drawRoomDetails(level, timestamp) {
    context.save();
    if (level.id === "salon") {
      drawPicture(500, 54, 100, 48, "#ffd34e", "#ff5da8");
      drawBall(586, 575, 18, timestamp, ["#ffd34e", "#ff5da8"]);
    } else if (level.id === "cuisine") {
      drawPlate(365, 195, "#ff5da8");
      drawPlate(550, 198, "#44e5e7");
      drawBall(615, 610, 16, timestamp, ["#44e5e7", "#9d6cff"]);
    } else {
      drawPicture(548, 46, 72, 48, "#44e5e7", "#ffd34e");
      drawBall(590, 595, 17, timestamp, ["#ff5da8", "#ffd34e"]);
      context.globalAlpha = 0.32;
      context.fillStyle = "#fff";
      for (let index = 0; index < 8; index += 1) {
        const x = 580 + index * 28;
        const y = 215 + Math.sin(timestamp / 400 + index) * 4;
        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();
  }

  function drawPicture(x, y, width, height, colorOne, colorTwo) {
    context.save();
    context.shadowColor = "rgba(0,0,0,.22)";
    context.shadowBlur = 10;
    context.shadowOffsetY = 5;
    fillRoundedRect(x, y, width, height, 8, "#fff5e5");
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, colorOne);
    gradient.addColorStop(1, colorTwo);
    fillRoundedRect(x + 7, y + 7, width - 14, height - 14, 5, gradient);
    context.restore();
  }

  function drawBall(x, y, radius, timestamp, colors) {
    context.save();
    context.translate(x, y + Math.sin(timestamp / 430) * 2);
    context.rotate(timestamp / 1200);
    const gradient = context.createLinearGradient(-radius, -radius, radius, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.fillStyle = gradient;
    context.shadowColor = "rgba(0,0,0,.28)";
    context.shadowBlur = 8;
    context.shadowOffsetY = 5;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.55)";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, radius * 0.72, -1, 1.7);
    context.stroke();
    context.restore();
  }

  function drawPlate(x, y, color) {
    context.save();
    context.fillStyle = "rgba(0,0,0,.18)";
    context.beginPath();
    context.ellipse(x, y + 5, 27, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff9ec";
    context.beginPath();
    context.ellipse(x, y, 27, 14, 0, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.beginPath();
    context.ellipse(x, y, 19, 9, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function drawObstacle(obstacle, index) {
    context.save();
    context.shadowColor = "rgba(18, 10, 45, 0.32)";
    context.shadowBlur = 18;
    context.shadowOffsetY = 11;
    fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20, "rgba(22, 13, 45, .22)");
    context.shadowColor = "transparent";

    switch (obstacle.type) {
      case "sofa":
      case "armchair":
        drawSeat(obstacle);
        break;
      case "coffee":
      case "dining":
        drawTable(obstacle);
        break;
      case "tv":
        drawTelevision(obstacle);
        break;
      case "plant":
        drawPlant(obstacle);
        break;
      case "counter":
      case "island":
        drawCounter(obstacle);
        break;
      case "fridge":
        drawFridge(obstacle);
        break;
      case "pantry":
      case "dresser":
      case "nightstand":
        drawCabinet(obstacle);
        break;
      case "bed":
        drawBed(obstacle);
        break;
      case "ottoman":
        drawOttoman(obstacle);
        break;
      case "wardrobe":
        drawWardrobe(obstacle);
        break;
      default:
        fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 18, obstacle.color);
        break;
    }

    if (game.goldMouse?.hidden && game.goldMouse.coverObstacle === index) {
      context.save();
      context.globalAlpha = 0.5 + Math.sin(game.goldMouse.revealPulse * 5) * 0.18;
      context.strokeStyle = "#fff3a6";
      context.lineWidth = 4;
      context.shadowColor = "#ffd34e";
      context.shadowBlur = 14;
      const sideX = clamp(game.goldMouse.x, obstacle.x, obstacle.x + obstacle.width);
      const sideY = clamp(game.goldMouse.y, obstacle.y, obstacle.y + obstacle.height);
      context.beginPath();
      context.arc(sideX, sideY, 11, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    context.restore();
  }

  function drawSeat(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y, width, height, 22, darken(color, 0.18));
    fillRoundedRect(x + 9, y + 8, width - 18, height - 20, 18, color);
    context.fillStyle = "rgba(255,255,255,.18)";
    fillRoundedRect(x + 14, y + 13, width - 28, 13, 7, "rgba(255,255,255,.18)");
    const cushionGap = 7;
    const count = width > 200 ? 3 : 1;
    const cushionWidth = (width - 30 - cushionGap * (count - 1)) / count;
    for (let index = 0; index < count; index += 1) {
      const cushionX = x + 15 + index * (cushionWidth + cushionGap);
      fillRoundedRect(cushionX, y + 34, cushionWidth, height - 48, 14, lighten(color, 0.08));
      strokeRoundedRect(cushionX, y + 34, cushionWidth, height - 48, 14, "rgba(255,255,255,.16)", 2);
    }
  }

  function drawTable(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x + 7, y + 10, width - 14, height - 8, 17, darken(color, 0.25));
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, lighten(color, 0.18));
    gradient.addColorStop(1, color);
    fillRoundedRect(x, y, width, height - 12, 17, gradient);
    strokeRoundedRect(x + 8, y + 8, width - 16, height - 28, 12, "rgba(255,255,255,.25)", 3);
  }

  function drawTelevision(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y + 15, width, height - 15, 12, color);
    const screenGradient = context.createLinearGradient(x, y, x + width, y + height);
    screenGradient.addColorStop(0, "#171440");
    screenGradient.addColorStop(1, "#071c33");
    fillRoundedRect(x + 17, y, width - 34, height - 15, 9, screenGradient);
    context.fillStyle = "rgba(68,229,231,.28)";
    context.beginPath();
    context.moveTo(x + 27, y + 8);
    context.lineTo(x + width - 30, y + 8);
    context.lineTo(x + width - 70, y + height - 22);
    context.lineTo(x + 46, y + height - 22);
    context.closePath();
    context.fill();
  }

  function drawPlant(obstacle) {
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    context.save();
    context.translate(centerX, centerY);
    for (let index = 0; index < 9; index += 1) {
      context.save();
      context.rotate((index / 9) * Math.PI * 2);
      context.fillStyle = index % 2 ? "#45bb78" : obstacle.color;
      context.beginPath();
      context.ellipse(0, -24, 13, 30, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    context.fillStyle = "#ff9868";
    context.beginPath();
    context.arc(0, 7, 24, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "rgba(255,255,255,.25)";
    context.beginPath();
    context.arc(-7, 1, 7, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawCounter(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x + 4, y + 10, width - 8, height - 5, 15, darken(color, 0.2));
    const gradient = context.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, lighten(color, 0.12));
    gradient.addColorStop(1, color);
    fillRoundedRect(x, y, width, height - 14, 14, gradient);
    context.fillStyle = "rgba(255,255,255,.3)";
    fillRoundedRect(x + 12, y + 11, width - 24, 9, 4, "rgba(255,255,255,.3)");
    if (obstacle.type === "island") {
      context.fillStyle = "#c9dfe4";
      context.beginPath();
      context.ellipse(x + width * 0.72, y + height * 0.38, 35, 20, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(0,0,0,.2)";
      context.lineWidth = 4;
      context.stroke();
    }
  }

  function drawFridge(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y, width, height, 17, darken(color, 0.17));
    fillRoundedRect(x + 5, y + 5, width - 10, height - 12, 14, color);
    context.strokeStyle = "rgba(255,255,255,.45)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x + 8, y + height * 0.58);
    context.lineTo(x + width - 8, y + height * 0.58);
    context.stroke();
    fillRoundedRect(x + 13, y + 22, 5, 34, 3, "rgba(20,35,60,.35)");
  }

  function drawCabinet(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y + 7, width, height - 3, 13, darken(color, 0.2));
    fillRoundedRect(x, y, width, height - 10, 13, color);
    const drawerCount = width > 130 ? 3 : 2;
    for (let index = 0; index < drawerCount; index += 1) {
      const drawerX = x + 10 + index * ((width - 20) / drawerCount);
      const drawerWidth = (width - 26) / drawerCount;
      strokeRoundedRect(drawerX, y + 12, drawerWidth, height - 32, 7, "rgba(255,255,255,.25)", 2);
      context.fillStyle = "rgba(24,18,58,.5)";
      context.beginPath();
      context.arc(drawerX + drawerWidth / 2, y + height / 2 - 3, 3, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawBed(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y + 11, width, height - 4, 23, darken(color, 0.25));
    fillRoundedRect(x, y, width, height - 14, 23, color);
    const blanketGradient = context.createLinearGradient(x, y, x + width, y + height);
    blanketGradient.addColorStop(0, lighten(color, 0.2));
    blanketGradient.addColorStop(1, darken(color, 0.08));
    fillRoundedRect(x + 18, y + 65, width - 36, height - 91, 18, blanketGradient);
    fillRoundedRect(x + 22, y + 19, width * 0.38, 50, 17, "#fff4e8");
    fillRoundedRect(x + width * 0.56, y + 19, width * 0.36, 50, 17, "#fff4e8");
    context.globalAlpha = 0.16;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 4;
    for (let line = 0; line < 4; line += 1) {
      context.beginPath();
      context.moveTo(x + 35, y + 94 + line * 26);
      context.lineTo(x + width - 35, y + 94 + line * 26);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function drawOttoman(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x, y + 9, width, height - 3, 26, darken(color, 0.22));
    fillRoundedRect(x, y, width, height - 11, 26, color);
    context.fillStyle = "rgba(255,255,255,.18)";
    context.beginPath();
    context.arc(x + width / 2, y + height / 2 - 7, 6, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.14)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x + 17, y + height / 2 - 7);
    context.lineTo(x + width - 17, y + height / 2 - 7);
    context.moveTo(x + width / 2, y + 12);
    context.lineTo(x + width / 2, y + height - 23);
    context.stroke();
  }

  function drawWardrobe(obstacle) {
    const { x, y, width, height, color } = obstacle;
    fillRoundedRect(x + 7, y + 8, width - 2, height - 1, 14, darken(color, 0.24));
    fillRoundedRect(x, y, width, height - 10, 14, color);
    context.strokeStyle = "rgba(255,255,255,.24)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x + width / 2, y + 10);
    context.lineTo(x + width / 2, y + height - 22);
    context.stroke();
    context.fillStyle = "rgba(21,16,58,.56)";
    context.beginPath();
    context.arc(x + width / 2 - 9, y + height / 2, 4, 0, Math.PI * 2);
    context.arc(x + width / 2 + 9, y + height / 2, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawHiddenGoldenMouse(timestamp) {
    const mouse = game.goldMouse;
    if (!mouse?.hidden) return;
    context.save();
    context.globalAlpha = 0.52 + Math.sin(timestamp / 240) * 0.1;
    drawMouse(mouse, true, timestamp, 0.9);
    context.restore();
  }

  function drawMouse(mouse, golden, timestamp, scale = 1) {
    const image = golden ? images.goldMouse : images.grayMouse;
    const bob = Math.sin(mouse.bob || timestamp / 190) * 2.4;
    const width = golden ? 70 : 63;
    const height = golden ? 30 : 27;
    drawEntityShadow(mouse.x, mouse.y + 10, width * 0.33, height * 0.3, golden ? "rgba(255,190,0,.28)" : "rgba(38,32,69,.25)");
    if (golden) drawGoldAura(mouse.x, mouse.y, timestamp, mouse.hidden ? 0.45 : 1);
    drawImageCentered(image, mouse.x, mouse.y + bob, width, height, mouse.angle, scale, 1);
  }

  function drawGoldAura(x, y, timestamp, alpha) {
    context.save();
    context.translate(x, y);
    context.globalAlpha = alpha;
    for (let index = 0; index < 5; index += 1) {
      const angle = timestamp / 620 + (index / 5) * Math.PI * 2;
      const radius = 30 + Math.sin(timestamp / 260 + index) * 4;
      const sparkleX = Math.cos(angle) * radius;
      const sparkleY = Math.sin(angle) * radius * 0.55;
      context.fillStyle = index % 2 ? "#fff8bd" : "#ffd34e";
      context.beginPath();
      context.arc(sparkleX, sparkleY, 2.2, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawPlayer() {
    const player = game.player;
    const bob = Math.sin(player.bob) * (player.moving ? 3 : 1.2);
    const alpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0 ? 0.46 : 1;
    drawEntityShadow(player.x, player.y + 21, 48, 16, "rgba(30,18,58,.3)");
    drawImageCentered(images.hero, player.x, player.y + bob, 128, 87, player.angle, 1, alpha);
  }

  function drawTrap(timestamp) {
    const trap = game.trap;
    if (!trap) return;
    const time = trap.elapsed;

    if (time < 0.68) {
      const goldProgress = 1 - smoothstep(0.18, 0.68, time);
      const goldScale = 0.8 + Math.sin(time * 24) * 0.18;
      drawGoldAura(trap.startX, trap.startY, timestamp, goldProgress);
      drawImageCentered(images.goldMouse, trap.startX, trap.startY, 76, 33, trap.goldAngle, goldScale * goldProgress, goldProgress);
    }

    const reveal = smoothstep(0.2, 0.78, time);
    const approach = smoothstep(0.68, 1.16, time);
    const retreat = smoothstep(1.65, 2.24, time);
    const villainX = lerp(trap.startX, trap.targetX, approach) + Math.cos(trap.angle + Math.PI) * retreat * 72;
    const villainY = lerp(trap.startY, trap.targetY, approach) + Math.sin(trap.angle + Math.PI) * retreat * 72;
    const villainScale = Math.max(0, reveal * (1 - retreat * 0.6));
    const lunge = time > 1.02 && time < 1.35 ? Math.sin(((time - 1.02) / 0.33) * Math.PI) * 22 : 0;
    const drawX = villainX + Math.cos(trap.angle) * lunge;
    const drawY = villainY + Math.sin(trap.angle) * lunge;
    drawEntityShadow(drawX, drawY + 25, 64 * villainScale, 19 * villainScale, "rgba(20,10,36,.4)");
    drawImageCentered(images.villain, drawX, drawY, 162, 108, trap.angle, villainScale, Math.max(0, 1 - retreat));

    if (time > 1.08 && time < 1.48) drawSwipe(trap, time);
  }

  function drawSwipe(trap, time) {
    const progress = clamp((time - 1.08) / 0.4, 0, 1);
    context.save();
    context.translate(game.player.x, game.player.y);
    context.rotate(trap.angle);
    context.globalAlpha = Math.sin(progress * Math.PI);
    context.strokeStyle = "#ffffff";
    context.shadowColor = "#ff426d";
    context.shadowBlur = 16;
    context.lineWidth = 7;
    context.lineCap = "round";
    for (let index = 0; index < 3; index += 1) {
      context.beginPath();
      context.arc(0, 0, 42 + index * 11, -1.05, 0.62);
      context.stroke();
    }
    context.restore();
  }

  function drawEntityShadow(x, y, radiusX, radiusY, color) {
    context.save();
    context.fillStyle = color;
    context.filter = "blur(4px)";
    context.beginPath();
    context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawImageCentered(image, x, y, width, height, angle, scale = 1, alpha = 1) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.scale(scale, scale);
    context.globalAlpha *= alpha;
    if (image?.complete && image.naturalWidth > 0) {
      context.drawImage(image, -width / 2, -height / 2, width, height);
    } else {
      context.fillStyle = "#fff";
      context.beginPath();
      context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawParticles() {
    game.particles.forEach((particle) => {
      const opacity = clamp(particle.life / particle.maximumLife, 0, 1);
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = opacity;
      context.fillStyle = particle.color;
      context.shadowColor = particle.color;
      context.shadowBlur = 6;
      fillRoundedRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size, 2, particle.color);
      context.restore();
    });
  }

  function drawFloatTexts() {
    game.floatTexts.forEach((item) => {
      const opacity = clamp(item.life / item.maximumLife, 0, 1);
      context.save();
      context.globalAlpha = opacity;
      context.fillStyle = item.color;
      context.strokeStyle = "rgba(19, 10, 45, .55)";
      context.lineWidth = 6;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `950 ${Math.round(24 * item.scale)}px Inter, system-ui, sans-serif`;
      context.strokeText(item.text, item.x, item.y);
      context.fillText(item.text, item.x, item.y);
      context.restore();
    });
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

  function fillRoundedRect(x, y, width, height, radius, fill) {
    context.beginPath();
    roundedRectanglePath(context, x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
  }

  function strokeRoundedRect(x, y, width, height, radius, stroke = context.strokeStyle, lineWidth = context.lineWidth) {
    context.beginPath();
    roundedRectanglePath(context, x, y, width, height, radius);
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  function roundedRectanglePath(target, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    target.moveTo(x + safeRadius, y);
    target.lineTo(x + width - safeRadius, y);
    target.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    target.lineTo(x + width, y + height - safeRadius);
    target.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    target.lineTo(x + safeRadius, y + height);
    target.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    target.lineTo(x, y + safeRadius);
    target.quadraticCurveTo(x, y, x + safeRadius, y);
    target.closePath();
  }

  function lighten(hex, amount) {
    return mixHex(hex, "#ffffff", amount);
  }

  function darken(hex, amount) {
    return mixHex(hex, "#090822", amount);
  }

  function mixHex(colorOne, colorTwo, amount) {
    const first = parseHex(colorOne);
    const second = parseHex(colorTwo);
    const mix = (key) => Math.round(first[key] + (second[key] - first[key]) * amount);
    return `rgb(${mix("red")}, ${mix("green")}, ${mix("blue")})`;
  }

  function parseHex(hex) {
    const value = hex.replace("#", "");
    const normalized = value.length === 3 ? value.split("").map((character) => character + character).join("") : value;
    return {
      red: Number.parseInt(normalized.slice(0, 2), 16),
      green: Number.parseInt(normalized.slice(2, 4), 16),
      blue: Number.parseInt(normalized.slice(4, 6), 16),
    };
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
    if (game.state !== "playing") return;
    swipePointer = event.pointerId;
    swipeStart = { x: event.clientX, y: event.clientY };
    swipeDirection = null;
    elements.canvas.setPointerCapture?.(event.pointerId);
    ensureAudioContext();
  }

  function moveSwipe(event) {
    if (event.pointerId !== swipePointer || !swipeStart || game.state !== "playing") return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    if (Math.hypot(dx, dy) < 16) return;
    swipeDirection = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
  }

  function endSwipe(event) {
    if (event.pointerId !== swipePointer) return;
    swipePointer = null;
    swipeStart = null;
    swipeDirection = null;
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
    resizeCanvas();
    updateInterface();
    registerServiceWorker();
    await loadAssets();
    lastFrameAt = performance.now();
    if (!animationFrameId) animationFrameId = window.requestAnimationFrame(loop);
  }

  initialize();
})();
