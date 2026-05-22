"use strict";

const canvas = document.getElementById("game");
const resourcesEl = document.getElementById("resources");
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
const selectedCellPanelEl = document.getElementById("selectedCellPanel");
const selectedCellInfoEl = document.getElementById("selectedCellInfo");
const metaStatsEl = document.getElementById("metaStats");
const toastEl = document.getElementById("toast");
const runSettlementPanelEl = document.getElementById("runSettlementPanel");
const runSettlementStatsEl = document.getElementById("runSettlementStats");
const quickRestartBtnEl = document.getElementById("quickRestartBtn");

const CELL = 30;
const SAVE_KEY = "star-ring-station-meta-v1";
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
    status: "",
    selected: "",
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
    endgame: false,
    guardianSpawned: false,
    guardianDefeated: false,
    guardianSpawnDelay: 0,
    endgameExplore: false,
    endgameActivityFraction: 0,
    endgameActivityPoints: 0,
    escortLowHpAlerted: false
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
    controlMode: "screen"
  },
  lastBuildError: "",
  buildHint: "",
  bridgePreview: null,
  particles: [],
  fireCooldown: 0,
  spawnTimer: LEVEL0_INITIAL_SPAWN_TIMER
};

let fragmentIdSeed = 1;
let npcIdSeed = 1;

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

