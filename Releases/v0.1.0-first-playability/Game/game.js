"use strict";

const canvas = document.getElementById("game");
const resourcesEl = document.getElementById("resources");
const buildButtonsEl = document.getElementById("buildButtons");
const runInfoEl = document.getElementById("runInfo");
const objectiveEl = document.getElementById("objective");
const currentGoalEl = document.getElementById("currentGoal");
const nextStepEl = document.getElementById("nextStep");
const statusAlertsEl = document.getElementById("statusAlerts");
const resourceGuideEl = document.getElementById("resourceGuide");
const stationDataEl = document.getElementById("stationData");
const selectedCellPanelEl = document.getElementById("selectedCellPanel");
const selectedCellInfoEl = document.getElementById("selectedCellInfo");
const metaStatsEl = document.getElementById("metaStats");
const toastEl = document.getElementById("toast");

const CELL = 30;
const SAVE_KEY = "star-ring-station-meta-v1";
const ASYNC_KEY = "star-ring-station-async-v1";
const PLAYER_SCALE_KEY = "star-ring-station-players-v1";

const TYPES = {
  core: {
    name: "核心",
    cost: {},
    hp: 280,
    color: [0.82, 0.94, 1.0, 1],
    desc: "默认产出"
  },
  frame: {
    name: "框架",
    cost: { metal: 8 },
    hp: 70,
    color: [0.25, 0.52, 0.72, 0.95],
    desc: "扩展结构"
  },
  power: {
    name: "发电站",
    cost: { metal: 22, ore: 8 },
    hp: 105,
    powerOut: 10,
    color: [1.0, 0.78, 0.22, 1],
    desc: "+10 电力"
  },
  thruster: {
    name: "推进器",
    cost: { metal: 26, gas: 8 },
    hp: 90,
    powerUse: 2,
    priority: 80,
    color: [0.3, 0.8, 1.0, 1],
    desc: "按位置施力"
  },
  mining: {
    name: "采矿站",
    cost: { metal: 28, ore: 10 },
    hp: 95,
    powerUse: 3,
    priority: 60,
    color: [0.68, 0.9, 0.55, 1],
    desc: "近天体采集"
  },
  processor: {
    name: "金属加工",
    cost: { metal: 24, ore: 16 },
    hp: 90,
    powerUse: 2,
    priority: 45,
    color: [0.76, 0.72, 0.64, 1],
    desc: "矿石转金属"
  },
  plasma: {
    name: "等离子",
    cost: { metal: 36, gas: 18 },
    hp: 92,
    powerUse: 3,
    priority: 48,
    color: [0.8, 0.35, 1.0, 1],
    desc: "气体转等离子"
  },
  research: {
    name: "研发中心",
    cost: { metal: 45, plasma: 8 },
    hp: 85,
    powerUse: 4,
    priority: 35,
    color: [0.55, 0.68, 1.0, 1],
    desc: "解锁升级"
  },
  turret: {
    name: "炮塔",
    cost: { metal: 35, ore: 12 },
    hp: 85,
    powerUse: 3,
    priority: 70,
    color: [1.0, 0.42, 0.35, 1],
    desc: "自动射击"
  },
  missile: {
    name: "导弹井",
    cost: { metal: 46, gas: 12 },
    hp: 100,
    powerUse: 1,
    priority: 65,
    color: [1.0, 0.58, 0.22, 1],
    desc: "手动齐射"
  },
  shield: {
    name: "护盾",
    cost: { metal: 50, plasma: 10 },
    hp: 105,
    powerUse: 5,
    priority: 75,
    color: [0.34, 1.0, 0.94, 1],
    desc: "定向拦截"
  },
  armor: {
    name: "装甲",
    cost: { metal: 20 },
    hp: 220,
    color: [0.58, 0.65, 0.74, 1],
    desc: "高耐久"
  },
  repair: {
    name: "维修站",
    cost: { metal: 44, plasma: 6 },
    hp: 92,
    powerUse: 4,
    priority: 55,
    color: [0.3, 1.0, 0.55, 1],
    desc: "释放无人机"
  }
};

const FACILITY_ORDER = [
  "frame",
  "power",
  "thruster",
  "mining",
  "processor",
  "plasma",
  "research",
  "turret",
  "missile",
  "shield",
  "armor",
  "repair"
];

const WEAPON_TYPES = new Set(["turret", "missile", "shield"]);

const MINING_RANGE_OFFSET = 130;

const PLAYER_PHYSICS = {
  keyboardThrust: 108,
  thrusterThrust: 110,
  massPerCell: 0.2,
  linearDamping: 0.18,
  angularDamping: 0.55
};

const PIRATE_AI = {
  desiredDistance: 360,
  separationAccel: 34
};

const SPAWN_ASTEROID_CHANCE_EARLY = 0.22;
const SPAWN_ASTEROID_CHANCE_LATE = 0.38;
const SPAWN_ASTEROID_RAMP_SEC = 300;

const COLLISION_FEEL = {
  asteroidCellDamage: 18,
  pirateCellDamage: 8,
  enemyBounce: 130
};

const RESOURCE_VISUAL = {
  ore: { ring: [0.95, 0.62, 0.22, 1], label: "矿石", css: "ore" },
  metal: { ring: [0.72, 0.78, 0.88, 1], label: "金属", css: "metal" },
  gas: { ring: [0.35, 0.92, 0.72, 1], label: "气体", css: "gas" },
  plasma: { ring: [0.85, 0.38, 1.0, 1], label: "等离子", css: "plasma" }
};

const state = {
  paused: false,
  time: 0,
  lastTime: performance.now(),
  camera: { x: 0, y: 0, zoom: 1 },
  selectedBuild: "frame",
  selectedCell: null,
  uiBound: false,
  hud: {
    timer: 0,
    resources: "",
    objective: "",
    guideGoal: "",
    guideNext: "",
    alerts: "",
    resourceGuide: "",
    status: "",
    selected: "",
    meta: "",
    runInfo: "",
    asyncText: ""
  },
  target: null,
  drag: null,
  toastTimer: 0,
  run: {
    level: 0,
    objective: null,
    objectiveCompleteAt: 0,
    completedObjectives: 0,
    playerCount: loadPlayerCount()
  },
  resources: { metal: 130, ore: 60, gas: 35, plasma: 8, research: 0 },
  power: { available: 0, used: 0 },
  meta: loadMeta(),
  asyncEnabled: localStorage.getItem(ASYNC_KEY) !== "false",
  station: {
    pos: { x: -780, y: -260 },
    vel: { x: 0, y: 0 },
    angle: 0,
    angularVel: 0,
    cells: new Map(),
    techLevel: 0,
    hullMod: 1,
    thrustMod: 1,
    weaponMod: 1
  },
  stars: [],
  bodies: [],
  enemies: [],
  projectiles: [],
  repairDrones: [],
  virtualCursor: { x: -780, y: -260, active: false },
  input: {
    moveKeys: new Set(),
    mouseWorld: null,
    controlMode: "screen"
  },
  lastBuildError: "",
  particles: [],
  fireCooldown: 0,
  spawnTimer: 22
};

function loadMeta() {
  const base = {
    points: 0,
    mining: 0,
    hull: 0,
    weapons: 0,
    unlocks: {
      weaponFrame: false,
      efficientCore: false
    }
  };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
  } catch {
    return base;
  }
}

function loadPlayerCount() {
  try {
    const saved = Number(localStorage.getItem(PLAYER_SCALE_KEY));
    return Number.isFinite(saved) ? clamp(Math.round(saved), 1, 4) : 1;
  } catch {
    return 1;
  }
}

function saveMeta() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state.meta));
  } catch {
    showToast("浏览器阻止了存档写入，本局仍可继续游玩。");
  }
}

function showToast(message, duration = 2.8) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  state.toastTimer = duration;
}

function setBuildError(message) {
  state.lastBuildError = message;
  showToast(message, 4.2);
}

function clearBuildError() {
  state.lastBuildError = "";
}

function isMoveKey(key) {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown"
    || key === "w" || key === "a" || key === "s" || key === "d";
}

function getControlModeLabel(mode = state.input.controlMode) {
  return mode === "heading" ? "朝向前方" : "屏幕方向";
}

function getKeyboardThrustLocal() {
  const keys = state.input.moveKeys;
  let x = 0;
  let y = 0;
  if (keys.has("w") || keys.has("ArrowUp")) y -= 1;
  if (keys.has("s") || keys.has("ArrowDown")) y += 1;
  if (keys.has("a") || keys.has("ArrowLeft")) x -= 1;
  if (keys.has("d") || keys.has("ArrowRight")) x += 1;
  if (x === 0 && y === 0) return null;
  return normalize({ x, y });
}

function getKeyboardThrustScreen() {
  return getKeyboardThrustLocal();
}

function getKeyboardThrustHeading() {
  const local = getKeyboardThrustLocal();
  return local ? rotate(local, state.station.angle) : null;
}

function getKeyboardThrustWorld() {
  if (state.input.controlMode === "heading") {
    return getKeyboardThrustHeading();
  }
  return getKeyboardThrustScreen();
}

function hasKeyboardThrust() {
  return Boolean(getKeyboardThrustWorld());
}

function getMoveControlHint() {
  if (state.input.controlMode === "heading") {
    return "WASD 沿舰站当前朝向移动";
  }
  return "WASD 按屏幕方向移动（W 上 / S 下 / A 左 / D 右）";
}

function updateControlModeUi() {
  const button = document.getElementById("toggleControlModeBtn");
  if (!button) return;
  button.textContent = `移动: ${getControlModeLabel()}`;
  button.classList.toggle("active", state.input.controlMode === "screen");
  button.dataset.mode = state.input.controlMode;
}

function toggleControlMode() {
  state.input.controlMode = state.input.controlMode === "screen" ? "heading" : "screen";
  updateControlModeUi();
  showToast(`移动模式已切换为「${getControlModeLabel()}」。${getMoveControlHint()}。`);
  updateHud();
}

function updateMouseAim(dt) {
  if (state.drag?.moved || !state.input.mouseWorld) return;
  const toMouse = {
    x: state.input.mouseWorld.x - state.station.pos.x,
    y: state.input.mouseWorld.y - state.station.pos.y
  };
  if (length(toMouse) < 24) return;
  const desired = Math.atan2(toMouse.x, -toMouse.y);
  let delta = desired - state.station.angle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const turnRate = 7.5;
  state.station.angle += delta * clamp(dt * turnRate, 0, 1);
  state.station.angularVel *= 1 - clamp(dt * 4, 0, 0.85);
}

function key(x, y) {
  return `${x},${y}`;
}

