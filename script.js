
// Countdown target: 29 November 2026, 12:00 AM India Standard Time.
const TARGET_TIME = new Date("2026-11-26T00:00:00+05:30").getTime();
const $ = (id) => document.getElementById(id);

const screens = [
  "countdownScreen",
  "introScreen",
  "gameScreen",
  "finalScreen",
  "celebrationScreen",
];

let player = { name: "", age: 0, hits: 0 };
let surpriseUnlocked = false;

let targets = [];
let arrows = [];
let gameStarted = false;
let animationFrame = 0;
let audioCtx = null;
let musicPlaying = false;
let musicTimer = null;
let toastTimer = null;

function showScreen(id) {
  screens.forEach((s) => $(s).classList.toggle("active", s === id));
  if (id === "gameScreen") resizeCanvas();
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function updateCountdown() {
  const remaining = TARGET_TIME - Date.now();

  if (remaining <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach(
      (id) => ($(id).textContent = "00")
    );

    if (!surpriseUnlocked) {
      surpriseUnlocked = true;
      showScreen("introScreen");
    }
    return;
  }

  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  $("days").textContent = pad(d);
  $("hours").textContent = pad(h);
  $("minutes").textContent = pad(m);
  $("seconds").textContent = pad(s);
}

function createSparkles() {
  const field = $("sparkleField");

  for (let i = 0; i < 42; i++) {
    const el = document.createElement("span");
    el.className = "sparkle";
    el.textContent = Math.random() > 0.5 ? "✦" : "·";
    el.style.left = Math.random() * 100 + "%";
    el.style.top = Math.random() * 100 + "%";
    el.style.setProperty("--dur", 2 + Math.random() * 4 + "s");
    el.style.setProperty("--delay", -Math.random() * 5 + "s");
    el.style.fontSize = 8 + Math.random() * 12 + "px";
    field.appendChild(el);
  }
}

function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1450);
}

// PLAYER DETAILS
$("detailsForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("personName").value.trim();
  const age = Number($("personAge").value);

  if (!name || !Number.isInteger(age) || age < 1 || age > 100) {
    toast("Please enter a name and an age from 1 to 100.");
    return;
  }

  player = { name, age, hits: 0 };

  $("playerName").textContent = name;
  $("goalCount").textContent = age;
  $("hitCount").textContent = "0";
  $("neededText").textContent = age;
  $("finalNameTop").textContent = name.toUpperCase();

  showScreen("gameScreen");
  prepareGame();

  setTimeout(() => {
    resizeCanvas();
    startGame();
  }, 80);
});

// GAME CANVAS
const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 1000;
let H = 560;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round((rect.width * 560) / 1000 * dpr);

  ctx.setTransform(
    canvas.width / 1000,
    0,
    0,
    canvas.height / 560,
    0,
    0
  );
}

window.addEventListener("resize", resizeCanvas);

function heartPath(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.34);

  ctx.bezierCurveTo(
    x - size * 1.05,
    y - size * 0.25,
    x - size * 0.58,
    y - size * 0.95,
    x,
    y - size * 0.45
  );

  ctx.bezierCurveTo(
    x + size * 0.58,
    y - size * 0.95,
    x + size * 1.05,
    y - size * 0.25,
    x,
    y + size * 0.34
  );

  ctx.closePath();
}

function makeTargets() {
  targets = [];

  const count = Math.min(Math.max(player.age, 1), 100);

  const cols = Math.min(8, Math.ceil(Math.sqrt(count * 1.65)));
  const rows = Math.ceil(count / cols);

  const spacingX = Math.min(112, 760 / Math.max(1, cols));
  const spacingY = Math.min(94, 380 / Math.max(1, rows));

  const startX = (W - (cols - 1) * spacingX) / 2;
  const startY = Math.max(100, (H - (rows - 1) * spacingY) / 2 - 15);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    targets.push({
      x: startX + col * spacingX + (row % 2 ? spacingX * 0.12 : 0),
      y: startY + row * spacingY,
      size: Math.max(15, Math.min(27, 30 - (cols > 6 ? 4 : 0))),
      alive: true,
      phase: Math.random() * 6.28,
      number: i + 1,
    });
  }
}

