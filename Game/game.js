"use strict";

const canvas = document.getElementById("game");
const resourcesEl = document.getElementById("resources");
const weaponsRowEl = document.getElementById("weaponsRow");
const buildButtonsEl = document.getElementById("buildButtons");
const runInfoEl = document.getElementById("runInfo");
const runDangerEl = document.getElementById("runDanger");
const runProgressEl = document.getElementById("runProgress");
const objectiveEl = document.getElementById("objective");
const currentGoalEl = document.getElementById("currentGoal");
const nextStepEl = document.getElementById("nextStep");
const statusAlertsEl = document.getElementById("statusAlerts");
const resourceGuideEl = document.getElementById("resourceGuide");
const stationDataEl = document.getElementById("stationData");
const designHealthSummaryEl = document.getElementById("designHealthSummary");
const combatReviewSummaryEl = document.getElementById("combatReviewSummary");
const combatStatusSummaryEl = document.getElementById("combatStatusSummary");
const selectedCellPanelEl = document.getElementById("selectedCellPanel");
const selectedCellInfoEl = document.getElementById("selectedCellInfo");
const selectedCellDiagnosticsEl = document.getElementById("selectedCellDiagnostics");
const metaStatsEl = document.getElementById("metaStats");
const toastEl = document.getElementById("toast");
const runSettlementPanelEl = document.getElementById("runSettlementPanel");
const runSettlementStatsEl = document.getElementById("runSettlementStats");
const runSettlementMetaFeedbackEl = document.getElementById("runSettlementMetaFeedback");
const quickRestartBtnEl = document.getElementById("quickRestartBtn");
const currentGalaxyInfoEl = document.getElementById("currentGalaxyInfoEl");
const galaxyPathEl = document.getElementById("galaxyPathEl");

const CELL = 30;

// v0.7.0 战斗操控：优先目标、齐射档位、LOS 警告与锁定框视觉
const PRIORITY_TARGET_LIFETIME = 12.0; // 优先目标有效时长（秒）
const PRIORITY_TARGET_LOCK_RADIUS = 48; // 右键锁敌点击半径（px）
const PRIORITY_TARGET_BREAK_DISTANCE = 800; // 超出此距离自动解除锁定（px）
const F_FIRE_DEBOUNCE_MS = 300; // F 键齐射防抖（毫秒）
const LOS_BLOCK_WARN_DURATION = 0.5; // turret LOS 遮挡橙色环显示时长（秒）
const LOS_BLOCK_WARN_COOLDOWN = 5.0; // 同一 turret cell 重复 LOS 警告节流（秒）
const PRIORITY_TARGET_RING_PULSE_PERIOD = 1.0; // 锁定框脉冲周期（秒）
const PRIORITY_TARGET_RING_ROTATE_RATE = 1.0; // 锁定框圆环旋转角速度（rad/s）
const SALVO_SIZE_OPTIONS = [1, 2, 3, 999]; // 齐射档位：1 / 2 / 3 / 全部(999)

const SAVE_KEY = "star-ring-station-meta-v1";
const META_CORRUPT_RAW_KEY = "star-ring-station-meta-corrupt-raw";
const META_CORRUPT_RAW_LIMIT = 4096;
const ASYNC_KEY = "star-ring-station-async-v1";
const PLAYER_SCALE_KEY = "star-ring-station-players-v1";
const ENDGAME_LEVEL = 6;
const TOTAL_RUN_LEVELS = ENDGAME_LEVEL + 1;
const GALAXY_WORLD_BOUNDS = { minX: -1400, maxX: 1400, minY: -1100, maxY: 1100 };
const STAR_FIELD_BOUNDS = { minX: -2600, maxX: 2600, minY: -2200, maxY: 2200 };
const STAR_FIELD_ALPHA = { min: 0.28, max: 0.9 };

const GALAXY_LEVEL_CONFIG = [
  { planetMin: 2, planetMax: 2, asteroidMin: 3, asteroidMax: 3, preferredType: "rich", paletteKey: "sun" },
  { planetMin: 2, planetMax: 3, asteroidMin: 3, asteroidMax: 5, preferredType: "nebula", paletteKey: "mist" },
  { planetMin: 2, planetMax: 3, asteroidMin: 4, asteroidMax: 6, preferredType: "storm", paletteKey: "violet" },
  { planetMin: 3, planetMax: 4, asteroidMin: 4, asteroidMax: 6, preferredType: null, paletteKey: "frost" },
  { planetMin: 3, planetMax: 4, asteroidMin: 5, asteroidMax: 7, preferredType: null, paletteKey: "coldfront" },
  { planetMin: 3, planetMax: 5, asteroidMin: 5, asteroidMax: 8, preferredType: null, paletteKey: "crimson" },
  { planetMin: 2, planetMax: 3, asteroidMin: 4, asteroidMax: 6, preferredType: "endgame", paletteKey: "abyss" }
];

const GALAXY_RESOURCE_WEIGHTS = {
  rich: { name: "富矿星系", ore: 50, metal: 25, gas: 15, plasma: 10 },
  nebula: { name: "气体星云", ore: 15, metal: 15, gas: 55, plasma: 15 },
  storm: { name: "等离子风暴", ore: 10, metal: 15, gas: 25, plasma: 50 },
  balance: { name: "平衡星系", ore: 30, metal: 25, gas: 25, plasma: 20 },
  endgame: { name: "终末守护星系", ore: 20, metal: 30, gas: 25, plasma: 25 }
};

const GALAXY_DYNAMIC_TYPES = ["rich", "nebula", "storm", "balance"];

const GALAXY_PALETTES = {
  sun: {
    starColor: [1.0, 0.74, 0.18, 1],
    starTint: [0.65, 0.82, 1.0],
    starCount: 360,
    orbitRing: [0.28, 0.46, 0.84, 0.12]
  },
  mist: {
    starColor: [0.55, 0.95, 0.65, 1],
    starTint: [0.75, 0.95, 0.85],
    starCount: 400,
    orbitRing: [0.35, 0.62, 0.45, 0.16]
  },
  violet: {
    starColor: [0.78, 0.40, 1.0, 1],
    starTint: [0.85, 0.7, 1.0],
    starCount: 440,
    orbitRing: [0.52, 0.36, 0.88, 0.18]
  },
  frost: {
    starColor: [0.55, 0.78, 1.0, 1],
    starTint: [0.85, 0.92, 1.0],
    starCount: 380,
    orbitRing: [0.42, 0.62, 0.95, 0.14]
  },
  coldfront: {
    starColor: [0.4, 0.66, 0.96, 1],
    starTint: [0.72, 0.88, 1.0],
    starCount: 420,
    orbitRing: [0.32, 0.55, 0.92, 0.16]
  },
  crimson: {
    starColor: [1.0, 0.3, 0.2, 1],
    starTint: [1.0, 0.65, 0.55],
    starCount: 480,
    orbitRing: [0.9, 0.32, 0.22, 0.2]
  },
  abyss: {
    starColor: [0.72, 0.24, 0.38, 1],
    starTint: [0.98, 0.52, 0.72],
    starCount: 520,
    orbitRing: [0.78, 0.16, 0.3, 0.24]
  }
};

// v0.9.0 GALAXY_TYPES 注册表：7 种平行星系类型，作为 OBJECTIVE / ENCOUNTER / spawn / 资源 / 视觉的乘子覆盖层
// 设计约束：
//  - emptyVoid 是 v0.8.0 兼容锚点，所有数值乘子（objectiveWeightMod / encounterWeightMod / enemySpawnMod
//    / resourceMod / hostileStationMod / enemyKindWeightMod / asteroidDensityMod / crossLevelBufferMod）
//    均为 1.0，保证玩家全程选 emptyVoid 时与 v0.8.0 体验精确等价
//  - 数值与 Workspaces/pm-qa-coordinator/v0.9.0-galaxy-map-numerics.md（含 §0.4 制作人拍板）保持一致
//  - paletteKey 复用现有 GALAXY_PALETTES key，不引入新调色板
//  - 未在 objectiveWeightMod / encounterWeightMod 中列出的 type 走默认 1.0
//  - 资源对象使用 5 资源命名空间，与 numerics 文档一致；T3 接入时由乘子运行路径决定 research 是否乘子
const GALAXY_TYPES = {
  tradeHub: {
    name: "稳定贸易区",
    description: "和平的星际港，商船频繁，敌意稀少。",
    riskLevel: "low",
    iconColor: [0.29, 0.56, 0.89, 1],
    nebulaTint: [0.37, 0.66, 1.0, 1],
    bgColor: [0.039, 0.102, 0.165, 1],
    planetColorTint: [0.37, 0.66, 1.0, 1],
    paletteKey: "frost",
    objectiveWeightMod: { mine: 1.5, survive: 1.5, battle: 0.5, explore: 1.0, salvage: 1.0, escort: 1.3, guardian: 1.0, assault: 0.5 },
    encounterWeightMod: { trader: 3.0, distress: 0.8, ambush: 0.3, derelict: 0.8, signal: 0.8 },
    enemySpawnMod: 0.7,
    enemyKindWeightMod: { pirate: 0.7, station: 0.8, asteroid: 1.0 },
    resourceMod: { metal: 1.2, ore: 1.0, gas: 1.0, plasma: 1.0, research: 1.0 },
    hostileStationMod: 0.5,
    asteroidDensityMod: 0.8,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-trade-hub"
  },
  pirateTerritory: {
    name: "海盗领地",
    description: "海盗盘踞之地，战利品丰厚但险象环生。",
    riskLevel: "high",
    iconColor: [0.80, 0.20, 0.20, 1],
    nebulaTint: [0.67, 0.22, 0.22, 1],
    bgColor: [0.102, 0.031, 0.031, 1],
    planetColorTint: [0.67, 0.22, 0.22, 1],
    paletteKey: "crimson",
    objectiveWeightMod: { mine: 0.5, survive: 1.0, battle: 2.0, explore: 0.7, salvage: 1.2, escort: 0.5, guardian: 1.0, assault: 1.2 },
    encounterWeightMod: { trader: 0.5, distress: 1.5, ambush: 2.0, derelict: 1.0, signal: 0.7 },
    enemySpawnMod: 1.5,
    enemyKindWeightMod: { pirate: 1.5, station: 1.0, asteroid: 1.0 },
    resourceMod: { metal: 1.3, ore: 1.0, gas: 1.0, plasma: 1.1, research: 1.0 },
    hostileStationMod: 1.0,
    asteroidDensityMod: 1.0,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-pirate-territory"
  },
  miningBelt: {
    name: "矿产带",
    description: "矿物资源密集，小行星遍布，开采者天堂。",
    riskLevel: "mid",
    iconColor: [0.78, 0.60, 0.35, 1],
    nebulaTint: [0.72, 0.54, 0.29, 1],
    bgColor: [0.122, 0.094, 0.063, 1],
    planetColorTint: [0.72, 0.54, 0.29, 1],
    paletteKey: "sun",
    objectiveWeightMod: { mine: 2.0, survive: 1.0, battle: 0.7, explore: 1.0, salvage: 1.3, escort: 1.0, guardian: 1.0, assault: 0.7 },
    encounterWeightMod: { trader: 1.2, distress: 0.8, ambush: 0.7, derelict: 1.5, signal: 0.8 },
    enemySpawnMod: 0.9,
    enemyKindWeightMod: { pirate: 0.9, station: 0.8, asteroid: 1.5 },
    resourceMod: { metal: 1.3, ore: 1.5, gas: 1.0, plasma: 1.0, research: 1.0 },
    hostileStationMod: 0.8,
    asteroidDensityMod: 2.0,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-mining-belt"
  },
  mysteryZone: {
    name: "疑虑空间",
    description: "迷雾笼罩的未知区域，神秘信号频发。",
    riskLevel: "mid",
    iconColor: [0.61, 0.35, 0.72, 1],
    nebulaTint: [0.56, 0.27, 0.68, 1],
    bgColor: [0.082, 0.039, 0.122, 1],
    planetColorTint: [0.56, 0.27, 0.68, 1],
    paletteKey: "violet",
    objectiveWeightMod: { mine: 1.0, survive: 1.0, battle: 1.0, explore: 2.0, salvage: 1.3, escort: 1.0, guardian: 1.0, assault: 1.0 },
    encounterWeightMod: { trader: 0.5, distress: 0.8, ambush: 1.0, derelict: 1.2, signal: 3.0 },
    enemySpawnMod: 1.0,
    enemyKindWeightMod: { pirate: 1.0, station: 1.0, asteroid: 1.0 },
    resourceMod: { metal: 1.0, ore: 1.0, gas: 1.2, plasma: 1.3, research: 1.2 },
    hostileStationMod: 0.8,
    asteroidDensityMod: 0.9,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-mystery-zone"
  },
  warFront: {
    name: "战争前线",
    description: "舰队交火激烈，BOSS 出没频繁，硬核试炼。",
    riskLevel: "extreme",
    iconColor: [1.0, 0.40, 0.20, 1],
    nebulaTint: [0.80, 0.27, 0.13, 1],
    bgColor: [0.122, 0.039, 0.020, 1],
    planetColorTint: [0.80, 0.27, 0.13, 1],
    paletteKey: "abyss",
    objectiveWeightMod: { mine: 0.3, survive: 1.5, battle: 2.0, explore: 0.5, salvage: 1.2, escort: 0.5, guardian: 1.5, assault: 2.0 },
    encounterWeightMod: { trader: 0.3, distress: 2.0, ambush: 1.5, derelict: 1.0, signal: 0.7 },
    enemySpawnMod: 2.0,
    enemyKindWeightMod: { pirate: 1.5, station: 2.0, asteroid: 0.8 },
    resourceMod: { metal: 1.2, ore: 1.0, gas: 1.0, plasma: 1.2, research: 1.5 },
    hostileStationMod: 2.0,
    asteroidDensityMod: 0.9,
    crossLevelBufferMod: 1.5,
    cssClass: "galaxy-war-front"
  },
  techRuin: {
    name: "科技废墟",
    description: "古代文明遗迹，散落着先进科技残片。",
    riskLevel: "mid",
    iconColor: [0.29, 0.78, 0.63, 1],
    nebulaTint: [0.24, 0.66, 0.53, 1],
    bgColor: [0.039, 0.122, 0.094, 1],
    planetColorTint: [0.24, 0.66, 0.53, 1],
    paletteKey: "mist",
    objectiveWeightMod: { mine: 0.7, survive: 1.0, battle: 0.8, explore: 1.5, salvage: 2.0, escort: 1.0, guardian: 1.0, assault: 0.8 },
    encounterWeightMod: { trader: 0.7, distress: 0.8, ambush: 0.8, derelict: 2.0, signal: 1.5 },
    enemySpawnMod: 0.9,
    enemyKindWeightMod: { pirate: 0.8, station: 1.2, asteroid: 1.0 },
    resourceMod: { metal: 1.0, ore: 1.0, gas: 1.0, plasma: 1.3, research: 1.5 },
    hostileStationMod: 1.0,
    asteroidDensityMod: 1.0,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-tech-ruin"
  },
  // emptyVoid 是 v0.8.0 兼容锚点：所有数值乘子 = 1.0，玩家在 emptyVoid 关卡内体验与 v0.8.0 基线精确等价；
  // 低风险低压差异由 tradeHub 承担，emptyVoid 仅保留灰色视觉签名 + 基线 / 空旷语义
  emptyVoid: {
    name: "空旷星域",
    description: "万籁俱寂的星际深空，基线节奏的星际深空。",
    riskLevel: "low",
    iconColor: [0.53, 0.53, 0.53, 1],
    nebulaTint: [0.40, 0.40, 0.40, 1],
    bgColor: [0.039, 0.039, 0.039, 1],
    planetColorTint: [0.40, 0.40, 0.40, 1],
    paletteKey: "coldfront",
    objectiveWeightMod: { mine: 1.0, survive: 1.0, battle: 1.0, explore: 1.0, salvage: 1.0, escort: 1.0, guardian: 1.0, assault: 1.0 },
    encounterWeightMod: { trader: 1.0, distress: 1.0, ambush: 1.0, derelict: 1.0, signal: 1.0 },
    enemySpawnMod: 1.0,
    enemyKindWeightMod: { pirate: 1.0, station: 1.0, asteroid: 1.0 },
    resourceMod: { metal: 1.0, ore: 1.0, gas: 1.0, plasma: 1.0, research: 1.0 },
    hostileStationMod: 1.0,
    asteroidDensityMod: 1.0,
    crossLevelBufferMod: 1.0,
    cssClass: "galaxy-empty-void"
  }
};

// v0.9.0 T4 视觉分化：小行星密度乘子 clamp、body tint 混合比、星场小行星数量上限
const GALAXY_ASTEROID_DENSITY_CLAMP = { min: 0.5, max: 2.0 };
const GALAXY_ASTEROID_COUNT_CAP = 14;
const GALAXY_BODY_TINT_MIX = 0.22;
const GALAXY_NEBULA_ALPHA = {
  tradeHub: 0.35,
  pirateTerritory: 0.45,
  miningBelt: 0.40,
  mysteryZone: 0.50,
  warFront: 0.55,
  techRuin: 0.45,
  emptyVoid: 0.20
};

// v0.9.0 候选生成相关常量
// 数值与 numerics §2 一致：level 0 / 6 强制锚点；level 1-5 候选数量随 level 上升；
// levelBias 以百分比单位记录"风险等级抽中概率"，先抽 risk 再在该 risk 池内均匀抽 galaxyType
const GALAXY_CANDIDATE_COUNT = [1, 2, 2, 3, 3, 3, 1];
const GALAXY_CHOICE_BASE_WEIGHTS = { low: 30, mid: 40, high: 25, extreme: 5 };
const GALAXY_LEVEL_BIAS = [
  null,
  { low: 50, mid: 40, high: 10, extreme: 0 },
  { low: 40, mid: 40, high: 15, extreme: 5 },
  { low: 30, mid: 40, high: 25, extreme: 5 },
  { low: 20, mid: 35, high: 35, extreme: 10 },
  { low: 10, mid: 30, high: 40, extreme: 20 }
];
// 候选 RNG 流：与 OBJECTIVE（^ 0x9e3779b9 + level * 0x85ebca6b）/ ENCOUNTER（^ 0xb5297a4d + level * 0xcc9e2d51）完全正交
const GALAXY_CHOICE_RNG_XOR = 0xd3b07cf3;
const GALAXY_CHOICE_RNG_MUL = 0x6c8e9cf5;

const LEVEL_TIMER_SCALE = [1.0, 0.98, 0.96, 0.88, 0.8, 0.72, 1.2];
const LEVEL0_SPAWN_WINDOW_SEC = 60;
const LEVEL0_INITIAL_SPAWN_TIMER = 22;
const LEVEL_COUNT_MUL = [1.0, 1.0, 1.05, 1.15, 1.25, 1.35, 0.7];
const LEVEL_SPAWN_RATIO = [
  { asteroidBias: 0, pirateBase: 0.78, stationBase: 0.0 },
  { asteroidBias: 0, pirateBase: 0.78, stationBase: 0.04 },
  { asteroidBias: 0, pirateBase: 0.78, stationBase: 0.08 },
  { asteroidBias: 0.02, pirateBase: 0.74, stationBase: 0.14 },
  { asteroidBias: 0.04, pirateBase: 0.7, stationBase: 0.2 },
  { asteroidBias: 0.06, pirateBase: 0.66, stationBase: 0.26 },
  { asteroidBias: -0.05, pirateBase: 0.8, stationBase: 0.05 }
];

const ENEMY_LEVEL_STATS = {
  asteroid: {
    hp: [26, 26, 26, 32, 36, 40, 42],
    collision: [18, 18, 18, 20, 22, 24, 24],
    reward: 4,
    r: 11,
    accel: 42,
    drag: 0.01,
    range: 0,
    spinMin: -2,
    spinMax: 2
  },
  pirate: {
    hp: [68, 68, 68, 88, 100, 108, 112],
    collision: [8, 8, 8, 10, 11, 12, 12],
    projectile: [10, 10, 10, 12, 13, 14, 14],
    reward: 10,
    r: 20,
    accel: 44,
    drag: 0.18,
    range: 360,
    spinMin: -1,
    spinMax: 1,
    reload: 2.2
  },
  station: {
    hp: [260, 260, 260, 330, 380, 410, 430],
    projectile: [16, 16, 16, 18, 20, 22, 22],
    spawnInterval: [7, 7, 7, 6.5, 6, 5.5, 5.5],
    reward: 38,
    r: 48,
    accel: 20,
    drag: 0.2,
    range: 520,
    spin: 0.2,
    reload: 1.6
  }
};

const GUARDIAN_STATS = {
  hp: 1200,
  r: 72,
  accel: 16,
  drag: 0.2,
  range: 600,
  reward: 80,
  spin: 0.15,
  projectile: 26,
  reload: 1.6,
  spawnInterval: 4.5,
  spawnCap: 4,
  collision: 12
};

const DANGER_STAGES = [
  { label: "安全", className: "danger-safe" },
  { label: "安全", className: "danger-safe" },
  { label: "警戒", className: "danger-alert" },
  { label: "危险", className: "danger-high" },
  { label: "危险", className: "danger-high" },
  { label: "致命", className: "danger-deadly" },
  { label: "致命", className: "danger-endgame" }
];

const ENDGAME_ACTIVITY_POINTS = {
  miningPerUnit: 0.006,
  enemy: {
    asteroid: 0.2,
    pirate: 0.45,
    station: 1.2
  }
};

// v0.5.0 引入 baseStats / upgrades / modifications 字段（13 种设施数据字典）
const TYPES = {
  core: {
    name: "核心",
    cost: {},
    hp: 280,
    baseStats: {
      maxHp: 280,
      maxFrameHp: 260
    },
    color: [0.82, 0.94, 1.0, 1],
    desc: "默认产出"
  },
  frame: {
    name: "框架",
    cost: { metal: 8 },
    hp: 70,
    baseStats: {
      maxHp: 70,
      maxFrameHp: 70
    },
    color: [0.25, 0.52, 0.72, 0.95],
    desc: "扩展结构"
  },
  power: {
    name: "发电站",
    cost: { metal: 22, ore: 8 },
    hp: 105,
    powerOut: 10,
    baseStats: {
      powerOut: 10
    },
    color: [1.0, 0.78, 0.22, 1],
    desc: "+10 电力"
  },
  thruster: {
    name: "推进器",
    cost: { metal: 26, gas: 8 },
    hp: 90,
    powerUse: 2,
    priority: 80,
    baseStats: {
      thrust: 110
    },
    color: [0.3, 0.8, 1.0, 1],
    desc: "按位置施力"
  },
  mining: {
    name: "采矿站",
    cost: { metal: 28, ore: 10 },
    hp: 95,
    powerUse: 3,
    priority: 60,
    baseStats: {
      mineRate: 6.5
    },
    color: [0.68, 0.9, 0.55, 1],
    desc: "近天体采集"
  },
  processor: {
    name: "金属加工",
    cost: { metal: 24, ore: 16 },
    hp: 90,
    powerUse: 2,
    priority: 45,
    baseStats: {
      produceRate: 4,
      produceRatio: 0.72
    },
    color: [0.76, 0.72, 0.64, 1],
    desc: "矿石转金属"
  },
  plasma: {
    name: "等离子",
    cost: { metal: 36, gas: 18 },
    hp: 92,
    powerUse: 3,
    priority: 48,
    baseStats: {
      produceRate: 2.7,
      produceRatio: 0.38,
      bonusPowerOut: 2
    },
    color: [0.8, 0.35, 1.0, 1],
    desc: "气体转等离子"
  },
  research: {
    name: "研发中心",
    cost: { metal: 45, plasma: 8 },
    hp: 85,
    powerUse: 4,
    priority: 35,
    baseStats: {
      produceRate: 0.8,
      produceRatio: 2.4
    },
    color: [0.55, 0.68, 1.0, 1],
    desc: "解锁升级"
  },
  turret: {
    name: "炮塔",
    cost: { metal: 35, ore: 12 },
    hp: 85,
    powerUse: 3,
    priority: 70,
    baseStats: {
      damage: 14,
      reload: 0.6,
      minReload: 0.28,
      range: 450,
      projectileSpeed: 620
    },
    color: [1.0, 0.42, 0.35, 1],
    desc: "自动射击"
  },
  missile: {
    name: "导弹井",
    cost: { metal: 46, gas: 12 },
    hp: 100,
    powerUse: 1,
    priority: 65,
    baseStats: {
      damage: 42,
      reload: 5.8,
      range: 780,
      projectileSpeed: 420,
      projectileAccel: 360,
      projectileCount: 1,
      life: 5.5,
      radius: 5,
      gasCost: 3,
      metalCost: 1,
      launchJitter: 12
    },
    color: [1.0, 0.58, 0.22, 1],
    desc: "手动齐射"
  },
  shield: {
    name: "护盾",
    cost: { metal: 50, plasma: 10 },
    hp: 105,
    powerUse: 5,
    priority: 75,
    baseStats: {
      maxShield: 100,
      regen: 0,
      range: 92
    },
    color: [0.34, 1.0, 0.94, 1],
    desc: "定向拦截"
  },
  armor: {
    name: "装甲",
    cost: { metal: 20 },
    hp: 220,
    baseStats: {
      maxHp: 220
    },
    color: [0.58, 0.65, 0.74, 1],
    desc: "高耐久"
  },
  repair: {
    name: "维修站",
    cost: { metal: 44, plasma: 6 },
    hp: 92,
    powerUse: 4,
    priority: 55,
    baseStats: {
      repairRate: 18,
      frameRepairRate: 12,
      cooldown: 1.25,
      droneSpeed: 125
    },
    color: [0.3, 1.0, 0.55, 1],
    desc: "释放无人机"
  }
};

TYPES.turret.upgrades = [
  { label: "伤害", tiers: [{ damage: 0.20 }, { damage: 0.40 }, { damage: 0.60 }] },
  { label: "射速", tiers: [{ reload: 0.20 }, { reload: 0.40 }, { reload: 0.60 }] },
  { label: "射程", tiers: [{ range: 0.20 }, { range: 0.40 }, { range: 0.60 }] }
];
TYPES.missile.upgrades = [
  { label: "伤害", tiers: [{ damage: 0.25 }, { damage: 0.50 }, { damage: 0.75 }] },
  { label: "射速", tiers: [{ reload: 0.20 }, { reload: 0.40 }, { reload: 0.60 }] },
  { label: "速度", tiers: [{ projectileSpeed: 0.30 }, { projectileSpeed: 0.60 }, { projectileSpeed: 0.90 }] }
];
TYPES.shield.upgrades = [
  { label: "护盾值", tiers: [{ maxShield: 0.25 }, { maxShield: 0.50 }, { maxShield: 0.75 }] },
  { label: "回复速度", tiers: [{ regen: 0.30 }, { regen: 0.60 }, { regen: 0.90 }] },
  { label: "范围", tiers: [{ range: 0.50 }, { range: 1.00 }, { range: 1.50 }] }
];
TYPES.power.upgrades = [{ label: "产电", tiers: [{ powerOut: 0.25 }, { powerOut: 0.50 }, { powerOut: 0.75 }] }];
TYPES.mining.upgrades = [{ label: "采矿", tiers: [{ mineRate: 0.20 }, { mineRate: 0.40 }, { mineRate: 0.60 }] }];
TYPES.processor.upgrades = [{ label: "加工", tiers: [{ produceRate: 0.20 }, { produceRate: 0.40 }, { produceRate: 0.60 }] }];
TYPES.plasma.upgrades = [{ label: "等离子", tiers: [{ produceRate: 0.25 }, { produceRate: 0.50 }, { produceRate: 0.75 }] }];
TYPES.research.upgrades = [{ label: "研发", tiers: [{ produceRate: 0.25 }, { produceRate: 0.50 }, { produceRate: 0.75 }] }];
TYPES.repair.upgrades = [{ label: "维修", tiers: [{ repairRate: 0.25 }, { repairRate: 0.50 }, { repairRate: 0.75 }] }];
TYPES.armor.upgrades = [{ label: "装甲", tiers: [{ maxHp: 0.30 }, { maxHp: 0.60 }, { maxHp: 0.90 }] }];
TYPES.frame.upgrades = [{ label: "骨架", tiers: [{ maxFrameHp: 0.20 }, { maxFrameHp: 0.40 }, { maxFrameHp: 0.60 }] }];
TYPES.thruster.upgrades = [{ label: "推力", tiers: [{ thrust: 0.15 }, { thrust: 0.30 }, { thrust: 0.45 }] }];

TYPES.turret.modifications = [
  { label: "高速点射", desc: "reload 速度 +50% / 伤害 -25%", reload: 0.50, damage: -0.25 },
  { label: "重型炮", desc: "reload 速度 -30% / 伤害 +60%", reload: -0.30, damage: 0.60 }
];
TYPES.missile.modifications = [
  { label: "导弹蜂群", desc: "弹数 ×2 / 伤害 -35%", projectileCount: 1.0, damage: -0.35 },
  { label: "穿甲弹", desc: "伤害 +55% / reload 速度 +15%", damage: 0.55, reload: 0.15 }
];
TYPES.shield.modifications = [
  { label: "全向场", desc: "范围 +80% / 回复 -40%", range: 0.80, regen: -0.40 },
  { label: "强化场", desc: "护盾值 +60% / 范围 -25%", maxShield: 0.60, range: -0.25 }
];
TYPES.thruster.modifications = [
  { label: "加速器", desc: "推力 +30% / 质量 +20%", thrust: 0.30 },
  { label: "稳定器", desc: "角阻尼 +50% / 推力 -10%", thrust: -0.10 }
];

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

const FACILITY_ROLE = {
  frame: "support",
  power: "power",
  thruster: "thrust",
  mining: "mining",
  processor: "production",
  plasma: "production",
  research: "research",
  turret: "weapon",
  missile: "weapon",
  shield: "defense",
  armor: "defense",
  repair: "repair"
};

const FACILITY_ROLE_LABEL = {
  support: "支撑",
  power: "供电",
  thrust: "推进",
  mining: "采矿",
  production: "加工",
  research: "研发",
  weapon: "武器",
  defense: "防御",
  repair: "维修"
};

const FACILITY_SHORT_PURPOSE = {
  frame: "扩展结构与连接面",
  power: "供应空间站电力",
  thruster: "提供推进与机动",
  mining: "近天体自动采矿",
  processor: "矿石转金属",
  plasma: "气体精炼为等离子",
  research: "产出研发点数",
  turret: "自动近程开火",
  missile: "手动远程齐射",
  shield: "定向护盾拦截",
  armor: "高耐久护甲层",
  repair: "派出无人机维修"
};

const BUILD_PALETTE_TIP_COPY = {
  core_capability_missing: {
    mining: "推荐：当前无采矿能力，先建立资源收入。",
    power: "推荐：先补供电，避免关键设施断电。",
    thrust: "推荐：跃迁前补推进能力。",
    weapon: "推荐：敌袭前补基础火力。",
    defense: "推荐：已有火力，补一层基础防护更稳。",
    repair: "推荐：维修能力不足，受损后恢复慢。",
    support: "推荐：扩展结构与连接面。",
    production: "推荐：补加工链，提高资源转化。",
    research: "推荐：补研发产出，解锁升级。"
  },
  capability_limited: "推荐：同类设施已建但未运作，先检查供电。",
  power_pressure: "推荐：先补供电，避免关键设施断电。",
  redundant_high_count: "已有较多同类设施，先检查电力。"
};

const SELECTED_DIAGNOSTICS_COPY = {
  enabled: "启用",
  disabled_manual: "已手动关闭",
  active: "运作中",
  power_starved: "电力不足停机",
  detached: "已脱离核心",
  connected: "已连通核心",
  nozzle_blocked: "喷口被遮挡",
  harvesting: "正在采集",
  mining_standby_gap: "待命：距资源外环还差",
  mining_standby_empty: "范围内暂无可用资源",
  mining_no_body: "附近无资源外环",
  weapon_ready: "火力可用：有供电，射程内敌人可攻击",
  weapon_no_power: "火力断电：补供电后参与战斗",
  weapon_no_target: "暂无目标：武器就绪，等待敌人进入射程",
  weapon_los_blocked: "射线受限：当前方向可能被自机遮挡",
  weapon_boundary: "射程约",
  shield_active: "基础护盾存在，定向拦截来袭弹体",
  shield_no_power: "护盾缺电：补供电后恢复拦截",
  shield_broken: "护盾已被打破，正在恢复",
  armor_note: "高耐久护甲层，吸收伤害",
  repair_active: "维修可用：会派出无人机修复受损目标",
  repair_no_power: "维修缺电：补供电后恢复",
  repair_idle: "维修就绪：当前无受损目标",
  power_out: "产电",
  power_use: "耗电",
  power_neutral: "不耗电"
};

const PLACEMENT_DIAGNOSTICS_COPY = {
  occupied: "该格已有设施",
  no_neighbor: "未连接空间站核心",
  placement_invalid: "当前位置不可放置",
  resource_low: "资源不足，暂时不能建造",
  out_of_mining_range: "未覆盖资源外环，当前位置采不到资源",
  power_pressure: "建造后电力紧张，关键设施可能断电",
  power_negative: "建造后电力为负，部分设施可能断电",
  mining_good: "覆盖资源外环，适合采集",
  mining_far: "距离资源外环偏远，采矿效率可能不足",
  weapon_tip: "建议放在外缘，减少自机遮挡射线",
  shield_tip: "定向护盾需朝向主要来袭方向",
  repair_tip: "靠近核心或受损密集区，维修响应更快",
  power_tip: "先补发电或关闭低优先级耗电设施，稳定供电",
  can_place: "可放置",
  margin_after: "建后余量"
};

const STATION_DESIGN_HEALTH_LABELS = Object.freeze({
  power: "电力余量",
  mining: "采矿能力",
  thrust: "推进能力",
  firepower: "火力",
  defense: "防御",
  repair: "维修"
});

const STATION_DESIGN_HEALTH_STATUS_LABELS = Object.freeze({
  good: "良好",
  warn: "注意",
  bad: "短板"
});

const DESIGN_HEALTH_SAMPLE_INTERVAL = 0.18;
const DESIGN_ISSUE_ALERT_MAX = 2;
const DESIGN_ISSUE_ALERT_COOLDOWN_SEC = 8;
const DESIGN_ISSUE_PRIORITY = Object.freeze({
  enemy_incoming_no_defense: 1,
  mass_blackout: 3,
  mining_no_target: 4,
  weapons_offline: 5,
  shield_offline: 6,
  repair_gap: 7
});
const DESIGN_ISSUE_COPY = Object.freeze({
  enemy_incoming_no_defense: "敌袭临近：无火力或无防御",
  mass_blackout: "多处断电影响核心能力",
  mining_no_target: "采矿站未覆盖资源",
  weapons_offline: "武器全部断电",
  shield_offline: "护盾断电",
  repair_gap: "维修跟不上损伤"
});

const COMBAT_EVENT_BUFFER_CAPACITY = 120;
const COMBAT_WINDOW_QUIET_SEC = 6;
const COMBAT_WINDOW_MIN_RECORD_SEC = 2;
const COMBAT_THREAT_SAMPLE_INTERVAL = 0.18;
const RECENT_DAMAGE_WINDOW_SEC = 12;
const THREAT_ALERT_COOLDOWN_SEC = 8;
const THREAT_STATUS_ALERT_MAX = 1;
const COMBAT_WEAPON_ALERT_MAX = 1;
const WEAPON_EFFECTIVENESS_ALERT_COOLDOWN_SEC = 8;
const COMBAT_REVIEW_SAMPLE_INTERVAL = 0.18;
const COMBAT_REVIEW_VISIBLE_SEC = 12;

const WEAPON_EFFECTIVENESS_COPY = Object.freeze({
  weapon_no_power: "炮塔缺电，无法开火",
  weapon_no_target: "炮塔暂无可攻击目标",
  all_turrets_los_blocked: "所有炮塔射线被遮挡",
  missile_reloading: "导弹全部装填中",
  missile_no_target: "导弹暂无可攻击目标",
  missile_no_resource: "导弹齐射缺资源",
  shield_no_power: "护盾缺电，防御失效",
  shield_broken: "护盾充能中",
  shield_missing: "当前没有护盾覆盖",
  priority_target_active: "已锁定优先目标",
  priority_target_stale: "锁敌即将过期",
  priority_target_out_of_range: "锁敌目标超出射程"
});

const COMBAT_DAMAGE_ALERT_COOLDOWN_SEC = 8;
const COMBAT_DAMAGE_ALERT_MAX = 1;
const COMBAT_DAMAGE_SAMPLE_INTERVAL = 0.12;

const DAMAGE_SOURCE_LABELS = Object.freeze({
  pirate: "海盗火力",
  asteroid: "小行星撞击",
  station: "敌方建筑火力",
  guardian: "守护者火力",
  "hostile-station": "敌方空间站远程",
  collision: "撞击伤害",
  player: "我方火力",
  enemy_fire: "敌对火力",
  unknown: "未知来源"
});

const DAMAGE_SOURCE_REASON_KEYS = Object.freeze({
  pirate: "station_under_pirate_fire",
  asteroid: "station_under_asteroid_impact",
  station: "station_under_hostile_station_fire",
  guardian: "station_under_hostile_station_fire",
  "hostile-station": "station_under_hostile_station_fire",
  enemy_fire: "station_under_hostile_station_fire",
  collision: "station_under_asteroid_impact"
});

const DAMAGE_SOURCE_KEY_ALIASES = Object.freeze({
  station_under_asteroid_impact: "asteroid",
  asteroid_collision_risk: "asteroid",
  main_damage_asteroid: "asteroid",
  station_under_pirate_fire: "pirate",
  pirate_closing: "pirate",
  main_damage_pirate: "pirate",
  station_under_hostile_station_fire: "station",
  hostile_station_pressure: "hostile-station",
  boss_in_weapon_range: "hostile-station",
  guardian_pressure: "guardian",
  main_damage_guardian: "guardian",
  main_damage_hostile_station: "hostile-station",
  main_damage_station: "station"
});

const SALVO_SIZE_LABELS = Object.freeze({
  1: "单发",
  2: "齐射 2",
  3: "齐射 3",
  999: "齐射全部"
});

const THREAT_KIND_LABELS = Object.freeze({
  asteroid: "小行星",
  pirate: "海盗",
  station: "敌方建筑",
  guardian: "守护者",
  "hostile-station": "敌方空间站"
});

const THREAT_DIRECTION_LABELS = Object.freeze({
  up: "上方",
  upRight: "右上",
  right: "右侧",
  downRight: "右下",
  down: "下方",
  downLeft: "左下",
  left: "左侧",
  upLeft: "左上"
});

const THREAT_DIRECTION_ARROWS = Object.freeze({
  up: "↑",
  upRight: "↗",
  right: "→",
  downRight: "↘",
  down: "↓",
  downLeft: "↙",
  left: "←",
  upLeft: "↖"
});

const COMBAT_REVIEW_SOURCE_REASON_KEYS = Object.freeze({
  pirate: "main_damage_pirate",
  asteroid: "main_damage_asteroid",
  station: "main_damage_station",
  guardian: "main_damage_guardian",
  "hostile-station": "main_damage_hostile_station",
  enemy_fire: "main_damage_station"
});

const COMBAT_REVIEW_AREA_REASON_KEYS = Object.freeze({
  core: "worst_area_core",
  thrust: "worst_area_thrust",
  weapon: "worst_area_weapon",
  defense: "worst_area_defense",
  power: "worst_area_power",
  mining: "worst_area_mining"
});

const COMBAT_REVIEW_RECOMMENDATION_COPY = Object.freeze({
  rebuild_shield: "可考虑补充或修复护盾覆盖。",
  add_power_source: "可考虑增加发电，优先恢复关键战斗设施。",
  consider_missile_salvo: "可考虑在高压阶段更早使用导弹齐射。",
  add_thruster_cover: "可考虑为推进器增加掩护，降低撞击损伤。",
  add_repair_station: "可考虑增加维修站覆盖，缩短抢修路径。",
  reposition_weapons: "可考虑调整武器布局，减少射线遮挡。"
});

const WEAPON_TYPES = new Set(["turret", "missile", "shield"]);
const GLOBAL_WEAPON_MOD_TYPES = new Set(["turret", "missile"]);
const CLAMPED_STAT_KEYS = new Set(["damage", "reload", "range", "maxShield", "maxHp", "regen", "thrust"]);

const MINING_RANGE_OFFSET = 130;

const TIER_UPGRADE_COSTS = [5, 10, 20];
const MODIFICATION_COST = 30;
const HULL_MOD_COST = 50;
const WEAPON_MOD_COST = 50;
const GLOBAL_RESEARCH_UNLOCK_VALUE = 1.05;
const MODIFIABLE_FACILITIES = new Set(["turret", "missile", "shield", "thruster"]);

const UPGRADE_STAT_LABELS = {
  damage: "伤害",
  reload: "射速",
  range: "射程",
  projectileSpeed: "弹速",
  maxShield: "护盾",
  regen: "回复",
  powerOut: "产电",
  mineRate: "采矿",
  produceRate: "产出",
  repairRate: "维修",
  maxHp: "耐久",
  maxFrameHp: "骨架",
  thrust: "推力"
};

const PLAYER_PHYSICS = {
  keyboardThrust: 108,
  thrusterThrust: 110,
  massPerCell: 0.2,
  linearDamping: 0.27,
  angularDamping: 0.62,
  coastDampingMult: 3.2,
  coastHighSpeedDamping: 0.32,
  coastHighSpeedThreshold: 60
};

const FRAGMENT_LAUNCH_SPEED_MIN = 22;
const FRAGMENT_LAUNCH_SPEED_MAX = 36;
const FRAGMENT_LAUNCH_JITTER = 12;
const FRAGMENT_ANGULAR_VEL_MIN = -0.6;
const FRAGMENT_ANGULAR_VEL_MAX = 0.6;
const FRAGMENT_ANGULAR_JITTER = 0.15;
const FRAGMENT_LINEAR_DAMP = 0.06;
const FRAGMENT_ANGULAR_DAMP = 0.35;
const FRAGMENT_MAX_LINEAR_SPEED = 180;
const FRAGMENT_MAX_ANGULAR_SPEED = 2.4;
const FRAGMENT_MAX_COUNT = 8;
const FRAGMENT_MAX_CELLS_PER = 32;
const DETACHED_CELLS_TOTAL_SOFT_CAP = 80;
const DETACHED_CELLS_TOTAL_HARD_CAP = 120;
const FRAGMENT_BOUNDARY_WARN_DISTANCE = 100;
const FRAGMENT_BOUNDARY_REMOVE_MARGIN = 200;
const FRAGMENT_RENDER_ALPHA = 0.55;
const FRAGMENT_RENDER_DESATURATION = 0.7;
const FRAGMENT_RENDER_OUTLINE_COLOR = [0.92, 0.6, 0.32, 0.8];
const WRECK_FRAGMENT_MAX_COUNT = 6;
const WRECK_LAUNCH_SPEED_MIN = 7;
const WRECK_LAUNCH_SPEED_MAX = 14;
const WRECK_LAUNCH_JITTER = 4;
const WRECK_ANGULAR_VEL_MIN = -0.3;
const WRECK_ANGULAR_VEL_MAX = 0.3;
const WRECK_ANGULAR_JITTER = 0.08;
const WRECK_SPAWN_DIST_MIN = 200;
const WRECK_SPAWN_DIST_MAX = 600;
const WRECK_PLANET_BUFFER = 50;
const WRECK_ASTEROID_BUFFER = 30;
const WRECK_MIN_SEPARATION = 100;
const WRECK_RENDER_OUTLINE_COLOR = [0.55, 0.72, 0.88, 0.85];
const WRECK_RENDER_DESATURATION = 0.45;
const WRECK_FACILITY_WEIGHTS = [
  ["turret", 0.6],
  ["shield", 0.2],
  ["armor", 0.15],
  ["repair", 0.05]
];
// v0.6.0 hostile-station 死亡 wreck 设施分布（数值方案 §7；与 salvage 用 WRECK_FACILITY_WEIGHTS 独立）
const ENEMY_WRECK_FACILITY_WEIGHTS = [
  ["turret", 0.50],
  ["shield", 0.25],
  ["armor", 0.15],
  ["repair", 0.10]
];
// v0.8.0 derelict / signal wreck 设施权重（ADR §2.8；映射至现有 TYPES 设施）
const DERELICT_FACILITY_WEIGHTS = [
  ["plasma", 18], ["missile", 12], ["research", 10], ["power", 8],
  ["turret", 5], ["shield", 6], ["armor", 5], ["mining", 6], ["processor", 5]
];
const SIGNAL_FACILITY_WEIGHTS = [
  ["plasma", 22], ["missile", 6], ["research", 14], ["power", 14],
  ["turret", 4], ["shield", 5], ["armor", 3], ["mining", 4], ["processor", 3]
];
const ENCOUNTER_NPC_COLOR_TRADER = [0.37, 0.77, 0.38, 1];
const ENCOUNTER_NPC_COLOR_DISTRESS = [0.36, 0.88, 0.88, 1];
const ENCOUNTER_NPC_COLOR_AMBUSH = [1, 0.27, 0.27, 1];
const HOSTILE_STATION_WRECK_COUNT_BY_LEVEL = { 3: 6, 4: 9, 5: 12 };
const HOSTILE_STATION_WRECK_SPAWN_RADIUS_MIN = 80;
const HOSTILE_STATION_WRECK_SPAWN_RADIUS_MAX = 150;

// v0.6.0 hostile-station：总 HP 池 + cells 布局（数值方案 §1+§2，ADR 拍板）
const HOSTILE_STATION_LEVEL_HP = {
  3: 1500,
  4: 2200,
  5: 3000
};
const HOSTILE_STATION_LAYOUT_LEVEL3 = [
  { key: "0,0",  facility: "core",   baseHp: 160 },
  { key: "0,-1", facility: "power",  baseHp: 150 },
  { key: "1,0",  facility: "turret", baseHp: 300 },
  { key: "-1,0", facility: "turret", baseHp: 280 },
  { key: "0,1",  facility: "shield", baseHp: 130 },
  { key: "1,1",  facility: "armor",  baseHp: 320 },
  { key: "-1,1", facility: "frame",  baseHp: 160 }
];
const HOSTILE_STATION_CORE_KEY = "0,0";
const HOSTILE_STATION_HIT_RADIUS = CELL * 0.55;
const HOSTILE_STATION_WEAPON_STATS = {
  3: {
    turret: { damage: 12, reload: 1.6, range: 480, projectileSpeed: 280 },
    shield: { range: 110, maxShield: 200, regen: 8 }
  },
  4: {
    turret: { damage: 14, reload: 1.6, range: 515, projectileSpeed: 300 },
    shield: { range: 130, maxShield: 280, regen: 10 }
  },
  5: {
    turret: { damage: 15, reload: 1.6, range: 550, projectileSpeed: 320 },
    shield: { range: 150, maxShield: 360, regen: 12 }
  }
};
const ASSAULT_METAL_BASE_BY_LEVEL = { 3: 35, 4: 40, 5: 45 };
const ASSAULT_RESEARCH_REWARD_BY_LEVEL = { 3: 9, 4: 9, 5: 10 };
const NPC_RADIUS = 20;
const NPC_ARRIVE_RADIUS = 80;
const NPC_AVOID_MARGIN = 60;
const NPC_AVOID_WEIGHT = 2.2;
const NPC_TURN_SPEED = 1.2;
const NPC_COLLISION_COOLDOWN = 0.35;
const NPC_HUD_SAMPLE_INTERVAL = 0.2;
const ESCORT_JOURNEY_MIN = 1200;
const ESCORT_JOURNEY_MAX = 1800;
const ESCORT_START_OFFSET_MIN = 600;
const ESCORT_START_OFFSET_MAX = 800;
const ESCORT_TIMEOUT_SEC = 360;
const SALVAGE_TIMEOUT_SEC = 480;
const NPC_HP_BY_LEVEL = [0, 200, 200, 250, 300, 300];
const BRIDGE_DISTANCE = CELL * 1.2;
const BRIDGE_ANGLE = 0.436;
const BRIDGE_PREVIEW_DISTANCE = CELL * 1.6;
const BRIDGE_PREVIEW_ANGLE_TOLERANT = 0.611;
const FRAGMENT_PROJECTILE_HIT_RADIUS = CELL * 0.48;
const FRAGMENT_HUD_WARN_COUNT = 4;
const FRAGMENT_HUD_SAMPLE_INTERVAL = 0.2;
const BRIDGE_PREVIEW_RING_READY = [0.4, 0.95, 0.6, 0.9];
const BRIDGE_PREVIEW_RING_NEAR = [0.95, 0.85, 0.35, 0.85];

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

const RUN_BASE_STARTING_RESOURCES = Object.freeze({
  metal: 130,
  ore: 60,
  gas: 35,
  plasma: 8,
  research: 0
});

const META_SCHEMA_VERSION = 2;
const META_DEFAULT_PROTOCOL_ID = "balanced";
const META_TALENT_TREE = [
  {
    id: "miningYield",
    name: "采集校准",
    desc: "提升所有采集设施的产出。",
    category: "resource",
    tier: 1,
    cost: [1, 1, 2],
    maxRank: 3,
    prereq: [],
    effects: [{ key: "miningYield", op: "addPercent", perRank: 0.1 }],
    uiHint: { color: "resource", icon: "ore", recommendTag: "新手推荐" }
  },
  {
    id: "metalRefining",
    name: "金属精炼",
    desc: "所有建造的金属消耗降低。",
    category: "resource",
    tier: 2,
    cost: [2, 3],
    maxRank: 2,
    prereq: [{ nodeId: "miningYield", rank: 1 }],
    effects: [{ key: "metalRefining", op: "mul", perRankMul: 0.95 }],
    uiHint: { color: "resource", icon: "metal", recommendTag: "" }
  },
  {
    id: "startingCache",
    name: "启程储备",
    desc: "开局获得少量额外金属与矿石储备。",
    category: "resource",
    tier: 2,
    cost: [2, 2],
    maxRank: 2,
    prereq: [{ nodeId: "miningYield", rank: 2 }],
    effects: [
      { key: "startingMetal", op: "add", perRank: 15 },
      { key: "startingOre", op: "add", perRank: 6 },
      { key: "unlockProtocol", protocol: "miningStart", atRank: 1 }
    ],
    uiHint: { color: "resource", icon: "cache", recommendTag: "解锁采矿协议" }
  },
  {
    id: "hullIntegrity",
    name: "框架强化",
    desc: "提升所有框架与单元的最大耐久。",
    category: "defense",
    tier: 1,
    cost: [1, 1, 2],
    maxRank: 3,
    prereq: [],
    effects: [{ key: "hullIntegrity", op: "addPercent", perRank: 0.1 }],
    uiHint: { color: "defense", icon: "shield", recommendTag: "新手推荐" }
  },
  {
    id: "coreFortitude",
    name: "核心加固",
    desc: "仅提升核心舱的最大耐久。",
    category: "defense",
    tier: 2,
    cost: [2, 3],
    maxRank: 2,
    prereq: [{ nodeId: "hullIntegrity", rank: 1 }],
    effects: [
      { key: "coreFortitude", op: "addPercent", perRank: 0.1 },
      { key: "unlockProtocol", protocol: "defenseStart", atRank: 1 }
    ],
    uiHint: { color: "defense", icon: "core", recommendTag: "解锁防御协议" }
  },
  {
    id: "buildDiscount",
    name: "模块化设计",
    desc: "所有设施的建造资源消耗降低。",
    category: "defense",
    tier: 3,
    cost: [3, 4],
    maxRank: 2,
    prereq: [
      { nodeId: "hullIntegrity", rank: 2 },
      { nodeId: "metalRefining", rank: 1 }
    ],
    effects: [{ key: "buildDiscount", op: "mul", perRankMul: 0.96 }],
    uiHint: { color: "defense", icon: "blueprint", recommendTag: "" }
  },
  {
    id: "weaponCalibration",
    name: "武器校准",
    desc: "提升所有武器单元的伤害输出。",
    category: "weapon",
    tier: 1,
    cost: [1, 1, 2],
    maxRank: 3,
    prereq: [],
    effects: [
      { key: "weaponCalibration", op: "addPercent", perRank: 0.1 },
      { key: "unlockProtocol", protocol: "weaponStart", atRank: 2 }
    ],
    uiHint: { color: "weapon", icon: "turret", recommendTag: "解锁武器协议" }
  },
  {
    id: "weaponFrame",
    name: "高级武器框架",
    desc: "解锁高级武器框架蓝图。",
    category: "weapon",
    tier: 3,
    cost: [3],
    maxRank: 1,
    prereq: [{ nodeId: "weaponCalibration", rank: 2 }],
    effects: [{ key: "weaponFrame", op: "flag" }],
    uiHint: { color: "weapon", icon: "frame", recommendTag: "解锁" }
  },
  {
    id: "weaponEfficiency",
    name: "推进效率",
    desc: "提升武器单元附带的推力效率。",
    category: "weapon",
    tier: 2,
    cost: [2, 2],
    maxRank: 2,
    prereq: [{ nodeId: "weaponCalibration", rank: 1 }],
    effects: [{ key: "weaponEfficiency", op: "addPercent", perRank: 0.05 }],
    uiHint: { color: "weapon", icon: "thrust", recommendTag: "" }
  },
  {
    id: "researchInsight",
    name: "科研洞察",
    desc: "完成任务获得的局内科研点提升。",
    category: "exploration",
    tier: 1,
    cost: [1, 2],
    maxRank: 2,
    prereq: [],
    effects: [{ key: "researchInsight", op: "addPercent", perRank: 0.12 }],
    uiHint: { color: "exploration", icon: "research", recommendTag: "" }
  },
  {
    id: "efficientCore",
    name: "高效核心",
    desc: "解锁高效核心蓝图。",
    category: "exploration",
    tier: 3,
    cost: [3],
    maxRank: 1,
    prereq: [{ nodeId: "researchInsight", rank: 1 }],
    effects: [{ key: "efficientCore", op: "flag" }],
    uiHint: { color: "exploration", icon: "core-plus", recommendTag: "解锁" }
  },
  {
    id: "galaxyForesight",
    name: "星图洞察",
    desc: "解锁星图探索开局协议与星系提示能力。",
    category: "exploration",
    tier: 4,
    cost: [4],
    maxRank: 1,
    prereq: [
      { nodeId: "researchInsight", rank: 2 },
      { nodeId: "efficientCore", rank: 1 }
    ],
    effects: [
      { key: "galaxyForesight", op: "flag" },
      { key: "earlyHint", op: "flag" },
      { key: "unlockProtocol", protocol: "scoutStart", atRank: 1 }
    ],
    uiHint: { color: "exploration", icon: "starmap", recommendTag: "长期目标" }
  }
];
const META_TALENT_INDEX = Object.fromEntries(META_TALENT_TREE.map((node) => [node.id, node]));

const START_PROTOCOLS = [
  { id: "balanced", name: "标准开局", desc: "无额外补给，按基础规则开局。", unlock: null, effects: [] },
  {
    id: "miningStart",
    name: "采矿起步",
    desc: "开局获得额外金属储备，采矿设施造价降低。",
    unlock: { nodeId: "startingCache", rank: 1 },
    effects: [
      { key: "startingMetal", op: "add", value: 25 },
      { key: "startingOre", op: "add", value: 10 },
      { key: "miningFacilityDiscount", op: "mul", value: 0.85 },
      { key: "earlyHint", op: "flag", value: true }
    ]
  },
  {
    id: "defenseStart",
    name: "防御起步",
    desc: "开局核心与框架耐久增益。",
    unlock: { nodeId: "coreFortitude", rank: 1 },
    effects: [
      { key: "startingHullBonus", op: "addPercent", value: 0.08 },
      { key: "startingMetal", op: "add", value: 10 },
      { key: "earlyHint", op: "flag", value: true }
    ]
  },
  {
    id: "weaponStart",
    name: "武器起步",
    desc: "武器设施造价折扣并获得少量额外等离子。",
    unlock: { nodeId: "weaponCalibration", rank: 2 },
    effects: [
      { key: "weaponFacilityDiscount", op: "mul", value: 0.85 },
      { key: "startingPlasma", op: "add", value: 3 },
      { key: "earlyHint", op: "flag", value: true }
    ]
  },
  {
    id: "scoutStart",
    name: "星图探索",
    desc: "开局获得少量气体并解锁更多星图提示。",
    unlock: { nodeId: "galaxyForesight", rank: 1 },
    effects: [
      { key: "startingGas", op: "add", value: 8 },
      { key: "earlyHint", op: "flag", value: true }
    ]
  }
];
const START_PROTOCOL_INDEX = Object.fromEntries(START_PROTOCOLS.map((protocol) => [protocol.id, protocol]));

const META_EFFECT_MODE = {
  miningYield: "addPercent",
  metalRefining: "mul",
  startingMetal: "add",
  startingOre: "add",
  hullIntegrity: "addPercent",
  coreFortitude: "addPercent",
  buildDiscount: "mul",
  weaponCalibration: "addPercent",
  weaponFrame: "flag",
  weaponEfficiency: "addPercent",
  researchInsight: "addPercent",
  efficientCore: "flag",
  galaxyForesight: "flag",
  startingGas: "add",
  startingPlasma: "add",
  startingHullBonus: "addPercent",
  miningFacilityDiscount: "mul",
  weaponFacilityDiscount: "mul",
  earlyHint: "flag"
};
const START_PROTOCOL_RESOURCE_EFFECT_MAP = Object.freeze({
  startingMetal: "metal",
  startingOre: "ore",
  startingGas: "gas",
  startingPlasma: "plasma"
});
const START_PROTOCOL_FACILITY_DISCOUNT_MAP = Object.freeze({
  miningFacilityDiscount: "mining",
  weaponFacilityDiscount: "weapon"
});
const START_PROTOCOL_RESOURCE_BONUS_CAP_RATIO = 0.5;
const START_PROTOCOL_HULL_BONUS_MAX = 0.15;
const START_PROTOCOL_FACILITY_DISCOUNT_MIN = 0.8;
const START_PROTOCOL_HINT_TEXT = Object.freeze({
  miningStart: "采矿起步已生效：优先部署采矿设施，尽快拉高基础资源滚动。",
  defenseStart: "防御起步已生效：优先稳住核心与外环，前期容错更高。",
  weaponStart: "武器起步已生效：优先补武器设施，尽早建立火力网。",
  scoutStart: "星图探索已生效：优先观察星系提示，规划下一跳路径。"
});

const state = {
  paused: false,
  time: 0,
  lastTime: performance.now(),
  camera: { x: 0, y: 0, zoom: 1, shakeTimer: 0, shakeAmt: 0, shakeX: 0, shakeY: 0 },
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
    designHealthSummary: "",
    status: "",
    selected: "",
    selectedDiagnostics: "",
    selectedUpgradeKey: "",
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
    awaitingObjectiveChoice: false,
    objectiveChoiceDismissed: false,
    completedObjectives: 0,
    playerCount: loadPlayerCount(),
    seed: 0,
    spawnFractional: 0,
    totalObjectiveRewardBase: 0,
    settlementBonus: 0,
    settlementBonusGranted: false,
    settlementShown: false,
    settlementMode: "victory",
    endgame: false,
    guardianSpawned: false,
    guardianDefeated: false,
    guardianSpawnDelay: 0,
    endgameExplore: false,
    endgameActivityFraction: 0,
    endgameActivityPoints: 0,
    escortLowHpAlerted: false,
    hostileStationSpawnedThisGalaxy: false,
    hostileStationAlerted: false,
    encounters: [], // v0.8.0：本星系随机事件列表（pending/active/complete/failed/expired）
    encounterCooldownThisGalaxy: new Set(), // v0.8.0：单星系事件冷却（按 encounter.type）
    // v0.9.0：局间星系图状态；走 runtime 路径不进 SAVE_KEY，刷新即重置
    galaxyMap: { nodes: [], currentNodeId: null, pendingChoices: [] },
    currentGalaxyType: "emptyVoid",
    galaxyChoicesShown: false,
    activeStartProtocolId: META_DEFAULT_PROTOCOL_ID,
    startupFacilityDiscounts: { mining: 1, weapon: 1 },
    startupHullBonus: 1,
    startupResourceBonus: { metal: 0, ore: 0, gas: 0, plasma: 0 },
    startupHint: "",
    startupHintUntil: 0,
    metaStartProtocolApplied: false,
    metaPointsGainedThisRun: 0
  },
  resources: { ...RUN_BASE_STARTING_RESOURCES },
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
  fragments: [],
  npcs: [],
  stars: [],
  world: { bodies: [] },
  bodies: [],
  galaxy: {
    level: 0,
    type: "rich",
    seed: 0,
    palette: GALAXY_PALETTES.sun,
    paletteKey: "sun"
  },
  enemies: [],
  projectiles: [],
  repairDrones: [],
  virtualCursor: { x: -780, y: -260, active: false },
  input: {
    moveKeys: new Set(),
    mouseWorld: null,
    controlMode: "screen",
    priorityTarget: null, // v0.7.0：右键锁定的优先目标 { enemy, setAt, validUntil }
    aimingRightButton: false, // v0.7.0：右键按下状态（预留扩展）
    _fLastFireAt: 0
  },
  missile: {
    salvoSize: 1 // v0.7.0：F 键齐射档位，仅 run 内有效
  },
  lastBuildError: "",
  buildHint: "",
  bridgePreview: null,
  placementPreview: null,
  particles: [],
  fireCooldown: 0,
  spawnTimer: LEVEL0_INITIAL_SPAWN_TIMER,
  hudCenterAlertQueue: [], // v0.8.0：中央闪烁告警队列（priority 降序）
  hudCenterAlertCurrent: null // v0.8.0：当前正在显示的中央告警
};

let designHealthSnapshotCache = null;
const designIssueAlertRuntime = {
  activeKeys: new Set(),
  lastRaisedAt: new Map(),
  lastTime: 0
};

const combatEventBuffer = [];
const combatWindowState = {
  active: false,
  pendingArchive: false,
  startedAt: null,
  lastActiveAt: null,
  archivedAt: null,
  current: null,
  lastArchived: null
};
let threatSummaryCache = null;
let weaponEffectivenessCache = null;
let recentDamageSummaryCache = null;
let repairStatusSummaryCache = null;
let combatReviewCache = null;

let fragmentIdSeed = 1;
let npcIdSeed = 1;
// v0.9.0：galaxyMap.nodes 节点 id 序列，跨关累计，run 间不重置
let galaxyNodeIdSeed = 0;

function isMetaObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function getMetaTalentNode(talentId) {
  return typeof talentId === "string" ? META_TALENT_INDEX[talentId] || null : null;
}

function normalizeMetaPoints(rawPoints) {
  const points = Math.floor(Number(rawPoints));
  return Number.isFinite(points) && points > 0 ? points : 0;
}

function createDefaultMetaTalents() {
  const talents = {};
  for (const node of META_TALENT_TREE) {
    talents[node.id] = 0;
  }
  return talents;
}

function createDefaultMetaState() {
  return {
    schemaVersion: META_SCHEMA_VERSION,
    migrationVersion: META_SCHEMA_VERSION,
    points: 0,
    talents: createDefaultMetaTalents(),
    unlockedProtocols: [META_DEFAULT_PROTOCOL_ID],
    selectedStartProtocol: META_DEFAULT_PROTOCOL_ID
  };
}

function createDefaultStartupFacilityDiscounts() {
  return { mining: 1, weapon: 1 };
}

function createDefaultStartupResourceBonus() {
  return { metal: 0, ore: 0, gas: 0, plasma: 0 };
}

function normalizeProtocolDiscountValue(rawValue, fallback = 1) {
  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return clamp(value, START_PROTOCOL_FACILITY_DISCOUNT_MIN, 1);
}

function resetRunStartProtocolRuntimeState(runState = state.run) {
  if (!isMetaObject(runState)) return;
  runState.activeStartProtocolId = META_DEFAULT_PROTOCOL_ID;
  runState.startupFacilityDiscounts = createDefaultStartupFacilityDiscounts();
  runState.startupHullBonus = 1;
  runState.startupResourceBonus = createDefaultStartupResourceBonus();
  runState.startupHint = "";
  runState.startupHintUntil = 0;
  runState.metaStartProtocolApplied = false;
}

function getActiveStartProtocolId(runState = state.run) {
  const activeId = typeof runState?.activeStartProtocolId === "string"
    ? runState.activeStartProtocolId
    : META_DEFAULT_PROTOCOL_ID;
  return START_PROTOCOL_INDEX[activeId] ? activeId : META_DEFAULT_PROTOCOL_ID;
}

function getActiveStartProtocol(runState = state.run) {
  return START_PROTOCOL_INDEX[getActiveStartProtocolId(runState)] || START_PROTOCOL_INDEX[META_DEFAULT_PROTOCOL_ID];
}

function getActiveProtocolFacilityDiscount(facilityKey, runState = state.run) {
  const discounts = isMetaObject(runState?.startupFacilityDiscounts)
    ? runState.startupFacilityDiscounts
    : null;
  if (!discounts) return 1;
  return normalizeProtocolDiscountValue(discounts[facilityKey], 1);
}

function getRunStartupHullBonus(runState = state.run) {
  const value = Number(runState?.startupHullBonus);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return clamp(value, 1, 1 + START_PROTOCOL_HULL_BONUS_MAX);
}

function buildStartProtocolHintText(protocol, resourceBonus, discounts, hullBonusPct) {
  const parts = [];
  if (resourceBonus.metal > 0) parts.push(`金属 +${resourceBonus.metal}`);
  if (resourceBonus.ore > 0) parts.push(`矿石 +${resourceBonus.ore}`);
  if (resourceBonus.gas > 0) parts.push(`气体 +${resourceBonus.gas}`);
  if (resourceBonus.plasma > 0) parts.push(`等离子 +${resourceBonus.plasma}`);
  if (discounts.mining < 1) parts.push(`采矿设施建造 -${Math.round((1 - discounts.mining) * 100)}%`);
  if (discounts.weapon < 1) parts.push(`武器设施建造 -${Math.round((1 - discounts.weapon) * 100)}%`);
  if (hullBonusPct > 0) parts.push(`核心/框架耐久 +${Math.round(hullBonusPct * 100)}%`);
  const protocolName = protocol?.name || "标准开局";
  const routeHint = START_PROTOCOL_HINT_TEXT[protocol?.id] || "";
  const impact = parts.length ? `开局协议「${protocolName}」已生效：${parts.join("，")}。` : `开局协议「${protocolName}」已生效。`;
  return routeHint ? `${impact} ${routeHint}` : impact;
}

function applyMetaStartProtocol(runState = state.run, metaState = state.meta) {
  if (!isMetaObject(runState)) {
    return { ok: false, reason: "invalid_run_state" };
  }
  if (runState.metaStartProtocolApplied) {
    return {
      ok: true,
      alreadyApplied: true,
      activeProtocolId: getActiveStartProtocolId(runState)
    };
  }

  resetRunStartProtocolRuntimeState(runState);
  const selectedId = getSelectedStartProtocol(metaState);
  const protocol = START_PROTOCOL_INDEX[selectedId] || START_PROTOCOL_INDEX[META_DEFAULT_PROTOCOL_ID];
  const resourceBonus = createDefaultStartupResourceBonus();
  const facilityDiscounts = createDefaultStartupFacilityDiscounts();
  let hullBonusPct = 0;
  let hasEarlyHint = false;

  for (const effect of protocol?.effects || []) {
    if (!effect || typeof effect.key !== "string") continue;
    const resourceKey = START_PROTOCOL_RESOURCE_EFFECT_MAP[effect.key];
    if (resourceKey) {
      const base = RUN_BASE_STARTING_RESOURCES[resourceKey] || 0;
      const cap = Math.floor(base * START_PROTOCOL_RESOURCE_BONUS_CAP_RATIO);
      const value = Math.max(0, Math.floor(Number(effect.value) || 0));
      if (cap > 0 && value > 0) {
        resourceBonus[resourceKey] += Math.min(value, cap);
      }
      continue;
    }
    const facilityKey = START_PROTOCOL_FACILITY_DISCOUNT_MAP[effect.key];
    if (facilityKey) {
      facilityDiscounts[facilityKey] = normalizeProtocolDiscountValue(effect.value, 1);
      continue;
    }
    if (effect.key === "startingHullBonus") {
      const value = Number(effect.value);
      if (Number.isFinite(value) && value > 0) {
        hullBonusPct = clamp(hullBonusPct + value, 0, START_PROTOCOL_HULL_BONUS_MAX);
      }
      continue;
    }
    if (effect.key === "earlyHint") {
      hasEarlyHint = hasEarlyHint || effect.value !== false;
    }
  }

  for (const [resourceKey, bonus] of Object.entries(resourceBonus)) {
    if (bonus <= 0) continue;
    const current = Number(state.resources[resourceKey]);
    state.resources[resourceKey] = (Number.isFinite(current) ? current : 0) + bonus;
  }

  runState.activeStartProtocolId = protocol?.id || META_DEFAULT_PROTOCOL_ID;
  runState.startupFacilityDiscounts = facilityDiscounts;
  runState.startupHullBonus = 1 + hullBonusPct;
  runState.startupResourceBonus = resourceBonus;
  runState.metaStartProtocolApplied = true;
  if (hasEarlyHint) {
    runState.startupHint = buildStartProtocolHintText(protocol, resourceBonus, facilityDiscounts, hullBonusPct);
    runState.startupHintUntil = state.time + 90;
  }

  return {
    ok: true,
    activeProtocolId: runState.activeStartProtocolId,
    startupFacilityDiscounts: { ...runState.startupFacilityDiscounts },
    startupResourceBonus: { ...runState.startupResourceBonus },
    startupHullBonus: runState.startupHullBonus,
    startupHint: runState.startupHint
  };
}

function clampMetaTalentRank(talentId, rawRank) {
  const node = getMetaTalentNode(talentId);
  if (!node) return 0;
  const rank = Math.floor(Number(rawRank));
  if (!Number.isFinite(rank)) return 0;
  return Math.max(0, Math.min(node.maxRank, rank));
}

function sanitizeMetaTalents(rawTalents) {
  const talents = createDefaultMetaTalents();
  if (!isMetaObject(rawTalents)) return talents;
  for (const node of META_TALENT_TREE) {
    talents[node.id] = clampMetaTalentRank(node.id, rawTalents[node.id]);
  }
  return talents;
}

function recomputeUnlockedProtocols(metaState = state.meta) {
  if (!isMetaObject(metaState)) {
    return [META_DEFAULT_PROTOCOL_ID];
  }
  const unlocked = new Set([META_DEFAULT_PROTOCOL_ID]);
  const talents = isMetaObject(metaState.talents) ? metaState.talents : {};

  for (const node of META_TALENT_TREE) {
    const rank = clampMetaTalentRank(node.id, talents[node.id]);
    if (rank <= 0) continue;
    for (const effect of node.effects || []) {
      if (effect?.key !== "unlockProtocol" || typeof effect.protocol !== "string") continue;
      const requiredRank = Math.max(1, Math.floor(Number(effect.atRank) || 1));
      if (rank >= requiredRank && START_PROTOCOL_INDEX[effect.protocol]) {
        unlocked.add(effect.protocol);
      }
    }
  }

  for (const protocol of START_PROTOCOLS) {
    if (!protocol.unlock) {
      unlocked.add(protocol.id);
      continue;
    }
    const unlockNodeId = protocol.unlock.nodeId;
    const unlockRank = Math.max(1, Math.floor(Number(protocol.unlock.rank) || 1));
    if (getMetaTalentRank(unlockNodeId, metaState) >= unlockRank) {
      unlocked.add(protocol.id);
    }
  }

  const ordered = START_PROTOCOLS
    .map((protocol) => protocol.id)
    .filter((protocolId) => unlocked.has(protocolId));
  if (!ordered.includes(META_DEFAULT_PROTOCOL_ID)) {
    ordered.unshift(META_DEFAULT_PROTOCOL_ID);
  }
  metaState.unlockedProtocols = ordered;
  if (!ordered.includes(metaState.selectedStartProtocol)) {
    metaState.selectedStartProtocol = META_DEFAULT_PROTOCOL_ID;
  }
  return ordered.slice();
}

function ensureMetaState(rawMeta) {
  if (!isMetaObject(rawMeta)) return createDefaultMetaState();
  const meta = createDefaultMetaState();
  meta.points = normalizeMetaPoints(rawMeta.points);
  meta.talents = sanitizeMetaTalents(rawMeta.talents);
  const selectedProtocol = typeof rawMeta.selectedStartProtocol === "string"
    ? rawMeta.selectedStartProtocol
    : (typeof rawMeta.selectedProtocol === "string" ? rawMeta.selectedProtocol : META_DEFAULT_PROTOCOL_ID);
  meta.selectedStartProtocol = START_PROTOCOL_INDEX[selectedProtocol]
    ? selectedProtocol
    : META_DEFAULT_PROTOCOL_ID;
  recomputeUnlockedProtocols(meta);
  return meta;
}

function migrateMetaSave(rawMeta) {
  if (!isMetaObject(rawMeta)) return createDefaultMetaState();
  const meta = ensureMetaState(rawMeta);
  // 兼容“混合存档”：即便已有 talents，也继续合并旧字段映射，确保旧值不丢失。
  meta.talents.miningYield = Math.max(
    meta.talents.miningYield,
    clampMetaTalentRank("miningYield", rawMeta.mining)
  );
  meta.talents.hullIntegrity = Math.max(
    meta.talents.hullIntegrity,
    clampMetaTalentRank("hullIntegrity", rawMeta.hull)
  );
  meta.talents.weaponCalibration = Math.max(
    meta.talents.weaponCalibration,
    clampMetaTalentRank("weaponCalibration", rawMeta.weapons)
  );
  // 旧 weapons 字段仅映射 weaponCalibration，不附送 weaponEfficiency。
  if (isMetaObject(rawMeta.unlocks)) {
    if (rawMeta.unlocks.weaponFrame) meta.talents.weaponFrame = Math.max(meta.talents.weaponFrame, 1);
    if (rawMeta.unlocks.efficientCore) meta.talents.efficientCore = Math.max(meta.talents.efficientCore, 1);
  }
  recomputeUnlockedProtocols(meta);
  return meta;
}

function captureCorruptMetaRaw(raw, error) {
  const fallbackRaw = typeof raw === "string" ? raw : String(raw ?? "");
  const payload = {
    capturedAt: new Date().toISOString(),
    saveKey: SAVE_KEY,
    reason: error?.message || "parse_failed",
    truncated: fallbackRaw.length > META_CORRUPT_RAW_LIMIT,
    raw: fallbackRaw.slice(0, META_CORRUPT_RAW_LIMIT)
  };
  try {
    sessionStorage.setItem(META_CORRUPT_RAW_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage 被禁用时仍继续默认回退路径
  }
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[meta] 检测到损坏存档，已回退默认 meta。", payload);
  }
}

function loadMeta() {
  let raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return migrateMetaSave({});
    const parsed = JSON.parse(raw);
    return migrateMetaSave(parsed);
  } catch (error) {
    if (typeof raw === "string" && raw.length > 0) {
      captureCorruptMetaRaw(raw, error);
    }
    return createDefaultMetaState();
  }
}

function getMetaTalentRank(talentId, metaState = state.meta) {
  if (!isMetaObject(metaState)) return 0;
  const talents = isMetaObject(metaState.talents) ? metaState.talents : null;
  return clampMetaTalentRank(talentId, talents ? talents[talentId] : 0);
}

function hasMetaTalent(talentId, metaState = state.meta) {
  return getMetaTalentRank(talentId, metaState) > 0;
}

function getMetaTalentCost(node, targetRank) {
  if (!node) return 0;
  if (Array.isArray(node.cost) && node.cost.length > 0) {
    const index = Math.max(0, Math.min(node.cost.length - 1, targetRank - 1));
    const value = Math.floor(Number(node.cost[index]));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  const value = Math.floor(Number(node.cost));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getMetaPurchaseState(talentId, metaState = state.meta) {
  const node = getMetaTalentNode(talentId);
  const points = normalizeMetaPoints(metaState?.points);
  if (!node) {
    return {
      canBuy: false,
      reason: "unknown_talent",
      nodeId: talentId,
      currentRank: 0,
      maxRank: 0,
      nextCost: 0,
      points,
      missingPrereq: [],
      deficit: 0
    };
  }

  const currentRank = getMetaTalentRank(talentId, metaState);
  const maxRank = Math.max(0, Math.floor(Number(node.maxRank) || 0));
  if (currentRank >= maxRank) {
    return {
      canBuy: false,
      reason: "max_rank_reached",
      nodeId: talentId,
      currentRank,
      maxRank,
      nextCost: 0,
      points,
      missingPrereq: [],
      deficit: 0
    };
  }

  const missingPrereq = [];
  for (const prereq of node.prereq || []) {
    const requiredRank = Math.max(1, Math.floor(Number(prereq.rank) || 1));
    const haveRank = getMetaTalentRank(prereq.nodeId, metaState);
    if (haveRank < requiredRank) {
      missingPrereq.push({
        nodeId: prereq.nodeId,
        requiredRank,
        currentRank: haveRank
      });
    }
  }

  const nextCost = getMetaTalentCost(node, currentRank + 1);
  const deficit = Math.max(0, nextCost - points);
  if (missingPrereq.length > 0) {
    return {
      canBuy: false,
      reason: "prereq_unmet",
      nodeId: talentId,
      currentRank,
      maxRank,
      nextCost,
      points,
      missingPrereq,
      deficit
    };
  }
  if (deficit > 0) {
    return {
      canBuy: false,
      reason: "not_enough_points",
      nodeId: talentId,
      currentRank,
      maxRank,
      nextCost,
      points,
      missingPrereq: [],
      deficit
    };
  }
  return {
    canBuy: true,
    reason: "ok",
    nodeId: talentId,
    currentRank,
    maxRank,
    nextCost,
    points,
    missingPrereq: [],
    deficit: 0
  };
}

function canBuyMetaTalent(talentId, metaState = state.meta) {
  return getMetaPurchaseState(talentId, metaState).canBuy;
}

function purchaseMetaTalent(talentId) {
  const purchaseState = getMetaPurchaseState(talentId, state.meta);
  if (!purchaseState.canBuy) {
    return { ok: false, ...purchaseState };
  }
  state.meta = ensureMetaState(state.meta);
  state.meta.points = Math.max(0, state.meta.points - purchaseState.nextCost);
  state.meta.talents[talentId] = purchaseState.currentRank + 1;
  recomputeUnlockedProtocols(state.meta);
  saveMeta();
  return {
    ok: true,
    nodeId: talentId,
    rankAfter: state.meta.talents[talentId],
    pointsAfter: state.meta.points,
    cost: purchaseState.nextCost
  };
}

function getSelectedStartProtocol(metaState = state.meta) {
  const selected = typeof metaState?.selectedStartProtocol === "string"
    ? metaState.selectedStartProtocol
    : META_DEFAULT_PROTOCOL_ID;
  const unlockedProtocols = Array.isArray(metaState?.unlockedProtocols)
    ? metaState.unlockedProtocols
    : [META_DEFAULT_PROTOCOL_ID];
  if (!START_PROTOCOL_INDEX[selected]) return META_DEFAULT_PROTOCOL_ID;
  return unlockedProtocols.includes(selected) ? selected : META_DEFAULT_PROTOCOL_ID;
}

function selectStartProtocol(protocolId, metaState = state.meta) {
  if (!START_PROTOCOL_INDEX[protocolId]) {
    return { ok: false, reason: "unknown_protocol", protocolId };
  }
  state.meta = ensureMetaState(metaState);
  recomputeUnlockedProtocols(state.meta);
  if (!state.meta.unlockedProtocols.includes(protocolId)) {
    return { ok: false, reason: "protocol_locked", protocolId };
  }
  state.meta.selectedStartProtocol = protocolId;
  saveMeta();
  return { ok: true, protocolId };
}

function applyMetaEffectContribution(effect, rank, mode, totals, fromProtocol = false) {
  if (!effect || !totals) return;
  if (mode === "addPercent" || mode === "add") {
    const perRank = Number(effect.perRank);
    const value = Number(effect.value);
    if (!fromProtocol && Number.isFinite(perRank)) {
      totals.add += perRank * rank;
      return;
    }
    if (Number.isFinite(value)) {
      totals.add += fromProtocol ? value : value * rank;
    }
    return;
  }
  if (mode === "mul") {
    if (!fromProtocol) {
      const perRankMul = Number(effect.perRankMul);
      if (Number.isFinite(perRankMul)) {
        totals.mul *= Math.pow(perRankMul, rank);
        return;
      }
      const value = Number(effect.value);
      if (Number.isFinite(value)) {
        totals.mul *= Math.pow(value, rank);
      }
      return;
    }
    const value = Number(effect.value);
    if (Number.isFinite(value)) {
      totals.mul *= value;
    }
    return;
  }
  if (mode === "flag") {
    if (fromProtocol) {
      totals.flag = totals.flag || effect.value !== false;
    } else {
      totals.flag = totals.flag || rank > 0;
    }
  }
}

function getMetaEffect(effectKey, context = {}) {
  const mode = META_EFFECT_MODE[effectKey] || "add";
  const metaState = isMetaObject(context.meta) ? context.meta : state.meta;
  const totals = { add: 0, mul: 1, flag: false };

  for (const node of META_TALENT_TREE) {
    const rank = getMetaTalentRank(node.id, metaState);
    if (rank <= 0) continue;
    for (const effect of node.effects || []) {
      if (effect?.key !== effectKey) continue;
      applyMetaEffectContribution(effect, rank, mode, totals, false);
    }
  }

  if (context.includeProtocol === true) {
    const protocolId = getSelectedStartProtocol(metaState);
    const protocol = START_PROTOCOL_INDEX[protocolId];
    if (protocol) {
      for (const effect of protocol.effects || []) {
        if (effect?.key !== effectKey) continue;
        applyMetaEffectContribution(effect, 1, mode, totals, true);
      }
    }
  }

  if (mode === "mul") return totals.mul;
  if (mode === "flag") return totals.flag;
  if (mode === "addPercent") return 1 + totals.add;
  return totals.add;
}

function grantMetaPoints(amount) {
  const gained = Math.max(0, Math.floor(Number(amount)));
  if (gained <= 0) return 0;
  ensureRunRuntimeState();
  state.meta = ensureMetaState(state.meta);
  state.meta.points += gained;
  state.run.metaPointsGainedThisRun += gained;
  saveMeta();
  return gained;
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
    state.meta = ensureMetaState(state.meta);
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

function removeHudCenterAlertDom(entry) {
  if (!entry?.dom) return;
  if (entry.dom.parentNode) {
    entry.dom.parentNode.removeChild(entry.dom);
  }
}

// 中央闪烁告警：兼容旧签名 showHostileStationAlert(text, ms, isSuccess)
// v0.8.0 起支持 options.priority / options.cssClass，统一走 state.hudCenterAlertQueue 排队显示。
function showHostileStationAlert(message, durationMs = 3000, isSuccess = false, options = {}) {
  const priority = options.priority != null ? options.priority : 100;
  const cssClass = options.cssClass || "";
  const entry = {
    text: message,
    ms: durationMs || 3000,
    isSuccess: !!isSuccess,
    priority,
    cssClass,
    enqueuedAt: state.time
  };
  state.hudCenterAlertQueue = state.hudCenterAlertQueue || [];
  state.hudCenterAlertQueue.push(entry);
  state.hudCenterAlertQueue.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);
  if (state.hudCenterAlertQueue.length > HUD_CENTER_ALERT_QUEUE_LIMIT) {
    state.hudCenterAlertQueue.length = HUD_CENTER_ALERT_QUEUE_LIMIT;
  }
  processHudCenterAlertQueue(0);
}

function setBuildError(message) {
  state.lastBuildError = message;
  state.buildHint = "";
  showToast(message, 4.2);
}

function clearBuildError() {
  state.lastBuildError = "";
  state.buildHint = "";
}

function setBuildHint(message) {
  state.buildHint = message || "";
}

function clearBuildHint() {
  state.buildHint = "";
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
  const absDelta = Math.abs(delta);
  const largeTurnBoost = 1 + clamp(absDelta / (Math.PI * 0.5), 0, 0.85);
  const turnRate = 9.5 * largeTurnBoost;
  const step = clamp(dt * turnRate, 0, absDelta > 0.08 ? 0.92 : 0.75);
  state.station.angle += delta * step;
  state.station.angularVel *= 1 - clamp(dt * 7.5, 0, 0.92);
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

function normalizeAngle(angle) {
  let normalized = angle % (Math.PI * 2);
  if (normalized > Math.PI) normalized -= Math.PI * 2;
  if (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
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

function clampVectorLength(v, maxLength) {
  const current = length(v);
  if (current <= maxLength || current <= 1e-6) return;
  const factor = maxLength / current;
  v.x *= factor;
  v.y *= factor;
}

function desaturateColor(color, amount) {
  const mix = clamp(amount, 0, 1);
  const gray = (color[0] + color[1] + color[2]) / 3;
  return [
    color[0] + (gray - color[0]) * mix,
    color[1] + (gray - color[1]) * mix,
    color[2] + (gray - color[2]) * mix,
    color[3]
  ];
}

function levelIndex(level) {
  return clamp(Math.floor(Number.isFinite(level) ? level : 0), 0, ENDGAME_LEVEL);
}

function hashSeed(input) {
  const text = String(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRng(seed) {
  let t = hashSeed(seed) || 1;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, t | 1);
    r ^= r + Math.imul(r ^ r >>> 7, r | 61);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

function mulberry32(seed) {
  let t = (seed >>> 0) || 1;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ t >>> 15, t | 1);
    r ^= r + Math.imul(r ^ r >>> 7, r | 61);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

function rngFloat(rng, min, max) {
  return min + rng() * (max - min);
}

function rngInt(rng, min, max) {
  return Math.floor(rngFloat(rng, min, max + 1));
}

function tintColor(base, rng, jitter = 0.08) {
  return [
    clamp(base[0] + rngFloat(rng, -jitter, jitter), 0.08, 1),
    clamp(base[1] + rngFloat(rng, -jitter, jitter), 0.08, 1),
    clamp(base[2] + rngFloat(rng, -jitter, jitter), 0.08, 1),
    base[3] ?? 1
  ];
}

function ensureRunRuntimeState() {
  state.run.level = levelIndex(state.run.level);
  if (!Number.isFinite(state.run.seed) || state.run.seed <= 0) {
    state.run.seed = Math.floor(Math.random() * 0x7fffffff) + 1;
  }
  if (!Number.isFinite(state.run.spawnFractional)) state.run.spawnFractional = 0;
  if (!Number.isFinite(state.run.totalObjectiveRewardBase)) state.run.totalObjectiveRewardBase = 0;
  if (!Number.isFinite(state.run.settlementBonus)) state.run.settlementBonus = 0;
  if (!Number.isFinite(state.run.endgameActivityFraction)) state.run.endgameActivityFraction = 0;
  if (!Number.isFinite(state.run.endgameActivityPoints)) state.run.endgameActivityPoints = 0;
  if (!Number.isFinite(state.run.guardianSpawnDelay)) state.run.guardianSpawnDelay = 0;
  if (!state.run.fragmentHudCache || typeof state.run.fragmentHudCache !== "object") {
    state.run.fragmentHudCache = null;
  }
  if (!Array.isArray(state.run.researchRateWindow)) state.run.researchRateWindow = [];
  state.run.endgame = Boolean(state.run.endgame);
  state.run.guardianSpawned = Boolean(state.run.guardianSpawned);
  state.run.guardianDefeated = Boolean(state.run.guardianDefeated);
  state.run.endgameExplore = Boolean(state.run.endgameExplore);
  state.run.settlementShown = Boolean(state.run.settlementShown);
  state.run.settlementBonusGranted = Boolean(state.run.settlementBonusGranted);
  state.run.hostileStationSpawnedThisGalaxy = Boolean(state.run.hostileStationSpawnedThisGalaxy);
  state.run.hostileStationAlerted = Boolean(state.run.hostileStationAlerted);
  if (!state.world || !Array.isArray(state.world.bodies)) {
    state.world = { bodies: [] };
  }
  if (!state.galaxy || typeof state.galaxy !== "object") {
    state.galaxy = {
      level: 0,
      type: "rich",
      seed: 0,
      palette: GALAXY_PALETTES.sun,
      paletteKey: "sun"
    };
  }
  if (!state.input || typeof state.input !== "object") {
    state.input = { moveKeys: new Set(), mouseWorld: null, controlMode: "screen" };
  }
  if (!(state.input.moveKeys instanceof Set)) state.input.moveKeys = new Set();
  if (state.input.priorityTarget === undefined) state.input.priorityTarget = null;
  if (typeof state.input.aimingRightButton !== "boolean") state.input.aimingRightButton = false;
  if (!Number.isFinite(state.input._fLastFireAt)) state.input._fLastFireAt = 0;
  if (!state.missile || typeof state.missile !== "object") state.missile = { salvoSize: 1 };
  if (!Number.isFinite(state.missile.salvoSize) || state.missile.salvoSize <= 0) {
    state.missile.salvoSize = 1;
  }
  // v0.8.0：encounter 框架默认值兼容（旧存档 / 老运行态缺字段时兜底）
  if (!Array.isArray(state.run.encounters)) state.run.encounters = [];
  if (!(state.run.encounterCooldownThisGalaxy instanceof Set)) {
    state.run.encounterCooldownThisGalaxy = new Set();
  }
  if (!Array.isArray(state.hudCenterAlertQueue)) state.hudCenterAlertQueue = [];
  if (state.hudCenterAlertCurrent === undefined) state.hudCenterAlertCurrent = null;
  if (Array.isArray(state.npcs)) {
    for (const npc of state.npcs) {
      if (!npc) continue;
      if (npc.role == null) npc.role = "objective";
      if (npc.encounterId === undefined) npc.encounterId = null;
    }
  }
  // v0.9.0：galaxyMap / currentGalaxyType / galaxyChoicesShown 兼容兜底
  // 旧存档 / 旧运行态缺字段时回填默认值，并按当前 level + currentGalaxyType 补一个起点节点；
  // 已有节点不动，避免 ensureRunRuntimeState 重复调用清空 nodes
  if (!state.run.galaxyMap || typeof state.run.galaxyMap !== "object") {
    state.run.galaxyMap = { nodes: [], currentNodeId: null, pendingChoices: [] };
  }
  if (!Array.isArray(state.run.galaxyMap.nodes)) state.run.galaxyMap.nodes = [];
  if (!Array.isArray(state.run.galaxyMap.pendingChoices)) state.run.galaxyMap.pendingChoices = [];
  if (typeof state.run.galaxyMap.currentNodeId !== "string" && state.run.galaxyMap.currentNodeId !== null) {
    state.run.galaxyMap.currentNodeId = null;
  }
  if (typeof state.run.currentGalaxyType !== "string" || !GALAXY_TYPES[state.run.currentGalaxyType]) {
    state.run.currentGalaxyType = "emptyVoid";
  }
  if (typeof state.run.galaxyChoicesShown !== "boolean") {
    state.run.galaxyChoicesShown = false;
  }
  if (typeof state.run.activeStartProtocolId !== "string" || !START_PROTOCOL_INDEX[state.run.activeStartProtocolId]) {
    state.run.activeStartProtocolId = META_DEFAULT_PROTOCOL_ID;
  }
  if (!isMetaObject(state.run.startupFacilityDiscounts)) {
    state.run.startupFacilityDiscounts = createDefaultStartupFacilityDiscounts();
  }
  state.run.startupFacilityDiscounts.mining = normalizeProtocolDiscountValue(state.run.startupFacilityDiscounts.mining, 1);
  state.run.startupFacilityDiscounts.weapon = normalizeProtocolDiscountValue(state.run.startupFacilityDiscounts.weapon, 1);
  if (!isMetaObject(state.run.startupResourceBonus)) {
    state.run.startupResourceBonus = createDefaultStartupResourceBonus();
  }
  for (const resourceKey of Object.values(START_PROTOCOL_RESOURCE_EFFECT_MAP)) {
    const value = Math.floor(Number(state.run.startupResourceBonus[resourceKey]));
    state.run.startupResourceBonus[resourceKey] = Number.isFinite(value) && value > 0 ? value : 0;
  }
  const startupHullBonus = Number(state.run.startupHullBonus);
  state.run.startupHullBonus = Number.isFinite(startupHullBonus)
    ? clamp(startupHullBonus, 1, 1 + START_PROTOCOL_HULL_BONUS_MAX)
    : 1;
  if (typeof state.run.startupHint !== "string") {
    state.run.startupHint = "";
  }
  if (!Number.isFinite(state.run.startupHintUntil)) {
    state.run.startupHintUntil = 0;
  }
  if (typeof state.run.metaStartProtocolApplied !== "boolean") {
    state.run.metaStartProtocolApplied = false;
  }
  if (state.run.settlementMode !== "victory" && state.run.settlementMode !== "failure") {
    state.run.settlementMode = "victory";
  }
  if (!Number.isFinite(state.run.metaPointsGainedThisRun) || state.run.metaPointsGainedThisRun < 0) {
    state.run.metaPointsGainedThisRun = 0;
  }
  if (state.run.galaxyMap.nodes.length === 0) {
    galaxyNodeIdSeed += 1;
    const nodeId = `node-${galaxyNodeIdSeed}`;
    state.run.galaxyMap.nodes.push({
      id: nodeId,
      level: levelIndex(state.run.level),
      galaxyType: state.run.currentGalaxyType,
      visited: true,
      current: true
    });
    state.run.galaxyMap.currentNodeId = nodeId;
  }
}

function setWorldBodies(bodies) {
  state.world.bodies = bodies;
  state.bodies = state.world.bodies;
}

function pickGalaxyType(level, rng) {
  if (level === 0) return "rich";
  if (level === 1) return "nebula";
  if (level === 2) return "storm";
  if (level === ENDGAME_LEVEL) return "endgame";
  const pool = [...GALAXY_DYNAMIC_TYPES];
  const previous = state.galaxy?.type;
  if (previous) {
    const withoutPrevious = pool.filter((entry) => entry !== previous);
    if (withoutPrevious.length) {
      return withoutPrevious[rngInt(rng, 0, withoutPrevious.length - 1)];
    }
  }
  return pool[rngInt(rng, 0, pool.length - 1)];
}

function pickResourceType(weights, rng) {
  const entries = [
    ["ore", weights.ore],
    ["metal", weights.metal],
    ["gas", weights.gas],
    ["plasma", weights.plasma]
  ];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let roll = rngFloat(rng, 0, total);
  for (const [name, value] of entries) {
    roll -= value;
    if (roll <= 0) return name;
  }
  return "ore";
}

function getBodyColorByResource(resource, rng) {
  const palette = {
    ore: [0.74, 0.56, 0.34, 1],
    metal: [0.72, 0.78, 0.88, 1],
    gas: [0.45, 0.84, 0.68, 1],
    plasma: [0.74, 0.42, 0.94, 1]
  }[resource] || [0.65, 0.62, 0.58, 1];
  return tintColor(palette, rng, 0.12);
}

function clampGalaxyAsteroidDensityMod(mod) {
  if (!Number.isFinite(mod)) return 1.0;
  return clamp(mod, GALAXY_ASTEROID_DENSITY_CLAMP.min, GALAXY_ASTEROID_DENSITY_CLAMP.max);
}

function computeGalaxyAsteroidCount(asteroidMin, asteroidMax, rng, densityMod) {
  const mod = clampGalaxyAsteroidDensityMod(densityMod);
  const baseCount = rngInt(rng, asteroidMin, asteroidMax);
  if (mod === 1.0) return baseCount;
  const scaled = Math.round(baseCount * mod);
  const floor = Math.max(1, Math.floor(asteroidMin * mod * 0.85));
  const ceiling = Math.min(GALAXY_ASTEROID_COUNT_CAP, Math.ceil(asteroidMax * mod));
  return clamp(scaled, floor, ceiling);
}

function mixBodyColorWithGalaxyTint(baseColor, galaxyTint, mixRatio = GALAXY_BODY_TINT_MIX) {
  if (!galaxyTint || !Array.isArray(baseColor)) return baseColor;
  const ratio = clamp(mixRatio, 0, 0.45);
  return [
    baseColor[0] * (1 - ratio) + galaxyTint[0] * ratio,
    baseColor[1] * (1 - ratio) + galaxyTint[1] * ratio,
    baseColor[2] * (1 - ratio) + galaxyTint[2] * ratio,
    baseColor[3] ?? 1
  ];
}

function resolveGenerateGalaxyType(galaxyTypeOverride) {
  if (typeof galaxyTypeOverride === "string" && GALAXY_TYPES[galaxyTypeOverride]) {
    return galaxyTypeOverride;
  }
  if (state.run?.currentGalaxyType && GALAXY_TYPES[state.run.currentGalaxyType]) {
    return state.run.currentGalaxyType;
  }
  return null;
}

function getGalaxyNebulaAlpha(galaxyType) {
  const key = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType])
    ? galaxyType
    : resolveGalaxyTypeKey(galaxyType);
  return GALAXY_NEBULA_ALPHA[key] ?? 0.35;
}

function rgbaArrayToHex(rgba) {
  if (!Array.isArray(rgba) || rgba.length < 3) return null;
  const toByte = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0");
  return `#${toByte(rgba[0])}${toByte(rgba[1])}${toByte(rgba[2])}`;
}

function summarizeGalaxyBodies(galaxy) {
  const planets = galaxy.bodies.filter((body) => body.type === "planet");
  const asteroids = galaxy.bodies.filter((body) => body.type === "asteroid");
  return {
    planetCount: planets.length,
    asteroidCount: asteroids.length,
    samplePlanetColors: planets.slice(0, 2).map((body) => ({ resource: body.resource, color: [...body.color] })),
    sampleAsteroidColors: asteroids.slice(0, 2).map((body) => ({ resource: body.resource, color: [...body.color] }))
  };
}

function getGalaxyVisualSignature(galaxyType) {
  const key = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType])
    ? galaxyType
    : resolveGalaxyTypeKey(galaxyType);
  const def = GALAXY_TYPES[key] || GALAXY_TYPES.emptyVoid;
  return {
    galaxyType: key,
    paletteKey: def.paletteKey,
    bgColor: [...def.bgColor],
    bgColorHex: rgbaArrayToHex(def.bgColor),
    nebulaTint: [...def.nebulaTint],
    nebulaTintHex: rgbaArrayToHex(def.nebulaTint),
    planetColorTint: [...def.planetColorTint],
    planetColorTintHex: rgbaArrayToHex(def.planetColorTint),
    iconColor: [...def.iconColor],
    iconColorHex: rgbaArrayToHex(def.iconColor),
    nebulaAlpha: getGalaxyNebulaAlpha(key),
    asteroidDensityMod: def.asteroidDensityMod,
    riskLevel: def.riskLevel
  };
}

function generateGalaxyPreview(level, galaxyType = "emptyVoid", seed = 4242) {
  const lvl = levelIndex(level);
  const safeType = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType]) ? galaxyType : "emptyVoid";
  const config = GALAXY_LEVEL_CONFIG[lvl];
  const galaxy = generateGalaxy(lvl, `${seed}:${lvl}`, safeType);
  const bodySummary = summarizeGalaxyBodies(galaxy);
  return {
    ...getGalaxyVisualSignature(safeType),
    level: lvl,
    seed,
    paletteKey: galaxy.paletteKey,
    asteroidDensityModApplied: galaxy.asteroidDensityMod ?? 1.0,
    baseAsteroidRange: { min: config.asteroidMin, max: config.asteroidMax },
    ...bodySummary
  };
}

function runGalaxyVisualSelfCheck() {
  const types = Object.keys(GALAXY_TYPES);
  const signatures = types.map((type) => getGalaxyVisualSignature(type));
  const uniquePaletteKeys = new Set(signatures.map((entry) => entry.paletteKey));
  const uniqueBgHex = new Set(signatures.map((entry) => entry.bgColorHex));
  const emptyVoidSig = getGalaxyVisualSignature("emptyVoid");
  const previewEmpty = generateGalaxyPreview(3, "emptyVoid", 9001);
  const previewMining = generateGalaxyPreview(3, "miningBelt", 9001);
  const previewTrade = generateGalaxyPreview(3, "tradeHub", 9001);
  const previewBad = generateGalaxyPreview(0, "notARealType", 123);
  const sampleGalaxy = generateGalaxy(3, "visual-self-check:3", "miningBelt");
  const resourceBodies = sampleGalaxy.bodies.filter((body) => body.type !== "star");
  const checks = [
    { name: "sevenGalaxyTypes", ok: types.length === 7 },
    { name: "paletteKeysMostlyDistinct", ok: uniquePaletteKeys.size >= 5 },
    { name: "bgColorsMostlyDistinct", ok: uniqueBgHex.size >= 5 },
    {
      name: "emptyVoidGreySignature",
      ok: emptyVoidSig.planetColorTint[0] === 0.4
        && emptyVoidSig.bgColor[0] <= 0.05
        && emptyVoidSig.paletteKey === "coldfront"
    },
    { name: "emptyVoidDensityAnchor", ok: GALAXY_TYPES.emptyVoid.asteroidDensityMod === 1.0 },
    { name: "miningBeltMoreAsteroidsThanEmptyVoid", ok: previewMining.asteroidCount >= previewEmpty.asteroidCount },
    { name: "tradeHubFewerAsteroidsThanMiningBelt", ok: previewTrade.asteroidCount <= previewMining.asteroidCount },
    { name: "illegalTypeFallbackEmptyVoid", ok: previewBad.galaxyType === "emptyVoid" },
    {
      name: "resourceFieldPreserved",
      ok: resourceBodies.length > 0 && resourceBodies.every((body) => body.resource && RESOURCE_VISUAL[body.resource])
    },
    {
      name: "illegalPaletteFallbackSafe",
      ok: generateGalaxy(0, "palette-fallback:0", "emptyVoid").paletteKey === "coldfront"
    }
  ];
  return { ok: checks.every((entry) => entry.ok), checks, signatures };
}

function ensureGameplayTestBaseline() {
  ensureRunRuntimeState();
  if (state.station.cells.size === 0) {
    initStation();
    initWorld();
  }
}

function ensureGalaxyMapPanelDomForTest() {
  const panel = document.getElementById("galaxyMapPanel");
  if (!panel) return false;
  if (!panel.querySelector(".galaxy-map-cards")) {
    const cardsEl = document.createElement("div");
    cardsEl.className = "galaxy-map-cards";
    panel.appendChild(cardsEl);
  }
  return true;
}

function runGalaxyJumpStateMachineSelfCheck() {
  ensureGameplayTestBaseline();
  ensureGalaxyMapPanelDomForTest();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  runCase("staleCandidateDoubleConfirm", () => {
    window.__gameTest.resetRun(42, 0);
    const levelBefore = state.run.level;
    const galaxyType = "tradeHub";
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [{ galaxyType, reason: "test" }];
    }
    state.run.galaxyChoicesShown = true;
    const first = confirmGalaxyJump(galaxyType);
    const second = confirmGalaxyJump(galaxyType);
    return {
      ok: first && !second && state.run.level === levelBefore + 1,
      levelBefore,
      levelAfter: state.run.level,
      first,
      second
    };
  });

  runCase("rejectConfirmWithoutPending", () => {
    window.__gameTest.resetRun(42, 0);
    state.run.galaxyChoicesShown = true;
    if (state.run.galaxyMap) state.run.galaxyMap.pendingChoices = [];
    const rejected = confirmGalaxyJump("tradeHub");
    return { ok: !rejected && state.run.level === 0, rejected };
  });

  runCase("cancelThenReopenCardsInteractive", () => {
    window.__gameTest.resetRun(42, 0);
    const open1 = window.__gameTest.openGalaxyMapForTest(1);
    cancelGalaxyJump();
    const open2 = window.__gameTest.openGalaxyMapForTest(1);
    return {
      ok: open1.ok && open2.ok && isGalaxyMapCardsInteractive(),
      open1: open1.ok,
      open2: open2.ok,
      interactive: isGalaxyMapCardsInteractive()
    };
  });

  runCase("confirmThenNextLevelReopenCardsInteractive", () => {
    window.__gameTest.resetRun(42, 0);
    const open1 = window.__gameTest.openGalaxyMapForTest(1);
    const galaxyType = open1.choices?.[0]?.galaxyType;
    if (!galaxyType) return { ok: false, reason: "no choice" };
    const confirmed = confirmGalaxyJump(galaxyType);
    const open2 = window.__gameTest.openGalaxyMapForTest(2);
    return {
      ok: open1.ok && confirmed && state.run.level === 1 && open2.ok && isGalaxyMapCardsInteractive(),
      level: state.run.level,
      interactive: isGalaxyMapCardsInteractive()
    };
  });

  runCase("cancelThenReconfirm", () => {
    window.__gameTest.resetRun(42, 0);
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [{ galaxyType: "miningBelt", reason: "test" }];
    }
    state.run.galaxyChoicesShown = true;
    cancelGalaxyJump();
    const galaxyType = "pirateTerritory";
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [{ galaxyType, reason: "test-reopen" }];
    }
    state.run.galaxyChoicesShown = true;
    const ok = confirmGalaxyJump(galaxyType);
    return {
      ok: ok && state.run.level === 1 && state.run.currentGalaxyType === galaxyType,
      level: state.run.level,
      galaxyType: state.run.currentGalaxyType
    };
  });

  runCase("endgameWarFrontSingleAdvance", () => {
    window.__gameTest.resetRun(42, 5);
    const levelBefore = state.run.level;
    const first = confirmGalaxyJump("warFront");
    const second = confirmGalaxyJump("warFront");
    return {
      ok: first && !second && state.run.level === levelBefore + 1 && state.run.level === ENDGAME_LEVEL,
      levelBefore,
      levelAfter: state.run.level,
      first,
      second
    };
  });

  runCase("forceConfirmGalaxyJumpHook", () => {
    window.__gameTest.resetRun(42, 0);
    const result = window.__gameTest.forceConfirmGalaxyJump("techRuin");
    return {
      ok: result.ok && state.run.level === 1 && state.run.currentGalaxyType === "techRuin",
      result
    };
  });

  runCase("forceConfirmThenStaleSecondConfirm", () => {
    window.__gameTest.resetRun(42, 0);
    const result = window.__gameTest.forceConfirmGalaxyJump("techRuin");
    const stale = confirmGalaxyJump("techRuin");
    return {
      ok: result.ok && !stale && state.run.level === 1,
      result,
      stale
    };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

function runProtocolSelectionBuildCostSelfCheck() {
  ensureGameplayTestBaseline();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  runCase("protocolSelectDoesNotChangeCurrentRunBuildCost", () => {
    window.__gameTest.resetRun(42, 0);
    window.__gameTest.meta.resetMeta();
    window.__gameTest.meta.injectOldMeta({
      schemaVersion: META_SCHEMA_VERSION,
      migrationVersion: META_SCHEMA_VERSION,
      points: 0,
      talents: {
        startingCache: 1,
        weaponCalibration: 2
      },
      unlockedProtocols: ["balanced", "miningStart", "weaponStart"],
      selectedStartProtocol: "balanced"
    });

    const weaponFacility = "turret";
    const costWeaponBefore = getBuildCost(weaponFacility);
    const costMiningBefore = getBuildCost("mining");
    const weaponBeforeJson = JSON.stringify(costWeaponBefore);
    const miningBeforeJson = JSON.stringify(costMiningBefore);
    const runSnapshotBefore = {
      level: state.run.level,
      research: state.resources.research,
      metal: Math.floor(state.resources.metal),
      ore: Math.floor(state.resources.ore),
      gas: Math.floor(state.resources.gas),
      plasma: Math.floor(state.resources.plasma),
      activeProtocol: getActiveStartProtocolId(),
      galaxyMap: JSON.stringify(state.run.galaxyMap),
      objective: state.run.objective?.type ?? null,
      encounters: (state.run.encounters || []).length
    };

    const weaponSelect = selectStartProtocol("weaponStart");
    const costWeaponAfterWeapon = getBuildCost(weaponFacility);
    const costMiningAfterWeapon = getBuildCost("mining");

    const miningSelect = selectStartProtocol("miningStart");
    const costWeaponAfterMining = getBuildCost(weaponFacility);
    const costMiningAfterMining = getBuildCost("mining");

    const runSnapshotAfter = {
      level: state.run.level,
      research: state.resources.research,
      metal: Math.floor(state.resources.metal),
      ore: Math.floor(state.resources.ore),
      gas: Math.floor(state.resources.gas),
      plasma: Math.floor(state.resources.plasma),
      activeProtocol: getActiveStartProtocolId(),
      galaxyMap: JSON.stringify(state.run.galaxyMap),
      objective: state.run.objective?.type ?? null,
      encounters: (state.run.encounters || []).length
    };

    const buildCostStable =
      JSON.stringify(costWeaponAfterWeapon) === weaponBeforeJson &&
      JSON.stringify(costMiningAfterWeapon) === miningBeforeJson &&
      JSON.stringify(costWeaponAfterMining) === weaponBeforeJson &&
      JSON.stringify(costMiningAfterMining) === miningBeforeJson;
    const runUnchanged = JSON.stringify(runSnapshotBefore) === JSON.stringify(runSnapshotAfter);

    return {
      ok: weaponSelect.ok && miningSelect.ok && buildCostStable && runUnchanged,
      weaponSelect,
      miningSelect,
      costWeaponBefore,
      costWeaponAfterWeapon,
      costWeaponAfterMining,
      costMiningBefore,
      costMiningAfterWeapon,
      costMiningAfterMining,
      runSnapshotBefore,
      runSnapshotAfter
    };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

function runStartProtocolApplicationSelfCheck() {
  ensureGameplayTestBaseline();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  const prepareMetaForProtocolCases = () => {
    state.meta = ensureMetaState({
      schemaVersion: META_SCHEMA_VERSION,
      migrationVersion: META_SCHEMA_VERSION,
      points: 6,
      talents: {
        startingCache: 1,
        coreFortitude: 1,
        weaponCalibration: 2
      },
      selectedStartProtocol: "balanced"
    });
    recomputeUnlockedProtocols(state.meta);
  };

  runCase("selectionDoesNotAffectCurrentRun", () => {
    prepareMetaForProtocolCases();
    window.__gameTest.resetRun(501, 0, "tradeHub");
    const before = {
      activeProtocol: getActiveStartProtocolId(),
      selectedProtocol: getSelectedStartProtocol(),
      buildCost: {
        weapon: getBuildCost("turret"),
        mining: getBuildCost("mining")
      },
      resources: {
        metal: Math.floor(state.resources.metal),
        ore: Math.floor(state.resources.ore),
        gas: Math.floor(state.resources.gas),
        plasma: Math.floor(state.resources.plasma),
        research: Math.floor(state.resources.research)
      },
      run: {
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length
      }
    };
    const weaponSelect = selectStartProtocol("weaponStart");
    const miningSelect = selectStartProtocol("miningStart");
    const after = {
      activeProtocol: getActiveStartProtocolId(),
      selectedProtocol: getSelectedStartProtocol(),
      buildCost: {
        weapon: getBuildCost("turret"),
        mining: getBuildCost("mining")
      },
      resources: {
        metal: Math.floor(state.resources.metal),
        ore: Math.floor(state.resources.ore),
        gas: Math.floor(state.resources.gas),
        plasma: Math.floor(state.resources.plasma),
        research: Math.floor(state.resources.research)
      },
      run: {
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length
      }
    };
    const stable = JSON.stringify(before.buildCost) === JSON.stringify(after.buildCost)
      && JSON.stringify(before.resources) === JSON.stringify(after.resources)
      && JSON.stringify(before.run) === JSON.stringify(after.run)
      && before.activeProtocol === after.activeProtocol;
    return {
      ok: weaponSelect.ok && miningSelect.ok && stable && after.selectedProtocol === "miningStart",
      weaponSelect,
      miningSelect,
      before,
      after
    };
  });

  runCase("newRunAppliesSelectedProtocol", () => {
    prepareMetaForProtocolCases();
    selectStartProtocol("balanced");
    window.__gameTest.resetRun(777, 0, "tradeHub");
    const baseline = {
      activeProtocol: getActiveStartProtocolId(),
      miningCost: getBuildCost("mining"),
      weaponCost: getBuildCost("turret"),
      run: {
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length,
        research: Math.floor(state.resources.research)
      }
    };

    selectStartProtocol("miningStart");
    window.__gameTest.resetRun(777, 0, "tradeHub");
    const miningRun = {
      activeProtocol: getActiveStartProtocolId(),
      miningCost: getBuildCost("mining"),
      weaponCost: getBuildCost("turret"),
      resources: {
        metal: Math.floor(state.resources.metal),
        ore: Math.floor(state.resources.ore),
        gas: Math.floor(state.resources.gas),
        plasma: Math.floor(state.resources.plasma),
        research: Math.floor(state.resources.research)
      },
      run: {
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length
      }
    };

    const expectedMetal = RUN_BASE_STARTING_RESOURCES.metal + 25;
    const expectedOre = RUN_BASE_STARTING_RESOURCES.ore + 10;
    const resourceApplied = miningRun.resources.metal === expectedMetal && miningRun.resources.ore === expectedOre;
    const noGalaxyModAmplify = resourceApplied;
    const buildDiscountApplied = JSON.stringify(miningRun.miningCost) !== JSON.stringify(baseline.miningCost);
    const weaponCostUnaffected = JSON.stringify(miningRun.weaponCost) === JSON.stringify(baseline.weaponCost);
    let galaxyMapSemanticsStable = false;
    try {
      const baselineMap = JSON.parse(baseline.run.galaxyMap);
      const miningMap = JSON.parse(miningRun.run.galaxyMap);
      const baselineNode = baselineMap?.nodes?.[0] || null;
      const miningNode = miningMap?.nodes?.[0] || null;
      galaxyMapSemanticsStable = Boolean(
        baselineNode
        && miningNode
        && baselineMap.nodes.length === 1
        && miningMap.nodes.length === 1
        && baselineNode.level === miningNode.level
        && baselineNode.galaxyType === miningNode.galaxyType
      );
    } catch {
      galaxyMapSemanticsStable = false;
    }
    const runNotPolluted = galaxyMapSemanticsStable
      && miningRun.run.objective === baseline.run.objective
      && miningRun.run.encounters === baseline.run.encounters
      && miningRun.resources.research === baseline.run.research;

    return {
      ok: miningRun.activeProtocol === "miningStart"
        && resourceApplied
        && noGalaxyModAmplify
        && buildDiscountApplied
        && weaponCostUnaffected
        && runNotPolluted,
      baseline,
      miningRun,
      expectedMetal,
      expectedOre
    };
  });

  runCase("buildCostReadsActiveProtocolOnly", () => {
    prepareMetaForProtocolCases();
    selectStartProtocol("weaponStart");
    window.__gameTest.resetRun(888, 0, "tradeHub");
    const before = {
      activeProtocol: getActiveStartProtocolId(),
      selectedProtocol: getSelectedStartProtocol(),
      buildCost: {
        weapon: getBuildCost("turret"),
        mining: getBuildCost("mining")
      }
    };
    const selectResult = selectStartProtocol("miningStart");
    const after = {
      activeProtocol: getActiveStartProtocolId(),
      selectedProtocol: getSelectedStartProtocol(),
      buildCost: {
        weapon: getBuildCost("turret"),
        mining: getBuildCost("mining")
      }
    };
    return {
      ok: selectResult.ok
        && before.activeProtocol === "weaponStart"
        && after.activeProtocol === "weaponStart"
        && after.selectedProtocol === "miningStart"
        && JSON.stringify(before.buildCost) === JSON.stringify(after.buildCost),
      before,
      after,
      selectResult
    };
  });

  runCase("settlementHintsPreview", () => {
    prepareMetaForProtocolCases();
    state.run.metaPointsGainedThisRun = 7;
    state.meta.points = 5;
    const hints = getMetaSettlementHints();
    const hasPurchaseHint = hints.recommended.length > 0 || !!hints.nearestShortfall;
    return {
      ok: hints.pointsGained === 7
        && hints.totalPoints === 5
        && hasPurchaseHint
        && typeof hints.protocolAdvice?.message === "string"
        && hints.protocolAdvice.message.length > 0,
      hints
    };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

function tryPlaceOrbitBody({ rng, anchor, radius, minOrbit, maxOrbit, type, placed }) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = rngFloat(rng, 0, Math.PI * 2);
    const orbit = rngFloat(rng, minOrbit, maxOrbit);
    const x = anchor.x + Math.cos(angle) * orbit;
    const y = anchor.y + Math.sin(angle) * orbit;
    if (x < GALAXY_WORLD_BOUNDS.minX + radius || x > GALAXY_WORLD_BOUNDS.maxX - radius) continue;
    if (y < GALAXY_WORLD_BOUNDS.minY + radius || y > GALAXY_WORLD_BOUNDS.maxY - radius) continue;
    let valid = true;
    for (const body of placed) {
      const extraGap = type === "planet" && body.type === "planet" ? 220 : 80;
      if (dist({ x, y }, body) < radius + body.r + extraGap) {
        valid = false;
        break;
      }
    }
    if (valid) return { x, y };
  }
  return null;
}

function computeBodyAmount(type, level, rng) {
  if (type === "star") return 9999;
  const amountLevel = level === ENDGAME_LEVEL ? ENDGAME_LEVEL - 1 : level;
  if (type === "planet") {
    return Math.round(rngFloat(rng, 900, 1800) * (1 + amountLevel * 0.05));
  }
  return Math.round(rngFloat(rng, 280, 620) * (1 + amountLevel * 0.03));
}

function generateStarsByPalette(palette, rng) {
  const stars = [];
  for (let i = 0; i < palette.starCount; i++) {
    stars.push({
      x: rngFloat(rng, STAR_FIELD_BOUNDS.minX, STAR_FIELD_BOUNDS.maxX),
      y: rngFloat(rng, STAR_FIELD_BOUNDS.minY, STAR_FIELD_BOUNDS.maxY),
      r: rngFloat(rng, 0.7, 2.0),
      a: rngFloat(rng, STAR_FIELD_ALPHA.min, STAR_FIELD_ALPHA.max),
      color: tintColor([palette.starTint[0], palette.starTint[1], palette.starTint[2], 1], rng, 0.05)
    });
  }
  return stars;
}

function canUseStationSpawn(pos, star, bodies) {
  if (dist(pos, star) < 500) return false;
  for (const body of bodies) {
    if (dist(pos, body) < body.r + 260) return false;
  }
  return true;
}

function findStationSpawn(star, bodies, rng) {
  const preferred = { x: -780 + rngFloat(rng, -90, 90), y: -260 + rngFloat(rng, -90, 90) };
  if (canUseStationSpawn(preferred, star, bodies)) return preferred;
  for (let attempt = 0; attempt < 120; attempt++) {
    const angle = rngFloat(rng, 0, Math.PI * 2);
    const radius = rngFloat(rng, 600, 900);
    const candidate = {
      x: star.x + Math.cos(angle) * radius,
      y: star.y + Math.sin(angle) * radius
    };
    if (canUseStationSpawn(candidate, star, bodies)) return candidate;
  }
  return { x: star.x - 920, y: star.y - 120 };
}

function generateGalaxy(level, seed, galaxyTypeOverride) {
  const currentLevel = levelIndex(level);
  const config = GALAXY_LEVEL_CONFIG[currentLevel];
  const rng = createSeededRng(seed);
  const galaxyType = config.preferredType || pickGalaxyType(currentLevel, rng);
  const weights = GALAXY_RESOURCE_WEIGHTS[galaxyType] || GALAXY_RESOURCE_WEIGHTS.balance;
  // v0.9.0 T4：根据 galaxyType 覆盖 paletteKey / bgColor / nebulaTint / body tint / 小行星密度；
  // emptyVoid asteroidDensityMod=1.0 保证小行星数量与 v0.8.0 基线等价。
  const runGalaxyType = resolveGenerateGalaxyType(galaxyTypeOverride);
  const galaxyDef = runGalaxyType ? GALAXY_TYPES[runGalaxyType] : null;
  const paletteKey = (galaxyDef?.paletteKey && GALAXY_PALETTES[galaxyDef.paletteKey])
    ? galaxyDef.paletteKey
    : ((GALAXY_PALETTES[config.paletteKey] ? config.paletteKey : "sun"));
  const palette = GALAXY_PALETTES[paletteKey] || GALAXY_PALETTES.sun;
  const planetColorTint = galaxyDef?.planetColorTint || null;
  const asteroidDensityMod = galaxyDef ? clampGalaxyAsteroidDensityMod(galaxyDef.asteroidDensityMod) : 1.0;

  const star = {
    type: "star",
    name: currentLevel === ENDGAME_LEVEL ? "终末恒星" : `恒星-${currentLevel + 1}`,
    x: rngFloat(rng, -180, 180),
    y: rngFloat(rng, -180, 180),
    r: currentLevel === ENDGAME_LEVEL ? rngFloat(rng, 140, 170) : rngFloat(rng, 110, 150),
    color: [...palette.starColor],
    resource: "plasma",
    amount: 9999
  };

  const bodies = [star];
  const planetCount = rngInt(rng, config.planetMin, config.planetMax);
  const asteroidCount = computeGalaxyAsteroidCount(config.asteroidMin, config.asteroidMax, rng, asteroidDensityMod);

  for (let i = 0; i < planetCount; i++) {
    const radius = rngFloat(rng, 70, 160);
    const pos = tryPlaceOrbitBody({
      rng,
      anchor: star,
      radius,
      minOrbit: 380,
      maxOrbit: 1100,
      type: "planet",
      placed: bodies
    });
    if (!pos) break;
    const resource = pickResourceType(weights, rng);
    bodies.push({
      type: "planet",
      name: `行星-${i + 1}`,
      x: pos.x,
      y: pos.y,
      r: radius,
      color: mixBodyColorWithGalaxyTint(getBodyColorByResource(resource, rng), planetColorTint),
      resource,
      amount: computeBodyAmount("planet", currentLevel, rng)
    });
  }

  for (let i = 0; i < asteroidCount; i++) {
    let radius = rngFloat(rng, 22, 48);
    let pos = tryPlaceOrbitBody({
      rng,
      anchor: star,
      radius,
      minOrbit: 240,
      maxOrbit: 1280,
      type: "asteroid",
      placed: bodies
    });
    if (!pos) {
      radius = rngFloat(rng, 18, 32);
      pos = tryPlaceOrbitBody({
        rng,
        anchor: star,
        radius,
        minOrbit: 240,
        maxOrbit: 1280,
        type: "asteroid",
        placed: bodies
      });
    }
    if (!pos) continue;
    const resource = pickResourceType(weights, rng);
    bodies.push({
      type: "asteroid",
      name: `小行星-${i + 1}`,
      x: pos.x,
      y: pos.y,
      r: radius,
      color: mixBodyColorWithGalaxyTint(getBodyColorByResource(resource, rng), planetColorTint),
      resource,
      amount: computeBodyAmount("asteroid", currentLevel, rng)
    });
  }

  return {
    level: currentLevel,
    type: galaxyType,
    seed: hashSeed(seed),
    galaxyType: runGalaxyType,
    paletteKey,
    palette,
    bgColor: galaxyDef?.bgColor ? [...galaxyDef.bgColor] : null,
    nebulaTint: galaxyDef?.nebulaTint ? [...galaxyDef.nebulaTint] : null,
    nebulaAlpha: runGalaxyType ? getGalaxyNebulaAlpha(runGalaxyType) : null,
    planetColorTint: planetColorTint ? [...planetColorTint] : null,
    asteroidDensityMod,
    bodies,
    stars: generateStarsByPalette(palette, rng),
    stationSpawn: findStationSpawn(star, bodies, rng)
  };
}

function applyGalaxy(galaxy, { placeStation = true } = {}) {
  state.galaxy = {
    level: galaxy.level,
    type: galaxy.type,
    seed: galaxy.seed,
    palette: galaxy.palette,
    paletteKey: galaxy.paletteKey,
    galaxyType: galaxy.galaxyType || state.run?.currentGalaxyType || null,
    bgColor: galaxy.bgColor ? [...galaxy.bgColor] : null,
    nebulaTint: galaxy.nebulaTint ? [...galaxy.nebulaTint] : null,
    nebulaAlpha: galaxy.nebulaAlpha ?? null,
    stationSpawn: galaxy.stationSpawn
      ? { x: galaxy.stationSpawn.x, y: galaxy.stationSpawn.y }
      : { x: state.station.pos.x, y: state.station.pos.y },
    bounds: GALAXY_WORLD_BOUNDS
  };
  state.stars = galaxy.stars;
  setWorldBodies(galaxy.bodies);
  if (placeStation && galaxy.stationSpawn) {
    state.station.pos.x = galaxy.stationSpawn.x;
    state.station.pos.y = galaxy.stationSpawn.y;
    state.station.vel.x = 0;
    state.station.vel.y = 0;
    state.target = null;
  }
}

function shouldClamp(key) {
  return CLAMPED_STAT_KEYS.has(key);
}

function getTechLevelFactor(facility, key, techLevel) {
  const level = Number.isFinite(techLevel) ? techLevel : 0;
  if (level <= 0) return 1;
  if (facility === "turret" && key === "reload") {
    const baseReload = TYPES.turret.baseStats.reload;
    const minReload = TYPES.turret.baseStats.minReload;
    return Math.max(minReload, baseReload - level * 0.03) / baseReload;
  }
  if (facility === "thruster" && key === "thrust") {
    return 1 + level * 0.08;
  }
  if (facility === "thruster" && key === "keyboardThrust") {
    return 1 + level * 0.06;
  }
  if (facility === "power" && key === "baseAvailable") {
    return (6 + level * 1.5) / 6;
  }
  if (facility === "core" && key === "hpPerLevel") {
    return Math.pow(1.08, level);
  }
  if (key === "maxHp" || key === "maxFrameHp") {
    return Math.pow(1.08, level);
  }
  return 1;
}

function getGlobalModFactor(facility, key, station) {
  if (!station) return 1;
  let factor = 1;
  if (key === "maxHp" && station.hullMod && station.hullMod > 1.0) {
    factor *= station.hullMod;
  }
  if (key === "damage" && GLOBAL_WEAPON_MOD_TYPES.has(facility) && station.weaponMod && station.weaponMod > 1.0) {
    factor *= station.weaponMod;
  }
  return factor;
}

function ensureCellBaseStats(cell) {
  if (!cell || !cell.facility) return;
  const def = TYPES[cell.facility];
  if (!def) return;
  const metaFactor = getMetaEffect("hullIntegrity");
  if (!Number.isFinite(cell.baseMaxHp)) {
    cell.baseMaxHp = (def.hp ?? def.baseStats?.maxHp ?? 0) * metaFactor;
  }
  if (!Number.isFinite(cell.baseMaxFrameHp)) {
    const frameBase = cell.facility === "core"
      ? TYPES.core.baseStats.maxFrameHp
      : TYPES.frame.baseStats.maxFrameHp;
    cell.baseMaxFrameHp = frameBase * (cell.facility === "core" ? 1 : metaFactor);
  }
  if (cell.facility === "shield") {
    if (!Number.isFinite(cell.baseMaxShield)) {
      cell.baseMaxShield = TYPES.shield.baseStats.maxShield || 0;
    }
    if (cell.maxShield == null) cell.maxShield = cell.baseMaxShield;
    if (cell.shield == null) cell.shield = cell.maxShield;
  }
  if (cell.maxFrameHp == null && Number.isFinite(cell.baseMaxFrameHp)) {
    cell.maxFrameHp = cell.baseMaxFrameHp;
  }
}

function syncCellStorableStatsAfterUpgrade(cell) {
  const type = TYPES[cell.facility];
  if (!type) return;
  ensureCellBaseStats(cell);

  const newMaxHp = getCellStat(cell, "maxHp");
  if (newMaxHp > 0 && cell.maxHp != null && cell.maxHp > 0) {
    const ratio = newMaxHp / cell.maxHp;
    cell.maxHp = newMaxHp;
    cell.hp = Math.min(cell.maxHp, cell.hp * ratio);
  } else if (newMaxHp > 0 && (cell.maxHp == null || cell.maxHp <= 0)) {
    cell.maxHp = newMaxHp;
    if (cell.hp == null) cell.hp = newMaxHp;
  }

  const newMaxFrameHp = getCellStat(cell, "maxFrameHp");
  if (newMaxFrameHp > 0 && cell.maxFrameHp != null && cell.maxFrameHp > 0) {
    const ratio = newMaxFrameHp / cell.maxFrameHp;
    cell.maxFrameHp = newMaxFrameHp;
    cell.frameHp = Math.min(cell.maxFrameHp, cell.frameHp * ratio);
  } else if (newMaxFrameHp > 0 && (cell.maxFrameHp == null || cell.maxFrameHp <= 0)) {
    cell.maxFrameHp = newMaxFrameHp;
    if (cell.frameHp == null) cell.frameHp = newMaxFrameHp;
  }

  if (cell.facility === "shield") {
    const newMaxShield = getCellStat(cell, "maxShield");
    if (newMaxShield > 0 && cell.maxShield != null && cell.maxShield > 0) {
      const ratio = newMaxShield / cell.maxShield;
      cell.maxShield = newMaxShield;
      cell.shield = Math.min(cell.maxShield, (cell.shield || 0) * ratio);
    } else if (newMaxShield > 0) {
      cell.maxShield = newMaxShield;
      cell.shield = newMaxShield;
    }
  }
}

function syncAllCellStorableStats() {
  for (const cell of state.station.cells.values()) {
    syncCellStorableStatsAfterUpgrade(cell);
  }
  if (state.fragments) {
    for (const fragment of state.fragments) {
      if (!fragment?.cells) continue;
      for (const cell of fragment.cells.values()) {
        syncCellStorableStatsAfterUpgrade(cell);
      }
    }
  }
}

// v0.5.0 集中 stat 查询：baseStats → tier → mod → techLevel → globalMod → clamp
function getCellStat(cell, key) {
  if (!cell || !cell.facility) return 0;
  const type = TYPES[cell.facility];
  if (!type || !type.baseStats) return 0;
  ensureCellUpgradeFields(cell);
  ensureCellBaseStats(cell);

  let base;
  if (key === "maxHp") {
    base = cell.baseMaxHp ?? type.baseStats.maxHp ?? type.hp ?? 0;
  } else if (key === "maxFrameHp") {
    base = cell.baseMaxFrameHp ?? type.baseStats.maxFrameHp ?? TYPES.frame.baseStats.maxFrameHp ?? 0;
  } else if (key === "maxShield") {
    base = cell.baseMaxShield ?? type.baseStats.maxShield ?? 0;
  } else {
    base = type.baseStats[key];
    if (base == null) {
      if (cell[key] != null) return cell[key];
      return 0;
    }
  }

  const tier = Number.isFinite(cell.tier) ? cell.tier : 0;
  const pathKey = cell.upgradePath != null ? cell.upgradePath : 0;
  let tierBonus = 0;
  let reloadSpeedBonus = 0;
  if (tier > 0 && type.upgrades && type.upgrades[pathKey] && type.upgrades[pathKey].tiers) {
    const tierData = type.upgrades[pathKey].tiers[tier - 1];
    if (tierData) {
      if (key === "reload" && Number.isFinite(tierData.reload)) {
        reloadSpeedBonus += tierData.reload;
      } else if (Number.isFinite(tierData[key])) {
        tierBonus = tierData[key];
      }
    }
  }

  let modBonus = 0;
  if (type.modifications && cell.mod != null && type.modifications[cell.mod]) {
    const modData = type.modifications[cell.mod];
    if (key === "reload" && Number.isFinite(modData.reload)) {
      reloadSpeedBonus += modData.reload;
    } else if (Number.isFinite(modData[key])) {
      modBonus = modData[key];
    }
  }

  // v0.6.0 owner 隔离：敌方 cell（cell.owner === "enemy"）不享受玩家 techLevel / hullMod / weaponMod 加成
  const isPlayerOwned = !cell.owner || cell.owner === "player";
  const techFactor = isPlayerOwned
    ? getTechLevelFactor(cell.facility, key, state.station.techLevel || 0)
    : 1;
  const globalFactor = isPlayerOwned
    ? getGlobalModFactor(cell.facility, key, state.station)
    : 1;

  let result;
  if (key === "reload") {
    const speedMul = Math.max(0.01, 1 + reloadSpeedBonus);
    result = (base / speedMul) * techFactor * globalFactor;
    if (shouldClamp(key)) {
      result = Math.max(result, base / 2.5);
    }
  } else {
    result = base * (1 + tierBonus + modBonus) * techFactor * globalFactor;
    if (shouldClamp(key)) {
      result = Math.min(result, 2.5 * base);
    }
  }
  return result;
}

function resetCellUpgradeState(cell) {
  if (!cell) return;
  cell.tier = 0;
  cell.upgradePath = null;
  cell.mod = null;
}

function ensureCellUpgradeFields(cell) {
  if (!cell) return;
  if (!Number.isFinite(cell.tier)) cell.tier = 0;
  if (cell.upgradePath === undefined) cell.upgradePath = null;
  if (cell.mod === undefined) cell.mod = null;
}

function getTierUpgradeCost(currentTier) {
  if (currentTier >= 3) return Infinity;
  return TIER_UPGRADE_COSTS[currentTier] ?? Infinity;
}

function trackResearchGrowth(prevResearch) {
  const delta = state.resources.research - prevResearch;
  if (delta <= 0) return;
  ensureRunRuntimeState();
  if (!Array.isArray(state.run.researchRateWindow)) state.run.researchRateWindow = [];
  state.run.researchRateWindow.push({ t: state.time, delta });
  const cutoff = state.time - 30;
  while (state.run.researchRateWindow.length && state.run.researchRateWindow[0].t < cutoff) {
    state.run.researchRateWindow.shift();
  }
}

function getResearchRatePerSec() {
  const windowEntries = state.run.researchRateWindow;
  if (!Array.isArray(windowEntries) || !windowEntries.length) return 0;
  const cutoff = state.time - 30;
  let total = 0;
  for (const entry of windowEntries) {
    if (entry.t >= cutoff) total += entry.delta;
  }
  return total / 30;
}

function describeTierBonus(tierData) {
  if (!tierData) return "";
  return Object.entries(tierData)
    .map(([statKey, value]) => `${UPGRADE_STAT_LABELS[statKey] || statKey} +${Math.round(value * 100)}%`)
    .join(" · ");
}

function getUpgradePreviewStat(cell, path, targetTier) {
  const type = TYPES[cell.facility];
  if (!type?.upgrades?.[path]?.tiers?.[targetTier - 1]) return "";
  return describeTierBonus(type.upgrades[path].tiers[targetTier - 1]);
}

function upgradeSelectedCell(path) {
  const cell = state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
  if (!cell) return false;
  const type = TYPES[cell.facility];
  if (!type || !type.upgrades) return false;
  ensureCellUpgradeFields(cell);
  const currentTier = cell.tier || 0;
  if (currentTier >= 3) return false;
  if (currentTier === 0) {
    if (path == null || path < 0 || path >= type.upgrades.length) return false;
    cell.upgradePath = path;
  } else if (cell.upgradePath == null) {
    return false;
  }
  const cost = getTierUpgradeCost(currentTier);
  if ((state.resources.research || 0) < cost) return false;
  state.resources.research -= cost;
  cell.tier = currentTier + 1;
  syncCellStorableStatsAfterUpgrade(cell);
  showToast(`${type.name} 升级至 tier ${cell.tier}`);
  updateHud();
  return true;
}

function applyModification(cell, modIndex) {
  if (!cell || cell.mod != null) return false;
  const type = TYPES[cell.facility];
  if (!type || !type.modifications) return false;
  if (modIndex < 0 || modIndex >= type.modifications.length) return false;
  const cost = MODIFICATION_COST;
  if ((state.resources.research || 0) < cost) return false;
  state.resources.research -= cost;
  cell.mod = modIndex;
  syncCellStorableStatsAfterUpgrade(cell);
  const modDef = type.modifications[modIndex];
  showToast(`${type.name} 已改造：${modDef.label}`);
  updateHud();
  return true;
}

function unlockGlobalResearch(modKey) {
  const station = state.station;
  if (modKey === "hullMod") {
    if (station.hullMod > 1.0) return false;
    if ((state.resources.research || 0) < HULL_MOD_COST) return false;
    state.resources.research -= HULL_MOD_COST;
    station.hullMod = GLOBAL_RESEARCH_UNLOCK_VALUE;
    syncAllCellStorableStats();
    showToast("船体强化已激活，全 station HP +5%。");
    updateHud();
    return true;
  }
  if (modKey === "weaponMod") {
    if (station.weaponMod > 1.0) return false;
    if ((state.resources.research || 0) < WEAPON_MOD_COST) return false;
    state.resources.research -= WEAPON_MOD_COST;
    station.weaponMod = GLOBAL_RESEARCH_UNLOCK_VALUE;
    syncAllCellStorableStats();
    showToast("武器强化已激活，炮塔与导弹井 damage +5%。");
    updateHud();
    return true;
  }
  return false;
}

let selectedCellUpgradeEl = null;
let selectedCellModificationEl = null;
let researchTreePanelEl = null;
let researchTreeBtnEl = null;
let galaxyMapPanelBound = false;
let galaxyJumpInFlight = false;

function ensureSelectedCellUpgradeUi() {
  if (selectedCellUpgradeEl) return;
  selectedCellUpgradeEl = document.createElement("div");
  selectedCellUpgradeEl.id = "selectedCellUpgrade";
  selectedCellUpgradeEl.className = "cell-upgrade-panel hidden";
  selectedCellPanelEl.appendChild(selectedCellUpgradeEl);
}

function ensureSelectedCellModificationUi() {
  if (selectedCellModificationEl) return;
  selectedCellModificationEl = document.createElement("div");
  selectedCellModificationEl.id = "selectedCellModification";
  selectedCellModificationEl.className = "cell-modification-panel hidden";
  selectedCellPanelEl.appendChild(selectedCellModificationEl);
}

// v0.5.0 选中设施升级面板（tier / 路径锁定）
function renderSelectedCellUpgradePanel(cell) {
  ensureSelectedCellUpgradeUi();
  if (!cell || cell.detached) {
    selectedCellUpgradeEl.innerHTML = "";
    selectedCellUpgradeEl.classList.add("hidden");
    state.hud.selectedUpgradeKey = "";
    return;
  }
  const type = TYPES[cell.facility];
  if (!type?.upgrades?.length) {
    selectedCellUpgradeEl.innerHTML = "";
    selectedCellUpgradeEl.classList.add("hidden");
    state.hud.selectedUpgradeKey = "";
    return;
  }
  ensureCellUpgradeFields(cell);
  const currentTier = cell.tier || 0;
  const research = state.resources.research || 0;
  const upgradeCacheKey = `${cell.facility}:${currentTier}:${cell.upgradePath}:${Math.floor(research)}`;
  if (state.hud.selectedUpgradeKey === upgradeCacheKey) {
    selectedCellUpgradeEl.classList.remove("hidden");
    return;
  }
  state.hud.selectedUpgradeKey = upgradeCacheKey;

  let html = "";
  if (currentTier > 0 && cell.upgradePath != null) {
    const pathLabel = type.upgrades[cell.upgradePath]?.label || `路径 ${cell.upgradePath + 1}`;
    html += `<div class="upgrade-status">升级 tier ${currentTier}/3 · 已锁定路径：${pathLabel}</div>`;
  } else if (currentTier === 0 && type.upgrades.length > 1) {
    html += `<div class="upgrade-status">升级 tier 0/3 · 请选择升级路径</div>`;
  } else {
    html += `<div class="upgrade-status">升级 tier ${currentTier}/3</div>`;
  }

  if (currentTier >= 3) {
    html += `<div class="upgrade-actions"><button type="button" disabled>已满级</button></div>`;
  } else if (currentTier === 0 && type.upgrades.length > 1) {
    const cost = getTierUpgradeCost(0);
    const canAfford = research >= cost;
    html += `<div class="upgrade-actions upgrade-path-grid">`;
    type.upgrades.forEach((pathDef, pathIndex) => {
      const preview = getUpgradePreviewStat(cell, pathIndex, 1);
      const disabled = canAfford ? "" : " disabled";
      const titleAttr = canAfford
        ? ` title="升级到 tier 1 · 消耗 ${cost} research · 效果：${preview}"`
        : ' title="研发点不足"';
      html += `<button type="button" class="upgrade-path-btn"${disabled}${titleAttr} onclick="window.gameActions.upgradeSelectedCell(${pathIndex})">${pathDef.label}<small>${preview} · ${cost} 研发</small></button>`;
    });
    html += `</div>`;
    if (!canAfford) html += `<div class="upgrade-hint warn">研发点不足（需要 ${cost}）</div>`;
  } else {
    const pathIndex = cell.upgradePath != null ? cell.upgradePath : 0;
    const cost = getTierUpgradeCost(currentTier);
    const nextTier = currentTier + 1;
    const preview = getUpgradePreviewStat(cell, pathIndex, nextTier);
    const canAfford = research >= cost;
    const disabled = canAfford ? "" : " disabled";
    const titleAttr = canAfford
      ? ` title="升级到 tier ${nextTier} · 消耗 ${cost} research · 效果：${preview}"`
      : ' title="研发点不足"';
    html += `<div class="upgrade-actions"><button type="button" class="upgrade-tier-btn"${disabled}${titleAttr} onclick="window.gameActions.upgradeSelectedCell(${pathIndex})">升级到 tier ${nextTier}<small>${preview} · ${cost} 研发</small></button></div>`;
    if (!canAfford) html += `<div class="upgrade-hint warn">研发点不足（需要 ${cost}）</div>`;
  }

  selectedCellUpgradeEl.innerHTML = html;
  selectedCellUpgradeEl.classList.remove("hidden");
}

// v0.5.0 选中设施改造面板（4 核心设施，不可逆）
function renderSelectedCellModificationPanel(cell) {
  ensureSelectedCellModificationUi();
  if (!cell || cell.detached || !MODIFIABLE_FACILITIES.has(cell.facility)) {
    selectedCellModificationEl.innerHTML = "";
    selectedCellModificationEl.classList.add("hidden");
    state.hud.selectedModificationKey = "";
    return;
  }
  const type = TYPES[cell.facility];
  if (!type?.modifications?.length) {
    selectedCellModificationEl.innerHTML = "";
    selectedCellModificationEl.classList.add("hidden");
    state.hud.selectedModificationKey = "";
    return;
  }
  ensureCellUpgradeFields(cell);
  const research = state.resources.research || 0;
  const modCacheKey = `${cell.facility}:${cell.mod}:${Math.floor(research)}`;
  if (state.hud.selectedModificationKey === modCacheKey) {
    selectedCellModificationEl.classList.remove("hidden");
    return;
  }
  state.hud.selectedModificationKey = modCacheKey;

  let html = "";
  if (cell.mod != null) {
    const modDef = type.modifications[cell.mod];
    html += `<div class="modification-status">已改造：${modDef?.label || "未知"}</div>`;
  } else {
    html += `<div class="modification-status">改造为：</div>`;
    const canAfford = research >= MODIFICATION_COST;
    html += `<div class="modification-actions">`;
    type.modifications.forEach((modDef, modIndex) => {
      const disabled = canAfford ? "" : " disabled";
      const titleAttr = canAfford
        ? ` title="${modDef.label} · ${modDef.desc} · 消耗 ${MODIFICATION_COST} research"`
        : ' title="研发点不足"';
      html += `<button type="button" class="modification-btn"${disabled}${titleAttr} onclick="window.gameActions.applyModificationToSelected(${modIndex})">${modDef.label}<small>${modDef.desc} · ${MODIFICATION_COST} 研发</small></button>`;
    });
    html += `</div>`;
    if (!canAfford) html += `<div class="upgrade-hint warn">研发点不足（需要 ${MODIFICATION_COST}）</div>`;
  }

  selectedCellModificationEl.innerHTML = html;
  selectedCellModificationEl.classList.remove("hidden");
}

// v0.5.0 全局研发树面板（hullMod / weaponMod 节点）
function ensureResearchTreeUi() {
  if (researchTreePanelEl) return;
  const topbar = document.querySelector("#hud .topbar");
  if (topbar) {
    researchTreeBtnEl = document.createElement("button");
    researchTreeBtnEl.type = "button";
    researchTreeBtnEl.id = "researchTreeBtn";
    researchTreeBtnEl.textContent = "研发树";
    const pauseBtn = document.getElementById("pauseBtn");
    topbar.insertBefore(researchTreeBtnEl, pauseBtn);
    researchTreeBtnEl.addEventListener("click", () => toggleResearchTree(true));
  }

  researchTreePanelEl = document.createElement("div");
  researchTreePanelEl.id = "researchTreePanel";
  researchTreePanelEl.className = "research-tree-panel hidden";
  researchTreePanelEl.innerHTML = `
    <div class="research-tree-backdrop"></div>
    <div class="research-tree-content">
      <div class="research-tree-header">
        <h2>研发树</h2>
        <button type="button" class="research-tree-close" aria-label="关闭">×</button>
      </div>
      <div id="researchTreeNodes" class="research-tree-nodes"></div>
    </div>
  `;
  document.body.appendChild(researchTreePanelEl);
  researchTreePanelEl.querySelector(".research-tree-close")?.addEventListener("click", () => toggleResearchTree(false));
  researchTreePanelEl.querySelector(".research-tree-backdrop")?.addEventListener("click", () => toggleResearchTree(false));
}

function renderResearchTreePanel() {
  ensureResearchTreeUi();
  const nodesEl = researchTreePanelEl.querySelector("#researchTreeNodes");
  if (!nodesEl) return;
  const research = state.resources.research || 0;
  const nodes = [
    {
      key: "hullMod",
      label: "船体强化",
      desc: "所有设施 maxHp ×1.05",
      cost: HULL_MOD_COST,
      active: state.station.hullMod > 1.0
    },
    {
      key: "weaponMod",
      label: "武器强化",
      desc: "炮塔与导弹井 damage ×1.05",
      cost: WEAPON_MOD_COST,
      active: state.station.weaponMod > 1.0
    }
  ];
  nodesEl.innerHTML = nodes.map((node) => {
    if (node.active) {
      return `<div class="research-tree-node active"><div class="research-tree-node-title">${node.label}</div><div class="research-tree-node-desc">${node.desc}</div><div class="research-tree-node-status good">已激活</div></div>`;
    }
    const canAfford = research >= node.cost;
    const disabled = canAfford ? "" : " disabled";
    const titleAttr = ` title="${node.desc} · 消耗 ${node.cost} research"`;
    return `<div class="research-tree-node"><div class="research-tree-node-title">${node.label}</div><div class="research-tree-node-desc">${node.desc}</div><button type="button" class="research-tree-unlock-btn"${disabled}${titleAttr} onclick="window.gameActions.unlockGlobalResearch('${node.key}')">解锁 · ${node.cost} 研发</button>${canAfford ? "" : `<div class="upgrade-hint warn">研发点不足（需要 ${node.cost}）</div>`}</div>`;
  }).join("");
}

function setResearchTreeOpen(open, options = {}) {
  ensureResearchTreeUi();
  state.hud.researchTreeOpen = !!open;
  if (open) renderResearchTreePanel();
  researchTreePanelEl.classList.toggle("hidden", !open);
  if (!options.skipSync) syncMainPanelUiState();
}

function toggleResearchTree(open) {
  if (open) {
    const result = requestOpenMainPanel("researchTree");
    if (!result.ok) return;
    setResearchTreeOpen(true, { skipSync: true });
    updateObjectiveChoiceUi();
    syncMainPanelUiState();
    return;
  }
  setResearchTreeOpen(false);
  updateObjectiveChoiceUi();
}

const META_CATEGORY_LABELS = {
  all: "全部",
  resource: "资源型",
  defense: "防御型",
  weapon: "武器型",
  exploration: "探索型"
};

const META_EFFECT_LABELS = {
  miningYield: "采集产出",
  metalRefining: "建造金属消耗",
  startingMetal: "开局金属",
  startingOre: "开局矿石",
  hullIntegrity: "框架耐久",
  coreFortitude: "核心耐久",
  buildDiscount: "全设施建造成本",
  weaponCalibration: "武器伤害",
  weaponFrame: "高级武器框架",
  weaponEfficiency: "武器推力",
  researchInsight: "局内科研点获得",
  efficientCore: "高效核心蓝图",
  galaxyForesight: "星图提示",
  earlyHint: "早期提示",
  unlockProtocol: "开局协议"
};

let metaPanelEl = null;
let metaPanelBound = false;
const metaPanelUi = {
  open: false,
  activeTab: "talents",
  categoryFilter: "all"
};

function getMetaEffectLabel(effectKey) {
  return META_EFFECT_LABELS[effectKey] || effectKey;
}

function formatMetaPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function describeMetaNodeEffects(node, rank) {
  if (!node || rank <= 0) return "暂无效果";
  const parts = [];
  for (const effect of node.effects || []) {
    if (effect.key === "unlockProtocol") {
      const requiredRank = Math.max(1, Math.floor(Number(effect.atRank) || 1));
      if (rank >= requiredRank) {
        const protocol = START_PROTOCOL_INDEX[effect.protocol];
        parts.push(`已解锁协议：${protocol ? protocol.name : effect.protocol}`);
      }
      continue;
    }
    const mode = META_EFFECT_MODE[effect.key] || effect.op;
    if (mode === "addPercent") {
      const total = (Number(effect.perRank) || 0) * rank;
      parts.push(`${getMetaEffectLabel(effect.key)} +${formatMetaPercent(total)}`);
    } else if (mode === "mul") {
      const mul = Math.pow(Number(effect.perRankMul) || 1, rank);
      parts.push(`${getMetaEffectLabel(effect.key)} 约 -${formatMetaPercent(Math.max(0, 1 - mul))}`);
    } else if (mode === "add") {
      parts.push(`${getMetaEffectLabel(effect.key)} +${(Number(effect.perRank) || 0) * rank}`);
    } else if (mode === "flag") {
      parts.push(`${getMetaEffectLabel(effect.key)} 已解锁`);
    }
  }
  return parts.length ? parts.join("；") : node.desc;
}

function describeMetaNodeNextEffects(node, rank) {
  if (!node || rank >= node.maxRank) return "";
  return describeMetaNodeEffects(node, rank + 1);
}

function formatMetaPrereqLine(prereq) {
  const node = getMetaTalentNode(prereq.nodeId);
  const name = node ? node.name : prereq.nodeId;
  return `${name} ${prereq.requiredRank}级`;
}

function getMetaNodePurchaseUiState(purchaseState) {
  if (purchaseState.canBuy) {
    return {
      cardClass: "available",
      buttonText: `购买：${purchaseState.nextCost} 局外天赋点`,
      buttonDisabled: false,
      statusHtml: `<div class="meta-node-card__status good">可购买</div>`
    };
  }
  if (purchaseState.reason === "max_rank_reached") {
    return {
      cardClass: "maxed",
      buttonText: "已满级",
      buttonDisabled: true,
      statusHtml: `<div class="meta-node-card__status good">已满级</div>`
    };
  }
  if (purchaseState.reason === "not_enough_points") {
    return {
      cardClass: "locked not-enough-points",
      buttonText: `局外天赋点不足，还差 ${purchaseState.deficit} 点`,
      buttonDisabled: true,
      statusHtml: `<div class="meta-node-card__status warn">局外天赋点不足，还差 ${purchaseState.deficit} 点</div>`
    };
  }
  if (purchaseState.reason === "prereq_unmet") {
    const lines = (purchaseState.missingPrereq || []).map((entry) => {
      const node = getMetaTalentNode(entry.nodeId);
      const name = node ? node.name : entry.nodeId;
      return `需要 ${name} ${entry.requiredRank}级（当前 ${entry.currentRank}级）`;
    });
    return {
      cardClass: "locked prereq-unmet",
      buttonText: "前置未满足",
      buttonDisabled: true,
      statusHtml: `<div class="meta-node-card__prereq warn">${lines.join("<br>")}</div>`
    };
  }
  return {
    cardClass: "locked",
    buttonText: "暂不可购买",
    buttonDisabled: true,
    statusHtml: `<div class="meta-node-card__status warn">节点数据异常，暂不可购买</div>`
  };
}

function getMetaDeferredImpactHint(talentId) {
  if (talentId === "hullIntegrity" || talentId === "coreFortitude") {
    return "影响新建框架与后续新局；当前局已有结构耐久不会立即重算。";
  }
  if (talentId === "startingCache") {
    return "额外资源在下一局开局时生效，当前局不变。";
  }
  if (talentId === "researchInsight") {
    return "仅提升本局任务获得的局内科研点，与局外天赋点无关。";
  }
  return "";
}

function getMetaPurchaseSuccessMessage(talentId) {
  const node = getMetaTalentNode(talentId);
  if (!node) return "局外天赋已保存，会在之后的局中持续生效。";
  const deferredHint = getMetaDeferredImpactHint(talentId);
  if (deferredHint) {
    return `「${node.name}」已升级。${deferredHint}`;
  }
  return `「${node.name}」已升级，会在之后的局中持续生效。`;
}

function getMetaEntryBadge() {
  let availableCount = 0;
  let nearestDeficit = Infinity;
  for (const node of META_TALENT_TREE) {
    const purchaseState = getMetaPurchaseState(node.id);
    if (purchaseState.canBuy) availableCount += 1;
    if (purchaseState.reason === "not_enough_points" && purchaseState.deficit < nearestDeficit) {
      nearestDeficit = purchaseState.deficit;
    }
  }
  if (availableCount > 0) {
    return { text: "有可购买", kind: "available" };
  }
  if (Number.isFinite(nearestDeficit) && nearestDeficit < Infinity) {
    return { text: `还差 ${nearestDeficit} 点`, kind: "deficit" };
  }
  const allMaxed = META_TALENT_TREE.every((node) => getMetaPurchaseState(node.id).reason === "max_rank_reached");
  if (allMaxed) {
    return { text: "当前路线已满", kind: "maxed" };
  }
  return { text: "", kind: "none" };
}

function getMetaRecommendedTalentNames(limit = 2) {
  const picks = [];
  for (const node of META_TALENT_TREE) {
    const purchaseState = getMetaPurchaseState(node.id);
    if (!purchaseState.canBuy) continue;
    picks.push(node.name);
    if (picks.length >= limit) break;
  }
  return picks;
}

function formatProtocolImpactPreview(protocol) {
  if (!protocol || !protocol.effects?.length) {
    return "下一局影响：无额外补给，按基础规则开局。";
  }
  const parts = [];
  for (const effect of protocol.effects) {
    const mode = META_EFFECT_MODE[effect.key] || effect.op;
    if (mode === "add") {
      parts.push(`${getMetaEffectLabel(effect.key)} +${effect.value}`);
    } else if (mode === "addPercent") {
      parts.push(`${getMetaEffectLabel(effect.key)} +${formatMetaPercent(effect.value)}`);
    } else if (mode === "mul") {
      parts.push(`${getMetaEffectLabel(effect.key)} 约 -${formatMetaPercent(Math.max(0, 1 - effect.value))}`);
    } else if (mode === "flag") {
      parts.push(`${getMetaEffectLabel(effect.key)} 启用`);
    }
  }
  return `下一局影响：${parts.join("，")}`;
}

function getProtocolUnlockHint(protocol, metaState = state.meta) {
  if (!protocol?.unlock) return "默认可用";
  const unlockNode = getMetaTalentNode(protocol.unlock.nodeId);
  const nodeName = unlockNode ? unlockNode.name : protocol.unlock.nodeId;
  const haveRank = getMetaTalentRank(protocol.unlock.nodeId, metaState);
  const needRank = Math.max(1, Math.floor(Number(protocol.unlock.rank) || 1));
  if (haveRank >= needRank) return "已解锁";
  return `需要局外天赋「${nodeName}」${needRank}级（当前 ${haveRank}级）`;
}

function isMetaProtocolUnlocked(protocolId, metaState = state.meta) {
  recomputeUnlockedProtocols(metaState);
  return Array.isArray(metaState.unlockedProtocols) && metaState.unlockedProtocols.includes(protocolId);
}

function ensureMetaPanelUi() {
  if (metaPanelEl) return;
  metaPanelEl = document.createElement("div");
  metaPanelEl.id = "metaPanel";
  metaPanelEl.className = "meta-panel hidden";
  metaPanelEl.setAttribute("role", "dialog");
  metaPanelEl.setAttribute("aria-modal", "true");
  metaPanelEl.setAttribute("aria-labelledby", "metaPanelTitle");
  metaPanelEl.innerHTML = `
    <div class="meta-panel-backdrop"></div>
    <div class="meta-panel-drawer">
      <div class="meta-panel__header">
        <div>
          <h2 id="metaPanelTitle">局外天赋</h2>
          <p class="meta-panel__subtitle">局外天赋点来自结算；局内科研点只在本局研发，两者互不转换</p>
        </div>
        <button type="button" class="meta-panel-close" aria-label="关闭">×</button>
      </div>
      <div id="metaPointsSummary" class="meta-panel__summary"></div>
      <div id="metaPanelTabs" class="meta-panel__tabs">
        <button type="button" data-tab="talents" class="is-active">天赋树</button>
        <button type="button" data-tab="protocols">开局协议</button>
        <button type="button" data-tab="info">说明</button>
      </div>
      <div class="meta-panel__body">
        <div id="metaTalentView"></div>
        <div id="metaProtocolView" class="hidden"></div>
        <div id="metaInfoView" class="hidden"></div>
      </div>
      <div id="metaResetNotice" class="meta-panel__footer">当前版本暂不支持局外天赋重置；后续平衡期可能提供一次性重置入口。</div>
    </div>
  `;
  document.body.appendChild(metaPanelEl);
  if (metaPanelBound) return;
  metaPanelBound = true;
  metaPanelEl.querySelector(".meta-panel-close")?.addEventListener("click", () => toggleMetaPanel(false));
  metaPanelEl.querySelector(".meta-panel-backdrop")?.addEventListener("click", () => toggleMetaPanel(false));
  metaPanelEl.querySelector("#metaPanelTabs")?.addEventListener("click", (event) => {
    const tabButton = event.target.closest("button[data-tab]");
    if (!tabButton) return;
    metaPanelUi.activeTab = tabButton.dataset.tab || "talents";
    renderMetaPanel();
  });
  metaPanelEl.addEventListener("click", (event) => {
    const buyButton = event.target.closest(".meta-node-buy-btn[data-talent-id]");
    if (buyButton && !buyButton.disabled) {
      handleMetaTalentPurchase(buyButton.dataset.talentId);
      return;
    }
    const protocolButton = event.target.closest(".meta-protocol-select-btn[data-protocol-id]");
    if (protocolButton && !protocolButton.disabled) {
      handleMetaProtocolSelect(protocolButton.dataset.protocolId);
      return;
    }
    const chip = event.target.closest(".meta-category-chip[data-category]");
    if (chip) {
      metaPanelUi.categoryFilter = chip.dataset.category || "all";
      renderMetaTalentView();
    }
  });
}

function isMetaPanelOpen() {
  return !!(metaPanelEl && metaPanelUi.open && !metaPanelEl.classList.contains("hidden"));
}

function setMetaPanelOpen(open, options = {}) {
  ensureMetaPanelUi();
  metaPanelUi.open = !!open;
  metaPanelEl.classList.toggle("hidden", !open);
  metaPanelEl.classList.toggle("is-open", !!open);
  if (open) renderMetaPanel();
  updateMetaEntrySummary();
  if (!options.skipSync) syncMainPanelUiState();
  if (!options.skipObjectiveRefresh && !open) updateObjectiveChoiceUi();
}

function closeMainPanel(panelId, options = {}) {
  switch (panelId) {
    case "runSettlement":
      runSettlementPanelEl?.classList.add("hidden");
      break;
    case "galaxyMap":
      forceHideGalaxyMapPanel({ skipSync: true });
      break;
    case "meta":
      setMetaPanelOpen(false, { skipSync: true, skipObjectiveRefresh: true });
      break;
    case "researchTree":
      setResearchTreeOpen(false, { skipSync: true });
      break;
    case "objectiveChoice":
      document.getElementById("objectiveChoicePanel")?.classList.add("hidden");
      break;
    default:
      break;
  }
  if (!options.skipObjectiveRefresh) updateObjectiveChoiceUi();
  if (!options.skipSync) syncMainPanelUiState();
}

function requestOpenMainPanel(panelId, options = {}) {
  const active = getActiveMainPanel();
  if (active === panelId) {
    syncMainPanelUiState();
    return { ok: true, alreadyOpen: true };
  }

  const priority = MAIN_PANEL_PRIORITY;
  if (active && priority[active] < priority[panelId] && !isMainPanelPeerSwap(panelId, active)) {
    if (!options.silent) showToast(MAIN_PANEL_TOAST_BLOCKED);
    return { ok: false, reason: "blocked_by_higher_priority", blockedBy: active };
  }

  if (active && active !== panelId) {
    closeMainPanel(active, { skipObjectiveRefresh: true, skipSync: true });
  }

  if (panelId === "galaxyMap") {
    if (isMetaPanelOpen()) closeMainPanel("meta", { skipObjectiveRefresh: true, skipSync: true });
    if (state.hud?.researchTreeOpen) closeMainPanel("researchTree", { skipObjectiveRefresh: true, skipSync: true });
  } else if (panelId === "meta") {
    if (state.hud?.researchTreeOpen) closeMainPanel("researchTree", { skipObjectiveRefresh: true, skipSync: true });
    if (isGalaxyMapPanelOpen()) closeMainPanel("galaxyMap", { skipObjectiveRefresh: true, skipSync: true });
  } else if (panelId === "researchTree") {
    if (isMetaPanelOpen()) closeMainPanel("meta", { skipObjectiveRefresh: true, skipSync: true });
    if (isGalaxyMapPanelOpen()) closeMainPanel("galaxyMap", { skipObjectiveRefresh: true, skipSync: true });
  } else if (panelId === "runSettlement") {
    if (isGalaxyMapPanelOpen()) closeMainPanel("galaxyMap", { skipObjectiveRefresh: true, skipSync: true });
    if (isMetaPanelOpen()) closeMainPanel("meta", { skipObjectiveRefresh: true, skipSync: true });
    if (state.hud?.researchTreeOpen) closeMainPanel("researchTree", { skipObjectiveRefresh: true, skipSync: true });
    document.getElementById("objectiveChoicePanel")?.classList.add("hidden");
  }

  if (panelId === "galaxyMap" || panelId === "meta" || panelId === "researchTree") {
    document.getElementById("objectiveChoicePanel")?.classList.add("hidden");
  }

  syncMainPanelUiState();
  return { ok: true, alreadyOpen: false };
}

function closePanelsForSettlement() {
  forceHideGalaxyMapPanel({ skipSync: true });
  setMetaPanelOpen(false, { skipSync: true, skipObjectiveRefresh: true });
  setResearchTreeOpen(false, { skipSync: true });
  document.getElementById("objectiveChoicePanel")?.classList.add("hidden");
  syncMainPanelUiState();
}

function toggleMetaPanel(open) {
  if (open) {
    const result = requestOpenMainPanel("meta");
    if (!result.ok) return;
    setMetaPanelOpen(true, { skipSync: true, skipObjectiveRefresh: true });
    updateObjectiveChoiceUi();
    syncMainPanelUiState();
    return;
  }
  setMetaPanelOpen(false);
}

function renderMetaPanelSummary() {
  const summaryEl = metaPanelEl?.querySelector("#metaPointsSummary");
  if (!summaryEl) return;
  const selectedProtocol = START_PROTOCOL_INDEX[getSelectedStartProtocol()];
  const recommended = getMetaRecommendedTalentNames(2);
  summaryEl.innerHTML = `
    <div>局外天赋点：<strong>${state.meta.points}</strong></div>
    <div>当前协议：<strong>${selectedProtocol ? selectedProtocol.name : getSelectedStartProtocol()}</strong>（协议效果将在下一局开局时应用，本任务仅预览与选择）</div>
    ${recommended.length ? `<div>推荐：${recommended.join("、")}</div>` : ""}
  `;
}

function renderMetaTalentView() {
  ensureMetaPanelUi();
  const viewEl = metaPanelEl.querySelector("#metaTalentView");
  if (!viewEl) return;
  const filter = metaPanelUi.categoryFilter || "all";
  const categories = filter === "all"
    ? ["resource", "defense", "weapon", "exploration"]
    : [filter];
  const filterHtml = Object.entries(META_CATEGORY_LABELS).map(([categoryId, label]) => {
    const hasAvailable = categoryId !== "all" && META_TALENT_TREE.some((node) => {
      return node.category === categoryId && getMetaPurchaseState(node.id).canBuy;
    });
    const activeClass = filter === categoryId ? " is-active" : "";
    const availableClass = hasAvailable ? " has-available" : "";
    return `<button type="button" class="meta-category-chip${activeClass}${availableClass}" data-category="${categoryId}">${label}</button>`;
  }).join("");
  let sectionsHtml = "";
  for (const category of categories) {
    const nodes = META_TALENT_TREE.filter((node) => node.category === category);
    if (!nodes.length) continue;
    const cardsHtml = nodes.map((node) => {
      const purchaseState = getMetaPurchaseState(node.id);
      const uiState = getMetaNodePurchaseUiState(purchaseState);
      const currentRank = purchaseState.currentRank;
      const currentEffect = describeMetaNodeEffects(node, currentRank);
      const nextEffect = describeMetaNodeNextEffects(node, currentRank);
      const deferredHint = getMetaDeferredImpactHint(node.id);
      const costLine = purchaseState.reason === "max_rank_reached"
        ? "已满级，无下一级消耗"
        : `升级消耗：${purchaseState.nextCost} 局外天赋点`;
      return `
        <div class="meta-node-card category-${node.category} ${uiState.cardClass}" data-talent-id="${node.id}">
          <div class="meta-node-card__head">
            <span class="meta-node-card__name">${node.name}</span>
            <span class="meta-node-card__route">${META_CATEGORY_LABELS[node.category] || node.category} · T${node.tier}</span>
          </div>
          <div class="meta-node-card__rank">等级 ${currentRank} / ${node.maxRank}</div>
          <div class="meta-node-card__effect">当前：${currentEffect}</div>
          ${nextEffect ? `<div class="meta-node-card__next">下级：${nextEffect}</div>` : ""}
          <div class="meta-node-card__cost">${costLine}</div>
          ${deferredHint ? `<div class="meta-node-card__status warn">${deferredHint}</div>` : ""}
          ${uiState.statusHtml}
          <button type="button" class="meta-node-buy-btn" data-talent-id="${node.id}"${uiState.buttonDisabled ? " disabled" : ""}>${uiState.buttonText}</button>
        </div>
      `;
    }).join("");
    sectionsHtml += `
      <section class="meta-talent-section">
        <h3 class="meta-talent-section__title">${META_CATEGORY_LABELS[category]}</h3>
        <div class="meta-talent-grid">${cardsHtml}</div>
      </section>
    `;
  }
  viewEl.innerHTML = `
    <div id="metaCategoryFilters" class="meta-category-filters">${filterHtml}</div>
    <div id="metaTalentTree" class="meta-talent-tree">${sectionsHtml}</div>
  `;
}

function renderMetaProtocolView() {
  ensureMetaPanelUi();
  const viewEl = metaPanelEl.querySelector("#metaProtocolView");
  if (!viewEl) return;
  const selectedProtocolId = getSelectedStartProtocol();
  const cardsHtml = START_PROTOCOLS.map((protocol) => {
    const unlocked = isMetaProtocolUnlocked(protocol.id);
    const selected = protocol.id === selectedProtocolId;
    const cardClass = selected ? "selected" : (unlocked ? "available" : "locked");
    const statusText = selected
      ? "已选择 · 下一局将使用此协议（当前局不变更）"
      : (unlocked ? "可选择" : "未解锁");
    const buttonText = selected ? "当前选择" : (unlocked ? "选为下一局协议" : "未解锁");
    return `
      <div class="meta-protocol-card ${cardClass}" data-protocol-id="${protocol.id}">
        <div class="meta-protocol-card__name">${protocol.name}</div>
        <div class="meta-protocol-card__status ${selected ? "good" : ""}">${statusText}</div>
        <div class="meta-protocol-card__impact">${formatProtocolImpactPreview(protocol)}</div>
        <div class="meta-protocol-card__unlock">${getProtocolUnlockHint(protocol)}</div>
        <button type="button" class="meta-protocol-select-btn" data-protocol-id="${protocol.id}"${selected || !unlocked ? " disabled" : ""}>${buttonText}</button>
      </div>
    `;
  }).join("");
  viewEl.innerHTML = `
    <div class="meta-info-block">
      <h3>当前开局协议</h3>
      <p>协议只影响<strong>下一局</strong>开局资源、折扣与提示；本版本不在当前局中立即应用协议效果。</p>
    </div>
    <div id="metaProtocolList" class="meta-protocol-list">${cardsHtml}</div>
  `;
}

function renderMetaInfoView() {
  ensureMetaPanelUi();
  const viewEl = metaPanelEl.querySelector("#metaInfoView");
  if (!viewEl) return;
  viewEl.innerHTML = `
    <div class="meta-info-block">
      <h3>术语边界</h3>
      <p><strong>局外天赋点</strong>：跨局持久点数，来自结算，用于购买 Meta 天赋节点。</p>
      <p><strong>局内科研点</strong>：本局研发资源，用于设施升级与研发树，结算后不会变成局外天赋点。</p>
      <p><strong>开局协议</strong>：下一局开局策略，需先解锁对应天赋节点；选择后只影响下一局。</p>
    </div>
    <div class="meta-info-block">
      <h3>耐久类天赋说明</h3>
      <p>「框架强化」「核心加固」等耐久加成主要作用于<strong>新建框架与后续新局</strong>。购买后当前局已有结构的 maxHp 不会立即重算，避免打乱进行中的战斗节奏。</p>
    </div>
    <div class="meta-info-block">
      <h3>旧成长整理</h3>
      <p>v0.10.0 已整理旧局外成长进度；旧点数保留，旧升级折算为当前天赋等级。</p>
    </div>
  `;
}

function renderMetaPanel() {
  ensureMetaPanelUi();
  renderMetaPanelSummary();
  const tabs = metaPanelEl.querySelectorAll("#metaPanelTabs button[data-tab]");
  for (const tab of tabs) {
    tab.classList.toggle("is-active", tab.dataset.tab === metaPanelUi.activeTab);
  }
  const talentView = metaPanelEl.querySelector("#metaTalentView");
  const protocolView = metaPanelEl.querySelector("#metaProtocolView");
  const infoView = metaPanelEl.querySelector("#metaInfoView");
  if (metaPanelUi.activeTab === "protocols") {
    talentView?.classList.add("hidden");
    protocolView?.classList.remove("hidden");
    infoView?.classList.add("hidden");
    renderMetaProtocolView();
  } else if (metaPanelUi.activeTab === "info") {
    talentView?.classList.add("hidden");
    protocolView?.classList.add("hidden");
    infoView?.classList.remove("hidden");
    renderMetaInfoView();
  } else {
    talentView?.classList.remove("hidden");
    protocolView?.classList.add("hidden");
    infoView?.classList.add("hidden");
    renderMetaTalentView();
  }
}

function updateMetaEntrySummary() {
  if (!metaStatsEl) return;
  const badge = getMetaEntryBadge();
  const selectedProtocol = START_PROTOCOL_INDEX[getSelectedStartProtocol()];
  const badgeHtml = badge.text
    ? `<span class="meta-entry-badge ${badge.kind}">${badge.text}</span>`
    : "";
  const toggleBtn = document.getElementById("metaPanelToggle");
  if (toggleBtn) {
    toggleBtn.textContent = isMetaPanelOpen() ? "关闭局外天赋面板" : "打开局外天赋面板";
  }
  setHtmlIfChanged(metaStatsEl, "meta", `
    局外天赋点：${state.meta.points}${badgeHtml}
    <br>下一局协议：${selectedProtocol ? selectedProtocol.name : getSelectedStartProtocol()}
    <br><span class="warn">局内科研点与本页局外天赋点无关</span>
  `);
}

function handleMetaTalentPurchase(talentId) {
  const result = purchaseMetaTalent(talentId);
  if (!result.ok) {
    const uiState = getMetaNodePurchaseUiState(result);
    showToast(uiState.buttonText);
    renderMetaPanel();
    updateMetaEntrySummary();
    return;
  }
  createBuildUi();
  showToast(getMetaPurchaseSuccessMessage(talentId));
  renderMetaPanel();
  updateMetaEntrySummary();
  updateHud();
}

function handleMetaProtocolSelect(protocolId) {
  const result = selectStartProtocol(protocolId);
  if (!result.ok) {
    if (result.reason === "protocol_locked") {
      const protocol = START_PROTOCOL_INDEX[protocolId];
      showToast(protocol ? `${getProtocolUnlockHint(protocol)}` : "该协议尚未解锁。");
    } else {
      showToast("无法选择该开局协议。");
    }
    renderMetaPanel();
    return;
  }
  const protocol = START_PROTOCOL_INDEX[protocolId];
  showToast(`已保存为下一局开局协议：${protocol ? protocol.name : protocolId}。当前局不变更。`);
  renderMetaPanel();
  updateMetaEntrySummary();
}

function snapshotMetaPanelState() {
  ensureMetaPanelUi();
  const nodes = META_TALENT_TREE.map((node) => {
    const purchaseState = getMetaPurchaseState(node.id);
    return {
      id: node.id,
      name: node.name,
      category: node.category,
      tier: node.tier,
      rank: purchaseState.currentRank,
      maxRank: purchaseState.maxRank,
      canBuy: purchaseState.canBuy,
      reason: purchaseState.reason,
      nextCost: purchaseState.nextCost,
      deficit: purchaseState.deficit
    };
  });
  return {
    open: metaPanelUi.open,
    activeTab: metaPanelUi.activeTab,
    categoryFilter: metaPanelUi.categoryFilter,
    points: state.meta.points,
    selectedProtocol: getSelectedStartProtocol(),
    nodeCount: nodes.length,
    nodes,
    protocols: START_PROTOCOLS.map((protocol) => ({
      id: protocol.id,
      name: protocol.name,
      unlocked: isMetaProtocolUnlocked(protocol.id),
      selected: protocol.id === getSelectedStartProtocol(),
      unlockHint: getProtocolUnlockHint(protocol),
      impactPreview: formatProtocolImpactPreview(protocol)
    }))
  };
}

function createCell(x, y, facility) {
  const def = TYPES[facility] || TYPES.frame;
  const metaFactor = getMetaEffect("hullIntegrity");
  const baseMaxHp = (def.hp ?? def.baseStats?.maxHp ?? 0) * metaFactor;
  const frameBase = facility === "core"
    ? TYPES.core.baseStats.maxFrameHp
    : TYPES.frame.baseStats.maxFrameHp;
  const baseMaxFrameHp = frameBase * (facility === "core" ? 1 : metaFactor);
  const cell = {
    x,
    y,
    facility,
    baseMaxHp,
    baseMaxFrameHp,
    maxFrameHp: baseMaxFrameHp,
    frameHp: baseMaxFrameHp,
    hp: baseMaxHp,
    maxHp: baseMaxHp,
    enabled: true,
    active: facility === "core" || facility === "frame" || facility === "armor",
    detached: false,
    drift: null,
    priority: def.priority || 10,
    reload: 0,
    fire: 0,
    tier: 0,
    upgradePath: null,
    mod: null
  };
  if (facility === "shield") {
    cell.baseMaxShield = TYPES.shield.baseStats.maxShield || 0;
    cell.maxShield = cell.baseMaxShield;
    cell.shield = cell.maxShield;
  }
  return cell;
}

function initStation() {
  const cells = state.station.cells;
  const core = createCell(0, 0, "core");
  const hullFactor = getMetaEffect("hullIntegrity");
  const coreFactor = getMetaEffect("coreFortitude");
  core.baseMaxHp = 280 * hullFactor * coreFactor;
  core.hp = core.baseMaxHp;
  core.maxHp = core.baseMaxHp;
  core.baseMaxFrameHp = TYPES.core.baseStats.maxFrameHp;
  core.maxFrameHp = core.baseMaxFrameHp;
  core.frameHp = core.baseMaxFrameHp;
  cells.set(key(0, 0), core);
  cells.set(key(1, 0), createCell(1, 0, "frame"));
  cells.set(key(-1, 0), createCell(-1, 0, "frame"));
  cells.set(key(0, 1), createCell(0, 1, "frame"));
  cells.set(key(0, -1), createCell(0, -1, "frame"));
  const startupHullBonus = getRunStartupHullBonus();
  if (startupHullBonus > 1) {
    for (const cell of cells.values()) {
      if (Number.isFinite(cell.baseMaxHp) && Number.isFinite(cell.maxHp) && Number.isFinite(cell.hp)) {
        cell.baseMaxHp *= startupHullBonus;
        cell.maxHp *= startupHullBonus;
        cell.hp *= startupHullBonus;
      }
      if (Number.isFinite(cell.baseMaxFrameHp) && Number.isFinite(cell.maxFrameHp) && Number.isFinite(cell.frameHp)) {
        cell.baseMaxFrameHp *= startupHullBonus;
        cell.maxFrameHp *= startupHullBonus;
        cell.frameHp *= startupHullBonus;
      }
    }
  }
}

function initWorld() {
  ensureRunRuntimeState();
  const level = levelIndex(state.run.level);
  const galaxy = generateGalaxy(level, `${state.run.seed}:${level}`);
  applyGalaxy(galaxy);
}

function isObjectiveComplete() {
  return state.run.objectiveCompleteAt > 0;
}

function isObjectiveFailed() {
  const objective = state.run.objective;
  if (!objective) return false;
  const objectiveType = OBJECTIVE_TYPES[objective.type];
  if (typeof objectiveType?.isFailed === "function") {
    return Boolean(objectiveType.isFailed(objective));
  }
  return objective.failed === true;
}

function resetObjectiveChoiceState() {
  state.run.awaitingObjectiveChoice = false;
  state.run.objectiveChoiceDismissed = false;
}

function isRunSettlementPanelOpen() {
  return !!(runSettlementPanelEl && !runSettlementPanelEl.classList.contains("hidden"));
}

// v0.11.0 T2：主流程面板互斥优先级（数字越小优先级越高）
const MAIN_PANEL_PRIORITY = {
  runSettlement: 1,
  galaxyMap: 2,
  objectiveChoice: 3,
  meta: 4,
  researchTree: 5
};

const MAIN_PANEL_TOAST_BLOCKED = "请先关闭当前界面再进行此操作。";

function countSimultaneouslyOpenMainPanels() {
  let count = 0;
  if (isRunSettlementPanelOpen()) count++;
  if (isGalaxyMapPanelOpen()) count++;
  if (isMetaPanelOpen()) count++;
  if (state.hud?.researchTreeOpen) count++;
  return count;
}

function getActiveMainPanel() {
  if (isRunSettlementPanelOpen()) return "runSettlement";
  if (isGalaxyMapPanelOpen()) return "galaxyMap";
  if (isMetaPanelOpen()) return "meta";
  if (state.hud?.researchTreeOpen) return "researchTree";
  return null;
}

function isMainPanelPeerSwap(panelId, active) {
  return (panelId === "meta" && active === "researchTree")
    || (panelId === "researchTree" && active === "meta");
}

function syncMainPanelUiState() {
  const hud = document.getElementById("hud");
  const body = document.body;
  const active = getActiveMainPanel();
  const targets = [body, hud].filter(Boolean);
  const objectivePanel = document.getElementById("objectiveChoicePanel");
  const objectiveVisible = !!(objectivePanel && !objectivePanel.classList.contains("hidden"));

  for (const el of targets) {
    el.classList.toggle("ui-main-panel-open", active !== null);
    el.classList.toggle("ui-panel-settlement-open", active === "runSettlement");
    el.classList.toggle("ui-panel-galaxy-open", active === "galaxyMap");
    el.classList.toggle("ui-panel-meta-open", active === "meta");
    el.classList.toggle("ui-panel-objective-open", objectiveVisible && active === null);
  }

  metaPanelEl?.classList.toggle("is-top-panel", active === "meta");
  researchTreePanelEl?.classList.toggle("is-top-panel", active === "researchTree");
  document.getElementById("galaxyMapPanel")?.classList.toggle("is-top-panel", active === "galaxyMap");
  runSettlementPanelEl?.classList.toggle("is-top-panel", active === "runSettlement");
}

function hasStableResourceHarvest() {
  return getMiningStationStatus().harvesting.length > 0;
}

function buildPanelAwareGuide() {
  if (isRunSettlementPanelOpen()) {
    const isFailure = state.run.settlementMode === "failure";
    return {
      goal: "查看本局结算",
      next: isFailure
        ? "确认本局结果与获得的局外天赋点；这局仍可通过局外天赋强化下一局，再点「重新开始新局」或打开局外天赋。"
        : "确认本局结果、获得的局外天赋点，以及下一步是新局、局外天赋购买或开局协议选择。"
    };
  }
  if (isGalaxyMapPanelOpen()) {
    return {
      goal: "选择下一跳目的地",
      next: "比较候选星系的奖励和风险；按 Esc 或「暂时停留」可返回当前星系，不会消耗跃迁选择。"
    };
  }
  if (isMetaPanelOpen()) {
    if (metaPanelUi.activeTab === "protocols") {
      return {
        goal: "选择下一局开局协议",
        next: "协议只影响下一局开局；未解锁协议会显示需要的局外天赋。当前局不变更。"
      };
    }
    if (metaPanelUi.activeTab === "info") {
      return {
        goal: "了解局外成长规则",
        next: "局外天赋点来自结算，可购买永久天赋；局内科研点只在本局用于研发，两者互不转换。"
      };
    }
    return {
      goal: "使用局外天赋点强化下一局",
      next: "购买可用天赋会让下一局更强或更稳定；局内科研点不会变成局外天赋点。"
    };
  }
  return null;
}

function buildEarlyMineObjectiveGuide(objective, powerCount, miningCount) {
  if (miningCount === 0) {
    if (powerCount === 0) {
      return {
        goal: "先建立采矿能力",
        next: "先在已连接框架上建造「发电站」，再选「采矿站」放在矿石或金属资源点旁。"
      };
    }
    return {
      goal: "先建立采矿能力",
      next: "选择「采矿站」，放在矿石或金属资源点旁；采矿站会帮助你持续获得建造资源。"
    };
  }
  const status = getMiningStationStatus();
  const nearest = getNearestResourceBody();
  if (status.harvesting.length === 0 && nearest && nearest.distance > nearest.range) {
    return {
      goal: "靠近带彩色外环的资源点",
      next: "橙色外环产矿石，银色外环产金属；驾驶工站进入外环后，采矿站和工站采集更有效。"
    };
  }
  if (objective && objective.progress < objective.target) {
    return {
      goal: "完成当前星系任务",
      next: `任务目标：${objective.text}。按任务提示补齐采集目标；完成后会出现跃迁选择。`
    };
  }
  return null;
}

function buildCompletedObjectiveGuide() {
  if (state.run.endgame && state.run.guardianDefeated) {
    if (state.run.settlementShown) {
      return {
        goal: "查看本局结算",
        next: "确认本局结果与局外天赋点；可选择「开始新局」、打开局外天赋购买，或「留在终结星系自由游玩」。"
      };
    }
    if (state.run.endgameExplore) {
      return {
        goal: "终结星系自由游玩中",
        next: "可继续战斗和采集累积局外天赋点；右侧「再次开始新局」可随时重开。"
      };
    }
  }
  if (state.run.awaitingObjectiveChoice) {
    return {
      goal: "星系任务已完成",
      next: "可以跃迁下一星系，也可以暂时停留整理防御和资源。"
    };
  }
  return {
    goal: "任务已完成，可随时跃迁",
    next: "在「星系任务」下方点「跃迁下一星系」；Esc 或「暂时停留」不会确认跃迁。"
  };
}

function getObjectiveDisplayProgress(objective) {
  if (!objective) return { ratio: 0, current: 0, target: 0 };
  const target = objective.target;
  const current = clamp(objective.progress, 0, target);
  return {
    ratio: target > 0 ? clamp(current / target, 0, 1) : 0,
    current,
    target
  };
}

const OBJECTIVE_EVENT_HANDLERS = {
  tick: "tick",
  mined: "onMined",
  enemyKilled: "onEnemyKilled",
  guardianKilled: "onGuardianKilled",
  hostileStationKilled: "onHostileStationKilled",
  fragmentDocked: "onFragmentDocked",
  npcArrived: "onNpcArrived",
  npcDestroyed: "onNpcDestroyed"
};

const OBJECTIVE_LEVEL_WEIGHTS = [
  { mine: 0.5, explore: 0.5 },
  { mine: 0.4, explore: 0.3, battle: 0.3 },
  { mine: 0.3, explore: 0.3, battle: 0.2, survive: 0.2 },
  { mine: 0.2, explore: 0.2, battle: 0.2, survive: 0.1, salvage: 0.1, assault: 0.20 },
  { mine: 0.15, explore: 0.15, battle: 0.15, survive: 0.1, salvage: 0.1, escort: 0.05, assault: 0.30 },
  { mine: 0.1, explore: 0.1, battle: 0.1, survive: 0.1, salvage: 0.1, escort: 0.05, assault: 0.35 },
  { guardian: 1.0 }
];

const OBJECTIVE_TYPE_DEFAULTS = {
  tick: null,
  onMined: null,
  onEnemyKilled: null,
  onGuardianKilled: null,
  onHostileStationKilled: null,
  onFragmentDocked: null,
  onNpcArrived: null,
  onNpcDestroyed: null,
  isComplete: null,
  isFailed: null,
  getDetail: () => "",
  getHint: () => "",
  render: null,
  rewardMultiplier: 1.0,
  researchReward: 0
};

const OBJECTIVE_TYPES = {
  mine: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 3,
    make() {
      return {
        type: "mine",
        text: "采集 90 单位资源",
        target: 90,
        progress: 0
      };
    },
    onMined(objective, mined) {
      objective.progress += mined;
    },
    getDetail(objective, displayProgress) {
      return `${Math.floor(displayProgress.current)} / ${displayProgress.target} 单位`;
    },
    getHint() {
      return "建造采矿站并靠近带彩色外环的资源天体（橙=矿石、银=金属、绿=气、紫=等离子），保持设施通电。";
    }
  },
  explore: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 4,
    make(rng) {
      return {
        type: "explore",
        text: "抵达信标区域",
        target: 1,
        progress: 0,
        beacon: {
          x: rngFloat(rng, 700, 1300),
          y: rngFloat(rng, -850, 850)
        }
      };
    },
    tick(objective) {
      objective.progress = dist(state.station.pos, objective.beacon) < 130 ? 1 : 0;
    },
    getDetail(objective, displayProgress) {
      return displayProgress.current >= displayProgress.target
        ? "已抵达"
        : state.target
          ? "航行中"
          : "未设定目标";
    },
    getHint() {
      return state.target || hasKeyboardThrust()
        ? `${getMoveControlHint()}，或保持推进器喷口朝外，朝金色信标环移动。`
        : `${getMoveControlHint()}，或点空白处设定航行目标后自动推进。`;
    },
    render(objective) {
      renderer.ring(objective.beacon, 80, 5, [0.95, 0.9, 0.35, 0.55], 48);
      renderer.ring(objective.beacon, 120, 2, [0.95, 0.9, 0.35, 0.22], 48);
    }
  },
  battle: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 5,
    make() {
      return {
        type: "battle",
        text: "击毁 6 个敌对目标",
        target: 6,
        progress: 0
      };
    },
    onEnemyKilled(objective, enemy) {
      if (enemy.kind === "guardian") return;
      objective.progress++;
    },
    getDetail(objective, displayProgress) {
      return `${Math.floor(displayProgress.current)} / ${displayProgress.target} 击毁`;
    },
    getHint() {
      return "建造炮塔或导弹井，必要时点「导弹齐射」。";
    }
  },
  survive: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 6,
    make() {
      return {
        type: "survive",
        text: "坚持 180 秒并保持核心存活",
        target: 180,
        progress: 0
      };
    },
    tick(objective, dt) {
      objective.progress += dt;
    },
    getDetail(objective, displayProgress) {
      return `${Math.floor(displayProgress.current)} / ${displayProgress.target} 秒`;
    },
    getHint() {
      return "加固装甲与护盾，确保发电站供电不断。";
    }
  },
  guardian: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 12,
    make() {
      return {
        type: "guardian",
        text: "击毁本局守护者",
        target: 1,
        progress: 0
      };
    },
    onGuardianKilled(objective) {
      objective.progress = objective.target;
    },
    getDetail(objective, displayProgress) {
      return `${Math.floor(displayProgress.current)} / ${displayProgress.target} 守护者`;
    },
    getHint() {
      return "终末守护者会持续增援海盗，优先清理周边后集中火力击毁守护者。";
    },
    render() {
      if (isObjectiveComplete()) return;
      const guardian = state.enemies.find((enemy) => enemy.kind === "guardian" && enemy.hp > 0);
      if (!guardian) return;
      renderer.ring(guardian, guardian.r + 36, 4, [1, 0.25, 0.2, 0.45], 52);
      renderer.ring(guardian, guardian.r + 70, 2, [1, 0.25, 0.2, 0.2], 52);
    }
  },
  salvage: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    rewardMultiplier: 1.5,
    researchReward: 5,
    make(rng, level, galaxy) {
      const target = level <= 2 ? 2 : 3;
      const plannedCount = level <= 2 ? 3 : 4;
      seedSalvageFragments(galaxy, plannedCount, rng);
      const wreckCount = countWreckFragments();
      const actualTarget = Math.min(target, wreckCount);
      return {
        type: "salvage",
        text: `回收 ${actualTarget} 段古老残骸`,
        target: actualTarget,
        progress: 0,
        failed: false,
        elapsed: 0
      };
    },
    tick(objective, dt) {
      if (objective.failed) return;
      objective.elapsed = (objective.elapsed || 0) + dt;
      if (objective.elapsed >= SALVAGE_TIMEOUT_SEC) {
        objective.failed = true;
        showToast("残骸已散失，本关任务失败。");
      }
    },
    isFailed(objective) {
      return objective.failed === true;
    },
    onFragmentDocked(objective, fragment) {
      if (fragment.origin !== "wreck") return;
      objective.progress += 1;
    },
    getDetail(objective, displayProgress) {
      if (objective.failed) return "拾荒失败";
      return `${displayProgress.current} / ${displayProgress.target} 段残骸`;
    },
    getHint(objective) {
      const remaining = Math.max(0, objective.target - objective.progress);
      return `在星系中寻找古老残骸，靠近并桥接 ${remaining} 段。`;
    }
  },
  escort: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    rewardMultiplier: 1.6,
    researchReward: 7,
    make(rng, level, galaxy) {
      const npc = seedEscortNpc(galaxy, rng, level);
      const escortTarget = { x: npc.target.x, y: npc.target.y };
      return {
        type: "escort",
        text: "护送货船到达跃迁点",
        target: 1,
        progress: 0,
        failed: false,
        npcId: npc.id,
        escortTarget,
        elapsed: 0
      };
    },
    tick(objective, dt) {
      if (objective.failed || isObjectiveComplete()) return;
      objective.elapsed = (objective.elapsed || 0) + dt;
      if (objective.elapsed >= ESCORT_TIMEOUT_SEC) {
        objective.failed = true;
        showToast("护送超时，本关任务失败。");
      }
    },
    isFailed(objective) {
      return objective.failed === true;
    },
    onNpcArrived(objective, npc) {
      if (npc.id !== objective.npcId || npc.kind !== "friendly-cargo") return;
      objective.progress = 1;
    },
    onNpcDestroyed(objective, npc) {
      if (npc.id !== objective.npcId) return;
      objective.failed = true;
      showToast("护送目标已被摧毁。本关任务失败。");
    },
    getDetail(objective, displayProgress) {
      if (objective.failed) return "护送失败";
      if (displayProgress.current >= displayProgress.target) return "已抵达";
      const npc = state.npcs.find((entry) => entry.id === objective.npcId);
      if (!npc) return "护送中";
      return `护送中 · HP ${Math.floor((npc.hp / npc.maxHp) * 100)}%`;
    },
    getHint(objective) {
      return objective.failed
        ? "护送失败：本关无法跃迁，可重启或留在本关刷资源。"
        : "保护货船到达跃迁点，优先清理追击的海盗与小行星。";
    },
    render(objective) {
      const target = objective.escortTarget || getEscortJumpExit(state.galaxy);
      renderer.ring(target, NPC_ARRIVE_RADIUS, 3, [0.95, 0.85, 0.35, 0.55], 48);
      renderer.ring(target, NPC_ARRIVE_RADIUS + 28, 2, [0.95, 0.85, 0.35, 0.22], 56);
    }
  },
  // v0.6.0 引入 assault：摧毁敌方空间站（level 3-5，单星系冷却 1 次）
  assault: {
    ...OBJECTIVE_TYPE_DEFAULTS,
    researchReward: 9,
    rewardMultiplier(level) {
      return level === 3 ? 1.4 : level === 4 ? 1.5 : 1.6;
    },
    make(rng, level) {
      if (state.run.hostileStationSpawnedThisGalaxy) {
        return null;
      }
      state.run.hostileStationSpawnedThisGalaxy = true;
      state.run.hostileStationAlerted = false;
      showHostileStationAlert("⚠ 敌方空间站接近", 3000);
      const objective = {
        type: "assault",
        text: "突击：摧毁敌方空间站",
        target: 1,
        progress: 0,
        level,
        timeLimit: level === 3 ? 480 : level === 4 ? 420 : 360,
        elapsed: 0,
        enemyId: null,
        spawnPending: true,
        spawnDelay: 2.5,
        _rng: rng
      };
      return objective;
    },
    tick(objective, dt) {
      objective.elapsed = (objective.elapsed || 0) + dt;
      if (!objective.spawnPending) return;
      objective.spawnDelay = (objective.spawnDelay || 0) - dt;
      if (objective.spawnDelay > 0) return;
      const enemy = spawnHostileStationNearStation(objective._rng, objective.level || state.run.level);
      objective.spawnPending = false;
      if (enemy) {
        objective.enemyId = enemy.id || `hs-${Date.now()}`;
        enemy.objectiveId = objective.enemyId;
      }
    },
    onHostileStationKilled(objective) {
      objective.progress = objective.target;
    },
    isComplete(objective) {
      return objective.progress >= objective.target;
    },
    isFailed(objective) {
      return (objective.elapsed || 0) >= (objective.timeLimit || 0);
    },
    getDetail(objective, displayProgress) {
      if (objective.spawnPending) return "扫描中…";
      if (displayProgress.current >= displayProgress.target) return "已摧毁";
      const target = state.enemies.find((enemy) => enemy.kind === "hostile-station" && enemy.hp > 0);
      if (!target) return "追踪中…";
      const hpPercent = target.cellsHpMax > 0
        ? Math.round((target.hp / target.cellsHpMax) * 100)
        : Math.round((target.hp / Math.max(1, target.maxHp)) * 100);
      const distance = Math.round(dist(state.station.pos, target));
      return `敌方空间站 HP ${hpPercent}% · 距离 ${distance}`;
    },
    getHint(objective) {
      const remaining = Math.max(0, (objective.timeLimit || 0) - (objective.elapsed || 0));
      const mins = Math.floor(remaining / 60);
      const secs = Math.floor(remaining % 60);
      const timeText = `剩余时间 ${mins}:${String(secs).padStart(2, "0")}`;
      if (objective.spawnPending) {
        return `${timeText} · 敌方空间站即将出现，可先调整站位与武器。`;
      }
      return `${timeText} · 可先打武器 cell 停火，或直击核心快速终结。`;
    },
    render(objective) {
      if (isObjectiveComplete() || objective.spawnPending) return;
      const target = state.enemies.find((enemy) => enemy.kind === "hostile-station" && enemy.hp > 0);
      if (!target) return;
      renderer.ring(target, target.r + 28, 4, [1, 0.2, 0.15, 0.5], 52);
      renderer.ring(target, target.r + 56, 2, [1, 0.2, 0.15, 0.2], 52);
    }
  }
};

function pickWeighted(rng, weightTable) {
  if (!weightTable || typeof weightTable !== "object") return "mine";
  const entries = Object.entries(weightTable).filter(
    ([type, weight]) => OBJECTIVE_TYPES[type] && Number.isFinite(weight) && weight > 0
  );
  if (!entries.length) return "mine";
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

// v0.8.0：局内随机事件（ENCOUNTER）平行注册表与常量
// 与 OBJECTIVE_TYPES 完全独立——不复用 RNG 流（独立 xor/mul 公式保护 __gameTest 测试钩子）、
// 不复用奖励路径（独立 applyEncounterReward 避免 meta.points / objectiveCompleteAt 副作用）、
// 不复用 HUD alert（priority 队列串行显示，避免短时间多事件触发时 DOM 堆叠）。
const ENCOUNTER_MAX_CONCURRENT = 3;
const ENCOUNTER_RNG_XOR = 0xb5297a4d;
const ENCOUNTER_RNG_MUL = 0xcc9e2d51;
const ENCOUNTER_TRIGGER_BASE_DELAY = 60;
const ENCOUNTER_TRIGGER_STAGGER = 30;
const HUD_CENTER_ALERT_QUEUE_LIMIT = 5;

const ENCOUNTER_LEVEL_WEIGHTS = {
  0: { trader: 1.0 },
  1: { trader: 1.0, distress: 0.5, derelict: 0.5, signal: 0.3 },
  2: { trader: 0.8, distress: 0.7, ambush: 0.4, derelict: 0.6, signal: 0.4 },
  3: { trader: 0.6, distress: 0.7, ambush: 0.6, derelict: 0.7, signal: 0.5 },
  4: { trader: 0.5, distress: 0.6, ambush: 0.7, derelict: 0.7, signal: 0.6 },
  5: { trader: 0.4, distress: 0.6, ambush: 0.8, derelict: 0.7, signal: 0.7 },
  6: {}
};

const ENCOUNTER_PER_LEVEL_COUNT = {
  0: { min: 1, max: 1 },
  1: { min: 1, max: 2 },
  2: { min: 2, max: 3 },
  3: { min: 2, max: 3 },
  4: { min: 2, max: 3 },
  5: { min: 2, max: 3 },
  6: { min: 0, max: 0 }
};

// 与 OBJECTIVE_EVENT_HANDLERS 同形 event → handlerName 映射，方便 notifyEncounters 派发
const ENCOUNTER_EVENT_HANDLERS = {
  tick: "tick",
  mined: "onMined",
  enemyKilled: "onEnemyKilled",
  guardianKilled: "onGuardianKilled",
  hostileStationKilled: "onHostileStationKilled",
  fragmentDocked: "onFragmentDocked",
  npcArrived: "onNpcArrived",
  npcDestroyed: "onNpcDestroyed"
};

const ENCOUNTER_TYPE_DEFAULTS = {
  make: () => null,
  tick: () => {},
  onMined: () => {},
  onEnemyKilled: () => {},
  onGuardianKilled: () => {},
  onHostileStationKilled: () => {},
  onFragmentDocked: () => {},
  onNpcArrived: () => {},
  onNpcDestroyed: () => {},
  isComplete: (encounter) => encounter.completed === true,
  isFailed: (encounter) => encounter.failed === true,
  getDetail: () => "",
  getHint: () => "",
  render: () => {},
  cssClass: "alert-encounter",
  hudAlertClass: "alert-encounter",
  priority: 50,
  spawnDistanceMin: 400,
  spawnDistanceMax: 800,
  cooldownTurns: 1,
  defaultExpireMs: 60000
};

// ENCOUNTER_TYPES：局内随机事件注册表（与 OBJECTIVE_TYPES 平行）
// 每个条目负责本类型的 make/tick/onXxx/isComplete/isFailed/getDetail/getHint/render。
const ENCOUNTER_TYPES = {
  // trader：友好商船，靠近后按 T/Y 快捷交易。
  trader: {
    ...ENCOUNTER_TYPE_DEFAULTS,
    cssClass: "alert-encounter-trader",
    hudAlertClass: "alert-encounter-trader",
    priority: 50,
    spawnDistanceMin: 400,
    spawnDistanceMax: 600,
    cooldownTurns: 2,
    defaultExpireMs: 30000,
    make(encounter, rng, level) {
      const angle = Math.atan2(
        state.station.pos.y - encounter.spawnPos.y,
        state.station.pos.x - encounter.spawnPos.x
      );
      const sideAngle = angle + Math.PI / 2;
      const dest = {
        x: encounter.spawnPos.x + Math.cos(sideAngle) * 2400,
        y: encounter.spawnPos.y + Math.sin(sideAngle) * 2400
      };
      const npc = createEncounterNpc("trader", encounter.id, {
        pos: { ...encounter.spawnPos },
        target: dest,
        hp: 80,
        maxHp: 80,
        hudColor: ENCOUNTER_NPC_COLOR_TRADER,
        speed: 80,
        radius: 22
      });
      state.npcs.push(npc);
      encounter.npcIds.push(npc.id);
      showHostileStationAlert("贸易商船：靠近交易", 4000, false, {
        priority: 50,
        cssClass: "alert-encounter-trader"
      });
      encounter.encounterData = {
        tradeOption1: { cost: { metal: 50 }, reward: { plasma: 1 } },
        tradeOption2: { cost: { metal: 100 }, reward: { research: 3 } },
        traded: false,
        tradeRangeRadius: 80,
        playerInTradeRange: false
      };
    },
    tick(encounter, dt) {
      const npc = state.npcs.find((n) => n.id === encounter.npcIds[0]);
      if (!npc || npc.destroyed) {
        encounter.failed = true;
        return;
      }
      if (npc.arrived) {
        encounter.expired = true;
        return;
      }
      const dist = Math.hypot(state.station.pos.x - npc.pos.x, state.station.pos.y - npc.pos.y);
      encounter.encounterData.playerInTradeRange = dist < encounter.encounterData.tradeRangeRadius;
    },
    isComplete(encounter) {
      return encounter.encounterData?.traded === true;
    },
    isFailed(encounter) {
      return encounter.failed === true;
    },
    getDetail(encounter) {
      if (encounter.encounterData?.traded) return "贸易已完成";
      if (encounter.encounterData?.playerInTradeRange) return "靠近商船，按 T 交易";
      return "贸易商船 - 接近交易";
    },
    getHint(encounter) {
      return encounter.encounterData?.playerInTradeRange ? "T = 交易 · Y = 高级交易" : "";
    },
    render(encounter) {
      const npc = state.npcs.find((n) => n.id === encounter.npcIds[0]);
      const pos = npc?.pos || encounter.spawnPos;
      if (!pos) return;
      const pulse = 0.35 + 0.15 * Math.sin(state.time * Math.PI * 2);
      renderer.ring(pos, 48, 2, [0.37, 0.77, 0.38, pulse], 32);
    }
  },
  // distress：友方遇袭，清理围困海盗可获得救援奖励。
  distress: {
    ...ENCOUNTER_TYPE_DEFAULTS,
    cssClass: "alert-encounter-distress",
    hudAlertClass: "alert-encounter-distress",
    priority: 70,
    spawnDistanceMin: 500,
    spawnDistanceMax: 800,
    cooldownTurns: 1,
    defaultExpireMs: 45000,
    make(encounter, rng, level) {
      const npc = createEncounterNpc("distress-pilot", encounter.id, {
        pos: { ...encounter.spawnPos },
        target: { ...encounter.spawnPos },
        hp: 60,
        maxHp: 60,
        hudColor: ENCOUNTER_NPC_COLOR_DISTRESS,
        speed: 20,
        radius: 18
      });
      state.npcs.push(npc);
      encounter.npcIds.push(npc.id);
      const pirateCount = 4 + Math.floor(rng() * 3);
      encounter.encounterData = {
        pirateCount,
        piratesKilled: 0,
        pirateIds: [],
        rescued: false
      };
      const lvl = levelIndex(level);
      for (let i = 0; i < pirateCount; i++) {
        const angle = (i / pirateCount) * Math.PI * 2;
        const radius = 80 + rng() * 40;
        const pos = {
          x: encounter.spawnPos.x + Math.cos(angle) * radius,
          y: encounter.spawnPos.y + Math.sin(angle) * radius
        };
        spawnEncounterPirate(encounter, pos, lvl, encounter.encounterData);
      }
      showHostileStationAlert("求救信号：友方被围困！", 5000, false, {
        priority: 70,
        cssClass: "alert-encounter-distress"
      });
    },
    tick(encounter, dt) {
      const npc = state.npcs.find((n) => n.id === encounter.npcIds[0]);
      if (!npc || npc.destroyed) {
        if (!encounter.encounterData?.rescued) {
          encounter.failed = true;
          showHostileStationAlert("救援失败", 3000, false, {
            priority: 70,
            cssClass: "alert-encounter-distress"
          });
        }
        return;
      }
      const aliveCount = countAliveEncounterPirates(encounter.encounterData);
      if (aliveCount === 0 && !encounter.encounterData.rescued) {
        encounter.encounterData.rescued = true;
        encounter.encounterData.reward = { metal: 120, research: 18, plasma: 5 };
        showHostileStationAlert("救援成功！+120金属 +18科研 +5等离子", 4000, true, {
          priority: 70,
          cssClass: "alert-encounter-distress"
        });
        const escapeAngle = Math.random() * Math.PI * 2;
        npc.target = {
          x: npc.pos.x + Math.cos(escapeAngle) * 1500,
          y: npc.pos.y + Math.sin(escapeAngle) * 1500
        };
        npc.speed = 100;
      }
    },
    onEnemyKilled(encounter, enemy) {
      if (encounter.encounterData?.pirateIds?.includes(enemy)) {
        encounter.encounterData.piratesKilled += 1;
      }
    },
    onNpcDestroyed(encounter, npc) {
      if (npc.id === encounter.npcIds[0]) {
        encounter.failed = true;
      }
    },
    isComplete(encounter) {
      return encounter.encounterData?.rescued === true;
    },
    isFailed(encounter) {
      return encounter.failed === true;
    },
    getDetail(encounter) {
      if (encounter.encounterData?.rescued) return "救援完成";
      const alive = countAliveEncounterPirates(encounter.encounterData);
      return `救援请求：清除海盗（${alive} 剩余）`;
    },
    getHint(encounter) {
      return encounter.encounterData?.rescued ? "" : "击败围困海盗";
    },
    render(encounter) {
      if (!encounter.spawnPos) return;
      const pulse = 0.4 + 0.35 * Math.sin(state.time * Math.PI * 4);
      renderer.ring(encounter.spawnPos, 56, 2.5, [0.36, 0.88, 0.88, pulse], 36);
    }
  },
  // ambush：伪装求救，靠近后触发高强度海盗伏击。
  ambush: {
    ...ENCOUNTER_TYPE_DEFAULTS,
    cssClass: "alert-encounter-ambush",
    hudAlertClass: "alert-encounter-ambush",
    priority: 80,
    spawnDistanceMin: 600,
    spawnDistanceMax: 900,
    cooldownTurns: 1,
    defaultExpireMs: 60000,
    make(encounter, rng, level) {
      const npc = createEncounterNpc("distress-pilot", encounter.id, {
        pos: { ...encounter.spawnPos },
        target: { ...encounter.spawnPos },
        hp: 60,
        maxHp: 60,
        hudColor: ENCOUNTER_NPC_COLOR_DISTRESS,
        speed: 20,
        radius: 18
      });
      state.npcs.push(npc);
      encounter.npcIds.push(npc.id);
      encounter.encounterData = {
        triggered: false,
        pirateCount: 6 + Math.floor(rng() * 3),
        pirateIds: [],
        triggerRange: 300,
        escapeRange: 500,
        victorious: false
      };
      showHostileStationAlert("收到求救信号...", 4000, false, {
        priority: 80,
        cssClass: "alert-encounter-ambush"
      });
    },
    tick(encounter, dt) {
      const data = encounter.encounterData;
      if (!data) return;
      const npc = state.npcs.find((n) => n.id === encounter.npcIds[0]);
      if (!data.triggered) {
        if (!npc) return;
        const dist = Math.hypot(state.station.pos.x - npc.pos.x, state.station.pos.y - npc.pos.y);
        if (dist < data.triggerRange) {
          data.triggered = true;
          npc.kind = "pirate-ambush";
          npc.hudColor = ENCOUNTER_NPC_COLOR_AMBUSH;
          const lvl = levelIndex(state.run.level);
          for (let i = 0; i < data.pirateCount; i++) {
            const angle = (i / data.pirateCount) * Math.PI * 2;
            const radius = 100 + Math.random() * 50;
            const pos = {
              x: encounter.spawnPos.x + Math.cos(angle) * radius,
              y: encounter.spawnPos.y + Math.sin(angle) * radius
            };
            spawnEncounterPirate(encounter, pos, lvl, data);
          }
          showHostileStationAlert("陷阱！海盗伏击！", 3000, false, {
            priority: 80,
            cssClass: "alert-encounter-ambush"
          });
        } else if (dist > data.escapeRange + 200) {
          encounter.expired = true;
        }
      } else {
        const aliveCount = countAliveEncounterPirates(data);
        if (aliveCount === 0 && !data.victorious) {
          data.victorious = true;
          data.reward = { metal: 200, research: 25, plasma: 0 };
          showHostileStationAlert("伏击击退！+200金属 +25科研", 4000, true, {
            priority: 80,
            cssClass: "alert-encounter-ambush"
          });
          const wreckRng = getEncounterRng(state.run.level);
          for (let i = 0; i < 3; i++) {
            const angle = wreckRng() * Math.PI * 2;
            const radius = 80 + wreckRng() * 60;
            const pos = {
              x: encounter.spawnPos.x + Math.cos(angle) * radius,
              y: encounter.spawnPos.y + Math.sin(angle) * radius
            };
            const fragment = makeWreckFragment(pos, wreckRng, {
              weights: ENEMY_WRECK_FACILITY_WEIGHTS,
              origin: "enemy-wreck"
            });
            if (fragment) {
              state.fragments.push(fragment);
              encounter.fragmentIds.push(fragment.id);
            }
          }
        }
      }
    },
    onEnemyKilled(encounter, enemy) {
      if (encounter.encounterData?.pirateIds?.includes(enemy)) {
        encounter.encounterData.piratesKilled = (encounter.encounterData.piratesKilled || 0) + 1;
      }
    },
    isComplete(encounter) {
      return encounter.encounterData?.victorious === true;
    },
    isFailed() {
      return false;
    },
    getDetail(encounter) {
      const data = encounter.encounterData;
      if (data?.victorious) return "伏击已击退";
      if (data?.triggered) {
        const alive = countAliveEncounterPirates(data);
        return `海盗伏击！${alive} 剩余`;
      }
      return "求救信号（疑似陷阱）";
    },
    getHint(encounter) {
      return encounter.encounterData?.triggered ? "击退伏击者" : "靠近调查或远离脱险";
    },
    render(encounter) {
      if (!encounter.spawnPos) return;
      const triggered = encounter.encounterData?.triggered;
      const color = triggered ? ENCOUNTER_NPC_COLOR_AMBUSH : ENCOUNTER_NPC_COLOR_DISTRESS;
      const pulse = 0.35 + 0.2 * Math.sin(state.time * Math.PI * (triggered ? 6 : 2));
      renderer.ring(encounter.spawnPos, triggered ? 64 : 52, 2, [color[0], color[1], color[2], pulse], 32);
    }
  },
  // derelict：沉船秘窟，生成 wreck 群供玩家自由拾荒。
  derelict: {
    ...ENCOUNTER_TYPE_DEFAULTS,
    cssClass: "alert-encounter-derelict",
    hudAlertClass: "alert-encounter-derelict",
    priority: 40,
    spawnDistanceMin: 700,
    spawnDistanceMax: 1100,
    cooldownTurns: 1,
    defaultExpireMs: 99999999,
    make(encounter, rng, level) {
      const lvl = levelIndex(level);
      const wreckCount = lvl <= 1 ? 4 : (lvl <= 3 ? 5 : 6);
      encounter.encounterData = { wreckCount, wrecksDocked: 0 };
      for (let i = 0; i < wreckCount; i++) {
        const angle = (i / wreckCount) * Math.PI * 2 + rng() * 0.5;
        const radius = 80 + rng() * 40;
        const pos = {
          x: encounter.spawnPos.x + Math.cos(angle) * radius,
          y: encounter.spawnPos.y + Math.sin(angle) * radius
        };
        const fragment = makeWreckFragment(pos, rng, {
          weights: DERELICT_FACILITY_WEIGHTS,
          origin: "derelict"
        });
        if (fragment) {
          state.fragments.push(fragment);
          encounter.fragmentIds.push(fragment.id);
        }
      }
      showHostileStationAlert("发现沉船秘窟！", 4000, false, {
        priority: 40,
        cssClass: "alert-encounter-derelict"
      });
    },
    tick() {},
    onFragmentDocked(encounter, fragment) {
      if (!encounter.fragmentIds.includes(fragment.id)) return;
      encounter.encounterData.wrecksDocked += 1;
      if (encounter.encounterData.wrecksDocked >= encounter.encounterData.wreckCount) {
        showHostileStationAlert("沉船秘窟拾荒完成！", 3000, true, {
          priority: 40,
          cssClass: "alert-encounter-derelict"
        });
      }
    },
    isComplete(encounter) {
      return (encounter.encounterData?.wrecksDocked || 0) >= (encounter.encounterData?.wreckCount || 0);
    },
    isFailed() {
      return false;
    },
    getDetail(encounter) {
      const data = encounter.encounterData || {};
      return `沉船秘窟 ${data.wrecksDocked || 0}/${data.wreckCount || 0}`;
    },
    getHint() {
      return "拾荒 wreck";
    },
    render(encounter) {
      if (!encounter.spawnPos) return;
      renderer.ring(encounter.spawnPos, 90, 2, [0.7, 0.5, 1, 0.28], 40);
    }
  },
  // signal：远距神秘信号，回收单个高价值 fragment。
  signal: {
    ...ENCOUNTER_TYPE_DEFAULTS,
    cssClass: "alert-encounter-signal",
    hudAlertClass: "alert-encounter-signal",
    priority: 30,
    spawnDistanceMin: 800,
    spawnDistanceMax: 1400,
    cooldownTurns: 1,
    defaultExpireMs: 99999999,
    make(encounter, rng, level) {
      const cellCount = 6 + Math.floor(rng() * 4);
      const fragment = makeWreckFragment(encounter.spawnPos, rng, {
        weights: SIGNAL_FACILITY_WEIGHTS,
        origin: "signal",
        cellCountRange: { min: cellCount, max: cellCount }
      });
      if (fragment) {
        state.fragments.push(fragment);
        encounter.fragmentIds.push(fragment.id);
        encounter.encounterData = { docked: false };
      } else {
        encounter.failed = true;
      }
      showHostileStationAlert("神秘信号已锁定", 3000, false, {
        priority: 30,
        cssClass: "alert-encounter-signal"
      });
    },
    tick() {},
    onFragmentDocked(encounter, fragment) {
      if (!encounter.fragmentIds.includes(fragment.id)) return;
      encounter.encounterData.docked = true;
      showHostileStationAlert("神秘信号已回收！", 3000, true, {
        priority: 30,
        cssClass: "alert-encounter-signal"
      });
    },
    isComplete(encounter) {
      return encounter.encounterData?.docked === true;
    },
    isFailed() {
      return false;
    },
    getDetail(encounter) {
      return encounter.encounterData?.docked ? "信号已回收" : "神秘信号 - 远距离拾荒";
    },
    getHint() {
      return "飞往信号点回收 fragment";
    },
    render(encounter) {
      if (!encounter.spawnPos) return;
      const pulse = 0.45 + 0.35 * Math.sin(state.time * Math.PI * 2.5);
      renderer.ring(encounter.spawnPos, 72, 3, [1, 0.8, 0.2, pulse], 36);
      renderer.ring(encounter.spawnPos, 40, 1.5, [1, 0.95, 0.55, pulse * 0.8], 24);
    }
  }
};

let encounterIdSeed = 0;

// pickWeighted 的 ENCOUNTER 版本：按 ENCOUNTER_TYPES 注册表过滤合法 type，不影响 OBJECTIVE 抽样
function pickEncounterWeighted(rng, weightTable) {
  if (!weightTable || typeof weightTable !== "object") return null;
  const entries = Object.entries(weightTable).filter(
    ([type, weight]) => ENCOUNTER_TYPES[type] && Number.isFinite(weight) && weight > 0
  );
  if (!entries.length) return null;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

// 独立 RNG 流：与 OBJECTIVE 公式（seed ^ 0x9e3779b9 + level * 0x85ebca6b）完全隔离，
// 保护 __gameTest.findEscortSeed / getObjectiveType 在 v0.7.0/v0.8.0 之间稳定
function getEncounterRng(level) {
  const lvl = levelIndex(level);
  const seed = (state.run.seed ^ ENCOUNTER_RNG_XOR) + lvl * ENCOUNTER_RNG_MUL;
  return mulberry32(seed >>> 0);
}

// v0.9.0：galaxy 候选 RNG 派生流（与 OBJECTIVE / ENCOUNTER 公式完全正交）
// 用 targetLevel 作为 RNG 种子分量，玩家在同 seed 同 level 取到同一组候选
function getGalaxyChoiceRng(targetLevel) {
  const lvl = levelIndex(targetLevel);
  const seed = ((state.run.seed ^ GALAXY_CHOICE_RNG_XOR) >>> 0) + lvl * GALAXY_CHOICE_RNG_MUL;
  return mulberry32(seed >>> 0);
}

// v0.9.0：通用乘子叠加 helper
// final[type] = base[type] × (galaxyMod[type] ?? 1.0)；乘子缺失走 1.0；保护负值不出现
function applyGalaxyWeightMod(baseWeights, galaxyMod) {
  if (!baseWeights || typeof baseWeights !== "object") return {};
  if (!galaxyMod || typeof galaxyMod !== "object") return { ...baseWeights };
  const result = {};
  for (const [type, baseWeight] of Object.entries(baseWeights)) {
    const mod = galaxyMod[type];
    if (mod == null) {
      result[type] = baseWeight;
    } else {
      const finalWeight = baseWeight * mod;
      result[type] = Number.isFinite(finalWeight) ? Math.max(0, finalWeight) : 0;
    }
  }
  return result;
}

function resolveGalaxyTypeKey(galaxyType) {
  if (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType]) return galaxyType;
  if (typeof state.run?.currentGalaxyType === "string" && GALAXY_TYPES[state.run.currentGalaxyType]) {
    return state.run.currentGalaxyType;
  }
  return "emptyVoid";
}

function getGalaxyDefinition(galaxyType) {
  const key = resolveGalaxyTypeKey(galaxyType);
  return GALAXY_TYPES[key] || GALAXY_TYPES.emptyVoid;
}

function getGalaxyResourceMultiplier(resourceType, galaxyType) {
  const resourceMod = getGalaxyDefinition(galaxyType)?.resourceMod;
  if (!resourceMod || typeof resourceMod !== "object") return 1.0;
  const mod = resourceMod[resourceType];
  if (!Number.isFinite(mod)) return 1.0;
  return Math.max(0, mod);
}

function getGalaxyEnemySpawnMultiplier(galaxyType) {
  const enemySpawnMod = getGalaxyDefinition(galaxyType)?.enemySpawnMod;
  if (!Number.isFinite(enemySpawnMod)) return 1.0;
  return Math.max(0.1, enemySpawnMod);
}

function getGalaxySpawnInterval(baseInterval, galaxyType) {
  if (!Number.isFinite(baseInterval)) return baseInterval;
  return baseInterval / getGalaxyEnemySpawnMultiplier(galaxyType);
}

function getObjectiveWeightsForLevel(level, galaxyType, hostileStationSpawned = false) {
  const lvl = levelIndex(level);
  let weightTable = {
    ...(OBJECTIVE_LEVEL_WEIGHTS[lvl] || OBJECTIVE_LEVEL_WEIGHTS[OBJECTIVE_LEVEL_WEIGHTS.length - 1])
  };
  if (hostileStationSpawned) {
    delete weightTable.assault;
  }
  const galaxyDef = getGalaxyDefinition(galaxyType);
  weightTable = applyGalaxyWeightMod(weightTable, galaxyDef.objectiveWeightMod);
  if (weightTable.assault != null && Number.isFinite(galaxyDef.hostileStationMod)) {
    weightTable.assault = Math.max(0, weightTable.assault * galaxyDef.hostileStationMod);
  }
  return weightTable;
}

function getEncounterWeightsForLevel(level, galaxyType) {
  const lvl = levelIndex(level);
  const baseWeights = { ...(ENCOUNTER_LEVEL_WEIGHTS[lvl] || {}) };
  const galaxyDef = getGalaxyDefinition(galaxyType);
  return applyGalaxyWeightMod(baseWeights, galaxyDef.encounterWeightMod);
}

// v0.9.0：基于 GALAXY_LEVEL_BIAS 的二阶段加权候选抽样
// 先在 candidatePool 中按 riskLevel 分组，再按 riskBias[risk] / 组内 type 数量 形成单 type 权重，
// 最后一次性加权抽取（等价于 numerics §2.5 二阶段抽样的单步实现，便于直接用 mulberry32 RNG）
function pickWeightedGalaxyType(rng, candidatePool, riskBias) {
  if (!Array.isArray(candidatePool) || candidatePool.length === 0) return null;
  const effectiveBias = riskBias && typeof riskBias === "object" ? riskBias : GALAXY_CHOICE_BASE_WEIGHTS;
  const riskGroups = {};
  for (const type of candidatePool) {
    const def = GALAXY_TYPES[type];
    const risk = def?.riskLevel || "mid";
    if (!riskGroups[risk]) riskGroups[risk] = [];
    riskGroups[risk].push(type);
  }
  const entries = [];
  let total = 0;
  for (const type of candidatePool) {
    const def = GALAXY_TYPES[type];
    const risk = def?.riskLevel || "mid";
    const biasValue = effectiveBias[risk];
    if (!Number.isFinite(biasValue) || biasValue <= 0) continue;
    const groupSize = riskGroups[risk]?.length || 1;
    const weight = biasValue / groupSize;
    if (!Number.isFinite(weight) || weight <= 0) continue;
    entries.push([type, weight]);
    total += weight;
  }
  if (!entries.length || total <= 0) {
    // 兜底：所有 risk bias 为 0（如 level 1 风险池只剩 extreme），随机选一个保留可推进
    const idx = Math.floor(rng() * candidatePool.length);
    return candidatePool[Math.min(idx, candidatePool.length - 1)];
  }
  let roll = rng() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

// v0.9.0：候选生成主函数
// level 0 起点固定 emptyVoid；level >= ENDGAME_LEVEL 终末强制 warFront；
// 中间关按 GALAXY_CANDIDATE_COUNT 决定候选数量，按 GALAXY_LEVEL_BIAS 风险倾向抽样；
// 候选池保留 emptyVoid（玩家可"喘息"），尽量排除当前 galaxyType（避免连续两关同类型）。
function generateGalaxyChoices(targetLevel, rng) {
  const lvl = levelIndex(targetLevel);
  if (lvl <= 0) return [{ galaxyType: "emptyVoid", reason: "start" }];
  if (lvl >= ENDGAME_LEVEL) return [{ galaxyType: "warFront", reason: "endgame" }];
  const candidateCount = GALAXY_CANDIDATE_COUNT[lvl] || 2;
  const riskBias = GALAXY_LEVEL_BIAS[lvl] || GALAXY_CHOICE_BASE_WEIGHTS;
  const currentType = state.run?.currentGalaxyType;
  let available = Object.keys(GALAXY_TYPES);
  if (currentType && available.length > 1) {
    available = available.filter((t) => t !== currentType);
  }
  const choices = [];
  const used = new Set();
  for (let i = 0; i < candidateCount; i++) {
    const pool = available.filter((t) => !used.has(t));
    if (pool.length === 0) break;
    const picked = pickWeightedGalaxyType(rng, pool, riskBias);
    if (!picked) break;
    choices.push({ galaxyType: picked, reason: "random" });
    used.add(picked);
  }
  return choices;
}

// v0.9.0：跃迁到候选确认入口
// 本批可由测试钩子（forceConfirmGalaxyJump）调用，UI 层 T5 接入卡片点击时同样走此函数；
// 关闭 galaxyMapPanel（若 DOM 存在）、清理 pendingChoices / galaxyChoicesShown，
// 然后通过 nextLevel(galaxyType) 推进关卡，并在 galaxyMap.nodes 中追加新节点。
// options.allowFallback：无 panel / 无候选时的内部 emptyVoid 回落路径（不经玩家点选）。
function confirmGalaxyJump(galaxyType, options = {}) {
  if (!GALAXY_TYPES[galaxyType]) return false;
  if (state.run.level >= ENDGAME_LEVEL) return false;
  if (galaxyJumpInFlight) return false;

  const nextLvl = levelIndex(state.run.level + 1);
  const isEndgameForced = nextLvl >= ENDGAME_LEVEL && galaxyType === "warFront";
  const allowFallback = options.allowFallback === true;
  const pending = state.run.galaxyMap?.pendingChoices || [];
  const inPending = pending.some((choice) => choice && choice.galaxyType === galaxyType);

  if (!isEndgameForced && !allowFallback) {
    if (!state.run.galaxyChoicesShown || !inPending) return false;
  }

  galaxyJumpInFlight = true;
  disableGalaxyMapCards();
  try {
    hideGalaxyMapPanel();
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [];
    }
    state.run.galaxyChoicesShown = false;
    nextLevel(galaxyType);
    // 在 galaxyMap.nodes 中追加新节点；前一个 current 节点转为 visited
    if (state.run.galaxyMap) {
      for (const node of state.run.galaxyMap.nodes) {
        if (node) node.current = false;
      }
      galaxyNodeIdSeed += 1;
      const newNode = {
        id: `node-${galaxyNodeIdSeed}`,
        level: levelIndex(state.run.level),
        galaxyType,
        visited: true,
        current: true
      };
      state.run.galaxyMap.nodes.push(newNode);
      state.run.galaxyMap.currentNodeId = newNode.id;
    }
    if (typeof updateHud === "function") updateHud();
    return true;
  } finally {
    galaxyJumpInFlight = false;
  }
}

// v0.9.0：玩家在 galaxyMapPanel 按 Escape 或点击「暂时停留」时调用
// 保持 awaitingObjectiveChoice 不变，让玩家可再次点击 jumpBtn 重新弹出选择；
// 仅清理 galaxyChoicesShown 标记并刷新 objectiveChoicePanel + HUD；
// pendingChoices 留待 jumpBtn 重新触发时按 RNG 再生成（数值方案 §6.1 校验 5）。
function cancelGalaxyJump() {
  hideGalaxyMapPanel();
  disableGalaxyMapCards();
  galaxyJumpInFlight = false;
  state.run.galaxyChoicesShown = false;
  if (typeof updateObjectiveChoiceUi === "function") updateObjectiveChoiceUi();
  if (typeof updateHud === "function") updateHud();
}

function disableGalaxyMapCards() {
  const panel = document.getElementById("galaxyMapPanel");
  const cardsEl = panel?.querySelector(".galaxy-map-cards");
  if (cardsEl) cardsEl.classList.add("disabled");
  const cards = panel?.querySelectorAll(".galaxy-map-card");
  if (!cards) return;
  for (const card of cards) {
    card.disabled = true;
    card.classList.add("disabled");
    card.setAttribute("aria-disabled", "true");
  }
}

function resetGalaxyMapCardsInteractiveState() {
  const panel = document.getElementById("galaxyMapPanel");
  const cardsEl = panel?.querySelector(".galaxy-map-cards");
  if (cardsEl) cardsEl.classList.remove("disabled");
  const cards = cardsEl?.querySelectorAll(".galaxy-map-card")
    || panel?.querySelectorAll(".galaxy-map-card")
    || [];
  for (const card of cards) {
    card.disabled = false;
    card.classList.remove("disabled");
    card.removeAttribute("aria-disabled");
  }
}

function isGalaxyMapCardsInteractive() {
  const panel = document.getElementById("galaxyMapPanel");
  const cardsEl = panel?.querySelector(".galaxy-map-cards");
  if (!cardsEl || cardsEl.classList.contains("disabled")) return false;
  const cards = cardsEl.querySelectorAll(".galaxy-map-card");
  if (!cards.length) {
    // Node VM stub 等环境可能不把 innerHTML 物化为子节点；容器已解除 disabled 即视为可重开。
    return true;
  }
  for (const card of cards) {
    if (card.disabled || card.classList.contains("disabled")) return false;
  }
  return true;
}

const OBJECTIVE_PREF_LABELS = {
  mine: "采矿",
  survive: "生存",
  battle: "战斗",
  explore: "探索",
  salvage: "拾荒",
  escort: "护送",
  assault: "突击",
  guardian: "守护者"
};

const ENCOUNTER_PREF_LABELS = {
  trader: "贸易",
  distress: "求救",
  ambush: "伏击",
  derelict: "残骸",
  signal: "信号"
};

const RESOURCE_PREF_LABELS = {
  metal: "金属",
  ore: "矿物",
  gas: "气体",
  plasma: "等离子",
  research: "科研"
};

function rgbaArrayToCss(rgba) {
  if (!Array.isArray(rgba)) return "#555555";
  const [r, g, b, a = 1] = rgba;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

function isGalaxyMapPanelOpen() {
  const panel = document.getElementById("galaxyMapPanel");
  return !!(panel && !panel.classList.contains("hidden"));
}

function hideGalaxyMapPanel(options = {}) {
  const panel = document.getElementById("galaxyMapPanel");
  if (panel) panel.classList.add("hidden");
  if (!options.skipSync) syncMainPanelUiState();
}

function forceHideGalaxyMapPanel(options = {}) {
  hideGalaxyMapPanel({ skipSync: true });
  disableGalaxyMapCards();
  galaxyJumpInFlight = false;
  if (!options.skipSync) syncMainPanelUiState();
}

function formatRiskLabel(risk) {
  return { low: "低风险", mid: "中风险", high: "高风险", extreme: "极高风险" }[risk] || "未知风险";
}

function summarizeWeightModPreferences(mod, labels, minMod = 1.05) {
  if (!mod || typeof mod !== "object") return "均衡";
  const ranked = Object.entries(mod)
    .filter(([, value]) => Number.isFinite(value) && value >= minMod)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  if (!ranked.length) return "均衡";
  return ranked.map(([key, value]) => {
    const modText = value >= 2 ? Math.round(value) : value.toFixed(1);
    return `${labels[key] || key} ×${modText}`;
  }).join(" / ");
}

function summarizeObjectivePreferences(mod) {
  return summarizeWeightModPreferences(mod, OBJECTIVE_PREF_LABELS);
}

function summarizeEncounterPreferences(mod) {
  return summarizeWeightModPreferences(mod, ENCOUNTER_PREF_LABELS);
}

function formatResourceModSummary(resourceMod) {
  if (!resourceMod || typeof resourceMod !== "object") return null;
  const boosted = Object.entries(resourceMod)
    .filter(([, value]) => Number.isFinite(value) && value !== 1.0)
    .sort((a, b) => Math.abs(b[1] - 1) - Math.abs(a[1] - 1))
    .slice(0, 2);
  if (!boosted.length) return null;
  return boosted.map(([key, value]) => `${RESOURCE_PREF_LABELS[key] || key} ×${value.toFixed(1)}`).join(" / ");
}

function formatGalaxyModsHtml(def) {
  const parts = [];
  if (def.enemySpawnMod != null && def.enemySpawnMod !== 1.0) {
    parts.push(`<li>敌人 ×${def.enemySpawnMod.toFixed(1)}</li>`);
  }
  const resourceSummary = formatResourceModSummary(def.resourceMod);
  if (resourceSummary) parts.push(`<li>资源：${resourceSummary}</li>`);
  if (def.hostileStationMod && def.hostileStationMod !== 1.0) {
    parts.push(`<li>突击概率 ×${def.hostileStationMod.toFixed(1)}</li>`);
  }
  parts.push(`<li>任务：${summarizeObjectivePreferences(def.objectiveWeightMod)}</li>`);
  parts.push(`<li>事件：${summarizeEncounterPreferences(def.encounterWeightMod)}</li>`);
  return parts.join("");
}

function buildGalaxyForesightHints(def) {
  const hints = [];
  const resourceSummary = formatResourceModSummary(def.resourceMod);
  hints.push(resourceSummary ? `资源倾向：${resourceSummary}` : "资源倾向：均衡");
  hints.push(`风险评估：${formatRiskLabel(def.riskLevel)} / 敌人 ×${(def.enemySpawnMod || 1).toFixed(1)}`);
  hints.push(`任务偏好：${summarizeObjectivePreferences(def.objectiveWeightMod)}`);
  hints.push(`事件偏好：${summarizeEncounterPreferences(def.encounterWeightMod)}`);
  return hints.slice(0, 4);
}

function formatGalaxyForesightHtml(def) {
  const hintItems = buildGalaxyForesightHints(def)
    .map((text) => `<li>${text}</li>`)
    .join("");
  return `<div class="galaxy-map-foresight">`
    + `<div class="galaxy-map-foresight-title">星图洞察</div>`
    + `<ul class="galaxy-map-foresight-list">${hintItems}</ul>`
    + `</div>`;
}

function renderGalaxyMapCards(choices) {
  const panel = document.getElementById("galaxyMapPanel");
  const cardsEl = panel?.querySelector(".galaxy-map-cards");
  if (!cardsEl) return false;
  resetGalaxyMapCardsInteractiveState();
  const safeChoices = Array.isArray(choices)
    ? choices.filter((choice) => choice && GALAXY_TYPES[choice.galaxyType])
    : [];
  if (!safeChoices.length) return false;
  const foresightEnabled = getMetaEffect("galaxyForesight") === true;

  let html = "";
  for (const choice of safeChoices) {
    const def = GALAXY_TYPES[choice.galaxyType];
    const riskLabel = formatRiskLabel(def.riskLevel);
    const iconCss = rgbaArrayToCss(def.iconColor);
    const modsHtml = formatGalaxyModsHtml(def);
    const foresightHtml = foresightEnabled ? formatGalaxyForesightHtml(def) : "";
    html += `<button type="button" class="galaxy-map-card ${def.cssClass || ""}" data-galaxy-type="${choice.galaxyType}">`
      + `<span class="galaxy-map-card-icon" style="background-color: ${iconCss}"></span>`
      + `<h3 class="galaxy-map-card-name">${def.name}</h3>`
      + `<span class="galaxy-map-card-risk risk-${def.riskLevel}">${riskLabel}</span>`
      + `<p class="galaxy-map-card-description">${def.description}</p>`
      + `<ul class="galaxy-map-card-mods">${modsHtml}</ul>`
      + foresightHtml
      + `</button>`;
  }
  setHtmlIfChanged(cardsEl, "galaxyMapCards", html);
  return true;
}

function openGalaxyMapPanel(choices) {
  const panel = document.getElementById("galaxyMapPanel");
  if (!panel) return false;
  const openResult = requestOpenMainPanel("galaxyMap");
  if (!openResult.ok) return false;
  const safeChoices = Array.isArray(choices)
    ? choices.filter((choice) => choice && GALAXY_TYPES[choice.galaxyType])
    : [];
  if (!safeChoices.length) {
    confirmGalaxyJump("emptyVoid", { allowFallback: true });
    return false;
  }
  resetGalaxyMapCardsInteractiveState();
  if (!renderGalaxyMapCards(safeChoices)) {
    confirmGalaxyJump(safeChoices[0].galaxyType);
    return false;
  }
  panel.classList.remove("hidden");
  syncMainPanelUiState();
  return true;
}

function bindGalaxyMapPanelEvents() {
  if (galaxyMapPanelBound) return;
  const panel = document.getElementById("galaxyMapPanel");
  if (!panel) return;
  galaxyMapPanelBound = true;
  panel.querySelector(".galaxy-map-cancel-btn")?.addEventListener("click", () => cancelGalaxyJump());
  panel.querySelector(".galaxy-map-overlay")?.addEventListener("click", () => cancelGalaxyJump());
  panel.querySelector(".galaxy-map-cards")?.addEventListener("click", (event) => {
    if (galaxyJumpInFlight) return;
    const card = event.target.closest(".galaxy-map-card");
    if (!card || card.disabled || card.classList.contains("disabled")) return;
    const galaxyType = card.dataset.galaxyType;
    if (galaxyType && GALAXY_TYPES[galaxyType]) {
      disableGalaxyMapCards();
      confirmGalaxyJump(galaxyType);
    }
  });
}

function updateGalaxyPathHud() {
  const el = galaxyPathEl || document.getElementById("galaxyPathEl");
  if (!el) return;
  const dotsEl = el.querySelector(".hud-galaxy-path-dots");
  if (!dotsEl) return;

  const nodes = state.run.galaxyMap?.nodes || [];
  const currentLevel = levelIndex(state.run.level);
  let html = "";

  for (let lvl = 0; lvl <= ENDGAME_LEVEL; lvl++) {
    const node = nodes.find((entry) => entry && entry.level === lvl);
    const fallbackType = lvl === ENDGAME_LEVEL ? "warFront" : null;
    const galaxyType = node?.galaxyType ?? fallbackType;
    const galaxyDef = galaxyType ? getGalaxyDefinition(galaxyType) : null;
    const color = galaxyDef ? rgbaArrayToCss(galaxyDef.iconColor) : "#555555";

    const classes = ["path-dot"];
    if (node && node.visited && !node.current) classes.push("visited");
    else if (lvl === currentLevel) classes.push("current");
    else classes.push("future");
    if (lvl === ENDGAME_LEVEL) classes.push("endgame");

    const titleAttr = galaxyDef ? ` title="${galaxyDef.name}（${formatRiskLabel(galaxyDef.riskLevel)}）"` : "";
    html += `<span class="${classes.join(" ")}" data-level="${lvl}"${titleAttr} style="background-color: ${color}"></span>`;
  }
  setHtmlIfChanged(dotsEl, "galaxyPathDots", html);
}

function updateCurrentGalaxyInfoHud() {
  const el = currentGalaxyInfoEl || document.getElementById("currentGalaxyInfoEl");
  if (!el) return;
  const def = getGalaxyDefinition(state.run.currentGalaxyType);
  const iconCss = rgbaArrayToCss(def.iconColor);
  const riskLabel = formatRiskLabel(def.riskLevel);
  const html = `<span class="galaxy-info-icon" style="background-color: ${iconCss}"></span>`
    + `<span class="galaxy-info-name">${def.name}</span>`
    + `<span class="galaxy-info-risk risk-${def.riskLevel}">${riskLabel}</span>`;
  setHtmlIfChanged(el, "currentGalaxyInfo", html);
}

function getObjectiveWeightTable(level) {
  return getObjectiveWeightsForLevel(level, undefined, Boolean(state.run.hostileStationSpawnedThisGalaxy));
}

function resolveObjectiveRewardMultiplier(objectiveType, level) {
  if (!objectiveType) return 1.0;
  if (typeof objectiveType.rewardMultiplier === "function") {
    return objectiveType.rewardMultiplier(level);
  }
  return objectiveType.rewardMultiplier ?? 1.0;
}

function resolveObjectiveResearchReward(objectiveType, level, typeName) {
  if (typeName === "assault") {
    const effectiveLevel = level === 4 ? 4 : level === 5 ? 5 : 3;
    return ASSAULT_RESEARCH_REWARD_BY_LEVEL[effectiveLevel] ?? 9;
  }
  if (!objectiveType) return 0;
  if (typeof objectiveType.researchReward === "function") {
    return objectiveType.researchReward(level);
  }
  return objectiveType.researchReward || 0;
}

function isObjectiveDefinitionComplete(objective, objectiveType) {
  if (!objective || !objectiveType) return false;
  if (typeof objectiveType.isComplete === "function") {
    return Boolean(objectiveType.isComplete(objective));
  }
  return objective.progress >= objective.target;
}

function notifyObjective(event, payload) {
  const objective = state.run.objective;
  if (!objective || isObjectiveComplete() || isObjectiveFailed()) return;
  const objectiveType = OBJECTIVE_TYPES[objective.type];
  if (!objectiveType) return;
  const handlerName = OBJECTIVE_EVENT_HANDLERS[event];
  if (!handlerName) return;
  const handler = objectiveType[handlerName];
  if (typeof handler !== "function") return;
  handler(objective, payload);
  if (!isObjectiveComplete() && !isObjectiveFailed() && isObjectiveDefinitionComplete(objective, objectiveType)) {
    grantObjectiveReward();
  }
}

// v0.8.0：ENCOUNTER 平行事件总线
// 与 notifyObjective 并行存在：现有 8 处 notifyObjective 调用之后追加 notifyEncounters，
// 让 ENCOUNTER 注册表可以消费同一组事件（mined/enemyKilled/fragmentDocked/hostileStationKilled/
// guardianKilled/tick 双路径派发；npcArrived/npcDestroyed 在 damageNpc / tickNpc 内按 npc.role 分流）。
function notifyEncounters(event, payload) {
  if (!Array.isArray(state.run.encounters) || state.run.encounters.length === 0) return;
  const handlerName = ENCOUNTER_EVENT_HANDLERS[event];
  if (!handlerName) return;
  // 复制数组避免派发过程中 mutation（applyEncounterReward 可能改变 state.run.encounters 顺序）
  const encounters = state.run.encounters.slice();
  for (const encounter of encounters) {
    if (!encounter) continue;
    if (encounter.completed || encounter.failed || encounter.expired) continue;
    if (encounter.state !== "active") continue;
    const type = ENCOUNTER_TYPES[encounter.type];
    if (!type) continue;
    const handler = type[handlerName];
    if (typeof handler !== "function") continue;
    handler(encounter, payload);
    if (!encounter.completed && !encounter.failed && type.isComplete(encounter)) {
      encounter.completed = true;
      encounter.state = "complete";
      applyEncounterReward(encounter);
    } else if (!encounter.failed && !encounter.completed && type.isFailed(encounter)) {
      encounter.failed = true;
      encounter.state = "failed";
    }
  }
}

// ENCOUNTER 独立奖励路径
// 不调用 grantObjectiveReward / saveMeta / endRunSettlement，避免触发 meta.points、
// objectiveCompleteAt、awaitingObjectiveChoice 等 OBJECTIVE 专属副作用；
// 事件生成的 NPC / fragment / wreck 由各 type.make / activateEncounter 直接 push，本函数仅结算资源。
function applyEncounterReward(encounter) {
  if (!encounter || !encounter.encounterData) return;
  const reward = encounter.encounterData.reward;
  if (!reward || typeof reward !== "object") return;
  if (Number.isFinite(reward.metal)) state.resources.metal += reward.metal * getGalaxyResourceMultiplier("metal");
  if (Number.isFinite(reward.ore)) state.resources.ore += reward.ore * getGalaxyResourceMultiplier("ore");
  if (Number.isFinite(reward.gas)) state.resources.gas += reward.gas * getGalaxyResourceMultiplier("gas");
  if (Number.isFinite(reward.plasma)) state.resources.plasma += reward.plasma * getGalaxyResourceMultiplier("plasma");
  if (Number.isFinite(reward.research)) {
    state.resources.research = (state.resources.research || 0) + reward.research;
  }
}

// 按权重 + cooldown 为本关生成 1-3 个 encounter，先进入 pending，满足 triggerAt 后再激活。
function seedEncountersForLevel(level) {
  const lvl = levelIndex(level);
  state.run.encounters = [];
  state.run.encounterCooldownThisGalaxy = new Set();
  if (lvl >= ENDGAME_LEVEL) return;

  const counts = ENCOUNTER_PER_LEVEL_COUNT[lvl] || { min: 0, max: 0 };
  if (counts.max <= 0) return;

  const baseWeights = getEncounterWeightsForLevel(lvl);
  const availableTypes = Object.keys(baseWeights).filter(
    (type) => ENCOUNTER_TYPES[type] && Number.isFinite(baseWeights[type]) && baseWeights[type] > 0
  );
  if (availableTypes.length === 0) return;

  const rng = getEncounterRng(lvl);
  const targetCount = counts.min + Math.floor(rng() * (counts.max - counts.min + 1));

  for (let i = 0; i < targetCount && state.run.encounters.length < ENCOUNTER_MAX_CONCURRENT; i++) {
    const tempWeights = {};
    for (const type of availableTypes) {
      const cooldownLimit = ENCOUNTER_TYPES[type].cooldownTurns ?? 1;
      const usedCount = state.run.encounters.filter((entry) => entry.type === type).length;
      if (usedCount >= cooldownLimit) continue;
      tempWeights[type] = baseWeights[type];
    }
    if (Object.keys(tempWeights).length === 0) break;

    const type = pickEncounterWeighted(rng, tempWeights);
    if (!type) break;

    const def = ENCOUNTER_TYPES[type];
    encounterIdSeed += 1;
    const triggerOffset = ENCOUNTER_TRIGGER_BASE_DELAY + i * ENCOUNTER_TRIGGER_STAGGER;
    const expireSeconds = Math.max(1, (def.defaultExpireMs || 60000) / 1000);
    const encounter = {
      id: `enc-${lvl}-${encounterIdSeed}`,
      type,
      state: "pending",
      spawnAt: state.time,
      triggerAt: state.time + triggerOffset,
      expireAt: null,
      spawnPos: null,
      npcIds: [],
      fragmentIds: [],
      enemyIds: [],
      completed: false,
      failed: false,
      expired: false,
      encounterData: {},
      _defaultExpireSeconds: expireSeconds
    };
    state.run.encounters.push(encounter);
    state.run.encounterCooldownThisGalaxy.add(type);
  }
}

// 选择 encounter 在 station 周围的 spawn 位置（距离范围由 ENCOUNTER_TYPES[type] 给出）。
function pickEncounterSpawnPos(type, rng) {
  const def = ENCOUNTER_TYPES[type];
  if (!def) return null;
  const minDist = def.spawnDistanceMin;
  const maxDist = def.spawnDistanceMax;
  if (!Number.isFinite(minDist) || !Number.isFinite(maxDist) || maxDist <= minDist) return null;
  for (let retry = 0; retry < 8; retry++) {
    const distance = minDist + rng() * (maxDist - minDist);
    const angle = rng() * Math.PI * 2;
    if (distance < minDist) continue;
    return {
      x: state.station.pos.x + Math.cos(angle) * distance,
      y: state.station.pos.y + Math.sin(angle) * distance
    };
  }
  return null;
}

// 生成 encounter 海盗并写回反向引用，便于 onEnemyKilled 只统计当前事件目标。
function spawnEncounterPirate(encounter, pos, level, data) {
  const enemy = spawnEnemy("pirate", pos.x, pos.y, { level });
  if (!enemy) return null;
  enemy._encounterId = encounter.id;
  if (!data.pirateIds) data.pirateIds = [];
  data.pirateIds.push(enemy);
  if (!encounter.enemyIds) encounter.enemyIds = [];
  encounter.enemyIds.push(enemy);
  return enemy;
}

function countAliveEncounterPirates(data) {
  if (!data?.pirateIds?.length) return 0;
  return data.pirateIds.filter((enemy) => {
    if (!enemy || enemy.hp <= 0) return false;
    return state.enemies.includes(enemy);
  }).length;
}

// trader 交易结算：T=基础交易，Y=高级交易。
function performTraderTrade(encounter, optionIndex) {
  const data = encounter?.encounterData;
  if (!data || data.traded) return false;
  const option = optionIndex === 2 ? data.tradeOption2 : data.tradeOption1;
  if (!option) return false;
  if (option.cost.metal && state.resources.metal < option.cost.metal) return false;
  if (option.cost.metal) state.resources.metal -= option.cost.metal;
  if (option.reward.plasma) state.resources.plasma += option.reward.plasma;
  if (option.reward.research) state.resources.research = (state.resources.research || 0) + option.reward.research;
  data.traded = true;
  showHostileStationAlert("贸易完成", 3000, true, {
    priority: 50,
    cssClass: "alert-encounter-trader"
  });
  return true;
}

function renderEncounters() {
  if (!Array.isArray(state.run.encounters)) return;
  for (const encounter of state.run.encounters) {
    if (!encounter || encounter.expired) continue;
    if (encounter.state !== "active") continue;
    const type = ENCOUNTER_TYPES[encounter.type];
    if (type?.render) type.render(encounter);
  }
}

// ENCOUNTER 主循环：与 updateObjective(dt) 并行；在 update() 末尾 updateObjective 之后、
// updateCamera 之前调用（确保 objective 先于 encounter tick，camera 更新前 encounter 状态已就绪）。
function updateEncounters(dt) {
  processHudCenterAlertQueue(dt);
  if (!Array.isArray(state.run.encounters) || state.run.encounters.length === 0) return;
  for (const encounter of state.run.encounters) {
    if (!encounter) continue;
    if (encounter.completed || encounter.failed || encounter.expired) continue;
    const type = ENCOUNTER_TYPES[encounter.type];
    if (!type) continue;

    if (encounter.state === "pending" && state.time >= encounter.triggerAt) {
      activateEncounter(encounter);
    }

    if (encounter.state === "active") {
      if (typeof type.tick === "function") type.tick(encounter, dt);
      if (encounter.expired && !encounter.completed && !encounter.failed) {
        expireEncounter(encounter);
        continue;
      }
      if (!encounter.completed && !encounter.failed && type.isComplete(encounter)) {
        encounter.completed = true;
        encounter.state = "complete";
        applyEncounterReward(encounter);
        continue;
      }
      if (!encounter.failed && !encounter.completed && type.isFailed(encounter)) {
        encounter.failed = true;
        encounter.state = "failed";
        continue;
      }
      if (encounter.expireAt !== null && state.time >= encounter.expireAt) {
        expireEncounter(encounter);
      }
    }
  }
}

// 把 encounter 从 pending → active，并在激活时调用 type.make() 生成实体。
function activateEncounter(encounter) {
  const type = ENCOUNTER_TYPES[encounter.type];
  if (!type) return;
  const rng = getEncounterRng(state.run.level);
  const pos = pickEncounterSpawnPos(encounter.type, rng);
  if (!pos) {
    encounter.expired = true;
    encounter.state = "expired";
    return;
  }
  encounter.spawnPos = pos;
  encounter.state = "active";
  const expireSeconds = encounter._defaultExpireSeconds ?? (type.defaultExpireMs / 1000);
  encounter.expireAt = Number.isFinite(expireSeconds) ? state.time + expireSeconds : null;
  if (typeof type.make === "function") {
    type.make(encounter, rng, state.run.level);
  }
  state.run.encounterCooldownThisGalaxy.add(encounter.type);
}

function expireEncounter(encounter) {
  if (!encounter || encounter.state === "expired") return;
  encounter.expired = true;
  encounter.state = "expired";
  const npcIdSet = new Set(encounter.npcIds || []);
  state.npcs = state.npcs.filter((npc) => !npcIdSet.has(npc.id));
  if (!encounter.completed && !encounter.failed) {
    const typeNames = {
      trader: "贸易商船",
      distress: "求救",
      ambush: "陷阱",
      derelict: "沉船",
      signal: "信号"
    };
    showHostileStationAlert(`${typeNames[encounter.type] || "事件"}已离开`, 2000, false, {
      priority: ENCOUNTER_TYPES[encounter.type]?.priority ?? 50,
      cssClass: ENCOUNTER_TYPES[encounter.type]?.hudAlertClass || ""
    });
  }
}

// HUD 中央告警队列：只保留 1 个可见 DOM；高优先级可抢占低优先级。
function processHudCenterAlertQueue(_dt) {
  const current = state.hudCenterAlertCurrent;
  if (current) {
    const queueHead = state.hudCenterAlertQueue?.[0] || null;
    const hasHigherPriority = Boolean(queueHead) && queueHead.priority > current.priority;
    if (state.time >= current.endAt || hasHigherPriority) {
      removeHudCenterAlertDom(current);
      state.hudCenterAlertCurrent = null;
    } else {
      return;
    }
  }

  if (!Array.isArray(state.hudCenterAlertQueue) || state.hudCenterAlertQueue.length === 0) return;
  const next = state.hudCenterAlertQueue.shift();
  const dom = document.createElement("div");
  dom.className = "hud-alert"
    + (next.isSuccess ? " success" : "")
    + (next.cssClass ? ` ${next.cssClass}` : "");
  dom.textContent = next.text;
  document.body.appendChild(dom);
  state.hudCenterAlertCurrent = {
    ...next,
    dom,
    endAt: state.time + Math.max(0, next.ms) / 1000
  };
}

function createObjective() {
  ensureRunRuntimeState();
  if (state.run.level >= ENDGAME_LEVEL) {
    state.run.endgame = true;
    state.run.guardianSpawned = state.run.guardianDefeated;
    if (!state.run.guardianDefeated) {
      state.run.guardianSpawnDelay = Math.max(state.run.guardianSpawnDelay, 6);
    }
    const objective = OBJECTIVE_TYPES.guardian.make();
    if (state.run.guardianDefeated) {
      objective.progress = objective.target;
    }
    state.run.objective = objective;
    state.run.objectiveCompleteAt = 0;
    resetObjectiveChoiceState();
    return;
  }
  const level = levelIndex(state.run.level);
  const objectiveSeed = (state.run.seed ^ 0x9e3779b9) + level * 0x85ebca6b;
  const objectiveRng = mulberry32(objectiveSeed);
  let weightTable = getObjectiveWeightTable(level);
  let type = pickWeighted(objectiveRng, weightTable);
  let objectiveType = OBJECTIVE_TYPES[type] || OBJECTIVE_TYPES.mine;
  let objective = objectiveType.make(objectiveRng, level, state.galaxy);
  if (!objective && type === "assault") {
    delete weightTable.assault;
    type = pickWeighted(objectiveRng, weightTable);
    objectiveType = OBJECTIVE_TYPES[type] || OBJECTIVE_TYPES.mine;
    objective = objectiveType.make(objectiveRng, level, state.galaxy);
  }
  state.run.objective = objective;
  state.run.objectiveCompleteAt = 0;
  state.run.endgame = false;
  state.run.guardianSpawned = false;
  state.run.guardianDefeated = false;
  state.run.guardianSpawnDelay = 0;
  state.run.endgameExplore = false;
  state.run.settlementShown = false;
  state.run.escortLowHpAlerted = false;
  resetObjectiveChoiceState();
}

function grantObjectiveReward() {
  if (isObjectiveComplete()) return;
  state.run.objectiveCompleteAt = Math.max(state.time, 1e-6);
  state.run.completedObjectives++;
  const objectiveType = OBJECTIVE_TYPES[state.run.objective?.type];
  const level = state.run.level || 0;
  const rewardMultiplier = resolveObjectiveRewardMultiplier(objectiveType, level);
  const base = 2 + state.run.level;
  const gained = Math.floor(base * rewardMultiplier);
  state.run.totalObjectiveRewardBase += base;
  grantMetaPoints(gained);
  const researchBase = resolveObjectiveResearchReward(objectiveType, level, state.run.objective?.type);
  if (researchBase > 0) {
    const researchGain = Math.floor(researchBase * (1 + level * 0.1) * getMetaEffect("researchInsight"));
    state.resources.research = (state.resources.research || 0) + researchGain;
  }
  if (state.run.objective?.type === "assault") {
    const effectiveLevel = level === 4 ? 4 : level === 5 ? 5 : 3;
    const metalBase = ASSAULT_METAL_BASE_BY_LEVEL[effectiveLevel] ?? 35;
    const metalGain = Math.floor(metalBase * rewardMultiplier * (1 + level * 0.1) * getGalaxyResourceMultiplier("metal"));
    state.resources.metal += metalGain;
  }
  if (state.run.level >= ENDGAME_LEVEL || state.run.objective?.type === "guardian") {
    showToast(`终局任务完成，基础奖励 ${gained} 点已计入，正在结算本局收益。`);
    endRunSettlement();
    return;
  }
  state.run.awaitingObjectiveChoice = true;
  showToast(`任务完成，获得 ${gained} 局外点数。请选择跃迁或暂时停留。`);
  updateObjectiveChoiceUi();
}

function getRunSettlementData() {
  const base = Math.max(0, Math.floor(state.run.totalObjectiveRewardBase));
  const total = Math.max(base, Math.floor(base * 1.5));
  const bonus = total - base;
  return { base, bonus, total };
}

function getMetaProtocolSuggestion(metaState = state.meta) {
  const selectedProtocolId = getSelectedStartProtocol(metaState);
  const unlockedProtocols = recomputeUnlockedProtocols(metaState);
  const unlockedSet = new Set(unlockedProtocols);
  const categoryScores = {
    resource: 0,
    defense: 0,
    weapon: 0,
    exploration: 0
  };
  for (const node of META_TALENT_TREE) {
    const rank = getMetaTalentRank(node.id, metaState);
    if (rank <= 0) continue;
    if (categoryScores[node.category] !== undefined) {
      categoryScores[node.category] += rank * Math.max(1, node.tier || 1);
    }
  }
  const preferredCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))[0]?.[0] || "resource";
  const preferredProtocolByCategory = {
    resource: "miningStart",
    defense: "defenseStart",
    weapon: "weaponStart",
    exploration: "scoutStart"
  };

  let targetProtocolId = preferredProtocolByCategory[preferredCategory] || META_DEFAULT_PROTOCOL_ID;
  if (!START_PROTOCOL_INDEX[targetProtocolId]) {
    targetProtocolId = META_DEFAULT_PROTOCOL_ID;
  }
  if (!unlockedSet.has(targetProtocolId)) {
    const unlockedNonDefault = unlockedProtocols.find((id) => id !== META_DEFAULT_PROTOCOL_ID);
    if (unlockedNonDefault) {
      targetProtocolId = unlockedNonDefault;
    }
  }
  const targetProtocol = START_PROTOCOL_INDEX[targetProtocolId] || START_PROTOCOL_INDEX[META_DEFAULT_PROTOCOL_ID];
  if (unlockedSet.has(targetProtocol.id)) {
    if (selectedProtocolId === targetProtocol.id) {
      return {
        protocolId: targetProtocol.id,
        protocolName: targetProtocol.name,
        status: "selected",
        message: `下一局协议建议：继续使用「${targetProtocol.name}」。`
      };
    }
    return {
      protocolId: targetProtocol.id,
      protocolName: targetProtocol.name,
      status: "unlocked",
      message: `下一局协议建议：尝试「${targetProtocol.name}」。`
    };
  }
  const unlockHint = getProtocolUnlockHint(targetProtocol, metaState);
  return {
    protocolId: targetProtocol.id,
    protocolName: targetProtocol.name,
    status: "locked",
    message: `下一局协议建议：目标「${targetProtocol.name}」，${unlockHint}。`
  };
}

function getMetaSettlementHints(metaState = state.meta, runState = state.run) {
  const recommendations = [];
  const shortfalls = [];
  for (const node of META_TALENT_TREE) {
    const purchaseState = getMetaPurchaseState(node.id, metaState);
    if (purchaseState.canBuy) {
      recommendations.push({
        nodeId: node.id,
        name: node.name,
        category: node.category,
        tier: node.tier,
        nextCost: purchaseState.nextCost
      });
      continue;
    }
    if (purchaseState.reason === "not_enough_points") {
      shortfalls.push({
        nodeId: node.id,
        name: node.name,
        category: node.category,
        tier: node.tier,
        nextCost: purchaseState.nextCost,
        deficit: purchaseState.deficit
      });
    }
  }

  recommendations.sort((a, b) => a.tier - b.tier || a.nextCost - b.nextCost || a.name.localeCompare(b.name, "zh-CN"));
  shortfalls.sort((a, b) => a.deficit - b.deficit || a.tier - b.tier || a.nextCost - b.nextCost || a.name.localeCompare(b.name, "zh-CN"));

  return {
    pointsGained: Math.max(0, Math.floor(Number(runState?.metaPointsGainedThisRun) || 0)),
    totalPoints: normalizeMetaPoints(metaState?.points),
    recommended: recommendations.slice(0, 3),
    nearestShortfall: shortfalls[0] || null,
    protocolAdvice: getMetaProtocolSuggestion(metaState)
  };
}

function updateRunSettlementPanel() {
  if (!runSettlementPanelEl) return;
  const { base, bonus, total } = getRunSettlementData();
  const hints = getMetaSettlementHints();
  const isFailureMode = state.run.settlementMode === "failure";
  const titleEl = runSettlementPanelEl.querySelector(".objective-choice-title");
  const hintEl = runSettlementPanelEl.querySelector(".objective-choice-hint");
  const restartBtn = document.getElementById("summaryRestartBtn");
  const stayBtn = document.getElementById("summaryStayBtn");
  if (titleEl) {
    titleEl.textContent = isFailureMode ? "失败结算" : "本局结算";
  }
  if (hintEl) {
    hintEl.textContent = isFailureMode
      ? "核心已爆毁。这局仍积累了局外天赋点，可以强化下一局再挑战。"
      : "通关奖励已转化为局外天赋点，可以规划下一条路线。";
  }
  if (restartBtn) {
    restartBtn.textContent = isFailureMode ? "重新开始新局" : "开始新局";
  }
  stayBtn?.classList.toggle("hidden", isFailureMode);

  if (runSettlementStatsEl) {
    runSettlementStatsEl.innerHTML = isFailureMode
      ? [
        `<div>本局状态：<strong>核心爆毁，流程中止</strong></div>`,
        `<div>完成关卡数：<strong>${state.run.completedObjectives}</strong> / ${TOTAL_RUN_LEVELS}</div>`,
        `<div>累计基础奖励：<strong>${base}</strong> 点（失败路径无终局加成）</div>`
      ].join("")
      : [
        `<div>完成关卡数：<strong>${state.run.completedObjectives}</strong> / ${TOTAL_RUN_LEVELS}</div>`,
        `<div>累计基础奖励：<strong>${base}</strong> 点</div>`,
        `<div>终局加成：<strong>+${bonus}</strong>（+50%）</div>`,
        `<div>总点数：<strong>${total}</strong> 点</div>`
      ].join("");
  }
  if (runSettlementMetaFeedbackEl) {
    const recommendationHtml = hints.recommended.length
      ? hints.recommended.map((entry) => {
        const categoryLabel = META_CATEGORY_LABELS[entry.category] || entry.category;
        return `<li>可购买「${entry.name}」(${categoryLabel} T${entry.tier})，消耗 ${entry.nextCost} 点</li>`;
      }).join("")
      : (hints.nearestShortfall
        ? `<li>还差 ${hints.nearestShortfall.deficit} 点可购买「${hints.nearestShortfall.name}」</li>`
        : "<li>当前暂无可购买节点，可继续完成任务累积局外天赋点。</li>");
    runSettlementMetaFeedbackEl.innerHTML = `
      <div class="run-settlement-meta-title">局外成长</div>
      <div>本局获得局外天赋点：<strong>+${hints.pointsGained}</strong></div>
      <div>当前可用局外天赋点：<strong>${hints.totalPoints}</strong></div>
      <div class="run-settlement-meta-subtitle">可购买建议</div>
      <ul class="run-settlement-meta-list">${recommendationHtml}</ul>
      <div class="run-settlement-meta-subtitle">下一局协议建议</div>
      <div class="run-settlement-meta-advice">${hints.protocolAdvice.message}</div>
      <div class="run-settlement-meta-next">下一步：打开局外天赋，购买能让下一局更稳定的节点；或开始新局前选择开局协议。</div>
    `;
  }
}

function updateQuickRestartVisibility() {
  if (!quickRestartBtnEl) return;
  quickRestartBtnEl.classList.toggle("hidden", !state.run.guardianDefeated);
}

function endRunSettlement() {
  const { bonus } = getRunSettlementData();
  if (!state.run.settlementBonusGranted) {
    grantMetaPoints(bonus);
    state.run.settlementBonus = bonus;
    state.run.settlementBonusGranted = true;
  }
  closePanelsForSettlement();
  resetObjectiveChoiceState();
  state.run.settlementMode = "victory";
  state.run.settlementShown = true;
  updateRunSettlementPanel();
  runSettlementPanelEl?.classList.remove("hidden");
  syncMainPanelUiState();
  updateQuickRestartVisibility();
  state.paused = true;
  document.getElementById("pauseBtn").textContent = "继续";
  updateHud();
}

function closeSettlementForExplore() {
  state.run.settlementShown = false;
  state.run.settlementMode = "victory";
  state.run.endgameExplore = true;
  runSettlementPanelEl?.classList.add("hidden");
  syncMainPanelUiState();
  updateObjectiveChoiceUi();
  state.paused = false;
  document.getElementById("pauseBtn").textContent = "暂停";
  state.spawnTimer = Math.min(state.spawnTimer, 6);
  showToast("已留在终结星系自由游玩：击毁敌人与采集资源会继续累积局外点数。");
  updateQuickRestartVisibility();
}

function updateObjectiveChoiceUi() {
  const panel = document.getElementById("objectiveChoicePanel");
  const awaitingBlock = document.getElementById("objectiveChoiceAwaiting");
  const deferredBlock = document.getElementById("objectiveDeferredActions");
  if (!panel) return;

  if (state.run.endgame || state.run.objective?.type === "guardian" || state.run.settlementShown) {
    panel.classList.add("hidden");
    return;
  }

  if (getActiveMainPanel() !== null) {
    panel.classList.add("hidden");
    return;
  }

  const complete = isObjectiveComplete();
  const awaiting = state.run.awaitingObjectiveChoice;
  const dismissed = state.run.objectiveChoiceDismissed;

  if (!complete) {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");
  if (awaiting) {
    awaitingBlock?.classList.remove("hidden");
    deferredBlock?.classList.add("hidden");
  } else if (dismissed) {
    awaitingBlock?.classList.add("hidden");
    deferredBlock?.classList.remove("hidden");
  } else {
    panel.classList.add("hidden");
  }
}

const MORE_STATUS_DESKTOP_MQ = "(min-width: 761px)";

function syncMoreStatusPanel() {
  const panel = document.getElementById("moreStatusPanel");
  if (!panel) return;
  panel.open = window.matchMedia(MORE_STATUS_DESKTOP_MQ).matches;
}

function initGame() {
  ensureRunRuntimeState();
  applyMetaStartProtocol();
  initStation();
  initWorld();
  createObjective();
  // v0.8.0：首关初始化时同步滚池（与 nextLevel / __gameTest.resetRun 行为一致）
  seedEncountersForLevel(state.run.level);
  createBuildUi();
  ensureResearchTreeUi();
  ensureMetaPanelUi();
  bindGalaxyMapPanelEvents();
  bindInput();
  bindPlaytestErrorListeners();
  syncMoreStatusPanel();
  window.addEventListener("resize", syncMoreStatusPanel);
  updateControlModeUi();
  updateHud();
  syncMainPanelUiState();
  initReleaseCandidatePlaytestEntry();
  showToast("核心已上线。默认「屏幕方向」移动（W=上）；展开右侧「更多状态」可切换移动模式。鼠标指向决定朝向。");
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
    const bg = state.galaxy?.bgColor;
    if (bg && bg.length >= 3) {
      gl.clearColor(bg[0], bg[1], bg[2], bg[3] ?? 1);
    } else {
      gl.clearColor(0.012, 0.022, 0.048, 1);
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  worldToClip(p) {
    const camX = state.camera.x + (state.camera.shakeX || 0);
    const camY = state.camera.y + (state.camera.shakeY || 0);
    const sx = (p.x - camX) * state.camera.zoom + this.width / 2;
    const sy = (p.y - camY) * state.camera.zoom + this.height / 2;
    return {
      x: sx / this.width * 2 - 1,
      y: 1 - sy / this.height * 2
    };
  }

  screenToWorld(p) {
    const camX = state.camera.x + (state.camera.shakeX || 0);
    const camY = state.camera.y + (state.camera.shakeY || 0);
    return {
      x: (p.x * this.dpr - this.width / 2) / state.camera.zoom + camX,
      y: (p.y * this.dpr - this.height / 2) / state.camera.zoom + camY
    };
  }

  worldToScreen(world) {
    const camX = state.camera.x + (state.camera.shakeX || 0);
    const camY = state.camera.y + (state.camera.shakeY || 0);
    const deviceX = (world.x - camX) * state.camera.zoom + this.width / 2;
    const deviceY = (world.y - camY) * state.camera.zoom + this.height / 2;
    return {
      deviceX,
      deviceY,
      clientX: deviceX / this.dpr,
      clientY: deviceY / this.dpr
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

function getFacilityRoleTag(facility) {
  return FACILITY_ROLE[facility] || "support";
}

function countFacilitiesByRole() {
  const counts = {};
  for (const cell of state.station.cells.values()) {
    if (cell.detached) continue;
    const role = getFacilityRoleTag(cell.facility);
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
}

function countActiveFacilitiesByRole() {
  const counts = {};
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.active) continue;
    const role = getFacilityRoleTag(cell.facility);
    counts[role] = (counts[role] || 0) + 1;
  }
  return counts;
}

function getFacilityPowerImpact(facilityId) {
  const def = TYPES[facilityId] || {};
  const powerOut = def.powerOut || def.baseStats?.powerOut || 0;
  const bonusPowerOut = def.baseStats?.bonusPowerOut || 0;
  const powerUse = def.powerUse || 0;
  return {
    powerOut,
    bonusPowerOut,
    powerUse,
    netDelta: powerOut + bonusPowerOut - powerUse
  };
}

function getBuildCostBase(facility) {
  const base = TYPES[facility]?.cost || {};
  return Object.fromEntries(Object.entries(base));
}

function getBuildPaletteMissingResources(cost) {
  return Object.entries(cost)
    .filter(([name, value]) => (state.resources[name] || 0) < value)
    .map(([name, value]) => ({
      name,
      need: value,
      have: Math.floor(state.resources[name] || 0),
      gap: value - Math.floor(state.resources[name] || 0)
    }));
}

function formatMissingResourceGaps(missingResources = []) {
  return missingResources
    .filter((item) => item && item.gap > 0)
    .map((item) => `${shortResource(item.name)} ${item.gap}`)
    .join("、");
}

function getBuildPaletteRecommendation(facilityId, role, count, roleCounts, activeRoleCounts, powerHeadroom, powerUse) {
  if (role === "mining" && !(roleCounts.mining > 0)) {
    return { priority: "high", reasonKey: "core_capability_missing" };
  }
  if (role === "power" && !(roleCounts.power > 0)) {
    return { priority: "high", reasonKey: "core_capability_missing" };
  }
  if (role === "thrust" && !(roleCounts.thrust > 0)) {
    return { priority: "medium", reasonKey: "core_capability_missing" };
  }
  if (role === "weapon" && !(roleCounts.weapon > 0)) {
    return { priority: "medium", reasonKey: "core_capability_missing" };
  }
  if (role === "defense" && !(roleCounts.defense > 0) && roleCounts.weapon > 0) {
    return { priority: "medium", reasonKey: "core_capability_missing" };
  }
  if (role === "repair" && !(roleCounts.repair > 0)) {
    return { priority: "neutral", reasonKey: "core_capability_missing" };
  }
  if ((roleCounts[role] || 0) > 0 && !(activeRoleCounts[role] > 0) && powerUse > 0) {
    return { priority: "medium", reasonKey: "capability_limited" };
  }
  if (powerHeadroom < powerUse && role !== "power") {
    return { priority: "medium", reasonKey: "power_pressure" };
  }
  if (powerHeadroom < 5 && role === "power") {
    return { priority: "high", reasonKey: "power_pressure" };
  }
  if (count >= 4) {
    return { priority: "neutral", reasonKey: "redundant_high_count" };
  }
  return { priority: "neutral", reasonKey: null };
}

function getBuildPaletteStatusText(entry) {
  if (!entry.affordable && entry.missingResources.length) {
    const primary = entry.missingResources.reduce((best, item) => (item.gap > best.gap ? item : best));
    return `缺${shortResource(primary.name)} ${primary.gap}`;
  }
  if (entry.powerRiskAfterBuild) return "建后可能断电";
  if (entry.powerTightAfterBuild) return "建后电力紧张";
  return "可建造";
}

function getBuildPaletteTipText(entry) {
  if (!entry.affordable && entry.missingResources.length) {
    const primary = entry.missingResources.reduce((best, item) => (item.gap > best.gap ? item : best));
    return `警告：当前这座缺${shortResource(primary.name)} ${primary.gap}，暂时不能建造。`;
  }
  if (entry.powerRiskAfterBuild) {
    return "警告：建造后电力余量为负，关键设施可能断电。";
  }
  if (entry.powerTightAfterBuild) {
    return "推荐：建造后电力偏紧，留意供电。";
  }
  const reasonKey = entry.recommendation?.reasonKey;
  if (!reasonKey) return "";
  if (reasonKey === "core_capability_missing") {
    return BUILD_PALETTE_TIP_COPY.core_capability_missing[entry.role] || "";
  }
  return BUILD_PALETTE_TIP_COPY[reasonKey] || "";
}

function formatBuildPaletteCostSummary(cost, baseCost) {
  const adjusted = Object.keys({ ...cost, ...baseCost }).some((name) => cost[name] !== baseCost[name]);
  if (!adjusted) return formatCost(cost);
  const parts = Object.entries(cost).map(([name, value]) => {
    const base = baseCost[name];
    if (base != null && base !== value) {
      return `${shortResource(name)} ${value}（${base}）`;
    }
    return `${shortResource(name)} ${value}`;
  });
  return parts.length ? parts.join(" / ") : "免费";
}

function formatBuildPalettePowerText(powerImpact) {
  const { powerOut, bonusPowerOut, powerUse, netDelta } = powerImpact;
  if (netDelta === 0 && powerUse === 0 && powerOut === 0 && bonusPowerOut === 0) return "电力 0";
  const parts = [];
  if (powerOut > 0) parts.push(`产电 +${powerOut}`);
  if (bonusPowerOut > 0) parts.push(`副产电 +${bonusPowerOut}`);
  if (powerUse > 0) parts.push(`耗电 ${powerUse}`);
  if (parts.length === 1 && netDelta !== 0) {
    return netDelta > 0 ? `电力 +${netDelta}` : `电力 ${netDelta}`;
  }
  return parts.join(" · ");
}

function getBuildPaletteDiagnostics() {
  const powerHeadroom = state.power.available - state.power.used;
  const roleCounts = countFacilitiesByRole();
  const activeRoleCounts = countActiveFacilitiesByRole();
  const overallPowerTight = state.power.used >= state.power.available - 0.25 && state.power.available > 0;

  const facilities = FACILITY_ORDER.map((id) => {
    const def = TYPES[id];
    const cost = getBuildCost(id);
    const baseCost = getBuildCostBase(id);
    const missingResources = getBuildPaletteMissingResources(cost);
    const affordable = missingResources.length === 0;
    const powerImpact = getFacilityPowerImpact(id);
    const count = countFacility(id);
    const role = getFacilityRoleTag(id);
    const afterMargin = powerHeadroom + powerImpact.netDelta;
    const powerRiskAfterBuild = affordable && afterMargin < 0;
    const powerTightAfterBuild = affordable && !powerRiskAfterBuild && afterMargin < 1 && powerImpact.netDelta < 0;
    const gapSum = missingResources.reduce((sum, item) => sum + item.gap, 0);
    const recommendation = getBuildPaletteRecommendation(
      id,
      role,
      count,
      roleCounts,
      activeRoleCounts,
      powerHeadroom,
      powerImpact.powerUse
    );
    if (!affordable && gapSum > 0 && gapSum < 10 && !recommendation.reasonKey) {
      recommendation.reasonKey = "resource_pressure";
      recommendation.priority = recommendation.priority === "neutral" ? "medium" : recommendation.priority;
    }

    const entry = {
      id,
      name: def.name,
      role,
      roleLabel: FACILITY_ROLE_LABEL[role] || role,
      purpose: FACILITY_SHORT_PURPOSE[id] || def.desc,
      cost,
      baseCost,
      costAdjusted: Object.keys({ ...cost, ...baseCost }).some((name) => cost[name] !== baseCost[name]),
      affordable,
      missingResources,
      powerImpact,
      powerRiskAfterBuild,
      powerTightAfterBuild,
      count,
      countLimitHint: null,
      recommendation,
      flags: {
        firstOfKind: count === 0,
        unaffordableButCloseToAffordable: !affordable && gapSum > 0 && gapSum < 10
      },
      statusText: "",
      tipText: ""
    };
    entry.statusText = getBuildPaletteStatusText(entry);
    entry.tipText = getBuildPaletteTipText(entry);
    return entry;
  });

  return {
    generatedAt: state.time,
    facilities,
    summary: {
      affordableCount: facilities.filter((entry) => entry.affordable).length,
      totalCount: facilities.length,
      powerHeadroom,
      overallPowerTight
    }
  };
}

function getConnectedComponentStats(cell) {
  if (!cell || cell.detached) {
    return { connected: false, fragmentSize: 0, isCoreFragment: false };
  }
  const startKey = key(cell.x, cell.y);
  const visited = new Set();
  const queue = [startKey];
  let isCoreFragment = false;
  while (queue.length) {
    const currentKey = queue.pop();
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    const current = state.station.cells.get(currentKey);
    if (!current || current.detached) continue;
    if (current.facility === "core") isCoreFragment = true;
    const [cx, cy] = currentKey.split(",").map(Number);
    for (const neighbor of neighbors(cx, cy)) {
      const neighborCell = state.station.cells.get(key(neighbor.x, neighbor.y));
      if (neighborCell && !neighborCell.detached) {
        queue.push(key(neighbor.x, neighbor.y));
      }
    }
  }
  return {
    connected: true,
    fragmentSize: visited.size,
    isCoreFragment
  };
}

function getSelectedCellPowerImpact(cell) {
  const def = TYPES[cell.facility] || {};
  const powerOut = def.powerOut || def.baseStats?.powerOut || 0;
  const bonusPowerOut = def.baseStats?.bonusPowerOut || 0;
  const powerUse = def.powerUse || 0;
  return {
    powerOut,
    bonusPowerOut,
    powerUse,
    netDelta: powerOut + bonusPowerOut - powerUse
  };
}

function getSelectedCellRangeDiagnostics(cell) {
  if (!cell || cell.detached) return null;
  const facility = cell.facility;
  if (facility === "mining") {
    const target = getMiningCellTarget(cell);
    const nearest = getNearestResourceBody(cellWorldPosition(cell));
    const nearestHint = nearest
      ? {
          bodyName: nearest.body.name,
          resource: nearest.body.resource,
          distance: nearest.distance,
          range: nearest.range,
          gap: Math.max(0, Math.ceil(nearest.distance - nearest.range)),
          inRange: nearest.distance <= nearest.range
        }
      : null;
    return {
      kind: "mining",
      nominalRange: nearest?.range || MINING_RANGE_OFFSET,
      currentTarget: target
        ? {
            bodyName: target.body.name,
            resource: target.body.resource
          }
        : null,
      nearestHint
    };
  }
  if (facility === "turret" || facility === "missile") {
    return {
      kind: "weapon",
      nominalRange: getCellStat(cell, "range"),
      currentTarget: null,
      nearestHint: null
    };
  }
  if (facility === "shield") {
    return {
      kind: "shield",
      nominalRange: getCellStat(cell, "range"),
      currentTarget: null,
      nearestHint: null
    };
  }
  if (facility === "repair") {
    return {
      kind: "repair",
      nominalRange: null,
      currentTarget: null,
      nearestHint: null
    };
  }
  return null;
}

function getSelectedCellWeaponDiagnostics(cell) {
  if (!cell || (cell.facility !== "turret" && cell.facility !== "missile")) return null;
  const origin = cellWorldPosition(cell);
  const range = getCellStat(cell, "range");
  const rangeText = `约 ${Math.floor(range)}`;
  if (cell.detached || !cell.enabled) {
    return { losAvailable: null, rangeText, statusKey: cell.detached ? "detached" : "disabled_manual" };
  }
  if (!cell.active) {
    return { losAvailable: null, rangeText, statusKey: "weapon_no_power" };
  }
  const enemy = selectTargetReadOnly(origin, range);
  if (!enemy) {
    return { losAvailable: null, rangeText, statusKey: "weapon_no_target" };
  }
  const losAvailable = hasLineOfSight(origin, enemy);
  return {
    losAvailable,
    rangeText,
    statusKey: losAvailable ? "weapon_ready" : "weapon_los_blocked",
    targetDistance: Math.floor(dist(origin, enemy))
  };
}

function getSelectedCellShieldDiagnostics(cell) {
  if (!cell || cell.facility !== "shield") return null;
  let coverageStatus = "unknown";
  if (cell.detached) coverageStatus = "inactive";
  else if (!cell.enabled) coverageStatus = "inactive";
  else if (!cell.active) coverageStatus = "inactive";
  else if ((cell.shield || 0) <= 0) coverageStatus = "recovering";
  else coverageStatus = "active";
  return {
    coverageStatus,
    shield: Math.floor(cell.shield || 0),
    maxShield: Math.floor(cell.maxShield || getCellStat(cell, "maxShield")),
    range: Math.floor(getCellStat(cell, "range"))
  };
}

function getSelectedCellRepairDiagnostics(cell) {
  if (!cell || cell.facility !== "repair") return null;
  let coverageStatus = "unknown";
  if (cell.detached || !cell.enabled || !cell.active) {
    coverageStatus = "inactive";
  } else {
    const hasDamaged = [...state.station.cells.values()].some(
      (entry) => !entry.detached && (entry.hp < entry.maxHp || entry.frameHp < TYPES.frame.baseStats.maxFrameHp)
    );
    coverageStatus = hasDamaged ? "active" : "idle";
  }
  return {
    coverageStatus,
    repairRate: getCellStat(cell, "repairRate"),
    frameRepairRate: getCellStat(cell, "frameRepairRate"),
    cooldown: getCellStat(cell, "cooldown")
  };
}

function collectSelectedCellReasonKeys(cell, status, range, weapon, shield, repair) {
  const keys = [];
  if (cell.detached) keys.push("detached");
  if (!cell.enabled && cell.facility !== "core") keys.push("disabled_manual");
  if (status.powerStarved) keys.push("power_starved");
  if (status.nozzleBlocked) keys.push("nozzle_blocked");
  if (range?.kind === "mining") {
    if (range.currentTarget) keys.push("harvesting");
    else if (range.nearestHint && !range.nearestHint.inRange) keys.push("out_of_range");
    else if (!range.nearestHint) keys.push("target_depleted");
  }
  if (weapon?.statusKey === "weapon_no_power") keys.push("power_starved");
  if (weapon?.statusKey === "weapon_los_blocked") keys.push("weapon_los_blocked");
  if (shield?.coverageStatus === "inactive" && (TYPES[cell.facility]?.powerUse || 0) > 0 && cell.enabled) {
    keys.push("power_starved");
  }
  if (repair?.coverageStatus === "inactive" && cell.enabled) keys.push("power_starved");
  return keys;
}

function getSelectedCellDiagnostics(cell) {
  if (!cell) return null;
  const facility = cell.facility;
  const def = TYPES[facility] || {};
  const powerImpact = getSelectedCellPowerImpact(cell);
  const status = {
    enabled: cell.enabled,
    active: cell.active,
    detached: cell.detached,
    powerStarved: !cell.detached && cell.enabled && !cell.active && (def.powerUse || 0) > 0,
    nozzleBlocked: cell.facility === "thruster" && !cell.detached && cell.enabled && isThrusterNozzleBlocked(cell)
  };
  const connection = getConnectedComponentStats(cell);
  const range = getSelectedCellRangeDiagnostics(cell);
  const weapon = getSelectedCellWeaponDiagnostics(cell);
  const shield = getSelectedCellShieldDiagnostics(cell);
  const repair = getSelectedCellRepairDiagnostics(cell);
  const reasonKeys = collectSelectedCellReasonKeys(cell, status, range, weapon, shield, repair);
  return {
    cellKey: key(cell.x, cell.y),
    facility,
    facilityName: facility === "core" ? "核心" : def.name,
    role: getFacilityRoleTag(facility),
    status,
    connection,
    power: powerImpact,
    range,
    weapon,
    shield,
    repair,
    hp: {
      current: cell.hp,
      max: cell.maxHp
    },
    reasonKeys
  };
}

function evaluatePlacementGrid(facility, gridX, gridY) {
  const gridKey = key(gridX, gridY);
  const occupied = state.station.cells.has(gridKey);
  const hasNeighbor = hasConnectedNeighbor(gridX, gridY);
  let reasonKey = null;
  if (occupied) reasonKey = "occupied";
  else if (!hasNeighbor) reasonKey = "no_neighbor";
  return {
    valid: !occupied && hasNeighbor,
    reasonKey,
    connectedToCore: hasNeighbor
  };
}

function getPlacementDiagnostics(facility, gridX, gridY) {
  const def = TYPES[facility] || {};
  const cost = getBuildCost(facility);
  const missingResources = getBuildPaletteMissingResources(cost);
  const affordable = missingResources.length === 0;
  const placement = evaluatePlacementGrid(facility, gridX, gridY);
  const powerHeadroomBefore = state.power.available - state.power.used;
  const powerImpact = getFacilityPowerImpact(facility);
  const marginAfter = powerHeadroomBefore + powerImpact.netDelta;
  const powerForecast = {
    powerHeadroomBefore,
    marginAfter,
    willCausePowerPressure: affordable && marginAfter < 1 && powerImpact.netDelta < 0,
    willCausePowerNegative: affordable && marginAfter < 0
  };
  let rangeHint = null;
  if (facility === "mining") {
    const worldPos = cellWorldPosition({ x: gridX, y: gridY, detached: false });
    const nearest = getNearestResourceBody(worldPos);
    if (nearest) {
      rangeHint = {
        kind: "mining",
        nearestBody: nearest.body.name,
        resource: nearest.body.resource,
        distance: nearest.distance,
        range: nearest.range,
        gap: Math.max(0, Math.ceil(nearest.distance - nearest.range)),
        inRange: nearest.distance <= nearest.range
      };
    } else {
      rangeHint = {
        kind: "mining",
        nearestBody: null,
        resource: null,
        distance: null,
        range: MINING_RANGE_OFFSET,
        gap: null,
        inRange: false
      };
    }
  }
  const warnings = [];
  if (!placement.valid) warnings.push("placement_invalid");
  if (!affordable) warnings.push("resource_low");
  if (rangeHint && rangeHint.kind === "mining" && !rangeHint.inRange) warnings.push("out_of_mining_range");
  if (powerForecast.willCausePowerNegative) warnings.push("power_negative");
  else if (powerForecast.willCausePowerPressure) warnings.push("power_pressure");
  if (facility === "turret" || facility === "missile") warnings.push("weapon_tip");
  if (facility === "shield") warnings.push("shield_tip");
  if (facility === "repair") warnings.push("repair_tip");
  if (facility === "power") warnings.push("power_tip");
  return {
    facility,
    gridKey: key(gridX, gridY),
    gridX,
    gridY,
    affordability: {
      affordable,
      missingResources
    },
    placement,
    powerForecast,
    rangeHint,
    warnings
  };
}

function mapHealthStatusToSeverity(status) {
  if (status === "bad") return "critical";
  if (status === "warn") return "warning";
  return "ok";
}

function mapDesignSeverityToAlertLevel(severity) {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warn";
  return "good";
}

function deepFreezeForDiagnostics(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  if (Array.isArray(value)) {
    for (const entry of value) deepFreezeForDiagnostics(entry);
  } else {
    for (const entry of Object.values(value)) deepFreezeForDiagnostics(entry);
  }
  return value;
}

function getDesignIssuePriority(issueKey) {
  return DESIGN_ISSUE_PRIORITY[issueKey] || 99;
}

function createStationDesignHealthEntry(key, status, summary, detail, reasonKey, payload = null) {
  const entry = {
    key,
    status,
    severity: mapHealthStatusToSeverity(status),
    label: STATION_DESIGN_HEALTH_LABELS[key] || key,
    summary,
    detail,
    reasonKey
  };
  if (payload && typeof payload === "object") Object.assign(entry, payload);
  return entry;
}

function createDesignIssue(key, severity, reasonKey, payload = null) {
  return {
    key,
    severity,
    reasonKey: reasonKey || key,
    priority: getDesignIssuePriority(key),
    message: DESIGN_ISSUE_COPY[key] || reasonKey || key,
    payload: payload && typeof payload === "object" ? payload : {}
  };
}

function computeResourceReachabilitySnapshot(miningStatus = getMiningStationStatus()) {
  const miners = miningStatus.miners.map((cell) => {
    const position = cellWorldPosition(cell);
    const target = getMiningCellTarget(cell);
    const nearest = getNearestResourceBody(position);
    const powerStarved = cell.enabled && !cell.active && (TYPES[cell.facility]?.powerUse || 0) > 0;
    let reasonKey = "harvesting";
    if (!cell.enabled) reasonKey = "disabled_manual";
    else if (powerStarved) reasonKey = "power_starved";
    else if (target) reasonKey = "harvesting";
    else if (nearest && nearest.distance > nearest.range) reasonKey = "out_of_range";
    else if (!nearest) reasonKey = "no_resource_body";
    else reasonKey = "target_depleted";
    return {
      cellKey: key(cell.x, cell.y),
      facility: cell.facility,
      enabled: !!cell.enabled,
      active: !!cell.active,
      detached: !!cell.detached,
      target: target
        ? {
            bodyName: target.body.name,
            resource: target.body.resource,
            distance: target.distance,
            range: target.range
          }
        : null,
      nearest: nearest
        ? {
            bodyName: nearest.body.name,
            resource: nearest.body.resource,
            distance: nearest.distance,
            range: nearest.range,
            gap: Math.max(0, Math.ceil(nearest.distance - nearest.range)),
            inRange: nearest.distance <= nearest.range
          }
        : null,
      reasonKey
    };
  });
  const minerCount = miningStatus.miners.length;
  const activeCount = miningStatus.activeMiners.length;
  const harvestingCount = miningStatus.harvesting.length;
  const outOfRangeCount = miners.filter((entry) => entry.reasonKey === "out_of_range").length;
  const inactiveCount = Math.max(0, minerCount - harvestingCount);
  const inactiveRatio = minerCount > 0 ? inactiveCount / minerCount : 1;
  const allOutOfRange = minerCount > 0 && outOfRangeCount === minerCount;
  let severity = "ok";
  let reasonKey = "mining_covered";
  if (minerCount === 0) {
    severity = "critical";
    reasonKey = "no_mining_station";
  } else if (harvestingCount === 0) {
    severity = "critical";
    reasonKey = allOutOfRange ? "all_miners_out_of_range" : "all_miners_not_harvesting";
  } else if (inactiveRatio >= 0.5) {
    severity = "warning";
    reasonKey = "mining_partial_outage";
  }
  return {
    generatedAt: state.time,
    miners,
    overall: {
      minerCount,
      activeCount,
      harvestingCount,
      outOfRangeCount,
      hasMiner: minerCount > 0,
      anyHarvesting: harvestingCount > 0,
      allOutOfRange,
      inactiveRatio,
      severity,
      reasonKey
    }
  };
}

function getConnectedStationGridKeysForDiagnostics() {
  const visited = new Set();
  const queue = [key(0, 0)];
  while (queue.length) {
    const currentKey = queue.shift();
    if (visited.has(currentKey)) continue;
    const cell = state.station.cells.get(currentKey);
    if (!cell || cell.detached) continue;
    visited.add(currentKey);
    const parsed = parseKey(currentKey);
    for (const n of neighbors(parsed.x, parsed.y)) {
      const nextKey = key(n.x, n.y);
      if (state.station.cells.has(nextKey) && !visited.has(nextKey)) queue.push(nextKey);
    }
  }
  return visited;
}

function computeHypotheticalMiningRangeAtGrid(gridX, gridY, targetBody = null) {
  const worldPos = cellWorldPosition({ x: gridX, y: gridY, detached: false });
  let body = targetBody;
  let distance;
  let range;
  if (body) {
    distance = dist(worldPos, body);
    range = getMiningRange(body);
  } else {
    const nearest = getNearestResourceBody(worldPos);
    if (!nearest) return null;
    body = nearest.body;
    distance = nearest.distance;
    range = nearest.range;
  }
  return {
    bodyName: body.name,
    resource: body.resource,
    bodyX: body.x,
    bodyY: body.y,
    bodyR: body.r,
    distance,
    range,
    gap: Math.max(0, Math.ceil(distance - range)),
    inRange: distance <= range
  };
}

function buildFrameExpansionPathSteps(parent, targetKey) {
  const steps = [];
  let current = targetKey;
  while (parent.has(current)) {
    const parsed = parseKey(current);
    steps.unshift({
      gridKey: current,
      gridX: parsed.x,
      gridY: parsed.y,
      action: "build_frame"
    });
    current = parent.get(current);
  }
  return steps;
}

function findFrameExpansionPathToGrid(targetX, targetY) {
  const targetKey = key(targetX, targetY);
  const targetCell = state.station.cells.get(targetKey);
  if (targetCell && !targetCell.detached) {
    if (targetCell.facility === "mining") {
      return { reachable: true, steps: [], reasonKey: "already_mining", frameSteps: 0 };
    }
    if (targetCell.facility === "frame") {
      return { reachable: true, steps: [], reasonKey: "upgrade_frame_to_mining", frameSteps: 0 };
    }
    return {
      reachable: false,
      steps: [],
      reasonKey: "occupied_by_facility",
      frameSteps: null,
      blockingFacility: targetCell.facility
    };
  }

  const connectedKeys = getConnectedStationGridKeysForDiagnostics();
  const visited = new Set(connectedKeys);
  const parent = new Map();
  const queue = [];

  for (const cellKey of connectedKeys) {
    const parsed = parseKey(cellKey);
    for (const n of neighbors(parsed.x, parsed.y)) {
      const nKey = key(n.x, n.y);
      if (visited.has(nKey)) continue;
      const nCell = state.station.cells.get(nKey);
      if (nCell && !nCell.detached) continue;
      visited.add(nKey);
      parent.set(nKey, cellKey);
      queue.push(nKey);
      if (nKey === targetKey) {
        const steps = buildFrameExpansionPathSteps(parent, targetKey);
        return {
          reachable: true,
          steps,
          reasonKey: steps.length === 0 ? "adjacent_to_connected" : "frame_chain",
          frameSteps: steps.length
        };
      }
    }
  }

  while (queue.length) {
    const currentKey = queue.shift();
    const parsed = parseKey(currentKey);
    for (const n of neighbors(parsed.x, parsed.y)) {
      const nKey = key(n.x, n.y);
      if (visited.has(nKey)) continue;
      const nCell = state.station.cells.get(nKey);
      if (nCell && !nCell.detached) continue;
      visited.add(nKey);
      parent.set(nKey, currentKey);
      queue.push(nKey);
      if (nKey === targetKey) {
        const steps = buildFrameExpansionPathSteps(parent, targetKey);
        return {
          reachable: true,
          steps,
          reasonKey: steps.length === 0 ? "adjacent_to_connected" : "frame_chain",
          frameSteps: steps.length
        };
      }
    }
  }

  return { reachable: false, steps: [], reasonKey: "no_frame_path", frameSteps: null };
}

function buildMiningCoverageCandidateSnapshot(gridX, gridY, targetBody = null) {
  const gridKey = key(gridX, gridY);
  const cell = state.station.cells.get(gridKey);
  const framePlacement = evaluatePlacementGrid("frame", gridX, gridY);
  const miningPlacement = evaluatePlacementGrid("mining", gridX, gridY);
  const miningRange = computeHypotheticalMiningRangeAtGrid(gridX, gridY, targetBody);
  const expansionPath = findFrameExpansionPathToGrid(gridX, gridY);

  let cellState = "empty";
  if (cell && !cell.detached) cellState = cell.facility;

  let expandable = false;
  let miningAction = null;
  if (cellState === "empty") {
    expandable = framePlacement.valid || expansionPath.reachable;
    if (miningRange?.inRange && expansionPath.reachable) {
      miningAction = expansionPath.frameSteps === 0 ? "build_mining_on_frame" : "expand_frame_then_mining";
    }
  } else if (cellState === "frame") {
    expandable = miningPlacement.valid;
    if (miningPlacement.valid && miningRange?.inRange) miningAction = "upgrade_to_mining";
  } else if (cellState === "mining") {
    miningAction = "already_mining";
  }

  const canReachInRange = !!(
    miningRange?.inRange
    && (miningAction === "already_mining" || miningAction === "upgrade_to_mining" || expansionPath.reachable)
  );

  return {
    gridKey,
    gridX,
    gridY,
    cellState,
    occupied: !!(cell && !cell.detached),
    expandable,
    framePlacement,
    miningPlacement,
    miningRange,
    expansionPath,
    miningAction,
    canReachInRange
  };
}

function summarizeMiningCoverageFailure(reachability, miningStatus, candidates, bestCandidate) {
  const overall = reachability.overall;
  if (overall.harvestingCount > 0) {
    return {
      reasonKey: "harvesting",
      summary: "采矿正常",
      blocking: false,
      nextAction: null
    };
  }
  if (overall.minerCount === 0) {
    return {
      reasonKey: "no_mining_station",
      summary: "尚未建造采矿站",
      blocking: true,
      nextAction: "build_mining_on_connected_frame"
    };
  }
  if (reachability.miners.length > 0 && reachability.miners.every((entry) => entry.reasonKey === "disabled_manual")) {
    return {
      reasonKey: "disabled_manual",
      summary: "采矿站已全部手动关闭",
      blocking: true,
      nextAction: "enable_mining_facility"
    };
  }
  if (miningStatus.inactivePower.length > 0 && miningStatus.activeMiners.length === 0) {
    return {
      reasonKey: "power_starved",
      summary: "采矿站因电力不足未运作",
      blocking: true,
      nextAction: "add_power_or_reduce_load"
    };
  }
  if (bestCandidate?.canReachInRange) {
    const frameSteps = bestCandidate.expansionPath?.frameSteps ?? 0;
    return {
      reasonKey: "needs_expansion",
      summary: frameSteps > 0
        ? `当前矿站未覆盖资源外环；可先铺 ${frameSteps} 步框架到 ${bestCandidate.gridKey} 再建采矿站`
        : `当前矿站未覆盖资源外环；可在 ${bestCandidate.gridKey} 扩建或升级采矿站`,
      blocking: true,
      nextAction: frameSteps > 0 ? "expand_frame_chain" : "place_or_upgrade_mining",
      targetGridKey: bestCandidate.gridKey
    };
  }
  const inRangeBlocked = candidates.filter((entry) => entry.miningRange?.inRange && !entry.canReachInRange);
  if (inRangeBlocked.length > 0) {
    return {
      reasonKey: "in_range_blocked",
      summary: "附近存在入圈格，但扩建路径被占用或不可达",
      blocking: true,
      nextAction: "clear_path_or_reselect_site",
      blockedCandidates: inRangeBlocked.slice(0, 3).map((entry) => entry.gridKey)
    };
  }
  if (candidates.length === 0) {
    const nearest = getNearestResourceBody();
    const gap = nearest ? Math.max(0, Math.ceil(nearest.distance - nearest.range)) : null;
    return {
      reasonKey: "no_in_range_candidate",
      summary: gap != null
        ? `当前结构附近无入圈候选格；最近资源还差 ${gap}，需移动工站或重新选址`
        : "当前星系暂无可用资源天体",
      blocking: true,
      nextAction: "relocate_station_or_move_closer",
      gap
    };
  }
  return {
    reasonKey: overall.reasonKey || "all_miners_out_of_range",
    summary: "采矿站未覆盖资源外环",
    blocking: true,
    nextAction: "move_closer_or_expand"
  };
}

function computeMiningExpansionAffordability(bestCandidate, suggestedExpansionPath) {
  const frameCost = getBuildCost("frame");
  const miningCost = getBuildCost("mining");
  const currentResources = {
    metal: Math.floor(state.resources.metal || 0),
    ore: Math.floor(state.resources.ore || 0)
  };
  const base = {
    applicable: false,
    frameCount: 0,
    frameCostPerStep: { ...frameCost },
    miningCost: { ...miningCost },
    totalCost: {},
    metalNeeded: 0,
    oreNeeded: 0,
    affordable: false,
    pathAffordable: false,
    missingResources: [],
    currentResources,
    suggestMoveRebuild: false
  };
  if (!bestCandidate?.canReachInRange || !suggestedExpansionPath) {
    base.suggestMoveRebuild = true;
    return base;
  }

  const finalAction = suggestedExpansionPath.finalAction || bestCandidate.miningAction;
  if (finalAction === "already_mining") {
    return {
      ...base,
      applicable: true,
      affordable: true,
      pathAffordable: true
    };
  }

  const frameCount = suggestedExpansionPath.totalFrameSteps ?? bestCandidate.expansionPath?.frameSteps ?? 0;
  const totalCost = {};
  if (frameCount > 0) {
    for (const [name, value] of Object.entries(frameCost)) {
      totalCost[name] = (totalCost[name] || 0) + value * frameCount;
    }
  }
  if (finalAction !== "already_mining") {
    for (const [name, value] of Object.entries(miningCost)) {
      totalCost[name] = (totalCost[name] || 0) + value;
    }
  }

  const missingResources = getBuildPaletteMissingResources(totalCost);
  const affordable = missingResources.length === 0;
  return {
    applicable: true,
    frameCount,
    frameCostPerStep: frameCost,
    miningCost,
    totalCost,
    metalNeeded: totalCost.metal || 0,
    oreNeeded: totalCost.ore || 0,
    affordable,
    pathAffordable: affordable,
    missingResources,
    currentResources,
    suggestMoveRebuild: !affordable
  };
}

function computeMobileApproachHint(nearestResource, bestCandidate, affordability, failure) {
  const gap = nearestResource?.gap ?? null;
  const show = !!(
    failure?.nextAction === "relocate_station_or_move_closer"
    || !bestCandidate?.canReachInRange
    || (affordability?.applicable && !affordability.pathAffordable)
  );
  return {
    show,
    summary: gap != null
      ? `或：驾驶工站靠近资源外环（还差 ${gap}），再原地重建采矿站`
      : "或：驾驶工站靠近资源外环，再原地重建采矿站",
    gap,
    inRangeAfterMove: !!(nearestResource && nearestResource.inRange)
  };
}

function getMiningCoverageDiagnosticsForUi(options = {}) {
  const cacheKey = options.forceRefresh ? null : state.hud?.miningCoverageCache;
  if (cacheKey && state.time - cacheKey.at < 0.25) return cacheKey.data;
  const data = computeMiningCoverageDiagnostics(options);
  if (!state.hud) state.hud = {};
  state.hud.miningCoverageCache = { at: state.time, data };
  return data;
}

function buildMiningStatusChipHtml(status, reachability) {
  let chipClass = "mining-status-chip";
  let chipText = "未建采矿站";
  if (status.harvesting.length > 0) {
    chipClass += " good";
    chipText = `采矿中 ×${status.harvesting.length}`;
  } else if (status.miners.length === 0) {
    chipClass += " neutral";
    chipText = "未建采矿站";
  } else if (status.manualOff.length === status.miners.length) {
    chipClass += " muted";
    chipText = "采矿关闭";
  } else if (status.inactivePower.length > 0 && status.activeMiners.length === 0) {
    chipClass += " critical";
    chipText = "采矿缺电";
  } else {
    chipClass += " warn";
    chipText = "未覆盖外环";
  }
  const detail = reachability?.anyHarvesting
    ? ""
    : failureSafeSummary(reachability);
  return `<div class="resource-line mining-status-row"><span class="${chipClass}">${chipText}</span>${detail ? `<span class="mining-status-detail">${detail}</span>` : ""}</div>`;
}

function failureSafeSummary(reachability) {
  if (!reachability) return "";
  if (reachability.minerCount === 0) return "先在连接结构上建采矿站";
  if (reachability.allOutOfRange) return "需扩到外环内或移动工站";
  return "";
}

function buildMiningExpansionGuidanceHtml(diagnostics) {
  if (!diagnostics || diagnostics.reachability?.anyHarvesting) return "";
  const lines = [];
  const { bestCandidate, suggestedExpansionPath, affordability, failure, mobileApproachHint, nearestResource } = diagnostics;

  if (failure?.summary && failure.reasonKey !== "harvesting") {
    lines.push(`<div class="resource-line warn">${failure.summary}</div>`);
  }

  if (bestCandidate?.canReachInRange && suggestedExpansionPath) {
    const frameSteps = suggestedExpansionPath.totalFrameSteps ?? 0;
    const targetKey = bestCandidate.gridKey;
    const pathKeys = (suggestedExpansionPath.frameSteps || [])
      .map((step) => step.gridKey)
      .filter(Boolean);
    const pathSummary = pathKeys.length > 0
      ? `路径：${pathKeys.join(" → ")} → ${targetKey}`
      : frameSteps > 0
        ? `路径：先铺 ${frameSteps} 格框架 → ${targetKey} 建采矿站`
        : `覆盖候选：可在 ${targetKey} 入圈${bestCandidate.miningAction === "upgrade_to_mining" ? "，升级为采矿站即可" : "，直接建采矿站"}`;
    lines.push(`<div class="resource-line mining-path-chip">${pathSummary}</div>`);
  } else if (bestCandidate && !bestCandidate.canReachInRange) {
    lines.push(`<div class="resource-line warn">入圈格 ${bestCandidate.gridKey} 存在，但扩建路径被占用或不可达。</div>`);
  }

  if (affordability?.applicable) {
    const frameCount = affordability.frameCount || 0;
    const metalNeed = affordability.metalNeeded || 0;
    const oreNeed = affordability.oreNeeded || 0;
    const metalHave = affordability.currentResources?.metal ?? 0;
    const oreHave = affordability.currentResources?.ore ?? 0;
    const costParts = [];
    if (frameCount > 0) costParts.push(`${frameCount} 框架`);
    if (oreNeed > 0 || affordability.miningCost?.ore) costParts.push("1 采矿站");
    const costLabel = costParts.length ? costParts.join(" + ") : "采矿站";
    if (affordability.pathAffordable) {
      lines.push(
        `<div class="resource-line good mining-cost-chip">路径可支付：${costLabel} 需 金属 ${metalNeed} / 矿石 ${oreNeed}（当前 金属 ${metalHave} / 矿石 ${oreHave}）。</div>`
      );
    } else {
      const missingSummary = formatMissingResourceGaps(affordability.missingResources) || "资源不足";
      lines.push(
        `<div class="resource-line warn mining-cost-chip">建议路径可达，但当前付不起：${costLabel} 需 金属 ${metalNeed} / 矿石 ${oreNeed}（当前 金属 ${metalHave} / 矿石 ${oreHave}），还缺 ${missingSummary}。</div>`
      );
    }
  }

  if (mobileApproachHint?.show && (!affordability?.pathAffordable || !bestCandidate?.canReachInRange)) {
    lines.push(`<div class="resource-line mining-move-hint">${mobileApproachHint.summary}</div>`);
  }

  return lines.join("");
}

function computeMiningCoverageDiagnostics(options = {}) {
  const maxCandidates = Number.isFinite(options.maxCandidates) ? options.maxCandidates : 12;
  const searchPadding = Number.isFinite(options.searchPadding) ? options.searchPadding : 10;
  const targetBodyName = typeof options.targetBodyName === "string" ? options.targetBodyName : null;
  const minerGridKey = options.minerGridKey ?? options.gridKey ?? null;

  const miningStatus = getMiningStationStatus();
  const reachability = computeResourceReachabilitySnapshot(miningStatus);

  let targetBody = null;
  if (targetBodyName) {
    targetBody = getHarvestableBodies().find((body) => body.name === targetBodyName) || null;
  }

  let focusMiner = null;
  if (minerGridKey != null) {
    const parsed = typeof minerGridKey === "string" ? parseKey(minerGridKey) : minerGridKey;
    focusMiner = miningStatus.miners.find((cell) => cell.x === parsed.x && cell.y === parsed.y) || null;
  }

  const referencePos = focusMiner ? cellWorldPosition(focusMiner) : state.station.pos;
  const nearestFromReference = getNearestResourceBody(referencePos);
  if (!targetBody) targetBody = nearestFromReference?.body ?? null;

  const connectedKeys = getConnectedStationGridKeysForDiagnostics();
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;
  if (connectedKeys.size > 0) {
    minX = Infinity;
    maxX = -Infinity;
    minY = Infinity;
    maxY = -Infinity;
    for (const cellKey of connectedKeys) {
      const parsed = parseKey(cellKey);
      minX = Math.min(minX, parsed.x);
      maxX = Math.max(maxX, parsed.x);
      minY = Math.min(minY, parsed.y);
      maxY = Math.max(maxY, parsed.y);
    }
  }
  if (targetBody) {
    const bodyGrid = worldToGrid({ x: targetBody.x, y: targetBody.y });
    minX = Math.min(minX, bodyGrid.x);
    maxX = Math.max(maxX, bodyGrid.x);
    minY = Math.min(minY, bodyGrid.y);
    maxY = Math.max(maxY, bodyGrid.y);
  }
  minX -= searchPadding;
  maxX += searchPadding;
  minY -= searchPadding;
  maxY += searchPadding;

  const candidateMap = new Map();
  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      const miningRange = computeHypotheticalMiningRangeAtGrid(gx, gy, targetBody);
      if (!miningRange?.inRange) continue;
      const gridKey = key(gx, gy);
      if (!candidateMap.has(gridKey)) {
        candidateMap.set(gridKey, buildMiningCoverageCandidateSnapshot(gx, gy, targetBody));
      }
    }
  }

  let candidates = [...candidateMap.values()];
  candidates.sort((a, b) => {
    const reachA = a.canReachInRange ? 0 : 1;
    const reachB = b.canReachInRange ? 0 : 1;
    if (reachA !== reachB) return reachA - reachB;
    const stepsA = a.expansionPath?.frameSteps ?? 999;
    const stepsB = b.expansionPath?.frameSteps ?? 999;
    if (stepsA !== stepsB) return stepsA - stepsB;
    const gapA = a.miningRange?.gap ?? 999;
    const gapB = b.miningRange?.gap ?? 999;
    if (gapA !== gapB) return gapA - gapB;
    return (a.miningRange?.distance ?? 999) - (b.miningRange?.distance ?? 999);
  });
  candidates = candidates.slice(0, maxCandidates);

  const bestCandidate = candidates.find((entry) => entry.canReachInRange) || candidates[0] || null;
  const suggestedExpansionPath = bestCandidate?.canReachInRange
    ? {
      targetGridKey: bestCandidate.gridKey,
      frameSteps: bestCandidate.expansionPath?.steps || [],
      finalAction: bestCandidate.miningAction,
      totalFrameSteps: bestCandidate.expansionPath?.frameSteps ?? 0
    }
    : null;
  const failure = summarizeMiningCoverageFailure(reachability, miningStatus, candidates, bestCandidate);
  const affordability = computeMiningExpansionAffordability(bestCandidate, suggestedExpansionPath);
  const mobileApproachHint = computeMobileApproachHint(
    nearestFromReference
      ? {
        gap: Math.max(0, Math.ceil(nearestFromReference.distance - nearestFromReference.range)),
        inRange: nearestFromReference.distance <= nearestFromReference.range
      }
      : null,
    bestCandidate,
    affordability,
    failure
  );
  const ghostPath = suggestedExpansionPath
    ? {
      targetGridKey: suggestedExpansionPath.targetGridKey,
      stepGridKeys: (suggestedExpansionPath.frameSteps || []).map((step) => step.gridKey),
      frameCount: suggestedExpansionPath.totalFrameSteps ?? 0,
      finalAction: suggestedExpansionPath.finalAction || bestCandidate?.miningAction || null
    }
    : null;

  return {
    version: "v1.0.0-mining-coverage-diagnostics",
    readOnly: true,
    capturedAt: Date.now(),
    options: {
      maxCandidates,
      searchPadding,
      targetBodyName,
      minerGridKey
    },
    miningStatus: {
      minerCount: miningStatus.miners.length,
      activeCount: miningStatus.activeMiners.length,
      harvestingCount: miningStatus.harvesting.length,
      inactivePowerCount: miningStatus.inactivePower.length,
      manualOffCount: miningStatus.manualOff.length
    },
    reachability: reachability.overall,
    miners: reachability.miners,
    focusMiner: focusMiner
      ? reachability.miners.find((entry) => entry.cellKey === key(focusMiner.x, focusMiner.y)) || null
      : null,
    nearestResource: nearestFromReference
      ? {
        bodyName: nearestFromReference.body.name,
        resource: nearestFromReference.body.resource,
        x: nearestFromReference.body.x,
        y: nearestFromReference.body.y,
        r: nearestFromReference.body.r,
        distance: nearestFromReference.distance,
        range: nearestFromReference.range,
        gap: Math.max(0, Math.ceil(nearestFromReference.distance - nearestFromReference.range)),
        inRange: nearestFromReference.distance <= nearestFromReference.range
      }
      : null,
    targetResource: targetBody
      ? {
        bodyName: targetBody.name,
        resource: targetBody.resource,
        x: targetBody.x,
        y: targetBody.y,
        r: targetBody.r,
        range: getMiningRange(targetBody)
      }
      : null,
    candidates,
    bestCandidate,
    suggestedExpansionPath,
    affordability,
    mobileApproachHint,
    ghostPath,
    failure,
    rules: {
      miningRangeOffset: MINING_RANGE_OFFSET,
      rangeFormula: "body.r + MINING_RANGE_OFFSET",
      note: "只读诊断，不修改 state/storage，不调用 buildAt"
    }
  };
}

function computePowerMarginSnapshot({
  powerStarved = getInactiveDueToPower(),
  manualOffCount = getManualOffFacilities().length,
  miningStatus,
  weaponCount = 0,
  activeWeaponCount = 0,
  shieldCount = 0,
  activeShieldCount = 0,
  repairCount = 0,
  activeRepairCount = 0
} = {}) {
  const used = state.power.used;
  const available = state.power.available;
  const margin = available - used;
  const tight = used >= available - 0.25 && available > 0;
  const capabilityBlackout = [];
  if (miningStatus && miningStatus.miners.length > 0 && miningStatus.activeMiners.length === 0) capabilityBlackout.push("mining");
  if (weaponCount > 0 && activeWeaponCount === 0) capabilityBlackout.push("weapon");
  if (shieldCount > 0 && activeShieldCount === 0) capabilityBlackout.push("defense");
  if (repairCount > 0 && activeRepairCount === 0) capabilityBlackout.push("repair");
  const starvedFacilities = powerStarved.map((cell) => ({
    cellKey: key(cell.x, cell.y),
    facility: cell.facility,
    facilityName: TYPES[cell.facility]?.name || cell.facility
  }));
  let severity = "ok";
  let reasonKey = "margin_safe";
  if (margin < 0 || available <= 0 || powerStarved.length >= 3 || capabilityBlackout.length > 0) {
    severity = "critical";
    reasonKey = margin < 0 ? "power_negative" : capabilityBlackout.length > 0 ? "core_capability_blackout" : "mass_blackout";
  } else if (tight || powerStarved.length > 0) {
    severity = "warning";
    reasonKey = powerStarved.length > 0 ? "partial_blackout" : "margin_tight";
  }
  return {
    generatedAt: state.time,
    used,
    available,
    margin,
    tight,
    starvedCount: powerStarved.length,
    manualOffCount,
    starvedFacilities,
    coreCapabilityBlackout: capabilityBlackout,
    severity,
    reasonKey
  };
}

function isEnemyPressureLikely() {
  const hasActiveEnemy = state.enemies.some((enemy) => enemy && enemy.hp > 0 && enemy.dead !== true);
  if (hasActiveEnemy) return true;
  const hasCombatEncounter = Array.isArray(state.run.encounters) && state.run.encounters.some((encounter) => {
    if (!encounter || encounter.completed || encounter.failed || encounter.expired) return false;
    return encounter.type === "ambush" || encounter.type === "distress" || encounter.type === "guardian";
  });
  return hasCombatEncounter || (state.run.endgame && !state.run.guardianDefeated);
}

function createEmptyCombatAggregate(startedAt = state.time) {
  const safeStart = toFiniteNumber(startedAt, toFiniteNumber(state.time, 0));
  return {
    startedAt: safeStart,
    lastEventAt: safeStart,
    eventCount: 0,
    stationHitCount: 0,
    shieldBlockedCount: 0,
    missileSalvoCount: 0,
    missileFiredCount: 0,
    repairDispatchedCount: 0,
    repairAppliedCount: 0,
    repairHealed: 0,
    sourceStats: Object.create(null),
    roleStats: Object.create(null)
  };
}

function archiveCombatWindow(now = state.time) {
  const safeNow = toFiniteNumber(now, toFiniteNumber(state.time, 0));
  const current = combatWindowState.current;
  const startedAt = current && Number.isFinite(current.startedAt)
    ? current.startedAt
    : toFiniteNumber(combatWindowState.startedAt, safeNow);
  const lastEventAt = current && Number.isFinite(current.lastEventAt)
    ? current.lastEventAt
    : toFiniteNumber(combatWindowState.lastActiveAt, safeNow);
  const durationSec = Math.max(0, lastEventAt - startedAt);
  const hasEvents = !!(current && current.eventCount > 0);

  if (hasEvents && durationSec >= COMBAT_WINDOW_MIN_RECORD_SEC) {
    const sourceStats = Object.values(current.sourceStats || {}).map((entry) => ({
      sourceKey: entry.sourceKey,
      label: getDamageSourceLabel(entry.sourceKey),
      totalDamage: Math.round(toFiniteNumber(entry.totalDamage, 0) * 10) / 10,
      hitCount: Math.max(0, Math.floor(toFiniteNumber(entry.hitCount, 0))),
      lastSeenAt: toFiniteNumber(entry.lastSeenAt, startedAt)
    })).sort((a, b) => {
      if (b.totalDamage !== a.totalDamage) return b.totalDamage - a.totalDamage;
      if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
      return String(a.sourceKey).localeCompare(String(b.sourceKey));
    });
    const roleStats = Object.values(current.roleStats || {}).map((entry) => ({
      role: entry.role,
      roleLabel: getCombatRoleLabel(entry.role),
      damageTaken: Math.round(toFiniteNumber(entry.damageTaken, 0) * 10) / 10,
      cellCount: Math.max(1, Math.floor(toFiniteNumber(entry.cellCount, 1)))
    })).sort((a, b) => {
      if (b.damageTaken !== a.damageTaken) return b.damageTaken - a.damageTaken;
      if (b.cellCount !== a.cellCount) return b.cellCount - a.cellCount;
      return String(a.role).localeCompare(String(b.role));
    });

    combatWindowState.lastArchived = deepFreezeForDiagnostics({
      startedAt,
      endedAt: lastEventAt,
      durationSec,
      archivedAt: safeNow,
      eventCount: current.eventCount,
      stationHitCount: current.stationHitCount,
      shieldBlockedCount: current.shieldBlockedCount,
      missileSalvoCount: current.missileSalvoCount,
      missileFiredCount: current.missileFiredCount,
      repairDispatchedCount: current.repairDispatchedCount,
      repairAppliedCount: current.repairAppliedCount,
      repairHealed: Math.round(toFiniteNumber(current.repairHealed, 0) * 10) / 10,
      sourceStats,
      roleStats
    });
    combatWindowState.archivedAt = safeNow;
    combatReviewCache = null;
  }

  combatWindowState.active = false;
  combatWindowState.pendingArchive = false;
  combatWindowState.startedAt = null;
  combatWindowState.lastActiveAt = null;
  combatWindowState.current = null;
}

function ensureCombatWindowState(now = state.time) {
  const safeNow = toFiniteNumber(now, 0);
  if (Number.isFinite(combatWindowState.archivedAt) && safeNow < combatWindowState.archivedAt) {
    combatWindowState.lastArchived = null;
    combatWindowState.archivedAt = null;
    combatReviewCache = null;
  }
  const pressure = isEnemyPressureLikely();
  if (pressure) {
    if (!combatWindowState.active) {
      combatWindowState.active = true;
      combatWindowState.startedAt = safeNow;
      combatWindowState.current = createEmptyCombatAggregate(safeNow);
    } else if (!combatWindowState.current) {
      combatWindowState.current = createEmptyCombatAggregate(
        toFiniteNumber(combatWindowState.startedAt, safeNow)
      );
    }
    combatWindowState.lastActiveAt = safeNow;
    combatWindowState.pendingArchive = false;
    return;
  }
  if (!combatWindowState.active && !combatWindowState.pendingArchive) return;
  combatWindowState.pendingArchive = true;
  if (
    combatWindowState.lastActiveAt != null
    && safeNow - combatWindowState.lastActiveAt >= COMBAT_WINDOW_QUIET_SEC
  ) {
    archiveCombatWindow(safeNow);
  }
}

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalizeDamageSourceKey(sourceKey, fallback = "unknown") {
  const raw = typeof sourceKey === "string" ? sourceKey.trim() : "";
  if (!raw) return fallback;
  if (DAMAGE_SOURCE_KEY_ALIASES[raw]) return DAMAGE_SOURCE_KEY_ALIASES[raw];
  if (raw === "collision") return "asteroid";
  if (raw === "enemy") return "enemy_fire";
  return raw;
}

function getCombatRoleLabel(role) {
  switch (role) {
    case "core":
      return "核心";
    case "thrust":
      return "推进";
    case "weapon":
      return "武器";
    case "defense":
      return "护盾/防御";
    case "power":
      return "电力";
    case "mining":
      return "采矿";
    default:
      return "结构";
  }
}

function pruneCombatEvents(now = state.time) {
  const cutoff = now - RECENT_DAMAGE_WINDOW_SEC;
  while (combatEventBuffer.length > 0 && combatEventBuffer[0].t < cutoff) {
    combatEventBuffer.shift();
  }
}

function sanitizeCombatEventPayload(type, payload = null) {
  const source = payload && typeof payload === "object" ? payload : {};
  const clean = {};
  if (source.cellKey != null) clean.cellKey = String(source.cellKey);
  if (source.targetKey != null) clean.targetKey = String(source.targetKey);
  if (source.repairerKey != null) clean.repairerKey = String(source.repairerKey);
  if (source.facility != null) clean.facility = String(source.facility);
  if (source.targetFacility != null) clean.targetFacility = String(source.targetFacility);
  if (source.role != null) clean.role = String(source.role);
  if (source.enemyKind != null) clean.enemyKind = String(source.enemyKind);
  if (source.sourceKey != null) clean.sourceKey = String(source.sourceKey);
  if (!clean.sourceKey && source.sourceKind != null) clean.sourceKey = String(source.sourceKind);
  if (source.coverageStatus != null) clean.coverageStatus = String(source.coverageStatus);
  if (source.returning != null) clean.returning = !!source.returning;
  if (source.isCore != null) clean.isCore = !!source.isCore;
  const damage = toFiniteNumber(source.damage, null);
  if (damage != null) clean.damage = damage;
  const fired = toFiniteNumber(source.fired, null);
  if (fired != null) clean.fired = fired;
  const count = toFiniteNumber(source.count, null);
  if (count != null) clean.count = count;
  const healed = toFiniteNumber(source.healed, null);
  if (healed != null) clean.healed = healed;
  const cooldown = toFiniteNumber(source.cooldownRemaining, null);
  if (cooldown != null) clean.cooldownRemaining = cooldown;
  if (!clean.sourceKey && type === "stationCellHit") clean.sourceKey = "enemy_fire";
  if (!clean.sourceKey && type === "fragmentHit") clean.sourceKey = "collision";
  return clean;
}

function updateCombatWindowOnEvent(event) {
  if (!event || !event.type) return;
  const eventTime = toFiniteNumber(event.t, toFiniteNumber(state.time, 0));
  if (!combatWindowState.current) {
    const startedAt = Number.isFinite(combatWindowState.startedAt)
      ? combatWindowState.startedAt
      : eventTime;
    combatWindowState.current = createEmptyCombatAggregate(startedAt);
  }
  if (!combatWindowState.active) {
    combatWindowState.active = true;
    combatWindowState.pendingArchive = false;
    if (!Number.isFinite(combatWindowState.startedAt)) {
      combatWindowState.startedAt = eventTime;
    }
  }

  const current = combatWindowState.current;
  current.eventCount += 1;
  current.lastEventAt = eventTime;
  combatWindowState.lastActiveAt = eventTime;
  const payload = event.payload || {};

  if (event.type === "stationCellHit" || event.type === "fragmentHit") {
    const fallbackSource = event.type === "fragmentHit" ? "collision" : "enemy_fire";
    const sourceKey = normalizeDamageSourceKey(payload.sourceKey, fallbackSource);
    const damage = Math.max(0, toFiniteNumber(payload.damage, 0));
    const sourceEntry = current.sourceStats[sourceKey] || {
      sourceKey,
      totalDamage: 0,
      hitCount: 0,
      lastSeenAt: eventTime
    };
    sourceEntry.totalDamage += damage;
    sourceEntry.hitCount += 1;
    sourceEntry.lastSeenAt = eventTime;
    current.sourceStats[sourceKey] = sourceEntry;
    if (event.type === "stationCellHit") {
      current.stationHitCount += 1;
      const role = typeof payload.role === "string" ? payload.role : "structure";
      const roleEntry = current.roleStats[role] || {
        role,
        damageTaken: 0,
        cellCount: 0,
        cells: Object.create(null)
      };
      roleEntry.damageTaken += damage;
      const cellKey = payload.cellKey != null ? String(payload.cellKey) : "";
      if (cellKey && !roleEntry.cells[cellKey]) {
        roleEntry.cells[cellKey] = 1;
        roleEntry.cellCount += 1;
      }
      current.roleStats[role] = roleEntry;
    }
    return;
  }

  if (event.type === "shieldBlocked") {
    current.shieldBlockedCount += 1;
    return;
  }
  if (event.type === "missileSalvoFired") {
    current.missileSalvoCount += 1;
    current.missileFiredCount += Math.max(0, toFiniteNumber(payload.fired, 0));
    return;
  }
  if (event.type === "repairDispatched") {
    current.repairDispatchedCount += 1;
    return;
  }
  if (event.type === "repairApplied") {
    current.repairAppliedCount += 1;
    current.repairHealed += Math.max(0, toFiniteNumber(payload.healed, 0));
  }
}

function recordCombatEvent(type, payload = null) {
  try {
    const eventType = typeof type === "string"
      ? type
      : type && typeof type === "object" && typeof type.type === "string"
        ? type.type
        : "";
    if (!eventType) return;
    const rawPayload = typeof type === "string" ? payload : type;
    const entry = {
      t: toFiniteNumber(state.time, 0),
      type: eventType,
      payload: sanitizeCombatEventPayload(eventType, rawPayload)
    };
    combatEventBuffer.push(entry);
    if (combatEventBuffer.length > COMBAT_EVENT_BUFFER_CAPACITY) {
      combatEventBuffer.splice(0, combatEventBuffer.length - COMBAT_EVENT_BUFFER_CAPACITY);
    }
    ensureCombatWindowState(entry.t);
    updateCombatWindowOnEvent(entry);
    combatReviewCache = null;
  } catch {
    // 运行时插眼失败不得影响战斗结算链路
  }
}

function getRecentCombatEvents(now = state.time, windowSec = RECENT_DAMAGE_WINDOW_SEC) {
  pruneCombatEvents(now);
  const cutoff = now - windowSec;
  return combatEventBuffer.filter((event) => event.t >= cutoff);
}

function getDamageSeverityRank(severity) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function getDamageSourceLabel(sourceKey) {
  const normalized = normalizeDamageSourceKey(sourceKey, "unknown");
  return DAMAGE_SOURCE_LABELS[normalized] || DAMAGE_SOURCE_LABELS.unknown;
}

function getDamageSourceReasonKey(sourceKey) {
  const normalized = normalizeDamageSourceKey(sourceKey, "enemy_fire");
  return DAMAGE_SOURCE_REASON_KEYS[normalized] || "station_under_hostile_station_fire";
}

function getCombatReviewSourceReasonKey(sourceKey, label = "") {
  const normalized = normalizeDamageSourceKey(sourceKey, "");
  if (normalized && COMBAT_REVIEW_SOURCE_REASON_KEYS[normalized]) {
    return COMBAT_REVIEW_SOURCE_REASON_KEYS[normalized];
  }
  const safeLabel = typeof label === "string" ? label : "";
  if (safeLabel.includes("小行星")) return "main_damage_asteroid";
  if (safeLabel.includes("海盗")) return "main_damage_pirate";
  if (safeLabel.includes("守护者")) return "main_damage_guardian";
  if (safeLabel.includes("空间站")) return "main_damage_hostile_station";
  return "main_damage_station";
}

function getCombatReviewGapSeverity(reasonKey, repairSummary = null) {
  if (reasonKey === "repair_overwhelmed") {
    if (repairSummary?.reasonKey === "repair_missing" || repairSummary?.reasonKey === "repair_no_power") {
      return "critical";
    }
    return "warning";
  }
  if (reasonKey === "shield_offline_during_combat") return "warning";
  if (reasonKey === "no_significant_damage") return "info";
  return "warning";
}

function pickCombatReviewRecommendationReasonKey({
  weaponGapReasonKey = null,
  repairGapReasonKey = null,
  worstArea = null,
  weapon = null,
  repair = null
}) {
  if (repairGapReasonKey === "repair_overwhelmed") {
    if (repair?.summary?.reasonKey === "repair_no_power") return "add_power_source";
    return "add_repair_station";
  }
  if (weaponGapReasonKey === "shield_offline_during_combat") {
    if (weapon?.shield?.statusKey === "shield_no_power") return "add_power_source";
    return "rebuild_shield";
  }
  if (weaponGapReasonKey === "missile_never_fired") return "consider_missile_salvo";
  if (weaponGapReasonKey === "turret_los_blocked_often") return "reposition_weapons";
  if (weaponGapReasonKey === "thrust_heavy_loss") return "add_thruster_cover";
  if (worstArea?.role === "power") return "add_power_source";
  if (worstArea?.role === "weapon") return "reposition_weapons";
  if (worstArea?.role === "thrust") return "add_thruster_cover";
  return "add_power_source";
}

function getDamageCellFrameMaxHp(cell) {
  if (Number.isFinite(cell?.maxFrameHp) && cell.maxFrameHp > 0) return cell.maxFrameHp;
  const frameBase = toFiniteNumber(TYPES.frame?.baseStats?.maxFrameHp, 1);
  return Math.max(1, frameBase * getMetaEffect("hullIntegrity"));
}

function getCellDamageSeverity(hpRatio, frameRatio) {
  if (hpRatio < 0.35 || frameRatio < 0.35) return "critical";
  if (hpRatio < 0.6 || frameRatio < 0.6) return "warning";
  return "ok";
}

function getDamagedCellSnapshots({ damageByCell = null, includePosition = false } = {}) {
  const snapshots = [];
  for (const cell of state.station.cells.values()) {
    if (!cell || cell.detached) continue;
    const maxHp = Math.max(1, toFiniteNumber(cell.maxHp, 1));
    const hp = clamp(toFiniteNumber(cell.hp, maxHp), 0, maxHp);
    const frameMaxHp = getDamageCellFrameMaxHp(cell);
    const frameHp = clamp(toFiniteNumber(cell.frameHp, frameMaxHp), 0, frameMaxHp);
    if (!(hp < maxHp || frameHp < frameMaxHp)) continue;
    const cellKey = key(cell.x, cell.y);
    const role = getFacilityRoleTag(cell.facility);
    const snapshot = {
      cellKey,
      facility: cell.facility,
      facilityName: TYPES[cell.facility]?.name || cell.facility,
      role,
      roleLabel: FACILITY_ROLE_LABEL[role] || role,
      hp: Math.round(hp * 10) / 10,
      maxHp: Math.round(maxHp * 10) / 10,
      hpRatio: maxHp > 0 ? hp / maxHp : 1,
      frameHp: Math.round(frameHp * 10) / 10,
      frameMaxHp: Math.round(frameMaxHp * 10) / 10,
      frameRatio: frameMaxHp > 0 ? frameHp / frameMaxHp : 1,
      severity: getCellDamageSeverity(maxHp > 0 ? hp / maxHp : 1, frameMaxHp > 0 ? frameHp / frameMaxHp : 1),
      isCore: cell.facility === "core",
      damageTakenWindow: damageByCell instanceof Map ? toFiniteNumber(damageByCell.get(cellKey), 0) : 0
    };
    if (includePosition) snapshot.position = cellWorldPosition(cell);
    snapshots.push(snapshot);
  }
  snapshots.sort((a, b) => {
    const severityDiff = getDamageSeverityRank(b.severity) - getDamageSeverityRank(a.severity);
    if (severityDiff !== 0) return severityDiff;
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
    if (b.damageTakenWindow !== a.damageTakenWindow) return b.damageTakenWindow - a.damageTakenWindow;
    if (a.hpRatio !== b.hpRatio) return a.hpRatio - b.hpRatio;
    if (a.frameRatio !== b.frameRatio) return a.frameRatio - b.frameRatio;
    return a.cellKey.localeCompare(b.cellKey);
  });
  return snapshots;
}

function getLiveThreatEnemies() {
  return state.enemies.filter((enemy) => enemy && enemy.hp > 0 && enemy.dead !== true);
}

function getThreatKindLabel(kind) {
  return THREAT_KIND_LABELS[kind] || "敌方目标";
}

function getActivePlayerWeaponRanges() {
  const ranges = [];
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.enabled || !cell.active) continue;
    if (cell.facility === "turret" || cell.facility === "missile") {
      ranges.push(getCellStat(cell, "range"));
    }
  }
  return ranges;
}

function isEnemyWithinPlayerWeaponRange(enemy, weaponRanges = getActivePlayerWeaponRanges()) {
  if (!enemy || !weaponRanges.length) return false;
  const distance = dist(state.station.pos, enemy);
  return weaponRanges.some((range) => distance <= range);
}

function computeThreatDirectionFromEnemy(enemy) {
  const dx = enemy.x - state.station.pos.x;
  const dy = enemy.y - state.station.pos.y;
  const worldDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  const stationDeg = ((state.station.angle * 180) / Math.PI + 360) % 360;
  const relDeg = ((worldDeg - stationDeg) + 360) % 360;
  let direction = "right";
  if (relDeg < 22.5 || relDeg >= 337.5) direction = "right";
  else if (relDeg < 67.5) direction = "downRight";
  else if (relDeg < 112.5) direction = "down";
  else if (relDeg < 157.5) direction = "downLeft";
  else if (relDeg < 202.5) direction = "left";
  else if (relDeg < 247.5) direction = "upLeft";
  else if (relDeg < 292.5) direction = "up";
  else direction = "upRight";
  return {
    direction,
    headingDeg: Math.floor(relDeg),
    arrow: THREAT_DIRECTION_ARROWS[direction] || "→"
  };
}

function getThreatReasonKeyForKind(kind, distance, inWeaponRange) {
  if (kind === "hostile-station" && inWeaponRange) return "boss_in_weapon_range";
  if (kind === "hostile-station" || kind === "station") return "hostile_station_pressure";
  if (kind === "guardian") return "guardian_pressure";
  if (kind === "asteroid") return "asteroid_collision_risk";
  if (kind === "pirate") return "pirate_closing";
  if (distance <= 300) return "multiple_threats_focus_nearest";
  return "multiple_threats_focus_nearest";
}

function computeThreatItemSeverity(kind, distance, inWeaponRange) {
  if (inWeaponRange && (kind === "hostile-station" || kind === "station")) return "critical";
  switch (kind) {
    case "asteroid":
      if (distance <= 100) return "critical";
      if (distance <= 400) return "warning";
      return "ok";
    case "pirate":
      if (distance <= 250) return "critical";
      if (distance <= 500) return "warning";
      return "warning";
    case "station":
      if (distance <= 350 || inWeaponRange) return "critical";
      if (distance <= 600) return "warning";
      return "warning";
    case "guardian":
      if (state.run.endgame && distance <= 400) return "critical";
      if (state.run.endgame) return "warning";
      return "warning";
    case "hostile-station":
      if (distance <= 400 || inWeaponRange) return "critical";
      if (distance <= 700) return "warning";
      return "warning";
    default:
      if (distance <= 300) return "critical";
      if (distance <= 600) return "warning";
      return "ok";
  }
}

function threatSeverityRank(severity) {
  if (severity === "critical") return 3;
  if (severity === "warning") return 2;
  return 1;
}

function countActiveCombatFacilities() {
  let activeWeapons = 0;
  let activeShields = 0;
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.enabled || !cell.active) continue;
    if (cell.facility === "turret" || cell.facility === "missile") activeWeapons += 1;
    if (cell.facility === "shield") activeShields += 1;
  }
  return { activeWeapons, activeShields };
}

function buildHostileStationBossInfo(enemy) {
  if (!enemy || enemy.kind !== "hostile-station") return null;
  const cells = enemy.cells;
  if (!cells || !cells.size) {
    return {
      cellCount: 0,
      coreAlive: false,
      weaponCellAlive: 0,
      shieldAlive: false
    };
  }
  let weaponCellAlive = 0;
  let shieldAlive = false;
  for (const cell of cells.values()) {
    if (!cell || cell.hp <= 0) continue;
    if (cell.facility === "turret" || cell.facility === "missile") weaponCellAlive += 1;
    if (cell.facility === "shield") shieldAlive = true;
  }
  const coreKey = enemy.coreCellKey || HOSTILE_STATION_CORE_KEY;
  const core = cells.get(coreKey);
  return {
    cellCount: cells.size,
    coreAlive: !!(core && core.hp > 0),
    weaponCellAlive,
    shieldAlive
  };
}

function computeOverallThreatLevel({
  active,
  nearest,
  enemyCount,
  coreDamaged,
  noDefense,
  nearestDistance
}) {
  if (!active || !nearest) return "safe";
  const distValue = nearestDistance ?? nearest.distance;
  const kind = nearest.kind;
  const inRange = nearest.inWeaponRange;
  if (coreDamaged && enemyCount >= 1) return "critical";
  if (kind === "hostile-station" && inRange) return "critical";
  if (kind === "guardian" && state.run.endgame && distValue <= 400) return "critical";
  if (distValue <= 200 && noDefense) return "critical";
  if (distValue <= 300) return "critical";
  if (distValue <= 500 && (kind === "pirate" || kind === "hostile-station" || kind === "guardian")) return "danger";
  if (enemyCount >= 3) return "danger";
  if (kind === "hostile-station") return "danger";
  if (distValue <= 800 || kind === "asteroid" && distValue <= 400 || enemyCount >= 1) return "watch";
  return "watch";
}

function buildThreatCompositionText(byKind) {
  if (!byKind || typeof byKind !== "object") return "";
  const parts = [];
  for (const kind of ["pirate", "asteroid", "station", "guardian", "hostile-station"]) {
    const count = byKind[kind] || 0;
    if (count > 0) parts.push(`${getThreatKindLabel(kind)} x${count}`);
  }
  if (!parts.length) return "";
  if (parts.length > 3) return `${parts.slice(0, 3).join(" / ")} 等`;
  return parts.join(" / ");
}

function buildThreatSummarySnapshot() {
  ensureCombatWindowState(state.time);
  const active = isEnemyPressureLikely();
  const liveEnemies = getLiveThreatEnemies();
  const weaponRanges = getActivePlayerWeaponRanges();
  const byKind = {
    asteroid: 0,
    pirate: 0,
    station: 0,
    guardian: 0,
    "hostile-station": 0
  };
  const threatItems = [];
  for (const enemy of liveEnemies) {
    const kind = enemy.kind || "station";
    if (Object.prototype.hasOwnProperty.call(byKind, kind)) byKind[kind] += 1;
    const distance = Math.floor(dist(state.station.pos, enemy));
    const directionInfo = computeThreatDirectionFromEnemy(enemy);
    const inWeaponRange = isEnemyWithinPlayerWeaponRange(enemy, weaponRanges);
    const severity = computeThreatItemSeverity(kind, distance, inWeaponRange);
    threatItems.push({
      kind,
      kindLabel: getThreatKindLabel(kind),
      distance,
      direction: directionInfo.direction,
      headingDeg: directionInfo.headingDeg,
      arrow: directionInfo.arrow,
      severity,
      inWeaponRange,
      reasonKey: getThreatReasonKeyForKind(kind, distance, inWeaponRange)
    });
  }
  threatItems.sort((a, b) => {
    const severityDiff = threatSeverityRank(b.severity) - threatSeverityRank(a.severity);
    if (severityDiff !== 0) return severityDiff;
    return a.distance - b.distance;
  });
  const nearest = threatItems.length ? { ...threatItems[0] } : null;
  const threats = threatItems.slice(0, 3).map((entry) => ({
    kind: entry.kind,
    kindLabel: entry.kindLabel,
    distance: entry.distance,
    direction: entry.direction,
    severity: entry.severity,
    inWeaponRange: entry.inWeaponRange,
    reasonKey: entry.reasonKey
  }));
  const reasonKeys = [];
  const seenReasonKeys = new Set();
  for (const entry of threats) {
    if (!entry.reasonKey || seenReasonKeys.has(entry.reasonKey)) continue;
    seenReasonKeys.add(entry.reasonKey);
    reasonKeys.push(entry.reasonKey);
  }
  const core = state.station.cells.get(key(0, 0));
  const coreDamaged = !!(core && core.maxHp > 0 && core.hp / core.maxHp < 0.35);
  const { activeWeapons, activeShields } = countActiveCombatFacilities();
  const noDefense = active && activeWeapons === 0 && activeShields === 0;
  const enemyNear = !!(nearest && nearest.distance <= 300);
  const threatLevel = nearest
    ? computeOverallThreatLevel({
      active,
      nearest,
      enemyCount: liveEnemies.length,
      coreDamaged,
      noDefense,
      nearestDistance: nearest.distance
    })
    : (active ? "watch" : "safe");
  let bossEnemy = null;
  for (const enemy of liveEnemies) {
    if (enemy.kind === "hostile-station") {
      bossEnemy = enemy;
      break;
    }
  }
  return {
    generatedAt: state.time,
    active,
    threatLevel,
    enemyCount: liveEnemies.length,
    byKind,
    compositionText: buildThreatCompositionText(byKind),
    nearest,
    threats,
    reasonKeys,
    flags: {
      coreDamaged,
      noDefense,
      enemyNear
    },
    bossInfo: bossEnemy ? buildHostileStationBossInfo(bossEnemy) : null,
    endgame: {
      inEndgame: state.run.endgame === true,
      guardianAlive: state.enemies.some((enemy) => enemy.kind === "guardian" && enemy.hp > 0),
      guardianDefeated: state.run.guardianDefeated === true
    }
  };
}

function getThreatSummary() {
  const now = state.time;
  if (threatSummaryCache && now < threatSummaryCache.sampledAt) {
    threatSummaryCache = null;
  }
  if (
    threatSummaryCache
    && now - threatSummaryCache.sampledAt < COMBAT_THREAT_SAMPLE_INTERVAL
  ) {
    return threatSummaryCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(buildThreatSummarySnapshot());
  threatSummaryCache = { sampledAt: now, value: snapshot };
  return snapshot;
}

function getEnemyIdentifier(enemy) {
  if (!enemy) return null;
  const idx = state.enemies.indexOf(enemy);
  return idx >= 0 ? `${enemy.kind}#${idx}` : `${enemy.kind}#unknown`;
}

function isTurretLosBlockedRecent(cell) {
  return !!(cell._losBlockedAt && state.time - cell._losBlockedAt < LOS_BLOCK_WARN_DURATION);
}

function buildTurretEffectivenessCell(cell) {
  const cellKey = key(cell.x, cell.y);
  const range = getCellStat(cell, "range");
  const rangeText = `约 ${Math.floor(range)}`;
  if (cell.detached) {
    return {
      cellKey,
      statusKey: "detached",
      targetDistance: null,
      losAvailable: null,
      rangeText,
      targetKind: null,
      targetKindLabel: null,
      losBlockedRecent: false
    };
  }
  if (!cell.enabled) {
    return {
      cellKey,
      statusKey: "disabled_manual",
      targetDistance: null,
      losAvailable: null,
      rangeText,
      targetKind: null,
      targetKindLabel: null,
      losBlockedRecent: false
    };
  }
  if (!cell.active) {
    return {
      cellKey,
      statusKey: "weapon_no_power",
      targetDistance: null,
      losAvailable: null,
      rangeText,
      targetKind: null,
      targetKindLabel: null,
      losBlockedRecent: false
    };
  }
  const origin = cellWorldPosition(cell);
  const enemy = selectTargetReadOnly(origin, range);
  if (!enemy) {
    return {
      cellKey,
      statusKey: "weapon_no_target",
      targetDistance: null,
      losAvailable: null,
      rangeText,
      targetKind: null,
      targetKindLabel: null,
      losBlockedRecent: isTurretLosBlockedRecent(cell)
    };
  }
  const targetDistance = Math.floor(dist(origin, enemy));
  const losAvailable = hasLineOfSight(origin, enemy);
  return {
    cellKey,
    statusKey: losAvailable ? "weapon_ready" : "weapon_los_blocked",
    targetDistance,
    losAvailable,
    rangeText,
    targetKind: enemy.kind,
    targetKindLabel: getThreatKindLabel(enemy.kind),
    losBlockedRecent: isTurretLosBlockedRecent(cell) || !losAvailable
  };
}

function buildMissileEffectivenessCell(cell) {
  const cellKey = key(cell.x, cell.y);
  const range = getCellStat(cell, "range");
  const rangeText = `约 ${Math.floor(range)}`;
  if (cell.detached) {
    return { cellKey, statusKey: "detached", reload: cell.reload || 0, targetDistance: null, rangeText, targetKind: null, targetKindLabel: null };
  }
  if (!cell.enabled) {
    return { cellKey, statusKey: "disabled_manual", reload: cell.reload || 0, targetDistance: null, rangeText, targetKind: null, targetKindLabel: null };
  }
  if (!cell.active) {
    return { cellKey, statusKey: "weapon_no_power", reload: cell.reload || 0, targetDistance: null, rangeText, targetKind: null, targetKindLabel: null };
  }
  if (cell.reload > 0) {
    return { cellKey, statusKey: "missile_reloading", reload: cell.reload, targetDistance: null, rangeText, targetKind: null, targetKindLabel: null };
  }
  const origin = cellWorldPosition(cell);
  const enemy = selectTargetReadOnly(origin, range);
  if (!enemy) {
    return { cellKey, statusKey: "missile_no_target", reload: 0, targetDistance: null, rangeText, targetKind: null, targetKindLabel: null };
  }
  return {
    cellKey,
    statusKey: "weapon_ready",
    reload: 0,
    targetDistance: Math.floor(dist(origin, enemy)),
    rangeText,
    targetKind: enemy.kind,
    targetKindLabel: getThreatKindLabel(enemy.kind)
  };
}

function computeMissileCanFireNow(readyEntries, salvoSize) {
  const gasCost = TYPES.missile.baseStats.gasCost;
  const metalCost = TYPES.missile.baseStats.metalCost;
  let gas = state.resources.gas;
  let metal = state.resources.metal;
  let count = 0;
  const limit = Math.min(salvoSize, readyEntries.length);
  for (let i = 0; i < limit; i++) {
    const { cell } = readyEntries[i];
    const origin = cellWorldPosition(cell);
    const enemy = selectTargetReadOnly(origin, getCellStat(cell, "range"));
    if (!enemy) continue;
    if (gas < gasCost || metal < metalCost) break;
    gas -= gasCost;
    metal -= metalCost;
    count += 1;
  }
  return count;
}

function buildPriorityTargetEffectivenessSummary() {
  const pt = state.input.priorityTarget;
  if (!pt || !pt.enemy) return null;
  const enemy = pt.enemy;
  const enemyValid = enemy.hp > 0;
  const notExpired = (state.time - pt.setAt) < PRIORITY_TARGET_LIFETIME;
  const stationDist = dist(state.station.pos, enemy);
  const inSightOfStation = stationDist < PRIORITY_TARGET_BREAK_DISTANCE;
  let staleReasonKey = null;
  if (!enemyValid || !notExpired || !inSightOfStation) {
    staleReasonKey = "stale_target";
  } else {
    let anyMissileInRange = false;
    for (const cell of state.station.cells.values()) {
      if (cell.facility !== "missile" || cell.detached || !cell.enabled || !cell.active) continue;
      const origin = cellWorldPosition(cell);
      const range = getCellStat(cell, "range");
      const candidate = getPriorityTargetCandidate(origin, range);
      if (candidate.enemy === enemy) {
        anyMissileInRange = true;
        break;
      }
    }
    if (!anyMissileInRange) staleReasonKey = "priority_target_out_of_range";
  }
  const valid = enemyValid && !staleReasonKey;
  return {
    enemyId: getEnemyIdentifier(enemy),
    enemyKind: enemy.kind,
    enemyKindLabel: getThreatKindLabel(enemy.kind),
    valid,
    staleReasonKey,
    distance: enemyValid ? Math.floor(stationDist) : null,
    setAt: pt.setAt || null,
    expiresAt: pt.setAt ? pt.setAt + PRIORITY_TARGET_LIFETIME : null
  };
}

function buildShieldEffectivenessSummary() {
  const shieldCells = [...state.station.cells.values()].filter((cell) => cell.facility === "shield" && !cell.detached);
  const total = shieldCells.length;
  let active = 0;
  let poweredOffCount = 0;
  let recoveringCount = 0;
  for (const cell of shieldCells) {
    if (!cell.enabled) continue;
    if (!cell.active) {
      if ((TYPES.shield?.powerUse || 0) > 0) poweredOffCount += 1;
      continue;
    }
    active += 1;
    if ((cell.shield || 0) <= 0) recoveringCount += 1;
  }
  let coverageStatus = "none";
  let statusKey = "shield_missing";
  if (total === 0) {
    coverageStatus = "none";
    statusKey = "shield_missing";
  } else if (active === 0 && poweredOffCount > 0) {
    coverageStatus = "inactive";
    statusKey = "shield_no_power";
  } else if (active > 0 && recoveringCount === active) {
    coverageStatus = "recovering";
    statusKey = "shield_broken";
  } else if (active > 0) {
    coverageStatus = "active";
    statusKey = "shield_active";
  } else {
    coverageStatus = "inactive";
    statusKey = "shield_no_power";
  }
  return { total, active, poweredOffCount, recoveringCount, coverageStatus, statusKey };
}

function resolveWeaponEffectivenessSummary(turret, missile, shield, threatActive) {
  const reasonKeys = [];
  let primaryReasonKey = "ready";
  let overallStatus = "good";

  if (turret.total === 0 && missile.total === 0 && threatActive) {
    primaryReasonKey = "weapon_no_target";
    overallStatus = "danger";
    reasonKeys.push("weapon_no_target");
  } else if (turret.inactiveByPowerCount > 0 && turret.active === 0 && missile.inactiveByPowerCount > 0 && missile.active === 0 && threatActive) {
    primaryReasonKey = "weapon_no_power";
    overallStatus = "danger";
    reasonKeys.push("weapon_no_power");
  } else if (turret.total > 0 && turret.active > 0 && turret.readyCount === 0 && turret.losBlockedCount === turret.active) {
    primaryReasonKey = "all_turrets_los_blocked";
    overallStatus = "warn";
    reasonKeys.push("all_turrets_los_blocked");
  } else if (turret.inactiveByPowerCount > 0 && turret.active === 0 && (missile.active === 0 || missile.readyCount === 0) && threatActive) {
    primaryReasonKey = "weapon_no_power";
    overallStatus = "danger";
    reasonKeys.push("weapon_no_power");
  } else if (missile.total > 0 && missile.readyCount === 0 && missile.reloadingCount > 0 && threatActive) {
    primaryReasonKey = "missile_reloading";
    overallStatus = "warn";
    reasonKeys.push("missile_reloading");
  } else if (missile.readyCount > 0 && missile.canFireNow === 0 && threatActive) {
    if (missile.noTargetCount === missile.readyCount) {
      primaryReasonKey = "missile_no_target";
      overallStatus = "warn";
      reasonKeys.push("missile_no_target");
    } else if (missile.noResourceBlock) {
      primaryReasonKey = "missile_no_resource";
      overallStatus = "warn";
      reasonKeys.push("missile_no_resource");
    }
  } else if (turret.noTargetCount > 0 && turret.readyCount === 0 && turret.active > 0 && threatActive) {
    primaryReasonKey = "weapon_no_target";
    overallStatus = "warn";
    reasonKeys.push("weapon_no_target");
  }

  if (shield.statusKey === "shield_no_power" && threatActive) {
    reasonKeys.push("shield_no_power");
    if (overallStatus === "good") overallStatus = "danger";
  } else if (shield.statusKey === "shield_broken" && threatActive) {
    reasonKeys.push("shield_broken");
    if (overallStatus === "good") overallStatus = "warn";
  } else if (shield.statusKey === "shield_missing" && threatActive) {
    reasonKeys.push("shield_missing");
    if (overallStatus === "good") overallStatus = "warn";
  }

  if (primaryReasonKey === "ready" && (turret.readyCount + missile.readyCount) > 0) {
    reasonKeys.push("weapon_ready");
  }

  return {
    weaponReady: turret.readyCount + missile.readyCount,
    weaponTotal: turret.total + missile.total,
    primaryReasonKey,
    overallStatus,
    reasonKeys: [...new Set(reasonKeys)]
  };
}

function buildWeaponEffectivenessSnapshot() {
  ensureCombatWindowState(state.time);
  const threat = getThreatSummary();
  const threatActive = !!threat?.active;

  const turretCells = [];
  let turretTotal = 0;
  let turretActive = 0;
  let turretReadyCount = 0;
  let turretLosBlockedCount = 0;
  let turretNoTargetCount = 0;
  let turretInactiveByPowerCount = 0;

  const missileCells = [];
  let missileTotal = 0;
  let missileActive = 0;
  let missileReadyCount = 0;
  let missileReloadingCount = 0;
  let missileNoTargetCount = 0;
  let missileInactiveByPowerCount = 0;
  let nextReloadSec = null;

  const readyMissileEntries = [];

  for (const cell of state.station.cells.values()) {
    if (cell.facility === "turret") {
      if (cell.detached) continue;
      turretTotal += 1;
      const entry = buildTurretEffectivenessCell(cell);
      turretCells.push(entry);
      if (cell.enabled && cell.active) {
        turretActive += 1;
        if (cell.reload <= 0) turretReadyCount += 1;
        if (entry.statusKey === "weapon_no_target") turretNoTargetCount += 1;
        if (entry.losBlockedRecent) turretLosBlockedCount += 1;
      } else if (cell.enabled && !cell.active && (TYPES.turret?.powerUse || 0) > 0) {
        turretInactiveByPowerCount += 1;
      }
    } else if (cell.facility === "missile") {
      if (cell.detached) continue;
      missileTotal += 1;
      const entry = buildMissileEffectivenessCell(cell);
      missileCells.push(entry);
      if (cell.enabled && cell.active) {
        missileActive += 1;
        if (cell.reload <= 0) {
          missileReadyCount += 1;
          readyMissileEntries.push({ cellKey: entry.cellKey, cell });
          if (entry.statusKey === "missile_no_target") missileNoTargetCount += 1;
        } else {
          missileReloadingCount += 1;
          nextReloadSec = nextReloadSec == null ? cell.reload : Math.min(nextReloadSec, cell.reload);
        }
      } else if (cell.enabled && !cell.active && (TYPES.missile?.powerUse || 0) > 0) {
        missileInactiveByPowerCount += 1;
      }
    }
  }

  readyMissileEntries.sort((a, b) => (a.cellKey < b.cellKey ? -1 : a.cellKey > b.cellKey ? 1 : 0));
  const salvoSize = state.missile.salvoSize || 1;
  const canFireNow = computeMissileCanFireNow(readyMissileEntries, salvoSize >= 999 ? readyMissileEntries.length : salvoSize);
  const gasCost = TYPES.missile.baseStats.gasCost;
  const metalCost = TYPES.missile.baseStats.metalCost;
  const noResourceBlock = missileReadyCount > 0
    && canFireNow === 0
    && (state.resources.gas < gasCost || state.resources.metal < metalCost);

  const salvoLabel = SALVO_SIZE_LABELS[salvoSize] || String(salvoSize);
  const shield = buildShieldEffectivenessSummary();
  const priorityTarget = buildPriorityTargetEffectivenessSummary();
  const turret = {
    total: turretTotal,
    active: turretActive,
    readyCount: turretReadyCount,
    losBlockedCount: turretLosBlockedCount,
    noTargetCount: turretNoTargetCount,
    inactiveByPowerCount: turretInactiveByPowerCount,
    cells: turretCells
  };
  const missile = {
    total: missileTotal,
    active: missileActive,
    readyCount: missileReadyCount,
    reloadingCount: missileReloadingCount,
    noTargetCount: missileNoTargetCount,
    inactiveByPowerCount: missileInactiveByPowerCount,
    nextReloadSec,
    salvoSize,
    salvoLabel,
    canFireNow,
    noResourceBlock,
    cells: missileCells
  };
  const summary = resolveWeaponEffectivenessSummary(turret, missile, shield, threatActive);
  const reasonKeys = [...summary.reasonKeys];
  if (priorityTarget?.valid) reasonKeys.push("priority_target_active");
  else if (priorityTarget?.staleReasonKey === "stale_target") reasonKeys.push("priority_target_stale");
  else if (priorityTarget?.staleReasonKey === "priority_target_out_of_range") {
    reasonKeys.push("priority_target_out_of_range");
  }

  return {
    generatedAt: state.time,
    active: threatActive,
    turret,
    missile,
    priorityTarget,
    shield,
    summary: {
      weaponReady: summary.weaponReady,
      weaponTotal: summary.weaponTotal,
      primaryReasonKey: summary.primaryReasonKey,
      overallStatus: summary.overallStatus
    },
    reasonKeys: [...new Set(reasonKeys)]
  };
}

function getWeaponEffectiveness() {
  const now = state.time;
  if (weaponEffectivenessCache && now < weaponEffectivenessCache.sampledAt) {
    weaponEffectivenessCache = null;
  }
  if (
    weaponEffectivenessCache
    && now - weaponEffectivenessCache.sampledAt < COMBAT_THREAT_SAMPLE_INTERVAL
  ) {
    return weaponEffectivenessCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(buildWeaponEffectivenessSnapshot());
  weaponEffectivenessCache = { sampledAt: now, value: snapshot };
  return snapshot;
}

function buildRecentDamageSummarySnapshot() {
  const now = state.time;
  ensureCombatWindowState(now);
  const recentEvents = getRecentCombatEvents(now);
  const sourceMap = new Map();
  const damageByCell = new Map();
  let shieldBlockedCount = 0;

  for (const event of recentEvents) {
    if (!event || !event.type) continue;
    if (event.type === "shieldBlocked") {
      shieldBlockedCount += 1;
      continue;
    }
    if (event.type !== "stationCellHit" && event.type !== "fragmentHit") continue;
    const sourceKey = normalizeDamageSourceKey(
      event.payload?.sourceKey,
      event.type === "fragmentHit" ? "collision" : "enemy_fire"
    );
    const damage = Math.max(0, toFiniteNumber(event.payload?.damage, 0));
    const current = sourceMap.get(sourceKey) || {
      sourceKey,
      label: getDamageSourceLabel(sourceKey),
      hitCount: 0,
      totalDamage: 0,
      lastSeenAt: null
    };
    current.hitCount += 1;
    current.totalDamage += damage;
    current.lastSeenAt = event.t;
    sourceMap.set(sourceKey, current);
    if (event.type === "stationCellHit" && event.payload?.cellKey) {
      const cellKey = String(event.payload.cellKey);
      damageByCell.set(cellKey, toFiniteNumber(damageByCell.get(cellKey), 0) + damage);
    }
  }

  const recentSources = [...sourceMap.values()].sort((a, b) => {
    if (b.totalDamage !== a.totalDamage) return b.totalDamage - a.totalDamage;
    if (b.hitCount !== a.hitCount) return b.hitCount - a.hitCount;
    return String(a.sourceKey).localeCompare(String(b.sourceKey));
  });

  const allDamagedCells = getDamagedCellSnapshots({ damageByCell });
  const damagedCells = allDamagedCells.slice(0, 5);
  const roleDamageMap = new Map();
  for (const cell of allDamagedCells) {
    const entry = roleDamageMap.get(cell.role) || {
      role: cell.role,
      roleLabel: cell.roleLabel,
      damageTaken: 0,
      cellCount: 0
    };
    entry.damageTaken += cell.damageTakenWindow > 0
      ? cell.damageTakenWindow
      : (1 - Math.min(cell.hpRatio, cell.frameRatio)) * cell.maxHp;
    entry.cellCount += 1;
    roleDamageMap.set(cell.role, entry);
  }
  const worstAreas = [...roleDamageMap.values()].sort((a, b) => {
    if (b.damageTaken !== a.damageTaken) return b.damageTaken - a.damageTaken;
    if (b.cellCount !== a.cellCount) return b.cellCount - a.cellCount;
    return String(a.role).localeCompare(String(b.role));
  });
  const coreDamaged = allDamagedCells.some((cell) => cell.isCore && cell.severity === "critical");
  const criticalDamagedCount = allDamagedCells.filter((cell) => cell.severity === "critical").length;
  const weakConnectionCount = allDamagedCells.filter((cell) => cell.frameRatio < 0.4).length;
  const fragmentsCount = Array.isArray(state.fragments) ? state.fragments.length : 0;
  let detachmentSeverity = "ok";
  if (fragmentsCount > 0 || weakConnectionCount > 0) detachmentSeverity = "warning";
  if (fragmentsCount >= 2 || weakConnectionCount >= 4 || coreDamaged) detachmentSeverity = "critical";
  const reasonKeys = [];
  if (coreDamaged) reasonKeys.push("core_low_hp");
  if (detachmentSeverity !== "ok" && fragmentsCount > 0) reasonKeys.push("fragment_detaching");
  if (recentSources.length > 0) {
    reasonKeys.push(getDamageSourceReasonKey(recentSources[0].sourceKey));
  }
  if (!reasonKeys.length && allDamagedCells.length === 0) {
    reasonKeys.push("no_recent_damage");
  }
  const topReasonKey = reasonKeys[0] || "no_recent_damage";
  let severity = "ok";
  if (coreDamaged || criticalDamagedCount > 0 || detachmentSeverity === "critical") severity = "critical";
  else if (allDamagedCells.length > 0 || recentSources.length > 0) severity = "warning";

  return {
    generatedAt: now,
    windowSec: RECENT_DAMAGE_WINDOW_SEC,
    recentEventCount: recentEvents.length,
    damagedCells,
    recentSources,
    worstAreas: worstAreas.slice(0, 2),
    detachmentRisk: {
      fragmentsCount,
      weakConnectionCount,
      severity: detachmentSeverity
    },
    shieldBlockedCount,
    reasonKeys: [...new Set(reasonKeys)],
    topReasonKey,
    summary: {
      severity,
      damagedCellCount: allDamagedCells.length,
      criticalDamagedCount,
      coreDamaged,
      reasonKey: topReasonKey
    }
  };
}

function getRecentDamageSummary() {
  const now = state.time;
  if (recentDamageSummaryCache && now < recentDamageSummaryCache.sampledAt) {
    recentDamageSummaryCache = null;
  }
  if (
    recentDamageSummaryCache
    && now - recentDamageSummaryCache.sampledAt < COMBAT_DAMAGE_SAMPLE_INTERVAL
  ) {
    return recentDamageSummaryCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(buildRecentDamageSummarySnapshot());
  recentDamageSummaryCache = { sampledAt: now, value: snapshot };
  return snapshot;
}

function buildRepairStatusSummarySnapshot() {
  const now = state.time;
  ensureCombatWindowState(now);
  const recentEvents = getRecentCombatEvents(now);
  const dispatchByRepairer = new Map();
  const appliedByRepairer = new Map();
  for (const event of recentEvents) {
    if (!event || !event.type) continue;
    if (event.type === "repairDispatched" && event.payload?.repairerKey) {
      const repairerKey = String(event.payload.repairerKey);
      dispatchByRepairer.set(repairerKey, toFiniteNumber(dispatchByRepairer.get(repairerKey), 0) + 1);
    } else if (event.type === "repairApplied" && event.payload?.repairerKey) {
      const repairerKey = String(event.payload.repairerKey);
      appliedByRepairer.set(repairerKey, toFiniteNumber(appliedByRepairer.get(repairerKey), 0) + 1);
    }
  }

  const damagedCells = getDamagedCellSnapshots({ includePosition: true });
  const repairers = [];
  const activeCoverage = [];
  let repairerCount = 0;
  let activeRepairerCount = 0;
  let idleRepairerCount = 0;
  let poweredOffCount = 0;
  for (const cell of state.station.cells.values()) {
    if (!cell || cell.detached || cell.facility !== "repair") continue;
    repairerCount += 1;
    const cellKey = key(cell.x, cell.y);
    const diagnostics = getSelectedCellRepairDiagnostics(cell);
    const coverageStatus = diagnostics?.coverageStatus || (cell.enabled && cell.active ? "active" : "inactive");
    const origin = cellWorldPosition(cell);
    const range = getCellStat(cell, "range");
    let nearestDamagedDistance = null;
    let coveredDamagedCount = 0;
    for (const damaged of damagedCells) {
      const distance = dist(origin, damaged.position);
      if (nearestDamagedDistance == null || distance < nearestDamagedDistance) {
        nearestDamagedDistance = distance;
      }
      if (distance <= range) coveredDamagedCount += 1;
    }
    let statusKey = "repair_no_target";
    if (coverageStatus === "inactive") {
      statusKey = "repair_no_power";
      poweredOffCount += 1;
    } else if (damagedCells.length === 0) {
      statusKey = "repair_no_target";
      idleRepairerCount += 1;
    } else if (coveredDamagedCount <= 0) {
      statusKey = "repair_uncovered";
      idleRepairerCount += 1;
    } else {
      statusKey = "repair_active";
      activeRepairerCount += 1;
    }
    if (coverageStatus === "active") {
      activeCoverage.push({ origin, range });
    }
    repairers.push({
      cellKey,
      coverageStatus,
      statusKey,
      repairRate: diagnostics?.repairRate || getCellStat(cell, "repairRate"),
      frameRepairRate: diagnostics?.frameRepairRate || getCellStat(cell, "frameRepairRate"),
      cooldown: diagnostics?.cooldown || getCellStat(cell, "cooldown"),
      cooldownRemaining: Math.max(0, toFiniteNumber(cell.repairCooldown, 0)),
      nearestDamagedDistance: nearestDamagedDistance == null ? null : Math.floor(nearestDamagedDistance),
      coveredDamagedCount,
      recentDispatchCount: toFiniteNumber(dispatchByRepairer.get(cellKey), 0),
      recentAppliedCount: toFiniteNumber(appliedByRepairer.get(cellKey), 0)
    });
  }

  let uncoveredDamagedCount = 0;
  for (const damaged of damagedCells) {
    const covered = activeCoverage.some((entry) => dist(entry.origin, damaged.position) <= entry.range);
    if (!covered) uncoveredDamagedCount += 1;
  }

  const drones = state.repairDrones.map((drone) => {
    const target = state.station.cells.get(drone.targetKey);
    const targetExists = !!(target && !target.detached);
    const targetPos = targetExists ? cellWorldPosition(target) : null;
    const targetDistance = targetPos ? Math.floor(dist({ x: drone.x, y: drone.y }, targetPos)) : null;
    return {
      repairerKey: String(drone.repairerKey || ""),
      targetKey: String(drone.targetKey || ""),
      returning: !!drone.returning,
      lifeRemaining: Math.max(0, Math.round(toFiniteNumber(drone.life, 0) * 10) / 10),
      targetFacility: target?.facility || null,
      targetFacilityName: target?.facility ? (TYPES[target.facility]?.name || target.facility) : null,
      targetExists,
      targetDistance
    };
  });

  const damagedCellCount = damagedCells.length;
  let reasonKey = "repair_no_target";
  if (repairerCount <= 0) {
    reasonKey = damagedCellCount > 0 ? "repair_missing" : "repair_no_target";
  } else if (damagedCellCount <= 0) {
    reasonKey = "repair_no_target";
  } else if (activeRepairerCount <= 0) {
    reasonKey = poweredOffCount > 0 ? "repair_no_power" : "repair_uncovered";
  } else if (uncoveredDamagedCount > 0) {
    reasonKey = "repair_uncovered";
  } else {
    reasonKey = "repair_active";
  }

  let severity = "ok";
  if (damagedCellCount <= 0) severity = "ok";
  else if (reasonKey === "repair_missing" || reasonKey === "repair_no_power" && damagedCellCount >= 2) severity = "critical";
  else if (reasonKey === "repair_no_power" || reasonKey === "repair_uncovered") severity = "warning";

  const activeTargetCount = drones.filter((entry) => !entry.returning && entry.targetExists).length;
  const summary = {
    repairerCount,
    activeRepairerCount,
    idleRepairerCount,
    poweredOffCount,
    droneCount: drones.length,
    activeTargetCount,
    damagedCellCount,
    uncoveredDamagedCount,
    severity,
    reasonKey
  };

  return {
    generatedAt: now,
    windowSec: RECENT_DAMAGE_WINDOW_SEC,
    repairers,
    drones,
    summary,
    reasonKeys: [reasonKey]
  };
}

function getRepairStatusSummary() {
  const now = state.time;
  if (repairStatusSummaryCache && now < repairStatusSummaryCache.sampledAt) {
    repairStatusSummaryCache = null;
  }
  if (
    repairStatusSummaryCache
    && now - repairStatusSummaryCache.sampledAt < COMBAT_DAMAGE_SAMPLE_INTERVAL
  ) {
    return repairStatusSummaryCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(buildRepairStatusSummarySnapshot());
  repairStatusSummaryCache = { sampledAt: now, value: snapshot };
  return snapshot;
}

function createEmptyCombatReviewSnapshot(now = state.time) {
  return {
    generatedAt: now,
    hasReview: false,
    reasonKey: "no_recent_combat",
    windowStartedAt: null,
    windowEndedAt: null,
    durationSec: 0,
    primarySources: [],
    worstAreas: [],
    defenseGaps: [],
    recommendation: null,
    recommendations: [],
    shortItems: []
  };
}

function getCombatReviewAreaReasonKey(role) {
  return COMBAT_REVIEW_AREA_REASON_KEYS[role] || "worst_area_power";
}

function getCombatReviewAreaLabel(role, fallbackLabel = null) {
  if (typeof fallbackLabel === "string" && fallbackLabel) return fallbackLabel;
  return getCombatRoleLabel(role);
}

function buildCombatReviewSnapshot() {
  const now = state.time;
  ensureCombatWindowState(now);
  pruneCombatEvents(now);
  const empty = createEmptyCombatReviewSnapshot(now);

  if (isEnemyPressureLikely()) {
    empty.reasonKey = "combat_active";
    return empty;
  }
  const archived = combatWindowState.lastArchived;
  const archivedAt = toFiniteNumber(combatWindowState.archivedAt, null);
  if (!archived) return empty;
  if (archivedAt != null && now - archivedAt > COMBAT_REVIEW_VISIBLE_SEC) {
    empty.reasonKey = "review_window_expired";
    return empty;
  }

  const eventCount = Math.max(0, Math.floor(toFiniteNumber(archived.eventCount, 0)));
  const durationSec = Math.max(0, toFiniteNumber(archived.durationSec, 0));
  if (eventCount <= 0 || durationSec < COMBAT_WINDOW_MIN_RECORD_SEC) {
    empty.reasonKey = "review_not_ready";
    return empty;
  }

  const weapon = getWeaponEffectiveness();
  const repair = getRepairStatusSummary();
  const damage = getRecentDamageSummary();

  const primarySources = (Array.isArray(archived.sourceStats) ? archived.sourceStats : [])
    .filter((entry) => toFiniteNumber(entry.totalDamage, 0) > 0)
    .sort((a, b) => {
      if (toFiniteNumber(b.totalDamage, 0) !== toFiniteNumber(a.totalDamage, 0)) {
        return toFiniteNumber(b.totalDamage, 0) - toFiniteNumber(a.totalDamage, 0);
      }
      if (toFiniteNumber(b.hitCount, 0) !== toFiniteNumber(a.hitCount, 0)) {
        return toFiniteNumber(b.hitCount, 0) - toFiniteNumber(a.hitCount, 0);
      }
      return String(a.sourceKey).localeCompare(String(b.sourceKey));
    })
    .slice(0, 3)
    .map((entry) => {
      const sourceKey = normalizeDamageSourceKey(entry.sourceKey, "enemy_fire");
      return {
        sourceKey,
        label: getDamageSourceLabel(sourceKey),
        totalDamage: Math.round(toFiniteNumber(entry.totalDamage, 0) * 10) / 10,
        hitCount: Math.max(0, Math.floor(toFiniteNumber(entry.hitCount, 0)))
      };
    });

  const worstAreas = (Array.isArray(archived.roleStats) ? archived.roleStats : [])
    .filter((entry) => toFiniteNumber(entry.damageTaken, 0) > 0)
    .sort((a, b) => {
      if (toFiniteNumber(b.damageTaken, 0) !== toFiniteNumber(a.damageTaken, 0)) {
        return toFiniteNumber(b.damageTaken, 0) - toFiniteNumber(a.damageTaken, 0);
      }
      return toFiniteNumber(b.cellCount, 0) - toFiniteNumber(a.cellCount, 0);
    })
    .slice(0, 2)
    .map((entry) => ({
      role: String(entry.role || "structure"),
      roleLabel: getCombatReviewAreaLabel(entry.role, entry.roleLabel),
      damageTaken: Math.round(toFiniteNumber(entry.damageTaken, 0) * 10) / 10,
      cellCount: Math.max(1, Math.floor(toFiniteNumber(entry.cellCount, 1)))
    }));

  const stationHitCount = Math.max(0, Math.floor(toFiniteNumber(archived.stationHitCount, 0)));
  const shieldBlockedCount = Math.max(0, Math.floor(toFiniteNumber(archived.shieldBlockedCount, 0)));
  const missileFiredCount = Math.max(0, Math.floor(toFiniteNumber(archived.missileFiredCount, 0)));
  const repairDispatchedCount = Math.max(0, Math.floor(toFiniteNumber(archived.repairDispatchedCount, 0)));
  const repairAppliedCount = Math.max(0, Math.floor(toFiniteNumber(archived.repairAppliedCount, 0)));
  const topArea = worstAreas[0] || null;

  const weaponGapReasonKeys = [];
  if (weapon?.summary?.primaryReasonKey === "all_turrets_los_blocked") {
    weaponGapReasonKeys.push("turret_los_blocked_often");
  }
  if (
    stationHitCount > 0
    && shieldBlockedCount <= 0
    && (
      weapon?.shield?.statusKey === "shield_no_power"
      || weapon?.shield?.statusKey === "shield_missing"
      || weapon?.shield?.total <= 0
    )
  ) {
    weaponGapReasonKeys.push("shield_offline_during_combat");
  }
  if (stationHitCount > 0 && missileFiredCount <= 0 && weapon?.missile?.total > 0) {
    weaponGapReasonKeys.push("missile_never_fired");
  }
  if (topArea && topArea.role === "thrust" && topArea.damageTaken >= 10) {
    weaponGapReasonKeys.push("thrust_heavy_loss");
  }

  let repairGapReasonKey = null;
  if (
    repair?.summary?.reasonKey === "repair_missing"
    || repair?.summary?.reasonKey === "repair_no_power"
    || repair?.summary?.reasonKey === "repair_uncovered"
  ) {
    repairGapReasonKey = "repair_overwhelmed";
  } else {
    const repairGapThreshold = Math.max(1, Math.ceil(repairDispatchedCount * 0.5));
    if (stationHitCount >= 3 && repairAppliedCount < repairGapThreshold) {
      repairGapReasonKey = "repair_overwhelmed";
    }
  }

  const seenGapReasonKeys = new Set();
  const defenseGaps = [];
  const pushGap = (reasonKey, severity = "warning") => {
    if (!reasonKey || seenGapReasonKeys.has(reasonKey)) return;
    seenGapReasonKeys.add(reasonKey);
    defenseGaps.push({
      key: reasonKey,
      severity,
      reasonKey
    });
  };
  for (const reasonKey of weaponGapReasonKeys) {
    pushGap(reasonKey, "warning");
  }
  if (repairGapReasonKey) {
    pushGap(repairGapReasonKey, getCombatReviewGapSeverity(repairGapReasonKey, repair?.summary));
  }

  const recommendationReasonKey = pickCombatReviewRecommendationReasonKey({
    weaponGapReasonKey: weaponGapReasonKeys[0] || null,
    repairGapReasonKey,
    worstArea: topArea,
    weapon,
    repair
  });
  const recommendations = recommendationReasonKey
    ? [{ key: recommendationReasonKey, reasonKey: recommendationReasonKey }]
    : [];

  const shortItems = [];
  if (primarySources[0] && primarySources[0].totalDamage >= 5) {
    const source = primarySources[0];
    const sourceSeverity = source.totalDamage >= 20 ? "critical" : "warning";
    shortItems.push({
      kind: "source",
      severity: sourceSeverity,
      reasonKey: getCombatReviewSourceReasonKey(source.sourceKey, source.label),
      payload: source,
      text: `主要伤害来自${source.label}（${Math.round(source.totalDamage)} 点，${source.hitCount} 次）`
    });
  }
  if (topArea && (topArea.damageTaken >= 10 || getCombatReviewAreaReasonKey(topArea.role) === "worst_area_core")) {
    const areaSeverity = topArea.damageTaken >= 18 || getCombatReviewAreaReasonKey(topArea.role) === "worst_area_core"
      ? "critical"
      : "warning";
    shortItems.push({
      kind: "worstArea",
      severity: areaSeverity,
      reasonKey: getCombatReviewAreaReasonKey(topArea.role),
      payload: topArea,
      text: `${topArea.roleLabel}受损最重（${Math.round(topArea.damageTaken)} 点，${topArea.cellCount} 块）`
    });
  }
  if (defenseGaps.length) {
    const gapTexts = defenseGaps.map((gap) => {
      if (gap.reasonKey === "shield_offline_during_combat") return "护盾在战斗中未有效拦截";
      if (gap.reasonKey === "missile_never_fired") return "导弹火力未参与输出";
      if (gap.reasonKey === "turret_los_blocked_often") return "炮塔射线多次被结构遮挡";
      if (gap.reasonKey === "repair_overwhelmed") return "维修跟不上受损速度";
      if (gap.reasonKey === "thrust_heavy_loss") return "推进区受损偏重";
      return gap.reasonKey;
    });
    shortItems.push({
      kind: "gap",
      severity: getCombatReviewGapSeverity(defenseGaps[0].reasonKey, repair?.summary),
      reasonKey: defenseGaps[0].reasonKey,
      payload: { reasonKeys: defenseGaps.map((entry) => entry.reasonKey) },
      text: `短板：${gapTexts.join("；")}`
    });
  }
  if (recommendationReasonKey) {
    shortItems.push({
      kind: "recommendation",
      severity: "info",
      reasonKey: recommendationReasonKey,
      payload: { key: recommendationReasonKey },
      text: `建议：${COMBAT_REVIEW_RECOMMENDATION_COPY[recommendationReasonKey] || "可考虑优先恢复关键战斗能力。"}`
    });
  }

  if (!shortItems.length) return empty;
  const trimmedShortItems = shortItems.slice(0, 4);
  if (trimmedShortItems.length < 2) {
    trimmedShortItems.push({
      kind: "gap",
      severity: "info",
      reasonKey: "no_significant_damage",
      payload: {},
      text: "短板：本场未记录到明显受损"
    });
  }

  return {
    generatedAt: now,
    hasReview: true,
    reasonKey: "review_ready",
    windowStartedAt: toFiniteNumber(archived.startedAt, null),
    windowEndedAt: toFiniteNumber(archived.endedAt, null),
    durationSec: Math.round(durationSec * 10) / 10,
    recentDamageSummary: {
      reasonKey: damage?.summary?.reasonKey || "no_recent_damage",
      damagedCellCount: Math.max(0, Math.floor(toFiniteNumber(damage?.summary?.damagedCellCount, 0))),
      criticalDamagedCount: Math.max(0, Math.floor(toFiniteNumber(damage?.summary?.criticalDamagedCount, 0)))
    },
    repairSummary: {
      reasonKey: repair?.summary?.reasonKey || "repair_no_target",
      damagedCellCount: Math.max(0, Math.floor(toFiniteNumber(repair?.summary?.damagedCellCount, 0))),
      activeTargetCount: Math.max(0, Math.floor(toFiniteNumber(repair?.summary?.activeTargetCount, 0)))
    },
    primarySources,
    worstAreas,
    defenseGaps,
    recommendation: recommendations[0] || null,
    recommendations,
    shortItems: trimmedShortItems
  };
}

function getCombatReview() {
  const now = state.time;
  if (combatReviewCache && now < combatReviewCache.sampledAt) {
    combatReviewCache = null;
  }
  if (
    combatReviewCache
    && now - combatReviewCache.sampledAt < COMBAT_REVIEW_SAMPLE_INTERVAL
  ) {
    return combatReviewCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(buildCombatReviewSnapshot());
  combatReviewCache = { sampledAt: now, value: snapshot };
  return snapshot;
}

function getCombatReviewItemText(item) {
  if (!item) return "";
  if (typeof item.text === "string" && item.text) return item.text;
  if (item.kind === "source") {
    const payload = item.payload || {};
    return `主要伤害来自${payload.label || "敌对火力"}。`;
  }
  if (item.kind === "worstArea") {
    const payload = item.payload || {};
    return `损坏最重：${payload.roleLabel || "结构区"}。`;
  }
  if (item.kind === "recommendation") {
    return `建议：${COMBAT_REVIEW_RECOMMENDATION_COPY[item.reasonKey] || "可考虑优先恢复关键战斗能力。"}`
  }
  return "复盘：本场战斗事件已记录。";
}

function buildCombatReviewSummaryHtml(review = getCombatReview()) {
  if (!review?.hasReview || !Array.isArray(review.shortItems) || review.shortItems.length <= 0) {
    return "";
  }
  const durationText = review.durationSec > 0 ? ` · 持续 ${Math.max(1, Math.round(review.durationSec))}s` : "";
  const itemsHtml = review.shortItems.slice(0, 4).map((item) => (
    `<div class="combat-review-item severity-${item.severity || "info"}" data-kind="${item.kind || "item"}" data-reason-key="${item.reasonKey || ""}">${getCombatReviewItemText(item)}</div>`
  )).join("");
  if (!itemsHtml) return "";
  return `<div class="combat-review-title">战斗复盘${durationText}</div>${itemsHtml}`;
}

function buildCombatDamageRepairSummaryHtml(damage = getRecentDamageSummary(), repair = getRepairStatusSummary()) {
  const lines = [];
  if (damage?.summary?.damagedCellCount > 0) {
    const primarySource = damage.recentSources?.[0] || null;
    const worst = damage.damagedCells?.[0] || null;
    const prefix = damage.summary.coreDamaged
      ? "受损：核心承压"
      : worst
        ? `受损：${worst.facilityName}最重`
        : `受损：${damage.summary.damagedCellCount} 处模块受损`;
    const tail = [];
    if (primarySource) tail.push(`主要来源 ${primarySource.label}`);
    if (damage.detachmentRisk?.severity !== "ok") tail.push("存在脱落风险");
    lines.push(
      `<div class="combat-status-line combat-status-damage severity-${damage.summary.severity}">${prefix}${tail.length ? ` · ${tail.join(" · ")}` : ""}</div>`
    );
  } else {
    lines.push('<div class="combat-status-line combat-status-damage">受损：暂无明显损伤</div>');
  }

  if (repair?.summary) {
    let text = "维修：状态未知";
    if (repair.summary.reasonKey === "repair_active") {
      text = repair.summary.activeTargetCount > 0
        ? `维修：无人机执行中 · ${repair.summary.activeTargetCount} 个目标`
        : "维修：覆盖正常，等待下一次受损";
    } else if (repair.summary.reasonKey === "repair_no_target") {
      text = "维修：当前无可修对象";
    } else if (repair.summary.reasonKey === "repair_no_power") {
      text = "维修：缺电停摆，未派出无人机";
    } else if (repair.summary.reasonKey === "repair_uncovered") {
      text = "维修：覆盖不足，部分受损区未纳入范围";
    } else if (repair.summary.reasonKey === "repair_missing") {
      text = "维修：无维修设施覆盖受损区";
    }
    lines.push(
      `<div class="combat-status-line combat-status-repair severity-${repair.summary.severity}">${text}</div>`
    );
  }

  return lines.join("");
}

function buildWeaponHudFragment(weapon = getWeaponEffectiveness()) {
  if (!weapon?.active) return "";
  const parts = [];
  const { turret, missile, shield, priorityTarget, summary } = weapon;
  if (priorityTarget?.valid) {
    parts.push(`已锁定 ${priorityTarget.enemyKindLabel}`);
  } else if (priorityTarget?.staleReasonKey === "priority_target_out_of_range") {
    parts.push("锁敌超距");
  }
  if (missile.canFireNow > 0) {
    parts.push(`齐射 ${missile.canFireNow}/${missile.salvoSize >= 999 ? missile.readyCount : missile.salvoSize}`);
  } else if (summary.primaryReasonKey === "missile_reloading" && missile.nextReloadSec != null) {
    parts.push(`导弹装填 ${Math.ceil(missile.nextReloadSec)}s`);
  } else if (summary.primaryReasonKey === "missile_no_resource") {
    parts.push("导弹资源不足");
  }
  if (summary.primaryReasonKey === "weapon_no_power") {
    parts.push("炮塔缺电");
  } else if (summary.primaryReasonKey === "all_turrets_los_blocked") {
    parts.push("炮塔全部被遮挡");
  }
  if (shield.statusKey === "shield_no_power") {
    parts.push("护盾缺电");
  }
  if (!parts.length) return "";
  return ` · <span class="weapon-effectiveness-chip severity-${summary.overallStatus}">${parts.join(" · ")}</span>`;
}

function buildCombatWeaponSummaryHtml(weapon = getWeaponEffectiveness()) {
  if (!weapon?.active) return "";
  const lines = [];
  const { turret, missile, shield, priorityTarget, summary } = weapon;
  if (summary.weaponTotal === 0) {
    lines.push('<div class="combat-status-line combat-status-gap">火力：当前无炮塔或导弹井</div>');
  } else if (summary.primaryReasonKey === "ready") {
    lines.push(`<div class="combat-status-line combat-status-weapon">火力：${summary.weaponReady}/${summary.weaponTotal} 就绪</div>`);
  } else {
    const copy = WEAPON_EFFECTIVENESS_COPY[summary.primaryReasonKey] || summary.primaryReasonKey;
    lines.push(`<div class="combat-status-line combat-status-weapon severity-${summary.overallStatus}">火力：${copy}</div>`);
  }
  if (missile.total > 0) {
    if (missile.canFireNow > 0) {
      lines.push(`<div class="combat-status-line">导弹：${missile.salvoLabel} · 可发射 ${missile.canFireNow}</div>`);
    } else if (missile.readyCount > 0 && missile.canFireNow === 0) {
      const reason = missile.noResourceBlock ? "资源不足" : "暂无可攻击目标";
      lines.push(`<div class="combat-status-line">导弹：就绪 ${missile.readyCount}/${missile.total} · ${reason}</div>`);
    } else if (missile.nextReloadSec != null) {
      lines.push(`<div class="combat-status-line">导弹：装填中 · 下一发 ${Math.ceil(missile.nextReloadSec)}s</div>`);
    }
  }
  if (priorityTarget) {
    if (priorityTarget.valid) {
      lines.push(`<div class="combat-status-line">锁敌：${priorityTarget.enemyKindLabel} ${priorityTarget.distance}m</div>`);
    } else if (priorityTarget.staleReasonKey === "priority_target_out_of_range") {
      lines.push('<div class="combat-status-line">锁敌：目标已脱离射程</div>');
    } else if (priorityTarget.staleReasonKey === "stale_target") {
      lines.push('<div class="combat-status-line">锁敌：目标已消失或即将过期</div>');
    }
  }
  if (shield.total > 0) {
    if (shield.statusKey === "shield_active") {
      lines.push(`<div class="combat-status-line">护盾：工作中 · ${shield.active}/${shield.total}</div>`);
    } else if (shield.statusKey === "shield_no_power") {
      lines.push('<div class="combat-status-line combat-status-gap">护盾：缺电失效</div>');
    } else if (shield.statusKey === "shield_broken") {
      lines.push('<div class="combat-status-line">护盾：充能恢复中</div>');
    }
  } else if (weapon.active) {
    lines.push('<div class="combat-status-line combat-status-gap">护盾：当前无护盾设施</div>');
  }
  return lines.join("");
}

function buildCombatStatusSummaryHtml(
  threat = getThreatSummary(),
  weapon = getWeaponEffectiveness(),
  damage = getRecentDamageSummary(),
  repair = getRepairStatusSummary()
) {
  const threatHtml = buildCombatThreatSummaryHtml(threat);
  const weaponHtml = buildCombatWeaponSummaryHtml(weapon);
  const damageRepairHtml = buildCombatDamageRepairSummaryHtml(damage, repair);
  return `${threatHtml}${weaponHtml}${damageRepairHtml}`;
}

function shouldSustainCombatAlert(reasonKey) {
  return reasonKey.startsWith("threat_")
    || reasonKey.startsWith("weapon_alert_")
    || reasonKey.startsWith("damage_repair_alert_");
}

function consumeCombatAlertCooldown(reasonKey, now, sustained, cooldownSec = WEAPON_EFFECTIVENESS_ALERT_COOLDOWN_SEC) {
  if (sustained) {
    designIssueAlertRuntime.activeKeys.add(reasonKey);
    designIssueAlertRuntime.lastRaisedAt.set(reasonKey, now);
    return true;
  }
  const wasActive = designIssueAlertRuntime.activeKeys.has(reasonKey)
    || shouldSustainCombatAlert(reasonKey) && designIssueAlertRuntime.lastRaisedAt.has(reasonKey);
  const lastRaisedAt = designIssueAlertRuntime.lastRaisedAt.get(reasonKey);
  if (!wasActive && Number.isFinite(lastRaisedAt) && now - lastRaisedAt < cooldownSec) {
    return false;
  }
  if (!wasActive) {
    designIssueAlertRuntime.lastRaisedAt.set(reasonKey, now);
  }
  designIssueAlertRuntime.activeKeys.add(reasonKey);
  return true;
}

function buildWeaponEffectivenessAlerts(weapon = getWeaponEffectiveness()) {
  const now = state.time;
  if (now < designIssueAlertRuntime.lastTime) {
    designIssueAlertRuntime.activeKeys.clear();
    designIssueAlertRuntime.lastRaisedAt.clear();
  }
  designIssueAlertRuntime.lastTime = now;

  if (!weapon?.active) return [];

  const alerts = [];
  const pushAlert = (reasonKey, text, level, sustained = false) => {
    const alertKey = `weapon_alert_${reasonKey}`;
    if (!consumeCombatAlertCooldown(alertKey, now, sustained)) return;
    alerts.push({ level, cssClass: "alert-weapon-effectiveness", text });
  };

  const threatLevel = getThreatSummary().threatLevel;
  const highPressure = threatLevel === "danger" || threatLevel === "critical";

  if (weapon.summary.primaryReasonKey === "weapon_no_power" && highPressure) {
    pushAlert("weapon_no_power", WEAPON_EFFECTIVENESS_COPY.weapon_no_power, "danger", true);
  } else if (weapon.summary.primaryReasonKey === "all_turrets_los_blocked" && highPressure) {
    pushAlert("all_turrets_los_blocked", WEAPON_EFFECTIVENESS_COPY.all_turrets_los_blocked, "warn", true);
  } else if (weapon.summary.primaryReasonKey === "missile_no_target" && highPressure) {
    pushAlert("missile_no_target", WEAPON_EFFECTIVENESS_COPY.missile_no_target, "warn", true);
  } else if (weapon.summary.primaryReasonKey === "missile_no_resource" && highPressure) {
    pushAlert("missile_no_resource", WEAPON_EFFECTIVENESS_COPY.missile_no_resource, "warn", true);
  }

  if (weapon.shield.statusKey === "shield_no_power" && highPressure) {
    pushAlert("shield_no_power", WEAPON_EFFECTIVENESS_COPY.shield_no_power, "danger", true);
  } else if (weapon.shield.statusKey === "shield_broken" && highPressure) {
    pushAlert("shield_broken", WEAPON_EFFECTIVENESS_COPY.shield_broken, "warn", true);
  } else if (weapon.shield.statusKey === "shield_missing" && threatLevel === "critical") {
    pushAlert("shield_missing", WEAPON_EFFECTIVENESS_COPY.shield_missing, "warn", true);
  }

  if (weapon.priorityTarget?.staleReasonKey === "priority_target_out_of_range" && highPressure) {
    pushAlert("priority_target_out_of_range", WEAPON_EFFECTIVENESS_COPY.priority_target_out_of_range, "warn", true);
  }

  return alerts.slice(0, COMBAT_WEAPON_ALERT_MAX);
}

function buildDamageRepairStatusAlerts(
  damage = getRecentDamageSummary(),
  repair = getRepairStatusSummary(),
  threat = getThreatSummary()
) {
  if (!damage?.summary || !repair?.summary) return [];
  const now = state.time;
  const highPressure = threat?.threatLevel === "danger" || threat?.threatLevel === "critical";
  const alerts = [];
  const pushAlert = (reasonKey, text, level, sustained = false) => {
    const alertKey = `damage_repair_alert_${reasonKey}`;
    if (!consumeCombatAlertCooldown(alertKey, now, sustained, COMBAT_DAMAGE_ALERT_COOLDOWN_SEC)) return;
    alerts.push({ level, cssClass: "alert-damage-repair", text });
  };

  if (damage.summary.coreDamaged) {
    pushAlert("core_low_hp", "核心受损：请优先保障供电与维修覆盖。", "danger", true);
  } else if (
    damage.summary.criticalDamagedCount > 0
    && (repair.summary.reasonKey === "repair_missing" || repair.summary.reasonKey === "repair_no_power")
  ) {
    pushAlert(
      "critical_no_repair",
      "严重受损且维修未在线，当前受损区可能继续扩大。",
      highPressure ? "danger" : "warn",
      highPressure
    );
  } else if (repair.summary.reasonKey === "repair_no_power" && repair.summary.damagedCellCount > 0) {
    pushAlert("repair_no_power", "维修站缺电，未派出无人机。", highPressure ? "danger" : "warn", highPressure);
  } else if (
    repair.summary.reasonKey === "repair_uncovered"
    && repair.summary.damagedCellCount >= 3
    && highPressure
  ) {
    pushAlert("repair_uncovered", "维修覆盖不足：部分受损区未被覆盖。", "warn", true);
  }

  return alerts.slice(0, COMBAT_DAMAGE_ALERT_MAX);
}

function buildThreatHudFragment(threat = getThreatSummary()) {
  if (!threat?.active || !threat.nearest) return "";
  const nearest = threat.nearest;
  const dirLabel = THREAT_DIRECTION_LABELS[nearest.direction] || "";
  const prefix = threat.threatLevel === "critical"
    ? "紧急"
    : threat.threatLevel === "danger"
      ? "警戒"
      : "留意";
  return ` · <span class="threat-chip severity-${threat.threatLevel}">${prefix}：威胁 ${threat.enemyCount} · 最近 ${nearest.kindLabel} ${nearest.distance}m ${nearest.arrow || ""} ${dirLabel}</span>`;
}

function buildCombatThreatSummaryHtml(threat = getThreatSummary()) {
  if (!threat) return "";
  if (!threat.active) {
    return '<div class="combat-status-line combat-status-safe">战斗：安全 · 暂无接近威胁</div>';
  }
  if (threat.enemyCount === 0) {
    return '<div class="combat-status-line combat-status-level severity-watch">战斗：留意 · 可能有敌袭接近</div>';
  }
  const lines = [];
  const levelLabel = {
    safe: "安全",
    watch: "留意",
    danger: "警戒",
    critical: "紧急"
  }[threat.threatLevel] || "留意";
  lines.push(`<div class="combat-status-line combat-status-level severity-${threat.threatLevel}">战斗：${levelLabel} · ${threat.enemyCount} 个敌对目标</div>`);
  if (threat.nearest) {
    const dirLabel = THREAT_DIRECTION_LABELS[threat.nearest.direction] || "";
    lines.push(
      `<div class="combat-status-line">最近：${threat.nearest.kindLabel} ${threat.nearest.distance}m ${threat.nearest.arrow || ""} ${dirLabel}接近</div>`
    );
  }
  if (threat.compositionText) {
    lines.push(`<div class="combat-status-line combat-status-composition">构成：${threat.compositionText}</div>`);
  }
  if (threat.flags?.noDefense && (threat.threatLevel === "danger" || threat.threatLevel === "critical")) {
    lines.push('<div class="combat-status-line combat-status-gap">短板：当前无有效火力或护盾</div>');
  } else if (threat.flags?.coreDamaged && threat.threatLevel === "critical") {
    lines.push('<div class="combat-status-line combat-status-gap">风险：核心附近承压</div>');
  }
  return lines.join("");
}

function buildThreatSummaryAlerts(threat = getThreatSummary()) {
  const now = state.time;
  if (now < designIssueAlertRuntime.lastTime) {
    designIssueAlertRuntime.activeKeys.clear();
    designIssueAlertRuntime.lastRaisedAt.clear();
  }
  designIssueAlertRuntime.lastTime = now;

  if (!threat?.active || !threat.nearest || threat.enemyCount === 0) {
    return [];
  }
  if (threat.threatLevel === "safe" || threat.threatLevel === "watch") {
    return [];
  }

  const reasonKey = `threat_${threat.threatLevel}_${threat.nearest.reasonKey || "nearest"}`;
  const isSustainedHighThreat = threat.threatLevel === "danger" || threat.threatLevel === "critical";
  if (!isSustainedHighThreat) {
    const wasActive = designIssueAlertRuntime.activeKeys.has(reasonKey);
    const lastRaisedAt = designIssueAlertRuntime.lastRaisedAt.get(reasonKey);
    if (!wasActive && Number.isFinite(lastRaisedAt) && now - lastRaisedAt < THREAT_ALERT_COOLDOWN_SEC) {
      return [];
    }
    if (!wasActive) {
      designIssueAlertRuntime.lastRaisedAt.set(reasonKey, now);
    }
  } else {
    designIssueAlertRuntime.lastRaisedAt.set(reasonKey, now);
  }
  designIssueAlertRuntime.activeKeys.add(reasonKey);

  const prefix = threat.threatLevel === "critical" ? "紧急：" : "警戒：";
  const dirLabel = THREAT_DIRECTION_LABELS[threat.nearest.direction] || "";
  const text = `${prefix}${threat.enemyCount} 个敌对目标 · 最近 ${threat.nearest.kindLabel} ${threat.nearest.distance}m ${dirLabel}接近`;
  return [{
    level: threat.threatLevel === "critical" ? "danger" : "warn",
    cssClass: "alert-threat-summary",
    text
  }];
}

function getStationDesignHealth() {
  const now = state.time;
  if (designHealthSnapshotCache && now < designHealthSnapshotCache.sampledAt) {
    designHealthSnapshotCache = null;
  }
  if (
    designHealthSnapshotCache
    && now - designHealthSnapshotCache.sampledAt < DESIGN_HEALTH_SAMPLE_INTERVAL
  ) {
    return designHealthSnapshotCache.value;
  }
  const snapshot = deepFreezeForDiagnostics(computeStationDesignHealthSnapshot());
  designHealthSnapshotCache = {
    sampledAt: now,
    value: snapshot
  };
  return snapshot;
}

function getResourceReachability() {
  return getStationDesignHealth().resourceReachability;
}

function getPowerMargin() {
  return getStationDesignHealth().powerMargin;
}

function computeStationDesignHealthSnapshot() {
  const stationCells = [...state.station.cells.values()].filter((cell) => !cell.detached);
  const frameMaxHp = TYPES.frame?.baseStats?.maxFrameHp || 0;
  const miningStatus = getMiningStationStatus();
  const miningInactiveCount = Math.max(0, miningStatus.miners.length - miningStatus.harvesting.length);
  const miningInactiveRatio = miningStatus.miners.length > 0
    ? miningInactiveCount / miningStatus.miners.length
    : 1;
  const resourceReachability = computeResourceReachabilitySnapshot(miningStatus);

  const thrusterCells = stationCells.filter((cell) => cell.facility === "thruster");
  const activeThrusterCount = thrusterCells.filter((cell) => cell.enabled && cell.active).length;
  const blockedThrusterCount = getBlockedThrusters().length;

  const turretCells = stationCells.filter((cell) => cell.facility === "turret");
  const missileCells = stationCells.filter((cell) => cell.facility === "missile");
  const activeTurretCount = turretCells.filter((cell) => cell.enabled && cell.active).length;
  const activeMissileCount = missileCells.filter((cell) => cell.enabled && cell.active).length;
  const activeWeaponCount = activeTurretCount + activeMissileCount;

  const shieldCells = stationCells.filter((cell) => cell.facility === "shield");
  const armorCells = stationCells.filter((cell) => cell.facility === "armor");
  const activeShieldCells = shieldCells.filter((cell) => cell.enabled && cell.active);
  const activeShieldCount = activeShieldCells.length;
  const recoveringShieldCount = activeShieldCells.filter((cell) => (cell.shield || 0) <= 0).length;

  const repairCells = stationCells.filter((cell) => cell.facility === "repair");
  const activeRepairCells = repairCells.filter((cell) => cell.enabled && cell.active);
  const damagedCells = stationCells.filter((cell) => {
    const frameHp = Number.isFinite(cell.frameHp) ? cell.frameHp : frameMaxHp;
    const hullDamaged = Number.isFinite(cell.hp) && Number.isFinite(cell.maxHp) && cell.hp < cell.maxHp;
    const frameDamaged = frameMaxHp > 0 && frameHp < frameMaxHp;
    return hullDamaged || frameDamaged;
  });
  let uncoveredDamagedCount = 0;
  if (damagedCells.length > 0) {
    for (const damagedCell of damagedCells) {
      const damagedPos = cellWorldPosition(damagedCell);
      const covered = activeRepairCells.some((repairCell) => {
        const range = getCellStat(repairCell, "range");
        return dist(cellWorldPosition(repairCell), damagedPos) <= range;
      });
      if (!covered) uncoveredDamagedCount++;
    }
  }

  const powerStarved = getInactiveDueToPower();
  const manualOffCount = getManualOffFacilities().length;
  const powerSnapshot = computePowerMarginSnapshot({
    powerStarved,
    manualOffCount,
    miningStatus,
    weaponCount: turretCells.length + missileCells.length,
    activeWeaponCount,
    shieldCount: shieldCells.length,
    activeShieldCount,
    repairCount: repairCells.length,
    activeRepairCount: activeRepairCells.length
  });
  const powerMargin = powerSnapshot.margin;
  const powerStarvedCount = powerSnapshot.starvedCount;

  let powerStatus = "good";
  let powerSummary = "电力余量充足";
  let powerReasonKey = "margin_safe";
  if (powerMargin < 0) {
    powerStatus = "bad";
    powerSummary = "电力出现赤字";
    powerReasonKey = "power_negative";
  } else if (powerStarvedCount >= 3 || powerSnapshot.coreCapabilityBlackout.length > 0) {
    powerStatus = "bad";
    powerSummary = "多处断电影响核心";
    powerReasonKey = powerSnapshot.coreCapabilityBlackout.length > 0 ? "core_capability_blackout" : "mass_blackout";
  } else if (powerMargin < 5 || powerStarvedCount > 0) {
    powerStatus = "warn";
    powerSummary = "电力紧张";
    powerReasonKey = powerStarvedCount > 0 ? "partial_blackout" : "margin_tight";
  }
  const powerEntry = createStationDesignHealthEntry(
    "power",
    powerStatus,
    powerSummary,
    `余量 ${powerMargin.toFixed(1)}，断电 ${powerStarvedCount}，手动关闭 ${manualOffCount}。`,
    powerReasonKey,
    {
      used: powerSnapshot.used,
      available: powerSnapshot.available,
      margin: powerSnapshot.margin,
      tight: powerSnapshot.tight,
      starvedCount: powerSnapshot.starvedCount,
      manualOffCount: powerSnapshot.manualOffCount,
      coreCapabilityBlackout: [...powerSnapshot.coreCapabilityBlackout]
    }
  );

  let miningStatusLevel = "good";
  let miningSummary = "采矿覆盖良好";
  let miningReasonKey = "mining_covered";
  if (miningStatus.miners.length === 0) {
    miningStatusLevel = "bad";
    miningSummary = "无有效采矿";
    miningReasonKey = "no_mining_station";
  } else if (miningStatus.harvesting.length === 0) {
    miningStatusLevel = "bad";
    miningSummary = "无有效采矿";
    miningReasonKey = resourceReachability.overall.allOutOfRange ? "all_miners_out_of_range" : "all_miners_not_harvesting";
  } else if (miningInactiveRatio >= 0.5) {
    miningStatusLevel = "warn";
    miningSummary = "采矿覆盖不足";
    miningReasonKey = "mining_partial_outage";
  }
  const miningEntry = createStationDesignHealthEntry(
    "mining",
    miningStatusLevel,
    miningSummary,
    `采矿站 ${miningStatus.miners.length}，有效 ${miningStatus.harvesting.length}，断电 ${miningStatus.inactivePower.length}。`,
    miningReasonKey,
    {
      minerCount: miningStatus.miners.length,
      activeCount: miningStatus.activeMiners.length,
      inactivePowerCount: miningStatus.inactivePower.length,
      manualOffCount: miningStatus.manualOff.length,
      harvestingCount: miningStatus.harvesting.length,
      inactiveRatio: miningInactiveRatio,
      coverageOk: miningStatus.harvesting.length > 0
    }
  );

  let thrustStatus = "good";
  let thrustSummary = "推进充足";
  let thrustReasonKey = "thrust_ready";
  if (activeThrusterCount === 0) {
    thrustStatus = "bad";
    thrustSummary = "缺少推进";
    thrustReasonKey = thrusterCells.length === 0 ? "no_thruster" : "all_thrusters_offline";
  } else if (activeThrusterCount === 1 || blockedThrusterCount > 0 || activeThrusterCount < thrusterCells.length) {
    thrustStatus = "warn";
    thrustSummary = "推进偏弱";
    if (blockedThrusterCount > 0) thrustReasonKey = "thruster_blocked";
    else if (activeThrusterCount === 1) thrustReasonKey = "single_thruster_online";
    else thrustReasonKey = "partial_thruster_offline";
  }
  const thrustEntry = createStationDesignHealthEntry(
    "thrust",
    thrustStatus,
    thrustSummary,
    `推进器 ${thrusterCells.length}，通电 ${activeThrusterCount}，喷口遮挡 ${blockedThrusterCount}。`,
    thrustReasonKey,
    {
      thrusterCount: thrusterCells.length,
      activeCount: activeThrusterCount,
      blockedCount: blockedThrusterCount
    }
  );

  let firepowerStatus = "good";
  let firepowerSummary = "火力充足";
  let firepowerReasonKey = "firepower_ready";
  if (activeWeaponCount === 0) {
    firepowerStatus = "bad";
    firepowerSummary = "缺少火力";
    firepowerReasonKey = turretCells.length + missileCells.length > 0 ? "all_weapons_offline" : "no_weapon_built";
  } else if (activeWeaponCount === 1 || (activeTurretCount === 0 && activeMissileCount > 0)) {
    firepowerStatus = "warn";
    firepowerSummary = "火力单一";
    firepowerReasonKey = activeTurretCount === 0 ? "missile_only_online" : "single_weapon_online";
  }
  const firepowerEntry = createStationDesignHealthEntry(
    "firepower",
    firepowerStatus,
    firepowerSummary,
    `炮塔 ${activeTurretCount}/${turretCells.length}，导弹井 ${activeMissileCount}/${missileCells.length}。`,
    firepowerReasonKey,
    {
      turretCount: turretCells.length,
      missileCount: missileCells.length,
      activeTurretCount,
      activeMissileCount,
      activeWeaponCount
    }
  );

  let defenseStatus = "good";
  let defenseSummary = "防御充足";
  let defenseReasonKey = "defense_ready";
  if (activeShieldCount === 0 && armorCells.length === 0) {
    defenseStatus = "bad";
    defenseSummary = "缺少防御";
    defenseReasonKey = "no_defense_layer";
  } else if (!(activeShieldCount >= 1 && armorCells.length >= 2 && recoveringShieldCount === 0)) {
    defenseStatus = "warn";
    defenseSummary = "防御偏薄";
    if (activeShieldCount === 0) defenseReasonKey = "shield_offline";
    else if (armorCells.length < 2) defenseReasonKey = "armor_insufficient";
    else defenseReasonKey = "shield_recovering";
  }
  const defenseEntry = createStationDesignHealthEntry(
    "defense",
    defenseStatus,
    defenseSummary,
    `护盾 ${activeShieldCount}/${shieldCells.length}，装甲 ${armorCells.length}，护盾恢复中 ${recoveringShieldCount}。`,
    defenseReasonKey,
    {
      shieldCount: shieldCells.length,
      armorCount: armorCells.length,
      activeShieldCount,
      recoveringShieldCount
    }
  );

  let repairStatus = "good";
  let repairSummary = "维修覆盖良好";
  let repairReasonKey = "repair_ready";
  if (repairCells.length === 0 && damagedCells.length > 0) {
    repairStatus = "bad";
    repairSummary = "无维修能力";
    repairReasonKey = "no_repair_with_damage";
  } else if (repairCells.length === 0) {
    repairStatus = "warn";
    repairSummary = "维修有缺口";
    repairReasonKey = "no_repair_station";
  } else if (activeRepairCells.length === 0) {
    repairStatus = "warn";
    repairSummary = "维修有缺口";
    repairReasonKey = "repair_offline";
  } else if (uncoveredDamagedCount > 0) {
    repairStatus = "warn";
    repairSummary = "维修有缺口";
    repairReasonKey = "damaged_out_of_repair_range";
  }
  const repairEntry = createStationDesignHealthEntry(
    "repair",
    repairStatus,
    repairSummary,
    `维修站 ${activeRepairCells.length}/${repairCells.length}，受损 ${damagedCells.length}，未覆盖 ${uncoveredDamagedCount}。`,
    repairReasonKey,
    {
      repairCount: repairCells.length,
      activeRepairCount: activeRepairCells.length,
      damagedCount: damagedCells.length,
      uncoveredDamagedCount
    }
  );

  const categories = [powerEntry, miningEntry, thrustEntry, firepowerEntry, defenseEntry, repairEntry];
  const shortItems = categories.map((entry) => ({
    key: entry.key === "firepower" ? "weapon" : entry.key,
    severity: entry.severity,
    reasonKey: entry.reasonKey || null,
    summary: entry.summary,
    detail: entry.detail,
    status: entry.status
  }));

  const criticalIssues = [];
  if (isEnemyPressureLikely() && (firepowerStatus === "bad" || defenseStatus === "bad")) {
    criticalIssues.push(createDesignIssue("enemy_incoming_no_defense", "critical", "enemy_incoming_no_defense", {
      firepowerStatus: firepowerEntry.status,
      defenseStatus: defenseEntry.status
    }));
  }
  if (powerSnapshot.severity === "critical") {
    criticalIssues.push(createDesignIssue("mass_blackout", "critical", powerReasonKey, {
      margin: powerSnapshot.margin,
      starvedCount: powerSnapshot.starvedCount,
      capabilityBlackout: [...powerSnapshot.coreCapabilityBlackout]
    }));
  }
  if (resourceReachability.overall.minerCount > 0 && resourceReachability.overall.allOutOfRange) {
    criticalIssues.push(createDesignIssue("mining_no_target", "critical", "all_miners_out_of_range", {
      minerCount: resourceReachability.overall.minerCount
    }));
  }
  if ((turretCells.length + missileCells.length) > 0 && activeWeaponCount === 0) {
    criticalIssues.push(createDesignIssue("weapons_offline", "critical", "all_weapons_offline", {
      weaponCount: turretCells.length + missileCells.length
    }));
  }
  if (shieldCells.length > 0 && activeShieldCount === 0) {
    criticalIssues.push(createDesignIssue("shield_offline", "critical", "shield_offline", {
      shieldCount: shieldCells.length
    }));
  }
  if ((repairStatus === "warn" || repairStatus === "bad") && damagedCells.length >= 3) {
    criticalIssues.push(createDesignIssue("repair_gap", "warning", repairReasonKey, {
      damagedCount: damagedCells.length,
      uncoveredDamagedCount
    }));
  }

  const dedupedIssues = [];
  const seenIssueKeys = new Set();
  for (const issue of criticalIssues) {
    if (seenIssueKeys.has(issue.key)) continue;
    seenIssueKeys.add(issue.key);
    dedupedIssues.push(issue);
  }
  dedupedIssues.sort((a, b) => (a.priority - b.priority) || a.key.localeCompare(b.key));

  return {
    generatedAt: state.time,
    schemaVersion: "v0.12.0-station-design-feedback",
    sampleInterval: DESIGN_HEALTH_SAMPLE_INTERVAL,
    power: powerEntry,
    mining: miningEntry,
    thrust: thrustEntry,
    firepower: firepowerEntry,
    weapon: firepowerEntry,
    defense: defenseEntry,
    repair: repairEntry,
    categories,
    shortItems,
    criticalIssues: dedupedIssues,
    resourceReachability,
    powerMargin: powerSnapshot,
    summary: {
      criticalCount: categories.filter((entry) => entry.status === "bad").length,
      warningCount: categories.filter((entry) => entry.status === "warn").length
    }
  };
}

function buildStationDesignHealthSummaryHtml(health = getStationDesignHealth()) {
  const categories = Array.isArray(health?.categories) ? health.categories : [];
  if (!categories.length) return "";
  const itemsHtml = categories.map((item) => {
    const statusLabel = STATION_DESIGN_HEALTH_STATUS_LABELS[item.status] || item.status;
    const reasonKey = item.reasonKey || "";
    return [
      `<div class="design-health-item is-${item.status}" data-design-key="${item.key}" data-status="${item.status}" data-reason-key="${reasonKey}">`,
      `<div class="design-health-main"><span class="design-health-label">${item.label}</span><span class="design-health-state">${statusLabel}</span></div>`,
      `<div class="design-health-summary-text">${item.summary}</div>`,
      `<div class="design-health-detail">${item.detail}</div>`,
      `</div>`
    ].join("");
  }).join("");
  return `<div class="design-health-title">空间站设计健康摘要</div>${itemsHtml}`;
}

function buildSelectedCellDiagnosticsHtml(diagnostics) {
  if (!diagnostics) return "";
  const lines = [];
  const { status, connection, power, range, weapon, shield, repair, facility } = diagnostics;

  if (status.detached) {
    lines.push({ severity: "critical", text: `连接：${SELECTED_DIAGNOSTICS_COPY.detached}` });
  } else {
    lines.push({
      severity: "ok",
      text: `连接：${SELECTED_DIAGNOSTICS_COPY.connected}（${connection.fragmentSize} 格）`
    });
  }

  const powerParts = [];
  if (power.powerOut > 0) powerParts.push(`${SELECTED_DIAGNOSTICS_COPY.power_out} +${power.powerOut}`);
  if (power.bonusPowerOut > 0) powerParts.push(`副产电 +${power.bonusPowerOut}`);
  if (power.powerUse > 0) powerParts.push(`${SELECTED_DIAGNOSTICS_COPY.power_use} ${power.powerUse}`);
  if (!powerParts.length) powerParts.push(SELECTED_DIAGNOSTICS_COPY.power_neutral);
  let powerSeverity = "ok";
  if (status.powerStarved) powerSeverity = "critical";
  else if (!status.active && power.powerUse > 0 && status.enabled) powerSeverity = "warning";
  lines.push({
    severity: powerSeverity,
    text: `电力：${powerParts.join(" · ")}${status.powerStarved ? ` · ${SELECTED_DIAGNOSTICS_COPY.power_starved}` : ""}`
  });

  if (facility === "mining" && range?.kind === "mining") {
    if (range.currentTarget) {
      const visual = RESOURCE_VISUAL[range.currentTarget.resource] || RESOURCE_VISUAL.ore;
      lines.push({
        severity: "ok",
        text: `采矿：${SELECTED_DIAGNOSTICS_COPY.harvesting} ${visual.label} @ ${range.currentTarget.bodyName}`
      });
    } else if (range.nearestHint) {
      const severity = range.nearestHint.inRange ? "warning" : "critical";
      const gapText = range.nearestHint.gap > 0
        ? `${SELECTED_DIAGNOSTICS_COPY.mining_standby_gap} ${range.nearestHint.gap}`
        : SELECTED_DIAGNOSTICS_COPY.mining_standby_empty;
      lines.push({
        severity,
        text: `采矿：${gapText}（${range.nearestHint.bodyName}）`
      });
    } else {
      lines.push({ severity: "warning", text: `采矿：${SELECTED_DIAGNOSTICS_COPY.mining_no_body}` });
    }
  }

  if (weapon) {
    let weaponText = SELECTED_DIAGNOSTICS_COPY[weapon.statusKey] || SELECTED_DIAGNOSTICS_COPY.weapon_boundary;
    let weaponSeverity = weapon.statusKey === "weapon_ready"
      ? "ok"
      : weapon.statusKey === "weapon_no_target" || weapon.statusKey === "weapon_los_blocked"
        ? "warning"
        : "critical";
    const weaponEffectiveness = getWeaponEffectiveness();
    const cellEntry = facility === "turret"
      ? weaponEffectiveness.turret.cells.find((entry) => entry.cellKey === diagnostics.cellKey)
      : weaponEffectiveness.missile.cells.find((entry) => entry.cellKey === diagnostics.cellKey);
    if (facility === "turret" && cellEntry) {
      if (cellEntry.statusKey === "weapon_ready" && cellEntry.targetKindLabel) {
        weaponText = `正在瞄准 ${cellEntry.targetKindLabel} · 目标 ${cellEntry.targetDistance}m / 射程 ${cellEntry.rangeText}`;
        weaponSeverity = "ok";
      } else if (cellEntry.statusKey === "weapon_los_blocked" && cellEntry.targetKindLabel) {
        weaponText = `目标 ${cellEntry.targetKindLabel} ${cellEntry.targetDistance}m · 射线被自机遮挡，不是武器损坏`;
      } else if (cellEntry.statusKey === "weapon_no_target") {
        weaponText = "当前无可攻击目标，等待敌人进入射程";
      } else if (cellEntry.statusKey === "weapon_no_power") {
        weaponText = "缺电停火，补供电或提高优先级";
      } else if (cellEntry.statusKey === "disabled_manual") {
        weaponText = "已手动关闭，开启后可参与战斗";
        weaponSeverity = "warning";
      }
    }
    if (facility === "missile" && cellEntry) {
      if (cellEntry.statusKey === "weapon_ready" && cellEntry.targetKindLabel) {
        weaponText = `目标 ${cellEntry.targetKindLabel} ${cellEntry.targetDistance}m / 射程 ${cellEntry.rangeText}`;
        weaponSeverity = "ok";
      } else if (cellEntry.statusKey === "missile_reloading") {
        weaponText = `装填中，下一发 ${Math.ceil(cellEntry.reload || 0)}s 后就绪`;
        weaponSeverity = "warning";
      } else if (cellEntry.statusKey === "missile_no_target") {
        weaponText = "就绪但当前无目标，等待敌人进入射程";
        weaponSeverity = "warning";
      } else if (cellEntry.statusKey === "weapon_no_power") {
        weaponText = "缺电停射，补供电后恢复";
      }
      const { missile, priorityTarget } = weaponEffectiveness;
      if (missile.total > 0) {
        const salvoHint = missile.canFireNow > 0
          ? `齐射 ${missile.salvoLabel} · 可发射 ${missile.canFireNow}`
          : missile.readyCount > 0
            ? `齐射 ${missile.salvoLabel} · 暂不可发射`
            : null;
        if (salvoHint) {
          lines.push({ severity: missile.canFireNow > 0 ? "ok" : "warning", text: `导弹：${salvoHint}` });
        }
      }
      if (priorityTarget?.valid) {
        lines.push({
          severity: "ok",
          text: `锁敌：已锁定 ${priorityTarget.enemyKindLabel} · 齐射将集火该目标`
        });
      } else if (priorityTarget?.staleReasonKey === "priority_target_out_of_range") {
        lines.push({ severity: "warning", text: "锁敌：目标已脱离射程" });
      } else if (priorityTarget?.staleReasonKey === "stale_target") {
        lines.push({ severity: "warning", text: "锁敌：目标已消失或即将过期" });
      }
    }
    lines.push({
      severity: weaponSeverity,
      text: `火力：${weaponText}${facility === "turret" && cellEntry?.rangeText && cellEntry.statusKey !== "weapon_ready" ? ` · 射程 ${cellEntry.rangeText}` : ""}`
    });
  }

  if (shield) {
    let shieldText = SELECTED_DIAGNOSTICS_COPY.shield_active;
    let shieldSeverity = "ok";
    if (shield.coverageStatus === "inactive") {
      shieldText = "缺电失效，补供电后恢复拦截";
      shieldSeverity = "critical";
    } else if (shield.coverageStatus === "recovering") {
      shieldText = "护盾值耗尽，正在恢复，期间拦截能力下降";
      shieldSeverity = "warning";
    } else {
      shieldText = "护盾可用，可减轻部分远程伤害，不保证完全拦截";
    }
    lines.push({
      severity: shieldSeverity,
      text: `护盾：${shieldText} · 范围 ${shield.range} · ${shield.shield}/${shield.maxShield}`
    });
  }

  if (facility === "armor") {
    lines.push({
      severity: diagnostics.hp.current <= diagnostics.hp.max * 0.35
        ? "critical"
        : diagnostics.hp.current < diagnostics.hp.max
          ? "warning"
          : "ok",
      text: `装甲：${SELECTED_DIAGNOSTICS_COPY.armor_note} · ${Math.ceil(diagnostics.hp.current)}/${Math.ceil(diagnostics.hp.max)}`
    });
  }

  if (repair) {
    let repairText = SELECTED_DIAGNOSTICS_COPY.repair_active;
    let repairSeverity = "ok";
    if (repair.coverageStatus === "inactive") {
      repairText = SELECTED_DIAGNOSTICS_COPY.repair_no_power;
      repairSeverity = "critical";
    } else if (repair.coverageStatus === "idle") {
      repairText = SELECTED_DIAGNOSTICS_COPY.repair_idle;
      repairSeverity = "warning";
    }
    lines.push({
      severity: repairSeverity,
      text: `维修：${repairText} · ${repair.repairRate}/s · 骨架 ${repair.frameRepairRate}/s`
    });
    const repairStatus = getRepairStatusSummary();
    const repairerEntry = repairStatus.repairers.find((entry) => entry.cellKey === diagnostics.cellKey);
    const activeDrone = repairStatus.drones.find(
      (entry) => entry.repairerKey === diagnostics.cellKey && !entry.returning
    );
    if (activeDrone && activeDrone.targetExists) {
      const targetLabel = activeDrone.targetFacilityName || activeDrone.targetFacility || "受损结构";
      const targetDistance = Number.isFinite(activeDrone.targetDistance) ? ` · ${activeDrone.targetDistance}m` : "";
      lines.push({
        severity: "ok",
        text: `维修目标：无人机前往 ${targetLabel}${targetDistance}`
      });
    } else if (repairStatus.summary.reasonKey === "repair_no_power") {
      lines.push({
        severity: "critical",
        text: "维修目标：缺电停摆，当前未派出无人机。"
      });
    } else if (
      repairStatus.summary.reasonKey === "repair_uncovered"
      && repairerEntry
      && repairerEntry.coveredDamagedCount <= 0
    ) {
      lines.push({
        severity: "warning",
        text: "维修目标：本站射程内无可修对象，需调整覆盖。"
      });
    } else if (repairStatus.summary.reasonKey === "repair_no_target") {
      lines.push({
        severity: "warning",
        text: "维修目标：当前无可修对象（仅状态提示，不承诺自动修复）。"
      });
    }
    if (repairerEntry) {
      lines.push({
        severity: repairerEntry.recentDispatchCount > 0 || repairerEntry.recentAppliedCount > 0 ? "ok" : "warning",
        text: `近 ${RECENT_DAMAGE_WINDOW_SEC} 秒派出 ${repairerEntry.recentDispatchCount} 次，完成 ${repairerEntry.recentAppliedCount} 次`
      });
    }
  }

  if (facility === "power" && power.powerOut > 0) {
    lines.push({
      severity: status.active ? "ok" : "warning",
      text: `供电：${SELECTED_DIAGNOSTICS_COPY.power_out} +${power.powerOut}${status.powerStarved ? " · 当前未运作" : ""}`
    });
  }

  if (status.nozzleBlocked) {
    lines.push({ severity: "critical", text: `推进：${SELECTED_DIAGNOSTICS_COPY.nozzle_blocked}` });
  }

  if (!lines.length) return "";
  return `<div class="selected-cell-diagnostics">${lines.map((line) =>
    `<div class="diag-line diag-${line.severity}">${line.text}</div>`
  ).join("")}</div>`;
}

function buildPlacementHintText(diagnostics) {
  if (!diagnostics) return "";
  const name = TYPES[diagnostics.facility]?.name || diagnostics.facility;
  const parts = [`放置预览：${name}`];
  if (!diagnostics.placement.valid) {
    const reason = PLACEMENT_DIAGNOSTICS_COPY[diagnostics.placement.reasonKey]
      || PLACEMENT_DIAGNOSTICS_COPY.placement_invalid;
    parts.push(reason);
    return parts.join(" · ");
  }
  parts.push(PLACEMENT_DIAGNOSTICS_COPY.can_place);
  if (!diagnostics.affordability.affordable) {
    const primary = diagnostics.affordability.missingResources.reduce(
      (best, item) => (item.gap > best.gap ? item : best),
      diagnostics.affordability.missingResources[0]
    );
    parts.push(`缺${shortResource(primary.name)} ${primary.gap}`);
  }
  if (diagnostics.rangeHint?.kind === "mining") {
    if (diagnostics.rangeHint.inRange) {
      parts.push(PLACEMENT_DIAGNOSTICS_COPY.mining_good);
    } else if (diagnostics.rangeHint.nearestBody) {
      parts.push(`${PLACEMENT_DIAGNOSTICS_COPY.mining_far}（还差 ${diagnostics.rangeHint.gap}）`);
    } else {
      parts.push(PLACEMENT_DIAGNOSTICS_COPY.out_of_mining_range);
    }
  }
  if (diagnostics.powerForecast.willCausePowerNegative) {
    parts.push(PLACEMENT_DIAGNOSTICS_COPY.power_negative);
  } else if (diagnostics.powerForecast.willCausePowerPressure) {
    parts.push(PLACEMENT_DIAGNOSTICS_COPY.power_pressure);
  } else {
    parts.push(`${PLACEMENT_DIAGNOSTICS_COPY.margin_after} ${Math.floor(diagnostics.powerForecast.marginAfter)}`);
  }
  const roleTipKey = diagnostics.placement.valid && diagnostics.affordability.affordable
    ? diagnostics.warnings.find((entry) =>
        entry === "weapon_tip" || entry === "shield_tip" || entry === "repair_tip" || entry === "power_tip"
      )
    : null;
  if (roleTipKey && PLACEMENT_DIAGNOSTICS_COPY[roleTipKey]) {
    parts.push(PLACEMENT_DIAGNOSTICS_COPY[roleTipKey]);
  }
  return parts.join(" · ");
}

function buildPlacementResourceGuideLine(diagnostics) {
  if (!diagnostics || diagnostics.facility !== "mining" || !diagnostics.placement.valid) return "";
  if (!diagnostics.rangeHint) {
    return `<div class="resource-line warn placement-info">放置预览：附近未发现可采资源外环。</div>`;
  }
  if (diagnostics.rangeHint.inRange) {
    const visual = RESOURCE_VISUAL[diagnostics.rangeHint.resource] || RESOURCE_VISUAL.ore;
    return `<div class="resource-line good placement-info">放置预览：靠近${visual.label}外环（${diagnostics.rangeHint.nearestBody}），覆盖良好。</div>`;
  }
  return `<div class="resource-line warn placement-warning">放置预览：距${diagnostics.rangeHint.nearestBody || "资源"}外环还差 ${diagnostics.rangeHint.gap}，当前位置采不到资源。</div>`;
}

function updatePlacementPreviewState() {
  if (!state.selectedBuild) {
    clearBuildHint();
    state.placementPreview = null;
    return;
  }
  if (state.selectedBuild === "frame") {
    state.placementPreview = null;
    updateBridgePreviewState();
    return;
  }
  state.bridgePreview = null;
  if (!state.input.mouseWorld) {
    state.placementPreview = null;
    clearBuildHint();
    return;
  }
  const grid = worldToGrid(state.input.mouseWorld);
  const diagnostics = getPlacementDiagnostics(state.selectedBuild, grid.x, grid.y);
  state.placementPreview = diagnostics;
  const hint = buildPlacementHintText(diagnostics);
  if (hint) setBuildHint(hint);
  else clearBuildHint();
}

function resolveSelectedCellArgForTest(cellKeyOrXY) {
  if (cellKeyOrXY == null) {
    return state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
  }
  if (typeof cellKeyOrXY === "string") {
    return state.station.cells.get(cellKeyOrXY) || null;
  }
  if (typeof cellKeyOrXY === "object" && Number.isFinite(cellKeyOrXY.x) && Number.isFinite(cellKeyOrXY.y)) {
    return state.station.cells.get(key(cellKeyOrXY.x, cellKeyOrXY.y)) || null;
  }
  return null;
}

function resolvePlacementArgsForTest(facilityOrGrid, gridX, gridY) {
  if (facilityOrGrid && typeof facilityOrGrid === "object" && !Array.isArray(facilityOrGrid)) {
    const options = facilityOrGrid;
    return getPlacementDiagnostics(
      options.facility || state.selectedBuild || "mining",
      Number.isFinite(options.gridX) ? options.gridX : 0,
      Number.isFinite(options.gridY) ? options.gridY : 0
    );
  }
  const facility = facilityOrGrid || state.selectedBuild || "mining";
  let x = gridX;
  let y = gridY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    if (state.input.mouseWorld) {
      const grid = worldToGrid(state.input.mouseWorld);
      x = grid.x;
      y = grid.y;
    } else {
      x = 0;
      y = 0;
    }
  }
  return getPlacementDiagnostics(facility, x, y);
}

function resolveGridArgForTest(gridKeyOrXY) {
  if (gridKeyOrXY == null) {
    if (state.input.mouseWorld) {
      const grid = worldToGrid(state.input.mouseWorld);
      return { x: grid.x, y: grid.y, gridKey: key(grid.x, grid.y) };
    }
    return { x: 0, y: 0, gridKey: key(0, 0) };
  }
  if (typeof gridKeyOrXY === "string") {
    const parsed = parseKey(gridKeyOrXY);
    return { x: parsed.x, y: parsed.y, gridKey: gridKeyOrXY };
  }
  if (typeof gridKeyOrXY === "object" && Number.isFinite(gridKeyOrXY.x) && Number.isFinite(gridKeyOrXY.y)) {
    return { x: gridKeyOrXY.x, y: gridKeyOrXY.y, gridKey: key(gridKeyOrXY.x, gridKeyOrXY.y) };
  }
  return { x: 0, y: 0, gridKey: key(0, 0) };
}

function getGridWorldCenterForTest(gridX, gridY) {
  return cellWorldPosition({ x: gridX, y: gridY, detached: false });
}

function isGridWorldPointVisible(world) {
  if (!renderer) return false;
  const screen = renderer.worldToScreen(world);
  return screen.deviceX >= 0
    && screen.deviceX <= renderer.width
    && screen.deviceY >= 0
    && screen.deviceY <= renderer.height;
}

function getGridCellSnapshotForTest(gridX, gridY) {
  const gridKey = key(gridX, gridY);
  const cell = state.station.cells.get(gridKey);
  return {
    gridKey,
    gridX,
    gridY,
    exists: !!cell,
    facility: cell?.facility ?? null,
    detached: cell?.detached ?? false,
    active: cell?.active ?? false
  };
}

function getViewportDiagnosticsForTest() {
  if (!renderer) return null;
  return {
    deviceWidth: renderer.width,
    deviceHeight: renderer.height,
    dpr: renderer.dpr,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

function getCameraDiagnosticsForTest() {
  return {
    x: state.camera.x,
    y: state.camera.y,
    shakeX: state.camera.shakeX || 0,
    shakeY: state.camera.shakeY || 0,
    zoom: state.camera.zoom
  };
}

function buildGridInteractionDiagnostics(gridKeyOrXY, options = {}) {
  const { x, y, gridKey } = resolveGridArgForTest(gridKeyOrXY);
  const world = getGridWorldCenterForTest(x, y);
  const screen = renderer ? renderer.worldToScreen(world) : null;
  const cellSnapshot = getGridCellSnapshotForTest(x, y);
  const selectedBuild = options.facility ?? state.selectedBuild ?? null;
  const placement = selectedBuild
    ? getPlacementDiagnostics(selectedBuild, x, y)
    : null;
  return {
    gridKey,
    gridX: x,
    gridY: y,
    world,
    screen: screen
      ? {
        clientX: screen.clientX,
        clientY: screen.clientY,
        deviceX: screen.deviceX,
        deviceY: screen.deviceY
      }
      : null,
    viewport: getViewportDiagnosticsForTest(),
    visible: isGridWorldPointVisible(world),
    cell: cellSnapshot,
    selectedBuild,
    selectedCell: state.selectedCell || null,
    placement,
    clickPath: {
      screenInput: screen ? { x: screen.clientX, y: screen.clientY } : null,
      resolvedWorld: world,
      resolvedGrid: { x, y, gridKey },
      wouldCallBuildAt: !!selectedBuild
    },
    camera: getCameraDiagnosticsForTest(),
    lastBuildError: state.lastBuildError || null,
    buildHint: state.buildHint || null
  };
}

function buildGridScreenPointDiagnostics(gridKeyOrXY) {
  const { x, y, gridKey } = resolveGridArgForTest(gridKeyOrXY);
  const world = getGridWorldCenterForTest(x, y);
  const screen = renderer ? renderer.worldToScreen(world) : null;
  return {
    gridKey,
    gridX: x,
    gridY: y,
    world,
    clientX: screen?.clientX ?? null,
    clientY: screen?.clientY ?? null,
    deviceX: screen?.deviceX ?? null,
    deviceY: screen?.deviceY ?? null,
    visible: isGridWorldPointVisible(world),
    viewport: getViewportDiagnosticsForTest(),
    camera: getCameraDiagnosticsForTest()
  };
}

function buildPointerGridDiagnostics(screenPoint) {
  const hasScreen = screenPoint && Number.isFinite(screenPoint.x) && Number.isFinite(screenPoint.y);
  const screen = hasScreen ? { x: screenPoint.x, y: screenPoint.y } : null;
  const inputSource = screen ? "screen" : "mouseWorld";
  const world = screen
    ? (renderer ? renderer.screenToWorld(screen) : null)
    : state.input.mouseWorld;
  if (!world) {
    return {
      inputSource,
      screen,
      world: null,
      grid: null,
      gridKey: null,
      error: "no_pointer_position"
    };
  }
  const grid = worldToGrid(world);
  const gridKey = key(grid.x, grid.y);
  const cell = state.station.cells.get(gridKey);
  const roundTrip = buildGridScreenPointDiagnostics(grid);
  const roundTripScreen = roundTrip.clientX != null
    ? { x: roundTrip.clientX, y: roundTrip.clientY }
    : null;
  return {
    inputSource,
    screen,
    world: { x: world.x, y: world.y },
    grid,
    gridKey,
    cell: cell
      ? {
        facility: cell.facility,
        detached: cell.detached,
        active: cell.active
      }
      : null,
    selectedBuild: state.selectedBuild || null,
    placement: state.selectedBuild
      ? getPlacementDiagnostics(state.selectedBuild, grid.x, grid.y)
      : null,
    roundTripFromGridCenter: {
      clientX: roundTrip.clientX,
      clientY: roundTrip.clientY,
      deltaFromInput: screen && roundTripScreen
        ? {
          dx: screen.x - roundTripScreen.x,
          dy: screen.y - roundTripScreen.y,
          distance: Math.hypot(screen.x - roundTripScreen.x, screen.y - roundTripScreen.y)
        }
        : null
    },
    handleCanvasClickWouldResolve: {
      gridKey,
      gridX: grid.x,
      gridY: grid.y,
      wouldBuild: !!state.selectedBuild,
      facility: state.selectedBuild || null
    },
    viewport: getViewportDiagnosticsForTest(),
    camera: getCameraDiagnosticsForTest()
  };
}

function buildGridClickAlignmentDiagnostics(targetGridKeyOrXY, screenPoint) {
  const target = buildGridScreenPointDiagnostics(targetGridKeyOrXY);
  const pointer = buildPointerGridDiagnostics(screenPoint);
  const hasScreen = screenPoint && Number.isFinite(screenPoint.x) && Number.isFinite(screenPoint.y);
  const screenDelta = hasScreen && target.clientX != null
    ? {
      dx: screenPoint.x - target.clientX,
      dy: screenPoint.y - target.clientY,
      distance: Math.hypot(screenPoint.x - target.clientX, screenPoint.y - target.clientY)
    }
    : null;
  return {
    targetGridKey: target.gridKey,
    pointerGridKey: pointer.gridKey ?? null,
    aligned: !!pointer.gridKey && target.gridKey === pointer.gridKey,
    screenDelta,
    target,
    pointer
  };
}

function buildFacilityCardInnerHtml(entry) {
  const costSummary = formatBuildPaletteCostSummary(entry.cost, entry.baseCost);
  const powerText = formatBuildPalettePowerText(entry.powerImpact);
  const bonusTag = entry.costAdjusted ? `<span class="facility-card-bonus">已受加成</span>` : "";
  const tipClass = entry.tipText.startsWith("警告")
    ? " is-warning"
    : entry.tipText.startsWith("推荐")
      ? " is-recommend"
      : "";
  const tipHtml = entry.tipText
    ? `<span class="facility-card-tip${tipClass}">${entry.tipText}</span>`
    : "";

  return [
    `<span class="facility-card-header">`,
    `<span class="facility-card-role">${entry.roleLabel}</span>`,
    `<span class="facility-card-name">${entry.name}</span>`,
    `<span class="facility-card-count">x${entry.count}</span>`,
    `</span>`,
    `<span class="facility-card-purpose">${entry.purpose}</span>`,
    `<span class="facility-card-meta">`,
    `<span class="facility-card-cost">${costSummary}${bonusTag}</span>`,
    `<span class="facility-card-power">${powerText}</span>`,
    `</span>`,
    `<span class="facility-card-status">${entry.statusText}</span>`,
    tipHtml
  ].join("");
}

function applyBuildPaletteEntryToButton(button, entry) {
  const costSummary = formatBuildPaletteCostSummary(entry.cost, entry.baseCost);
  button.dataset.role = entry.role;
  button.dataset.affordable = entry.affordable ? "true" : "false";
  button.dataset.count = String(entry.count);
  button.dataset.powerNet = String(entry.powerImpact.netDelta);
  button.dataset.costSummary = costSummary;
  button.dataset.status = entry.statusText;
  button.dataset.purpose = entry.purpose;
  button.className = "build-button facility-card";
  button.classList.add(`role-${entry.role}`);
  button.classList.toggle("is-affordable", entry.affordable);
  button.classList.toggle("is-unaffordable", !entry.affordable);
  button.classList.toggle("has-power-risk", entry.powerRiskAfterBuild || entry.powerTightAfterBuild);
  button.classList.toggle("is-recommended", entry.recommendation?.priority === "high" || entry.tipText.startsWith("推荐"));
  button.classList.toggle("has-critical-warning", entry.tipText.startsWith("警告"));
  button.innerHTML = buildFacilityCardInnerHtml(entry);
}

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
    button.className = "build-button facility-card";
    button.dataset.type = type;
    button.innerHTML = `<span class="facility-card-name">${def.name}</span>`;
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
    if (state.run.settlementShown) {
      showToast("请先在结算面板选择行动。");
      return;
    }
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
  document.getElementById("metaPanelToggle")?.addEventListener("click", () => toggleMetaPanel(!isMetaPanelOpen()));
  document.getElementById("playersBtn").addEventListener("click", () => window.gameActions.setPlayers());
  document.getElementById("objectiveJumpBtn").addEventListener("click", () => window.gameActions.jumpToNextGalaxy());
  document.getElementById("objectiveStayBtn").addEventListener("click", () => window.gameActions.stayInCurrentGalaxy());
  document.getElementById("objectiveJumpDeferredBtn").addEventListener("click", () => window.gameActions.jumpToNextGalaxy());
  document.getElementById("summaryRestartBtn")?.addEventListener("click", () => window.gameActions.startNewRun());
  document.getElementById("summaryStayBtn")?.addEventListener("click", () => window.gameActions.stayInEndgame());
  quickRestartBtnEl?.addEventListener("click", () => window.gameActions.startNewRun());
}

function updateBuildButtons() {
  const palette = getBuildPaletteDiagnostics();
  for (const button of buildButtonsEl.querySelectorAll("button")) {
    if (!button.dataset.type) {
      button.classList.toggle("active", state.selectedBuild === null);
      continue;
    }
    const entry = palette.facilities.find((facility) => facility.id === button.dataset.type);
    if (entry) applyBuildPaletteEntryToButton(button, entry);
    button.classList.toggle("active", button.dataset.type === state.selectedBuild);
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
  return state.world.bodies.filter((body) => body.resource && body.amount > 0);
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
    const body = state.world.bodies.find((candidate) => candidate.amount > 0 && dist(position, candidate) < getMiningRange(candidate));
    if (body) harvesting.push({ cell, body, resource: body.resource });
  }
  return { miners, activeMiners, inactivePower, manualOff, harvesting };
}

function getMiningCellTarget(cell) {
  if (!cell || cell.facility !== "mining" || cell.detached) return null;
  const position = cellWorldPosition(cell);
  const body = state.world.bodies.find((candidate) => candidate.amount > 0 && dist(position, candidate) < getMiningRange(candidate));
  if (!body) return null;
  return { body, distance: dist(position, body), range: getMiningRange(body) };
}

function isEndgameFreePlayActive() {
  return state.run.endgame && state.run.guardianDefeated && state.run.endgameExplore;
}

function awardEndgameActivityPoints(amount) {
  if (!isEndgameFreePlayActive() || amount <= 0) return;
  state.run.endgameActivityFraction += amount;
  const gained = Math.floor(state.run.endgameActivityFraction);
  if (gained <= 0) return;
  state.run.endgameActivityFraction -= gained;
  state.run.endgameActivityPoints += gained;
  grantMetaPoints(gained);
}

function enemyActivityPointReward(kind) {
  return ENDGAME_ACTIVITY_POINTS.enemy[kind] || 0;
}

function bindInput() {
  if (!state.galaxyEscapeBound) {
    state.galaxyEscapeBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!isGalaxyMapPanelOpen()) return;
      event.stopPropagation();
      event.preventDefault();
      cancelGalaxyJump();
    }, true);
  }

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button === 2) {
      state.input.aimingRightButton = true;
      const world = renderer.screenToWorld({ x: event.clientX, y: event.clientY });
      handleRightClick(world);
      event.preventDefault();
      return;
    }
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
    if (event.button === 2) {
      state.input.aimingRightButton = false;
      event.preventDefault();
      return;
    }
    if (!state.drag || state.drag.id !== event.pointerId) return;
    const wasClick = !state.drag.moved;
    state.drag = null;
    if (wasClick) {
      handleCanvasClick({ x: event.clientX, y: event.clientY });
    }
  });

  canvas.addEventListener("pointercancel", () => {
    state.drag = null;
    state.input.aimingRightButton = false;
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
      if (isGalaxyMapPanelOpen()) return;
      const activeMain = getActiveMainPanel();
      if (activeMain === "runSettlement") {
        showToast("请通过按钮关闭结算面板。");
        return;
      }
      if (activeMain === "meta") {
        toggleMetaPanel(false);
        event.preventDefault();
        return;
      }
      if (activeMain === "researchTree") {
        toggleResearchTree(false);
        event.preventDefault();
        return;
      }
      if (state.run.awaitingObjectiveChoice && isObjectiveComplete() && !state.run.settlementShown) {
        state.run.awaitingObjectiveChoice = false;
        state.run.objectiveChoiceDismissed = true;
        updateObjectiveChoiceUi();
        event.preventDefault();
        return;
      }
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
    } else if (
      !(document.activeElement && document.activeElement.tagName === "INPUT") &&
      (key === "f" || event.key === "[" || event.key === "【" || event.key === "]" || event.key === "】")
    ) {
      if (key === "f") {
        fireMissiles();
        event.preventDefault();
      } else if (event.key === "[" || event.key === "【") {
        adjustSalvoSize(-1);
        event.preventDefault();
      } else if (event.key === "]" || event.key === "】") {
        adjustSalvoSize(+1);
        event.preventDefault();
      }
    } else if (
      !(document.activeElement && document.activeElement.tagName === "INPUT") &&
      (key === "t" || key === "y")
    ) {
      // v0.8.0 trader 快捷键：T=基础交易（50 金属 -> 1 等离子），Y=高级交易（100 金属 -> 3 科研）。
      for (const enc of state.run.encounters || []) {
        if (enc.type !== "trader" || enc.completed || enc.failed || enc.expired) continue;
        if (enc.encounterData?.playerInTradeRange) {
          performTraderTrade(enc, key === "y" ? 2 : 1);
          event.preventDefault();
          return;
        }
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

function cellWorldPositionByTransform(cell, transform, localOffset = { x: 0, y: 0 }) {
  const origin = transform.origin || { x: 0, y: 0 };
  const local = rotate(
    {
      x: (cell.x - origin.x) * CELL + localOffset.x,
      y: (cell.y - origin.y) * CELL + localOffset.y
    },
    transform.angle
  );
  return { x: transform.pos.x + local.x, y: transform.pos.y + local.y };
}

function fragmentCellWorldPosition(fragment, cell) {
  return cellWorldPositionByTransform(
    cell,
    { pos: fragment.pos, angle: fragment.angle, origin: fragment.centerGrid }
  );
}

function computeFragmentBounds(cells) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const cell of cells.values()) {
    minX = Math.min(minX, cell.x);
    maxX = Math.max(maxX, cell.x);
    minY = Math.min(minY, cell.y);
    maxY = Math.max(maxY, cell.y);
  }
  if (!cells.size) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}

function computeFragmentEdgeKeys(cells) {
  const edgeKeys = new Set();
  for (const cell of cells.values()) {
    const cellKey = key(cell.x, cell.y);
    for (const n of neighbors(cell.x, cell.y)) {
      if (!cells.has(key(n.x, n.y))) {
        edgeKeys.add(cellKey);
        break;
      }
    }
  }
  return edgeKeys;
}

function countFragmentCells() {
  let total = 0;
  for (const fragment of state.fragments) total += fragment.cells.size;
  return total;
}

function countPlayerFragments() {
  return state.fragments.filter((fragment) => (fragment.origin || "player") === "player").length;
}

function countWreckFragments() {
  return state.fragments.filter((fragment) => fragment.origin === "wreck").length;
}

function countEnemyWreckFragments() {
  return state.fragments.filter((fragment) => fragment.origin === "enemy-wreck").length;
}

function countDerelictFragments() {
  return state.fragments.filter((fragment) => fragment.origin === "derelict").length;
}

function countSignalFragments() {
  return state.fragments.filter((fragment) => fragment.origin === "signal").length;
}

function isWreckLikeOrigin(origin) {
  return origin === "wreck" || origin === "enemy-wreck";
}

function pickWreckFacilityWithWeights(rng, weights) {
  let total = 0;
  for (const [, weight] of weights) total += weight;
  let roll = rng() * total;
  for (const [facility, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return facility;
  }
  return weights[0][0];
}

function pickWreckFacility(rng) {
  return pickWreckFacilityWithWeights(rng, WRECK_FACILITY_WEIGHTS);
}

function pickEnemyWreckFacility(rng) {
  return pickWreckFacilityWithWeights(rng, ENEMY_WRECK_FACILITY_WEIGHTS);
}

function buildWreckShape(rng, cellCountRange) {
  const cellCount = cellCountRange
    ? rngInt(rng, cellCountRange.min, cellCountRange.max)
    : rngInt(rng, 2, 5);
  const cells = [{ x: 0, y: 0 }];
  const occupied = new Set(["0,0"]);
  const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  while (cells.length < cellCount) {
    const base = cells[rngInt(rng, 0, cells.length - 1)];
    const dir = dirs[rngInt(rng, 0, dirs.length - 1)];
    const next = { x: base.x + dir.x, y: base.y + dir.y };
    const nextKey = `${next.x},${next.y}`;
    if (occupied.has(nextKey)) continue;
    occupied.add(nextKey);
    cells.push(next);
  }
  return cells;
}

function createWreckCell(x, y, facility, rng) {
  const cell = createCell(x, y, facility);
  ensureCellUpgradeFields(cell);
  cell.hp = cell.maxHp * rngFloat(rng, 0.65, 0.9);
  cell.frameHp = TYPES.frame.baseStats.maxFrameHp * getMetaEffect("hullIntegrity") * rngFloat(rng, 0.8, 1.0);
  cell.reload = 0;
  cell.fire = 0;
  cell.enabled = true;
  cell.active = facility === "armor";
  return cell;
}

function makeWreckFragment(pos, rng, options = {}) {
  const facilityWeights = options.weights || WRECK_FACILITY_WEIGHTS;
  const pickFacility = options.weights === ENEMY_WRECK_FACILITY_WEIGHTS
    ? pickEnemyWreckFacility
    : (r) => pickWreckFacilityWithWeights(r, facilityWeights);
  const shape = buildWreckShape(rng, options.cellCountRange);
  const cells = new Map();
  for (const slot of shape) {
    const facility = pickFacility(rng);
    cells.set(key(slot.x, slot.y), createWreckCell(slot.x, slot.y, facility, rng));
  }
  const centerGrid = shape.reduce(
    (acc, slot) => ({ x: acc.x + slot.x, y: acc.y + slot.y }),
    { x: 0, y: 0 }
  );
  centerGrid.x /= shape.length;
  centerGrid.y /= shape.length;
  const launchSpeed = rngFloat(rng, WRECK_LAUNCH_SPEED_MIN, WRECK_LAUNCH_SPEED_MAX);
  const launchAngle = rngFloat(rng, 0, Math.PI * 2);
  const vel = {
    x: Math.cos(launchAngle) * launchSpeed + rngFloat(rng, -WRECK_LAUNCH_JITTER, WRECK_LAUNCH_JITTER),
    y: Math.sin(launchAngle) * launchSpeed + rngFloat(rng, -WRECK_LAUNCH_JITTER, WRECK_LAUNCH_JITTER)
  };
  clampVectorLength(vel, FRAGMENT_MAX_LINEAR_SPEED);
  const angularVel = clamp(
    rngFloat(rng, WRECK_ANGULAR_VEL_MIN, WRECK_ANGULAR_VEL_MAX)
      + rngFloat(rng, -WRECK_ANGULAR_JITTER, WRECK_ANGULAR_JITTER),
    WRECK_ANGULAR_VEL_MIN,
    WRECK_ANGULAR_VEL_MAX
  );
  return {
    id: fragmentIdSeed++,
    pos: { x: pos.x, y: pos.y },
    vel,
    angle: rngFloat(rng, -Math.PI, Math.PI),
    angularVel,
    cells,
    edgeKeys: computeFragmentEdgeKeys(cells),
    bounds: computeFragmentBounds(cells),
    centerGrid,
    spawnAt: state.time,
    warnedNearBoundary: false,
    origin: options.origin || "wreck"
  };
}

function isWreckSpawnPositionValid(candidate, startPos, placed, bodies) {
  const distFromStart = dist(candidate, startPos);
  if (distFromStart < WRECK_SPAWN_DIST_MIN || distFromStart > WRECK_SPAWN_DIST_MAX) return false;
  for (const existing of placed) {
    if (dist(candidate, existing) < WRECK_MIN_SEPARATION) return false;
  }
  for (const body of bodies) {
    if (body.type === "planet" || body.type === "star") {
      if (dist(candidate, body) < body.r + WRECK_PLANET_BUFFER) return false;
    } else if (body.type === "asteroid") {
      if (dist(candidate, body) < body.r + WRECK_ASTEROID_BUFFER) return false;
    }
  }
  return true;
}

function seedSalvageFragments(galaxy, count, rng) {
  if (!count || count <= 0) return 0;
  const bounds = galaxy?.bounds || GALAXY_WORLD_BOUNDS;
  const startPos = galaxy?.stationSpawn || state.station.pos;
  const bodies = state.world?.bodies || [];
  const placed = [];
  let spawned = 0;
  for (let i = 0; i < count; i++) {
    if (countWreckFragments() >= WRECK_FRAGMENT_MAX_COUNT) break;
    let pos = null;
    for (let tries = 0; tries < 5; tries++) {
      const angle = rngFloat(rng, 0, Math.PI * 2);
      const radius = rngFloat(rng, WRECK_SPAWN_DIST_MIN, WRECK_SPAWN_DIST_MAX);
      const candidate = {
        x: startPos.x + Math.cos(angle) * radius,
        y: startPos.y + Math.sin(angle) * radius
      };
      if (candidate.x < bounds.minX + 80 || candidate.x > bounds.maxX - 80) continue;
      if (candidate.y < bounds.minY + 80 || candidate.y > bounds.maxY - 80) continue;
      if (!isWreckSpawnPositionValid(candidate, startPos, placed, bodies)) continue;
      pos = candidate;
      break;
    }
    if (!pos) continue;
    placed.push(pos);
    state.fragments.push(makeWreckFragment(pos, rng));
    spawned++;
  }
  return spawned;
}

function getEscortJumpExit(galaxy = state.galaxy) {
  const startPos = galaxy?.stationSpawn || state.station.pos;
  return { x: -startPos.x, y: -startPos.y };
}

function getEscortNpcHp(level) {
  const idx = levelIndex(level);
  return NPC_HP_BY_LEVEL[idx] || 300;
}

function createEscortNpc(startPos, targetPos, rng, level) {
  const toTarget = normalize({ x: targetPos.x - startPos.x, y: targetPos.y - startPos.y });
  const maxHp = getEscortNpcHp(level);
  return {
    id: ++npcIdSeed,
    kind: "friendly-cargo",
    role: "objective",
    encounterId: null,
    pos: { x: startPos.x, y: startPos.y },
    vel: { x: 0, y: 0 },
    angle: Math.atan2(toTarget.y, toTarget.x),
    hp: maxHp,
    maxHp,
    target: { x: targetPos.x, y: targetPos.y },
    radius: NPC_RADIUS,
    hudColor: [0.35, 0.85, 0.78, 1],
    speed: rngFloat(rng, 35, 45),
    arrived: false,
    destroyed: false,
    collisionCooldown: 0,
    spawnAt: state.time
  };
}

// v0.8.0：ENCOUNTER NPC 工厂（trader / distress-pilot / pirate-ambush）
// 与 createEscortNpc 字段集对齐，仅在 role / encounterId / kind / 默认数值上区分。
function createEncounterNpc(kind, encounterId, options = {}) {
  const id = options.id != null ? options.id : ++npcIdSeed;
  const radius = Number.isFinite(options.radius) ? options.radius : NPC_RADIUS;
  const maxHp = Number.isFinite(options.maxHp)
    ? options.maxHp
    : Number.isFinite(options.hp) ? options.hp : 60;
  const hp = Number.isFinite(options.hp) ? options.hp : maxHp;
  const speed = Number.isFinite(options.speed) ? options.speed : 80;
  const angle = Number.isFinite(options.angle) ? options.angle : 0;
  const pos = options.pos ? { x: options.pos.x, y: options.pos.y } : { x: 0, y: 0 };
  const vel = options.vel ? { x: options.vel.x, y: options.vel.y } : { x: 0, y: 0 };
  const target = options.target ? { x: options.target.x, y: options.target.y } : null;
  return {
    id,
    kind,
    role: "encounter",
    encounterId,
    pos,
    vel,
    angle,
    hp,
    maxHp,
    target,
    radius,
    hudColor: options.hudColor || [0.35, 0.85, 0.78, 1],
    speed,
    arrived: false,
    destroyed: false,
    collisionCooldown: 0,
    spawnAt: state.time
  };
}

function seedEscortNpc(galaxy, rng, level) {
  const stationStart = galaxy?.stationSpawn || state.station.pos;
  const jumpExit = getEscortJumpExit(galaxy);
  const awayFromExit = normalize({ x: stationStart.x - jumpExit.x, y: stationStart.y - jumpExit.y });
  const offset = rngFloat(rng, ESCORT_START_OFFSET_MIN, ESCORT_START_OFFSET_MAX);
  let npcStart = {
    x: stationStart.x + awayFromExit.x * offset,
    y: stationStart.y + awayFromExit.y * offset
  };
  let journey = dist(npcStart, jumpExit);
  if (journey < ESCORT_JOURNEY_MIN || journey > ESCORT_JOURNEY_MAX) {
    const desired = rngFloat(rng, ESCORT_JOURNEY_MIN, ESCORT_JOURNEY_MAX);
    const dirToExit = normalize({ x: jumpExit.x - npcStart.x, y: jumpExit.y - npcStart.y });
    npcStart = {
      x: jumpExit.x - dirToExit.x * desired,
      y: jumpExit.y - dirToExit.y * desired
    };
  }
  const npc = createEscortNpc(npcStart, jumpExit, rng, level);
  state.npcs.push(npc);
  return npc;
}

function damageNpc(npc, amount) {
  if (!npc || npc.destroyed || npc.arrived) return;
  recordCombatEvent("npcHit", {
    enemyKind: npc.kind || "npc",
    sourceKey: "enemy_fire",
    damage: amount
  });
  npc.hp -= amount;
  for (let i = 0; i < 3; i++) spawnParticle(npc, [0.5, 0.9, 1.0, 0.9]);
  if (npc.hp <= 0) {
    npc.hp = 0;
    npc.destroyed = true;
    // v0.8.0：按 npc.role 分流 npcDestroyed 事件，escort objective NPC 走 notifyObjective；
    // ENCOUNTER NPC（trader / distress-pilot / pirate-ambush）走 notifyEncounters；
    // 两条路径不重叠，避免 escort isFailed 误判事件 NPC 死亡。
    if (npc.role === "encounter") {
      notifyEncounters("npcDestroyed", npc);
    } else {
      notifyObjective("npcDestroyed", npc);
    }
    state.npcs = state.npcs.filter((entry) => entry.id !== npc.id);
  }
}

// v0.8.0：tickNpc 按 npc.kind 分支 AI。kind 决定行为，role 决定事件派发归属（objective/encounter）。
function tickNpc(npc, dt) {
  if (!npc || npc.arrived || npc.destroyed) return;
  switch (npc.kind) {
    case "trader":
      tickTraderNpc(npc, dt);
      break;
    case "pirate-ambush":
      tickPirateAmbushNpc(npc, dt);
      break;
    case "friendly-cargo":
    case "distress-pilot":
    default:
      tickFriendlyCargoLikeNpc(npc, dt);
      break;
  }
}

// 原 tickNpc 主体（保持 v0.4.0 escort NPC 行为完全等价）；npcArrived 事件按 role 分流
function tickFriendlyCargoLikeNpc(npc, dt) {
  if (!npc.target) return;
  const toTarget = { x: npc.target.x - npc.pos.x, y: npc.target.y - npc.pos.y };
  const remain = length(toTarget);
  if (remain <= NPC_ARRIVE_RADIUS) {
    npc.arrived = true;
    npc.vel.x = 0;
    npc.vel.y = 0;
    if (npc.role === "encounter") {
      notifyEncounters("npcArrived", npc);
    } else {
      notifyObjective("npcArrived", npc);
    }
    return;
  }
  let dir = normalize(toTarget);
  for (const body of state.world.bodies) {
    if (body.type !== "planet" && body.type !== "star") continue;
    const toBody = { x: body.x - npc.pos.x, y: body.y - npc.pos.y };
    const distBody = length(toBody);
    const avoidR = body.r + NPC_AVOID_MARGIN;
    if (distBody > avoidR || distBody < 1e-3) continue;
    const tangent = normalize({ x: -toBody.y, y: toBody.x });
    const blend = NPC_AVOID_WEIGHT * (1 - distBody / avoidR);
    dir = normalize({ x: dir.x + tangent.x * blend, y: dir.y + tangent.y * blend });
  }
  const desiredAngle = Math.atan2(dir.y, dir.x);
  let angleDiff = normalizeAngle(desiredAngle - npc.angle);
  const maxTurn = NPC_TURN_SPEED * dt;
  angleDiff = clamp(angleDiff, -maxTurn, maxTurn);
  npc.angle += angleDiff;
  const moveDir = { x: Math.cos(npc.angle), y: Math.sin(npc.angle) };
  npc.vel.x = moveDir.x * npc.speed;
  npc.vel.y = moveDir.y * npc.speed;
  npc.pos.x += npc.vel.x * dt;
  npc.pos.y += npc.vel.y * dt;
  const toStation = { x: npc.pos.x - state.station.pos.x, y: npc.pos.y - state.station.pos.y };
  const stationDist = length(toStation);
  if (stationDist < npc.radius + CELL * 2 && stationDist > 1e-3) {
    const push = normalize(toStation);
    npc.pos.x += push.x * 48 * dt;
    npc.pos.y += push.y * 48 * dt;
  }
}

// trader 漂流商船 AI：平行巡航，到达终点后离场
function tickTraderNpc(npc, dt) {
  if (!npc?.target) return;
  const dx = npc.target.x - npc.pos.x;
  const dy = npc.target.y - npc.pos.y;
  const d = Math.hypot(dx, dy);
  if (d < 20) {
    npc.arrived = true;
    npc.vel.x = 0;
    npc.vel.y = 0;
    return;
  }
  npc.vel.x = (dx / d) * npc.speed;
  npc.vel.y = (dy / d) * npc.speed;
  npc.pos.x += npc.vel.x * dt;
  npc.pos.y += npc.vel.y * dt;
  npc.angle = Math.atan2(npc.vel.y, npc.vel.x);
}

// pirate-ambush 伪装陷阱：显形标记，静止展示
function tickPirateAmbushNpc(npc, dt) {
  if (!npc || npc.destroyed) return;
  npc.vel.x = 0;
  npc.vel.y = 0;
}

function collideNpcWithEnemies(npc, dt) {
  if (npc.arrived || npc.destroyed) return;
  npc.collisionCooldown = Math.max(0, (npc.collisionCooldown || 0) - dt);
  if (npc.collisionCooldown > 0) return;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0) continue;
    if (dist(npc.pos, enemy) >= npc.radius + enemy.r) continue;
    damageNpc(npc, getCollisionDamage(enemy));
    npc.collisionCooldown = NPC_COLLISION_COOLDOWN;
    break;
  }
}

function updateNpcs(dt) {
  for (const npc of state.npcs) {
    if (npc.destroyed) continue;
    tickNpc(npc, dt);
    collideNpcWithEnemies(npc, dt);
  }
  state.npcs = state.npcs.filter((npc) => !npc.destroyed);
}

function renderNpcs() {
  for (const npc of state.npcs) {
    if (npc.destroyed) continue;
    const color = npc.hudColor || [0.35, 0.85, 0.78, 1];
    const pulse = 0.55 + 0.25 * Math.sin(state.time * Math.PI * 2);
    renderer.ring(npc.pos, npc.radius + 8, 2, [color[0], color[1], color[2], 0.25 + pulse * 0.15], 28);
    renderer.circle(npc.pos, npc.radius, color, 24);
    renderer.ring(npc.pos, npc.radius + 2, 2, [1, 1, 1, 0.85], 24);
    const tip = {
      x: npc.pos.x + Math.cos(npc.angle) * (npc.radius + 12),
      y: npc.pos.y + Math.sin(npc.angle) * (npc.radius + 12)
    };
    const left = {
      x: npc.pos.x + Math.cos(npc.angle + 2.4) * (npc.radius * 0.55),
      y: npc.pos.y + Math.sin(npc.angle + 2.4) * (npc.radius * 0.55)
    };
    const right = {
      x: npc.pos.x + Math.cos(npc.angle - 2.4) * (npc.radius * 0.55),
      y: npc.pos.y + Math.sin(npc.angle - 2.4) * (npc.radius * 0.55)
    };
    renderer.line(left, tip, 3, [0.9, 1, 0.95, 0.95]);
    renderer.line(right, tip, 3, [0.9, 1, 0.95, 0.95]);
    renderer.line(npc.pos, npc.target, 1.5, [color[0], color[1], color[2], 0.18]);
  }
}

function buildHostileStationHudAlerts() {
  const alerts = [];
  for (const enemy of state.enemies) {
    if (enemy.kind !== "hostile-station" || enemy.hp <= 0) continue;
    const hpPercent = enemy.cellsHpMax > 0
      ? Math.round((enemy.hp / enemy.cellsHpMax) * 100)
      : Math.round((enemy.hp / Math.max(1, enemy.maxHp)) * 100);
    const distance = Math.round(dist(state.station.pos, enemy));
    alerts.push({
      level: hpPercent < 25 ? "danger" : hpPercent < 50 ? "warn" : "good",
      cssClass: "alert-hostile-station",
      text: `敌方空间站 HP ${hpPercent}% | 距离 ${distance}m`
    });
  }
  return alerts;
}

// v0.8.0：聚合 active encounter 的 HUD 行，展示 detail + 距离 + 剩余时间 + hint。
function buildEncounterHudAlerts() {
  const alerts = [];
  if (!Array.isArray(state.run.encounters) || state.run.encounters.length === 0) return alerts;
  for (const enc of state.run.encounters) {
    if (!enc || enc.completed || enc.failed || enc.expired) continue;
    if (enc.state !== "active") continue;
    const type = ENCOUNTER_TYPES[enc.type];
    if (!type) continue;
    const detail = type.getDetail(enc) || enc.type;
    const hint = type.getHint(enc) || "";
    let distText = "";
    if (enc.spawnPos) {
      const distance = Math.hypot(
        state.station.pos.x - enc.spawnPos.x,
        state.station.pos.y - enc.spawnPos.y
      );
      distText = ` · 距离 ${Math.round(distance)}`;
    }
    let timeText = "";
    if (enc.expireAt && enc.expireAt - state.time < 99999) {
      const remain = Math.max(0, enc.expireAt - state.time);
      timeText = ` · ${Math.ceil(remain)}秒`;
    }
    alerts.push({
      level: enc.type === "ambush" ? "danger" : enc.type === "distress" ? "warn" : "good",
      cssClass: type.cssClass || "alert-encounter",
      text: `${detail}${distText}${timeText}` + (hint ? ` (${hint})` : "")
    });
  }
  return alerts;
}

function buildNpcHudAlerts() {
  const objective = state.run.objective;
  if (!objective || objective.type !== "escort" || isObjectiveComplete()) return [];
  if (objective.failed) {
    return [{ level: "danger", cssClass: "alert-escort-fail", text: "护送失败 · 本关无法跃迁" }];
  }
  // v0.8.0：仅在 objective NPC（role !== "encounter"）内反查 escort npc，
  // 防止 ENCOUNTER NPC（T3 trader / distress-pilot / pirate-ambush）污染 escort alert 通道
  const npc = state.npcs.find(
    (entry) => entry.id === objective.npcId && entry.role !== "encounter"
  );
  if (!npc) return [];
  const hpPct = npc.maxHp > 0 ? npc.hp / npc.maxHp : 0;
  if (hpPct < 0.1 && !state.run.escortLowHpAlerted) {
    state.run.escortLowHpAlerted = true;
    showToast("护送目标即将损毁！");
  }
  const angle = Math.atan2(npc.pos.y - state.station.pos.y, npc.pos.x - state.station.pos.x);
  const direction = angleToDirectionArrow8(angle);
  const distance = Math.round(dist(state.station.pos, npc.pos));
  return [{
    level: hpPct < 0.3 ? "danger" : "good",
    cssClass: hpPct < 0.3 ? "alert-escort alert-escort-critical" : "alert-escort",
    text: `护送目标 ${direction} ${distance} px · HP ${Math.floor(hpPct * 100)}%`
  }];
  // 注：encounter NPC 的 HUD alert 由 T4 的 buildEncounterHudAlerts() 独立返回
}

function buildFragmentFromCells(componentCells) {
  if (!componentCells.length) return { fragment: null, trimmedCells: 0 };
  const centerGrid = componentCells.reduce(
    (acc, cell) => {
      acc.x += cell.x;
      acc.y += cell.y;
      return acc;
    },
    { x: 0, y: 0 }
  );
  centerGrid.x /= componentCells.length;
  centerGrid.y /= componentCells.length;

  let keptCells = componentCells;
  let trimmedCells = 0;
  if (componentCells.length > FRAGMENT_MAX_CELLS_PER) {
    keptCells = [...componentCells]
      .sort((a, b) => {
        const da = (a.x - centerGrid.x) ** 2 + (a.y - centerGrid.y) ** 2;
        const db = (b.x - centerGrid.x) ** 2 + (b.y - centerGrid.y) ** 2;
        return da - db;
      })
      .slice(0, FRAGMENT_MAX_CELLS_PER);
    trimmedCells = componentCells.length - keptCells.length;
  }

  const worldOffset = rotate({ x: centerGrid.x * CELL, y: centerGrid.y * CELL }, state.station.angle);
  const pos = { x: state.station.pos.x + worldOffset.x, y: state.station.pos.y + worldOffset.y };

  let outwardLocal = { x: centerGrid.x, y: centerGrid.y };
  if (length(outwardLocal) < 1e-3) {
    outwardLocal = { x: rand(-1, 1), y: rand(-1, 1) };
  }
  const outwardWorld = normalize(rotate(outwardLocal, state.station.angle));
  const launchSpeed = rand(FRAGMENT_LAUNCH_SPEED_MIN, FRAGMENT_LAUNCH_SPEED_MAX);
  const vel = {
    x: state.station.vel.x + outwardWorld.x * launchSpeed + rand(-FRAGMENT_LAUNCH_JITTER, FRAGMENT_LAUNCH_JITTER),
    y: state.station.vel.y + outwardWorld.y * launchSpeed + rand(-FRAGMENT_LAUNCH_JITTER, FRAGMENT_LAUNCH_JITTER)
  };
  clampVectorLength(vel, FRAGMENT_MAX_LINEAR_SPEED);

  const cells = new Map();
  for (const cell of keptCells) {
    ensureCellUpgradeFields(cell);
    cell.detached = false;
    cell.drift = null;
    cell.reload = 0;
    cell.fire = 0;
    cells.set(key(cell.x, cell.y), cell);
  }
  const bounds = computeFragmentBounds(cells);
  const edgeKeys = computeFragmentEdgeKeys(cells);
  const angularVel = clamp(
    rand(FRAGMENT_ANGULAR_VEL_MIN, FRAGMENT_ANGULAR_VEL_MAX) + rand(-FRAGMENT_ANGULAR_JITTER, FRAGMENT_ANGULAR_JITTER),
    FRAGMENT_ANGULAR_VEL_MIN,
    FRAGMENT_ANGULAR_VEL_MAX
  );

  const fragment = {
    // Fragment 形态说明：独立位姿 + cells 子集 + 边缘与包围盒缓存。
    id: fragmentIdSeed++,
    pos,
    vel,
    angle: state.station.angle,
    angularVel,
    cells,
    edgeKeys,
    bounds,
    centerGrid,
    spawnAt: state.time,
    warnedNearBoundary: false,
    origin: "player"
  };
  return { fragment, trimmedCells };
}

function splitDisconnectedIntoFragments(disconnectedKeys) {
  if (!disconnectedKeys.length) {
    return { detachedCells: 0, droppedCells: 0, softCapReached: false };
  }
  const disconnectedSet = new Set(disconnectedKeys);
  const visited = new Set();
  const components = [];
  for (const startKey of disconnectedSet) {
    if (visited.has(startKey)) continue;
    const queue = [startKey];
    const component = [];
    while (queue.length) {
      const current = queue.pop();
      if (!disconnectedSet.has(current) || visited.has(current)) continue;
      visited.add(current);
      component.push(current);
      const cell = state.station.cells.get(current);
      if (!cell) continue;
      for (const n of neighbors(cell.x, cell.y)) {
        const nextKey = key(n.x, n.y);
        if (disconnectedSet.has(nextKey) && !visited.has(nextKey)) queue.push(nextKey);
      }
    }
    if (component.length) components.push(component);
  }

  const currentDetachedCells = countFragmentCells();
  let pendingCells = 0;
  let detachedCells = 0;
  let droppedCells = 0;
  const newFragments = [];

  for (const componentKeys of components) {
    const componentCells = [];
    for (const componentKey of componentKeys) {
      const cell = state.station.cells.get(componentKey);
      if (cell) componentCells.push(cell);
      state.station.cells.delete(componentKey);
    }
    if (!componentCells.length) continue;
    detachedCells += componentCells.length;

    const { fragment, trimmedCells } = buildFragmentFromCells(componentCells);
    droppedCells += trimmedCells;
    if (!fragment || !fragment.cells.size) {
      droppedCells += Math.max(0, componentCells.length - trimmedCells);
      continue;
    }

    if (countPlayerFragments() + newFragments.length >= FRAGMENT_MAX_COUNT) {
      droppedCells += fragment.cells.size;
      continue;
    }
    if (currentDetachedCells + pendingCells + fragment.cells.size > DETACHED_CELLS_TOTAL_HARD_CAP) {
      droppedCells += fragment.cells.size;
      continue;
    }
    newFragments.push(fragment);
    pendingCells += fragment.cells.size;
  }

  if (newFragments.length) {
    state.fragments.push(...newFragments);
  }
  return {
    detachedCells,
    droppedCells,
    softCapReached: currentDetachedCells + pendingCells > DETACHED_CELLS_TOTAL_SOFT_CAP
  };
}

function canPay(cost = {}) {
  return Object.entries(cost).every(([name, value]) => state.resources[name] >= value);
}

function pay(cost = {}) {
  for (const [name, value] of Object.entries(cost)) {
    state.resources[name] -= value;
  }
}

function refund(cost = {}) {
  for (const [name, value] of Object.entries(cost)) {
    state.resources[name] += value;
  }
}

function getBuildCost(facility) {
  const base = TYPES[facility]?.cost || {};
  // T3：开局协议折扣只读取当前 run 已应用的 active protocol，不读取 UI 当前 selected protocol。
  let discount = getMetaEffect("metalRefining") * getMetaEffect("buildDiscount");
  if (WEAPON_TYPES.has(facility)) {
    discount *= hasMetaTalent("weaponFrame") ? 0.8 : 1;
    discount *= getActiveProtocolFacilityDiscount("weapon");
  }
  if (facility === "mining") {
    discount *= getActiveProtocolFacilityDiscount("mining");
  }
  return Object.fromEntries(
    Object.entries(base).map(([name, value]) => [name, Math.ceil(value * discount)])
  );
}

function isValidFrameBuildGrid(x, y) {
  if (state.station.cells.has(key(x, y))) return false;
  return hasConnectedNeighbor(x, y);
}

function countFragmentFacilities(fragment) {
  let count = 0;
  for (const cell of fragment.cells.values()) {
    if (cell.facility !== "frame" && cell.facility !== "core") count++;
  }
  return count;
}

function angleToDirectionArrow8(angleRad) {
  const deg = ((angleRad * 180) / Math.PI + 360) % 360;
  if (deg < 22.5 || deg >= 337.5) return "→";
  if (deg < 67.5) return "↘";
  if (deg < 112.5) return "↓";
  if (deg < 157.5) return "↙";
  if (deg < 202.5) return "←";
  if (deg < 247.5) return "↖";
  if (deg < 292.5) return "↑";
  return "↗";
}

function getNearestFragmentHudData() {
  if (!state.fragments.length) return null;
  const cache = state.run.fragmentHudCache;
  if (cache && state.time - cache.sampledAt < FRAGMENT_HUD_SAMPLE_INTERVAL) {
    return cache.data;
  }
  let nearest = null;
  for (const fragment of state.fragments) {
    if (!fragment?.cells?.size) continue;
    const distance = dist(state.station.pos, fragment.pos);
    if (!nearest || distance < nearest.distance) {
      nearest = { fragment, distance };
    }
  }
  if (!nearest) {
    state.run.fragmentHudCache = { sampledAt: state.time, data: null };
    return null;
  }
  const angle = Math.atan2(
    nearest.fragment.pos.y - state.station.pos.y,
    nearest.fragment.pos.x - state.station.pos.x
  );
  const data = {
    direction: angleToDirectionArrow8(angle),
    distance: Math.round(nearest.distance),
    distanceRounded: Math.round(nearest.distance / 50) * 50,
    facilityCount: countFragmentFacilities(nearest.fragment),
    fragmentCount: state.fragments.length,
    origin:
      nearest.fragment.origin === "wreck"
        ? "wreck"
        : nearest.fragment.origin === "enemy-wreck"
          ? "enemy-wreck"
          : nearest.fragment.origin === "derelict"
            ? "derelict"
            : nearest.fragment.origin === "signal"
              ? "signal"
          : "player",
    playerCount: countPlayerFragments(),
    wreckCount: countWreckFragments(),
    enemyWreckCount: countEnemyWreckFragments(),
    derelictCount: countDerelictFragments(),
    signalCount: countSignalFragments()
  };
  state.run.fragmentHudCache = { sampledAt: state.time, data };
  return data;
}

function buildFragmentHudAlerts() {
  if (!state.fragments.length) return [];
  const alerts = [];
  const playerCount = countPlayerFragments();
  const wreckCount = countWreckFragments();
  const enemyWreckCount = countEnemyWreckFragments();
  const derelictCount = countDerelictFragments();
  const signalCount = countSignalFragments();
  if (playerCount >= FRAGMENT_HUD_WARN_COUNT) {
    alerts.push({
      level: "danger",
      cssClass: "alert-fragment-warn",
      text: "脱落较多，及时回收"
    });
  }
  const hud = getNearestFragmentHudData();
  if (!hud) return alerts;
  const originLabel =
    hud.origin === "wreck"
      ? "古老残骸"
      : hud.origin === "enemy-wreck"
        ? "敌方残骸"
        : hud.origin === "derelict"
          ? "秘窟残骸"
          : hud.origin === "signal"
            ? "神秘信号"
            : "我方残骸";
  let text = `最近${originLabel} ${hud.direction} · ${hud.distanceRounded} px · ${hud.facilityCount} 设施`;
  const segments = [];
  if (wreckCount > 0) segments.push(`古老残骸 ${wreckCount} 段`);
  if (enemyWreckCount > 0) segments.push(`敌方残骸 ${enemyWreckCount} 段`);
  if (derelictCount > 0) segments.push(`秘窟残骸 ${derelictCount} 段`);
  if (signalCount > 0) segments.push(`神秘信号 ${signalCount} 段`);
  if (playerCount > 0) segments.push(`我方 ${playerCount} 段`);
  if (segments.length > 1) {
    text = `${segments.join(" · ")} · ${text}`;
  } else if (wreckCount > 1) {
    text = `古老残骸 ×${wreckCount} · ${text}`;
  } else if (enemyWreckCount > 1) {
    text = `敌方残骸 ×${enemyWreckCount} · ${text}`;
  } else if (derelictCount > 1) {
    text = `秘窟残骸 ×${derelictCount} · ${text}`;
  } else if (signalCount > 1) {
    text = `神秘信号 ×${signalCount} · ${text}`;
  } else if (playerCount > 1) {
    text = `我方残骸 ×${playerCount} · ${text}`;
  }
  alerts.push({
    level:
      hud.origin === "player" && playerCount >= FRAGMENT_HUD_WARN_COUNT ? "warn" : "good",
    cssClass:
      hud.origin === "wreck"
        ? "alert-wreck"
        : hud.origin === "enemy-wreck"
          ? "alert-fragment-enemy"
          : hud.origin === "derelict"
            ? "alert-fragment-derelict"
            : hud.origin === "signal"
              ? "alert-fragment-signal"
          : "alert-fragment",
    text
  });
  return alerts;
}

function evaluateBridgePreviewAtGrid(gx, gy) {
  if (!state.fragments.length || !isValidFrameBuildGrid(gx, gy)) return null;
  const worldP = cellWorldPosition({ x: gx, y: gy, detached: false });
  let bestReady = null;
  let bestNear = null;

  for (const fragment of state.fragments) {
    if (!fragment?.cells?.size) continue;
    const angleDiff = Math.abs(normalizeAngle(fragment.angle - state.station.angle));
    const edgeKeys = fragment.edgeKeys && fragment.edgeKeys.size
      ? fragment.edgeKeys
      : computeFragmentEdgeKeys(fragment.cells);
    let nearestDist = Infinity;
    for (const edgeKey of edgeKeys) {
      const edgeCell = fragment.cells.get(edgeKey);
      if (!edgeCell) continue;
      const edgeWorld = fragmentCellWorldPosition(fragment, edgeCell);
      nearestDist = Math.min(nearestDist, dist(edgeWorld, worldP));
    }
    if (nearestDist > BRIDGE_PREVIEW_DISTANCE) continue;
    if (angleDiff > BRIDGE_PREVIEW_ANGLE_TOLERANT) continue;

    const entry = {
      fragment,
      distance: nearestDist,
      angleDiff,
      cellCount: fragment.cells.size,
      facilityCount: countFragmentFacilities(fragment)
    };

    if (nearestDist <= BRIDGE_DISTANCE && angleDiff <= BRIDGE_ANGLE) {
      if (
        !bestReady
        || entry.cellCount > bestReady.cellCount
        || (entry.cellCount === bestReady.cellCount && entry.distance < bestReady.distance)
      ) {
        bestReady = entry;
      }
    } else if (!bestNear || entry.distance < bestNear.distance) {
      bestNear = entry;
    }
  }

  if (bestReady) {
    return {
      tier: "ready",
      fragment: bestReady.fragment,
      worldP,
      message: `此处可桥接：${bestReady.cellCount} 个结构${bestReady.facilityCount ? ` / 含 ${bestReady.facilityCount} 设施` : ""}。`
    };
  }
  if (bestNear) {
    return {
      tier: "near",
      fragment: bestNear.fragment,
      worldP,
      message: "残骸接近，靠近 / 转向以桥接"
    };
  }
  return null;
}

function updateBridgePreviewState() {
  if (state.selectedBuild !== "frame" || !state.input.mouseWorld) {
    state.bridgePreview = null;
    clearBuildHint();
    return;
  }
  const grid = worldToGrid(state.input.mouseWorld);
  const preview = evaluateBridgePreviewAtGrid(grid.x, grid.y);
  state.bridgePreview = preview;
  if (preview) {
    setBuildHint(preview.message);
  } else {
    clearBuildHint();
  }
}

function removeFragmentCell(fragment, cell) {
  const cellKey = key(cell.x, cell.y);
  fragment.cells.delete(cellKey);
  if (fragment.cells.size > 0) {
    fragment.edgeKeys = computeFragmentEdgeKeys(fragment.cells);
    fragment.bounds = computeFragmentBounds(fragment.cells);
  }
}

function destroyFragmentIfEmpty(fragment, toastMessage = "残骸已被摧毁") {
  if (fragment.cells.size > 0) return false;
  const fragmentIndex = state.fragments.indexOf(fragment);
  if (fragmentIndex >= 0) {
    state.fragments.splice(fragmentIndex, 1);
    showToast(toastMessage);
    state.run.fragmentHudCache = null;
    return true;
  }
  return false;
}

function damageFragmentCell(fragment, cell, damage, sourceKey = "enemy_fire") {
  const normalizedSourceKey = normalizeDamageSourceKey(sourceKey, "enemy_fire");
  recordCombatEvent("fragmentHit", {
    cellKey: key(cell.x, cell.y),
    facility: cell.facility,
    sourceKey: normalizedSourceKey,
    damage
  });
  if (cell.facility !== "frame" && cell.facility !== "core") {
    cell.hp -= damage;
    if (cell.hp <= 0) {
      const hitPos = fragmentCellWorldPosition(fragment, cell);
      removeFragmentCell(fragment, cell);
      spawnParticle(hitPos, [0.85, 0.88, 0.92, 0.9]);
      destroyFragmentIfEmpty(fragment);
    }
    return;
  }
  cell.hp -= damage;
  cell.frameHp -= damage;
  if (cell.frameHp <= 0) {
    const hitPos = fragmentCellWorldPosition(fragment, cell);
    removeFragmentCell(fragment, cell);
    spawnParticle(hitPos, [0.85, 0.88, 0.92, 0.9]);
    destroyFragmentIfEmpty(fragment);
  }
}

function getFragmentCellAtWorld(world) {
  for (const fragment of state.fragments) {
    for (const cell of fragment.cells.values()) {
      const cellPos = fragmentCellWorldPosition(fragment, cell);
      if (dist(world, cellPos) < FRAGMENT_PROJECTILE_HIT_RADIUS) {
        return { fragment, cell };
      }
    }
  }
  return null;
}

// v0.6.0 引入 hostile-station kind，cells 复用 fragment 模板
function createHostileStationCells(level) {
  const effectiveLevel = level === 4 ? 4 : level === 5 ? 5 : 3;
  const scale = effectiveLevel === 4 ? 1.47 : effectiveLevel === 5 ? 2.0 : 1.0;
  const shieldStats = HOSTILE_STATION_WEAPON_STATS[effectiveLevel]?.shield;
  const cells = new Map();
  for (const entry of HOSTILE_STATION_LAYOUT_LEVEL3) {
    const [gx, gy] = entry.key.split(",").map(Number);
    const cell = createCell(gx, gy, entry.facility);
    cell.owner = "enemy";
    cell.tier = 0;
    cell.mod = null;
    cell.upgradePath = null;
    const scaledHp = Math.floor(entry.baseHp * scale);
    cell.maxHp = scaledHp;
    cell.hp = scaledHp;
    cell.baseMaxHp = scaledHp;
    if (cell.facility === "frame" || cell.facility === "core") {
      cell.maxFrameHp = scaledHp;
      cell.frameHp = scaledHp;
      cell.baseMaxFrameHp = scaledHp;
    }
    if (cell.facility === "shield" && shieldStats) {
      cell.baseMaxShield = shieldStats.maxShield;
      cell.maxShield = shieldStats.maxShield;
      cell.shield = shieldStats.maxShield;
    }
    cell.active = true;
    cell.enabled = true;
    cell.detached = false;
    cells.set(entry.key, cell);
  }
  return cells;
}

function getHostileStationEffectiveLevel(level) {
  return level === 4 ? 4 : level === 5 ? 5 : 3;
}

function getHostileStationCellStat(cell, key, level) {
  const effectiveLevel = getHostileStationEffectiveLevel(level);
  const table = HOSTILE_STATION_WEAPON_STATS[effectiveLevel];
  if (table && cell.facility === "turret" && table.turret[key] != null) {
    return table.turret[key];
  }
  if (table && cell.facility === "shield" && table.shield[key] != null) {
    return table.shield[key];
  }
  return getCellStat(cell, key);
}

function sumCellsHp(cells) {
  let sum = 0;
  cells.forEach((c) => { sum += Math.max(0, c.hp || 0); });
  return sum;
}

function sumCellsMaxHp(cells) {
  let sum = 0;
  cells.forEach((c) => { sum += c.maxHp || 0; });
  return sum;
}

function getHostileStationCellWorldPos(hostileStation, cellKey) {
  const [gx, gy] = cellKey.split(",").map(Number);
  const angle = hostileStation.angle || 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const lx = gx * CELL;
  const ly = gy * CELL;
  return {
    x: hostileStation.x + lx * cos - ly * sin,
    y: hostileStation.y + lx * sin + ly * cos
  };
}

function isHostileStationDestroyed(enemy) {
  if (!enemy || enemy.kind !== "hostile-station") return false;
  if (!enemy.cells || !enemy.cells.size) return true;
  const coreKey = enemy.coreCellKey || HOSTILE_STATION_CORE_KEY;
  const core = enemy.cells.get(coreKey);
  if (core && core.hp > 0) return false;
  return true;
}

function damageHostileStationCell(projectile, hostileStation, cellKey) {
  const cell = hostileStation.cells.get(cellKey);
  if (!cell || cell.hp <= 0) return false;
  const damage = Math.max(0, projectile.damage || 0);
  cell.hp -= damage;
  if (cell.facility === "frame" || cell.facility === "core") {
    cell.frameHp = (cell.frameHp != null ? cell.frameHp : cell.maxHp) - damage;
  }
  const hitPos = getHostileStationCellWorldPos(hostileStation, cellKey);
  spawnParticle(hitPos, [1, 0.42, 0.32, 0.9]);
  if (cell.hp <= 0) {
    cell.hp = 0;
    if (cell.facility === "core") {
      hostileStation.hp = 0;
    }
  }
  // 聚合 hp / maxHp 用于 HUD HP bar 和 enemy.hp > 0 过滤（ADR §1.3 风险 #3）
  if (hostileStation.hp > 0) {
    hostileStation.hp = sumCellsHp(hostileStation.cells);
  }
  return true;
}

function tryDamageHostileStationCell(projectile, hostileStation) {
  if (!hostileStation.cells || !hostileStation.cells.size) return false;
  let closestKey = null;
  let closestDist = Infinity;
  hostileStation.cells.forEach((cell, cellKey) => {
    if (cell.hp <= 0) return;
    const cellPos = getHostileStationCellWorldPos(hostileStation, cellKey);
    const d = dist(projectile, cellPos);
    if (d < HOSTILE_STATION_HIT_RADIUS && d < closestDist) {
      closestKey = cellKey;
      closestDist = d;
    }
  });
  if (closestKey == null) return false;
  const damaged = damageHostileStationCell(projectile, hostileStation, closestKey);
  if (damaged) {
    recordCombatEvent("hostileStationCellHit", {
      cellKey: closestKey,
      enemyKind: hostileStation.kind || "hostile-station",
      sourceKey: "player",
      damage: projectile?.damage
    });
  }
  return damaged;
}

function findCellByFacility(cellsMap, facility) {
  for (const cell of cellsMap.values()) {
    if (cell.facility === facility) return cell;
  }
  return null;
}

function getShieldCellKey(hostileStation) {
  if (hostileStation.shieldCellKey && hostileStation.cells.has(hostileStation.shieldCellKey)) {
    const cell = hostileStation.cells.get(hostileStation.shieldCellKey);
    if (cell && cell.facility === "shield") return hostileStation.shieldCellKey;
  }
  for (const [cellKey, cell] of hostileStation.cells.entries()) {
    if (cell.facility === "shield") return cellKey;
  }
  return null;
}

function updateHostileStationWeapons(hostileStation, dt) {
  const powerCell = findCellByFacility(hostileStation.cells, "power");
  const powerAlive = powerCell && powerCell.hp > 0;
  const reloadMultiplier = powerAlive ? 1.0 : 1.5;
  const stationLevel = hostileStation.level || hostileStation.spawnLevel || state.run.level || 3;
  const weaponTable = HOSTILE_STATION_WEAPON_STATS[getHostileStationEffectiveLevel(stationLevel)];
  const stationRange = weaponTable?.turret?.range || hostileStation.range || 480;

  hostileStation.cells.forEach((cell, cellKey) => {
    if (cell.facility !== "turret" || cell.hp <= 0) return;
    cell.reload = (cell.reload || 0) - dt;
    if (cell.reload > 0) return;

    const cellWorldPos = getHostileStationCellWorldPos(hostileStation, cellKey);
    const dirX = state.station.pos.x - cellWorldPos.x;
    const dirY = state.station.pos.y - cellWorldPos.y;
    const cellDist = Math.sqrt(dirX * dirX + dirY * dirY);
    if (cellDist === 0 || cellDist > stationRange) return;

    const damage = getHostileStationCellStat(cell, "damage", stationLevel);
    const projectileSpeed = getHostileStationCellStat(cell, "projectileSpeed", stationLevel);
    fireProjectile(
      cellWorldPos,
      { x: dirX / cellDist, y: dirY / cellDist },
      "enemy",
      damage,
      projectileSpeed,
      hostileStation.kind || "hostile-station"
    );
    cell.fire = 1;
    const baseReload = getHostileStationCellStat(cell, "reload", stationLevel);
    cell.reload = baseReload * reloadMultiplier;
  });
}

function updateHostileStationSpawn(hostileStation, dt) {
  if (!(hostileStation.spawnInterval > 0)) return;
  hostileStation.spawn = (hostileStation.spawn || 0) - dt;
  if (hostileStation.spawn > 0) return;

  const currentMinions = state.enemies.filter((e) => e.hostileStationMinion && e.hp > 0).length;
  const cap = hostileStation.spawnCap || 3;
  if (currentMinions >= cap) {
    hostileStation.spawn = 1.0;
    return;
  }

  const angle = Math.random() * Math.PI * 2;
  const spawnDist = 80 + Math.random() * 40;
  const minion = spawnEnemy(
    "pirate",
    hostileStation.x + Math.cos(angle) * spawnDist,
    hostileStation.y + Math.sin(angle) * spawnDist,
    { level: hostileStation.level || hostileStation.spawnLevel || 3, hostileStationMinion: true }
  );
  if (minion) minion.hostileStationMinion = true;
  hostileStation.spawn = hostileStation.spawnInterval || 8;
}

function spawnEnemyWrecks(hostileStation) {
  const level = hostileStation.level || 3;
  const effectiveLevel = level === 4 ? 4 : level === 5 ? 5 : 3;
  const count = HOSTILE_STATION_WRECK_COUNT_BY_LEVEL[effectiveLevel] || 6;
  const rng = mulberry32(hashSeed(`${state.run.seed}:hostile-wreck:${hostileStation.x}:${hostileStation.y}`));
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = HOSTILE_STATION_WRECK_SPAWN_RADIUS_MIN
      + rng() * (HOSTILE_STATION_WRECK_SPAWN_RADIUS_MAX - HOSTILE_STATION_WRECK_SPAWN_RADIUS_MIN);
    const wx = hostileStation.x + Math.cos(angle) * radius;
    const wy = hostileStation.y + Math.sin(angle) * radius;
    const wreck = makeWreckFragment(
      { x: wx, y: wy },
      rng,
      { weights: ENEMY_WRECK_FACILITY_WEIGHTS, origin: "enemy-wreck" }
    );
    if (wreck) state.fragments.push(wreck);
  }
}

function triggerHostileStationDeath(enemy) {
  if (enemy._deathHandled) return;
  enemy._deathHandled = true;
  triggerCameraShake(72, 1.3);
  for (let i = 0; i < 48; i++) {
    const ang = rand(0, Math.PI * 2);
    const radius = rand(8, enemy.r + 36);
    spawnParticle(
      { x: enemy.x + Math.cos(ang) * radius, y: enemy.y + Math.sin(ang) * radius },
      i % 3 === 0 ? [1, 0.86, 0.42, 1] : [1, 0.32, 0.18, 1]
    );
  }
  spawnEnemyWrecks(enemy);
  notifyObjective("hostileStationKilled", { enemy });
  notifyEncounters("hostileStationKilled", { enemy });
  showHostileStationAlert("✓ 主目标已摧毁", 2000, true);
  showToast("敌方空间站已摧毁——拾取残骸强化 build。");
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
    clearBuildError();
    const merged = tryBridgeAt(x, y);
    if (!state.station.cells.has(cellKey)) {
      return false;
    }
    if (!merged && !state.lastBuildError) {
      showToast("框架已扩展。");
    }
    return true;
  }

  if (!existing || existing.facility !== "frame" || existing.detached) {
    setBuildError("设施只能建造在已连接的空框架上。");
    return false;
  }
  const def = TYPES[facility];
  const cost = getBuildCost(facility);
  if (!canPay(cost)) {
    const missingSummary = formatMissingResourceGaps(getBuildPaletteMissingResources(cost)) || formatCost(cost);
    setBuildError(`${def.name} 当前资源不足：还缺 ${missingSummary}（建造模式已保持）`);
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

function tryBridgeAt(x, y) {
  if (!state.fragments.length) return false;
  const frameLocal = rotate({ x: x * CELL, y: y * CELL }, state.station.angle);
  const newFrame = { x, y };
  const newFrameWorld = {
    x: state.station.pos.x + frameLocal.x,
    y: state.station.pos.y + frameLocal.y
  };
  const candidates = [];
  let hasAngleMismatchNearCandidate = false;

  for (const fragment of state.fragments) {
    if (!fragment?.cells?.size) continue;
    const angleDiff = Math.abs(normalizeAngle(fragment.angle - state.station.angle));
    const edgeKeys = fragment.edgeKeys && fragment.edgeKeys.size
      ? fragment.edgeKeys
      : computeFragmentEdgeKeys(fragment.cells);
    let nearestAnchor = null;
    let nearestDistance = Infinity;

    for (const edgeKey of edgeKeys) {
      const edgeCell = fragment.cells.get(edgeKey);
      if (!edgeCell) continue;
      const edgeWorld = fragmentCellWorldPosition(fragment, edgeCell);
      const distance = dist(edgeWorld, newFrameWorld);
      if (distance > BRIDGE_DISTANCE) continue;
      if (angleDiff > BRIDGE_ANGLE) {
        hasAngleMismatchNearCandidate = true;
        continue;
      }
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAnchor = edgeCell;
      }
    }

    if (!nearestAnchor) continue;
    candidates.push({
      fragment,
      anchorCell: nearestAnchor,
      distance: nearestDistance,
      cellCount: fragment.cells.size
    });
  }

  if (!candidates.length) {
    if (hasAngleMismatchNearCandidate) {
      setBuildError("残骸角度未对齐，请等待残骸自转或换位置。");
    }
    return false;
  }

  candidates.sort((a, b) => {
    if (b.cellCount !== a.cellCount) return b.cellCount - a.cellCount;
    return a.distance - b.distance;
  });
  const best = candidates[0];
  return mergeFragmentToStation(best.fragment, best.anchorCell, newFrame);
}

function mergeFragmentToStation(fragment, anchorCell, newFrame) {
  if (!fragment || !anchorCell) return false;
  const projectedCells = [];
  const newFrameKey = key(newFrame.x, newFrame.y);

  for (const cell of fragment.cells.values()) {
    const relX = cell.x - anchorCell.x;
    const relY = cell.y - anchorCell.y;
    const targetX = newFrame.x + relX;
    const targetY = newFrame.y + relY;
    const targetKey = key(targetX, targetY);
    const occupied = state.station.cells.get(targetKey);
    if (occupied && targetKey !== newFrameKey) {
      // Bridge merge uses all-or-nothing semantics: rollback the just-built frame and cost.
      state.station.cells.delete(newFrameKey);
      refund(TYPES.frame.cost);
      setBuildError("脱落部件无法对接：位置冲突。");
      return false;
    }
    projectedCells.push({ cell, targetX, targetY, targetKey });
  }

  let facilityCount = 0;
  for (const item of projectedCells) {
    item.cell.x = item.targetX;
    item.cell.y = item.targetY;
    item.cell.detached = false;
    item.cell.drift = null;
    item.cell.reload = 0;
    item.cell.fire = 0;
    if (item.cell.facility !== "frame" && item.cell.facility !== "core") {
      facilityCount++;
    }
    state.station.cells.set(item.targetKey, item.cell);
  }

  const fragmentIndex = state.fragments.indexOf(fragment);
  if (fragmentIndex >= 0) {
    state.fragments.splice(fragmentIndex, 1);
  }

  notifyObjective("fragmentDocked", fragment);
  notifyEncounters("fragmentDocked", fragment);
  checkConnectivity();
  showToast(`重新接入 ${projectedCells.length} 个结构 / 含 ${facilityCount} 个设施。`);
  return true;
}

function update(dt) {
  ensureRunRuntimeState();
  const prevResearch = state.resources.research;
  state.toastTimer -= dt;
  if (state.toastTimer <= 0) toastEl.classList.remove("show");
  if (state.paused) return;
  state.time += dt;

  updatePowerAndFacilities(dt);
  updateMouseAim(dt);
  updateStationPhysics(dt);
  updateFragments(dt);
  updateNpcs(dt);
  updateMiningAndResearch(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateRepair(dt);
  updateParticles(dt);
  updateObjective(dt);
  updateEncounters(dt);
  updateCamera(dt);
  trackResearchGrowth(prevResearch);
}

function updatePowerAndFacilities(dt) {
  state.resources.metal += (0.85 + (getMetaEffect("efficientCore") ? 0.35 : 0)) * dt;
  state.resources.ore += 0.18 * dt;
  state.resources.gas += 0.12 * dt;
  state.resources.plasma += 0.025 * dt;

  let available = 6 * getTechLevelFactor("power", "baseAvailable", state.station.techLevel);
  const candidates = [];
  for (const cell of state.station.cells.values()) {
    cell.fire = 0;
    cell.active = cell.facility === "core" || cell.facility === "frame" || cell.facility === "armor";
    if (cell.detached || !cell.enabled) continue;
    if (cell.facility === "power") available += getCellStat(cell, "powerOut");
    if (cell.facility === "plasma" && state.resources.gas > 0.8) {
      available += TYPES.plasma.baseStats.bonusPowerOut;
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

function applyLinearDamping(vel, damping, dt) {
  const factor = 1 - Math.min(damping * dt, damping);
  vel.x *= factor;
  vel.y *= factor;
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
    const shouldFire = targetVector ? dot(pushWorld, targetVector) > 0.12 : false;
    if (!shouldFire) {
      cell.fire = 0;
      continue;
    }
    const thrust = getCellStat(cell, "thrust") * getMetaEffect("weaponEfficiency");
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
      getTechLevelFactor("thruster", "keyboardThrust", state.station.techLevel) *
      state.station.thrustMod;
    force.x += keyboardThrust.x * directThrust;
    force.y += keyboardThrust.y * directThrust;
  }
  station.vel.x += force.x / mass * dt;
  station.vel.y += force.y / mass * dt;
  applyLinearDamping(station.vel, PLAYER_PHYSICS.linearDamping, dt);
  if (!keyboardThrust) {
    const speed = length(station.vel);
    let coastDamp =
      PLAYER_PHYSICS.linearDamping * PLAYER_PHYSICS.coastDampingMult;
    if (speed > PLAYER_PHYSICS.coastHighSpeedThreshold) {
      const t = clamp(
        (speed - PLAYER_PHYSICS.coastHighSpeedThreshold) / 180,
        0,
        1
      );
      coastDamp += PLAYER_PHYSICS.coastHighSpeedDamping * t;
    }
    applyLinearDamping(station.vel, coastDamp, dt);
  }
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
  const miningBonus = getMetaEffect("miningYield");
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.active) continue;
    if (cell.facility === "mining") {
      const p = cellWorldPosition(cell);
      const body = state.world.bodies.find((b) => b.amount > 0 && dist(p, b) < b.r + MINING_RANGE_OFFSET);
      if (body) {
        const amount = Math.min(body.amount, getCellStat(cell, "mineRate") * miningBonus * dt);
        body.amount -= amount;
        const resourceType = body.resource;
        const gained = amount * getGalaxyResourceMultiplier(resourceType);
        state.resources[resourceType] = (state.resources[resourceType] || 0) + gained;
        mined += amount;
        cell.fire = 1;
        spawnParticle(p, body.color);
      }
    }
    if (cell.facility === "processor" && state.resources.ore > 1.2) {
      const amount = Math.min(state.resources.ore, getCellStat(cell, "produceRate") * dt);
      state.resources.ore -= amount;
      state.resources.metal += amount * TYPES.processor.baseStats.produceRatio;
    }
    if (cell.facility === "plasma" && state.resources.gas > 1.0) {
      const amount = Math.min(state.resources.gas, getCellStat(cell, "produceRate") * dt);
      state.resources.gas -= amount;
      state.resources.plasma += amount * TYPES.plasma.baseStats.produceRatio;
    }
    if (cell.facility === "research" && state.resources.plasma > 0.18) {
      const amount = Math.min(state.resources.plasma, getCellStat(cell, "produceRate") * dt);
      state.resources.plasma -= amount;
      state.resources.research += amount * TYPES.research.baseStats.produceRatio;
    }
  }
  if (mined > 0) {
    notifyObjective("mined", mined);
    notifyEncounters("mined", mined);
    awardEndgameActivityPoints(mined * ENDGAME_ACTIVITY_POINTS.miningPerUnit);
  }
  if (state.resources.research >= 35 + state.station.techLevel * 22) {
    state.resources.research -= 35 + state.station.techLevel * 22;
    state.station.techLevel++;
    improveStationHp(getTechLevelFactor("core", "hpPerLevel", 1));
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

function getSpawnDifficultyLevel() {
  if (isEndgameFreePlayActive()) return 5;
  return levelIndex(state.run.level);
}

function levelTimerScale(level) {
  return LEVEL_TIMER_SCALE[levelIndex(level)] || 1;
}

function getSpawnTimerByLevel(level) {
  const base = rand(26, 40) * levelTimerScale(level);
  const playerScale = Math.sqrt(Math.max(1, state.run.playerCount));
  return base / playerScale;
}

function getLevelTransitionBuffer(level) {
  return Math.max(5, 8 - levelIndex(level) * 0.5);
}

function scheduleNextSpawnTimer() {
  let timer = getGalaxySpawnInterval(getSpawnTimerByLevel(getSpawnDifficultyLevel()));
  if (levelIndex(state.run.level) === 0 && state.time < LEVEL0_SPAWN_WINDOW_SEC) {
    const postWindowGap = LEVEL0_SPAWN_WINDOW_SEC - state.time + 0.05;
    timer = Math.max(timer, postWindowGap);
  }
  state.spawnTimer = timer;
}

function getWaveCountByLevel(level) {
  const idx = levelIndex(level);
  const raw = state.run.playerCount * rand(0.6, 2) * LEVEL_COUNT_MUL[idx] + state.run.spawnFractional;
  let count = Math.floor(raw);
  state.run.spawnFractional = raw - count;
  if (count < 1) count = 1;
  return count;
}

function enemyUsesStationAi(enemy) {
  return enemy.kind === "station" || enemy.kind === "guardian" || enemy.kind === "hostile-station";
}

function getEnemyData(kind, level) {
  const idx = levelIndex(level);
  if (kind === "guardian") {
    return {
      hp: GUARDIAN_STATS.hp,
      r: GUARDIAN_STATS.r,
      accel: GUARDIAN_STATS.accel,
      drag: GUARDIAN_STATS.drag,
      range: GUARDIAN_STATS.range,
      reward: GUARDIAN_STATS.reward,
      spin: GUARDIAN_STATS.spin,
      projectileDamage: GUARDIAN_STATS.projectile,
      reloadTime: GUARDIAN_STATS.reload,
      spawnInterval: GUARDIAN_STATS.spawnInterval,
      spawnCap: GUARDIAN_STATS.spawnCap,
      collisionDamage: GUARDIAN_STATS.collision,
      mainColor: [0.55, 0.05, 0.1, 1],
      wingColor: [0.85, 0.2, 0.18, 1],
      auraColor: [1, 0.25, 0.2, 0.45]
    };
  }
  if (kind === "asteroid") {
    const stats = ENEMY_LEVEL_STATS.asteroid;
    return {
      hp: stats.hp[idx],
      r: stats.r,
      accel: stats.accel,
      drag: stats.drag,
      range: stats.range,
      reward: stats.reward,
      spin: rand(stats.spinMin, stats.spinMax),
      projectileDamage: 0,
      reloadTime: 99,
      spawnInterval: 0,
      spawnCap: 0,
      collisionDamage: stats.collision[idx]
    };
  }
  if (kind === "pirate") {
    const stats = ENEMY_LEVEL_STATS.pirate;
    return {
      hp: stats.hp[idx],
      r: stats.r,
      accel: stats.accel,
      drag: stats.drag,
      range: stats.range,
      reward: stats.reward,
      spin: rand(stats.spinMin, stats.spinMax),
      projectileDamage: stats.projectile[idx],
      reloadTime: stats.reload,
      spawnInterval: 0,
      spawnCap: 0,
      collisionDamage: stats.collision[idx]
    };
  }
  if (kind === "station") {
    const stats = ENEMY_LEVEL_STATS.station;
    return {
      hp: stats.hp[idx],
      r: stats.r,
      accel: stats.accel,
      drag: stats.drag,
      range: stats.range,
      reward: stats.reward,
      spin: stats.spin,
      projectileDamage: stats.projectile[idx],
      reloadTime: stats.reload,
      spawnInterval: stats.spawnInterval[idx],
      spawnCap: 0,
      collisionDamage: ENEMY_LEVEL_STATS.pirate.collision[idx]
    };
  }
  if (kind === "hostile-station") {
    const effectiveLevel = getHostileStationEffectiveLevel(level);
    const scale = effectiveLevel === 4 ? 1.47 : effectiveLevel === 5 ? 2.0 : 1.0;
    const weaponStats = HOSTILE_STATION_WEAPON_STATS[effectiveLevel]?.turret || HOSTILE_STATION_WEAPON_STATS[3].turret;
    return {
      hp: Math.floor(1500 * scale),
      r: 90,
      accel: 4,
      drag: 0.5,
      range: weaponStats.range,
      reward: 0,
      spin: 0,
      angularVel: (0.15 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1),
      projectileDamage: weaponStats.damage,
      reloadTime: weaponStats.reload,
      spawnInterval: effectiveLevel === 3 ? 10 : effectiveLevel === 4 ? 8.5 : 7,
      spawnCap: effectiveLevel === 3 ? 3 : effectiveLevel === 4 ? 4 : 5,
      collisionDamage: 8
    };
  }
  return null;
}

function getCollisionDamage(enemy) {
  if (Number.isFinite(enemy.collisionDamage)) return enemy.collisionDamage;
  return enemy.kind === "asteroid" ? COLLISION_FEEL.asteroidCellDamage : COLLISION_FEEL.pirateCellDamage;
}

function triggerCameraShake(amount, duration) {
  state.camera.shakeAmt = Math.max(state.camera.shakeAmt, amount);
  state.camera.shakeTimer = Math.max(state.camera.shakeTimer, duration);
}

function triggerGuardianDeathEffect(enemy) {
  for (let i = 0; i < 56; i++) {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(8, enemy.r + 26);
    spawnParticle(
      {
        x: enemy.x + Math.cos(angle) * radius,
        y: enemy.y + Math.sin(angle) * radius
      },
      i % 3 === 0 ? [1, 0.86, 0.42, 1] : [1, 0.24, 0.14, 1]
    );
  }
  triggerCameraShake(64, 1.1);
}

function spawnGuardianNearStation() {
  if (state.run.guardianSpawned || state.run.guardianDefeated) return;
  if (state.enemies.some((enemy) => enemy.kind === "guardian" && enemy.hp > 0)) {
    state.run.guardianSpawned = true;
    return;
  }
  const angle = rand(0, Math.PI * 2);
  const radius = rand(1100, 1300);
  const x = state.station.pos.x + Math.cos(angle) * radius;
  const y = state.station.pos.y + Math.sin(angle) * radius;
  spawnEnemy("guardian", x, y, { level: ENDGAME_LEVEL });
  state.run.guardianSpawned = true;
  showToast("终末守护者已出现：击毁它即可进入本局结算。");
}

// v0.6.0 hostile-station 远距生成（1000-1300；由 assault 任务 tick 延迟 spawn）
function spawnHostileStationNearStation(rng, level) {
  const r = typeof rng === "function" ? rng : Math.random;
  const angle = r() * Math.PI * 2;
  const radius = 1000 + r() * 300;
  const x = state.station.pos.x + Math.cos(angle) * radius;
  const y = state.station.pos.y + Math.sin(angle) * radius;
  const useLevel = Number.isFinite(level) ? level : (state.run.level || 3);
  const enemy = spawnEnemy("hostile-station", x, y, { level: useLevel });
  if (enemy) {
    enemy.id = enemy.id || `hs-${Date.now()}`;
    state.run.hostileStationAlerted = true;
  }
  return enemy;
}

function updateEnemies(dt) {
  if (state.run.endgame && !state.run.guardianDefeated && !state.run.guardianSpawned) {
    state.run.guardianSpawnDelay -= dt;
    if (state.run.guardianSpawnDelay <= 0) {
      spawnGuardianNearStation();
    }
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnWave();
    scheduleNextSpawnTimer();
  }

  for (const enemy of state.enemies) {
    enemy.reload -= dt;

    // v0.6.0 hostile-station：470 悬停 AI + 缓慢自转 + 武器 / 召唤
    if (enemy.kind === "hostile-station") {
      const toStation = { x: state.station.pos.x - enemy.x, y: state.station.pos.y - enemy.y };
      const dir = normalize(toStation);
      const distToStation = length(toStation);
      const desiredDistance = 470;
      if (distToStation > desiredDistance) {
        enemy.vx += dir.x * enemy.accel * dt;
        enemy.vy += dir.y * enemy.accel * dt;
      }
      enemy.vx *= 1 - Math.min(enemy.drag * dt, 0.3);
      enemy.vy *= 1 - Math.min(enemy.drag * dt, 0.3);
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      enemy.angle = (enemy.angle || 0) + (enemy.angularVel || 0.15) * dt;
      if (enemy.angle > Math.PI * 2) enemy.angle -= Math.PI * 2;
      if (enemy.angle < 0) enemy.angle += Math.PI * 2;

      updateHostileStationWeapons(enemy, dt);
      updateHostileStationSpawn(enemy, dt);
      if (enemy.hp > 0) {
        enemy.hp = sumCellsHp(enemy.cells);
      }
      collideEnemyWithStation(enemy);
      continue;
    }

    const toStation = { x: state.station.pos.x - enemy.x, y: state.station.pos.y - enemy.y };
    const dir = normalize(toStation);
    const distToStation = length(toStation);
    const desiredDistance = enemy.kind === "pirate"
      ? PIRATE_AI.desiredDistance
      : enemyUsesStationAi(enemy)
        ? 470
        : 0;

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

    if (enemy.kind !== "asteroid" && enemy.reload <= 0 && distToStation < enemy.range) {
      enemy.reload = enemy.reloadTime ?? (enemyUsesStationAi(enemy) ? 1.6 : 2.2);
      fireProjectile(
        { x: enemy.x, y: enemy.y },
        dir,
        "enemy",
        enemy.projectileDamage || 10,
        250,
        enemy.kind || "enemy_fire"
      );
    }

    if (enemy.spawnInterval > 0) {
      enemy.spawn -= dt;
      if (enemy.spawn <= 0) {
        enemy.spawn = enemy.spawnInterval;
        if (enemy.kind === "guardian") {
          const minions = state.enemies.filter((other) => other.guardianMinion && other.hp > 0).length;
          if (minions < enemy.spawnCap) {
            spawnEnemy("pirate", enemy.x + rand(-90, 90), enemy.y + rand(-90, 90), { level: 5, guardianMinion: true });
          }
        } else {
          spawnEnemy("pirate", enemy.x + rand(-80, 80), enemy.y + rand(-80, 80), { level: enemy.spawnLevel });
        }
      }
    }

    if (enemy.kind === "guardian") {
      enemy.auraTick = (enemy.auraTick ?? 0) - dt;
      if (enemy.auraTick <= 0) {
        enemy.auraTick = 0.15;
        spawnParticle(
          {
            x: enemy.x + rand(-80, 80),
            y: enemy.y + rand(-80, 80)
          },
          [1, 0.25, 0.18, 1]
        );
      }
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
    if (enemy.kind === "hostile-station" && !isHostileStationDestroyed(enemy)) {
      return true;
    }
    if (enemy.hp > 0) return true;
    recordCombatEvent("enemyKilled", {
      enemyKind: enemy.kind || "unknown",
      sourceKey: enemy.kind || "unknown"
    });
    state.resources.metal += enemy.reward * getGalaxyResourceMultiplier("metal");
    state.resources.gas += enemy.reward * 0.15 * getGalaxyResourceMultiplier("gas");
    awardEndgameActivityPoints(enemyActivityPointReward(enemy.kind));
    if (enemy.kind === "guardian") {
      state.run.guardianDefeated = true;
      state.run.guardianSpawned = true;
      state.run.endgame = true;
      triggerGuardianDeathEffect(enemy);
      notifyObjective("guardianKilled", enemy);
      notifyEncounters("guardianKilled", enemy);
    } else if (enemy.kind === "hostile-station") {
      triggerHostileStationDeath(enemy);
    } else {
      notifyObjective("enemyKilled", enemy);
      notifyEncounters("enemyKilled", enemy);
      for (let i = 0; i < 12; i++) spawnParticle(enemy, [1, 0.32, 0.18, 1]);
    }
    return false;
  });
}

function getAsteroidSpawnChance() {
  const t = clamp(state.time / SPAWN_ASTEROID_RAMP_SEC, 0, 1);
  return SPAWN_ASTEROID_CHANCE_EARLY + (SPAWN_ASTEROID_CHANCE_LATE - SPAWN_ASTEROID_CHANCE_EARLY) * t;
}

function spawnWave() {
  if (state.run.endgame && state.run.guardianDefeated) return;
  const level = getSpawnDifficultyLevel();
  const idx = levelIndex(level);
  const count = getWaveCountByLevel(level);
  const ratio = LEVEL_SPAWN_RATIO[idx];
  const asteroidChance = clamp(getAsteroidSpawnChance() + ratio.asteroidBias, 0.1, 0.5);
  let pirateWeight = ratio.pirateBase;
  let stationWeight = state.asyncEnabled ? ratio.stationBase : 0;
  if (pirateWeight + stationWeight <= 0) pirateWeight = 1;
  const remaining = 1 - asteroidChance;
  const totalWeight = pirateWeight + stationWeight;
  const pirateCutoff = asteroidChance + remaining * (pirateWeight / totalWeight);
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    const a = rand(0, Math.PI * 2);
    const r = rand(800, 1150);
    const x = state.station.pos.x + Math.cos(a) * r;
    const y = state.station.pos.y + Math.sin(a) * r;
    let kind;
    if (roll < asteroidChance) {
      kind = "asteroid";
    } else if (roll < pirateCutoff) {
      kind = "pirate";
    } else if (state.asyncEnabled && stationWeight > 0) {
      kind = "station";
    } else {
      kind = "pirate";
    }
    // v0.6.0 防御：hostile-station 仅由 assault 任务主动 spawn，不进入随机波（即使 LEVEL_SPAWN_RATIO 未来误配置也保护）
    if (kind === "hostile-station") continue;
    spawnEnemy(kind, x, y, { level });
  }
  showToast("雷达发现敌对目标。");
}

function spawnEnemy(kind, x, y, options = {}) {
  const spawnLevel = levelIndex(Number.isFinite(options.level) ? options.level : getSpawnDifficultyLevel());
  const data = getEnemyData(kind, spawnLevel);
  if (!data) return null;
  const enemy = {
    kind,
    x,
    y,
    vx: rand(-20, 20),
    vy: rand(-20, 20),
    angle: rand(0, Math.PI * 2),
    reload: rand(0.4, Math.max(0.8, data.reloadTime || 2)),
    spawn: data.spawnInterval ? rand(Math.max(1.2, data.spawnInterval * 0.45), data.spawnInterval) : 0,
    spawnLevel,
    maxHp: data.hp,
    guardianMinion: Boolean(options.guardianMinion),
    hostileStationMinion: Boolean(options.hostileStationMinion),
    ...data
  };
  if (kind === "hostile-station") {
    enemy.cells = createHostileStationCells(spawnLevel);
    enemy.coreCellKey = HOSTILE_STATION_CORE_KEY;
    enemy.weaponCellKeys = [];
    enemy.cells.forEach((cell, cellKey) => {
      if (cell.facility === "turret") enemy.weaponCellKeys.push(cellKey);
      if (cell.facility === "shield") enemy.shieldCellKey = cellKey;
    });
    enemy.cellsHpMax = sumCellsMaxHp(enemy.cells);
    enemy.hp = sumCellsHp(enemy.cells);
    enemy.maxHp = enemy.cellsHpMax;
    enemy.owner = "enemy";
    enemy.vx = 0;
    enemy.vy = 0;
    enemy._deathHandled = false;
    enemy.level = spawnLevel;
    enemy.spin = 0;
    enemy.id = `hs-${Date.now()}-${state.enemies.length}`;
  }
  state.enemies.push(enemy);
  return enemy;
}

function updateTurret(cell, dt) {
  if (cell.reload > 0) return;
  const origin = cellWorldPosition(cell);
  const range = getCellStat(cell, "range");
  const enemy = selectTarget(origin, range);
  if (!enemy) {
    cell._losBlockedPrev = false;
    return;
  }
  const losOk = hasLineOfSight(origin, enemy);
  if (!losOk) {
    if (cell._losBlockedPrev !== true) {
      // v0.7.0：记录 LOS 遮挡时刻，供橙色警告环与 HUD 计数；5 秒内同 cell 不重复触发
      if (!cell._losBlockedAt || state.time - cell._losBlockedAt >= LOS_BLOCK_WARN_COOLDOWN) {
        cell._losBlockedAt = state.time;
      }
    }
    cell._losBlockedPrev = true;
    return;
  }
  cell._losBlockedPrev = false;
  const dir = normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  cell.reload = getCellStat(cell, "reload");
  fireProjectile(
    origin,
    dir,
    "player",
    getCellStat(cell, "damage") * getMetaEffect("weaponCalibration"),
    getCellStat(cell, "projectileSpeed")
  );
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
  const range = getCellStat(cell, "range");
  for (const projectile of state.projectiles) {
    if (projectile.owner !== "enemy") continue;
    const toProjectile = { x: projectile.x - origin.x, y: projectile.y - origin.y };
    if (length(toProjectile) < range && dot(normalize(toProjectile), outward) > -0.1) {
      projectile.dead = true;
      cell.fire = 1;
      recordCombatEvent("shieldBlocked", {
        cellKey: key(cell.x, cell.y),
        facility: cell.facility,
        sourceKey: "enemy_fire"
      });
      for (let i = 0; i < 5; i++) spawnParticle(projectile, [0.35, 1, 0.94, 1]);
    }
  }
}

// v0.7.0：[`/`]` 循环切换导弹齐射档位（1 / 2 / 3 / 全部）
function adjustSalvoSize(delta) {
  const options = SALVO_SIZE_OPTIONS;
  const current = state.missile.salvoSize || 1;
  let idx = options.indexOf(current);
  if (idx === -1) idx = 0;
  idx = (idx + delta + options.length) % options.length;
  state.missile.salvoSize = options[idx];
  const label = state.missile.salvoSize >= 999 ? "all" : state.missile.salvoSize;
  showToast(`齐射档位：${label}`);
}

function fireMissiles() {
  // 防抖检查（v0.7.0 S2-1 修复：F 键和 #missileBtn 都受同款防抖保护）
  const now = performance.now();
  if (now - (state.input._fLastFireAt || 0) < F_FIRE_DEBOUNCE_MS) return;
  state.input._fLastFireAt = now;

  const readyEntries = [];
  for (const [cellKey, cell] of state.station.cells) {
    if (cell.facility !== "missile") continue;
    if (!cell.active || cell.reload > 0 || cell.detached) continue;
    readyEntries.push({ cellKey, cell });
  }
  if (readyEntries.length === 0) {
    showToast("没有可发射的导弹井或目标。");
    return;
  }
  readyEntries.sort((a, b) => (a.cellKey < b.cellKey ? -1 : a.cellKey > b.cellKey ? 1 : 0));
  const salvoSize = state.missile.salvoSize || 1;
  const toFire = readyEntries.slice(0, Math.min(salvoSize, readyEntries.length));

  let fired = 0;
  for (const { cell } of toFire) {
    const origin = cellWorldPosition(cell);
    const enemy = selectTarget(origin, getCellStat(cell, "range"));
    if (!enemy) continue;
    const gasCost = TYPES.missile.baseStats.gasCost;
    const metalCost = TYPES.missile.baseStats.metalCost;
    if (state.resources.gas < gasCost || state.resources.metal < metalCost) {
      showToast("导弹装填资源不足，需要气体和金属。");
      return;
    }
    state.resources.gas -= gasCost;
    state.resources.metal -= metalCost;
    const projectileCount = Math.max(1, Math.floor(getCellStat(cell, "projectileCount")));
    const projectileSpeed = getCellStat(cell, "projectileSpeed");
    const baseProjectileSpeed = TYPES.missile.baseStats.projectileSpeed;
    const projectileAccel = TYPES.missile.baseStats.projectileAccel * (projectileSpeed / baseProjectileSpeed);
    const launchJitter = TYPES.missile.baseStats.launchJitter;
    const damage = getCellStat(cell, "damage") * getMetaEffect("weaponCalibration");
    for (let i = 0; i < projectileCount; i++) {
      state.projectiles.push({
        owner: "missile",
        target: enemy,
        x: origin.x,
        y: origin.y,
        vx: rand(-launchJitter, launchJitter),
        vy: rand(-launchJitter, launchJitter),
        damage,
        life: TYPES.missile.baseStats.life,
        r: TYPES.missile.baseStats.radius,
        maxSpeed: projectileSpeed,
        accel: projectileAccel
      });
    }
    cell.reload = getCellStat(cell, "reload");
    fired += projectileCount;
  }
  recordCombatEvent("missileSalvoFired", {
    fired,
    salvoSize,
    count: toFire.length
  });
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

function getPriorityTargetCandidate(origin, range) {
  const pt = state.input.priorityTarget;
  if (!pt || !pt.enemy) return { enemy: null, stale: false };
  const enemy = pt.enemy;
  const enemyValid = enemy.hp > 0;
  const notExpired = (state.time - pt.setAt) < PRIORITY_TARGET_LIFETIME;
  const stationToEnemyDist = dist(state.station.pos, enemy);
  const inSightOfStation = stationToEnemyDist < PRIORITY_TARGET_BREAK_DISTANCE;
  const stale = !enemyValid || !notExpired || !inSightOfStation;
  if (stale || dist(origin, enemy) > range) return { enemy: null, stale };
  return { enemy, stale: false };
}

function selectTargetReadOnly(origin, range) {
  const priority = getPriorityTargetCandidate(origin, range);
  return priority.enemy || nearestEnemy(origin, range);
}

// v0.7.0：清除优先目标锁定
function clearPriorityTarget() {
  state.input.priorityTarget = null;
}

// v0.7.0：右键点击敌人附近时设置优先目标
function setPriorityTarget(world) {
  let closest = null;
  let closestDist = Infinity;
  for (const enemy of state.enemies) {
    if (!enemy || enemy.hp <= 0) continue;
    const d = dist(world, enemy);
    if (d < PRIORITY_TARGET_LOCK_RADIUS && d < closestDist) {
      closest = enemy;
      closestDist = d;
    }
  }
  if (closest) {
    state.input.priorityTarget = {
      enemy: closest,
      setAt: state.time,
      validUntil: state.time + PRIORITY_TARGET_LIFETIME
    };
  } else {
    clearPriorityTarget();
  }
}

// v0.7.0：canvas 右键入口，委托 setPriorityTarget
function handleRightClick(world) {
  setPriorityTarget(world);
}

// v0.7.0：武器索敌统一入口；有效 priorityTarget 优先，否则 fallback nearestEnemy
function selectTarget(origin, range) {
  const priority = getPriorityTargetCandidate(origin, range);
  if (priority.stale) clearPriorityTarget();
  if (priority.enemy) return priority.enemy;
  return nearestEnemy(origin, range);
}

function fireProjectile(origin, dir, owner, damage, speed, sourceKey = null) {
  state.projectiles.push({
    owner,
    x: origin.x,
    y: origin.y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    damage,
    life: 2.6,
    r: owner === "enemy" ? 4 : 3,
    sourceKey: sourceKey == null ? null : String(sourceKey)
  });
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    projectile.life -= dt;
    if (projectile.owner === "missile" && projectile.target && projectile.target.hp > 0) {
      const dir = normalize({ x: projectile.target.x - projectile.x, y: projectile.target.y - projectile.y });
      const accel = Number.isFinite(projectile.accel) ? projectile.accel : TYPES.missile.baseStats.projectileAccel;
      const maxSpeed = Number.isFinite(projectile.maxSpeed) ? projectile.maxSpeed : TYPES.missile.baseStats.projectileSpeed;
      projectile.vx += dir.x * accel * dt;
      projectile.vy += dir.y * accel * dt;
      const speed = length({ x: projectile.vx, y: projectile.vy });
      if (speed > maxSpeed) {
        projectile.vx = projectile.vx / speed * maxSpeed;
        projectile.vy = projectile.vy / speed * maxSpeed;
      }
    }
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    spawnParticle(projectile, projectile.owner === "enemy" ? [1, 0.35, 0.25, 0.6] : [0.65, 0.92, 1, 0.6]);

    if (projectile.owner === "enemy") {
      const projectileSourceKey = normalizeDamageSourceKey(projectile.sourceKey, "enemy_fire");
      const hit = getCellAtWorld(projectile);
      if (hit && !hit.detached) {
        damageCell(hit, projectile.damage, projectileSourceKey);
        projectile.dead = true;
      } else if (!projectile.dead) {
        const fragHit = getFragmentCellAtWorld(projectile);
        if (fragHit) {
          damageFragmentCell(fragHit.fragment, fragHit.cell, projectile.damage, projectileSourceKey);
          projectile.dead = true;
        }
      }
      if (!projectile.dead) {
        for (const npc of state.npcs) {
          if (npc.destroyed || npc.arrived) continue;
          if (dist(projectile, npc.pos) < npc.radius + projectile.r) {
            damageNpc(npc, projectile.damage);
            projectile.dead = true;
            break;
          }
        }
      }
    } else {
      for (const enemy of state.enemies) {
        // v0.6.0 hostile-station：shield 拦截优先，再走 cell 粒度命中
        if (enemy.kind === "hostile-station" && enemy.hp > 0) {
          const shieldCellKey = getShieldCellKey(enemy);
          const shieldCell = shieldCellKey ? enemy.cells.get(shieldCellKey) : null;
          if (shieldCell && shieldCell.hp > 0) {
            const shieldWorldPos = getHostileStationCellWorldPos(enemy, shieldCellKey);
            const shieldRange = getHostileStationCellStat(
              shieldCell,
              "range",
              enemy.level || enemy.spawnLevel || state.run.level
            ) || 110;
            if (dist(projectile, shieldWorldPos) < shieldRange) {
              for (let i = 0; i < 5; i++) spawnParticle(projectile, [0.35, 1, 0.94, 1]);
              shieldCell.fire = 1;
              projectile.dead = true;
              break;
            }
          }
          if (!projectile.dead && dist(projectile, enemy) < enemy.r + projectile.r + CELL * 0.6) {
            if (tryDamageHostileStationCell(projectile, enemy)) {
              projectile.dead = true;
              break;
            }
          }
          continue;
        }
        if (dist(projectile, enemy) < enemy.r + projectile.r) {
          enemy.hp -= projectile.damage;
          recordCombatEvent("enemyDamaged", {
            enemyKind: enemy.kind || "unknown",
            sourceKey: projectile.owner || "player",
            damage: projectile.damage
          });
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
      damageCell(cell, getCollisionDamage(enemy), enemy.kind || "collision");
      enemy.hp -= enemy.kind === "asteroid" ? 35 : 8;
      const away = normalize({ x: enemy.x - p.x, y: enemy.y - p.y });
      enemy.vx += away.x * COLLISION_FEEL.enemyBounce;
      enemy.vy += away.y * COLLISION_FEEL.enemyBounce;
      return;
    }
  }
}

function damageCell(cell, damage, sourceKey = "enemy_fire") {
  const normalizedSourceKey = normalizeDamageSourceKey(sourceKey, "enemy_fire");
  recordCombatEvent("stationCellHit", {
    cellKey: key(cell.x, cell.y),
    facility: cell.facility,
    role: getFacilityRoleTag(cell.facility),
    isCore: cell.facility === "core",
    sourceKey: normalizedSourceKey,
    damage
  });
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
  const disconnectedKeys = [];
  for (const [cellKey, cell] of state.station.cells.entries()) {
    const isConnected = visited.has(cellKey);
    if (!isConnected) {
      disconnectedKeys.push(cellKey);
      continue;
    }
    cell.detached = false;
    cell.drift = null;
  }
  if (!disconnectedKeys.length) return;

  const result = splitDisconnectedIntoFragments(disconnectedKeys);
  if (!result.detachedCells) return;
  let message = `${result.detachedCells} 个结构脱落 - 找空位接回`;
  if (result.droppedCells > 0) message += `（${result.droppedCells} 个已散失）`;
  if (result.softCapReached) message += "，残骸总量临近上限";
  showToast(message);
}

function updateRepair(dt) {
  const repairers = [...state.station.cells.values()].filter((c) => c.facility === "repair" && c.active && !c.detached);
  for (const repairer of repairers) {
    repairer.repairCooldown = Math.max(0, (repairer.repairCooldown || 0) - dt);
    if (repairer.repairCooldown > 0) continue;
    const origin = cellWorldPosition(repairer);
    const target = [...state.station.cells.values()]
      .filter((cell) => !cell.detached && (cell.hp < cell.maxHp || cell.frameHp < TYPES.frame.baseStats.maxFrameHp))
      .sort((a, b) => dist(origin, cellWorldPosition(a)) - dist(origin, cellWorldPosition(b)))[0];
    if (!target) continue;
    repairer.repairCooldown = getCellStat(repairer, "cooldown");
    state.repairDrones.push({
      x: origin.x,
      y: origin.y,
      targetKey: key(target.x, target.y),
      repairerKey: key(repairer.x, repairer.y),
      returning: false,
      life: 10
    });
    recordCombatEvent("repairDispatched", {
      repairerKey: key(repairer.x, repairer.y),
      targetKey: key(target.x, target.y),
      targetFacility: target.facility
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
    const speed = TYPES.repair.baseStats.droneSpeed;
    if (distance < speed * dt + 4) {
      drone.x = destination.x;
      drone.y = destination.y;
      if (!drone.returning && target && !target.detached) {
        const repairRate = repairer ? getCellStat(repairer, "repairRate") : TYPES.repair.baseStats.repairRate;
        const frameRepairRate = repairer ? getCellStat(repairer, "frameRepairRate") : TYPES.repair.baseStats.frameRepairRate;
        const hpBefore = target.hp;
        const frameHpBefore = target.frameHp;
        target.hp = Math.min(target.maxHp, target.hp + repairRate);
        target.frameHp = Math.min(
          TYPES.frame.baseStats.maxFrameHp * getMetaEffect("hullIntegrity"),
          target.frameHp + frameRepairRate
        );
        recordCombatEvent("repairApplied", {
          repairerKey: String(drone.repairerKey || ""),
          targetKey: String(drone.targetKey || ""),
          targetFacility: target.facility,
          healed: Math.max(0, (target.hp - hpBefore) + (target.frameHp - frameHpBefore))
        });
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

function isOutsideGalaxyBounds(position, margin) {
  return position.x < GALAXY_WORLD_BOUNDS.minX - margin
    || position.x > GALAXY_WORLD_BOUNDS.maxX + margin
    || position.y < GALAXY_WORLD_BOUNDS.minY - margin
    || position.y > GALAXY_WORLD_BOUNDS.maxY + margin;
}

function isNearGalaxyBounds(position, margin) {
  return position.x < GALAXY_WORLD_BOUNDS.minX + margin
    || position.x > GALAXY_WORLD_BOUNDS.maxX - margin
    || position.y < GALAXY_WORLD_BOUNDS.minY + margin
    || position.y > GALAXY_WORLD_BOUNDS.maxY - margin;
}

function updateFragments(dt) {
  if (!state.fragments.length) return;
  let nearBoundaryCount = 0;
  let driftedOutCount = 0;
  const survivors = [];
  for (const fragment of state.fragments) {
    fragment.pos.x += fragment.vel.x * dt;
    fragment.pos.y += fragment.vel.y * dt;
    fragment.angle += fragment.angularVel * dt;

    const linearFactor = 1 - clamp(FRAGMENT_LINEAR_DAMP * dt, 0, FRAGMENT_LINEAR_DAMP);
    const angularFactor = 1 - clamp(FRAGMENT_ANGULAR_DAMP * dt, 0, FRAGMENT_ANGULAR_DAMP);
    fragment.vel.x *= linearFactor;
    fragment.vel.y *= linearFactor;
    fragment.angularVel *= angularFactor;

    clampVectorLength(fragment.vel, FRAGMENT_MAX_LINEAR_SPEED);
    fragment.angularVel = clamp(fragment.angularVel, -FRAGMENT_MAX_ANGULAR_SPEED, FRAGMENT_MAX_ANGULAR_SPEED);

    if (!fragment.warnedNearBoundary && isNearGalaxyBounds(fragment.pos, FRAGMENT_BOUNDARY_WARN_DISTANCE)) {
      fragment.warnedNearBoundary = true;
      nearBoundaryCount++;
    }
    if (isOutsideGalaxyBounds(fragment.pos, FRAGMENT_BOUNDARY_REMOVE_MARGIN)) {
      driftedOutCount++;
      continue;
    }
    if (fragment.cells.size <= 0) continue;
    survivors.push(fragment);
  }
  state.fragments = survivors;

  if (driftedOutCount > 0) {
    showToast(driftedOutCount > 1 ? `${driftedOutCount} 段残骸已漂出星系。` : "一段残骸已漂出星系。");
  } else if (nearBoundaryCount > 0) {
    showToast(nearBoundaryCount > 1 ? `${nearBoundaryCount} 段残骸接近星系边界。` : "一段残骸即将漂出星系边界。");
  }
}

function updateObjective(dt) {
  if (isObjectiveComplete() || isObjectiveFailed()) return;
  notifyObjective("tick", dt);
  notifyEncounters("tick", dt);
}

// v0.9.0：nextLevel 新增可选 galaxyType 参数
// 默认 "emptyVoid" 保证无参调用（如 __gameTest.resetRun 间接路径、确认前 fallback）与 v0.8.0 行为精确等价；
// 非法 galaxyType 也回落 emptyVoid，避免破坏后续 generateGalaxy / createObjective 等流程。
// 注意：本批不清空 state.run.galaxyMap.nodes（节点累积，由 confirmGalaxyJump 显式 push），
// 仅清理 pendingChoices / galaxyChoicesShown 这两个跨关瞬态字段。
function nextLevel(galaxyType = "emptyVoid") {
  ensureRunRuntimeState();
  if (state.run.level >= ENDGAME_LEVEL) {
    showToast("终末星系已就绪，无法继续跃迁；请完成守护者结算或直接开始新局。");
    return;
  }
  const safeGalaxyType = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType]) ? galaxyType : "emptyVoid";
  state.run.level = levelIndex(state.run.level + 1);
  state.run.endgame = state.run.level >= ENDGAME_LEVEL;
  // 先写入新 galaxyType，再 generateGalaxy / createObjective / seedEncountersForLevel，保证 paletteKey 与（T3 之后的）权重乘子按本关 galaxyType 生效
  state.run.currentGalaxyType = safeGalaxyType;
  if (state.run.galaxyMap) {
    state.run.galaxyMap.pendingChoices = [];
  }
  state.run.galaxyChoicesShown = false;
  state.run.guardianSpawned = false;
  state.run.guardianDefeated = false;
  state.run.guardianSpawnDelay = state.run.endgame ? 6 : 0;
  state.run.endgameExplore = false;
  state.run.spawnFractional = 0;
  state.run.settlementShown = false;
  state.run.settlementMode = "victory";
  state.run.hostileStationSpawnedThisGalaxy = false;
  state.run.hostileStationAlerted = false;
  runSettlementPanelEl?.classList.add("hidden");
  updateQuickRestartVisibility();

  const galaxy = generateGalaxy(state.run.level, `${state.run.seed}:${state.run.level}`, safeGalaxyType);
  applyGalaxy(galaxy);

  state.fragments = [];
  state.npcs = [];
  state.enemies = [];
  state.projectiles = [];
  state.repairDrones = [];
  state.particles = [];
  // v0.8.0：跨关清空 encounter 状态 + HUD 中央 alert 队列（hudCenterAlertCurrent 让其自然结束）
  state.run.encounters = [];
  state.run.encounterCooldownThisGalaxy = new Set();
  state.hudCenterAlertQueue = [];
  createObjective();
  seedEncountersForLevel(state.run.level);

  state.resources.metal += 55 * getGalaxyResourceMultiplier("metal", safeGalaxyType);
  state.resources.ore += 25 * getGalaxyResourceMultiplier("ore", safeGalaxyType);
  state.resources.gas += 18 * getGalaxyResourceMultiplier("gas", safeGalaxyType);
  state.spawnTimer = getLevelTransitionBuffer(state.run.level);

  if (state.run.endgame) {
    showToast("跃迁完成：已进入终末星系。摧毁守护者即可完成本局结算。");
  } else {
    showToast("跃迁到下一星系。可以继续扩建或停留战斗。");
  }
}

function gameOver() {
  if (state.run.settlementShown && state.run.settlementMode === "failure") return;
  const hints = getMetaSettlementHints();
  const purchaseHint = hints.recommended.length
    ? `可考虑先买「${hints.recommended[0].name}」。`
    : (hints.nearestShortfall
      ? `还差 ${hints.nearestShortfall.deficit} 点可购买「${hints.nearestShortfall.name}」。`
      : "继续完成任务可获得更多局外点数。");
  closePanelsForSettlement();
  resetObjectiveChoiceState();
  state.run.settlementMode = "failure";
  state.run.settlementShown = true;
  updateRunSettlementPanel();
  runSettlementPanelEl?.classList.remove("hidden");
  syncMainPanelUiState();
  updateQuickRestartVisibility();
  showToast(`核心被摧毁，本局结束。局外成长 +${hints.pointsGained}（当前 ${hints.totalPoints} 点）。${purchaseHint}`);
  state.paused = true;
  document.getElementById("pauseBtn").textContent = "继续";
  updateHud();
}

function updateCamera(dt) {
  const target = state.station.pos;
  state.camera.x += (target.x - state.camera.x) * clamp(dt * 2.4, 0, 1);
  state.camera.y += (target.y - state.camera.y) * clamp(dt * 2.4, 0, 1);
  if (state.camera.shakeTimer > 0) {
    state.camera.shakeTimer = Math.max(0, state.camera.shakeTimer - dt);
    const decay = clamp(state.camera.shakeTimer / 1.1, 0, 1);
    const amplitude = state.camera.shakeAmt * decay;
    state.camera.shakeX = Math.sin(state.time * 60) * amplitude;
    state.camera.shakeY = Math.cos(state.time * 47) * amplitude * 0.62;
    state.camera.shakeAmt *= 1 - Math.min(dt * 3.5, 0.9);
  } else {
    state.camera.shakeX = 0;
    state.camera.shakeY = 0;
    state.camera.shakeAmt = 0;
  }
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
  renderFragments();
  renderNpcs();
  renderEncounters();
  renderStation();
  renderMiningExpansionGhostPath();
  renderBridgePreview();
  renderMiningEffects();
  renderEnemies();
  renderPriorityTargetLockOverlay();
  renderProjectilesAndEffects();
  renderer.flush();
}

function renderBackground() {
  const nebulaTint = state.galaxy?.nebulaTint;
  const nebulaAlpha = state.galaxy?.nebulaAlpha;
  if (nebulaTint && Number.isFinite(nebulaAlpha) && nebulaAlpha > 0) {
    const starBody = state.world.bodies.find((body) => body.type === "star") || { x: 0, y: 0 };
    renderer.circle(starBody, 680, [nebulaTint[0], nebulaTint[1], nebulaTint[2], nebulaAlpha * 0.35], 48);
    renderer.circle(
      { x: starBody.x + 420, y: starBody.y - 280 },
      520,
      [nebulaTint[0], nebulaTint[1], nebulaTint[2], nebulaAlpha * 0.22],
      40
    );
    renderer.circle(
      { x: starBody.x - 380, y: starBody.y + 320 },
      460,
      [nebulaTint[0], nebulaTint[1], nebulaTint[2], nebulaAlpha * 0.18],
      36
    );
  }
  for (const star of state.stars) {
    const tint = star.color || [0.65, 0.82, 1, 1];
    renderer.circle(star, star.r / state.camera.zoom, [tint[0], tint[1], tint[2], star.a], 8);
  }
}

function renderBodies() {
  const starBody = state.world.bodies.find((body) => body.type === "star") || { x: 0, y: 0, r: 130 };
  const orbitRing = state.galaxy.palette?.orbitRing || [0.25, 0.45, 0.8, 0.12];
  renderer.ring(starBody, 520, 1.5, orbitRing, 80);
  renderer.ring(starBody, 930, 1.5, [orbitRing[0], orbitRing[1], orbitRing[2], orbitRing[3] * 0.82], 96);
  const miningStatus = getMiningStationStatus();
  const harvestingBodies = new Set(miningStatus.harvesting.map((entry) => entry.body));
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 3.2);
  if (state.run.level >= ENDGAME_LEVEL) {
    renderer.ring(starBody, 320, 6, [1, 0.25, 0.2, 0.18 + pulse * 0.06], 96);
  }

  for (const body of state.world.bodies) {
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
  const objectiveType = objective ? OBJECTIVE_TYPES[objective.type] : null;
  if (typeof objectiveType?.render === "function") {
    objectiveType.render(objective);
  }
}

function renderCellAt(cell, transform, opts = {}) {
  const {
    alpha = 1,
    desaturation = 0,
    selected = false,
    drawHpBar = true,
    drawEffects = true,
    forceInactive = false
  } = opts;
  const p = cellWorldPositionByTransform(cell, transform);
  const def = TYPES[cell.facility] || { color: [1, 1, 1, 1] };
  const baseColor = forceInactive || !cell.active
    ? [def.color[0] * 0.45, def.color[1] * 0.45, def.color[2] * 0.45, 0.82]
    : def.color;
  let color = [baseColor[0], baseColor[1], baseColor[2], (baseColor[3] ?? 1) * alpha];
  if (desaturation > 0) color = desaturateColor(color, desaturation);
  renderer.rect(p, CELL * 0.88, CELL * 0.88, transform.angle, color);

  let edgeColor = [0.05, 0.12, 0.2, 0.8 * alpha];
  if (desaturation > 0) edgeColor = desaturateColor(edgeColor, desaturation * 0.6);
  renderer.rect(p, CELL * 0.96, 2, transform.angle, edgeColor);
  renderer.rect(p, 2, CELL * 0.96, transform.angle, edgeColor);

  if (cell.facility === "core") renderer.circle(p, CELL * 0.34, [0.8, 0.92, 1, 0.9 * alpha], 18);
  if (drawEffects && cell.facility === "thruster") renderThruster(cell, p, transform.angle);
  if (drawEffects && cell.facility === "shield" && cell.active) renderShield(cell, p, transform.angle);
  if (selected) renderer.ring(p, CELL * 0.58, 3, [1, 1, 1, 0.75], 24);

  const hpRate = clamp(cell.hp / cell.maxHp, 0, 1);
  if (drawHpBar && hpRate < 0.95) {
    const barCenter = cellWorldPositionByTransform(cell, transform, { x: 0, y: CELL * 0.54 });
    const a = { x: barCenter.x - CELL * 0.35, y: barCenter.y };
    const b = { x: a.x + CELL * 0.7 * hpRate, y: a.y };
    renderer.line(a, b, 3, [1, 0.25, 0.2, 0.85 * alpha]);
  }
}

function renderStation() {
  const selected = state.selectedCell;
  const stationTransform = {
    pos: state.station.pos,
    angle: state.station.angle,
    origin: { x: 0, y: 0 }
  };
  for (const cell of state.station.cells.values()) {
    renderCellAt(cell, stationTransform, {
      selected: selected === key(cell.x, cell.y),
      drawHpBar: true,
      drawEffects: true
    });
    renderStationCellCombatVisuals(cell, stationTransform);
  }
}

// v0.7.0：玩家 station cell 战斗视觉反馈（missile ready 发光环 / turret LOS 橙色环）
function renderStationCellCombatVisuals(cell, transform) {
  if (cell.detached) return;
  const p = cellWorldPositionByTransform(cell, transform);

  if (cell.facility === "missile" && cell.reload <= 0 && cell.enabled) {
    const pulseAlpha = 0.4 + 0.4 * Math.sin(state.time * 4);
    renderer.ring(p, CELL * 0.5, 2, [85 / 255, 136 / 255, 1, pulseAlpha], 32);
  }

  if (cell.facility === "turret" && cell._losBlockedAt) {
    const elapsed = state.time - cell._losBlockedAt;
    if (elapsed >= 0 && elapsed < LOS_BLOCK_WARN_DURATION) {
      const alpha = 1.0 - elapsed / LOS_BLOCK_WARN_DURATION;
      renderer.ring(p, CELL * 0.6, 3, [1, 136 / 255, 0, alpha * 0.8], 32);
    }
  }
}

function renderDashedRing(center, radius, width, color, segments = 30) {
  for (let i = 0; i < segments; i += 2) {
    const a0 = i / segments * Math.PI * 2;
    const a1 = (i + 0.7) / segments * Math.PI * 2;
    const p0 = { x: center.x + Math.cos(a0) * radius, y: center.y + Math.sin(a0) * radius };
    const p1 = { x: center.x + Math.cos(a1) * radius, y: center.y + Math.sin(a1) * radius };
    renderer.line(p0, p1, width, color);
  }
}

function renderFragmentOutline(fragment) {
  const isWreck = isWreckLikeOrigin(fragment.origin);
  const outlineColor = isWreck ? WRECK_RENDER_OUTLINE_COLOR : FRAGMENT_RENDER_OUTLINE_COLOR;
  const spanX = Math.max(1, fragment.bounds.maxX - fragment.bounds.minX + 1) * CELL;
  const spanY = Math.max(1, fragment.bounds.maxY - fragment.bounds.minY + 1) * CELL;
  const radius = Math.max(spanX, spanY) * 0.62;
  const pulse = 0.8 + 0.2 * Math.sin(state.time * Math.PI * 3 + fragment.id);
  renderDashedRing(
    fragment.pos,
    radius,
    2,
    [
      outlineColor[0],
      outlineColor[1],
      outlineColor[2],
      outlineColor[3] * pulse
    ]
  );
}

function renderBridgePreview() {
  updatePlacementPreviewState();
  const preview = state.bridgePreview;
  if (!preview?.worldP) return;
  const ringColor = preview.tier === "ready" ? BRIDGE_PREVIEW_RING_READY : BRIDGE_PREVIEW_RING_NEAR;
  renderer.ring(preview.worldP, CELL * 0.55, 3.5, ringColor, 28);
}

function renderMiningExpansionGhostPath() {
  const status = getMiningStationStatus();
  if (status.harvesting.length > 0) return;
  const diagnostics = getMiningCoverageDiagnosticsForUi();
  const path = diagnostics.suggestedExpansionPath;
  const best = diagnostics.bestCandidate;
  if (!path || !best?.canReachInRange) return;

  const stationTransform = {
    pos: state.station.pos,
    angle: state.station.angle,
    origin: { x: 0, y: 0 }
  };
  const ghostAlpha = 0.28 + 0.12 * Math.sin(state.time * 2.6);

  for (const step of path.frameSteps || []) {
    const p = cellWorldPositionByTransform(
      { x: step.gridX, y: step.gridY, detached: false },
      stationTransform
    );
    renderer.ring(p, CELL * 0.4, 2.2, [0.35, 0.88, 0.72, ghostAlpha], 22);
  }

  const targetP = cellWorldPositionByTransform(
    { x: best.gridX, y: best.gridY, detached: false },
    stationTransform
  );
  renderDashedRing(targetP, CELL * 0.52, 2.4, [0.45, 0.95, 0.82, 0.42 + ghostAlpha * 0.35], 22);
  renderer.ring(targetP, CELL * 0.18, 2, [0.55, 1, 0.78, 0.55 + ghostAlpha * 0.25], 16);
}

function captureMiningExpansionGhostPathForTest() {
  const diagnostics = computeMiningCoverageDiagnostics();
  return safeDeepCloneForTest({
    visible: !!(diagnostics.suggestedExpansionPath && diagnostics.bestCandidate?.canReachInRange),
    ghostPath: diagnostics.ghostPath,
    affordability: diagnostics.affordability,
    mobileApproachHint: diagnostics.mobileApproachHint
  });
}

function renderFragments() {
  const highlightId = state.bridgePreview?.tier === "ready" ? state.bridgePreview.fragment?.id : null;
  for (const fragment of state.fragments) {
    const isWreck = isWreckLikeOrigin(fragment.origin);
    const highlighted = highlightId != null && fragment.id === highlightId;
    const alpha = clamp(
      (highlighted ? 0.7 : FRAGMENT_RENDER_ALPHA) + Math.sin(state.time * Math.PI * 3 + fragment.id) * 0.06,
      0.42,
      highlighted ? 0.78 : 0.68
    );
    const transform = {
      pos: fragment.pos,
      angle: fragment.angle,
      origin: fragment.centerGrid
    };
    for (const cell of fragment.cells.values()) {
      renderCellAt(cell, transform, {
        alpha,
        desaturation: isWreck ? WRECK_RENDER_DESATURATION : FRAGMENT_RENDER_DESATURATION,
        drawHpBar: false,
        drawEffects: false,
        forceInactive: true
      });
    }
    renderFragmentOutline(fragment);
  }
}

function renderThruster(cell, p, angle) {
  const nozzle = rotate(thrusterNozzle(cell), angle);
  const base = { x: p.x + nozzle.x * CELL * 0.45, y: p.y + nozzle.y * CELL * 0.45 };
  const tip = { x: p.x + nozzle.x * CELL * 0.78, y: p.y + nozzle.y * CELL * 0.78 };
  renderer.line(base, tip, 7, [0.05, 0.1, 0.16, 1]);
  if (cell.fire) {
    const flame = { x: p.x + nozzle.x * CELL * 1.2, y: p.y + nozzle.y * CELL * 1.2 };
    renderer.line(tip, flame, 9, [0.2, 0.85, 1, 0.75]);
  }
}

function renderShield(cell, p, angle) {
  const nozzle = shieldDirection(cell, p, angle);
  const center = { x: p.x + nozzle.x * 60, y: p.y + nozzle.y * 60 };
  renderer.ring(center, 48, 4, [0.35, 1, 0.94, cell.fire ? 0.55 : 0.24], 28);
}

function shieldDirection(cell, origin = cellWorldPosition(cell), angle = state.station.angle) {
  const enemy = selectTarget(origin, 420);
  if (enemy) return normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  return rotate(thrusterNozzle(cell), angle);
}

// v0.7.0：优先目标锁定框（红十字 + 脉冲旋转圆环），仅在 priorityTarget 有效时绘制
function renderPriorityTargetLockOverlay() {
  const pt = state.input.priorityTarget;
  if (!pt || !pt.enemy) return;
  const enemy = pt.enemy;
  if (enemy.hp <= 0) return;

  const baseRadius = enemy.kind === "hostile-station" ? 80 : (enemy.r || 24) * 1.5;
  const t = state.time;
  const pulseAlpha = 0.5 + 0.5 * Math.sin((t / PRIORITY_TARGET_RING_PULSE_PERIOD) * Math.PI * 2);
  const rotation = (t * PRIORITY_TARGET_RING_ROTATE_RATE) % (Math.PI * 2);
  const center = { x: enemy.x, y: enemy.y };
  const ringColor = [1, 68 / 255, 68 / 255, pulseAlpha];

  renderer.ring(center, baseRadius, 2, ringColor, 64);

  for (let i = 0; i < 4; i++) {
    const ang = rotation + i * Math.PI / 2;
    const inner = baseRadius - 6;
    const outer = baseRadius + 6;
    renderer.line(
      { x: center.x + Math.cos(ang) * inner, y: center.y + Math.sin(ang) * inner },
      { x: center.x + Math.cos(ang) * outer, y: center.y + Math.sin(ang) * outer },
      2,
      ringColor
    );
  }

  const crossSize = 20 / state.camera.zoom;
  const crossWidth = 2 / state.camera.zoom;
  const crossAlpha = 0.8 + 0.2 * pulseAlpha;
  const crossColor = [1, 68 / 255, 68 / 255, crossAlpha];
  renderer.line(
    { x: center.x - crossSize, y: center.y },
    { x: center.x + crossSize, y: center.y },
    crossWidth,
    crossColor
  );
  renderer.line(
    { x: center.x, y: center.y - crossSize },
    { x: center.x, y: center.y + crossSize },
    crossWidth,
    crossColor
  );
}

function renderEnemies() {
  for (const enemy of state.enemies) {
    if (enemy.kind === "hostile-station") {
      renderHostileStation(enemy);
    } else if (enemy.kind === "asteroid") {
      renderer.rect(enemy, enemy.r * 1.8, enemy.r * 1.5, enemy.angle, [0.65, 0.56, 0.48, 1]);
    } else if (enemy.kind === "pirate") {
      renderer.rect(enemy, enemy.r * 2.0, enemy.r * 1.1, enemy.angle, [0.95, 0.25, 0.22, 1]);
      renderer.circle(enemy, enemy.r * 0.45, [0.2, 0.02, 0.03, 1], 12);
    } else if (enemy.kind === "guardian") {
      const pulse = 0.55 + 0.45 * Math.sin(state.time * 2.5);
      renderer.rect(enemy, enemy.r * 1.9, enemy.r * 1.9, enemy.angle, enemy.mainColor || [0.55, 0.05, 0.1, 1]);
      renderer.rect(enemy, enemy.r * 2.6, enemy.r * 0.5, enemy.angle + Math.PI / 4, enemy.wingColor || [0.85, 0.2, 0.18, 1]);
      renderer.rect(enemy, enemy.r * 2.6, enemy.r * 0.5, enemy.angle - Math.PI / 4, enemy.wingColor || [0.85, 0.2, 0.18, 1]);
      renderer.circle(enemy, enemy.r * 0.34, [0.16, 0.02, 0.04, 1], 14);
      renderer.ring(enemy, enemy.r + 22, 6, [1, 0.25, 0.2, 0.22 + pulse * 0.22], 44);
    } else {
      renderer.rect(enemy, enemy.r * 1.8, enemy.r * 1.8, enemy.angle, [0.62, 0.18, 0.14, 1]);
      renderer.rect(enemy, enemy.r * 2.4, enemy.r * 0.42, enemy.angle + Math.PI / 4, [0.8, 0.28, 0.22, 1]);
      renderer.rect(enemy, enemy.r * 2.4, enemy.r * 0.42, enemy.angle - Math.PI / 4, [0.8, 0.28, 0.22, 1]);
    }
    const hp = clamp(enemy.hp / Math.max(1, enemy.maxHp || enemy.hp), 0, 1);
    renderer.line(
      { x: enemy.x - enemy.r, y: enemy.y - enemy.r - 10 },
      { x: enemy.x - enemy.r + enemy.r * 2 * hp, y: enemy.y - enemy.r - 10 },
      4,
      enemy.kind === "guardian" ? [1, 0.45, 0.35, 0.9]
        : enemy.kind === "hostile-station" ? [1, 0.32, 0.18, 0.9]
        : [1, 0.18, 0.18, 0.8]
    );
  }
}

// v0.6.0 hostile-station 渲染：遍历 cells 走 cellWorldPositionByTransform，敌方红色色调
function renderHostileStation(enemy) {
  if (!enemy.cells || !enemy.cells.size) return;
  const transform = {
    pos: { x: enemy.x, y: enemy.y },
    angle: enemy.angle || 0,
    origin: { x: 0, y: 0 }
  };
  const pulse = 0.5 + 0.5 * Math.sin(state.time * 2.0);
  enemy.cells.forEach((cell, cellKey) => {
    const p = cellWorldPositionByTransform(cell, transform);
    const isDead = cell.hp <= 0;
    if (isDead) {
      // 破损残骸：深灰深红 + 半透明
      renderer.rect(p, CELL * 0.78, CELL * 0.78, transform.angle, [0.25, 0.12, 0.1, 0.55]);
      renderer.rect(p, CELL * 0.92, 2, transform.angle, [0.55, 0.18, 0.14, 0.6]);
      renderer.rect(p, 2, CELL * 0.92, transform.angle, [0.55, 0.18, 0.14, 0.6]);
      return;
    }
    let bodyColor;
    let edgeColor = [0.18, 0.04, 0.04, 0.95];
    if (cell.facility === "core") {
      bodyColor = [0.78, 0.18, 0.18, 1];
    } else if (cell.facility === "power") {
      bodyColor = [0.62, 0.22, 0.05, 1];
    } else if (cell.facility === "turret") {
      bodyColor = [0.85, 0.32, 0.22, 1];
    } else if (cell.facility === "shield") {
      bodyColor = [0.55, 0.2, 0.32, 1];
    } else if (cell.facility === "armor") {
      bodyColor = [0.5, 0.18, 0.18, 1];
    } else {
      // frame / 兜底
      bodyColor = [0.42, 0.18, 0.18, 1];
    }
    renderer.rect(p, CELL * 0.88, CELL * 0.88, transform.angle, bodyColor);
    renderer.rect(p, CELL * 0.96, 2, transform.angle, edgeColor);
    renderer.rect(p, 2, CELL * 0.96, transform.angle, edgeColor);
    if (cell.facility === "core") {
      // 核心红色脉冲圈（仿 guardian aura，提示玩家"这里是关键目标"）
      renderer.circle(p, CELL * 0.32, [0.18, 0.02, 0.04, 1], 16);
      renderer.ring(p, CELL * 0.56, 3, [1, 0.28, 0.2, 0.35 + pulse * 0.35], 28);
    } else if (cell.facility === "turret") {
      // 炮口指示：朝远离 station 的方向延伸（让玩家直觉判断武器朝向）
      const cellAngle = Math.atan2(cell.y, cell.x);
      const barrelAngle = (enemy.angle || 0) + cellAngle;
      const barrelLen = CELL * 0.5;
      const bx = p.x + Math.cos(barrelAngle) * barrelLen;
      const by = p.y + Math.sin(barrelAngle) * barrelLen;
      renderer.line(p, { x: bx, y: by }, 4, [0.95, 0.45, 0.3, 0.95]);
    } else if (cell.facility === "shield") {
      // 护盾发生器：小光晕
      renderer.ring(p, CELL * 0.42, 2, [0.95, 0.55, 0.7, 0.55], 20);
    }
    // 单 cell HP bar（hp < 95% 时显示）
    const hpRate = clamp(cell.hp / Math.max(1, cell.maxHp), 0, 1);
    if (hpRate < 0.95) {
      const barCenter = cellWorldPositionByTransform(cell, transform, { x: 0, y: CELL * 0.54 });
      const a = { x: barCenter.x - CELL * 0.35, y: barCenter.y };
      const b = { x: a.x + CELL * 0.7 * hpRate, y: a.y };
      renderer.line(a, b, 3, [1, 0.32, 0.22, 0.9]);
    }
  });
  // 外层红色危险光晕（hostile-station 整体识别标记）
  const outerPulse = 0.4 + 0.6 * Math.sin(state.time * 1.6);
  renderer.ring(enemy, enemy.r + 14, 3, [1, 0.25, 0.2, 0.18 + outerPulse * 0.12], 48);
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
  if (isObjectiveComplete()) return buildCompletedObjectiveGuide().next;
  if (!objective) return "扩建设施、完成任务或应对来敌。";
  return OBJECTIVE_TYPES[objective.type]?.getHint?.(objective) || "";
}

function buildGuideText() {
  const panelGuide = buildPanelAwareGuide();
  if (panelGuide) return panelGuide;

  const objective = state.run.objective;
  if (isObjectiveComplete()) {
    return buildCompletedObjectiveGuide();
  }
  if (state.run.endgame && objective?.type === "guardian") {
    return {
      goal: "终末星系：摧毁守护者",
      next: "守护者位于远距红色光环区域；击毁后可结算并选择开始新局或自由游玩。"
    };
  }
  const frameCount = countFacility("frame");
  const powerCount = countFacility("power");
  const miningCount = countFacility("mining");
  const thrusterCount = countFacility("thruster");
  const isEarlyRun = state.run.level === 0 && state.run.completedObjectives === 0;

  if (isEarlyRun && objective?.type === "mine") {
    const mineGuide = buildEarlyMineObjectiveGuide(objective, powerCount, miningCount);
    if (mineGuide) return mineGuide;
  }

  if (isEarlyRun) {
    if (frameCount <= 6 && objective?.type !== "mine") {
      return {
        goal: "扩建空间站骨架",
        next: "选中「框架」，在核心外围已连接的空格点击建造。"
      };
    }
    if (powerCount === 0 && objective?.type !== "mine") {
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
    if (objective?.type === "explore" && !state.target) {
      return {
        goal: "完成当前星系任务",
        next: `${getMoveControlHint()}，或点空白处设定航行目标，朝金色信标环前进。`
      };
    }
    if (thrusterCount === 0) {
      return {
        goal: "学习移动空间站",
        next: "在框架上建造「推进器」；默认屏幕方向移动，展开「更多状态」可切换移动模式；鼠标决定朝向。"
      };
    }
    if (!state.target && !hasKeyboardThrust() && length(state.station.vel) < 3) {
      return {
        goal: objective ? "完成当前星系任务" : "熟悉基本操作",
        next: objective
          ? `${getMoveControlHint()}，按任务提示推进「${objective.text}」。`
          : `${getMoveControlHint()}；鼠标指向决定朝向；拖动画布可手动旋转与缩放。`
      };
    }
  }

  if (miningCount > 0 && !hasStableResourceHarvest()) {
    const nearest = getNearestResourceBody();
    if (nearest && nearest.distance > nearest.range) {
      return {
        goal: "靠近带彩色外环的资源点",
        next: "橙色外环产矿石，银色外环产金属；驾驶工站进入外环后，采矿站采集更有效。"
      };
    }
  }

  const nextStep = pickNextForObjective(objective);
  return {
    goal: objective ? "完成当前星系任务" : "维持空间站运转",
    next: objective
      ? (nextStep || `任务目标：${objective.text}；完成后会出现跃迁选择。`)
      : (nextStep || "扩建设施、完成任务或应对来敌。")
  };
}

function buildLowNoiseDesignIssueAlerts(health = getStationDesignHealth()) {
  const now = state.time;
  if (now < designIssueAlertRuntime.lastTime) {
    designIssueAlertRuntime.activeKeys.clear();
    designIssueAlertRuntime.lastRaisedAt.clear();
  }
  designIssueAlertRuntime.lastTime = now;

  const issues = Array.isArray(health?.criticalIssues) ? health.criticalIssues : [];
  if (!issues.length) {
    designIssueAlertRuntime.activeKeys.clear();
    return [];
  }
  const sorted = [];
  const seen = new Set();
  for (const issue of issues) {
    const issueKey = issue?.key || issue?.reasonKey;
    if (!issueKey || seen.has(issueKey)) continue;
    seen.add(issueKey);
    sorted.push(issue);
  }
  sorted.sort((a, b) => {
    const priorityA = getDesignIssuePriority(a.key || a.reasonKey);
    const priorityB = getDesignIssuePriority(b.key || b.reasonKey);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return String(a.key || a.reasonKey).localeCompare(String(b.key || b.reasonKey));
  });

  const nextActiveKeys = new Set();
  const alerts = [];
  for (const issue of sorted) {
    if (alerts.length >= DESIGN_ISSUE_ALERT_MAX) break;
    const issueKey = issue.key || issue.reasonKey;
    if (!issueKey) continue;
    const cooldown = Number.isFinite(issue.cooldownSec) ? issue.cooldownSec : DESIGN_ISSUE_ALERT_COOLDOWN_SEC;
    const wasActive = designIssueAlertRuntime.activeKeys.has(issueKey);
    const lastRaisedAt = designIssueAlertRuntime.lastRaisedAt.get(issueKey);
    if (!wasActive && Number.isFinite(lastRaisedAt) && now - lastRaisedAt < cooldown) {
      continue;
    }
    if (!wasActive) {
      designIssueAlertRuntime.lastRaisedAt.set(issueKey, now);
    }
    nextActiveKeys.add(issueKey);
    alerts.push({
      level: mapDesignSeverityToAlertLevel(issue.severity),
      cssClass: "alert-design-issue",
      text: issue.message || DESIGN_ISSUE_COPY[issue.key] || issue.reasonKey || issue.key
    });
  }

  for (const preservedKey of [...designIssueAlertRuntime.lastRaisedAt.keys()]) {
    if (shouldSustainCombatAlert(preservedKey)) {
      nextActiveKeys.add(preservedKey);
    }
  }
  designIssueAlertRuntime.activeKeys = nextActiveKeys;
  for (const [issueKey, lastRaisedAt] of designIssueAlertRuntime.lastRaisedAt) {
    if (now - lastRaisedAt > DESIGN_ISSUE_ALERT_COOLDOWN_SEC * 6) {
      designIssueAlertRuntime.lastRaisedAt.delete(issueKey);
    }
  }
  return alerts;
}

function buildStatusAlerts() {
  const alerts = [];
  const designHealth = getStationDesignHealth();
  const designIssueAlerts = buildLowNoiseDesignIssueAlerts(designHealth);
  if (state.run.startupHint && state.time <= state.run.startupHintUntil) {
    alerts.push({
      level: "good",
      text: state.run.startupHint
    });
  }
  if (state.run.endgame && !state.run.guardianDefeated) {
    alerts.push({
      level: "danger",
      text: "终末星系：摧毁守护者结束本局。守护者会周期增援海盗。"
    });
  } else if (state.run.endgame && state.run.guardianDefeated) {
    if (state.run.settlementShown) {
      alerts.push({
        level: "good",
        text: "守护者已击毁：请在结算面板选择「开始新局」或「留在终结星系自由游玩」。"
      });
    } else if (state.run.endgameExplore) {
      alerts.push({
        level: "good",
        text: "自由游玩中：击毁敌人和采集资源会继续累积局外点数。"
      });
    }
  } else if (isObjectiveComplete()) {
    if (state.run.awaitingObjectiveChoice) {
      alerts.push({
        level: "good",
        text: "星系任务已完成：可以跃迁下一星系，也可以暂时停留整理防御和资源。"
      });
    } else {
      alerts.push({
        level: "good",
        text: "任务已完成，可随时跃迁；Esc 或「暂时停留」不会确认跃迁。"
      });
    }
  } else if (isObjectiveFailed()) {
    alerts.push({
      level: "danger",
      text: "任务已失败，本关无法跃迁；可重启本局或留在本关自由游玩。"
    });
  }
  if (state.lastBuildError) {
    alerts.push({
      level: "danger",
      text: state.lastBuildError
    });
  }
  if (designIssueAlerts.length) {
    alerts.push(...designIssueAlerts);
  }
  const threatSummary = getThreatSummary();
  const weaponEffectiveness = getWeaponEffectiveness();
  const damageSummary = getRecentDamageSummary();
  const repairSummary = getRepairStatusSummary();
  const threatAlerts = buildThreatSummaryAlerts(threatSummary);
  if (threatAlerts.length) {
    alerts.unshift(...threatAlerts.slice(0, THREAT_STATUS_ALERT_MAX));
  }
  const weaponAlerts = buildWeaponEffectivenessAlerts(weaponEffectiveness);
  if (weaponAlerts.length) {
    alerts.splice(threatAlerts.length, 0, ...weaponAlerts);
  }
  const damageRepairAlerts = buildDamageRepairStatusAlerts(damageSummary, repairSummary, threatSummary);
  if (damageRepairAlerts.length) {
    alerts.splice(threatAlerts.length + weaponAlerts.length, 0, ...damageRepairAlerts);
  }
  if (state.buildHint && !state.lastBuildError) {
    alerts.push({
      level: state.bridgePreview?.tier === "ready" ? "good" : "warn",
      cssClass: "alert-bridge-hint",
      text: state.buildHint
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
    const missing = getBuildPaletteMissingResources(cost);
    if (missing.length) {
      const missingSummary = formatMissingResourceGaps(missing) || formatCost(cost);
      alerts.push({
        level: "warn",
        text: `当前仍选中「${TYPES[state.selectedBuild].name}」：下一座还缺 ${missingSummary}（不是刚才建造失败；核心会缓慢产金属）`
      });
    } else if (
      state.selectedBuild !== "frame"
      && state.placementPreview
      && !state.placementPreview.placement.valid
      && state.placementPreview.placement.reasonKey
    ) {
      const reason = PLACEMENT_DIAGNOSTICS_COPY[state.placementPreview.placement.reasonKey]
        || PLACEMENT_DIAGNOSTICS_COPY.placement_invalid;
      alerts.push({
        level: "warn",
        text: `无法放置：${reason}`
      });
    }
  }
  return alerts;
}

function buildResourceGuideHtml() {
  const nearest = getNearestResourceBody();
  const status = getMiningStationStatus();
  const lines = [];
  const objective = state.run.objective;
  const miningEstablished = status.harvesting.length > 0;
  const objectiveProgressed = objective && objective.progress >= objective.target * 0.25;
  const coverageDiagnostics = miningEstablished ? null : getMiningCoverageDiagnosticsForUi();

  if (miningEstablished && (isObjectiveComplete() || objectiveProgressed)) {
    return `<div class="resource-line resource-active good">资源采集已建立：继续完成星系任务，或补充防御后准备跃迁。</div>`;
  }

  if (coverageDiagnostics) {
    lines.push(buildMiningStatusChipHtml(status, coverageDiagnostics.reachability));
    const guidance = buildMiningExpansionGuidanceHtml(coverageDiagnostics);
    if (guidance) lines.push(guidance);
  }

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
    const ringHint = body.resource === "ore" || body.resource === "metal"
      ? "，适合补采矿站成本"
      : "";
    lines.push(`<div class="resource-line"><span class="resource-dot resource-${visual.css}"></span>附近资源：<strong>${visual.label}外环</strong>${ringHint} · ${body.name} · 剩余 ${Math.floor(body.amount)}</div>`);
    lines.push(`<div class="resource-line resource-meta">把采矿站放在外环旁，并驾驶工站进入外环。距离 ${Math.floor(distance)} / 采矿范围 ${Math.floor(range)}${inRange ? " · <span class='good'>已进入范围</span>" : ` · <span class='warn'>还需靠近 ${gap}</span>`}</div>`);
  } else {
    lines.push(`<div class="resource-line">当前星系暂无可用资源天体。</div>`);
  }

  if (!coverageDiagnostics) {
    if (status.miners.length === 0) {
      lines.push(`<div class="resource-line resource-meta">尚未建造采矿站 — 选「采矿站」建在框架上，再进入资源外环。</div>`);
    } else if (status.harvesting.length === 0) {
      if (status.manualOff.length === status.miners.length) {
        lines.push(`<div class="resource-line warn">采矿站已全部手动关闭 — 选中格子点「开关设施」恢复。</div>`);
      } else if (status.inactivePower.length > 0 && status.activeMiners.length === 0) {
        lines.push(`<div class="resource-line warn">采矿站因电力不足未运作 — 增建发电站或关闭低优先级设施。</div>`);
      } else if (nearest && nearest.distance > nearest.range) {
        lines.push(`<div class="resource-line warn">采矿站就绪，请进入「${nearest.body.name}」的彩色外环（还差 ${Math.ceil(nearest.distance - nearest.range)}）。</div>`);
        lines.push(`<div class="resource-line warn">当前矿站不会产出；需沿框架扩建到彩色外环内，或驾驶工站靠近资源后重建采矿站。</div>`);
      } else if (nearest && nearest.body.amount <= 0) {
        lines.push(`<div class="resource-line warn">最近资源点已采空，请前往其他带彩色外环的天体。</div>`);
      }
    }
  } else if (status.miners.length === 0) {
    lines.push(`<div class="resource-line resource-meta">尚未建造采矿站 — 选「采矿站」建在连接框架上。</div>`);
  } else if (status.harvesting.length === 0) {
    if (status.manualOff.length === status.miners.length) {
      lines.push(`<div class="resource-line warn">采矿站已全部手动关闭 — 选中格子点「开关设施」恢复。</div>`);
    } else if (status.inactivePower.length > 0 && status.activeMiners.length === 0) {
      lines.push(`<div class="resource-line warn">采矿站因电力不足未运作 — 增建发电站或关闭低优先级设施。</div>`);
    } else if (nearest && nearest.body.amount <= 0) {
      lines.push(`<div class="resource-line warn">最近资源点已采空，请前往其他带彩色外环的天体。</div>`);
    }
  }

  if (nearest || status.miners.length === 0) {
    lines.push(`<div class="resource-line resource-meta resource-color-legend">橙=矿石，银=金属，绿=气体，紫=等离子。</div>`);
  }

  if (state.selectedBuild && state.selectedBuild !== "frame" && state.input.mouseWorld) {
    const grid = worldToGrid(state.input.mouseWorld);
    const preview = state.placementPreview;
    const diagnostics = preview
      && preview.facility === state.selectedBuild
      && preview.gridX === grid.x
      && preview.gridY === grid.y
      ? preview
      : getPlacementDiagnostics(state.selectedBuild, grid.x, grid.y);
    const placementLine = buildPlacementResourceGuideLine(
      diagnostics
    );
    if (placementLine) lines.push(placementLine);
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
  const researchRate = getResearchRatePerSec();
  const researchRateText = researchRate >= 0.05 ? ` (+${researchRate.toFixed(1)}r/s)` : "";
  const researchTitle = researchRate >= 0.05
    ? ` title="近 30 秒研发来源：任务奖励 + 研发设施产出，约 ${researchRate.toFixed(1)} 点/秒"`
    : "";
  const resourceSpans = [
    `金属 ${Math.floor(r.metal)}`,
    `矿物 ${Math.floor(r.ore)}`,
    `气体 ${Math.floor(r.gas)}`,
    `等离子 ${Math.floor(r.plasma)}`,
    `<span${researchTitle}>科研 ${Math.floor(r.research)}${researchRateText}</span>`,
    `电力 ${Math.floor(state.power.used)}/${Math.floor(state.power.available)}`
  ].map((text, index) => {
    if (index === 4) return text;
    const powerClass = index === 5 && powerTight ? ' class="power-low"' : "";
    return `<span${powerClass}>${text}</span>`;
  });
  setHtmlIfChanged(resourcesEl, "resources", resourceSpans.join(""));
  updateWeaponsRow();

  const guide = buildGuideText();
  if (state.hud.guideGoal !== guide.goal) {
    state.hud.guideGoal = guide.goal;
    currentGoalEl.textContent = guide.goal;
  }
  if (state.hud.guideNext !== guide.next) {
    state.hud.guideNext = guide.next;
    nextStepEl.textContent = guide.next;
  }

  const fragmentAlerts = buildFragmentHudAlerts();
  const hostileStationAlerts = buildHostileStationHudAlerts();
  const encounterAlerts = buildEncounterHudAlerts();
  const npcAlerts = buildNpcHudAlerts();
  const alerts = buildStatusAlerts();
  const miningAlerts = buildMiningAlerts();
  const allAlerts = isObjectiveComplete()
    ? [...fragmentAlerts, ...hostileStationAlerts, ...encounterAlerts, ...npcAlerts, ...alerts, ...miningAlerts]
    : [...fragmentAlerts, ...hostileStationAlerts, ...encounterAlerts, ...npcAlerts, ...miningAlerts, ...alerts];
  const alertsHtml = allAlerts
    .map((a) => {
      const extraClass = a.cssClass ? ` ${a.cssClass}` : "";
      return `<div class="alert-item alert-${a.level}${extraClass}">${a.text}</div>`;
    })
    .join("");
  setHtmlIfChanged(statusAlertsEl, "alerts", alertsHtml);

  const resourceGuideHtml = buildResourceGuideHtml();
  setHtmlIfChanged(resourceGuideEl, "resourceGuide", resourceGuideHtml);

  const objective = state.run.objective;
  const displayProgress = getObjectiveDisplayProgress(objective);
  const progress = displayProgress.ratio;
  const progressDetail = objective
    ? OBJECTIVE_TYPES[objective.type]?.getDetail?.(objective, displayProgress) || ""
    : "";
  const objectiveComplete = isObjectiveComplete();
  const objectiveFailed = isObjectiveFailed();
  let objectiveHtml = objective
    ? `${objective.text}<br><span class="${objectiveFailed ? "bad" : progress >= 1 || objectiveComplete ? "good" : ""}">${objectiveFailed ? "任务失败" : `进度 ${Math.floor(progress * 100)}%`}${progressDetail ? ` · ${progressDetail}` : ""}</span>`
    : "无任务";
  if (objectiveComplete && objective) {
    const statusNote = state.run.endgame
      ? state.run.endgameExplore
        ? " · 自由游玩中"
        : state.run.settlementShown
          ? " · 已进入终局结算"
          : " · 守护者已击毁"
      : state.run.awaitingObjectiveChoice
        ? " · 请选择跃迁或停留"
        : " · 可随时跃迁";
    objectiveHtml += `<br><span class="good">任务已完成${statusNote}</span>`;
  }
  if (objectiveFailed) {
    const failureHints = getMetaSettlementHints();
    const purchaseLine = failureHints.recommended.length
      ? `可购买：${failureHints.recommended.map((entry) => entry.name).join("、")}`
      : (failureHints.nearestShortfall
        ? `还差 ${failureHints.nearestShortfall.deficit} 点可购买「${failureHints.nearestShortfall.name}」`
        : "当前暂无可购买节点");
    objectiveHtml += `<br><span class="bad">本关无法跃迁，可重启或留在本关。</span>`;
    objectiveHtml += `<br><span class="warn">局外成长：本局 +${failureHints.pointsGained} 点，当前 ${failureHints.totalPoints} 点；${purchaseLine}</span>`;
    objectiveHtml += `<br><span class="good">${failureHints.protocolAdvice.message}</span>`;
  }
  setHtmlIfChanged(objectiveEl, "objective", objectiveHtml);
  updateObjectiveChoiceUi();
  updateRunSettlementPanel();
  updateQuickRestartVisibility();

  const core = state.station.cells.get(key(0, 0));
  const active = [...state.station.cells.values()].filter((c) => c.active && !c.detached).length;
  const detached = [...state.station.cells.values()].filter((c) => c.detached).length;
  const selected = state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
  setHtmlIfChanged(stationDataEl, "status", [
    `核心耐久：${Math.ceil(core.hp)}/${Math.ceil(core.maxHp)}`,
    `结构：${state.station.cells.size} 个，运作：${active}，脱落：${detached}`,
    `速度：${Math.floor(length(state.station.vel))} / 科技等级：${state.station.techLevel}`
  ].join("<br>"));
  setHtmlIfChanged(
    designHealthSummaryEl,
    "designHealthSummary",
    buildStationDesignHealthSummaryHtml(getStationDesignHealth())
  );
  setHtmlIfChanged(
    combatReviewSummaryEl,
    "combatReviewSummary",
    buildCombatReviewSummaryHtml(getCombatReview())
  );
  setHtmlIfChanged(
    combatStatusSummaryEl,
    "combatStatusSummary",
    buildCombatStatusSummaryHtml(getThreatSummary(), getWeaponEffectiveness())
  );
  updateSelectedCellPanel(selected);

  const runInfo = [
    `已完成 ${state.run.completedObjectives} 项任务`,
    `${state.run.playerCount} 人缩放`,
    state.run.endgameActivityPoints > 0 ? `自由游玩点数 +${state.run.endgameActivityPoints}` : ""
  ].filter(Boolean).join(" / ");
  if (state.hud.runInfo !== runInfo) {
    state.hud.runInfo = runInfo;
    runInfoEl.textContent = runInfo;
  }
  const dangerStage = DANGER_STAGES[levelIndex(state.run.level)] || DANGER_STAGES[0];
  if (runDangerEl) {
    runDangerEl.textContent = `危险度：${dangerStage.label}`;
    runDangerEl.className = `run-pill ${dangerStage.className}`;
  }
  if (runProgressEl) {
    runProgressEl.textContent = `第 ${Math.min(state.run.level + 1, TOTAL_RUN_LEVELS)} 关 / 共 ${TOTAL_RUN_LEVELS} 关`;
  }
  const asyncText = `异步敌站: ${state.asyncEnabled ? "开" : "关"}`;
  if (state.hud.asyncText !== asyncText) {
    state.hud.asyncText = asyncText;
    document.getElementById("toggleAsyncBtn").textContent = asyncText;
  }
  updateMetaUi();
  updateControlModeUi();
  updateCurrentGalaxyInfoHud();
  updateGalaxyPathHud();
  updateBuildButtons();
}

function setHtmlIfChanged(element, cacheKey, html) {
  if (!element) return;
  if (state.hud[cacheKey] === html) return;
  state.hud[cacheKey] = html;
  element.innerHTML = html;
}

// v0.7.0：HUD 武器行（导弹井 / 炮塔 / 齐射档 / LOS 遮挡计数）
function updateWeaponsRow() {
  if (!weaponsRowEl) return;

  let missileReady = 0;
  let missileTotal = 0;
  let nextReload = Infinity;
  let turretReady = 0;
  let turretTotal = 0;
  let turretBlocked = 0;

  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.enabled) continue;
    if (cell.facility === "missile") {
      missileTotal++;
      if (cell.reload <= 0) missileReady++;
      else nextReload = Math.min(nextReload, cell.reload);
    } else if (cell.facility === "turret") {
      turretTotal++;
      if (cell.reload <= 0) turretReady++;
      if (cell._losBlockedAt && state.time - cell._losBlockedAt < LOS_BLOCK_WARN_DURATION) {
        turretBlocked++;
      }
    }
  }

  const salvo = state.missile.salvoSize >= 999 ? "all" : state.missile.salvoSize;
  const nextStr = nextReload === Infinity ? "-" : `${nextReload.toFixed(1)}秒`;

  let html = "";
  if (missileTotal > 0) {
    html += `导弹井 ${missileReady}/${missileTotal} 就绪 · 齐射 <span class="salvo-current">${salvo}</span> · 下一发 ${nextStr}`;
  }
  if (turretTotal > 0) {
    if (html) html += " · ";
    html += `炮塔 ${turretReady}/${turretTotal} 工作`;
    if (turretBlocked > 0) {
      html += ` · <span class="losblocked">${turretBlocked} 个被自机遮挡</span>`;
    }
  }
  if (html) {
    html += ` <span class="hint">F=齐射 · [/]=调档 · 右键锁敌</span>`;
  }
  html += buildThreatHudFragment();
  html += buildWeaponHudFragment();

  setHtmlIfChanged(weaponsRowEl, "weaponsRow", html);
}

function renderSelectedCellReloadBar(cell) {
  if (cell.facility !== "missile" && cell.facility !== "turret") return "";
  const baseReload = getCellStat(cell, "reload");
  const remaining = Math.max(0, cell.reload);
  const progress = baseReload > 0 ? 1 - remaining / baseReload : 1;
  const percent = Math.round(progress * 100);

  let colorClass = "reload-low";
  if (percent >= 100) colorClass = "reload-ready";
  else if (percent >= 75) colorClass = "reload-high";
  else if (percent >= 25) colorClass = "reload-mid";

  const label = percent === 100 ? "就绪" : `${percent}% (${remaining.toFixed(1)}s)`;
  return `
    <div class="reload-bar-container">
      <div class="reload-bar ${colorClass}" style="width: ${percent}%;"></div>
      <span class="reload-label">${label}</span>
    </div>
  `;
}

function updateSelectedCellPanel(cell) {
  if (!cell) {
    if (state.hud.selected !== "" || state.hud.selectedDiagnostics !== "") {
      state.hud.selected = "";
      state.hud.selectedDiagnostics = "";
      state.hud.selectedUpgradeKey = "";
      selectedCellPanelEl.classList.add("hidden");
      selectedCellInfoEl.textContent = "";
      if (selectedCellDiagnosticsEl) {
        selectedCellDiagnosticsEl.innerHTML = "";
        selectedCellDiagnosticsEl.classList.add("hidden");
      }
      if (selectedCellUpgradeEl) {
        selectedCellUpgradeEl.innerHTML = "";
        selectedCellUpgradeEl.classList.add("hidden");
      }
      if (selectedCellModificationEl) {
        selectedCellModificationEl.innerHTML = "";
        selectedCellModificationEl.classList.add("hidden");
      }
      state.hud.selectedModificationKey = "";
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
  const infoHtml = `已选：${name} ${cell.enabled ? "<span class='good'>启用</span>" : "<span class='danger'>关闭</span>"} / 优先级 ${cell.priority}${stateNote}`;
  const reloadHtml = renderSelectedCellReloadBar(cell);
  const html = infoHtml + reloadHtml;
  document.getElementById("toggleSelectedBtn").disabled = cell.facility === "core";
  document.getElementById("prioritySelectedBtn").disabled = cell.facility === "core";
  if (state.hud.selected !== html) {
    state.hud.selected = html;
    selectedCellPanelEl.classList.remove("hidden");
    selectedCellInfoEl.innerHTML = html;
  }
  const diagnosticsHtml = buildSelectedCellDiagnosticsHtml(getSelectedCellDiagnostics(cell));
  if (selectedCellDiagnosticsEl) {
    setHtmlIfChanged(selectedCellDiagnosticsEl, "selectedDiagnostics", diagnosticsHtml);
    selectedCellDiagnosticsEl.classList.toggle("hidden", !diagnosticsHtml);
  }
  renderSelectedCellUpgradePanel(cell);
  renderSelectedCellModificationPanel(cell);
}

function updateMetaUi() {
  if (!isMetaObject(state.meta) || !isMetaObject(state.meta.talents)) {
    state.meta = ensureMetaState(state.meta);
  }
  updateMetaEntrySummary();
  if (isMetaPanelOpen()) renderMetaPanel();
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
  upgradeSelectedCell(path) {
    const cell = state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
    if (!cell) return;
    const cost = getTierUpgradeCost(cell.tier || 0);
    if ((state.resources.research || 0) < cost) {
      showToast("研发点不足。");
      updateHud();
      return;
    }
    if (!upgradeSelectedCell(path)) {
      showToast("无法升级该设施。");
      updateHud();
    } else {
      state.hud.selectedUpgradeKey = "";
      state.hud.selectedModificationKey = "";
    }
  },
  applyModificationToSelected(modIndex) {
    const cell = state.selectedCell ? state.station.cells.get(state.selectedCell) : null;
    if (!cell) return;
    if ((state.resources.research || 0) < MODIFICATION_COST) {
      showToast("研发点不足。");
      updateHud();
      return;
    }
    if (!applyModification(cell, modIndex)) {
      showToast("无法改造该设施。");
      updateHud();
    } else {
      state.hud.selectedUpgradeKey = "";
      state.hud.selectedModificationKey = "";
    }
  },
  unlockGlobalResearch(modKey) {
    if (!unlockGlobalResearch(modKey)) {
      showToast("研发点不足或已激活。");
      updateHud();
      return;
    }
    renderResearchTreePanel();
  },
  toggleResearchTree(open) {
    toggleResearchTree(open);
  },
  toggleMetaPanel(open) {
    toggleMetaPanel(open);
  },
  purchaseMetaTalent(talentId) {
    handleMetaTalentPurchase(talentId);
  },
  selectStartProtocol(protocolId) {
    handleMetaProtocolSelect(protocolId);
  },
  buyTalent(type) {
    const legacyTalentMap = {
      mining: "miningYield",
      hull: "hullIntegrity",
      weapons: "weaponCalibration"
    };
    const talentId = legacyTalentMap[type];
    if (!talentId) {
      showToast("未知天赋类型。");
      updateHud();
      return;
    }
    const result = purchaseMetaTalent(talentId);
    if (!result.ok) {
      if (result.reason === "max_rank_reached") {
        showToast("该天赋已满级。");
      } else if (result.reason === "prereq_unmet") {
        showToast("前置天赋未满足。");
      } else {
        showToast("局外点数不足。");
      }
      updateHud();
      return;
    }
    showToast("天赋已保存，会持续影响之后的局。");
    updateHud();
  },
  buyUnlock(type) {
    const legacyUnlockMap = {
      efficientCore: "efficientCore",
      weaponFrame: "weaponFrame"
    };
    const talentId = legacyUnlockMap[type];
    if (!talentId) {
      showToast("未知改造类型。");
      updateHud();
      return;
    }
    const result = purchaseMetaTalent(talentId);
    if (!result.ok) {
      if (result.reason === "max_rank_reached") {
        showToast("该改造已经解锁。");
      } else if (result.reason === "prereq_unmet") {
        showToast("前置天赋未满足。");
      } else {
        showToast("解锁需要更多局外点数。");
      }
      updateHud();
      return;
    }
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
  },
  startNewRun() {
    location.reload();
  },
  jumpToNextGalaxy() {
    if (state.run.level >= ENDGAME_LEVEL) {
      showToast("终末星系没有下一跳；可留在当前星系自由游玩，或直接开始新局。");
      return;
    }
    if (isObjectiveFailed()) {
      showToast("任务失败，本关无法跃迁。请重启本局。");
      return;
    }
    if (!isObjectiveComplete()) return;
    const nextLvl = levelIndex(state.run.level + 1);
    if (nextLvl >= ENDGAME_LEVEL) {
      confirmGalaxyJump("warFront");
      return;
    }
    const galaxyPanel = document.getElementById("galaxyMapPanel");
    if (galaxyPanel) {
      if (state.run.galaxyChoicesShown) return;
      const rng = getGalaxyChoiceRng(nextLvl);
      const choices = generateGalaxyChoices(nextLvl, rng);
      if (!choices || choices.length === 0) {
        confirmGalaxyJump("emptyVoid", { allowFallback: true });
        return;
      }
      if (state.run.galaxyMap) {
        state.run.galaxyMap.pendingChoices = choices.slice();
      }
      state.run.galaxyChoicesShown = true;
      const objPanel = document.getElementById("objectiveChoicePanel");
      if (objPanel) objPanel.classList.add("hidden");
      if (!openGalaxyMapPanel(choices)) return;
      updateHud();
      return;
    }
    confirmGalaxyJump("emptyVoid", { allowFallback: true });
  },
  stayInCurrentGalaxy() {
    if (state.run.endgame) return;
    if (!isObjectiveComplete() || !state.run.awaitingObjectiveChoice) return;
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = true;
    showToast("继续在当前星系活动。需要时可点「跃迁下一星系」。");
    updateObjectiveChoiceUi();
    updateHud();
  },
  stayInEndgame() {
    if (!state.run.guardianDefeated) return;
    closeSettlementForExplore();
    updateHud();
  }
};

window.__gameState = state;

window.__gameTest = {
  // v0.9.0：第 3 参 galaxyType 可选，缺省 emptyVoid（行为与 v0.8.0 基线精确等价）；
  // 旧签名 resetRun(seed, level) 完全兼容（不传 galaxyType 时走 emptyVoid 路径）
  resetRun(seed, level, galaxyType = "emptyVoid") {
    ensureRunRuntimeState();
    state.run.seed = seed;
    state.run.level = levelIndex(level);
    state.run.objectiveCompleteAt = 0;
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = false;
    state.run.completedObjectives = 0;
    state.run.totalObjectiveRewardBase = 0;
    state.run.escortLowHpAlerted = false;
    state.run.hostileStationSpawnedThisGalaxy = false;
    state.run.hostileStationAlerted = false;
    state.input.priorityTarget = null;
    state.input.aimingRightButton = false;
    state.input._fLastFireAt = 0;
    state.missile.salvoSize = 1;
    // v0.10.0 S2：避免测试钩子误写盘，resetRun 不再清空真实局外点数。
    state.resources = { ...RUN_BASE_STARTING_RESOURCES };
    state.station.hullMod = 1;
    state.station.weaponMod = 1;
    state.run.metaPointsGainedThisRun = 0;
    state.run.settlementShown = false;
    state.run.settlementMode = "victory";
    resetRunStartProtocolRuntimeState(state.run);
    state.fragments = [];
    state.npcs = [];
    state.enemies = [];
    state.projectiles = [];
    state.repairDrones = [];
    state.particles = [];
    // v0.8.0：resetRun 同步清理 encounter 状态 + HUD 中央 alert 队列与当前
    state.run.encounters = [];
    state.run.encounterCooldownThisGalaxy = new Set();
    state.hudCenterAlertQueue = [];
    state.hudCenterAlertCurrent = null;
    // v0.9.0：在 generateGalaxy 之前先确定 galaxyType + 重置 galaxyMap，
    // 让本次 generateGalaxy 走对应 paletteKey；非法 galaxyType 回落 emptyVoid 等价 v0.8.0
    const safeGalaxyType = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType]) ? galaxyType : "emptyVoid";
    state.run.currentGalaxyType = safeGalaxyType;
    state.run.galaxyMap = { nodes: [], currentNodeId: null, pendingChoices: [] };
    state.run.galaxyChoicesShown = false;
    applyMetaStartProtocol(state.run, state.meta);
    galaxyJumpInFlight = false;
    const lvl = levelIndex(level);
    const galaxy = generateGalaxy(lvl, `${seed}:${lvl}`, safeGalaxyType);
    applyGalaxy(galaxy);
    // 显式补一个对应当前 level + galaxyType 的起点节点
    galaxyNodeIdSeed += 1;
    const startNodeId = `node-${galaxyNodeIdSeed}`;
    state.run.galaxyMap.nodes.push({
      id: startNodeId,
      level: lvl,
      galaxyType: safeGalaxyType,
      visited: true,
      current: true
    });
    state.run.galaxyMap.currentNodeId = startNodeId;
    for (const cell of state.station.cells.values()) {
      resetCellUpgradeState(cell);
    }
    createObjective();
    seedEncountersForLevel(lvl);
    state.run.fragmentHudCache = null;
  },
  // v0.9.0：第 3 参 galaxyType 可选；未传时按 v0.8.0 基线表抽样（与 v0.8.0 行为精确等价）；
  // 传入有效 galaxyType 时叠加 objectiveWeightMod + warFront 的 hostileStationMod
  getObjectiveType(seed, level, galaxyType) {
    const lvl = levelIndex(level);
    const objectiveSeed = (seed ^ 0x9e3779b9) + lvl * 0x85ebca6b;
    const objectiveRng = mulberry32(objectiveSeed);
    const targetGalaxyType = (typeof galaxyType === "string" && GALAXY_TYPES[galaxyType]) ? galaxyType : "emptyVoid";
    const weightTable = getObjectiveWeightsForLevel(lvl, targetGalaxyType, false);
    return pickWeighted(objectiveRng, weightTable);
  },
  sampleAssaultRate(level, sampleCount = 1000, startSeed = 1, galaxyType) {
    let assaultCount = 0;
    for (let i = 0; i < sampleCount; i++) {
      if (this.getObjectiveType(startSeed + i, level, galaxyType) === "assault") assaultCount++;
    }
    return assaultCount / sampleCount;
  },
  findEscortSeed(level = 3, startSeed = 1, maxTries = 5000) {
    for (let seed = startSeed; seed < startSeed + maxTries; seed++) {
      if (this.getObjectiveType(seed, level) === "escort") return seed;
    }
    return null;
  },
  advanceNpcToArrival() {
    const npc = state.npcs[0];
    if (!npc) return { ok: false, reason: "no npc" };
    npc.pos.x = npc.target.x;
    npc.pos.y = npc.target.y;
    tickNpc(npc, 0);
    return {
      ok: true,
      progress: state.run.objective?.progress,
      complete: state.run.objectiveCompleteAt > 0,
      awaiting: state.run.awaitingObjectiveChoice
    };
  },
  advanceNpcs(steps = 120, dt = 0.05) {
    const npc = state.npcs[0];
    if (!npc) return { ok: false, reason: "no npc" };
    const before = { x: npc.pos.x, y: npc.pos.y };
    for (let i = 0; i < steps; i++) {
      state.time += dt;
      updateNpcs(dt);
    }
    const after = state.npcs[0];
    return {
      ok: true,
      moved: after ? Math.hypot(after.pos.x - before.x, after.pos.y - before.y) : 0
    };
  },
  damageEscortNpc(amount) {
    const npc = state.npcs.find((entry) => entry.kind === "friendly-cargo");
    if (!npc) return { ok: false, reason: "no npc" };
    const hpBefore = npc.hp;
    damageNpc(npc, amount);
    return { ok: true, hpBefore, failed: state.run.objective?.failed === true };
  },
  fireEnemyProjectileAtNpc(damage = 20) {
    const npc = state.npcs.find((entry) => entry.kind === "friendly-cargo");
    if (!npc) return { ok: false, reason: "no npc" };
    const hpBefore = npc.hp;
    state.projectiles.push({
      owner: "enemy", x: npc.pos.x, y: npc.pos.y, vx: 0, vy: 0, damage, life: 2, r: 4, dead: false
    });
    updateProjectiles(0.016);
    return { ok: true, hpBefore, hpAfter: state.npcs[0]?.hp ?? 0 };
  },
  firePlayerProjectileAtNpc(damage = 50) {
    const npc = state.npcs.find((entry) => entry.kind === "friendly-cargo");
    if (!npc) return { ok: false, reason: "no npc" };
    const hpBefore = npc.hp;
    state.projectiles.push({
      owner: "player", x: npc.pos.x, y: npc.pos.y, vx: 0, vy: 0, damage, life: 2, r: 3, dead: false
    });
    updateProjectiles(0.016);
    return { ok: true, hpBefore, hpAfter: state.npcs[0]?.hp ?? hpBefore };
  },
  collideEnemyWithNpc() {
    const npc = state.npcs.find((entry) => entry.kind === "friendly-cargo");
    if (!npc) return { ok: false, reason: "no npc" };
    const hpBefore = npc.hp;
    spawnEnemy("pirate", npc.pos.x, npc.pos.y, { level: state.run.level });
    updateEnemies(0.016);
    updateNpcs(0.016);
    return { ok: true, hpBefore, hpAfter: state.npcs[0]?.hp ?? hpBefore };
  },
  turretWouldLockNpc() {
    return Boolean(nearestEnemy(cellWorldPosition({ x: 0, y: 0, detached: false }), 450));
  },
  completeCurrentObjective() {
    const objective = state.run.objective;
    if (!objective) return { ok: false };
    const baseBefore = state.run.totalObjectiveRewardBase;
    const pointsBefore = state.meta.points;
    objective.progress = objective.target;
    grantObjectiveReward();
    return {
      ok: true,
      type: objective.type,
      baseGain: state.run.totalObjectiveRewardBase - baseBefore,
      pointsGain: state.meta.points - pointsBefore
    };
  },
  getEncounters() {
    return (state.run.encounters || []).map((enc) => ({
      id: enc.id,
      type: enc.type,
      state: enc.state,
      completed: enc.completed,
      failed: enc.failed,
      expired: enc.expired,
      encounterData: enc.encounterData
    }));
  },
  forceActivateEncounters() {
    for (const enc of state.run.encounters || []) {
      if (enc.state === "pending") {
        enc.triggerAt = state.time;
        activateEncounter(enc);
      }
    }
    return this.getEncounters();
  },
  advanceEncounters(seconds = 65) {
    const dt = 0.05;
    const steps = Math.ceil(seconds / dt);
    for (let i = 0; i < steps; i++) {
      state.time += dt;
      updateEncounters(dt);
    }
    return this.getEncounters();
  },
  tradeEncounter(encounterId, optionIndex = 1) {
    const enc = (state.run.encounters || []).find((entry) => entry.id === encounterId);
    if (!enc) return { ok: false, reason: "not found" };
    return { ok: performTraderTrade(enc, optionIndex), encounter: enc.id };
  },
  // v0.9.0 测试钩子集合：仅供 PM 浏览器级回归与节点 A 验证用，不影响主路径行为
  // 仅切换 currentGalaxyType 状态；不重新 createObjective / seedEncountersForLevel
  // （PM 想刷新本关 OBJECTIVE / ENCOUNTER 时显式调 resetRun 即可）
  setGalaxyType(galaxyType) {
    if (!GALAXY_TYPES[galaxyType]) return { ok: false, reason: "unknown galaxyType" };
    state.run.currentGalaxyType = galaxyType;
    return { ok: true, galaxyType: state.run.currentGalaxyType };
  },
  // 读取当前候选列表（玩家点 jumpBtn 后由 jumpToNextGalaxy 或 generateGalaxyChoices 填入）
  getGalaxyChoices() {
    return [...(state.run.galaxyMap?.pendingChoices || [])];
  },
  // 不依赖 panel DOM，按指定 RNG 重新生成 targetLevel 的候选；不修改 state.run
  generateGalaxyChoices(targetLevel) {
    const rng = getGalaxyChoiceRng(targetLevel);
    return generateGalaxyChoices(targetLevel, rng);
  },
  // 跑 N 次同 level 候选生成，统计各 galaxyType 出现频次（PM 节点 A 验证分布）
  simulateGalaxyChoices(targetLevel, count = 100) {
    const stats = {};
    const lvl = levelIndex(targetLevel);
    for (let i = 0; i < count; i++) {
      // 临时变种 RNG 流：用 i 偏移让多次模拟独立，且不影响真实 state.run.seed RNG
      const seed = (((state.run.seed ^ GALAXY_CHOICE_RNG_XOR) >>> 0) + lvl * GALAXY_CHOICE_RNG_MUL + i * 0x9e3779b9) >>> 0;
      const rng = mulberry32(seed);
      const choices = generateGalaxyChoices(targetLevel, rng);
      for (const choice of choices) {
        stats[choice.galaxyType] = (stats[choice.galaxyType] || 0) + 1;
      }
    }
    return { count, level: lvl, stats };
  },
  // 强制确认跃迁到指定 galaxyType（绕过 panel 点击）；非法 type 报错
  forceConfirmGalaxyJump(galaxyType) {
    if (!GALAXY_TYPES[galaxyType]) return { ok: false, reason: "unknown galaxyType" };
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [{ galaxyType, reason: "test-force" }];
    }
    state.run.galaxyChoicesShown = true;
    const ok = confirmGalaxyJump(galaxyType);
    return { ok, level: state.run.level, galaxyType: state.run.currentGalaxyType };
  },
  // PM 回归：模拟 stale 候选二次 confirm，level 只应 +1
  simulateStaleGalaxyConfirm(galaxyType = "tradeHub") {
    if (!GALAXY_TYPES[galaxyType]) return { ok: false, reason: "unknown galaxyType" };
    ensureGameplayTestBaseline();
    this.resetRun(42, 0);
    const levelBefore = state.run.level;
    if (state.run.galaxyMap) {
      state.run.galaxyMap.pendingChoices = [{ galaxyType, reason: "stale-sim" }];
    }
    state.run.galaxyChoicesShown = true;
    const first = confirmGalaxyJump(galaxyType);
    const second = confirmGalaxyJump(galaxyType);
    return {
      ok: first && !second && state.run.level === levelBefore + 1,
      levelBefore,
      levelAfter: state.run.level,
      first,
      second
    };
  },
  runGalaxyJumpStateMachineSelfCheck() {
    return runGalaxyJumpStateMachineSelfCheck();
  },
  // 测试 Escape 取消流程（不破坏 awaitingObjectiveChoice）
  cancelGalaxyJump() {
    cancelGalaxyJump();
    return { ok: true, galaxyChoicesShown: state.run.galaxyChoicesShown, awaiting: state.run.awaitingObjectiveChoice };
  },
  openGalaxyMapForTest(targetLevel) {
    const lvl = targetLevel != null ? levelIndex(targetLevel) : levelIndex(state.run.level + 1);
    const rng = getGalaxyChoiceRng(lvl);
    const choices = generateGalaxyChoices(lvl, rng);
    if (state.run.galaxyMap) state.run.galaxyMap.pendingChoices = choices.slice();
    state.run.galaxyChoicesShown = true;
    const opened = openGalaxyMapPanel(choices);
    return { ok: opened, choices, level: lvl };
  },
  getGalaxyHudSnapshot() {
    return {
      currentGalaxyType: state.run.currentGalaxyType,
      currentGalaxyInfoHtml: document.getElementById("currentGalaxyInfoEl")?.innerHTML || null,
      galaxyPathDotsHtml: document.getElementById("galaxyPathEl")?.querySelector(".hud-galaxy-path-dots")?.innerHTML || null,
      panelOpen: isGalaxyMapPanelOpen(),
      pendingChoices: [...(state.run.galaxyMap?.pendingChoices || [])],
      galaxyChoicesShown: state.run.galaxyChoicesShown
    };
  },
  isGalaxyMapPanelOpen() {
    return isGalaxyMapPanelOpen();
  },
  isGalaxyMapCardsInteractive() {
    return isGalaxyMapCardsInteractive();
  },
  // 读取完整 galaxyMap.nodes 路径
  getGalaxyPath() {
    return (state.run.galaxyMap?.nodes || []).map((node) => ({
      id: node.id,
      level: node.level,
      galaxyType: node.galaxyType,
      visited: !!node.visited,
      current: !!node.current
    }));
  },
  // 调试乘子叠加后的权重表：OBJECTIVE / ENCOUNTER（叠加 galaxyType 乘子后的 base × mod 结果）
  // 当 galaxyType 缺省或为 emptyVoid 时，输出与 base 表完全一致（emptyVoid 所有 mod = 1.0）
  getGalaxyTypeWeights(galaxyType, level) {
    const lvl = levelIndex(level);
    if (typeof galaxyType === "string" && !GALAXY_TYPES[galaxyType]) {
      const objectiveBase = { ...(OBJECTIVE_LEVEL_WEIGHTS[lvl] || OBJECTIVE_LEVEL_WEIGHTS[OBJECTIVE_LEVEL_WEIGHTS.length - 1]) };
      const encounterBase = { ...(ENCOUNTER_LEVEL_WEIGHTS[lvl] || {}) };
      return { ok: false, reason: "unknown galaxyType", level: lvl, objective: objectiveBase, encounter: encounterBase };
    }
    const resolvedGalaxyType = resolveGalaxyTypeKey(galaxyType);
    const galaxyDef = getGalaxyDefinition(resolvedGalaxyType);
    const objectiveModded = getObjectiveWeightsForLevel(lvl, resolvedGalaxyType, false);
    const encounterModded = getEncounterWeightsForLevel(lvl, resolvedGalaxyType);
    return {
      ok: true,
      level: lvl,
      galaxyType: resolvedGalaxyType,
      objective: objectiveModded,
      encounter: encounterModded,
      enemySpawnMod: galaxyDef.enemySpawnMod,
      resourceMod: galaxyDef.resourceMod,
      hostileStationMod: galaxyDef.hostileStationMod
    };
  },
  getGalaxyResourceMod(resourceType, galaxyType) {
    return getGalaxyResourceMultiplier(resourceType, galaxyType);
  },
  getGalaxySpawnTimer(baseInterval, galaxyType) {
    return getGalaxySpawnInterval(baseInterval, galaxyType);
  },
  // v0.9.0 T4：视觉签名与 generateGalaxy 预览钩子（节点 B 后半 PM 验证用）
  getGalaxyVisualSignature(galaxyType) {
    return getGalaxyVisualSignature(galaxyType);
  },
  generateGalaxyPreview(level, galaxyType, seed) {
    return generateGalaxyPreview(level, galaxyType, seed);
  },
  runGalaxyVisualSelfCheck() {
    return runGalaxyVisualSelfCheck();
  },
  runMetaS2RegressionSelfCheck() {
    return runMetaS2RegressionSelfCheck();
  },
  guideSnapshot() {
    const guide = buildGuideText();
    const goal = guide?.goal ?? "";
    const next = guide?.next ?? "";
    const resourceGuideHtml = buildResourceGuideHtml();
    const hasUndefined = [goal, next, resourceGuideHtml].some(
      (value) => value == null || String(value).includes("undefined")
    );
    return {
      goal,
      next,
      resourceGuideHtml,
      panels: {
        settlementOpen: isRunSettlementPanelOpen(),
        galaxyMapOpen: isGalaxyMapPanelOpen(),
        metaOpen: isMetaPanelOpen(),
        metaTab: metaPanelUi.activeTab,
        objectiveChoiceVisible: !document.getElementById("objectiveChoicePanel")?.classList.contains("hidden")
      },
      state: {
        level: state.run.level,
        objectiveComplete: isObjectiveComplete(),
        awaitingObjectiveChoice: state.run.awaitingObjectiveChoice,
        settlementShown: state.run.settlementShown,
        miningCount: countFacility("mining"),
        harvestingCount: getMiningStationStatus().harvesting.length
      },
      hasUndefined
    };
  },
  getCellStat,
  applyModification,
  unlockGlobalResearch,
  resetCellUpgradeState,
  createCell,
  improveStationHp,
  syncCellStorableStatsAfterUpgrade,
  upgradeSelectedCell,
  damageHostileStationCell,
  isHostileStationDestroyed,
  tryDamageHostileStationCell,
  snapshot() {
    const wreck = state.fragments.filter((f) => f.origin === "wreck");
    const startPos = state.galaxy?.stationSpawn || state.station.pos;
    return {
      objective: state.run.objective,
      objectiveFailed: isObjectiveFailed(),
      totalObjectiveRewardBase: state.run.totalObjectiveRewardBase,
      metaPoints: state.meta.points,
      level: state.run.level,
      seed: state.run.seed,
      npcs: state.npcs.map((npc) => ({
        id: npc.id, kind: npc.kind, hp: npc.hp, maxHp: npc.maxHp, speed: npc.speed,
        pos: { x: npc.pos.x, y: npc.pos.y }, target: { x: npc.target.x, y: npc.target.y }
      })),
      jumpExit: getEscortJumpExit(),
      startPos: { x: startPos.x, y: startPos.y },
      wreckCount: wreck.length,
      playerCount: countPlayerFragments()
    };
  }
};

window.__gameTest.meta = {
  injectOldMeta(rawMeta = {}) {
    const legacyMeta = isMetaObject(rawMeta) ? rawMeta : {};
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(legacyMeta));
    } catch {
      return { ok: false, reason: "save_blocked" };
    }
    state.meta = loadMeta();
    saveMeta();
    createBuildUi();
    updateHud();
    return this.snapshotMeta();
  },
  triggerMigration(rawMeta) {
    if (arguments.length > 0) {
      return migrateMetaSave(rawMeta);
    }
    state.meta = loadMeta();
    saveMeta();
    updateHud();
    return this.snapshotMeta();
  },
  snapshotMeta() {
    state.meta = ensureMetaState(state.meta);
    return JSON.parse(JSON.stringify(state.meta));
  },
  grantPoints(amount = 1) {
    const gained = grantMetaPoints(amount);
    updateHud();
    return {
      gained,
      points: state.meta.points
    };
  },
  purchaseTalent(talentId, times = 1) {
    const runTimes = Math.max(1, Math.floor(Number(times) || 1));
    const results = [];
    for (let i = 0; i < runTimes; i++) {
      results.push(purchaseMetaTalent(talentId));
    }
    createBuildUi();
    updateHud();
    return results;
  },
  getEffect(effectKey, context = {}) {
    return getMetaEffect(effectKey, context);
  },
  getTalentRank(talentId) {
    return getMetaTalentRank(talentId);
  },
  getPurchaseState(talentId) {
    return getMetaPurchaseState(talentId);
  },
  canBuyTalent(talentId) {
    return canBuyMetaTalent(talentId);
  },
  getSelectedStartProtocol() {
    return getSelectedStartProtocol();
  },
  getActiveProtocolState() {
    return {
      selectedProtocol: getSelectedStartProtocol(),
      activeProtocol: getActiveStartProtocolId(),
      applied: !!state.run.metaStartProtocolApplied,
      startupFacilityDiscounts: { ...(isMetaObject(state.run.startupFacilityDiscounts) ? state.run.startupFacilityDiscounts : createDefaultStartupFacilityDiscounts()) },
      startupResourceBonus: { ...(isMetaObject(state.run.startupResourceBonus) ? state.run.startupResourceBonus : createDefaultStartupResourceBonus()) },
      startupHullBonus: getRunStartupHullBonus(),
      startupHint: state.run.startupHint || "",
      startupHintUntil: state.run.startupHintUntil || 0
    };
  },
  selectProtocol(protocolId) {
    return selectStartProtocol(protocolId);
  },
  renderMetaPanel(tab) {
    if (typeof tab === "string") metaPanelUi.activeTab = tab;
    ensureMetaPanelUi();
    renderMetaPanel();
    return snapshotMetaPanelState();
  },
  snapshotMetaPanelState() {
    return snapshotMetaPanelState();
  },
  purchaseViaUi(talentId) {
    const result = purchaseMetaTalent(talentId);
    if (result.ok) {
      createBuildUi();
    }
    renderMetaPanel();
    updateMetaEntrySummary();
    return {
      result,
      panel: snapshotMetaPanelState()
    };
  },
  protocolPreviewSnapshot() {
    return START_PROTOCOLS.map((protocol) => ({
      id: protocol.id,
      name: protocol.name,
      unlocked: isMetaProtocolUnlocked(protocol.id),
      selected: protocol.id === getSelectedStartProtocol(),
      unlockHint: getProtocolUnlockHint(protocol),
      impactPreview: formatProtocolImpactPreview(protocol)
    }));
  },
  getBuildCost(facility) {
    return getBuildCost(facility);
  },
  previewSettlementHints() {
    return getMetaSettlementHints();
  },
  verifyProtocolSelectionDoesNotAffectCurrentRun() {
    const weaponFacility = "turret";
    const before = {
      weapon: getBuildCost(weaponFacility),
      mining: getBuildCost("mining"),
      run: {
        level: state.run.level,
        research: state.resources.research,
        activeProtocol: getActiveStartProtocolId(),
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length
      }
    };
    const selections = [];
    for (const protocolId of ["weaponStart", "miningStart"]) {
      if (!isMetaProtocolUnlocked(protocolId)) {
        return { ok: false, reason: "protocol_locked", protocolId, before };
      }
      selections.push({ protocolId, result: selectStartProtocol(protocolId) });
    }
    const after = {
      weapon: getBuildCost(weaponFacility),
      mining: getBuildCost("mining"),
      run: {
        level: state.run.level,
        research: state.resources.research,
        activeProtocol: getActiveStartProtocolId(),
        galaxyMap: JSON.stringify(state.run.galaxyMap),
        objective: state.run.objective?.type ?? null,
        encounters: (state.run.encounters || []).length
      }
    };
    const buildCostStable =
      JSON.stringify(before.weapon) === JSON.stringify(after.weapon) &&
      JSON.stringify(before.mining) === JSON.stringify(after.mining);
    const runUnchanged = JSON.stringify(before.run) === JSON.stringify(after.run);
    const selectionsOk = selections.every((entry) => entry.result.ok);
    return {
      ok: selectionsOk && buildCostStable && runUnchanged,
      before,
      after,
      selections
    };
  },
  runProtocolSelectionBuildCostSelfCheck() {
    return runProtocolSelectionBuildCostSelfCheck();
  },
  runStartProtocolApplicationSelfCheck() {
    return runStartProtocolApplicationSelfCheck();
  },
  runMetaS2RegressionSelfCheck() {
    return runMetaS2RegressionSelfCheck();
  },
  resetMeta() {
    state.meta = createDefaultMetaState();
    saveMeta();
    createBuildUi();
    updateHud();
    return this.snapshotMeta();
  }
};

function runPanelMutualExclusionSelfCheck() {
  ensureGameplayTestBaseline();
  ensureGalaxyMapPanelDomForTest();
  ensureMetaPanelUi();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  const panelSnapshot = () => ({
    activeMainPanel: getActiveMainPanel(),
    overlapCount: countSimultaneouslyOpenMainPanels(),
    metaOpen: isMetaPanelOpen(),
    galaxyOpen: isGalaxyMapPanelOpen(),
    settlementOpen: isRunSettlementPanelOpen(),
    researchOpen: !!state.hud?.researchTreeOpen,
    objectiveVisible: !document.getElementById("objectiveChoicePanel")?.classList.contains("hidden")
  });

  const resetPanels = () => {
    runSettlementPanelEl?.classList.add("hidden");
    forceHideGalaxyMapPanel({ skipSync: true });
    setMetaPanelOpen(false, { skipSync: true, skipObjectiveRefresh: true });
    setResearchTreeOpen(false, { skipSync: true });
    state.run.settlementShown = false;
    state.run.settlementMode = "victory";
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = false;
    state.run.galaxyChoicesShown = false;
    syncMainPanelUiState();
  };

  runCase("metaAndGalaxyDoNotOverlap", () => {
    resetPanels();
    window.__gameTest.resetRun(5101, 0);
    toggleMetaPanel(true);
    const openGalaxy = openGalaxyMapPanel(window.__gameTest.generateGalaxyChoices(1));
    const snap = panelSnapshot();
    return {
      ok: openGalaxy && !snap.metaOpen && snap.galaxyOpen && snap.overlapCount <= 1,
      snap
    };
  });

  runCase("settlementClosesOtherPanels", () => {
    resetPanels();
    window.__gameTest.resetRun(5102, 0);
    toggleMetaPanel(true);
    window.__gameTest.openGalaxyMapForTest(1);
    state.run.totalObjectiveRewardBase = 4;
    state.run.settlementBonusGranted = false;
    endRunSettlement();
    const snap = panelSnapshot();
    return {
      ok: snap.settlementOpen
        && !snap.metaOpen
        && !snap.galaxyOpen
        && !snap.researchOpen
        && snap.overlapCount <= 1,
      snap
    };
  });

  runCase("metaBlockedWhileSettlementOpen", () => {
    resetPanels();
    window.__gameTest.resetRun(5103, 0);
    state.run.totalObjectiveRewardBase = 4;
    state.run.settlementBonusGranted = false;
    endRunSettlement();
    toggleMetaPanel(true);
    const snap = panelSnapshot();
    return {
      ok: snap.settlementOpen && !snap.metaOpen && snap.overlapCount <= 1,
      snap
    };
  });

  runCase("galaxyBlockedWhileSettlementOpen", () => {
    resetPanels();
    window.__gameTest.resetRun(5104, 0);
    state.run.totalObjectiveRewardBase = 4;
    state.run.settlementBonusGranted = false;
    endRunSettlement();
    const openGalaxy = openGalaxyMapPanel(window.__gameTest.generateGalaxyChoices(1));
    const snap = panelSnapshot();
    return {
      ok: !openGalaxy && snap.settlementOpen && !snap.galaxyOpen && snap.overlapCount <= 1,
      snap
    };
  });

  runCase("objectiveChoiceStatePreservedAfterGalaxyCancel", () => {
    resetPanels();
    window.__gameTest.resetRun(5105, 0);
    state.run.objectiveCompleteAt = 1;
    state.run.awaitingObjectiveChoice = true;
    state.run.objectiveChoiceDismissed = false;
    const openGalaxy = window.__gameTest.openGalaxyMapForTest(1);
    cancelGalaxyJump();
    const snap = panelSnapshot();
    return {
      ok: openGalaxy.ok
        && state.run.awaitingObjectiveChoice
        && !state.run.objectiveChoiceDismissed
        && snap.overlapCount <= 1,
      snap,
      awaiting: state.run.awaitingObjectiveChoice
    };
  });

  runCase("staleGalaxyConfirmStillGuarded", () => {
    const stale = window.__gameTest.simulateStaleGalaxyConfirm("tradeHub");
    return { ok: stale.ok, stale };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

function runEscapeSequenceSelfCheck() {
  ensureGameplayTestBaseline();
  ensureGalaxyMapPanelDomForTest();
  ensureMetaPanelUi();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  const resetPanels = () => {
    runSettlementPanelEl?.classList.add("hidden");
    forceHideGalaxyMapPanel({ skipSync: true });
    setMetaPanelOpen(false, { skipSync: true, skipObjectiveRefresh: true });
    setResearchTreeOpen(false, { skipSync: true });
    state.run.settlementShown = false;
    state.run.settlementMode = "victory";
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = false;
    syncMainPanelUiState();
  };

  runCase("settlementEscapeIsNoOp", () => {
    resetPanels();
    window.__gameTest.resetRun(5201, 0);
    state.run.totalObjectiveRewardBase = 4;
    state.run.settlementBonusGranted = false;
    endRunSettlement();
    const before = isRunSettlementPanelOpen();
    handlePlaytestEscapeKeydown();
    return {
      ok: before && isRunSettlementPanelOpen(),
      before,
      after: isRunSettlementPanelOpen()
    };
  });

  runCase("metaEscapeClosesMeta", () => {
    resetPanels();
    window.__gameTest.resetRun(5202, 0);
    toggleMetaPanel(true);
    handlePlaytestEscapeKeydown();
    return {
      ok: !isMetaPanelOpen() && countSimultaneouslyOpenMainPanels() === 0,
      metaOpen: isMetaPanelOpen()
    };
  });

  runCase("objectiveChoiceEscapeDismisses", () => {
    resetPanels();
    window.__gameTest.resetRun(5203, 0);
    state.run.objectiveCompleteAt = 1;
    state.run.awaitingObjectiveChoice = true;
    updateObjectiveChoiceUi();
    handlePlaytestEscapeKeydown();
    return {
      ok: !state.run.awaitingObjectiveChoice
        && state.run.objectiveChoiceDismissed
        && countSimultaneouslyOpenMainPanels() === 0,
      awaiting: state.run.awaitingObjectiveChoice,
      dismissed: state.run.objectiveChoiceDismissed
    };
  });

  runCase("galaxyEscapeUsesCancelGalaxyJump", () => {
    resetPanels();
    window.__gameTest.resetRun(5204, 0);
    state.run.objectiveCompleteAt = 1;
    state.run.awaitingObjectiveChoice = true;
    window.__gameTest.openGalaxyMapForTest(1);
    const cancel = window.__gameTest.cancelGalaxyJump();
    return {
      ok: cancel.ok && !isGalaxyMapPanelOpen() && state.run.awaitingObjectiveChoice,
      cancel
    };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

const PLAYTEST_RUNTIME_ERROR_CAPACITY = 50;
const PLAYTEST_RUNTIME_ERROR_DEFAULT_LIMIT = 10;
const playtestRuntimeErrorBuffer = [];
let playtestRuntimeErrorBound = false;
const playtestSelfCheckState = {
  capturedAt: null,
  ok: null,
  passed: 0,
  total: 0,
  checks: {}
};
const RELEASE_READINESS_VERSION = "v0.14.0-release-candidate-playtest";
const RELEASE_FRAME_TIMING_DEFAULT_SAMPLES = 30;
const RELEASE_FRAME_TIMING_MIN_SAMPLES = 6;
const RELEASE_FRAME_TIMING_MAX_SAMPLES = 120;
const RELEASE_FRAME_TIMING_LONG_FRAME_MS = 33;
const RELEASE_STORAGE_SIGNATURE_SLICE = 32;
const RELEASE_TEXT_SNAPSHOT_LIMIT = 200;
const RELEASE_MANUAL_CHECK_IDS = [
  "P0-1.firstRun",
  "P0-2.miningLoop",
  "P0-3.resourceShortage",
  "P0-4.enemyApproach",
  "P0-5.combatAndRepair",
  "P0-6.postCombatReview",
  "P0-7.galaxyJump",
  "P0-8.metaReturn"
];
const PLAYTEST_MANUAL_CHECKLIST_ITEMS = [
  { id: "P0-1.firstRun", label: "空存档首局", hint: "首屏 HUD/引导可读，无阻塞初始化 error" },
  { id: "P0-2.miningLoop", label: "建造采矿链", hint: "找到采矿设施并完成最小采集反馈" },
  { id: "P0-3.resourceShortage", label: "资源不足/断电", hint: "失败原因可读，非无反馈点击" },
  { id: "P0-4.enemyApproach", label: "敌人接近", hint: "威胁摘要可读，安全态不误报" },
  { id: "P0-5.combatAndRepair", label: "武器/护盾/维修", hint: "战斗状态与失败原因可诊断" },
  { id: "P0-6.postCombatReview", label: "战斗后复盘", hint: "交火后 2-4 条复盘或等价总结" },
  { id: "P0-7.galaxyJump", label: "星系跳转", hint: "跃迁入口可点，回局内 HUD 正常" },
  { id: "P0-8.metaReturn", label: "Meta 回到新局", hint: "局外天赋/结算后新局状态不混乱" },
  { id: "P0-9.smallScreen", label: "小屏可读性", hint: "窄屏下核心按钮/面板可滚动且不永久遮挡" },
  { id: "P0-10.consoleRuntime", label: "控制台/runtime errors", hint: "DevTools console 无阻塞 error（需人工记录）" }
];
const PLAYTEST_MANUAL_STATUS_OPTIONS = [
  { value: "", label: "未完成" },
  { value: "pass", label: "通过" },
  { value: "fail", label: "失败" },
  { value: "uncovered", label: "未覆盖" },
  { value: "blocking", label: "阻塞发布" }
];
let releaseCandidatePanelEl = null;
let releaseCandidateToggleBtnEl = null;
let releaseCandidateLastResult = null;
let releaseCandidatePanelBusy = false;
let releaseCandidatePlaytestUrlEnabled = false;
const RELEASE_EXTRA_KEY_DOM_IDS = [
  "runInfo",
  "runDanger",
  "runProgress",
  "currentGalaxyInfoEl",
  "galaxyPathEl",
  "resources",
  "weaponsRow",
  "pauseBtn",
  "statusAlerts",
  "resourceGuide",
  "objectiveJumpDeferredBtn",
  "runSettlementStats",
  "runSettlementMetaFeedback",
  "designHealthSummary",
  "combatReviewSummary",
  "combatStatusSummary",
  "selectedCellPanel",
  "selectedCellInfo",
  "selectedCellDiagnostics",
  "summaryStayBtn",
  "quickRestartBtn",
  "moreStatusPanel"
];

function clonePlaytestSnapshotFallback(value, seen = new WeakMap()) {
  if (value == null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const clonedArray = [];
    seen.set(value, clonedArray);
    for (const item of value) clonedArray.push(clonePlaytestSnapshotFallback(item, seen));
    return clonedArray;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    seen.set(value, clonedMap);
    for (const [key, mapValue] of value.entries()) {
      clonedMap.set(clonePlaytestSnapshotFallback(key, seen), clonePlaytestSnapshotFallback(mapValue, seen));
    }
    return clonedMap;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    seen.set(value, clonedSet);
    for (const item of value.values()) clonedSet.add(clonePlaytestSnapshotFallback(item, seen));
    return clonedSet;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const clonedObject = {};
  seen.set(value, clonedObject);
  for (const [key, objectValue] of Object.entries(value)) {
    clonedObject[key] = clonePlaytestSnapshotFallback(objectValue, seen);
  }
  return clonedObject;
}

function cloneForPlaytestSnapshot(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // ignore and fallback below
    }
  }
  return clonePlaytestSnapshotFallback(value);
}

function captureStorageSnapshot(storage, key) {
  try {
    const value = storage.getItem(key);
    return {
      supported: true,
      hasValue: value != null,
      value
    };
  } catch {
    return {
      supported: false,
      hasValue: false,
      value: null
    };
  }
}

function restoreStorageSnapshot(storage, key, snapshot) {
  if (!snapshot?.supported) return;
  try {
    if (snapshot.hasValue) storage.setItem(key, snapshot.value);
    else storage.removeItem(key);
  } catch {
    // ignore storage restore failures in non-browser contexts
  }
}

function capturePlaytestPanelClassNames() {
  const galaxyMapPanelEl = document.getElementById("galaxyMapPanel");
  const objectiveChoicePanelEl = document.getElementById("objectiveChoicePanel");
  const hudEl = document.getElementById("hud");
  const pauseBtn = document.getElementById("pauseBtn");
  return {
    bodyClassName: document.body?.className || "",
    hudClassName: hudEl?.className || "",
    metaPanelClassName: metaPanelEl?.className || "",
    researchTreePanelClassName: researchTreePanelEl?.className || "",
    galaxyMapPanelClassName: galaxyMapPanelEl?.className || "",
    objectiveChoicePanelClassName: objectiveChoicePanelEl?.className || "",
    runSettlementPanelClassName: runSettlementPanelEl?.className || "",
    pauseButtonText: pauseBtn?.textContent ?? ""
  };
}

function restorePlaytestPanelClassNames(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  const hudEl = document.getElementById("hud");
  const galaxyMapPanelEl = document.getElementById("galaxyMapPanel");
  const objectiveChoicePanelEl = document.getElementById("objectiveChoicePanel");
  const pauseBtn = document.getElementById("pauseBtn");

  if (document.body && typeof snapshot.bodyClassName === "string") {
    document.body.className = snapshot.bodyClassName;
  }
  if (hudEl && typeof snapshot.hudClassName === "string") {
    hudEl.className = snapshot.hudClassName;
  }
  if (metaPanelEl && typeof snapshot.metaPanelClassName === "string") {
    metaPanelEl.className = snapshot.metaPanelClassName;
  }
  if (researchTreePanelEl && typeof snapshot.researchTreePanelClassName === "string") {
    researchTreePanelEl.className = snapshot.researchTreePanelClassName;
  }
  if (galaxyMapPanelEl && typeof snapshot.galaxyMapPanelClassName === "string") {
    galaxyMapPanelEl.className = snapshot.galaxyMapPanelClassName;
  }
  if (objectiveChoicePanelEl && typeof snapshot.objectiveChoicePanelClassName === "string") {
    objectiveChoicePanelEl.className = snapshot.objectiveChoicePanelClassName;
  }
  if (runSettlementPanelEl && typeof snapshot.runSettlementPanelClassName === "string") {
    runSettlementPanelEl.className = snapshot.runSettlementPanelClassName;
  }
  if (pauseBtn && typeof snapshot.pauseButtonText === "string") {
    pauseBtn.textContent = snapshot.pauseButtonText;
  }
}

function capturePlaytestExecutionSnapshot() {
  return {
    state: cloneForPlaytestSnapshot(state),
    metaPanelUi: cloneForPlaytestSnapshot(metaPanelUi),
    seeds: {
      fragmentIdSeed,
      npcIdSeed,
      galaxyNodeIdSeed,
      encounterIdSeed
    },
    galaxyJumpInFlight,
    panelClasses: capturePlaytestPanelClassNames(),
    storage: {
      save: captureStorageSnapshot(localStorage, SAVE_KEY),
      corruptRaw: captureStorageSnapshot(sessionStorage, META_CORRUPT_RAW_KEY)
    }
  };
}

function restorePlaytestExecutionSnapshot(snapshot) {
  if (!snapshot?.state) return;

  const restoredState = cloneForPlaytestSnapshot(snapshot.state);
  for (const key of Object.keys(state)) {
    delete state[key];
  }
  Object.assign(state, restoredState);

  const restoredMetaPanelUi = cloneForPlaytestSnapshot(snapshot.metaPanelUi || {});
  metaPanelUi.open = !!restoredMetaPanelUi.open;
  metaPanelUi.activeTab = typeof restoredMetaPanelUi.activeTab === "string" ? restoredMetaPanelUi.activeTab : "talents";
  metaPanelUi.categoryFilter = typeof restoredMetaPanelUi.categoryFilter === "string" ? restoredMetaPanelUi.categoryFilter : "all";

  if (snapshot.seeds) {
    if (Number.isFinite(snapshot.seeds.fragmentIdSeed)) fragmentIdSeed = snapshot.seeds.fragmentIdSeed;
    if (Number.isFinite(snapshot.seeds.npcIdSeed)) npcIdSeed = snapshot.seeds.npcIdSeed;
    if (Number.isFinite(snapshot.seeds.galaxyNodeIdSeed)) galaxyNodeIdSeed = snapshot.seeds.galaxyNodeIdSeed;
    if (Number.isFinite(snapshot.seeds.encounterIdSeed)) encounterIdSeed = snapshot.seeds.encounterIdSeed;
  }
  galaxyJumpInFlight = !!snapshot.galaxyJumpInFlight;

  restoreStorageSnapshot(localStorage, SAVE_KEY, snapshot.storage?.save);
  restoreStorageSnapshot(sessionStorage, META_CORRUPT_RAW_KEY, snapshot.storage?.corruptRaw);
  restorePlaytestPanelClassNames(snapshot.panelClasses);

  try {
    syncMainPanelUiState();
    updateObjectiveChoiceUi();
    updateMetaEntrySummary();
    updateHud();
  } catch {
    // ignore restore refresh failures in non-interactive contexts
  }
}

function toPlaytestErrorMessage(value) {
  if (value == null) return "unknown";
  if (typeof value === "string") return value;
  if (typeof value.message === "string") return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function pushPlaytestRuntimeError(entry) {
  playtestRuntimeErrorBuffer.push(entry);
  if (playtestRuntimeErrorBuffer.length > PLAYTEST_RUNTIME_ERROR_CAPACITY) {
    playtestRuntimeErrorBuffer.splice(0, playtestRuntimeErrorBuffer.length - PLAYTEST_RUNTIME_ERROR_CAPACITY);
  }
}

function bindPlaytestErrorListeners() {
  if (playtestRuntimeErrorBound) return;
  playtestRuntimeErrorBound = true;

  window.addEventListener("error", (event) => {
    const message = toPlaytestErrorMessage(event?.error || event?.message);
    pushPlaytestRuntimeError({
      type: "error",
      message,
      source: event?.filename || null,
      line: Number.isFinite(event?.lineno) ? event.lineno : null,
      col: Number.isFinite(event?.colno) ? event.colno : null,
      stack: typeof event?.error?.stack === "string" ? event.error.stack : null,
      timestamp: Date.now()
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    pushPlaytestRuntimeError({
      type: "unhandledrejection",
      message: toPlaytestErrorMessage(reason),
      stack: typeof reason?.stack === "string" ? reason.stack : null,
      timestamp: Date.now()
    });
  });
}

function getPlaytestRuntimeErrors(limit = PLAYTEST_RUNTIME_ERROR_DEFAULT_LIMIT) {
  const parsedLimit = Math.floor(Number(limit));
  const safeLimit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(PLAYTEST_RUNTIME_ERROR_CAPACITY, parsedLimit))
    : PLAYTEST_RUNTIME_ERROR_DEFAULT_LIMIT;
  return playtestRuntimeErrorBuffer.slice(-safeLimit).map((entry) => ({ ...entry }));
}

function clearPlaytestRuntimeErrors() {
  const cleared = playtestRuntimeErrorBuffer.length;
  playtestRuntimeErrorBuffer.length = 0;
  return { ok: true, cleared, remaining: 0 };
}

function isSnapshotNodeVisible(node) {
  if (!node || node.classList.contains("hidden")) return false;
  const rect = node.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(node);
  return style.display !== "none" && style.visibility !== "hidden";
}

function snapshotDomNodeState(elementId) {
  const node = document.getElementById(elementId);
  return {
    exists: !!node,
    visible: isSnapshotNodeVisible(node)
  };
}

function listOpenPanelsForSnapshot(panelState) {
  const openPanels = [];
  if (panelState.runSettlementOpen) openPanels.push("runSettlement");
  if (panelState.galaxyMapOpen) openPanels.push("galaxyMap");
  if (panelState.metaOpen) openPanels.push("meta");
  if (panelState.researchTreeOpen) openPanels.push("researchTree");
  if (panelState.objectiveChoiceOpen) openPanels.push("objectiveChoice");
  return openPanels;
}

function hasStorageEntry(storage, key) {
  try {
    return storage.getItem(key) != null;
  } catch {
    return false;
  }
}

function summarizeMetaStorageForPlaytestSnapshot() {
  const metaState = isMetaObject(state.meta) ? state.meta : null;
  const talents = isMetaObject(metaState?.talents) ? metaState.talents : {};
  let talentCount = 0;
  for (const rank of Object.values(talents)) {
    const normalizedRank = Math.floor(Number(rank));
    if (Number.isFinite(normalizedRank) && normalizedRank > 0) talentCount += 1;
  }
  return {
    schemaVersion: metaState?.schemaVersion ?? null,
    points: normalizeMetaPoints(metaState?.points),
    talentCount,
    selectedProtocol: typeof metaState?.selectedStartProtocol === "string" ? metaState.selectedStartProtocol : null,
    activeProtocol: getActiveStartProtocolId(),
    hasCorruptRaw: hasStorageEntry(sessionStorage, META_CORRUPT_RAW_KEY)
  };
}

function summarizeResourceForPlaytestSnapshot() {
  const resources = isMetaObject(state.resources) ? state.resources : {};
  const power = isMetaObject(state.power) ? state.power : {};
  return {
    metal: Math.floor(Number(resources.metal) || 0),
    ore: Math.floor(Number(resources.ore) || 0),
    gas: Math.floor(Number(resources.gas) || 0),
    plasma: Math.floor(Number(resources.plasma) || 0),
    research: Math.floor(Number(resources.research) || 0),
    powerUsed: Math.floor(Number(power.used) || 0),
    powerAvailable: Math.floor(Number(power.available) || 0)
  };
}

function summarizeObjectiveForPlaytestSnapshot() {
  const objective = state.run.objective;
  const displayProgress = getObjectiveDisplayProgress(objective);
  return {
    type: objective?.type ?? null,
    text: objective?.text ?? null,
    progress: Number.isFinite(objective?.progress) ? objective.progress : null,
    target: Number.isFinite(objective?.target) ? objective.target : null,
    progressRatio: Number.isFinite(displayProgress?.ratio) ? displayProgress.ratio : 0,
    complete: isObjectiveComplete(),
    failed: isObjectiveFailed(),
    awaitingObjectiveChoice: !!state.run.awaitingObjectiveChoice,
    objectiveChoiceDismissed: !!state.run.objectiveChoiceDismissed,
    level: state.run.level,
    currentGalaxyType: state.run.currentGalaxyType
  };
}

function summarizeGuideForPlaytestSnapshot() {
  const guide = buildGuideText();
  const goal = typeof guide?.goal === "string" ? guide.goal : "";
  const next = typeof guide?.next === "string" ? guide.next : "";
  const resourceGuideHtml = String(buildResourceGuideHtml() || "");
  return {
    goal,
    next,
    hasUndefined: [goal, next, resourceGuideHtml].some((value) => value.includes("undefined")),
    resourceGuideLength: resourceGuideHtml.length
  };
}

function summarizeSelfCheckResult(rawResult, thrownError) {
  if (thrownError) {
    const reason = thrownError?.message || String(thrownError);
    return {
      ok: false,
      status: "fail",
      totalCases: 1,
      passedCases: 0,
      failedCases: [reason]
    };
  }

  const result = isMetaObject(rawResult) ? rawResult : {};
  const caseResults = Array.isArray(result.checks)
    ? result.checks.map((entry) => ({
      name: typeof entry?.name === "string" ? entry.name : "unknown",
      ok: !!entry?.ok
    }))
    : [];
  const failedCaseNames = caseResults.filter((entry) => !entry.ok).map((entry) => entry.name);
  const fallbackFailure = typeof result.reason === "string" ? result.reason : "self_check_failed";
  const totalCases = caseResults.length > 0 ? caseResults.length : 1;
  const passedCases = caseResults.length > 0
    ? caseResults.length - failedCaseNames.length
    : (result.ok === true ? 1 : 0);
  const ok = result.ok === true && failedCaseNames.length === 0;
  return {
    ok,
    status: ok ? "pass" : "fail",
    totalCases,
    passedCases,
    failedCases: ok ? [] : (failedCaseNames.length > 0 ? failedCaseNames : [fallbackFailure])
  };
}

function runGuideSnapshotBasicSelfCheck() {
  const guide = window.__gameTest.guideSnapshot?.();
  const checks = [
    { name: "guideSnapshotExists", ok: !!guide },
    { name: "goalIsString", ok: typeof guide?.goal === "string" },
    { name: "nextIsString", ok: typeof guide?.next === "string" },
    { name: "resourceGuideHtmlIsString", ok: typeof guide?.resourceGuideHtml === "string" },
    { name: "noUndefinedText", ok: !guide?.hasUndefined }
  ];
  return {
    ok: checks.every((entry) => entry.ok),
    checks
  };
}

function runPlaytestSelfCheckInSandbox(key, checkFn) {
  const baseline = capturePlaytestExecutionSnapshot();
  const startedAt = Date.now();
  let rawResult = null;
  let thrownError = null;
  try {
    rawResult = checkFn();
  } catch (error) {
    thrownError = error;
  } finally {
    restorePlaytestExecutionSnapshot(baseline);
  }
  const summary = summarizeSelfCheckResult(rawResult, thrownError);
  return {
    key,
    ...summary,
    durationMs: Math.max(0, Date.now() - startedAt)
  };
}

function updatePlaytestSelfCheckState(summary) {
  playtestSelfCheckState.capturedAt = summary.capturedAt;
  playtestSelfCheckState.ok = summary.ok;
  playtestSelfCheckState.passed = summary.passed;
  playtestSelfCheckState.total = summary.total;
  playtestSelfCheckState.checks = {};
  for (const check of summary.checks) {
    playtestSelfCheckState.checks[check.key] = {
      status: check.status,
      ok: check.ok,
      totalCases: check.totalCases,
      passedCases: check.passedCases,
      failedCases: [...check.failedCases],
      durationMs: check.durationMs
    };
  }
}

function getPlaytestSelfCheckStateSnapshot() {
  return {
    capturedAt: playtestSelfCheckState.capturedAt,
    ok: playtestSelfCheckState.ok,
    passed: playtestSelfCheckState.passed,
    total: playtestSelfCheckState.total,
    checks: cloneForPlaytestSnapshot(playtestSelfCheckState.checks)
  };
}

function runAllPlaytestSelfChecks() {
  const definitions = [
    { key: "metaS2Regression", run: () => runMetaS2RegressionSelfCheck() },
    { key: "panelMutualExclusion", run: () => runPanelMutualExclusionSelfCheck() },
    { key: "escapeSequence", run: () => runEscapeSequenceSelfCheck() },
    { key: "galaxyJumpStateMachine", run: () => runGalaxyJumpStateMachineSelfCheck() },
    { key: "guideSnapshotBasic", run: () => runGuideSnapshotBasicSelfCheck() }
  ];

  const checks = definitions.map((entry) => runPlaytestSelfCheckInSandbox(entry.key, entry.run));
  const passed = checks.filter((entry) => entry.ok).length;
  const summary = {
    ok: passed === checks.length,
    capturedAt: Date.now(),
    passed,
    failed: checks.length - passed,
    total: checks.length,
    checks
  };
  updatePlaytestSelfCheckState(summary);
  return summary;
}

function hashReleaseStorageValue(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash * 33) ^ value.charCodeAt(i)) >>> 0;
  }
  return `0x${hash.toString(16).padStart(8, "0")}`;
}

function captureReleaseStorageEntrySignature(storage, key) {
  const snapshot = captureStorageSnapshot(storage, key);
  if (!snapshot.supported) {
    return {
      supported: false,
      hasValue: false,
      length: null,
      head32: null,
      tail32: null,
      hash32: null
    };
  }
  if (!snapshot.hasValue) {
    return {
      supported: true,
      hasValue: false,
      length: null,
      head32: null,
      tail32: null,
      hash32: null
    };
  }
  const value = String(snapshot.value ?? "");
  return {
    supported: true,
    hasValue: true,
    length: value.length,
    head32: value.slice(0, RELEASE_STORAGE_SIGNATURE_SLICE),
    tail32: value.slice(-RELEASE_STORAGE_SIGNATURE_SLICE),
    hash32: hashReleaseStorageValue(value)
  };
}

function captureReleaseStorageSignature() {
  return {
    capturedAt: Date.now(),
    saveKey: SAVE_KEY,
    corruptRawKey: META_CORRUPT_RAW_KEY,
    save: captureReleaseStorageEntrySignature(localStorage, SAVE_KEY),
    corruptRaw: captureReleaseStorageEntrySignature(sessionStorage, META_CORRUPT_RAW_KEY)
  };
}

function isReleaseStorageEntryConsistent(before, after) {
  if (!before || !after) return false;
  return before.supported === after.supported
    && before.hasValue === after.hasValue
    && before.length === after.length
    && before.hash32 === after.hash32;
}

function isReleaseStorageSignatureConsistent(before, after) {
  if (!before || !after) return false;
  return isReleaseStorageEntryConsistent(before.save, after.save)
    && isReleaseStorageEntryConsistent(before.corruptRaw, after.corruptRaw);
}

function safeReleaseMatchMedia(query) {
  if (typeof window?.matchMedia !== "function") return false;
  try {
    return !!window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

function limitReleaseText(value, maxLength = RELEASE_TEXT_SNAPSHOT_LIMIT) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function normalizeReleaseSampleFrames(rawValue) {
  const requested = Math.floor(Number(rawValue));
  const safeRequested = Number.isFinite(requested) ? requested : RELEASE_FRAME_TIMING_DEFAULT_SAMPLES;
  const effective = Math.max(RELEASE_FRAME_TIMING_MIN_SAMPLES, Math.min(RELEASE_FRAME_TIMING_MAX_SAMPLES, safeRequested));
  return {
    requested: safeRequested,
    effective,
    truncated: safeRequested > RELEASE_FRAME_TIMING_MAX_SAMPLES
  };
}

function collectReleaseEnvironment(viewport) {
  const nav = typeof navigator === "object" && navigator ? navigator : null;
  const userAgent = nav?.userAgent || "";
  const hasRequestAnimationFrame = typeof window?.requestAnimationFrame === "function";
  const hasPerformanceNow = typeof performance?.now === "function";
  const hasLocalStorage = captureStorageSnapshot(localStorage, SAVE_KEY).supported;
  const hasSessionStorage = captureStorageSnapshot(sessionStorage, META_CORRUPT_RAW_KEY).supported;
  const hasStructuredClone = typeof structuredClone === "function";
  const hasWebGL = !!renderer?.gl;
  const headlessReasons = [];
  if (nav?.webdriver === true) headlessReasons.push("webdriver");
  if (/HeadlessChrome|jsdom|node\.js|Puppeteer|Playwright/i.test(userAgent)) headlessReasons.push("ua_headless");
  if (!hasRequestAnimationFrame) headlessReasons.push("missing_raf");
  if ((window?.outerWidth || 0) === 0 || (window?.outerHeight || 0) === 0) headlessReasons.push("zero_outer_size");
  if (Array.isArray(nav?.languages) && nav.languages.length === 0) headlessReasons.push("empty_languages");
  const prefersColorScheme = safeReleaseMatchMedia("(prefers-color-scheme: dark)")
    ? "dark"
    : (safeReleaseMatchMedia("(prefers-color-scheme: light)") ? "light" : "unknown");
  return {
    capturedAt: Date.now(),
    userAgent,
    language: nav?.language || "",
    platform: nav?.platform || "",
    hardwareConcurrency: Number.isFinite(nav?.hardwareConcurrency) ? nav.hardwareConcurrency : null,
    deviceMemoryGb: Number.isFinite(nav?.deviceMemory) ? nav.deviceMemory : null,
    viewport: {
      width: Number(viewport?.width) || window.innerWidth || 0,
      height: Number(viewport?.height) || window.innerHeight || 0,
      devicePixelRatio: Number(viewport?.devicePixelRatio) || window.devicePixelRatio || 1,
      narrowViewport: !!viewport?.narrowViewport
    },
    online: nav?.onLine !== false,
    prefersReducedMotion: safeReleaseMatchMedia("(prefers-reduced-motion: reduce)"),
    prefersColorScheme,
    hasRequestAnimationFrame,
    hasPerformanceNow,
    hasLocalStorage,
    hasSessionStorage,
    hasStructuredClone,
    hasWebGL,
    isHeadlessHint: headlessReasons.length > 0,
    headlessReasons
  };
}

function collectReleaseHudHooks(baseSnapshot) {
  const keyDom = {};
  for (const id of RELEASE_EXTRA_KEY_DOM_IDS) {
    keyDom[id] = snapshotDomNodeState(id);
  }
  return {
    available: true,
    runInfoText: limitReleaseText(runInfoEl?.textContent || ""),
    runDangerText: limitReleaseText(runDangerEl?.textContent || ""),
    runProgressText: limitReleaseText(runProgressEl?.textContent || ""),
    currentGoalText: limitReleaseText(currentGoalEl?.textContent || ""),
    nextStepText: limitReleaseText(nextStepEl?.textContent || ""),
    statusAlertsCount: statusAlertsEl?.children?.length || 0,
    resourceGuideLength: Number(baseSnapshot?.guide?.resourceGuideLength) || 0,
    weaponsRowCount: weaponsRowEl?.children?.length || 0,
    pauseButtonText: limitReleaseText(document.getElementById("pauseBtn")?.textContent || "", 40),
    keyDom
  };
}

function summarizeReleasePendingChoices(rawChoices) {
  if (!Array.isArray(rawChoices)) return [];
  return rawChoices.map((entry) => ({
    galaxyType: typeof entry?.galaxyType === "string" ? entry.galaxyType : null,
    reason: typeof entry?.reason === "string" ? entry.reason : null
  }));
}

function summarizeReleaseGalaxyPathNodes(rawNodes) {
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes.map((node) => ({
    id: node?.id ?? null,
    level: Number.isFinite(node?.level) ? node.level : null,
    galaxyType: typeof node?.galaxyType === "string" ? node.galaxyType : null,
    visited: !!node?.visited,
    current: !!node?.current
  }));
}

function collectReleaseGalaxyHooks(baseSnapshot) {
  const hasHudHook = typeof window.__gameTest?.getGalaxyHudSnapshot === "function";
  const hasPathHook = typeof window.__gameTest?.getGalaxyPath === "function";
  const hudSnapshot = hasHudHook ? window.__gameTest.getGalaxyHudSnapshot() : null;
  const pathNodes = hasPathHook ? window.__gameTest.getGalaxyPath() : [];
  const currentGalaxyType = typeof hudSnapshot?.currentGalaxyType === "string"
    ? hudSnapshot.currentGalaxyType
    : (typeof baseSnapshot?.objective?.currentGalaxyType === "string" ? baseSnapshot.objective.currentGalaxyType : null);
  const knownGalaxyTypeKeys = Object.keys(GALAXY_TYPES || {});
  return {
    available: true,
    currentGalaxyType,
    knownGalaxyTypeKeys,
    panelOpen: hasHudHook ? !!hudSnapshot?.panelOpen : isGalaxyMapPanelOpen(),
    pendingChoices: summarizeReleasePendingChoices(hasHudHook ? hudSnapshot?.pendingChoices : state.run.galaxyMap?.pendingChoices),
    galaxyChoicesShown: hasHudHook ? !!hudSnapshot?.galaxyChoicesShown : !!state.run.galaxyChoicesShown,
    currentGalaxyInfoPresent: typeof hudSnapshot?.currentGalaxyInfoHtml === "string"
      ? hudSnapshot.currentGalaxyInfoHtml.trim().length > 0
      : false,
    galaxyPathDotsPresent: typeof hudSnapshot?.galaxyPathDotsHtml === "string"
      ? hudSnapshot.galaxyPathDotsHtml.trim().length > 0
      : false,
    galaxyMapPathNodes: summarizeReleaseGalaxyPathNodes(pathNodes),
    hooks: {
      getGalaxyHudSnapshot: hasHudHook,
      getGalaxyPath: hasPathHook
    },
    fieldPresence: {
      currentGalaxyType: typeof currentGalaxyType === "string" && currentGalaxyType.length > 0,
      pendingChoices: Array.isArray(hasHudHook ? hudSnapshot?.pendingChoices : state.run.galaxyMap?.pendingChoices),
      panelOpen: typeof (hasHudHook ? hudSnapshot?.panelOpen : false) === "boolean",
      pathNodes: Array.isArray(pathNodes)
    }
  };
}

function collectReleaseBuildHooks() {
  const hasBuildPaletteHook = typeof getBuildPaletteDiagnostics === "function";
  const hasSelectedCellHook = typeof getSelectedCellDiagnostics === "function";
  const hasPlacementHook = typeof resolvePlacementArgsForTest === "function";
  const diagnostics = hasBuildPaletteHook ? getBuildPaletteDiagnostics() : null;
  const facilities = Array.isArray(diagnostics?.facilities) ? diagnostics.facilities : [];
  const palette = facilities.map((entry) => ({
    type: entry?.id ?? null,
    role: entry?.role ?? null,
    affordable: !!entry?.affordable,
    count: Number.isFinite(entry?.count) ? entry.count : 0,
    powerStress: !!(entry?.powerRiskAfterBuild || entry?.powerTightAfterBuild),
    hasReason: typeof entry?.recommendation?.reasonKey === "string" && entry.recommendation.reasonKey.length > 0
  }));
  const selectedCell = state.selectedCell;
  const selectedCellKey = selectedCell && Number.isFinite(selectedCell.x) && Number.isFinite(selectedCell.y)
    ? key(selectedCell.x, selectedCell.y)
    : null;
  return {
    available: hasBuildPaletteHook,
    selectedBuildType: typeof state.selectedBuild === "string" ? state.selectedBuild : null,
    selectedCellKey,
    palette,
    paletteCount: palette.length,
    affordableCount: palette.filter((entry) => entry.affordable).length,
    hooks: {
      getBuildPaletteDiagnostics: hasBuildPaletteHook,
      getSelectedCellDiagnostics: hasSelectedCellHook,
      getPlacementDiagnostics: hasPlacementHook
    },
    fieldPresence: {
      palette: Array.isArray(diagnostics?.facilities),
      summary: isMetaObject(diagnostics?.summary)
    }
  };
}

function collectReleaseMetaHooks(baseSnapshot) {
  const summary = isMetaObject(baseSnapshot?.metaStorage?.summary)
    ? baseSnapshot.metaStorage.summary
    : summarizeMetaStorageForPlaytestSnapshot();
  const toggleState = snapshotDomNodeState("metaPanelToggle");
  return {
    available: true,
    panelOpen: isMetaPanelOpen(),
    panelToggleVisible: !!toggleState.visible,
    panelToggleExists: !!toggleState.exists,
    activeTab: typeof metaPanelUi?.activeTab === "string" ? metaPanelUi.activeTab : null,
    categoryFilter: typeof metaPanelUi?.categoryFilter === "string" ? metaPanelUi.categoryFilter : null,
    points: normalizeMetaPoints(state.meta?.points),
    talentCount: Number.isFinite(summary?.talentCount) ? summary.talentCount : 0,
    selectedProtocol: typeof summary?.selectedProtocol === "string" ? summary.selectedProtocol : null,
    activeProtocol: typeof summary?.activeProtocol === "string" ? summary.activeProtocol : null,
    hasCorruptRaw: !!summary?.hasCorruptRaw,
    hooks: {
      summarizeMetaStorageForPlaytestSnapshot: typeof summarizeMetaStorageForPlaytestSnapshot === "function",
      metaSnapshot: typeof window.__gameTest?.meta?.snapshotMeta === "function"
    },
    fieldPresence: {
      summary: isMetaObject(summary),
      panelToggle: !!toggleState.exists
    }
  };
}

function collectReleaseHookStatus(baseSnapshot, buildHooks, metaHooks, galaxyHooks) {
  const playtestApi = window.__gameTest?.playtest;
  const designHooks = {
    getStationDesignHealth: typeof playtestApi?.getStationDesignHealth === "function",
    getResourceReachability: typeof playtestApi?.getResourceReachability === "function",
    getMiningCoverageDiagnostics: typeof playtestApi?.getMiningCoverageDiagnostics === "function",
    getPowerMargin: typeof playtestApi?.getPowerMargin === "function"
  };
  const combatHooks = {
    getThreatSummary: typeof playtestApi?.getThreatSummary === "function",
    getWeaponEffectiveness: typeof playtestApi?.getWeaponEffectiveness === "function",
    getRecentDamageSummary: typeof playtestApi?.getRecentDamageSummary === "function",
    getRepairStatusSummary: typeof playtestApi?.getRepairStatusSummary === "function",
    getCombatReview: typeof playtestApi?.getCombatReview === "function"
  };
  const designFields = {
    health: isMetaObject(baseSnapshot?.design?.health) || Array.isArray(baseSnapshot?.design?.health),
    reachability: isMetaObject(baseSnapshot?.design?.reachability) || Array.isArray(baseSnapshot?.design?.reachability),
    power: isMetaObject(baseSnapshot?.design?.power) || Array.isArray(baseSnapshot?.design?.power)
  };
  const combatFields = {
    threat: baseSnapshot?.combat?.threat != null,
    weapon: baseSnapshot?.combat?.weapon != null,
    damage: baseSnapshot?.combat?.damage != null,
    repair: baseSnapshot?.combat?.repair != null,
    review: baseSnapshot?.combat?.review != null
  };
  const buildFields = {
    palette: Array.isArray(buildHooks?.palette),
    selectedBuildType: "selectedBuildType" in (buildHooks || {}),
    selectedCellKey: "selectedCellKey" in (buildHooks || {})
  };
  const metaFields = {
    points: Number.isFinite(metaHooks?.points),
    activeTab: typeof metaHooks?.activeTab === "string" || metaHooks?.activeTab == null,
    selectedProtocol: typeof metaHooks?.selectedProtocol === "string" || metaHooks?.selectedProtocol == null
  };
  const galaxyFields = {
    currentGalaxyType: typeof galaxyHooks?.currentGalaxyType === "string" || galaxyHooks?.currentGalaxyType == null,
    pendingChoices: Array.isArray(galaxyHooks?.pendingChoices),
    pathNodes: Array.isArray(galaxyHooks?.galaxyMapPathNodes)
  };
  return {
    design: {
      hooks: designHooks,
      fields: designFields,
      available: Object.values(designHooks).every(Boolean) && Object.values(designFields).every(Boolean)
    },
    combat: {
      hooks: combatHooks,
      fields: combatFields,
      available: Object.values(combatHooks).every(Boolean) && Object.values(combatFields).every(Boolean)
    },
    build: {
      hooks: { ...(buildHooks?.hooks || {}) },
      fields: buildFields,
      available: Object.values(buildHooks?.hooks || {}).every(Boolean) && Object.values(buildFields).every(Boolean)
    },
    meta: {
      hooks: { ...(metaHooks?.hooks || {}) },
      fields: metaFields,
      available: Object.values(metaHooks?.hooks || {}).every(Boolean) && Object.values(metaFields).every(Boolean)
    },
    galaxy: {
      hooks: { ...(galaxyHooks?.hooks || {}) },
      fields: galaxyFields,
      available: Object.values(galaxyHooks?.hooks || {}).every(Boolean) && Object.values(galaxyFields).every(Boolean)
    }
  };
}

function collectReleaseRuntimeStateSignature(baseSnapshot) {
  const run = isMetaObject(state.run) ? state.run : {};
  const resources = isMetaObject(baseSnapshot?.resource) ? baseSnapshot.resource : summarizeResourceForPlaytestSnapshot();
  const priorityTarget = state.input?.priorityTarget;
  const targetEnemy = isMetaObject(priorityTarget?.enemy) ? priorityTarget.enemy : null;
  return {
    capturedAt: Date.now(),
    resources: {
      metal: Number(resources.metal) || 0,
      ore: Number(resources.ore) || 0,
      gas: Number(resources.gas) || 0,
      plasma: Number(resources.plasma) || 0,
      research: Number(resources.research) || 0,
      powerUsed: Number(resources.powerUsed) || 0,
      powerAvailable: Number(resources.powerAvailable) || 0
    },
    enemiesCount: Array.isArray(state.enemies) ? state.enemies.length : 0,
    projectilesCount: Array.isArray(state.projectiles) ? state.projectiles.length : 0,
    run: {
      level: Number.isFinite(run.level) ? run.level : null,
      currentGalaxyType: typeof run.currentGalaxyType === "string" ? run.currentGalaxyType : null,
      seed: Number.isFinite(run.seed) ? run.seed : null,
      objectiveType: typeof run.objective?.type === "string" ? run.objective.type : null,
      awaitingObjectiveChoice: !!run.awaitingObjectiveChoice
    },
    priorityTarget: {
      active: !!priorityTarget,
      enemyId: targetEnemy?.id ?? null,
      enemyKind: typeof targetEnemy?.kind === "string" ? targetEnemy.kind : null,
      validUntil: Number.isFinite(priorityTarget?.validUntil) ? priorityTarget.validUntil : null
    }
  };
}

function isReleaseRuntimeStateSignatureConsistent(before, after) {
  if (!before || !after) return false;
  const resourceKeys = ["metal", "ore", "gas", "plasma", "research", "powerUsed", "powerAvailable"];
  const resourcesConsistent = resourceKeys.every((key) => before.resources?.[key] === after.resources?.[key]);
  return resourcesConsistent
    && before.enemiesCount === after.enemiesCount
    && before.projectilesCount === after.projectilesCount
    && before.run?.level === after.run?.level
    && before.run?.currentGalaxyType === after.run?.currentGalaxyType
    && before.run?.seed === after.run?.seed
    && before.run?.objectiveType === after.run?.objectiveType
    && before.run?.awaitingObjectiveChoice === after.run?.awaitingObjectiveChoice
    && before.priorityTarget?.active === after.priorityTarget?.active
    && before.priorityTarget?.enemyId === after.priorityTarget?.enemyId
    && before.priorityTarget?.enemyKind === after.priorityTarget?.enemyKind
    && before.priorityTarget?.validUntil === after.priorityTarget?.validUntil;
}

function createReleaseFrameTimingUnavailableResult(reason, requestedFrames, effectiveFrames, longFrameThresholdMs, truncated) {
  const now = Date.now();
  return {
    available: false,
    reason,
    mode: "unavailable",
    requestedFrames,
    effectiveFrames,
    durationMs: 0,
    sampleCount: 0,
    avgMs: null,
    maxMs: null,
    longFrameCount: 0,
    longFrameThresholdMs,
    truncated,
    context: {
      paused: !!state.paused,
      capturedAt: now,
      sampleStartedAt: now,
      sampleEndedAt: now
    }
  };
}

function buildReleaseFrameTimingResult({
  frames,
  mode,
  requestedFrames,
  effectiveFrames,
  longFrameThresholdMs,
  truncated,
  sampleStartedAt
}) {
  const sampleEndedAt = Date.now();
  const sampleCount = frames.length;
  const sum = frames.reduce((acc, value) => acc + value, 0);
  const avgMs = sampleCount > 0 ? sum / sampleCount : null;
  const maxMs = sampleCount > 0 ? Math.max(...frames) : null;
  const longFrameCount = frames.filter((value) => value >= longFrameThresholdMs).length;
  return {
    available: sampleCount > 0,
    reason: sampleCount > 0 ? null : "empty_samples",
    mode,
    requestedFrames,
    effectiveFrames,
    durationMs: Math.max(0, sampleEndedAt - sampleStartedAt),
    sampleCount,
    avgMs,
    maxMs,
    longFrameCount,
    longFrameThresholdMs,
    truncated,
    context: {
      paused: !!state.paused,
      capturedAt: sampleEndedAt,
      sampleStartedAt,
      sampleEndedAt
    }
  };
}

function sampleReleaseFrameTiming(rawSampleFrames = RELEASE_FRAME_TIMING_DEFAULT_SAMPLES, rawLongFrameThresholdMs = RELEASE_FRAME_TIMING_LONG_FRAME_MS) {
  const normalized = normalizeReleaseSampleFrames(rawSampleFrames);
  const longFrameThresholdMs = Number.isFinite(Number(rawLongFrameThresholdMs))
    ? Math.max(1, Number(rawLongFrameThresholdMs))
    : RELEASE_FRAME_TIMING_LONG_FRAME_MS;
  const sampleStartedAt = Date.now();
  const hasPerformanceNow = typeof performance?.now === "function";
  const nowFn = hasPerformanceNow ? () => performance.now() : () => Date.now();
  if (typeof window?.requestAnimationFrame === "function") {
    return new Promise((resolve) => {
      const frames = [];
      let previous = nowFn();
      const step = (timestamp) => {
        const now = Number.isFinite(timestamp) ? timestamp : nowFn();
        frames.push(Math.max(0, now - previous));
        previous = now;
        if (frames.length >= normalized.effective) {
          resolve(buildReleaseFrameTimingResult({
            frames,
            mode: "rAF",
            requestedFrames: normalized.requested,
            effectiveFrames: normalized.effective,
            longFrameThresholdMs,
            truncated: normalized.truncated,
            sampleStartedAt
          }));
          return;
        }
        window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    });
  }
  if (typeof setTimeout === "function") {
    return new Promise((resolve) => {
      const frames = [];
      let previous = nowFn();
      const step = () => {
        const now = nowFn();
        frames.push(Math.max(0, now - previous));
        previous = now;
        if (frames.length >= normalized.effective) {
          resolve(buildReleaseFrameTimingResult({
            frames,
            mode: "timeout",
            requestedFrames: normalized.requested,
            effectiveFrames: normalized.effective,
            longFrameThresholdMs,
            truncated: normalized.truncated,
            sampleStartedAt
          }));
          return;
        }
        setTimeout(step, 16);
      };
      setTimeout(step, 16);
    });
  }
  return Promise.resolve(createReleaseFrameTimingUnavailableResult(
    "frame_timing_unavailable",
    normalized.requested,
    normalized.effective,
    longFrameThresholdMs,
    normalized.truncated
  ));
}

function createReleaseCheck({ id, label, status, severity = "info", details = {}, layer = "automatic" }) {
  return {
    id,
    label,
    layer,
    status,
    severity,
    blocking: status === "fail" && severity === "blocking",
    details,
    capturedAt: Date.now()
  };
}

function summarizeReleaseLayerCoverage(items) {
  return {
    covered: items.filter((item) => item.status !== "unknown").length,
    uncovered: items.filter((item) => item.status === "unknown").length
  };
}

function buildReleaseManualEvidenceItems() {
  return RELEASE_MANUAL_CHECK_IDS.map((id) => ({
    id: `manual.${id}`,
    label: `人工路径 ${id}`,
    layer: "manual",
    source: "checklist",
    summary: "未由自动检查覆盖，需人工/真实浏览器补证",
    severity: "info",
    status: "unknown",
    blocking: false
  }));
}

function buildReleaseEvidenceLayers(checks, environment, viewport) {
  const automatic = checks
    .filter((entry) => entry.layer === "automatic")
    .map((entry) => ({
      id: `auto.${entry.id}`,
      label: entry.label,
      layer: "automatic",
      source: "snapshot",
      summary: entry.details?.summary || `${entry.label}: ${entry.status}`,
      severity: entry.severity,
      status: entry.status,
      blocking: entry.blocking
    }));
  const browser = [
    {
      id: "browser.viewport.narrow",
      label: "窄屏证据",
      layer: "browser",
      source: "snapshot",
      summary: viewport?.narrowViewport
        ? "已记录窄屏视口命中，仍需人工确认体验"
        : "当前快照未命中窄屏，需额外窄屏补证",
      severity: "info",
      status: viewport?.narrowViewport ? "pass" : "unknown",
      blocking: false
    },
    {
      id: "browser.environment.userAgent",
      label: "浏览器环境标识",
      layer: "browser",
      source: "snapshot",
      summary: environment?.userAgent ? `UA: ${environment.userAgent}` : "未获取 userAgent",
      severity: "info",
      status: environment?.userAgent ? "pass" : "unknown",
      blocking: false
    },
    {
      id: "browser.environment.headlessHint",
      label: "headless 提示",
      layer: "browser",
      source: "snapshot",
      summary: environment?.isHeadlessHint
        ? `疑似 headless：${(environment.headlessReasons || []).join(", ")}`
        : "未命中 headless 提示规则",
      severity: environment?.isHeadlessHint ? "warn" : "info",
      status: environment?.isHeadlessHint ? "warn" : "pass",
      blocking: false
    },
    {
      id: "browser.runtimeErrors.console",
      label: "浏览器 Console 观察",
      layer: "browser",
      source: "external",
      summary: "自动检查不覆盖 console 面板，需 PM 手工记录",
      severity: "info",
      status: "unknown",
      blocking: false
    }
  ];
  const manual = buildReleaseManualEvidenceItems();
  const automaticPassed = automatic.filter((entry) => entry.status === "pass").length;
  const automaticFailed = automatic.filter((entry) => entry.status === "fail").length;
  const automaticUnknown = automatic.filter((entry) => entry.status === "unknown").length;
  const browserCoverage = summarizeReleaseLayerCoverage(browser);
  const manualCoverage = summarizeReleaseLayerCoverage(manual);
  return {
    layers: { automatic, browser, manual },
    coverage: {
      automaticPassed,
      automaticFailed,
      automaticUnknown,
      browserCovered: browserCoverage.covered,
      browserUncovered: browserCoverage.uncovered,
      manualCovered: manualCoverage.covered,
      manualUncovered: manualCoverage.uncovered
    }
  };
}

function collectReleaseReadinessSnapshot(options = {}) {
  bindPlaytestErrorListeners();
  const baseSnapshot = window.__gameTest?.playtest?.snapshot?.() || {
    version: "unavailable",
    capturedAt: Date.now(),
    runtimeErrors: { count: playtestRuntimeErrorBuffer.length, latest: getPlaytestRuntimeErrors() },
    keyDom: {},
    viewport: { width: window.innerWidth || 0, height: window.innerHeight || 0, devicePixelRatio: window.devicePixelRatio || 1, narrowViewport: false },
    metaStorage: { saveKey: SAVE_KEY, summary: summarizeMetaStorageForPlaytestSnapshot() },
    resource: summarizeResourceForPlaytestSnapshot(),
    design: {},
    combat: {}
  };
  const storageSignature = options.storageSignature || captureReleaseStorageSignature();
  const frameTiming = options.frameTiming || createReleaseFrameTimingUnavailableResult(
    "call_runReleaseCandidateChecks_for_sampling",
    RELEASE_FRAME_TIMING_DEFAULT_SAMPLES,
    RELEASE_FRAME_TIMING_DEFAULT_SAMPLES,
    RELEASE_FRAME_TIMING_LONG_FRAME_MS,
    false
  );
  const buildHooks = collectReleaseBuildHooks();
  const metaHooks = collectReleaseMetaHooks(baseSnapshot);
  const galaxyHooks = collectReleaseGalaxyHooks(baseSnapshot);
  const hudHooks = collectReleaseHudHooks(baseSnapshot);
  const environment = collectReleaseEnvironment(baseSnapshot.viewport);
  const hookStatus = collectReleaseHookStatus(baseSnapshot, buildHooks, metaHooks, galaxyHooks);
  const runtimeStateSignature = collectReleaseRuntimeStateSignature(baseSnapshot);
  const evidence = options.evidence || buildReleaseEvidenceLayers([], environment, baseSnapshot.viewport);
  return safeDeepCloneForTest({
    version: RELEASE_READINESS_VERSION,
    capturedAt: Date.now(),
    base: baseSnapshot,
    storageSignature,
    frameTiming,
    environment,
    build: buildHooks,
    meta: metaHooks,
    galaxy: galaxyHooks,
    hud: hudHooks,
    hookStatus,
    runtimeStateSignature,
    evidence
  });
}

function collectReleaseReadinessMissing(domainStatus) {
  const missingHooks = Object.entries(domainStatus?.hooks || {})
    .filter(([, available]) => !available)
    .map(([name]) => name);
  const missingFields = Object.entries(domainStatus?.fields || {})
    .filter(([, available]) => !available)
    .map(([name]) => name);
  return { missingHooks, missingFields };
}

function evaluateReleaseCandidateChecks({
  snapshotBefore,
  snapshotAfter,
  storageBefore,
  storageAfter,
  runtimeBefore,
  runtimeAfter,
  frameTiming
}) {
  const checks = [];
  const residualRisks = [];
  const runtimeErrorCount = Number(snapshotAfter?.base?.runtimeErrors?.count) || 0;
  checks.push(createReleaseCheck({
    id: "runtimeErrors.empty",
    label: "runtime errors 为空",
    status: runtimeErrorCount === 0 ? "pass" : "fail",
    severity: runtimeErrorCount === 0 ? "info" : "blocking",
    details: {
      summary: runtimeErrorCount === 0 ? "未发现新的 runtime error" : `发现 ${runtimeErrorCount} 条 runtime error`,
      count: runtimeErrorCount
    }
  }));

  const baseDomRequired = ["hud", "currentGoal", "nextStep", "metaPanelToggle", "galaxyMapPanel", "runSettlementPanel"];
  const missingBaseDom = baseDomRequired.filter((id) => !snapshotAfter?.base?.keyDom?.[id]?.exists);
  const missingExtendedDom = RELEASE_EXTRA_KEY_DOM_IDS.filter((id) => !snapshotAfter?.hud?.keyDom?.[id]?.exists);
  const invisibleCritical = ["runInfo", "resources", "pauseBtn"].filter((id) => {
    const state = snapshotAfter?.hud?.keyDom?.[id];
    return state?.exists && !state?.visible;
  });
  const keyDomFailed = missingBaseDom.length > 0 || missingExtendedDom.length > 0 || invisibleCritical.length > 0;
  checks.push(createReleaseCheck({
    id: "keyDom.present",
    label: "关键 DOM 可读",
    status: keyDomFailed ? "fail" : "pass",
    severity: keyDomFailed ? "blocking" : "info",
    details: {
      summary: keyDomFailed ? "关键 DOM 有缺失/不可见" : "关键 DOM 全部可见或存在",
      missingBaseDom,
      missingExtendedDom,
      invisibleCritical
    }
  }));

  const viewport = snapshotAfter?.base?.viewport || {};
  const viewportValid = Number(viewport.width) > 0 && Number(viewport.height) > 0 && Number(viewport.devicePixelRatio) > 0;
  checks.push(createReleaseCheck({
    id: "viewport.recorded",
    label: "viewport 已记录",
    status: viewportValid ? "pass" : "fail",
    severity: viewportValid ? "info" : "blocking",
    details: {
      summary: viewportValid ? "viewport 字段有效" : "viewport 字段缺失或非法",
      viewport
    }
  }));

  const domains = ["design", "combat", "build", "meta", "galaxy"];
  for (const domain of domains) {
    const status = snapshotAfter?.hookStatus?.[domain];
    const missing = collectReleaseReadinessMissing(status);
    const available = !!status?.available;
    checks.push(createReleaseCheck({
      id: `${domain}.hooks`,
      label: `${domain} hooks/字段完整`,
      status: available ? "pass" : "fail",
      severity: available ? "info" : "blocking",
      details: {
        summary: available ? `${domain} hooks 与字段均可用` : `${domain} hooks/字段存在缺口`,
        ...missing
      }
    }));
  }

  const saveKeyStable = snapshotAfter?.base?.metaStorage?.saveKey === SAVE_KEY;
  const schemaVersion = Number(snapshotAfter?.base?.metaStorage?.summary?.schemaVersion);
  const schemaStable = schemaVersion === META_SCHEMA_VERSION;
  checks.push(createReleaseCheck({
    id: "storage.schemaStable",
    label: "存档 key/schema 稳定",
    status: saveKeyStable && schemaStable ? "pass" : "fail",
    severity: saveKeyStable && schemaStable ? "info" : "blocking",
    details: {
      summary: saveKeyStable && schemaStable
        ? "SAVE_KEY 与 META_SCHEMA_VERSION 均稳定"
        : "SAVE_KEY 或 schemaVersion 与基线不一致",
      saveKey: snapshotAfter?.base?.metaStorage?.saveKey ?? null,
      expectedSaveKey: SAVE_KEY,
      schemaVersion,
      expectedSchemaVersion: META_SCHEMA_VERSION
    }
  }));

  const storageConsistent = isReleaseStorageSignatureConsistent(storageBefore, storageAfter);
  checks.push(createReleaseCheck({
    id: "storage.unchanged",
    label: "storage signature 前后一致",
    status: storageConsistent ? "pass" : "fail",
    severity: storageConsistent ? "info" : "blocking",
    details: {
      summary: storageConsistent ? "storage signature 未变化" : "storage signature 发生变化",
      before: storageBefore,
      after: storageAfter
    }
  }));
  if (!storageConsistent) {
    residualRisks.push({
      kind: "storage_mutation",
      severity: "blocking",
      summary: "runReleaseCandidateChecks 期间检测到 storage signature 变化",
      details: {
        before: storageBefore,
        after: storageAfter
      }
    });
  }

  const frameTimingAvailable = !!frameTiming?.available;
  checks.push(createReleaseCheck({
    id: "frameTiming.available",
    label: "frame timing 可用性",
    status: frameTimingAvailable ? "pass" : "unknown",
    severity: frameTimingAvailable ? "info" : "warn",
    details: {
      summary: frameTimingAvailable ? "frame timing 采样成功" : "frame timing 不可用，需人工补证",
      mode: frameTiming?.mode || "unavailable",
      reason: frameTiming?.reason || null
    }
  }));
  if (!frameTimingAvailable) {
    residualRisks.push({
      kind: "frame_timing_unavailable",
      severity: "warn",
      summary: "frame timing 粗采样不可用，本次仅保留结构化快照证据",
      details: {
        frameTiming
      }
    });
  }

  const hasLongFrames = frameTimingAvailable && Number(frameTiming.longFrameCount) > 0;
  checks.push(createReleaseCheck({
    id: "frameTiming.longFrame",
    label: "frame timing 长帧观察",
    status: frameTimingAvailable ? (hasLongFrames ? "warn" : "pass") : "unknown",
    severity: hasLongFrames ? "warn" : "info",
    details: {
      summary: frameTimingAvailable
        ? (hasLongFrames ? `检测到 ${frameTiming.longFrameCount} 帧长帧` : "未检测到长帧")
        : "未采到 frame timing",
      sampleCount: frameTiming?.sampleCount || 0,
      longFrameCount: frameTiming?.longFrameCount || 0,
      thresholdMs: frameTiming?.longFrameThresholdMs || RELEASE_FRAME_TIMING_LONG_FRAME_MS
    }
  }));
  if (hasLongFrames) {
    residualRisks.push({
      kind: "frame_long_warning",
      severity: "warn",
      summary: "frame timing 粗采样命中长帧，需结合人工体验判断是否阻塞",
      details: {
        longFrameCount: frameTiming.longFrameCount,
        sampleCount: frameTiming.sampleCount,
        thresholdMs: frameTiming.longFrameThresholdMs
      }
    });
  }

  const runtimeStateConsistent = isReleaseRuntimeStateSignatureConsistent(runtimeBefore, runtimeAfter);
  checks.push(createReleaseCheck({
    id: "runtimeState.signatureStable",
    label: "运行态关键签名对比",
    status: runtimeStateConsistent ? "pass" : "warn",
    severity: runtimeStateConsistent ? "info" : "warn",
    details: {
      summary: runtimeStateConsistent
        ? "resources/enemies/projectiles/run/priorityTarget 签名一致"
        : "运行态签名有变化（可能来自自然帧推进）",
      before: runtimeBefore,
      after: runtimeAfter
    }
  }));
  if (!runtimeStateConsistent) {
    residualRisks.push({
      kind: "runtime_state_drift",
      severity: "warn",
      summary: "运行态关键签名发生变化，需结合调用时机判断是否自然推进",
      details: {
        before: runtimeBefore,
        after: runtimeAfter
      }
    });
  }

  if (snapshotAfter?.environment?.isHeadlessHint) {
    residualRisks.push({
      kind: "headless_hint",
      severity: "warn",
      summary: "当前环境疑似 headless，自动证据不能替代真实浏览器人工体验",
      details: {
        headlessReasons: snapshotAfter.environment.headlessReasons || []
      }
    });
  }

  residualRisks.push({
    kind: "browser_uncovered",
    severity: "info",
    summary: "browser 层仍需 PM 补充 console 与真实浏览器路径证据",
    details: {}
  });
  residualRisks.push({
    kind: "manual_uncovered",
    severity: "info",
    summary: "manual 层默认未覆盖，自动检查不会标记人工通过",
    details: {
      checklistIds: [...RELEASE_MANUAL_CHECK_IDS]
    }
  });

  const blockingFailed = checks.some((entry) => entry.layer === "automatic" && entry.status === "fail" && entry.severity === "blocking");
  const ok = !blockingFailed && storageConsistent;
  return { ok, checks, residualRisks };
}

function getReleaseReadinessSnapshot() {
  return collectReleaseReadinessSnapshot();
}

async function runReleaseCandidateChecks(options = {}) {
  const startedAt = Date.now();
  bindPlaytestErrorListeners();
  const sampleFrames = options?.sampleFrames ?? RELEASE_FRAME_TIMING_DEFAULT_SAMPLES;
  const longFrameThresholdMs = options?.longFrameThresholdMs ?? RELEASE_FRAME_TIMING_LONG_FRAME_MS;
  const storageSignatureBefore = captureReleaseStorageSignature();
  const snapshotBefore = collectReleaseReadinessSnapshot({
    storageSignature: storageSignatureBefore,
    frameTiming: createReleaseFrameTimingUnavailableResult(
      "pending_sampling",
      normalizeReleaseSampleFrames(sampleFrames).requested,
      normalizeReleaseSampleFrames(sampleFrames).effective,
      Number.isFinite(Number(longFrameThresholdMs)) ? Number(longFrameThresholdMs) : RELEASE_FRAME_TIMING_LONG_FRAME_MS,
      normalizeReleaseSampleFrames(sampleFrames).truncated
    )
  });
  const runtimeStateSignatureBefore = snapshotBefore.runtimeStateSignature;
  const frameTiming = await sampleReleaseFrameTiming(sampleFrames, longFrameThresholdMs);
  const storageSignatureAfter = captureReleaseStorageSignature();
  const snapshotAfter = collectReleaseReadinessSnapshot({
    storageSignature: storageSignatureAfter,
    frameTiming
  });
  const runtimeStateSignatureAfter = snapshotAfter.runtimeStateSignature;
  const evaluated = evaluateReleaseCandidateChecks({
    snapshotBefore,
    snapshotAfter,
    storageBefore: storageSignatureBefore,
    storageAfter: storageSignatureAfter,
    runtimeBefore: runtimeStateSignatureBefore,
    runtimeAfter: runtimeStateSignatureAfter,
    frameTiming
  });
  const evidence = buildReleaseEvidenceLayers(evaluated.checks, snapshotAfter.environment, snapshotAfter.base.viewport);
  snapshotAfter.evidence = evidence;
  const durationMs = Math.max(0, Date.now() - startedAt);
  return safeDeepCloneForTest({
    version: RELEASE_READINESS_VERSION,
    capturedAt: Date.now(),
    ok: evaluated.ok,
    durationMs,
    options: {
      sampleFrames: normalizeReleaseSampleFrames(sampleFrames).requested,
      longFrameThresholdMs: Number.isFinite(Number(longFrameThresholdMs))
        ? Number(longFrameThresholdMs)
        : RELEASE_FRAME_TIMING_LONG_FRAME_MS
    },
    checks: evaluated.checks,
    snapshotBefore,
    snapshotAfter,
    residualRisks: evaluated.residualRisks,
    notes: {
      frameTimingMayAdvanceTime: true,
      automaticCannotReplaceManual: true
    }
  });
}

function isReleaseCandidatePlaytestUrlEnabled() {
  if (typeof location === "undefined") return false;
  try {
    const params = new URLSearchParams(location.search);
    return params.get("playtest") === "1" || params.has("release-candidate");
  } catch {
    return false;
  }
}

function isReleaseCandidatePanelOpen() {
  return !!releaseCandidatePanelEl && !releaseCandidatePanelEl.classList.contains("hidden");
}

function ensureReleaseCandidateToggleButton() {
  if (typeof document === "undefined") return null;
  if (releaseCandidateToggleBtnEl) return releaseCandidateToggleBtnEl;
  releaseCandidateToggleBtnEl = document.createElement("button");
  releaseCandidateToggleBtnEl.type = "button";
  releaseCandidateToggleBtnEl.id = "releaseCandidateToggleBtn";
  releaseCandidateToggleBtnEl.className = "release-candidate-toggle hidden";
  releaseCandidateToggleBtnEl.textContent = "PM 检查";
  releaseCandidateToggleBtnEl.title = "打开发布候选人工 checklist（仅 playtest 模式）";
  releaseCandidateToggleBtnEl.addEventListener("click", () => openReleaseCandidatePanel());
  document.body.appendChild(releaseCandidateToggleBtnEl);
  return releaseCandidateToggleBtnEl;
}

function syncReleaseCandidateToggleVisibility() {
  if (!releaseCandidateToggleBtnEl) return;
  const showToggle = releaseCandidatePlaytestUrlEnabled && !isReleaseCandidatePanelOpen();
  releaseCandidateToggleBtnEl.classList.toggle("hidden", !showToggle);
}

function ensureReleaseCandidatePanel() {
  if (typeof document === "undefined") return null;
  if (releaseCandidatePanelEl) return releaseCandidatePanelEl;

  releaseCandidatePanelEl = document.createElement("section");
  releaseCandidatePanelEl.id = "releaseCandidatePanel";
  releaseCandidatePanelEl.className = "release-candidate-panel hidden";
  releaseCandidatePanelEl.setAttribute("role", "complementary");
  releaseCandidatePanelEl.setAttribute("aria-label", "发布候选人工 playtest checklist");

  releaseCandidatePanelEl.innerHTML = `
    <header class="release-candidate-panel__header">
      <h3 class="release-candidate-panel__title">PM 人工 Playtest Checklist</h3>
      <div class="release-candidate-panel__actions">
        <button type="button" data-rc-action="refresh">刷新自动检查</button>
        <button type="button" data-rc-action="copy">复制摘要</button>
        <button type="button" data-rc-action="close">关闭</button>
      </div>
    </header>
    <p class="release-candidate-panel__notice">
      自动检查、浏览器取证、人工结论分层展示。人工项默认未完成，脚本不会自动标记通过。
      未由自动检查覆盖的路径需真实浏览器人工补证；无真实人工体验时结论应为「发布候选证据不足」。
    </p>
    <div class="release-candidate-panel__status" data-rc-region="status">尚未运行自动检查。</div>
    <section class="release-candidate-panel__section" aria-labelledby="rcAutoHeading">
      <h4 id="rcAutoHeading">自动检查结果</h4>
      <div class="release-candidate-panel__body" data-rc-region="automatic">等待刷新…</div>
    </section>
    <section class="release-candidate-panel__section" aria-labelledby="rcBrowserHeading">
      <h4 id="rcBrowserHeading">浏览器取证</h4>
      <div class="release-candidate-panel__body" data-rc-region="browser">等待刷新…</div>
    </section>
    <section class="release-candidate-panel__section" aria-labelledby="rcManualHeading">
      <h4 id="rcManualHeading">人工结论（默认未完成）</h4>
      <ul class="release-candidate-manual-list" data-rc-region="manual"></ul>
    </section>
  `;

  releaseCandidatePanelEl.querySelector('[data-rc-action="refresh"]')?.addEventListener("click", () => {
    refreshReleaseCandidateAutoChecks();
  });
  releaseCandidatePanelEl.querySelector('[data-rc-action="copy"]')?.addEventListener("click", () => {
    copyReleaseCandidateSummary();
  });
  releaseCandidatePanelEl.querySelector('[data-rc-action="close"]')?.addEventListener("click", () => {
    closeReleaseCandidatePanel();
  });

  renderReleaseCandidateManualSection();
  document.body.appendChild(releaseCandidatePanelEl);
  return releaseCandidatePanelEl;
}

function readReleaseCandidateManualStatuses() {
  const statuses = {};
  if (!releaseCandidatePanelEl) return statuses;
  const selects = releaseCandidatePanelEl.querySelectorAll("[data-rc-manual-id]");
  for (const select of selects) {
    const id = select.getAttribute("data-rc-manual-id");
    if (id) statuses[id] = select.value || "";
  }
  return statuses;
}

function renderReleaseCandidateManualSection(preserveStatuses = null) {
  if (!releaseCandidatePanelEl) return;
  const listEl = releaseCandidatePanelEl.querySelector('[data-rc-region="manual"]');
  if (!listEl) return;
  const saved = preserveStatuses || readReleaseCandidateManualStatuses();
  listEl.innerHTML = "";
  for (const item of PLAYTEST_MANUAL_CHECKLIST_ITEMS) {
    const li = document.createElement("li");
    li.className = "release-candidate-manual-item";
    const label = document.createElement("label");
    label.className = "release-candidate-manual-item__label";
    label.textContent = item.label;
    const hint = document.createElement("span");
    hint.className = "release-candidate-manual-item__hint";
    hint.textContent = item.hint;
    const select = document.createElement("select");
    select.setAttribute("data-rc-manual-id", item.id);
    select.className = "release-candidate-manual-item__status";
    for (const option of PLAYTEST_MANUAL_STATUS_OPTIONS) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    }
    select.value = saved[item.id] || "";
    label.appendChild(select);
    li.appendChild(label);
    li.appendChild(hint);
    listEl.appendChild(li);
  }
}

function formatReleaseCandidateCheckLine(entry) {
  if (!entry) return "";
  const status = entry.status || "unknown";
  const summary = entry.details?.summary || entry.summary || entry.label || entry.id;
  return `- [${status}] ${entry.label || entry.id}: ${summary}`;
}

function escapeReleaseCandidateHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function renderReleaseCandidateAutomaticSection(result) {
  if (!releaseCandidatePanelEl) return;
  const region = releaseCandidatePanelEl.querySelector('[data-rc-region="automatic"]');
  if (!region) return;
  const checks = Array.isArray(result?.checks) ? result.checks : [];
  const automaticChecks = checks.filter((entry) => entry.layer !== "manual");
  if (automaticChecks.length === 0) {
    region.textContent = "无自动检查项。";
    return;
  }
  const lines = automaticChecks.map(formatReleaseCandidateCheckLine);
  const okLine = `ok=${result?.ok === true ? "true" : "false"} · 耗时 ${result?.durationMs ?? "?"}ms`;
  region.innerHTML = `<p class="release-candidate-panel__meta">${escapeReleaseCandidateHtml(okLine)}</p><pre class="release-candidate-panel__pre">${escapeReleaseCandidateHtml(lines.join("\n"))}</pre>`;
}

function renderReleaseCandidateBrowserSection(result) {
  if (!releaseCandidatePanelEl) return;
  const region = releaseCandidatePanelEl.querySelector('[data-rc-region="browser"]');
  if (!region) return;
  const snapshot = result?.snapshotAfter || result?.snapshot || null;
  const environment = snapshot?.environment || {};
  const viewport = snapshot?.base?.viewport || {};
  const evidenceBrowser = snapshot?.evidence?.layers?.browser || [];
  const runtimeErrors = snapshot?.base?.runtimeErrors || {};
  const storage = snapshot?.storageSignature || result?.snapshotBefore?.storageSignature || null;
  const frameTiming = snapshot?.frameTiming || {};
  const lines = [
    `viewport: ${viewport.width ?? "?"}×${viewport.height ?? "?"} · DPR ${viewport.devicePixelRatio ?? "?"} · narrow=${viewport.narrowViewport ? "yes" : "no"}`,
    `UA: ${environment.userAgent || "unknown"}`,
    `headlessHint: ${environment.isHeadlessHint ? "yes" : "no"}${environment.headlessReasons?.length ? ` (${environment.headlessReasons.join(", ")})` : ""}`,
    `runtimeErrors(buffer): count=${runtimeErrors.count ?? 0}`,
    `storageSignature.save.hash32: ${storage?.save?.hash32 ?? "n/a"}`,
    `frameTiming: mode=${frameTiming.mode || "n/a"} avg=${frameTiming.avgMs ?? "n/a"}ms max=${frameTiming.maxMs ?? "n/a"}ms`
  ];
  if (evidenceBrowser.length > 0) {
    lines.push("", "evidence.browser:");
    for (const entry of evidenceBrowser) {
      lines.push(formatReleaseCandidateCheckLine(entry));
    }
  }
  lines.push("", "注意：DevTools Console 面板需 PM 手工记录，自动检查不覆盖。");
  region.innerHTML = `<pre class="release-candidate-panel__pre">${escapeReleaseCandidateHtml(lines.join("\n"))}</pre>`;
}

function setReleaseCandidatePanelStatus(message) {
  if (!releaseCandidatePanelEl) return;
  const statusEl = releaseCandidatePanelEl.querySelector('[data-rc-region="status"]');
  if (statusEl) statusEl.textContent = message;
}

function setReleaseCandidatePanelBusy(busy) {
  releaseCandidatePanelBusy = busy;
  if (!releaseCandidatePanelEl) return;
  const refreshBtn = releaseCandidatePanelEl.querySelector('[data-rc-action="refresh"]');
  if (refreshBtn) refreshBtn.disabled = busy;
  releaseCandidatePanelEl.classList.toggle("release-candidate-panel--busy", busy);
}

async function refreshReleaseCandidateAutoChecks() {
  ensureReleaseCandidatePanel();
  if (!releaseCandidatePanelEl || releaseCandidatePanelBusy) return;
  const manualSnapshot = readReleaseCandidateManualStatuses();
  setReleaseCandidatePanelBusy(true);
  setReleaseCandidatePanelStatus("正在运行 runReleaseCandidateChecks…");
  try {
    const result = await runReleaseCandidateChecks({ sampleFrames: RELEASE_FRAME_TIMING_DEFAULT_SAMPLES });
    releaseCandidateLastResult = result;
    renderReleaseCandidateAutomaticSection(result);
    renderReleaseCandidateBrowserSection(result);
    renderReleaseCandidateManualSection(manualSnapshot);
    const coverage = result?.snapshotAfter?.evidence?.coverage;
    const coverageLine = coverage
      ? `automatic ${coverage.automaticPassed}/${coverage.automaticPassed + coverage.automaticFailed + coverage.automaticUnknown} pass · browser covered ${coverage.browserCovered} · manual uncovered ${coverage.manualUncovered}`
      : "";
    setReleaseCandidatePanelStatus(`自动检查完成。${coverageLine}`.trim());
  } catch (error) {
    setReleaseCandidatePanelStatus(`自动检查失败：${error?.message || error}`);
    console.error("[releaseCandidate] runChecks failed", error);
  } finally {
    setReleaseCandidatePanelBusy(false);
  }
}

function buildReleaseCandidateSummaryText() {
  const manualStatuses = readReleaseCandidateManualStatuses();
  const result = releaseCandidateLastResult;
  const snapshot = result?.snapshotAfter || null;
  const viewport = snapshot?.base?.viewport || {};
  const environment = snapshot?.environment || {};
  const lines = [
    "=== v0.14.0 发布候选 Playtest 摘要 ===",
    `capturedAt: ${new Date().toISOString()}`,
    `browser: ${environment.userAgent || "unknown"}`,
    `viewport: ${viewport.width ?? "?"}×${viewport.height ?? "?"} DPR=${viewport.devicePixelRatio ?? "?"}`,
    `automatic.ok: ${result?.ok === true ? "true" : result?.ok === false ? "false" : "n/a"}`,
    ""
  ];
  if (Array.isArray(result?.checks)) {
    lines.push("[自动检查]");
    for (const check of result.checks.filter((entry) => entry.layer !== "manual")) {
      lines.push(formatReleaseCandidateCheckLine(check));
    }
    lines.push("");
  }
  lines.push("[浏览器取证]");
  lines.push(`headlessHint: ${environment.isHeadlessHint ? "yes" : "no"}`);
  lines.push(`runtimeErrors.count: ${snapshot?.base?.runtimeErrors?.count ?? "n/a"}`);
  lines.push(`storage.save.hash32: ${snapshot?.storageSignature?.save?.hash32 ?? "n/a"}`);
  lines.push("console: 需 PM 手工记录 DevTools");
  lines.push("");
  lines.push("[人工结论 — 脚本不自动标记通过]");
  for (const item of PLAYTEST_MANUAL_CHECKLIST_ITEMS) {
    const status = manualStatuses[item.id] || "";
    const statusLabel = PLAYTEST_MANUAL_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || "未完成";
    lines.push(`- ${item.label}: ${statusLabel}`);
  }
  const manualIncomplete = PLAYTEST_MANUAL_CHECKLIST_ITEMS.some((item) => !manualStatuses[item.id]);
  if (manualIncomplete) {
    lines.push("", "结论提示: 存在未完成人工项 → 发布候选证据不足（需真实浏览器人工补证）");
  }
  if (Array.isArray(result?.residualRisks) && result.residualRisks.length > 0) {
    lines.push("", "[残留风险]");
    for (const risk of result.residualRisks) {
      lines.push(`- [${risk.severity}] ${risk.kind}: ${risk.summary}`);
    }
  }
  return lines.join("\n");
}

async function copyReleaseCandidateSummary() {
  const text = buildReleaseCandidateSummaryText();
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Playtest 摘要已复制到剪贴板。");
      return { ok: true, method: "clipboard" };
    } catch {
      // fall through
    }
  }
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (copied) {
        showToast("Playtest 摘要已复制（fallback）。");
        return { ok: true, method: "execCommand" };
      }
    } catch {
      // fall through
    }
  }
  console.log("[releaseCandidate] copy fallback\n", text);
  showToast("复制不可用，摘要已输出到 console。");
  return { ok: false, method: "console" };
}

function openReleaseCandidatePanel() {
  if (typeof document === "undefined") {
    return { ok: false, reason: "no_document" };
  }
  ensureReleaseCandidatePanel();
  if (!releaseCandidatePanelEl) {
    return { ok: false, reason: "panel_create_failed" };
  }
  releaseCandidatePanelEl.classList.remove("hidden");
  syncReleaseCandidateToggleVisibility();
  if (!releaseCandidateLastResult && !releaseCandidatePanelBusy) {
    refreshReleaseCandidateAutoChecks();
  }
  return { ok: true };
}

function closeReleaseCandidatePanel() {
  if (!releaseCandidatePanelEl) {
    return { ok: true };
  }
  releaseCandidatePanelEl.classList.add("hidden");
  syncReleaseCandidateToggleVisibility();
  return { ok: true };
}

function initReleaseCandidatePlaytestEntry() {
  releaseCandidatePlaytestUrlEnabled = isReleaseCandidatePlaytestUrlEnabled();
  if (!releaseCandidatePlaytestUrlEnabled) return;
  ensureReleaseCandidateToggleButton();
  openReleaseCandidatePanel();
}

function handlePlaytestEscapeKeydown() {
  if (isGalaxyMapPanelOpen()) {
    cancelGalaxyJump();
    return { handled: true, action: "cancelGalaxyJump" };
  }
  const activeMain = getActiveMainPanel();
  if (activeMain === "runSettlement") {
    return { handled: false, action: "settlementNoOp" };
  }
  if (activeMain === "meta") {
    toggleMetaPanel(false);
    return { handled: true, action: "closeMeta" };
  }
  if (activeMain === "researchTree") {
    toggleResearchTree(false);
    return { handled: true, action: "closeResearchTree" };
  }
  if (state.run.awaitingObjectiveChoice && isObjectiveComplete() && !state.run.settlementShown) {
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = true;
    updateObjectiveChoiceUi();
    return { handled: true, action: "objectiveStay" };
  }
  return { handled: false, action: "default" };
}

function safeDeepCloneForTest(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // fall through to JSON clone
    }
  }
  return JSON.parse(JSON.stringify(value));
}

window.__gameTest.playtest = {
  getBuildPaletteDiagnostics() {
    return safeDeepCloneForTest(getBuildPaletteDiagnostics());
  },
  getSelectedCellDiagnostics(cellKeyOrXY) {
    const cell = resolveSelectedCellArgForTest(cellKeyOrXY);
    return safeDeepCloneForTest(getSelectedCellDiagnostics(cell));
  },
  getPlacementDiagnostics(facilityOrGrid, gridX, gridY) {
    return safeDeepCloneForTest(resolvePlacementArgsForTest(facilityOrGrid, gridX, gridY));
  },
  getGridScreenPoint(gridKeyOrXY) {
    return safeDeepCloneForTest(buildGridScreenPointDiagnostics(gridKeyOrXY));
  },
  getGridInteractionDiagnostics(gridKeyOrXY, options) {
    return safeDeepCloneForTest(buildGridInteractionDiagnostics(gridKeyOrXY, options || {}));
  },
  getPointerGridDiagnostics(screenPoint) {
    return safeDeepCloneForTest(buildPointerGridDiagnostics(screenPoint));
  },
  compareGridClickAlignment(targetGridKeyOrXY, screenPoint) {
    return safeDeepCloneForTest(buildGridClickAlignmentDiagnostics(targetGridKeyOrXY, screenPoint));
  },
  getStationDesignHealth() {
    return safeDeepCloneForTest(getStationDesignHealth());
  },
  getResourceReachability() {
    return safeDeepCloneForTest(getResourceReachability());
  },
  getMiningCoverageDiagnostics(options) {
    return safeDeepCloneForTest(computeMiningCoverageDiagnostics(options || {}));
  },
  captureMiningExpansionGhostPath() {
    return captureMiningExpansionGhostPathForTest();
  },
  getPowerMargin() {
    return safeDeepCloneForTest(getPowerMargin());
  },
  getThreatSummary() {
    return safeDeepCloneForTest(getThreatSummary());
  },
  getWeaponEffectiveness() {
    return safeDeepCloneForTest(getWeaponEffectiveness());
  },
  getRecentDamageSummary() {
    return safeDeepCloneForTest(getRecentDamageSummary());
  },
  getRepairStatusSummary() {
    return safeDeepCloneForTest(getRepairStatusSummary());
  },
  getCombatReview() {
    return safeDeepCloneForTest(getCombatReview());
  },
  snapshot() {
    const activeMainPanel = getActiveMainPanel();
    const objectiveChoiceOpen = !document.getElementById("objectiveChoicePanel")?.classList.contains("hidden");
    const panels = {
      activeMainPanel,
      focusPanel: activeMainPanel,
      metaOpen: isMetaPanelOpen(),
      galaxyMapOpen: isGalaxyMapPanelOpen(),
      runSettlementOpen: isRunSettlementPanelOpen(),
      objectiveChoiceOpen,
      researchTreeOpen: !!state.hud?.researchTreeOpen,
      overlapCount: countSimultaneouslyOpenMainPanels()
    };
    panels.openPanels = listOpenPanelsForSnapshot(panels);
    const health = getStationDesignHealth();
    const reachability = getResourceReachability();
    const power = getPowerMargin();
    const threat = getThreatSummary();
    const weapon = getWeaponEffectiveness();
    const damage = getRecentDamageSummary();
    const repair = getRepairStatusSummary();
    const review = getCombatReview();

    return {
      version: "v0.11.0-playtest-readiness",
      capturedAt: Date.now(),
      panels,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        narrowViewport: window.matchMedia("(max-width: 760px)").matches
      },
      keyDom: {
        game: snapshotDomNodeState("game"),
        hud: snapshotDomNodeState("hud"),
        metaPanel: snapshotDomNodeState("metaPanel"),
        galaxyMapPanel: snapshotDomNodeState("galaxyMapPanel"),
        runSettlementPanel: snapshotDomNodeState("runSettlementPanel"),
        objectiveChoicePanel: snapshotDomNodeState("objectiveChoicePanel"),
        currentGoal: snapshotDomNodeState("currentGoal"),
        nextStep: snapshotDomNodeState("nextStep"),
        metaPanelToggle: snapshotDomNodeState("metaPanelToggle"),
        objectiveJumpBtn: snapshotDomNodeState("objectiveJumpBtn"),
        summaryRestartBtn: snapshotDomNodeState("summaryRestartBtn")
      },
      metaStorage: {
        saveKey: SAVE_KEY,
        hasSave: hasStorageEntry(localStorage, SAVE_KEY),
        summary: summarizeMetaStorageForPlaytestSnapshot()
      },
      resource: summarizeResourceForPlaytestSnapshot(),
      design: {
        health: safeDeepCloneForTest(health),
        resource: safeDeepCloneForTest(reachability),
        reachability: safeDeepCloneForTest(reachability),
        power: safeDeepCloneForTest(power),
        criticalIssues: safeDeepCloneForTest(health?.criticalIssues || [])
      },
      objective: summarizeObjectiveForPlaytestSnapshot(),
      guide: summarizeGuideForPlaytestSnapshot(),
      selfChecks: getPlaytestSelfCheckStateSnapshot(),
      runtimeErrors: {
        count: playtestRuntimeErrorBuffer.length,
        latest: getPlaytestRuntimeErrors()
      },
      objectiveChoice: {
        awaiting: !!state.run.awaitingObjectiveChoice,
        dismissed: !!state.run.objectiveChoiceDismissed,
        complete: isObjectiveComplete()
      },
      combat: {
        threat: safeDeepCloneForTest(threat),
        weapon: safeDeepCloneForTest(weapon),
        damage: safeDeepCloneForTest(damage),
        repair: safeDeepCloneForTest(repair),
        review: safeDeepCloneForTest(review)
      }
    };
  },
  getReleaseReadinessSnapshot() {
    return getReleaseReadinessSnapshot();
  },
  async runReleaseCandidateChecks(options = {}) {
    return runReleaseCandidateChecks(options);
  },
  releaseCandidate: {
    getSnapshot() {
      return getReleaseReadinessSnapshot();
    },
    getReleaseReadinessSnapshot() {
      return getReleaseReadinessSnapshot();
    },
    async runChecks(options = {}) {
      return runReleaseCandidateChecks(options);
    },
    async runReleaseCandidateChecks(options = {}) {
      return runReleaseCandidateChecks(options);
    },
    openPanel() {
      return openReleaseCandidatePanel();
    },
    closePanel() {
      return closeReleaseCandidatePanel();
    },
    isPanelOpen() {
      return isReleaseCandidatePanelOpen();
    }
  },
  runAllSelfChecks() {
    return runAllPlaytestSelfChecks();
  },
  getRuntimeErrors(limit = PLAYTEST_RUNTIME_ERROR_DEFAULT_LIMIT) {
    return getPlaytestRuntimeErrors(limit);
  },
  clearRuntimeErrors() {
    return clearPlaytestRuntimeErrors();
  },
  describeOpenPanels() {
    const snap = this.snapshot();
    return {
      activeMainPanel: snap.panels.activeMainPanel,
      focusPanel: snap.panels.focusPanel,
      openPanels: [...snap.panels.openPanels],
      overlapCount: snap.panels.overlapCount
    };
  },
  panelSnapshot() {
    return this.snapshot().panels;
  },
  simulateOpenCloseSequence(steps) {
    const sequence = Array.isArray(steps) ? steps : ["meta", "galaxy", "settlementReset"];
    const trace = [];
    for (const step of sequence) {
      if (step === "meta") {
        toggleMetaPanel(true);
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "metaClose") {
        toggleMetaPanel(false);
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "galaxy") {
        const choices = window.__gameTest.generateGalaxyChoices(levelIndex(state.run.level + 1));
        openGalaxyMapPanel(choices);
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "galaxyCancel") {
        cancelGalaxyJump();
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "settlement") {
        state.run.totalObjectiveRewardBase = Math.max(4, state.run.totalObjectiveRewardBase || 0);
        state.run.settlementBonusGranted = false;
        endRunSettlement();
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "settlementReset") {
        runSettlementPanelEl?.classList.add("hidden");
        state.run.settlementShown = false;
        syncMainPanelUiState();
        trace.push({ step, ...this.panelSnapshot() });
      } else if (step === "research") {
        toggleResearchTree(true);
        trace.push({ step, ...this.panelSnapshot() });
      }
    }
    return {
      ok: trace.every((entry) => entry.overlapCount <= 1),
      trace
    };
  },
  simulateEscapeSequence() {
    const trace = [];
    const push = (label) => trace.push({ label, ...this.panelSnapshot(), ...handlePlaytestEscapeKeydown() });
    push("escape1");
    push("escape2");
    push("escape3");
    return { trace };
  },
  runPanelMutualExclusionSelfCheck() {
    return runPanelMutualExclusionSelfCheck();
  },
  runEscapeSequenceSelfCheck() {
    return runEscapeSequenceSelfCheck();
  },
  handleEscapeKeydown() {
    return handlePlaytestEscapeKeydown();
  },
  getActiveMainPanel() {
    return getActiveMainPanel();
  },
  countOverlap() {
    return countSimultaneouslyOpenMainPanels();
  }
};

function runMetaS2RegressionSelfCheck() {
  ensureGameplayTestBaseline();
  ensureGalaxyMapPanelDomForTest();
  const checks = [];

  const runCase = (name, fn) => {
    let ok = false;
    let detail = null;
    try {
      const result = fn();
      ok = !!result?.ok;
      detail = result;
    } catch (error) {
      detail = { error: error.message };
    }
    checks.push({ name, ok, detail });
    return ok;
  };

  runCase("corruptMetaFallbackStoresRaw", () => {
    const saveBackup = localStorage.getItem(SAVE_KEY);
    const captureBackup = sessionStorage.getItem(META_CORRUPT_RAW_KEY);
    try {
      localStorage.setItem(SAVE_KEY, "{\"points\":1");
      const loaded = loadMeta();
      const rawCapture = sessionStorage.getItem(META_CORRUPT_RAW_KEY);
      const capture = rawCapture ? JSON.parse(rawCapture) : null;
      const fallbackOk = normalizeMetaPoints(loaded?.points) === 0;
      const captureOk = Boolean(capture?.raw && capture.raw.includes("{\"points\":1"));
      return {
        ok: fallbackOk && captureOk,
        fallbackPoints: loaded?.points,
        capture
      };
    } finally {
      if (saveBackup == null) localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, saveBackup);
      if (captureBackup == null) sessionStorage.removeItem(META_CORRUPT_RAW_KEY);
      else sessionStorage.setItem(META_CORRUPT_RAW_KEY, captureBackup);
      state.meta = loadMeta();
    }
  });

  runCase("mixedMetaMigrationMergesLegacyFields", () => {
    const migrated = migrateMetaSave({
      schemaVersion: META_SCHEMA_VERSION,
      migrationVersion: META_SCHEMA_VERSION,
      points: 9,
      talents: {
        miningYield: 1,
        hullIntegrity: 1,
        weaponCalibration: 1,
        weaponEfficiency: 1
      },
      mining: 3,
      hull: 2,
      weapons: 2,
      unlocks: {
        weaponFrame: true,
        efficientCore: true
      }
    });
    const ok = migrated.points === 9
      && migrated.talents.miningYield >= 3
      && migrated.talents.hullIntegrity >= 2
      && migrated.talents.weaponCalibration >= 2
      && migrated.talents.weaponEfficiency === 1
      && migrated.talents.weaponFrame >= 1
      && migrated.talents.efficientCore >= 1;
    return { ok, migrated };
  });

  runCase("gameOverShowsFailureSettlementPanel", () => {
    window.__gameTest.resetRun(1201, 2, "tradeHub");
    state.run.metaPointsGainedThisRun = 6;
    state.meta.points = 14;
    gameOver();
    const title = runSettlementPanelEl?.querySelector(".objective-choice-title")?.textContent || "";
    const hint = runSettlementPanelEl?.querySelector(".objective-choice-hint")?.textContent || "";
    const feedbackText = `${runSettlementMetaFeedbackEl?.textContent || ""}\n${runSettlementMetaFeedbackEl?.innerHTML || ""}`;
    const restartText = document.getElementById("summaryRestartBtn")?.textContent || "";
    const stayHidden = document.getElementById("summaryStayBtn")?.classList.contains("hidden") ?? false;
    const panelVisible = Boolean(runSettlementPanelEl && !runSettlementPanelEl.classList.contains("hidden"));
    const hasRequiredFeedback = feedbackText.includes("本局获得局外天赋点")
      && feedbackText.includes("当前可用局外天赋点")
      && feedbackText.includes("可购买建议")
      && feedbackText.includes("下一局协议建议");
    const result = {
      ok: panelVisible
        && hasRequiredFeedback
        && stayHidden
        && restartText.includes("重新开始")
        && title.includes("失败")
        && hint.includes("核心")
        && state.run.settlementMode === "failure"
        && state.paused,
      panelVisible,
      title,
      hint,
      restartText,
      stayHidden
    };
    runSettlementPanelEl?.classList.add("hidden");
    state.run.settlementShown = false;
    state.run.settlementMode = "victory";
    state.paused = false;
    document.getElementById("pauseBtn").textContent = "暂停";
    return result;
  });

  runCase("galaxyForesightAddsHintsWithoutRngChange", () => {
    window.__gameTest.resetRun(2202, 2, "tradeHub");
    state.meta = ensureMetaState(state.meta);
    state.meta.talents.galaxyForesight = 0;
    const effectWithout = getMetaEffect("galaxyForesight") === true;
    const choicesWithout = window.__gameTest.generateGalaxyChoices(3);
    renderGalaxyMapCards(choicesWithout);
    const cardsEl = document.getElementById("galaxyMapPanel")?.querySelector(".galaxy-map-cards");
    const cardsHtmlWithout = cardsEl?.innerHTML || "";
    const hintCountWithout = (cardsHtmlWithout.match(/galaxy-map-foresight/g) || []).length;

    state.meta.talents.galaxyForesight = 1;
    const effectWith = getMetaEffect("galaxyForesight") === true;
    const choicesWith = window.__gameTest.generateGalaxyChoices(3);
    renderGalaxyMapCards(choicesWith);
    const cardsHtmlWith = cardsEl?.innerHTML || "";
    const hintCountWith = (cardsHtmlWith.match(/galaxy-map-foresight/g) || []).length;
    const sameChoices = JSON.stringify(choicesWithout) === JSON.stringify(choicesWith);
    const hintTitleOk = cardsHtmlWith.includes("星图洞察");
    return {
      ok: sameChoices
        && !effectWithout
        && effectWith
        && hintCountWithout === 0
        && hintCountWith > 0
        && hintTitleOk,
      sameChoices,
      effectWithout,
      effectWith,
      hintCountWithout,
      hintCountWith,
      hintTitleOk,
      choicesWithout,
      choicesWith
    };
  });

  runCase("resetRunDoesNotOverwriteStoredMetaPoints", () => {
    const saveBackup = localStorage.getItem(SAVE_KEY);
    const rawMeta = {
      schemaVersion: META_SCHEMA_VERSION,
      migrationVersion: META_SCHEMA_VERSION,
      points: 37,
      talents: {}
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(rawMeta));
      state.meta = loadMeta();
      window.__gameTest.resetRun(3303, 0, "emptyVoid");
      const persistedRaw = localStorage.getItem(SAVE_KEY);
      const persisted = persistedRaw ? JSON.parse(persistedRaw) : {};
      return {
        ok: normalizeMetaPoints(persisted.points) === 37 && normalizeMetaPoints(state.meta.points) === 37,
        persistedPoints: persisted.points,
        runtimePoints: state.meta.points
      };
    } finally {
      if (saveBackup == null) localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, saveBackup);
      state.meta = loadMeta();
    }
  });

  runCase("v05AndV09BoundariesNotPolluted", () => {
    const protocolCheck = runStartProtocolApplicationSelfCheck();
    const galaxyCheck = runGalaxyJumpStateMachineSelfCheck();
    return {
      ok: protocolCheck.ok && galaxyCheck.ok,
      protocolCheck,
      galaxyCheck
    };
  });

  return { ok: checks.every((entry) => entry.ok), checks };
}

window.__gameTest.performTraderTrade = function performTraderTradeForTest(encounterRef, optionIndex = 1) {
  const enc = typeof encounterRef === "object"
    ? encounterRef
    : (state.run.encounters || []).find((entry) => entry.id === encounterRef);
  if (!enc) return false;
  return performTraderTrade(enc, optionIndex);
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