function parseKey(cellKey) {
  const [x, y] = cellKey.split(",").map(Number);
  return { x, y };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function length(v) {
  return Math.hypot(v.x, v.y);
}

function normalize(v) {
  const len = length(v) || 1;
  return { x: v.x / len, y: v.y / len };
}

function rotate(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function createCell(x, y, facility) {
  const def = TYPES[facility] || TYPES.frame;
  return {
    x,
    y,
    facility,
    frameHp: 70 * (1 + state.meta.hull * 0.1),
    hp: def.hp * (1 + state.meta.hull * 0.1),
    maxHp: def.hp * (1 + state.meta.hull * 0.1),
    enabled: true,
    active: facility === "core" || facility === "frame" || facility === "armor",
    detached: false,
    priority: def.priority || 10,
    reload: 0,
    fire: 0
  };
}

function initStation() {
  const cells = state.station.cells;
  const core = createCell(0, 0, "core");
  core.hp = 280 * (1 + state.meta.hull * 0.1);
  core.maxHp = core.hp;
  core.frameHp = 260;
  cells.set(key(0, 0), core);
  cells.set(key(1, 0), createCell(1, 0, "frame"));
  cells.set(key(-1, 0), createCell(-1, 0, "frame"));
  cells.set(key(0, 1), createCell(0, 1, "frame"));
  cells.set(key(0, -1), createCell(0, -1, "frame"));
}

function initWorld() {
  state.stars = [];
  for (let i = 0; i < 360; i++) {
    state.stars.push({
      x: rand(-2600, 2600),
      y: rand(-2200, 2200),
      r: rand(0.7, 2.0),
      a: rand(0.28, 0.9)
    });
  }
  state.bodies = [
    { type: "star", name: "灼阳", x: 0, y: 0, r: 130, color: [1, 0.74, 0.18, 1], resource: "plasma", amount: 9999 },
    { type: "planet", name: "蓝锈星", x: 760, y: -420, r: 95, color: [0.25, 0.58, 0.95, 1], resource: "ore", amount: 1200 },
    { type: "planet", name: "雾气巨行星", x: -1180, y: 480, r: 150, color: [0.5, 0.78, 0.68, 1], resource: "gas", amount: 1800 },
    { type: "asteroid", name: "碎矿带 A", x: -520, y: 320, r: 35, color: [0.62, 0.58, 0.52, 1], resource: "ore", amount: 520 },
    { type: "asteroid", name: "碎矿带 B", x: 1180, y: 360, r: 42, color: [0.55, 0.5, 0.45, 1], resource: "metal", amount: 360 },
    { type: "asteroid", name: "碎矿带 C", x: 280, y: 820, r: 26, color: [0.66, 0.6, 0.52, 1], resource: "ore", amount: 400 }
  ];
}

function createObjective() {
  const choices = [
    { type: "mine", text: "采集 90 单位资源", target: 90, progress: 0 },
    { type: "explore", text: "抵达信标区域", target: 1, progress: 0, beacon: { x: rand(700, 1300), y: rand(-850, 850) } },
    { type: "battle", text: "击毁 6 个敌对目标", target: 6, progress: 0 },
    { type: "survive", text: "坚持 180 秒并保持核心存活", target: 180, progress: 0 }
  ];
  const objective = choices[state.run.level % choices.length];
  state.run.objective = structuredClone(objective);
  state.run.objectiveCompleteAt = 0;
}

function initGame() {
  initStation();
  initWorld();
  createObjective();
  createBuildUi();
  bindInput();
  updateControlModeUi();
  updateHud();
  showToast("核心已上线。默认「屏幕方向」移动（W=上）；点右侧「移动模式」可切换为朝向前方。鼠标指向决定朝向。");
}

class Renderer {
  constructor(targetCanvas) {
    this.canvas = targetCanvas;
    this.gl = targetCanvas.getContext("webgl", { antialias: true, alpha: false });
    if (!this.gl) {
      throw new Error("当前浏览器不支持 WebGL。");
    }
    this.contextLost = false;
    this.initGlResources();
    this.vertices = [];
    this.maxFloats = 120000;
    this.resize();
    window.addEventListener("resize", () => this.resize());
    targetCanvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.resumeAfterContextRestore = !state.paused;
      state.paused = true;
      document.getElementById("pauseBtn").textContent = "继续";
      showToast("WebGL 上下文已丢失，等待浏览器恢复。");
      state.toastTimer = 999;
    });
    targetCanvas.addEventListener("webglcontextrestored", () => {
      this.gl = targetCanvas.getContext("webgl", { antialias: true, alpha: false });
      this.contextLost = false;
      this.initGlResources();
      this.resize();
      if (this.resumeAfterContextRestore) {
        state.paused = false;
        document.getElementById("pauseBtn").textContent = "暂停";
      }
      showToast("WebGL 已恢复。");
    });
  }

  initGlResources() {
    this.program = this.createProgram();
    this.buffer = this.gl.createBuffer();
    this.positionLocation = this.gl.getAttribLocation(this.program, "aPosition");
    this.colorLocation = this.gl.getAttribLocation(this.program, "aColor");
  }

  createProgram() {
    const vertex = `
      attribute vec2 aPosition;
      attribute vec4 aColor;
      varying vec4 vColor;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
        vColor = aColor;
      }
    `;
    const fragment = `
      precision mediump float;
      varying vec4 vColor;
      void main() {
        gl_FragColor = vColor;
      }
    `;
    const gl = this.gl;
    const vs = this.compile(gl.VERTEX_SHADER, vertex);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
    return program;
  }

  compile(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    if (this.contextLost) return;
    this.gl.viewport(0, 0, width, height);
  }

  begin() {
    this.vertices.length = 0;
    if (this.contextLost) return;
    const gl = this.gl;
    gl.clearColor(0.012, 0.022, 0.048, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  worldToClip(p) {
    const sx = (p.x - state.camera.x) * state.camera.zoom + this.width / 2;
    const sy = (p.y - state.camera.y) * state.camera.zoom + this.height / 2;
    return {
      x: sx / this.width * 2 - 1,
      y: 1 - sy / this.height * 2
    };
  }

  screenToWorld(p) {
    return {
      x: (p.x * this.dpr - this.width / 2) / state.camera.zoom + state.camera.x,
      y: (p.y * this.dpr - this.height / 2) / state.camera.zoom + state.camera.y
    };
  }

  pushVertex(p, color) {
    const clip = this.worldToClip(p);
    this.vertices.push(clip.x, clip.y, color[0], color[1], color[2], color[3]);
  }

  triangle(a, b, c, color) {
    this.pushVertex(a, color);
    this.pushVertex(b, color);
    this.pushVertex(c, color);
  }

  rect(center, width, height, angle, color) {
    const hw = width / 2;
    const hh = height / 2;
    const corners = [
      rotate({ x: -hw, y: -hh }, angle),
      rotate({ x: hw, y: -hh }, angle),
      rotate({ x: hw, y: hh }, angle),
      rotate({ x: -hw, y: hh }, angle)
    ].map((p) => ({ x: p.x + center.x, y: p.y + center.y }));
    this.triangle(corners[0], corners[1], corners[2], color);
    this.triangle(corners[0], corners[2], corners[3], color);
  }

  circle(center, radius, color, segments = 28) {
    for (let i = 0; i < segments; i++) {
      const a0 = i / segments * Math.PI * 2;
      const a1 = (i + 1) / segments * Math.PI * 2;
      this.triangle(
        center,
        { x: center.x + Math.cos(a0) * radius, y: center.y + Math.sin(a0) * radius },
        { x: center.x + Math.cos(a1) * radius, y: center.y + Math.sin(a1) * radius },
        color
      );
    }
  }

  ring(center, radius, width, color, segments = 48) {
    for (let i = 0; i < segments; i++) {
      const a0 = i / segments * Math.PI * 2;
      const a1 = (i + 1) / segments * Math.PI * 2;
      const p0 = { x: center.x + Math.cos(a0) * radius, y: center.y + Math.sin(a0) * radius };
      const p1 = { x: center.x + Math.cos(a1) * radius, y: center.y + Math.sin(a1) * radius };
      const p2 = { x: center.x + Math.cos(a1) * (radius + width), y: center.y + Math.sin(a1) * (radius + width) };
      const p3 = { x: center.x + Math.cos(a0) * (radius + width), y: center.y + Math.sin(a0) * (radius + width) };
      this.triangle(p0, p1, p2, color);
      this.triangle(p0, p2, p3, color);
    }
  }

  line(a, b, width, color) {
    const dir = normalize({ x: b.x - a.x, y: b.y - a.y });
    const n = { x: -dir.y * width / 2, y: dir.x * width / 2 };
    const p0 = { x: a.x + n.x, y: a.y + n.y };
    const p1 = { x: b.x + n.x, y: b.y + n.y };
    const p2 = { x: b.x - n.x, y: b.y - n.y };
    const p3 = { x: a.x - n.x, y: a.y - n.y };
    this.triangle(p0, p1, p2, color);
    this.triangle(p0, p2, p3, color);
  }

  flush() {
    const gl = this.gl;
    if (this.contextLost || !this.vertices.length) return;
    const data = new Float32Array(this.vertices);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    const stride = 6 * 4;
    gl.enableVertexAttribArray(this.positionLocation);
    gl.enableVertexAttribArray(this.colorLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(this.colorLocation, 4, gl.FLOAT, false, stride, 2 * 4);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
  }
}

let renderer;

function createBuildUi() {
  buildButtonsEl.innerHTML = "";
  const pointer = document.createElement("button");
  pointer.type = "button";
  pointer.className = "build-button";
  pointer.textContent = "指针/航行";
  pointer.addEventListener("click", () => {
    state.selectedBuild = null;
    state.selectedCell = null;
    clearBuildError();
    updateBuildButtons();
    updateHud();
  });
  buildButtonsEl.appendChild(pointer);

  for (const type of FACILITY_ORDER) {
    const def = TYPES[type];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "build-button";
    button.dataset.type = type;
    button.innerHTML = `${def.name}<small>${formatCost(getBuildCost(type))} / ${def.desc}</small>`;
    button.addEventListener("click", () => {
      state.selectedBuild = type;
      state.selectedCell = null;
      updateBuildButtons();
    });
    buildButtonsEl.appendChild(button);
  }
  updateBuildButtons();

  if (state.uiBound) return;
  state.uiBound = true;

  document.getElementById("pauseBtn").addEventListener("click", () => {
    state.paused = !state.paused;
    document.getElementById("pauseBtn").textContent = state.paused ? "继续" : "暂停";
  });
  document.getElementById("missileBtn").addEventListener("click", fireMissiles);
  document.getElementById("toggleAsyncBtn").addEventListener("click", () => {
    state.asyncEnabled = !state.asyncEnabled;
    try {
      localStorage.setItem(ASYNC_KEY, String(state.asyncEnabled));
    } catch {
      showToast("浏览器阻止了异步对战设置保存，本局已临时生效。");
    }
    updateHud();
  });
  document.getElementById("rotateLeftBtn").addEventListener("click", () => {
    state.station.angularVel -= 0.55;
  });
  document.getElementById("rotateRightBtn").addEventListener("click", () => {
    state.station.angularVel += 0.55;
  });
  document.getElementById("toggleControlModeBtn").addEventListener("click", toggleControlMode);
  document.getElementById("toggleSelectedBtn").addEventListener("click", () => window.gameActions.toggleSelected());
  document.getElementById("prioritySelectedBtn").addEventListener("click", () => window.gameActions.prioritySelected());
  document.getElementById("talentMiningBtn").addEventListener("click", () => window.gameActions.buyTalent("mining"));
  document.getElementById("talentHullBtn").addEventListener("click", () => window.gameActions.buyTalent("hull"));
  document.getElementById("talentWeaponsBtn").addEventListener("click", () => window.gameActions.buyTalent("weapons"));
  document.getElementById("unlockCoreBtn").addEventListener("click", () => window.gameActions.buyUnlock("efficientCore"));
  document.getElementById("unlockWeaponFrameBtn").addEventListener("click", () => window.gameActions.buyUnlock("weaponFrame"));
  document.getElementById("playersBtn").addEventListener("click", () => window.gameActions.setPlayers());
}

function updateBuildButtons() {
  for (const button of buildButtonsEl.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.type === state.selectedBuild || (!button.dataset.type && state.selectedBuild === null));
  }
  buildButtonsEl.closest(".build-panel")?.classList.toggle("build-mode-active", Boolean(state.selectedBuild));
}

function formatCost(cost = {}) {
  const parts = Object.entries(cost).map(([name, value]) => `${shortResource(name)}${value}`);
  return parts.length ? parts.join(" ") : "免费";
}

function shortResource(name) {
  return {
    metal: "金属",
    ore: "矿",
    gas: "气",
    plasma: "等离子",
    research: "科研"
  }[name] || name;
}

function getHarvestableBodies() {
  return state.bodies.filter((body) => body.resource && body.amount > 0);
}

function getMiningRange(body) {
  return body.r + MINING_RANGE_OFFSET;
}

function getNearestResourceBody(from = state.station.pos) {
  let best = null;
  let bestDist = Infinity;
  for (const body of getHarvestableBodies()) {
    const distance = dist(from, body);
    if (distance < bestDist) {
      best = body;
      bestDist = distance;
    }
  }
  if (!best) return null;
  return { body: best, distance: bestDist, range: getMiningRange(best) };
}

function getMiningStationStatus() {
  const miners = [...state.station.cells.values()].filter((cell) => cell.facility === "mining" && !cell.detached);
  const activeMiners = miners.filter((cell) => cell.active && cell.enabled);
  const inactivePower = miners.filter((cell) => cell.enabled && !cell.active);
  const manualOff = miners.filter((cell) => !cell.enabled);
  const harvesting = [];
  for (const cell of activeMiners) {
    const position = cellWorldPosition(cell);
    const body = state.bodies.find((candidate) => candidate.amount > 0 && dist(position, candidate) < getMiningRange(candidate));
    if (body) harvesting.push({ cell, body, resource: body.resource });
  }
  return { miners, activeMiners, inactivePower, manualOff, harvesting };
}

function getMiningCellTarget(cell) {
  if (!cell || cell.facility !== "mining" || cell.detached) return null;
  const position = cellWorldPosition(cell);
  const body = state.bodies.find((candidate) => candidate.amount > 0 && dist(position, candidate) < getMiningRange(candidate));
  if (!body) return null;
  return { body, distance: dist(position, body), range: getMiningRange(body) };
}

function bindInput() {
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    state.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false
    };
  });

  canvas.addEventListener("pointermove", (event) => {
    state.input.mouseWorld = renderer.screenToWorld({ x: event.clientX, y: event.clientY });
    if (!state.drag || state.drag.id !== event.pointerId) return;
    const dx = event.clientX - state.drag.lastX;
    const dy = event.clientY - state.drag.lastY;
    if (Math.hypot(event.clientX - state.drag.x, event.clientY - state.drag.y) > 7) {
      state.drag.moved = true;
    }
    if (state.drag.moved) {
      state.station.angle += dx * 0.006;
      state.station.angularVel += dx * 0.0008;
      state.camera.zoom = clamp(state.camera.zoom * (1 - dy * 0.0008), 0.55, 1.35);
    }
    state.drag.lastX = event.clientX;
    state.drag.lastY = event.clientY;
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!state.drag || state.drag.id !== event.pointerId) return;
    const wasClick = !state.drag.moved;
    state.drag = null;
    if (wasClick) {
      handleCanvasClick({ x: event.clientX, y: event.clientY });
    }
  });

  canvas.addEventListener("pointercancel", () => {
    state.drag = null;
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (isMoveKey(key)) {
      state.input.moveKeys.add(key);
      event.preventDefault();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      const world = state.input.mouseWorld || state.virtualCursor;
      handleWorldClick(world);
      event.preventDefault();
    } else if (event.key === "Escape") {
      state.selectedBuild = null;
      state.selectedCell = null;
      clearBuildError();
      updateBuildButtons();
      updateHud();
    } else if (/^[1-90\-=]$/.test(event.key)) {
      const hotkeyIndex = event.key === "0" ? 9 : event.key === "-" ? 10 : event.key === "=" ? 11 : Number(event.key) - 1;
      const type = FACILITY_ORDER[hotkeyIndex];
      if (type) {
        state.selectedBuild = type;
        state.selectedCell = null;
        clearBuildError();
        updateBuildButtons();
        updateHud();
      }
    }
  });

  window.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (isMoveKey(key)) {
      state.input.moveKeys.delete(key);
      event.preventDefault();
    }
  });

  window.addEventListener("blur", () => {
    state.input.moveKeys.clear();
  });
}