function prepareGame() {
  gameStarted = false;
  arrows = [];

  makeTargets();
  drawGame();

  $("gameOverlay").classList.remove("hidden");
  $("gameMessage").textContent = "Your first heart is waiting...";
}

function startGame() {
  gameStarted = true;
  $("gameOverlay").classList.add("hidden");

  cancelAnimationFrame(animationFrame);
  loop();
}

$("startGameBtn").addEventListener("click", startGame);

function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);

  g.addColorStop(0, "#3b1930");
  g.addColorStop(1, "#1c1021");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 70; i++) {
    const x = (i * 137) % W;
    const y = (i * 79) % H;

    ctx.fillStyle = `rgba(255,190,215,${0.08 + 0.08 * Math.sin(t / 800 + i)})`;

    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255,190,215,.06)";
  ctx.fillRect(0, H - 75, W, 75);

  ctx.strokeStyle = "rgba(255,194,216,.12)";
  ctx.setLineDash([5, 10]);

  ctx.beginPath();
  ctx.moveTo(40, H - 70);
  ctx.lineTo(W - 40, H - 70);
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawTarget(target, t) {
  if (!target.alive) return;

  const bob = Math.sin(t / 600 + target.phase) * 4;
  const x = target.x;
  const y = target.y + bob;
  const s = target.size;

  ctx.save();

  ctx.shadowColor = "#ff6e9e";
  ctx.shadowBlur = 22;

  heartPath(x, y, s);

  const g = ctx.createLinearGradient(x - s, y - s, x + s, y + s);

  g.addColorStop(0, "#ffd3e0");
  g.addColorStop(0.48, "#ff8db0");
  g.addColorStop(1, "#dc4c83");

  ctx.fillStyle = g;
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,239,245,.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.font = "10px DM Sans";
  ctx.textAlign = "center";
  ctx.fillText("♥", x, y + 3);

  ctx.restore();
}

const bowAnchor = { x: 110, y: H - 85 };

let dragState = null;
let bursts = [];

const cheers = [
  "Super thango ❤️",
  "Aptitha chello 🥰",
  "Theramasaalitha.. 💗",
  "Parra... 😍",
  "Adengappa... 🔥",
];

function playHitTone() {
  try {
    const ac = getAudio();
    note(659.25, ac.currentTime, 0.18, 0.05);
    note(880, ac.currentTime + 0.09, 0.2, 0.04);
  } catch (e) {}
}

function canvasPoint(event) {
  const r = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - r.left) / r.width) * W,
    y: ((event.clientY - r.top) / r.height) * H,
  };
}

function drawBow() {
  const x = bowAnchor.x;
  const y = bowAnchor.y;

  ctx.save();

  ctx.strokeStyle = "#e7b2c6";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(x, y - 62);
  ctx.quadraticCurveTo(x + 48, y, x, y + 62);
  ctx.stroke();

  ctx.strokeStyle = "#ffe8ef";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x, y - 62);

  if (dragState) ctx.lineTo(dragState.x, dragState.y);
  else ctx.lineTo(x, y);

  ctx.lineTo(x, y + 62);
  ctx.stroke();

  ctx.restore();
}