function generateGalaxy(level, seed) {
  const currentLevel = levelIndex(level);
  const config = GALAXY_LEVEL_CONFIG[currentLevel];
  const rng = createSeededRng(seed);
  const galaxyType = config.preferredType || pickGalaxyType(currentLevel, rng);
  const weights = GALAXY_RESOURCE_WEIGHTS[galaxyType] || GALAXY_RESOURCE_WEIGHTS.balance;
  const palette = GALAXY_PALETTES[config.paletteKey] || GALAXY_PALETTES.sun;

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
  const asteroidCount = rngInt(rng, config.asteroidMin, config.asteroidMax);

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
      color: getBodyColorByResource(resource, rng),
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
      color: getBodyColorByResource(resource, rng),
      resource,
      amount: computeBodyAmount("asteroid", currentLevel, rng)
    });
  }

  return {
    level: currentLevel,
    type: galaxyType,
    seed: hashSeed(seed),
    paletteKey: config.paletteKey,
    palette,
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
  const metaFactor = 1 + (state.meta?.hull || 0) * 0.1;
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
  researchTreePanelEl.querySelector(".research-tree-close").addEventListener("click", () => toggleResearchTree(false));
  researchTreePanelEl.querySelector(".research-tree-backdrop").addEventListener("click", () => toggleResearchTree(false));
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

function toggleResearchTree(open) {
  ensureResearchTreeUi();
  state.hud.researchTreeOpen = open;
  if (open) renderResearchTreePanel();
  researchTreePanelEl.classList.toggle("hidden", !open);
}

function createCell(x, y, facility) {
  const def = TYPES[facility] || TYPES.frame;
  const metaFactor = 1 + state.meta.hull * 0.1;
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
  core.baseMaxHp = 280 * (1 + state.meta.hull * 0.1);
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

function buildCompletedObjectiveGuide() {
  if (state.run.endgame && state.run.guardianDefeated) {
    if (state.run.settlementShown) {
      return {
        goal: "终局结算已完成",
        next: "在结算面板选择「开始新局」或「留在终结星系自由游玩」。"
      };
    }
    if (state.run.endgameExplore) {
      return {
        goal: "终结星系自由游玩中",
        next: "可继续战斗和采集累积局外点数，右侧「再次开始新局」可随时重开。"
      };
    }
  }
  if (state.run.awaitingObjectiveChoice) {
    return {
      goal: "星系任务已完成",
      next: "在「星系任务」下方选择「跃迁下一星系」或「暂时停留」。"
    };
  }
  return {
    goal: "任务已完成，可随时跃迁",
    next: "在「星系任务」面板点「跃迁下一星系」；也可继续采集、扩建或战斗。"
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
  fragmentDocked: "onFragmentDocked",
  npcArrived: "onNpcArrived",
  npcDestroyed: "onNpcDestroyed"
};

const OBJECTIVE_LEVEL_WEIGHTS = [
  { mine: 0.5, explore: 0.5 },
  { mine: 0.4, explore: 0.35, salvage: 0.25 },
  { mine: 0.3, explore: 0.3, battle: 0.2, salvage: 0.2 },
  { battle: 0.3, survive: 0.2, salvage: 0.25, escort: 0.25 },
  { battle: 0.3, survive: 0.2, salvage: 0.25, escort: 0.25 },
  { battle: 0.4, survive: 0.3, escort: 0.3 }
];

const OBJECTIVE_TYPE_DEFAULTS = {
  tick: null,
  onMined: null,
  onEnemyKilled: null,
  onGuardianKilled: null,
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
  const weightTable = OBJECTIVE_LEVEL_WEIGHTS[level] || OBJECTIVE_LEVEL_WEIGHTS[OBJECTIVE_LEVEL_WEIGHTS.length - 1];
  const type = pickWeighted(objectiveRng, weightTable);
  const objectiveType = OBJECTIVE_TYPES[type] || OBJECTIVE_TYPES.mine;
  state.run.objective = objectiveType.make(objectiveRng, level, state.galaxy);
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
  const rewardMultiplier = OBJECTIVE_TYPES[state.run.objective?.type]?.rewardMultiplier ?? 1.0;
  const base = 2 + state.run.level;
  const gained = Math.floor(base * rewardMultiplier);
  state.run.totalObjectiveRewardBase += base;
  state.meta.points += gained;
  saveMeta();
  const objectiveType = OBJECTIVE_TYPES[state.run.objective?.type];
  if (objectiveType && objectiveType.researchReward) {
    const level = state.run.level || 0;
    const researchGain = Math.floor(objectiveType.researchReward * (1 + level * 0.1));
    state.resources.research = (state.resources.research || 0) + researchGain;
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

function updateRunSettlementPanel() {
  if (!runSettlementPanelEl) return;
  const { base, bonus, total } = getRunSettlementData();
  if (runSettlementStatsEl) {
    runSettlementStatsEl.innerHTML = [
      `<div>完成关卡数：<strong>${state.run.completedObjectives}</strong> / ${TOTAL_RUN_LEVELS}</div>`,
      `<div>累计基础奖励：<strong>${base}</strong> 点</div>`,
      `<div>终局加成：<strong>+${bonus}</strong>（+50%）</div>`,
      `<div>总点数：<strong>${total}</strong> 点</div>`
    ].join("");
  }
}

function updateQuickRestartVisibility() {
  if (!quickRestartBtnEl) return;
  quickRestartBtnEl.classList.toggle("hidden", !state.run.guardianDefeated);
}

function endRunSettlement() {
  const { bonus } = getRunSettlementData();
  if (!state.run.settlementBonusGranted) {
    state.meta.points += bonus;
    state.run.settlementBonus = bonus;
    state.run.settlementBonusGranted = true;
    saveMeta();
  }
  resetObjectiveChoiceState();
  state.run.settlementShown = true;
  updateRunSettlementPanel();
  runSettlementPanelEl?.classList.remove("hidden");
  updateQuickRestartVisibility();
  state.paused = true;
  document.getElementById("pauseBtn").textContent = "继续";
  updateHud();
}

function closeSettlementForExplore() {
  state.run.settlementShown = false;
  state.run.endgameExplore = true;
  runSettlementPanelEl?.classList.add("hidden");
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
  initStation();
  initWorld();
  createObjective();
  createBuildUi();
  ensureResearchTreeUi();
  bindInput();
  syncMoreStatusPanel();
  window.addEventListener("resize", syncMoreStatusPanel);
  updateControlModeUi();
  updateHud();
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
    gl.clearColor(0.012, 0.022, 0.048, 1);
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
  document.getElementById("talentMiningBtn").addEventListener("click", () => window.gameActions.buyTalent("mining"));
  document.getElementById("talentHullBtn").addEventListener("click", () => window.gameActions.buyTalent("hull"));
  document.getElementById("talentWeaponsBtn").addEventListener("click", () => window.gameActions.buyTalent("weapons"));
  document.getElementById("unlockCoreBtn").addEventListener("click", () => window.gameActions.buyUnlock("efficientCore"));
  document.getElementById("unlockWeaponFrameBtn").addEventListener("click", () => window.gameActions.buyUnlock("weaponFrame"));
  document.getElementById("playersBtn").addEventListener("click", () => window.gameActions.setPlayers());
  document.getElementById("objectiveJumpBtn").addEventListener("click", () => window.gameActions.jumpToNextGalaxy());
  document.getElementById("objectiveStayBtn").addEventListener("click", () => window.gameActions.stayInCurrentGalaxy());
  document.getElementById("objectiveJumpDeferredBtn").addEventListener("click", () => window.gameActions.jumpToNextGalaxy());
  document.getElementById("summaryRestartBtn")?.addEventListener("click", () => window.gameActions.startNewRun());
  document.getElementById("summaryStayBtn")?.addEventListener("click", () => window.gameActions.stayInEndgame());
  quickRestartBtnEl?.addEventListener("click", () => window.gameActions.startNewRun());
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
  state.meta.points += gained;
  saveMeta();
}

function enemyActivityPointReward(kind) {
  return ENDGAME_ACTIVITY_POINTS.enemy[kind] || 0;
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
  return state.fragments.filter((fragment) => fragment.origin !== "wreck").length;
}

function countWreckFragments() {
  return state.fragments.filter((fragment) => fragment.origin === "wreck").length;
}

function pickWreckFacility(rng) {
  let total = 0;
  for (const [, weight] of WRECK_FACILITY_WEIGHTS) total += weight;
  let roll = rng() * total;
  for (const [facility, weight] of WRECK_FACILITY_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return facility;
  }
  return WRECK_FACILITY_WEIGHTS[0][0];
}

function buildWreckShape(rng) {
  const cellCount = rngInt(rng, 2, 5);
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
  cell.frameHp = TYPES.frame.baseStats.maxFrameHp * (1 + state.meta.hull * 0.1) * rngFloat(rng, 0.8, 1.0);
  cell.reload = 0;
  cell.fire = 0;
  cell.enabled = true;
  cell.active = facility === "armor";
  return cell;
}

function makeWreckFragment(pos, rng) {
  const shape = buildWreckShape(rng);
  const cells = new Map();
  for (const slot of shape) {
    const facility = pickWreckFacility(rng);
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
    origin: "wreck"
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
  npc.hp -= amount;
  for (let i = 0; i < 3; i++) spawnParticle(npc, [0.5, 0.9, 1.0, 0.9]);
  if (npc.hp <= 0) {
    npc.hp = 0;
    npc.destroyed = true;
    notifyObjective("npcDestroyed", npc);
    state.npcs = state.npcs.filter((entry) => entry.id !== npc.id);
  }
}

function tickNpc(npc, dt) {
  if (npc.arrived || npc.destroyed) return;
  const toTarget = { x: npc.target.x - npc.pos.x, y: npc.target.y - npc.pos.y };
  const remain = length(toTarget);
  if (remain <= NPC_ARRIVE_RADIUS) {
    npc.arrived = true;
    npc.vel.x = 0;
    npc.vel.y = 0;
    notifyObjective("npcArrived", npc);
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

function buildNpcHudAlerts() {
  const objective = state.run.objective;
  if (!objective || objective.type !== "escort" || isObjectiveComplete()) return [];
  if (objective.failed) {
    return [{ level: "danger", cssClass: "alert-escort-fail", text: "护送失败 · 本关无法跃迁" }];
  }
  const npc = state.npcs.find((entry) => entry.id === objective.npcId);
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
  const discount = state.meta.unlocks.weaponFrame && WEAPON_TYPES.has(facility) ? 0.8 : 1;
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
    origin: nearest.fragment.origin === "wreck" ? "wreck" : "player",
    playerCount: countPlayerFragments(),
    wreckCount: countWreckFragments()
  };
  state.run.fragmentHudCache = { sampledAt: state.time, data };
  return data;
}

function buildFragmentHudAlerts() {
  if (!state.fragments.length) return [];
  const alerts = [];
  const playerCount = countPlayerFragments();
  const wreckCount = countWreckFragments();
  if (playerCount >= FRAGMENT_HUD_WARN_COUNT) {
    alerts.push({
      level: "danger",
      cssClass: "alert-fragment-warn",
      text: "脱落较多，及时回收"
    });
  }
  const hud = getNearestFragmentHudData();
  if (!hud) return alerts;
  const originLabel = hud.origin === "wreck" ? "古老残骸" : "我方残骸";
  let text = `最近${originLabel} ${hud.direction} · ${hud.distanceRounded} px · ${hud.facilityCount} 设施`;
  if (wreckCount > 0 && playerCount > 0) {
    text = `古老残骸 ${wreckCount} 段 · 我方 ${playerCount} 段 · ${text}`;
  } else if (wreckCount > 1) {
    text = `古老残骸 ×${wreckCount} · ${text}`;
  } else if (playerCount > 1) {
    text = `我方残骸 ×${playerCount} · ${text}`;
  }
  alerts.push({
    level: hud.origin === "wreck" ? "good" : playerCount >= FRAGMENT_HUD_WARN_COUNT ? "warn" : "good",
    cssClass: hud.origin === "wreck" ? "alert-wreck" : "alert-fragment",
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

function damageFragmentCell(fragment, cell, damage) {
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

// v0.6.0 hostile-station T1：cells 工厂、命中、死亡判定（数据结构复用 fragment.cells；T2/T3 实现 AI / 武器 / 死亡 wreck）
function createHostileStationCells(level) {
  const scale = level === 4 ? 1.47 : level === 5 ? 2.0 : 1.0;
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
    cell.active = true;
    cell.enabled = true;
    cell.detached = false;
    cells.set(entry.key, cell);
  }
  return cells;
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
    // T1：不立刻 delete cell（保留位置便于渲染破损 + 后续 T3 wreck 爆出按位置散布）
    if (cell.facility === "core") {
      // core 破坏即死：让 updateEnemies filter 走死亡分支（T1 不爆 wreck，T3 实现）
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
  return damageHostileStationCell(projectile, hostileStation, closestKey);
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
  updateCamera(dt);
  trackResearchGrowth(prevResearch);
}

function updatePowerAndFacilities(dt) {
  state.resources.metal += (0.85 + (state.meta.unlocks.efficientCore ? 0.35 : 0)) * dt;
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
    const thrust = getCellStat(cell, "thrust") * (1 + state.meta.weapons * 0.03);
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
  const miningBonus = 1 + state.meta.mining * 0.12;
  for (const cell of state.station.cells.values()) {
    if (cell.detached || !cell.active) continue;
    if (cell.facility === "mining") {
      const p = cellWorldPosition(cell);
      const body = state.world.bodies.find((b) => b.amount > 0 && dist(p, b) < b.r + MINING_RANGE_OFFSET);
      if (body) {
        const amount = Math.min(body.amount, getCellStat(cell, "mineRate") * miningBonus * dt);
        body.amount -= amount;
        state.resources[body.resource] = (state.resources[body.resource] || 0) + amount;
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
  let timer = getSpawnTimerByLevel(getSpawnDifficultyLevel());
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
  return enemy.kind === "station" || enemy.kind === "guardian";
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
    // v0.6.0 T1：仅给基础 enemy 字段；cells 子结构在 spawnEnemy 内补全
    const effectiveLevel = level === 4 ? 4 : level === 5 ? 5 : 3;
    const scale = effectiveLevel === 4 ? 1.47 : effectiveLevel === 5 ? 2.0 : 1.0;
    return {
      hp: Math.floor(1500 * scale),
      r: 90,
      accel: 4,
      drag: 0.5,
      range: effectiveLevel === 3 ? 480 : effectiveLevel === 4 ? 515 : 550,
      reward: 0,
      spin: 0,
      angularVel: 0.15 + Math.random() * 0.05,
      projectileDamage: effectiveLevel === 3 ? 12 : effectiveLevel === 4 ? 14 : 15,
      reloadTime: 1.6,
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

// v0.6.0 hostile-station 远距生成（仿 spawnGuardianNearStation；T1 阶段仅供 __gameTest 手动调用）
function spawnHostileStationNearStation(rng, level) {
  const r = typeof rng === "function" ? rng : Math.random;
  const angle = r() * Math.PI * 2;
  const radius = 1000 + r() * 300;
  const x = state.station.pos.x + Math.cos(angle) * radius;
  const y = state.station.pos.y + Math.sin(angle) * radius;
  const useLevel = Number.isFinite(level) ? level : (state.run.level || 3);
  return spawnEnemy("hostile-station", x, y, { level: useLevel });
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

    // v0.6.0 T1 hostile-station：缓慢自转 + 聚合 hp（AI / 武器 / 召唤 minion 留 T2 实现）
    if (enemy.kind === "hostile-station") {
      if (Number.isFinite(enemy.angularVel)) {
        enemy.angle += enemy.angularVel * dt;
      }
      if (enemy.hp > 0) {
        enemy.hp = sumCellsHp(enemy.cells);
      }
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
      fireProjectile({ x: enemy.x, y: enemy.y }, dir, "enemy", enemy.projectileDamage || 10, 250);
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
    state.resources.metal += enemy.reward;
    state.resources.gas += enemy.reward * 0.15;
    awardEndgameActivityPoints(enemyActivityPointReward(enemy.kind));
    if (enemy.kind === "guardian") {
      state.run.guardianDefeated = true;
      state.run.guardianSpawned = true;
      state.run.endgame = true;
      triggerGuardianDeathEffect(enemy);
      notifyObjective("guardianKilled", enemy);
    } else if (enemy.kind === "hostile-station") {
      // v0.6.0 T1：core HP=0 即移除；wreck 爆出 / 震屏 / hostileStationKilled 事件留 T3 阶段
      if (!enemy._deathHandled) {
        enemy._deathHandled = true;
        for (let i = 0; i < 18; i++) spawnParticle(enemy, [1, 0.32, 0.18, 1]);
      }
    } else {
      notifyObjective("enemyKilled", enemy);
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
    ...data
  };
  if (kind === "hostile-station") {
    // v0.6.0 T1：cells 子结构 + 聚合 hp / maxHp（T2 实现 AI 与武器、T3 实现死亡 wreck）
    enemy.cells = createHostileStationCells(spawnLevel);
    enemy.coreCellKey = HOSTILE_STATION_CORE_KEY;
    enemy.weaponCellKeys = [];
    enemy.cells.forEach((cell, cellKey) => {
      if (cell.facility === "turret") enemy.weaponCellKeys.push(cellKey);
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
  }
  state.enemies.push(enemy);
  return enemy;
}

function updateTurret(cell, dt) {
  if (cell.reload > 0) return;
  const origin = cellWorldPosition(cell);
  const enemy = nearestEnemy(origin, getCellStat(cell, "range"));
  if (!enemy || !hasLineOfSight(origin, enemy)) return;
  const dir = normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  cell.reload = getCellStat(cell, "reload");
  fireProjectile(
    origin,
    dir,
    "player",
    getCellStat(cell, "damage") * (1 + state.meta.weapons * 0.1),
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
      for (let i = 0; i < 5; i++) spawnParticle(projectile, [0.35, 1, 0.94, 1]);
    }
  }
}

function fireMissiles() {
  let fired = 0;
  for (const cell of state.station.cells.values()) {
    if (cell.facility !== "missile" || !cell.active || cell.reload > 0 || cell.detached) continue;
    const enemy = nearestEnemy(cellWorldPosition(cell), getCellStat(cell, "range"));
    if (!enemy) continue;
    const gasCost = TYPES.missile.baseStats.gasCost;
    const metalCost = TYPES.missile.baseStats.metalCost;
    if (state.resources.gas < gasCost || state.resources.metal < metalCost) {
      showToast("导弹装填资源不足，需要气体和金属。");
      return;
    }
    state.resources.gas -= gasCost;
    state.resources.metal -= metalCost;
    const origin = cellWorldPosition(cell);
    const projectileCount = Math.max(1, Math.floor(getCellStat(cell, "projectileCount")));
    const projectileSpeed = getCellStat(cell, "projectileSpeed");
    const baseProjectileSpeed = TYPES.missile.baseStats.projectileSpeed;
    const projectileAccel = TYPES.missile.baseStats.projectileAccel * (projectileSpeed / baseProjectileSpeed);
    const launchJitter = TYPES.missile.baseStats.launchJitter;
    const damage = getCellStat(cell, "damage") * (1 + state.meta.weapons * 0.12);
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
      const hit = getCellAtWorld(projectile);
      if (hit && !hit.detached) {
        damageCell(hit, projectile.damage);
        projectile.dead = true;
      } else if (!projectile.dead) {
        const fragHit = getFragmentCellAtWorld(projectile);
        if (fragHit) {
          damageFragmentCell(fragHit.fragment, fragHit.cell, projectile.damage);
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
        // v0.6.0 hostile-station：cell 粒度命中（不走 enemy.r 整体球；命中后 enemy.hp 通过聚合更新）
        if (enemy.kind === "hostile-station") {
          if (dist(projectile, enemy) < enemy.r + projectile.r + CELL * 0.6) {
            if (tryDamageHostileStationCell(projectile, enemy)) {
              projectile.dead = true;
              break;
            }
          }
          continue;
        }
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
      damageCell(cell, getCollisionDamage(enemy));
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
        target.hp = Math.min(target.maxHp, target.hp + repairRate);
        target.frameHp = Math.min(
          TYPES.frame.baseStats.maxFrameHp * (1 + state.meta.hull * 0.1),
          target.frameHp + frameRepairRate
        );
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
}

function nextLevel() {
  ensureRunRuntimeState();
  if (state.run.level >= ENDGAME_LEVEL) {
    showToast("终末星系已就绪，无法继续跃迁；请完成守护者结算或直接开始新局。");
    return;
  }
  state.run.level = levelIndex(state.run.level + 1);
  state.run.endgame = state.run.level >= ENDGAME_LEVEL;
  state.run.guardianSpawned = false;
  state.run.guardianDefeated = false;
  state.run.guardianSpawnDelay = state.run.endgame ? 6 : 0;
  state.run.endgameExplore = false;
  state.run.spawnFractional = 0;
  state.run.settlementShown = false;
  runSettlementPanelEl?.classList.add("hidden");
  updateQuickRestartVisibility();

  const galaxy = generateGalaxy(state.run.level, `${state.run.seed}:${state.run.level}`);
  applyGalaxy(galaxy);

  state.fragments = [];
  state.npcs = [];
  state.enemies = [];
  state.projectiles = [];
  state.repairDrones = [];
  state.particles = [];
  createObjective();

  state.resources.metal += 55;
  state.resources.ore += 25;
  state.resources.gas += 18;
  state.spawnTimer = getLevelTransitionBuffer(state.run.level);

  if (state.run.endgame) {
    showToast("跃迁完成：已进入终末星系。摧毁守护者即可完成本局结算。");
  } else {
    showToast("跃迁到下一星系。可以继续扩建或停留战斗。");
  }
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
  renderStation();
  renderBridgePreview();
  renderMiningEffects();
  renderEnemies();
  renderProjectilesAndEffects();
  renderer.flush();
}

function renderBackground() {
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
  const isWreck = fragment.origin === "wreck";
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
  updateBridgePreviewState();
  const preview = state.bridgePreview;
  if (!preview?.worldP) return;
  const ringColor = preview.tier === "ready" ? BRIDGE_PREVIEW_RING_READY : BRIDGE_PREVIEW_RING_NEAR;
  renderer.ring(preview.worldP, CELL * 0.55, 3.5, ringColor, 28);
}

function renderFragments() {
  const highlightId = state.bridgePreview?.tier === "ready" ? state.bridgePreview.fragment?.id : null;
  for (const fragment of state.fragments) {
    const isWreck = fragment.origin === "wreck";
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
  const enemy = nearestEnemy(origin, 420);
  if (enemy) return normalize({ x: enemy.x - origin.x, y: enemy.y - origin.y });
  return rotate(thrusterNozzle(cell), angle);
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
        next: "在框架上建造「推进器」；默认屏幕方向移动，展开「更多状态」可切换移动模式；鼠标决定朝向。"
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
        text: "星系任务已完成：请在下方选择「跃迁下一星系」或「暂时停留」。"
      });
    } else {
      alerts.push({
        level: "good",
        text: "任务已完成，可随时跃迁；继续采集、扩建或战斗均可。"
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
  const npcAlerts = buildNpcHudAlerts();
  const alerts = buildStatusAlerts();
  const miningAlerts = buildMiningAlerts();
  const allAlerts = isObjectiveComplete()
    ? [...fragmentAlerts, ...npcAlerts, ...alerts, ...miningAlerts]
    : [...fragmentAlerts, ...npcAlerts, ...miningAlerts, ...alerts];
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
    objectiveHtml += `<br><span class="bad">本关无法跃迁，可重启或留在本关。</span>`;
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
      state.hud.selectedUpgradeKey = "";
      selectedCellPanelEl.classList.add("hidden");
      selectedCellInfoEl.textContent = "";
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
  const html = `已选：${name} ${cell.enabled ? "<span class='good'>启用</span>" : "<span class='danger'>关闭</span>"} / 优先级 ${cell.priority}${stateNote}`;
  document.getElementById("toggleSelectedBtn").disabled = cell.facility === "core";
  document.getElementById("prioritySelectedBtn").disabled = cell.facility === "core";
  if (state.hud.selected !== html) {
    state.hud.selected = html;
    selectedCellPanelEl.classList.remove("hidden");
    selectedCellInfoEl.innerHTML = html;
  }
  renderSelectedCellUpgradePanel(cell);
  renderSelectedCellModificationPanel(cell);
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
    nextLevel();
    updateHud();
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
  resetRun(seed, level) {
    ensureRunRuntimeState();
    state.run.seed = seed;
    state.run.level = levelIndex(level);
    state.run.objectiveCompleteAt = 0;
    state.run.awaitingObjectiveChoice = false;
    state.run.objectiveChoiceDismissed = false;
    state.run.completedObjectives = 0;
    state.run.totalObjectiveRewardBase = 0;
    state.run.escortLowHpAlerted = false;
    state.meta.points = 0;
    state.resources.research = 0;
    state.station.hullMod = 1;
    state.station.weaponMod = 1;
    state.fragments = [];
    state.npcs = [];
    state.enemies = [];
    state.projectiles = [];
    state.repairDrones = [];
    state.particles = [];
    const lvl = levelIndex(level);
    const galaxy = generateGalaxy(lvl, `${seed}:${lvl}`);
    applyGalaxy(galaxy);
    for (const cell of state.station.cells.values()) {
      resetCellUpgradeState(cell);
    }
    createObjective();
    state.run.fragmentHudCache = null;
  },
  getObjectiveType(seed, level) {
    const lvl = levelIndex(level);
    const objectiveSeed = (seed ^ 0x9e3779b9) + lvl * 0x85ebca6b;
    const objectiveRng = mulberry32(objectiveSeed);
    const weightTable = OBJECTIVE_LEVEL_WEIGHTS[lvl] || OBJECTIVE_LEVEL_WEIGHTS[OBJECTIVE_LEVEL_WEIGHTS.length - 1];
    return pickWeighted(objectiveRng, weightTable);
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
  getCellStat,
  applyModification,
  unlockGlobalResearch,
  resetCellUpgradeState,
  createCell,
  improveStationHp,
  syncCellStorableStatsAfterUpgrade,
  upgradeSelectedCell,
  // v0.6.0 T1：手动生成 hostile-station（assault 任务尚未接入；T4 才走 OBJECTIVE_TYPES.assault.make）
  spawnHostileStation(level = 3) {
    return spawnHostileStationNearStation(Math.random, level);
  },
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