function handleCanvasClick(screen) {
  const world = renderer.screenToWorld(screen);
  state.virtualCursor.x = world.x;
  state.virtualCursor.y = world.y;
  state.virtualCursor.active = false;
  handleWorldClick(world);
}

function handleWorldClick(world) {
  const grid = worldToGrid(world);
  const cellKey = key(grid.x, grid.y);
  const cell = state.station.cells.get(cellKey);

  if (state.selectedBuild) {
    buildAt(grid.x, grid.y, state.selectedBuild);
    if (cell) {
      state.selectedCell = cellKey;
    }
    updateHud();
    return;
  }

  if (cell) {
    state.selectedCell = cellKey;
    updateHud();
    return;
  }

  state.target = world;
  showToast("航行目标已设定，推进器将按结构自动出力。");
  updateHud();
}

function worldToGrid(world) {
  const local = rotate({ x: world.x - state.station.pos.x, y: world.y - state.station.pos.y }, -state.station.angle);
  return { x: Math.round(local.x / CELL), y: Math.round(local.y / CELL) };
}

function cellWorldPosition(cell) {
  const p = rotate({ x: cell.x * CELL, y: cell.y * CELL }, state.station.angle);
  const drift = cell.detached && cell.drift ? cell.drift : { x: 0, y: 0 };
  return { x: state.station.pos.x + p.x + drift.x, y: state.station.pos.y + p.y + drift.y };
}

function canPay(cost = {}) {
  return Object.entries(cost).every(([name, value]) => state.resources[name] >= value);
}

function pay(cost = {}) {
  for (const [name, value] of Object.entries(cost)) {
    state.resources[name] -= value;
  }
}

function getBuildCost(facility) {
  const base = TYPES[facility]?.cost || {};
  const discount = state.meta.unlocks.weaponFrame && WEAPON_TYPES.has(facility) ? 0.8 : 1;
  return Object.fromEntries(
    Object.entries(base).map(([name, value]) => [name, Math.ceil(value * discount)])
  );
}

function buildAt(x, y, facility) {
  const cellKey = key(x, y);
  const existing = state.station.cells.get(cellKey);
  if (facility === "frame") {
    if (existing) {
      state.selectedCell = cellKey;
      setBuildError("该格已有结构，建造模式仍保持；可查看右侧信息或继续点空格建造。");
      return false;
    }
    if (!hasConnectedNeighbor(x, y)) {
      setBuildError("框架必须连接到核心或已连接结构。");
      return false;
    }
    if (!canPay(TYPES.frame.cost)) {
      setBuildError("金属不足，核心会缓慢补给；建造模式已保持。");
      return false;
    }
    pay(TYPES.frame.cost);
    state.station.cells.set(cellKey, createCell(x, y, "frame"));
    reconnectDetached(x, y);
    clearBuildError();
    showToast("框架已扩展。");
    return true;
  }

  if (!existing || existing.facility !== "frame" || existing.detached) {
    setBuildError("设施只能建造在已连接的空框架上。");
    return false;
  }
  const def = TYPES[facility];
  const cost = getBuildCost(facility);
  if (!canPay(cost)) {
    setBuildError(`${def.name} 资源不足：${formatCost(cost)}（建造模式已保持）`);
    return false;
  }
  pay(cost);
  const next = createCell(x, y, facility);
  next.frameHp = existing.frameHp;
  state.station.cells.set(cellKey, next);
  clearBuildError();
  showToast(`${def.name}已建造。`);
  return true;
}

function hasConnectedNeighbor(x, y) {
  return neighbors(x, y).some((n) => {
    const cell = state.station.cells.get(key(n.x, n.y));
    return cell && !cell.detached;
  });
}

function neighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
}

function reconnectDetached(x, y) {
  const queue = neighbors(x, y).filter((n) => {
    const c = state.station.cells.get(key(n.x, n.y));
    return c && c.detached;
  });
  let restored = 0;
  while (queue.length) {
    const p = queue.pop();
    const c = state.station.cells.get(key(p.x, p.y));
    if (!c || !c.detached) continue;
    c.detached = false;
    c.drift = null;
    restored++;
    for (const n of neighbors(p.x, p.y)) queue.push(n);
  }
  if (restored) showToast(`重新接入 ${restored} 个脱落结构。`);
}