function drawArrow(a) {
  ctx.save();

  ctx.translate(a.x, a.y);
  ctx.rotate(a.angle);

  ctx.strokeStyle = "#ffe6ed";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(27, 0);
  ctx.stroke();

  ctx.fillStyle = "#ff91b4";

  ctx.beginPath();
  ctx.moveTo(32, 0);
  ctx.lineTo(20, -7);
  ctx.lineTo(22, 0);
  ctx.lineTo(20, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff9fbd";

  ctx.beginPath();
  ctx.moveTo(-25, 0);
  ctx.lineTo(-34, -8);
  ctx.lineTo(-31, 0);
  ctx.lineTo(-34, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTrajectory() {
  if (!dragState) return;

  const dx = bowAnchor.x - dragState.x;
  const dy = bowAnchor.y - dragState.y;
  const p = Math.hypot(dx, dy);

  if (p < 8) return;

  const speed = Math.min(115, p) * 0.22;
  const vx = (dx / p) * speed;
  const vy = (dy / p) * speed;

  ctx.save();

  ctx.fillStyle = "rgba(255,190,215,.7)";

  for (let i = 1; i <= 18; i++) {
    const tt = i * 0.16;
    const px = bowAnchor.x + vx * tt;
    const py = bowAnchor.y + vy * tt + 0.5 * 0.22 * tt * tt;

    if (py > H - 10) break;

    ctx.globalAlpha = 1 - i / 22;

    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGame(t = performance.now()) {
  drawBackground(t);

  targets.forEach((target) => drawTarget(target, t));
  arrows.forEach(drawArrow);

  drawBow();
  drawTrajectory();

  ctx.fillStyle = "rgba(255,232,240,.85)";
  ctx.font = "bold 13px DM Sans";
  ctx.textAlign = "left";

  ctx.fillText(
    dragState ? "RELEASE TO SHOOT" : "PULL BACK • AIM • RELEASE",
    28,
    32
  );

  bursts.forEach((b) => {
    ctx.save();

    ctx.globalAlpha = Math.max(0, 1 - b.life / 24);
    ctx.fillStyle = "#ff9fbd";

    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;

      ctx.beginPath();
      ctx.arc(
        b.x + Math.cos(a) * b.life * 1.5,
        b.y + Math.sin(a) * b.life * 1.5,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  });
}

function registerHit(target) {
  target.alive = false;
  bursts.push({ x: target.x, y: target.y, life: 0 });

  player.hits++;

  $("hitCount").textContent = player.hits;

  const line = cheers[(player.hits - 1) % cheers.length];

  $("gameMessage").textContent = line;
  toast(line);

  playHitTone();

  if (player.hits >= player.age) {
    gameStarted = false;
    setTimeout(() => showScreen("finalScreen"), 850);
  }
}

function updateArrows() {
  const gravity = 0.22;

  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];

    a.vy += gravity;
    a.x += a.vx;
    a.y += a.vy;
    a.angle = Math.atan2(a.vy, a.vx);

    const tipX = a.x + Math.cos(a.angle) * 32;
    const tipY = a.y + Math.sin(a.angle) * 32;

    let hit = null;

    for (const target of targets) {
      if (!target.alive) continue;

      const ty =
        target.y + Math.sin(performance.now() / 600 + target.phase) * 4;

      if (Math.hypot(target.x - tipX, ty - tipY) < target.size + 8) {
        hit = target;
        break;
      }
    }

    if (hit) {
      arrows.splice(i, 1);
      registerHit(hit);
      continue;
    }

    a.life++;

    if (
      a.x > W + 60 ||
      a.x < -60 ||
      a.y > H + 60 ||
      a.y < -80 ||
      a.life > 180
    ) {
      arrows.splice(i, 1);
    }
  }

  bursts.forEach((b) => b.life++);
  bursts = bursts.filter((b) => b.life < 24);
}

function loop(t) {
  if (!gameStarted) return;

  updateArrows();
  drawGame(t);

  animationFrame = requestAnimationFrame(loop);
}

function onAimStart(event) {
  if (!gameStarted || dragState) return;

  const p = canvasPoint(event);

  if (Math.hypot(p.x - bowAnchor.x, p.y - bowAnchor.y) > 95) return;

  dragState = {
    x: p.x,
    y: p.y,
    pointerId: event.pointerId,
  };

  canvas.setPointerCapture?.(event.pointerId);

  event.preventDefault();
  drawGame();
}

function onAimMove(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const p = canvasPoint(event);

  const dx = p.x - bowAnchor.x;
  const dy = p.y - bowAnchor.y;

  const len = Math.hypot(dx, dy);
  const max = 115;

  if (len > max) {
    p.x = bowAnchor.x + (dx / len) * max;
    p.y = bowAnchor.y + (dy / len) * max;
  }

  dragState.x = p.x;
  dragState.y = p.y;

  drawGame();
}

function onAimEnd(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const dx = bowAnchor.x - dragState.x;
  const dy = bowAnchor.y - dragState.y;

  const pull = Math.hypot(dx, dy);

  dragState = null;

  if (pull < 12) {
    drawGame();
    return;
  }

  const speed = Math.min(115, pull) * 0.22;

  arrows.push({
    x: bowAnchor.x,
    y: bowAnchor.y,
    vx: (dx / pull) * speed,
    vy: (dy / pull) * speed,
    angle: Math.atan2(dy, dx),
    life: 0,
  });

  $("gameMessage").textContent = "Arrow released! 🎯";

  drawGame();
}

canvas.addEventListener("pointerdown", onAimStart);
canvas.addEventListener("pointermove", onAimMove);
canvas.addEventListener("pointerup", onAimEnd);
canvas.addEventListener("pointercancel", onAimEnd);

// FINAL SHOT
function finalShot() {
  playHitTone();

  for (let i = 0; i < 26; i++) {
    spawnHeart($("celebrationBg"), true);
  }

  setTimeout(() => {
    showScreen("celebrationScreen");
    startConfetti();
  }, 500);
}

$("finalHitBtn").addEventListener("click", finalShot);

// FLOATING HEARTS
function spawnHeart(parent, fast = false) {
  const el = document.createElement("span");

  el.className = "heart-particle";
  el.textContent = ["♥", "♡", "✦", "❤"][
    Math.floor(Math.random() * 4)
  ];

  el.style.left = Math.random() * 100 + "%";
  el.style.fontSize = 12 + Math.random() * 27 + "px";

  el.style.setProperty(
    "--fall",
    (fast ? 2.2 : 4 + Math.random() * 5) + "s"
  );

  el.style.setProperty(
    "--drift",
    Math.random() * 180 - 90 + "px"
  );

  parent.appendChild(el);

  setTimeout(() => el.remove(), 10000);
}

let confettiTimer = null;

function startConfetti() {
  clearInterval(confettiTimer);

  for (let i = 0; i < 55; i++) {
    setTimeout(() => spawnHeart($("celebrationBg")), i * 65);
  }

  confettiTimer = setInterval(() => {
    if ($("celebrationScreen").classList.contains("active")) {
      spawnHeart($("celebrationBg"));
    }
  }, 250);
}

// ORIGINAL BIRTHDAY MELODY
function getAudio() {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext || window.webkitAudioContext
    )();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return audioCtx;
}

function note(freq, start, duration, volume = 0.055, wave = "sine") {
  const ac = getAudio();

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = wave;
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(start);
  osc.stop(start + duration + 0.03);
}

const romantic = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880, 698.46,
  523.25, 659.25, 783.99, 1046.5,
];

const birthday = [
  523.25, 523.25, 587.33, 523.25,
  698.46, 659.25, 523.25, 523.25,
  587.33, 523.25, 783.99, 698.46,
];

function playMelody() {
  stopMelody();

  const ac = getAudio();

  let index = 0;
  const sequence = romantic.concat(birthday);

  musicPlaying = true;

  $("musicToggle").textContent = "♫ Pause birthday melody";
  $("musicToggle").setAttribute("aria-pressed", "true");

  function tick() {
    if (!musicPlaying) return;

    const now = ac.currentTime;
    const freq = sequence[index % sequence.length];

    note(freq, now, 0.34, 0.045);

    if (index % 2 === 0) {
      note(freq / 2, now, 0.5, 0.018, "triangle");
    }

    index++;

    if (index >= sequence.length) {
      index = 0;
      musicTimer = setTimeout(tick, 700);
    } else {
      musicTimer = setTimeout(
        tick,
        index < romantic.length ? 360 : 420
      );
    }
  }

  tick();
}

function stopMelody() {
  musicPlaying = false;
  clearTimeout(musicTimer);

  $("musicToggle").textContent = "♫ Play your birthday melody";
  $("musicToggle").setAttribute("aria-pressed", "false");
}

$("musicToggle").addEventListener("click", () => {
  if (musicPlaying) {
    stopMelody();
  } else {
    playMelody();
  }
});

// REPLAY BUTTON
$("replayBtn").addEventListener("click", () => {
  stopMelody();

  candlesBlown = false;
  blowFrames = 0;

  document.querySelectorAll(".candle i").forEach((flame) => {
    flame.classList.remove("blown");
  });

  $("micButton").textContent = "🎤 Enable Laptop Microphone";
  $("blowMessage").textContent =
    "Make a wish and blow the candles! 💗";

  player.hits = 0;
  player.name = "";
  player.age = 0;

  $("personName").value = "";
  $("personAge").value = "";

  $("celebrationBg").innerHTML = "";

  clearInterval(confettiTimer);

  updateCountdown();

  if (Date.now() >= TARGET_TIME) {
    showScreen("introScreen");
  }
});

// CURSOR HEART EFFECT
(() => {
  const symbols = ["♥", "♡", "❤"];
  const colors = ["#ff7da8", "#ffb5ca", "#ffd3e0", "#ff8fb3"];

  let lastTime = 0;

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    const now = performance.now();

    if (now - lastTime < 38) return;
    lastTime = now;

    const heart = document.createElement("span");

    heart.className = "cursor-heart";

    heart.textContent =
      symbols[Math.floor(Math.random() * symbols.length)];

    heart.style.left = event.clientX + "px";
    heart.style.top = event.clientY + "px";

    heart.style.setProperty(
      "--heart-size",
      12 + Math.random() * 13 + "px"
    );

    heart.style.setProperty(
      "--heart-color",
      colors[Math.floor(Math.random() * colors.length)]
    );

    document.body.appendChild(heart);

    heart.addEventListener(
      "animationend",
      () => heart.remove(),
      { once: true }
    );
  });
})();

// INITIALIZE
createSparkles();
updateCountdown();
setInterval(updateCountdown, 250);

// ====================================
// LAPTOP MICROPHONE - BLOW CANDLES
// ====================================

let micStream = null;
let blowAudioContext = null;
let blowAnalyser = null;
let blowFrames = 0;
let candlesBlown = false;

async function startMic() {
  if (candlesBlown) return;

  if (!navigator.mediaDevices?.getUserMedia) {
    alert(
      "Microphone access needs localhost or HTTPS. Open this website using Live Server."
    );
    return;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    blowAudioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    await blowAudioContext.resume();

    const source =
      blowAudioContext.createMediaStreamSource(micStream);

    blowAnalyser = blowAudioContext.createAnalyser();

    blowAnalyser.fftSize = 2048;
    blowAnalyser.smoothingTimeConstant = 0.15;

    source.connect(blowAnalyser);

    $("micButton").textContent =
      "🎤 Microphone Ready — Blow Now!";

    $("blowMessage").textContent =
      "Blow towards your laptop microphone! 💨";

    blowFrames = 0;

    detectBlow();

  } catch (error) {
    console.error("Microphone Error:", error);

    if (error.name === "NotAllowedError") {
      alert(
        "Microphone permission denied. Allow microphone access in browser settings."
      );
    } else if (error.name === "NotFoundError") {
      alert(
        "Laptop microphone not detected. Check your microphone device."
      );
    } else if (error.name === "NotReadableError") {
      alert(
        "Microphone is being used by another app. Close that app and try again."
      );
    } else {
      alert(
        "Microphone Error: " +
        error.name +
        "\n" +
        error.message
      );
    }
  }
}