function update(dt) {
  state.toastTimer -= dt;
  if (state.toastTimer <= 0) toastEl.classList.remove("show");
  if (state.paused) return;
  state.time += dt;

  updatePowerAndFacilities(dt);
  updateMouseAim(dt);
  updateStationPhysics(dt);
  updateMiningAndResearch(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateRepair(dt);
  updateDetachedCells(dt);
  updateParticles(dt);
  updateObjective(dt);
  updateCamera(dt);
}

function updatePowerAndFacilities(dt) {
  state.resources.metal += (0.85 + (state.meta.unlocks.efficientCore ? 0.35 : 0)) * dt;
  state.resources.ore += 0.18 * dt;
  state.resources.gas += 0.12 * dt;
  state.resources.plasma += 0.025 * dt;

  let available = 6 + state.station.techLevel * 1.5;
  const candidates = [];
  for (const cell of state.station.cells.values()) {
    cell.fire = 0;
    cell.active = cell.facility === "core" || cell.facility === "frame" || cell.facility === "armor";
    if (cell.detached || !cell.enabled) continue;
    if (cell.facility === "power") available += TYPES.power.powerOut;
    if (cell.facility === "plasma" && state.resources.gas > 0.8) {
      available += 2;
    }
    const use = TYPES[cell.facility]?.powerUse || 0;
    if (use > 0) candidates.push(cell);
  }

  candidates.sort((a, b) => b.priority - a.priority);
  let used = 0;
  for (const cell of candidates) {
    const use = TYPES[cell.facility].powerUse;
    if (used + use <= available) {
      cell.active = true;
      used += use;
    } else {
      cell.active = false;
    }
  }
  state.power.available = available;
  state.power.used = used;
}

function updateStationPhysics(dt) {
  const station = state.station;
  let force = { x: 0, y: 0 };
  let torque = 0;
  const keyboardThrust = getKeyboardThrustWorld();
  const targetVector = keyboardThrust
    ? keyboardThrust
    : state.target
      ? normalize({ x: state.target.x - station.pos.x, y: state.target.y - station.pos.y })
      : null;
  if (keyboardThrust) {
    state.target = null;
  }
  const mass = 1 + state.station.cells.size * PLAYER_PHYSICS.massPerCell;
  for (const cell of state.station.cells.values()) {
    if (cell.facility !== "thruster" || !cell.active || cell.detached) continue;
    const nozzle = thrusterNozzle(cell);
    if (state.station.cells.has(key(cell.x + nozzle.x, cell.y + nozzle.y))) {
      cell.fire = 0;
      continue;
    }
    const pushLocal = { x: -nozzle.x, y: -nozzle.y };
    const pushWorld = rotate(pushLocal, station.angle);
    const shouldFire = targetVector ? dot(pushWorld, targetVector) > 0.12 : length(station.vel) > 3;
    if (!shouldFire) {
      cell.fire = 0;
      continue;
    }
    const thrust =
      PLAYER_PHYSICS.thrusterThrust *
      (1 + state.station.techLevel * 0.08) *
      (1 + state.meta.weapons * 0.03);
    force.x += pushWorld.x * thrust;
    force.y += pushWorld.y * thrust;
    const r = rotate({ x: cell.x * CELL, y: cell.y * CELL }, station.angle);
    torque += cross(r, { x: pushWorld.x * thrust, y: pushWorld.y * thrust }) * 0.0004;
    cell.fire = 1;
    spawnParticle(
      {
        x: cellWorldPosition(cell).x + rotate(nozzle, station.angle).x * CELL * 0.6,
        y: cellWorldPosition(cell).y + rotate(nozzle, station.angle).y * CELL * 0.6
      },
      [0.3, 0.85, 1, 0.8]
    );
  }
  if (keyboardThrust) {
    const directThrust =
      PLAYER_PHYSICS.keyboardThrust *
      (1 + state.station.techLevel * 0.06) *
      state.station.thrustMod;
    force.x += keyboardThrust.x * directThrust;
    force.y += keyboardThrust.y * directThrust;
  }
  station.vel.x += force.x / mass * dt;
  station.vel.y += force.y / mass * dt;
  station.vel.x *= 1 - Math.min(PLAYER_PHYSICS.linearDamping * dt, PLAYER_PHYSICS.linearDamping);
  station.vel.y *= 1 - Math.min(PLAYER_PHYSICS.linearDamping * dt, PLAYER_PHYSICS.linearDamping);
  station.pos.x += station.vel.x * dt;
  station.pos.y += station.vel.y * dt;
  station.angularVel += torque * dt;
  station.angularVel *=
    1 - Math.min(PLAYER_PHYSICS.angularDamping * dt, PLAYER_PHYSICS.angularDamping);
  station.angle += station.angularVel * dt;
  if (state.target && dist(station.pos, state.target) < 45) {
    state.target = null;
    showToast("已抵达目标附近。");
  }
}

function thrusterNozzle(cell) {
  if (Math.abs(cell.x) >= Math.abs(cell.y)) {
    return { x: cell.x >= 0 ? 1 : -1, y: 0 };
  }
  return { x: 0, y: cell.y >= 0 ? 1 : -1 };
}

function updateMiningAndResearch(dt) {
  let mined = 0;
  const miningBonus = 1 + state.meta.mining * 0.12;
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.active) continue;
    if (cell.facility === "mining") {
      const p = cellWorldPosition(cell);
      const body = state.bodies.find((b) => b.amount > 0 && dist(p, b) < b.r + MINING_RANGE_OFFSET);
      if (body) {
        const amount = Math.min(body.amount, 6.5 * miningBonus * dt);
        body.amount -= amount;
        state.resources[body.resource] = (state.resources[body.resource] || 0) + amount;
        mined += amount;
        cell.fire = 1;
        spawnParticle(p, body.color);
      }
    }
    if (cell.facility === "processor" && state.resources.ore > 1.2) {
      const amount = Math.min(state.resources.ore, 4 * dt);
      state.resources.ore -= amount;
      state.resources.metal += amount * 0.72;
    }
    if (cell.facility === "plasma" && state.resources.gas > 1.0) {
      const amount = Math.min(state.resources.gas, 2.7 * dt);
      state.resources.gas -= amount;
      state.resources.plasma += amount * 0.38;
    }
    if (cell.facility === "research" && state.resources.plasma > 0.18) {
      const amount = Math.min(state.resources.plasma, 0.8 * dt);
      state.resources.plasma -= amount;
      state.resources.research += amount * 2.4;
    }
  }
  if (mined && state.run.objective?.type === "mine") {
    state.run.objective.progress += mined;
  }
  if (state.resources.research >= 35 + state.station.techLevel * 22) {
    state.resources.research -= 35 + state.station.techLevel * 22;
    state.station.techLevel++;
    improveStationHp(1.08);
    showToast(`研发完成：全站数值提升，当前科技等级 ${state.station.techLevel}`);
  }
}

function improveStationHp(multiplier) {
  for (const cell of state.station.cells.values()) {
    cell.maxHp *= multiplier;
    cell.hp = Math.min(cell.maxHp, cell.hp * multiplier + 8);
    cell.frameHp *= multiplier;
  }
}

function updateEnemies(dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnWave();
    state.spawnTimer = rand(26, 40) / Math.sqrt(state.run.playerCount);
  }

  for (const enemy of state.enemies) {
    enemy.reload -= dt;
    const toStation = { x: state.station.pos.x - enemy.x, y: state.station.pos.y - enemy.y };
    const dir = normalize(toStation);
    const distToStation = length(toStation);
    const desiredDistance =
      enemy.kind === "station" ? 470 : enemy.kind === "pirate" ? PIRATE_AI.desiredDistance : 0;
    if (enemy.kind === "pirate") {
      if (distToStation > desiredDistance) {
        enemy.vx += dir.x * enemy.accel * dt;
        enemy.vy += dir.y * enemy.accel * dt;
      } else if (distToStation > 0) {
        const closeness = 1 - distToStation / desiredDistance;
        const sep = PIRATE_AI.separationAccel * closeness;
        enemy.vx -= dir.x * sep * dt;
        enemy.vy -= dir.y * sep * dt;
      }
    } else if (distToStation > desiredDistance) {
      enemy.vx += dir.x * enemy.accel * dt;
      enemy.vy += dir.y * enemy.accel * dt;
    }
    enemy.vx *= 1 - Math.min(enemy.drag * dt, 0.3);
    enemy.vy *= 1 - Math.min(enemy.drag * dt, 0.3);
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.angle += enemy.spin * dt;

    if (enemy.kind !== "asteroid" && enemy.reload <= 0 && length(toStation) < enemy.range) {
      enemy.reload = enemy.kind === "station" ? 1.6 : 2.2;
      fireProjectile({ x: enemy.x, y: enemy.y }, dir, "enemy", enemy.kind === "station" ? 16 : 10, 250);
    }
    if (enemy.kind === "station" && enemy.spawn <= 0) {
      enemy.spawn = 7;
      spawnEnemy("pirate", enemy.x + rand(-80, 80), enemy.y + rand(-80, 80));
    } else {
      enemy.spawn -= dt;
    }

    collideEnemyWithStation(enemy);
  }

  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.active) continue;
    if (cell.facility === "turret") updateTurret(cell, dt);
    if (cell.facility === "shield") updateShield(cell);
    cell.reload = Math.max(0, cell.reload - dt);
  }

  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.hp > 0) return true;
    if (state.run.objective?.type === "battle") state.run.objective.progress++;
    state.resources.metal += enemy.reward;
    state.resources.gas += enemy.reward * 0.15;
    for (let i = 0; i < 12; i++) spawnParticle(enemy, [1, 0.32, 0.18, 1]);
    return false;
  });
}

function getAsteroidSpawnChance() {
  const t = clamp(state.time / SPAWN_ASTEROID_RAMP_SEC, 0, 1);
  return SPAWN_ASTEROID_CHANCE_EARLY + (SPAWN_ASTEROID_CHANCE_LATE - SPAWN_ASTEROID_CHANCE_EARLY) * t;
}

function spawnWave() {
  const count = Math.ceil(state.run.playerCount * rand(0.6, 2));
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const a = rand(0, Math.PI * 2);
    const r = rand(800, 1150);
    const x = state.station.pos.x + Math.cos(a) * r;
    const y = state.station.pos.y + Math.sin(a) * r;
    if (roll < getAsteroidSpawnChance()) spawnEnemy("asteroid", x, y);
    else if (roll < 0.82) spawnEnemy("pirate", x, y);
    else if (state.asyncEnabled) spawnEnemy("station", x, y);
    else spawnEnemy("pirate", x, y);
  }
  showToast("雷达发现敌对目标。");
}