function detectBlow() {
  if (!blowAnalyser || candlesBlown) return;

  const data = new Uint8Array(blowAnalyser.fftSize);

  blowAnalyser.getByteTimeDomainData(data);

  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const sample = (data[i] - 128) / 128;
    sum += sample * sample;
  }

  const volume = Math.sqrt(sum / data.length);

  // Microphone sensitivity threshold
  if (volume > 0.055) {
    blowFrames++;
  } else {
    blowFrames = Math.max(0, blowFrames - 1);
  }

  // Detect sustained blowing
  if (blowFrames >= 14) {
    blowOutCandles();
    return;
  }

  requestAnimationFrame(detectBlow);
}

function blowOutCandles() {
  if (candlesBlown) return;

  candlesBlown = true;

  // Turn off all 3 candle flames
  document.querySelectorAll(".candle i").forEach((flame) => {
    flame.classList.add("blown");
  });

  $("blowMessage").textContent =
    "Wish granted! Happy Birthday! ❤️";

  $("micButton").textContent = "❤️ Wish Granted!";

  // Stop microphone
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }

  // Close microphone audio context
  if (blowAudioContext) {
    blowAudioContext.close();
    blowAudioContext = null;
  }

  blowAnalyser = null;

  // Play the original birthday melody after candles go out
  setTimeout(() => {
    playMelody();
  }, 800);
}