function spawnEnemy(kind, x, y) {
  const data = {
    asteroid: { hp: 26, r: 11, accel: 42, drag: 0.01, range: 0, reward: 4, spin: rand(-2, 2) },
    pirate: { hp: 68, r: 20, accel: 44, drag: 0.18, range: 360, reward: 10, spin: rand(-1, 1) },
    station: { hp: 260, r: 48, accel: 20, drag: 0.2, range: 520, reward: 38, spin: 0.2 }
  }[kind];
  state.enemies.push({
    kind,
    x,
    y,
    vx: rand(-20, 20),
    vy: rand(-20, 20),
    angle: rand(0, Math.PI * 2),
    reload: rand(0.4, 2),
    spawn: 5,
    ...data
  });
}

function updateTurret(cell, dt) {
  if (cell.reload > 0) return;
  const origin = cellWorldPosition(cell);
  const enemy = nearestEnemy(origin, 450);
  if (!enemy || !hasLineOfSight(origin, enemy)) return;
  const dir = normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  cell.reload = Math.max(0.28, 0.60 - state.station.techLevel * 0.03);
  fireProjectile(origin, dir, "player", 14 * (1 + state.meta.weapons * 0.1), 620);
}

function hasLineOfSight(origin, target) {
  const localOrigin = rotate({ x: origin.x - state.station.pos.x, y: origin.y - state.station.pos.y }, -state.station.angle);
  const localTarget = rotate({ x: target.x - state.station.pos.x, y: target.y - state.station.pos.y }, -state.station.angle);
  const ray = { x: localTarget.x - localOrigin.x, y: localTarget.y - localOrigin.y };
  const rayLen = length(ray);
  const dir = normalize(ray);
  for (const cell of state.station.cells.values()) {
    if (cell.detached) continue;
    const center = { x: cell.x * CELL, y: cell.y * CELL };
    if (Math.abs(center.x - localOrigin.x) < 1 && Math.abs(center.y - localOrigin.y) < 1) continue;
    const toCell = { x: center.x - localOrigin.x, y: center.y - localOrigin.y };
    const along = dot(toCell, dir);
    if (along <= 0 || along >= rayLen) continue;
    const side = Math.abs(cross(dir, toCell));
    if (side < CELL * 0.45) return false;
  }
  return true;
}

function updateShield(cell) {
  const origin = cellWorldPosition(cell);
  const outward = shieldDirection(cell);
  for (const projectile of state.projectiles) {
    if (projectile.owner !== "enemy") continue;
    const toProjectile = { x: projectile.x - origin.x, y: projectile.y - origin.y };
    if (length(toProjectile) < 92 && dot(normalize(toProjectile), outward) > -0.1) {
      projectile.dead = true;
      cell.fire = 1;
      for (let i = 0; i < 5; i++) spawnParticle(projectile, [0.35, 1, 0.94, 1]);
    }
  }
}

function fireMissiles() {
  let fired = 0;
  for (const cell of state.station.cells.values()) {
    if (cell.facility !== "missile" || !cell.active || cell.reload > 0 || cell.detached) continue;
    const enemy = nearestEnemy(cellWorldPosition(cell), 780);
    if (!enemy) continue;
    if (state.resources.gas < 3 || state.resources.metal < 1) {
      showToast("导弹装填资源不足，需要气体和金属。");
      return;
    }
    state.resources.gas -= 3;
    state.resources.metal -= 1;
    const origin = cellWorldPosition(cell);
    state.projectiles.push({
      owner: "missile",
      target: enemy,
      x: origin.x,
      y: origin.y,
      vx: rand(-12, 12),
      vy: rand(-12, 12),
      damage: 42 * (1 + state.meta.weapons * 0.12),
      life: 5.5,
      r: 5
    });
    cell.reload = 5.8;
    fired++;
  }
  showToast(fired ? `导弹齐射：${fired} 枚` : "没有可发射的导弹井或目标。");
}

function nearestEnemy(origin, range) {
  let best = null;
  let bestDist = range;
  for (const enemy of state.enemies) {
    const d = dist(origin, enemy);
    if (d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

function fireProjectile(origin, dir, owner, damage, speed) {
  state.projectiles.push({
    owner,
    x: origin.x,
    y: origin.y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    damage,
    life: 2.6,
    r: owner === "enemy" ? 4 : 3
  });
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
    if (projectile.owner === "missile" && projectile.target && projectile.target.hp > 0) {
      const dir = normalize({ x: projectile.target.x - projectile.x, y: projectile.target.y - projectile.y });
      projectile.vx += dir.x * 360 * dt;
      projectile.vy += dir.y * 360 * dt;
      const speed = length({ x: projectile.vx, y: projectile.vy });
      if (speed > 420) {
        projectile.vx = projectile.vx / speed * 420;
        projectile.vy = projectile.vy / speed * 420;
      }
    }
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    spawnParticle(projectile, projectile.owner === "enemy" ? [1, 0.35, 0.25, 0.6] : [0.65, 0.92, 1, 0.6]);

    if (projectile.owner === "enemy") {
      const hit = getCellAtWorld(projectile);
      if (hit && !hit.detached) {
        damageCell(hit, projectile.damage);
        projectile.dead = true;
      }
    } else {
      for (const enemy of state.enemies) {
        if (dist(projectile, enemy) < enemy.r + projectile.r) {
          enemy.hp -= projectile.damage;
          projectile.dead = true;
          break;
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => p.life > 0 && !p.dead);
}

function getCellAtWorld(world) {
  const grid = worldToGrid(world);
  return state.station.cells.get(key(grid.x, grid.y));
}

function collideEnemyWithStation(enemy) {
  for (const cell of state.station.cells.values()) {
    if (cell.detached) continue;
    const p = cellWorldPosition(cell);
    if (dist(enemy, p) < enemy.r + CELL * 0.48) {
      damageCell(
        cell,
        enemy.kind === "asteroid"
          ? COLLISION_FEEL.asteroidCellDamage
          : COLLISION_FEEL.pirateCellDamage
      );
      enemy.hp -= enemy.kind === "asteroid" ? 35 : 8;
      const away = normalize({ x: enemy.x - p.x, y: enemy.y - p.y });
      enemy.vx += away.x * COLLISION_FEEL.enemyBounce;
      enemy.vy += away.y * COLLISION_FEEL.enemyBounce;
      return;
    }
  }
}

function damageCell(cell, damage) {
  if (cell.facility !== "frame" && cell.facility !== "core") {
    cell.hp -= damage;
    if (cell.hp <= 0) {
      showToast(`${TYPES[cell.facility].name}被摧毁，框架暴露。`);
      const bare = createCell(cell.x, cell.y, "frame");
      bare.frameHp = Math.max(16, cell.frameHp);
      state.station.cells.set(key(cell.x, cell.y), bare);
      checkConnectivity();
    }
    return;
  }
  cell.hp -= damage;
  cell.frameHp -= damage;
  if (cell.facility === "core" && cell.hp <= 0) {
    gameOver();
    return;
  }
  if (cell.frameHp <= 0 && cell.facility !== "core") {
    state.station.cells.delete(key(cell.x, cell.y));
    checkConnectivity();
  }
}

function checkConnectivity() {
  const visited = new Set();
  const queue = [key(0, 0)];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    const cell = state.station.cells.get(current);
    if (!cell) continue;
    visited.add(current);
    for (const n of neighbors(cell.x, cell.y)) {
      const nextKey = key(n.x, n.y);
      if (state.station.cells.has(nextKey) && !visited.has(nextKey)) queue.push(nextKey);
    }
  }
  let detached = 0;
  for (const [cellKey, cell] of state.station.cells.entries()) {
    const isConnected = visited.has(cellKey);
    if (!isConnected && !cell.detached) {
      detached++;
      const outward = normalize({ x: cell.x || rand(-1, 1), y: cell.y || rand(-1, 1) });
      cell.drift = {
        x: outward.x * rand(8, 24),
        y: outward.y * rand(8, 24),
        vx: outward.x * rand(10, 28) + rand(-8, 8),
        vy: outward.y * rand(10, 28) + rand(-8, 8)
      };
    }
    cell.detached = !isConnected;
    if (isConnected) cell.drift = null;
  }
  if (detached) showToast(`${detached} 个结构失去核心连接并脱落。`);
}

function updateRepair(dt) {
  const repairers = [...state.station.cells.values()].filter((c) => c.facility === "repair" && c.active && !c.detached);
  for (const repairer of repairers) {
    repairer.repairCooldown = Math.max(0, (repairer.repairCooldown || 0) - dt);
    if (repairer.repairCooldown > 0) continue;
    const origin = cellWorldPosition(repairer);
    const target = [...state.station.cells.values()]
      .filter((cell) => !cell.detached && (cell.hp < cell.maxHp || cell.frameHp < 70))
      .sort((a, b) => dist(origin, cellWorldPosition(a)) - dist(origin, cellWorldPosition(b)))[0];
    if (!target) continue;
    repairer.repairCooldown = 1.25;
    state.repairDrones.push({
      x: origin.x,
      y: origin.y,
      targetKey: key(target.x, target.y),
      repairerKey: key(repairer.x, repairer.y),
      returning: false,
      life: 10
    });
  }
  for (const drone of state.repairDrones) {
    drone.life -= dt;
    const target = state.station.cells.get(drone.targetKey);
    const repairer = state.station.cells.get(drone.repairerKey);
    const destinationCell = drone.returning || !target || target.detached ? repairer : target;
    if (!destinationCell) {
      drone.life = 0;
      continue;
    }
    const destination = cellWorldPosition(destinationCell);
    const toDestination = { x: destination.x - drone.x, y: destination.y - drone.y };
    const distance = length(toDestination);
    const speed = 125;
    if (distance < speed * dt + 4) {
      drone.x = destination.x;
      drone.y = destination.y;
      if (!drone.returning && target && !target.detached) {
        target.hp = Math.min(target.maxHp, target.hp + 18);
        target.frameHp = Math.min(70 * (1 + state.meta.hull * 0.1), target.frameHp + 12);
        drone.returning = true;
      } else {
        drone.life = 0;
      }
    } else {
      const dir = normalize(toDestination);
      drone.x += dir.x * speed * dt;
      drone.y += dir.y * speed * dt;
    }
  }
  state.repairDrones = state.repairDrones.filter((d) => d.life > 0);
}

function updateDetachedCells(dt) {
  for (const cell of state.station.cells.values()) {
    if (!cell.detached || !cell.drift) continue;
    cell.drift.x += cell.drift.vx * dt;
    cell.drift.y += cell.drift.vy * dt;
    cell.drift.vx *= 1 - Math.min(0.08 * dt, 0.08);
    cell.drift.vy *= 1 - Math.min(0.08 * dt, 0.08);
  }
}

function updateObjective(dt) {
  const objective = state.run.objective;
  if (!objective) return;
  if (objective.type === "explore") {
    objective.progress = dist(state.station.pos, objective.beacon) < 130 ? 1 : 0;
  }
  if (objective.type === "survive") {
    objective.progress += dt;
  }
  if (objective.progress >= objective.target && !state.run.objectiveCompleteAt) {
    state.run.objectiveCompleteAt = state.time;
    state.run.completedObjectives++;
    const gained = 2 + state.run.level;
    state.meta.points += gained;
    saveMeta();
    showToast(`任务完成，获得 ${gained} 局外点数。即将进入下一星系。`);
  }
  if (state.run.objectiveCompleteAt && state.time - state.run.objectiveCompleteAt > 5) {
    nextLevel();
  }
}

function nextLevel() {
  state.run.level++;
  createObjective();
  state.resources.metal += 55;
  state.resources.ore += 25;
  state.resources.gas += 18;
  state.spawnTimer = 5;
  state.station.pos.x += rand(-220, 220);
  state.station.pos.y += rand(-180, 180);
  showToast("跃迁到下一星系。可以继续扩建或停留战斗。");
}

function gameOver() {
  showToast("核心被摧毁，本局结束。局外点数已保留。");
  state.paused = true;
  setTimeout(() => {
    location.reload();
  }, 2600);
}

function updateCamera(dt) {
  const target = state.station.pos;
  state.camera.x += (target.x - state.camera.x) * clamp(dt * 2.4, 0, 1);
  state.camera.y += (target.y - state.camera.y) * clamp(dt * 2.4, 0, 1);
}

function spawnParticle(p, color) {
  if (state.particles.length > 260) return;
  state.particles.push({
    x: p.x,
    y: p.y,
    vx: rand(-20, 20),
    vy: rand(-20, 20),
    life: rand(0.2, 0.75),
    color
  });
}

function updateParticles(dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

function render() {
  if (renderer.contextLost) return;
  renderer.begin();
  renderBackground();
  renderBodies();
  renderTargetAndObjective();
  renderStation();
  renderMiningEffects();
  renderEnemies();
  renderProjectilesAndEffects();
  renderer.flush();
}

function renderBackground() {
  for (const star of state.stars) {
    renderer.circle(star, star.r / state.camera.zoom, [0.65, 0.82, 1, star.a], 8);
  }
}

function renderBodies() {
  renderer.ring({ x: 0, y: 0 }, 520, 1.5, [0.25, 0.45, 0.8, 0.12], 80);
  renderer.ring({ x: 0, y: 0 }, 930, 1.5, [0.25, 0.45, 0.8, 0.1], 96);
  const miningStatus = getMiningStationStatus();
  const harvestingBodies = new Set(miningStatus.harvesting.map((entry) => entry.body));
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 3.2);

  for (const body of state.bodies) {
    const depleted = !body.resource || body.amount <= 0;
    const visual = RESOURCE_VISUAL[body.resource] || RESOURCE_VISUAL.ore;

    if (!depleted) {
      const miningRange = getMiningRange(body);
      const inHarvest = harvestingBodies.has(body);
      const rangeAlpha = inHarvest ? 0.18 + pulse * 0.14 : 0.08 + pulse * 0.05;
      renderer.ring(body, miningRange, 2.5, [visual.ring[0], visual.ring[1], visual.ring[2], rangeAlpha], 72);
      renderer.ring(body, miningRange - 8, 1.2, [visual.ring[0], visual.ring[1], visual.ring[2], rangeAlpha * 0.55], 56);
      renderer.ring(body, body.r + 16, 4.5, [visual.ring[0], visual.ring[1], visual.ring[2], 0.42 + pulse * 0.18], 44);
      for (let i = 0; i < 4; i++) {
        const angle = state.time * 0.45 + i * Math.PI / 2;
        const inner = body.r + 12;
        const outer = body.r + 26;
        renderer.line(
          { x: body.x + Math.cos(angle) * inner, y: body.y + Math.sin(angle) * inner },
          { x: body.x + Math.cos(angle) * outer, y: body.y + Math.sin(angle) * outer },
          3,
          [visual.ring[0], visual.ring[1], visual.ring[2], 0.72]
        );
      }
      if (inHarvest) {
        renderer.ring(body, body.r + 24, 3, [0.55, 1, 0.72, 0.28 + pulse * 0.22], 36);
      }
    }

    const bodyColor = depleted
      ? [body.color[0] * 0.45, body.color[1] * 0.45, body.color[2] * 0.45, 0.55]
      : body.color;
    renderer.circle(body, body.r, bodyColor, body.type === "star" ? 60 : 34);
    renderer.ring(body, body.r + 8, 3, [bodyColor[0], bodyColor[1], bodyColor[2], depleted ? 0.08 : 0.16], 40);
  }
}

function renderMiningEffects() {
  const { harvesting } = getMiningStationStatus();
  for (const entry of harvesting) {
    const visual = RESOURCE_VISUAL[entry.resource] || RESOURCE_VISUAL.ore;
    const origin = cellWorldPosition(entry.cell);
    const pulse = 0.35 + 0.25 * Math.sin(state.time * 5 + entry.cell.x);
    renderer.line(origin, entry.body, 3.5, [visual.ring[0], visual.ring[1], visual.ring[2], pulse]);
    renderer.circle(origin, 5, [0.55, 1, 0.72, 0.55 + pulse * 0.25], 10);
  }
}

function renderTargetAndObjective() {
  if (state.target) {
    renderer.ring(state.target, 34, 3, [0.45, 0.95, 1, 0.7], 34);
    renderer.line({ x: state.station.pos.x, y: state.station.pos.y }, state.target, 2, [0.45, 0.95, 1, 0.18]);
  }
  if (state.virtualCursor.active) {
    renderer.ring(state.virtualCursor, 18, 3, [1, 1, 1, 0.75], 24);
    renderer.line({ x: state.virtualCursor.x - 24, y: state.virtualCursor.y }, { x: state.virtualCursor.x + 24, y: state.virtualCursor.y }, 2, [1, 1, 1, 0.35]);
    renderer.line({ x: state.virtualCursor.x, y: state.virtualCursor.y - 24 }, { x: state.virtualCursor.x, y: state.virtualCursor.y + 24 }, 2, [1, 1, 1, 0.35]);
  }
  const objective = state.run.objective;
  if (objective?.type === "explore") {
    renderer.ring(objective.beacon, 80, 5, [0.95, 0.9, 0.35, 0.55], 48);
    renderer.ring(objective.beacon, 120, 2, [0.95, 0.9, 0.35, 0.22], 48);
  }
}

function renderStation() {
  const selected = state.selectedCell;
  for (const cell of state.station.cells.values()) {
    const p = cellWorldPosition(cell);
    const def = TYPES[cell.facility] || { color: [1, 1, 1, 1] };
    const color = cell.detached ? [0.55, 0.38, 0.22, 0.55] : cell.active ? def.color : [def.color[0] * 0.45, def.color[1] * 0.45, def.color[2] * 0.45, 0.8];
    renderer.rect(p, CELL * 0.88, CELL * 0.88, state.station.angle, color);
    renderer.rect(p, CELL * 0.96, 2, state.station.angle, [0.05, 0.12, 0.2, 0.8]);
    renderer.rect(p, 2, CELL * 0.96, state.station.angle, [0.05, 0.12, 0.2, 0.8]);

    if (cell.facility === "core") renderer.circle(p, CELL * 0.34, [0.8, 0.92, 1, 0.9], 18);
    if (cell.facility === "thruster") renderThruster(cell, p);
    if (cell.facility === "shield" && cell.active) renderShield(cell, p);
    if (selected === key(cell.x, cell.y)) renderer.ring(p, CELL * 0.58, 3, [1, 1, 1, 0.75], 24);

    const hpRate = clamp(cell.hp / cell.maxHp, 0, 1);
    if (hpRate < 0.95 && !cell.detached) {
      const barCenter = rotate({ x: cell.x * CELL, y: cell.y * CELL + CELL * 0.54 }, state.station.angle);
      const a = { x: state.station.pos.x + barCenter.x - CELL * 0.35, y: state.station.pos.y + barCenter.y };
      const b = { x: a.x + CELL * 0.7 * hpRate, y: a.y };
      renderer.line(a, b, 3, [1, 0.25, 0.2, 0.85]);
    }
  }
}

function renderThruster(cell, p) {
  const nozzle = rotate(thrusterNozzle(cell), state.station.angle);
  const base = { x: p.x + nozzle.x * CELL * 0.45, y: p.y + nozzle.y * CELL * 0.45 };
  const tip = { x: p.x + nozzle.x * CELL * 0.78, y: p.y + nozzle.y * CELL * 0.78 };
  renderer.line(base, tip, 7, [0.05, 0.1, 0.16, 1]);
  if (cell.fire) {
    const flame = { x: p.x + nozzle.x * CELL * 1.2, y: p.y + nozzle.y * CELL * 1.2 };
    renderer.line(tip, flame, 9, [0.2, 0.85, 1, 0.75]);
  }
}

function renderShield(cell, p) {
  const nozzle = shieldDirection(cell);
  const center = { x: p.x + nozzle.x * 60, y: p.y + nozzle.y * 60 };
  renderer.ring(center, 48, 4, [0.35, 1, 0.94, cell.fire ? 0.55 : 0.24], 28);
}

function shieldDirection(cell) {
  const origin = cellWorldPosition(cell);
  const enemy = nearestEnemy(origin, 420);
  if (enemy) return normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  return rotate(thrusterNozzle(cell), state.station.angle);
}

function renderEnemies() {
  for (const enemy of state.enemies) {
    if (enemy.kind === "asteroid") {
      renderer.rect(enemy, enemy.r * 1.8, enemy.r * 1.5, enemy.angle, [0.65, 0.56, 0.48, 1]);
    } else if (enemy.kind === "pirate") {
      renderer.rect(enemy, enemy.r * 2.0, enemy.r * 1.1, enemy.angle, [0.95, 0.25, 0.22, 1]);
      renderer.circle(enemy, enemy.r * 0.45, [0.2, 0.02, 0.03, 1], 12);
    } else {
      renderer.rect(enemy, enemy.r * 1.8, enemy.r * 1.8, enemy.angle, [0.62, 0.18, 0.14, 1]);
      renderer.rect(enemy, enemy.r * 2.4, enemy.r * 0.42, enemy.angle + Math.PI / 4, [0.8, 0.28, 0.22, 1]);
      renderer.rect(enemy, enemy.r * 2.4, enemy.r * 0.42, enemy.angle - Math.PI / 4, [0.8, 0.28, 0.22, 1]);
    }
    const hp = clamp(enemy.hp / ({ asteroid: 26, pirate: 68, station: 260 }[enemy.kind]), 0, 1);
    renderer.line({ x: enemy.x - enemy.r, y: enemy.y - enemy.r - 10 }, { x: enemy.x - enemy.r + enemy.r * 2 * hp, y: enemy.y - enemy.r - 10 }, 4, [1, 0.18, 0.18, 0.8]);
  }
}

function renderProjectilesAndEffects() {
  for (const projectile of state.projectiles) {
    const color = projectile.owner === "enemy" ? [1, 0.22, 0.13, 1] : projectile.owner === "missile" ? [1, 0.72, 0.2, 1] : [0.65, 0.94, 1, 1];
    renderer.circle(projectile, projectile.r, color, 10);
  }
  for (const drone of state.repairDrones) {
    renderer.circle(drone, 4, drone.returning ? [0.55, 0.95, 1, 0.85] : [0.35, 1, 0.55, 0.85], 10);
  }
  for (const particle of state.particles) {
    const c = particle.color;
    renderer.circle(particle, 2.5, [c[0], c[1], c[2], Math.min(c[3] || 1, particle.life * 1.5)], 8);
  }
}

function countFacility(type) {
  let count = 0;
  for (const cell of state.station.cells.values()) {
    if (cell.detached) continue;
    if (cell.facility === type) count++;
  }
  return count;
}

function isThrusterNozzleBlocked(cell) {
  if (cell.facility !== "thruster") return false;
  const nozzle = thrusterNozzle(cell);
  return state.station.cells.has(key(cell.x + nozzle.x, cell.y + nozzle.y));
}

function getInactiveDueToPower() {
  const list = [];
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.enabled) continue;
    const use = TYPES[cell.facility]?.powerUse || 0;
    if (use > 0 && !cell.active) list.push(cell);
  }
  return list;
}

function getManualOffFacilities() {
  return [...state.station.cells.values()].filter(
    (c) => !c.detached && !c.enabled && c.facility !== "core" && c.facility !== "frame"
  );
}

function getBlockedThrusters() {
  return [...state.station.cells.values()].filter(
    (c) => !c.detached && c.enabled && isThrusterNozzleBlocked(c)
  );
}

function pickNextForObjective(objective) {
  if (!objective) return "扩建设施、完成任务或应对来敌。";
  switch (objective.type) {
    case "mine":
      return "建造采矿站并靠近带彩色外环的资源天体（橙=矿石、银=金属、绿=气、紫=等离子），保持设施通电。";
    case "explore":
      return state.target || hasKeyboardThrust()
        ? `${getMoveControlHint()}，或保持推进器喷口朝外，朝金色信标环移动。`
        : `${getMoveControlHint()}，或点空白处设定航行目标后自动推进。`;
    case "battle":
      return "建造炮塔或导弹井，必要时点「导弹齐射」。";
    case "survive":
      return "加固装甲与护盾，确保发电站供电不断。";
    default:
      return "";
  }
}

function buildGuideText() {
  const objective = state.run.objective;
  const frameCount = countFacility("frame");
  const powerCount = countFacility("power");
  const miningCount = countFacility("mining");
  const thrusterCount = countFacility("thruster");
  const isEarlyRun = state.run.level === 0 && state.run.completedObjectives === 0;

  if (isEarlyRun) {
    if (frameCount <= 6) {
      return {
        goal: "扩建空间站骨架",
        next: "选中「框架」，在核心外围已连接的空格点击建造。"
      };
    }
    if (powerCount === 0) {
      return {
        goal: "为设施提供电力",
        next: "在已连接框架上建造「发电站」，否则采矿/推进器等无法运作。"
      };
    }
    const blocked = getBlockedThrusters();
    if (blocked.length) {
      return {
        goal: "恢复推进器出力",
        next: "移开推进器外侧格上的结构，保证喷口方向无遮挡。"
      };
    }
    if (objective?.type === "mine" && miningCount === 0) {
      return {
        goal: `完成星系任务：${objective.text}`,
        next: "建造「采矿站」后，驾驶空间站进入资源天体的彩色外环范围即可采集。"
      };
    }
    if (objective?.type === "mine" && miningCount > 0 && objective.progress < objective.target * 0.25) {
      return {
        goal: `完成星系任务：${objective.text}`,
        next: state.target || hasKeyboardThrust()
          ? `${getMoveControlHint()}，进入最近资源点的外环；右侧「资源采集」可看距离与状态。`
          : `${getMoveControlHint()}，或点空白设航行目标；进入彩色外环后采矿站会自动采集。`
      };
    }
    if (objective?.type === "explore" && !state.target) {
      return {
        goal: `完成星系任务：${objective.text}`,
        next: `${getMoveControlHint()}，或点空白处设定航行目标，朝金色信标环前进。`
      };
    }
    if (thrusterCount === 0) {
      return {
        goal: "学习移动空间站",
        next: "在框架上建造「推进器」；默认屏幕方向移动，点「移动模式」可切换为朝向前方；鼠标决定朝向。"
      };
    }
    if (!state.target && !hasKeyboardThrust() && length(state.station.vel) < 3) {
      return {
        goal: objective ? `完成星系任务：${objective.text}` : "熟悉基本操作",
        next: `${getMoveControlHint()}；鼠标指向决定朝向；拖动画布可手动旋转与缩放。`
      };
    }
  }

  return {
    goal: objective ? `星系任务：${objective.text}` : "维持空间站运转",
    next: pickNextForObjective(objective)
  };
}

function buildStatusAlerts() {
  const alerts = [];
  if (state.lastBuildError) {
    alerts.push({
      level: "danger",
      text: state.lastBuildError
    });
  }
  if (state.selectedBuild) {
    alerts.push({
      level: "warn",
      text: `建造模式：${TYPES[state.selectedBuild].name} — 点网格或 Enter 放置；Esc / 「指针/航行」退出`
    });
  }
  const used = state.power.used;
  const available = state.power.available;
  if (used >= available - 0.25 && available > 0) {
    alerts.push({
      level: used > available ? "danger" : "warn",
      text: `电力紧张：${Math.floor(used)}/${Math.floor(available)}，优先级低的设施会自动停机`
    });
  }
  const starved = getInactiveDueToPower();
  if (starved.length) {
    const names = [...new Set(starved.map((c) => TYPES[c.facility].name))].slice(0, 4);
    alerts.push({
      level: "warn",
      text: `因电力或优先级未运作：${names.join("、")}${starved.length > names.length ? " 等" : ""}`
    });
  }
  const off = getManualOffFacilities();
  if (off.length) {
    alerts.push({
      level: "warn",
      text: `${off.length} 处设施已手动关闭，选中格子后点「开关设施」可恢复`
    });
  }
  const blocked = getBlockedThrusters();
  if (blocked.length) {
    alerts.push({
      level: "danger",
      text: `${blocked.length} 个推进器喷口被遮挡，外侧需留空才能施力`
    });
  }
  if (state.selectedBuild) {
    const cost = getBuildCost(state.selectedBuild);
    const missing = Object.entries(cost).filter(([res, value]) => state.resources[res] < value);
    if (missing.length) {
      alerts.push({
        level: "warn",
        text: `建造「${TYPES[state.selectedBuild].name}」资源不足：${formatCost(cost)}（核心会缓慢产金属）`
      });
    }
  }
  return alerts;
}

function buildResourceGuideHtml() {
  const nearest = getNearestResourceBody();
  const status = getMiningStationStatus();
  const lines = [];

  if (status.harvesting.length) {
    const groups = new Map();
    for (const entry of status.harvesting) {
      const label = RESOURCE_VISUAL[entry.resource]?.label || entry.resource;
      const groupKey = `${label}·${entry.body.name}`;
      groups.set(groupKey, (groups.get(groupKey) || 0) + 1);
    }
    for (const [groupKey, count] of groups) {
      lines.push(`<div class="resource-line resource-active"><span class="resource-dot active"></span>正在采集 ${groupKey}${count > 1 ? ` ×${count}` : ""}</div>`);
    }
  }

  if (nearest) {
    const { body, distance, range } = nearest;
    const visual = RESOURCE_VISUAL[body.resource] || RESOURCE_VISUAL.ore;
    const inRange = distance <= range;
    const gap = Math.max(0, Math.ceil(distance - range));
    lines.push(`<div class="resource-line"><span class="resource-dot resource-${visual.css}"></span>最近资源点：<strong>${body.name}</strong> · ${visual.label} · 剩余 ${Math.floor(body.amount)}</div>`);
    lines.push(`<div class="resource-line resource-meta">距离 ${Math.floor(distance)} / 采矿范围 ${Math.floor(range)}${inRange ? " · <span class='good'>已进入范围</span>" : ` · <span class='warn'>还需靠近 ${gap}</span>`}</div>`);
    if (!inRange) {
      lines.push(`<div class="resource-line resource-meta">驾驶空间站进入彩色外环；采矿站需建在框架上并通电。</div>`);
    }
  } else {
    lines.push(`<div class="resource-line">当前星系暂无可用资源天体。</div>`);
  }

  if (status.miners.length === 0) {
    lines.push(`<div class="resource-line resource-meta">尚未建造采矿站 — 选「采矿站」建在框架上，再进入资源外环。</div>`);
  } else if (status.harvesting.length === 0) {
    if (status.manualOff.length === status.miners.length) {
      lines.push(`<div class="resource-line warn">采矿站已全部手动关闭 — 选中格子点「开关设施」恢复。</div>`);
    } else if (status.inactivePower.length > 0 && status.activeMiners.length === 0) {
      lines.push(`<div class="resource-line warn">采矿站因电力不足未运作 — 增建发电站或关闭低优先级设施。</div>`);
    } else if (nearest && nearest.distance > nearest.range) {
      lines.push(`<div class="resource-line warn">采矿站就绪，请进入「${nearest.body.name}」的彩色外环（还差 ${Math.ceil(nearest.distance - nearest.range)}）。</div>`);
    } else if (nearest && nearest.body.amount <= 0) {
      lines.push(`<div class="resource-line warn">最近资源点已采空，请前往其他带彩色外环的天体。</div>`);
    }
  }

  return lines.join("");
}

function buildMiningAlerts() {
  const alerts = [];
  const status = getMiningStationStatus();
  if (status.harvesting.length) {
    const labels = [...new Set(status.harvesting.map((entry) => {
      const visual = RESOURCE_VISUAL[entry.resource] || RESOURCE_VISUAL.ore;
      return `${visual.label}（${entry.body.name}）`;
    }))];
    alerts.push({
      level: "good",
      text: `采矿进行中：${labels.join("、")}`
    });
  } else if (status.miners.length > 0) {
    if (status.manualOff.length === status.miners.length) {
      alerts.push({
        level: "warn",
        text: `${status.miners.length} 座采矿站已手动关闭，无法采集`
      });
    } else if (status.inactivePower.length > 0 && status.activeMiners.length === 0) {
      alerts.push({
        level: "warn",
        text: `${status.inactivePower.length} 座采矿站因电力不足停机`
      });
    } else {
      const nearest = getNearestResourceBody();
      if (nearest && nearest.distance > nearest.range) {
        alerts.push({
          level: "warn",
          text: `采矿站待命：距「${nearest.body.name}」还差 ${Math.ceil(nearest.distance - nearest.range)}，请进入彩色外环`
        });
      }
    }
  }
  return alerts;
}

function updateHud() {
  const r = state.resources;
  const powerTight = state.power.used >= state.power.available - 0.25;
  const resourceSpans = [
    `金属 ${Math.floor(r.metal)}`,
    `矿物 ${Math.floor(r.ore)}`,
    `气体 ${Math.floor(r.gas)}`,
    `等离子 ${Math.floor(r.plasma)}`,
    `科研 ${Math.floor(r.research)}`,
    `电力 ${Math.floor(state.power.used)}/${Math.floor(state.power.available)}`
  ].map((text, index) => {
    const powerClass = index === 5 && powerTight ? ' class="power-low"' : "";
    return `<span${powerClass}>${text}</span>`;
  });
  setHtmlIfChanged(resourcesEl, "resources", resourceSpans.join(""));

  const guide = buildGuideText();
  if (state.hud.guideGoal !== guide.goal) {
    state.hud.guideGoal = guide.goal;
    currentGoalEl.textContent = guide.goal;
  }
  if (state.hud.guideNext !== guide.next) {
    state.hud.guideNext = guide.next;
    nextStepEl.textContent = guide.next;
  }

  const alerts = buildStatusAlerts();
  const miningAlerts = buildMiningAlerts();
  const allAlerts = [...miningAlerts, ...alerts];
  const alertsHtml = allAlerts
    .map((a) => `<div class="alert-item alert-${a.level}">${a.text}</div>`)
    .join("");
  setHtmlIfChanged(statusAlertsEl, "alerts", alertsHtml);

  const resourceGuideHtml = buildResourceGuideHtml();
  setHtmlIfChanged(resourceGuideEl, "resourceGuide", resourceGuideHtml);

  const objective = state.run.objective;
  const progress = objective ? clamp(objective.progress / objective.target, 0, 1) : 0;
  const progressDetail = objective
    ? objective.type === "mine"
      ? `${Math.floor(objective.progress)} / ${objective.target} 单位`
      : objective.type === "survive"
        ? `${Math.floor(objective.progress)} / ${objective.target} 秒`
        : objective.type === "battle"
          ? `${Math.floor(objective.progress)} / ${objective.target} 击毁`
          : objective.progress >= objective.target
            ? "已抵达"
            : state.target
              ? "航行中"
              : "未设定目标"
    : "";
  setHtmlIfChanged(objectiveEl, "objective", objective
    ? `${objective.text}<br><span class="${progress >= 1 ? "good" : ""}">进度 ${Math.floor(progress * 100)}%${progressDetail ? ` · ${progressDetail}` : ""}</span>`
    : "无任务");

  const core = state.station.cells.get(key(0, 0));
  const active = [...state.station.cells.values()].filter((c) => c.active && !c.detached).length;
  const detached = [...state.station.cells.values()].filter((c) => c.detached).length;
  const selected = state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
  setHtmlIfChanged(stationDataEl, "status", [
    `核心耐久：${Math.ceil(core.hp)}/${Math.ceil(core.maxHp)}`,
    `结构：${state.station.cells.size} 个，运作：${active}，脱落：${detached}`,
    `速度：${Math.floor(length(state.station.vel))} / 科技等级：${state.station.techLevel}`
  ].join("<br>"));
  updateSelectedCellPanel(selected);

  const runInfo = `第 ${state.run.level + 1} 关 / 已完成 ${state.run.completedObjectives} 项任务 / ${state.run.playerCount} 人缩放`;
  if (state.hud.runInfo !== runInfo) {
    state.hud.runInfo = runInfo;
    runInfoEl.textContent = runInfo;
  }
  const asyncText = `异步敌站: ${state.asyncEnabled ? "开" : "关"}`;
  if (state.hud.asyncText !== asyncText) {
    state.hud.asyncText = asyncText;
    document.getElementById("toggleAsyncBtn").textContent = asyncText;
  }
  updateMetaUi();
  updateControlModeUi();
}

function setHtmlIfChanged(element, cacheKey, html) {
  if (state.hud[cacheKey] === html) return;
  state.hud[cacheKey] = html;
  element.innerHTML = html;
}

function updateSelectedCellPanel(cell) {
  if (!cell) {
    if (state.hud.selected !== "") {
      state.hud.selected = "";
      selectedCellPanelEl.classList.add("hidden");
      selectedCellInfoEl.textContent = "";
    }
    return;
  }
  const name = cell.facility === "core" ? "核心" : TYPES[cell.facility].name;
  let stateNote = "";
  if (!cell.detached && !cell.enabled && cell.facility !== "core") {
    stateNote = " <span class='danger'>（已手动关闭）</span>";
  } else if (!cell.detached && cell.enabled && !cell.active && (TYPES[cell.facility]?.powerUse || 0) > 0) {
    stateNote = " <span class='danger'>（电力不足停机）</span>";
  } else if (!cell.detached && cell.enabled && cell.facility === "thruster" && isThrusterNozzleBlocked(cell)) {
    stateNote = " <span class='danger'>（喷口被遮挡）</span>";
  } else if (cell.active) {
    stateNote = " <span class='good'>（运作中）</span>";
  }
  if (cell.facility === "mining" && !cell.detached) {
    if (!cell.enabled) {
      stateNote += " <span class='danger'>（已关闭，无法采集）</span>";
    } else if (!cell.active) {
      stateNote += " <span class='danger'>（电力不足，无法采集）</span>";
    } else {
      const target = getMiningCellTarget(cell);
      if (target) {
        const visual = RESOURCE_VISUAL[target.body.resource] || RESOURCE_VISUAL.ore;
        stateNote += ` <span class='good'>（正在采集 ${visual.label} @ ${target.body.name}）</span>`;
      } else {
        const nearest = getNearestResourceBody(cellWorldPosition(cell));
        if (nearest) {
          const gap = Math.max(0, Math.ceil(nearest.distance - nearest.range));
          stateNote += gap > 0
            ? ` <span class='warn'>（待命：距 ${nearest.body.name} 还差 ${gap}）</span>`
            : " <span class='warn'>（范围内但暂无可用资源）</span>";
        } else {
          stateNote += " <span class='warn'>（待命：附近无资源点）</span>";
        }
      }
    }
  }
  const html = `已选：${name} ${cell.enabled ? "<span class='good'>启用</span>" : "<span class='danger'>关闭</span>"} / 优先级 ${cell.priority}${stateNote}`;
  document.getElementById("toggleSelectedBtn").disabled = cell.facility === "core";
  document.getElementById("prioritySelectedBtn").disabled = cell.facility === "core";
  if (state.hud.selected !== html) {
    state.hud.selected = html;
    selectedCellPanelEl.classList.remove("hidden");
    selectedCellInfoEl.innerHTML = html;
  }
}

function updateMetaUi() {
  setHtmlIfChanged(metaStatsEl, "meta", `
    点数：${state.meta.points}
    <br>局外加成：采集 +${state.meta.mining * 12}% / 结构 +${state.meta.hull * 10}% / 武器 +${state.meta.weapons * 10}%
  `);
  document.getElementById("talentMiningBtn").disabled = state.meta.points < 1;
  document.getElementById("talentHullBtn").disabled = state.meta.points < 1;
  document.getElementById("talentWeaponsBtn").disabled = state.meta.points < 1;
  document.getElementById("unlockCoreBtn").disabled = state.meta.points < 3 || state.meta.unlocks.efficientCore;
  document.getElementById("unlockWeaponFrameBtn").disabled = state.meta.points < 3 || state.meta.unlocks.weaponFrame;
}

window.gameActions = {
  toggleSelected() {
    if (!state.selectedCell) return;
    const cell = state.station.cells.get(state.selectedCell);
    if (!cell || cell.facility === "core") return;
    cell.enabled = !cell.enabled;
    showToast(`${TYPES[cell.facility].name}${cell.enabled ? "已启用" : "已关闭"}`);
    updateHud();
  },
  prioritySelected() {
    if (!state.selectedCell) return;
    const cell = state.station.cells.get(state.selectedCell);
    if (!cell) return;
    cell.priority = (cell.priority + 10) % 110;
    showToast(`资源运输优先级调整为 ${cell.priority}`);
    updateHud();
  },
  buyTalent(type) {
    if (state.meta.points < 1) {
      showToast("局外点数不足。");
      updateHud();
      return;
    }
    state.meta.points--;
    state.meta[type]++;
    saveMeta();
    if (type === "hull") improveStationHp(1.06);
    showToast("天赋已保存，会持续影响之后的局。");
    updateHud();
  },
  buyUnlock(type) {
    if (state.meta.unlocks[type]) {
      showToast("该改造已经解锁。");
      updateHud();
      return;
    }
    if (state.meta.points < 3) {
      showToast("解锁需要 3 点局外点数。");
      updateHud();
      return;
    }
    state.meta.points -= 3;
    state.meta.unlocks[type] = true;
    saveMeta();
    createBuildUi();
    showToast("局外改造已解锁。");
    updateHud();
  },
  setPlayers() {
    state.run.playerCount = state.run.playerCount % 4 + 1;
    try {
      localStorage.setItem(PLAYER_SCALE_KEY, String(state.run.playerCount));
    } catch {
      showToast("浏览器阻止了人数设置保存，本局已临时生效。");
    }
    showToast(`联机合作缩放人数：${state.run.playerCount}。敌人与资源会按人数调整。`);
    updateHud();
  }
};

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000);
  state.lastTime = now;
  update(dt);
  render();
  state.hud.timer -= dt;
  if (state.hud.timer <= 0) {
    state.hud.timer = state.paused ? 1 : 0.12;
    updateHud();
  }
  requestAnimationFrame(loop);
}

try {
  renderer = new Renderer(canvas);
  initGame();
  requestAnimationFrame(loop);
} catch (error) {
  document.body.innerHTML = `<pre style="color:#fff;padding:24px">${error.message}</pre>`;
  throw error;
}
