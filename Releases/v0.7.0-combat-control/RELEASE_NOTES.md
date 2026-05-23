# Star Ring Station v0.7.0 战斗操控

**发布时间**：2026-05-23  
**Git tag**：v0.7.0-combat-control  
**Git commit**：ef2c9ec  
**构建平台**：Windows / Python http.server  
**前置版本**：v0.6.0-hostile-station

## 版本主题

把已经在自动追鼠标的 `state.station.angle` 升级为玩家的"战斗操作信号"——加上**武器装填可视化**、**右键锁敌优先目标**和**键盘手动齐射**三套机制，让 v0.6.0 hostile-station BOSS 决战和日常战斗都从"按按钮等敌死"升级为"看节奏选目标卡时机扣扳机"，让 v0.5.0 研发系统的 build 选择、v0.6.0 战术决策（先打武器/直击核心）有可操作的工具。

## 核心新增

### 1. 优先目标锁敌系统

- **鼠标右键点击敌人**（CELL × 1.5 半径内）→ 设定优先目标
- **优先目标在世界中可视化**：红色十字 + 旋转脉冲圆环
  - hostile-station 锁定时圆环半径 80 px
  - 普通 enemy 锁定时半径 enemy.r × 1.5
  - 圆环旋转 1 rad/s + pulse 周期 1.0 秒（alpha 0.5-1.0 sinwave）
- **三类失效自动清空**：超时 12 秒 / 敌人 hp=0 / 距离 > 800 像素
- **右键空白处** → 立即清空优先目标
- **所有武器自动尊重锁敌**：turret / shield / missile 都通过新 `selectTarget` 函数包装 nearestEnemy 路径，优先目标在 range 内时返回它

### 2. 手动齐射控制

- **F 键齐射** → 等价 `#missileBtn` 按钮，触发 fireMissiles
- **F 键 + #missileBtn 共享 300ms 防抖**：连按 / 连点仅触发一次
- **`[` `]` 调整 salvoSize**：4 档循环（1 / 2 / 3 / all）
  - `[` 递减：1 → all → 3 → 2 → 1
  - `]` 递增：1 → 2 → 3 → all → 1
  - 默认 1（单发节奏；玩家可升档全梭）
  - 仅 run 内，跨 run / resetRun 重置为 1
- **fireMissiles 按 cell key 字典序排序**：salvoSize < readyCount 时优先发射 cell key 字典序最小的 missile cells（"左边的先发"）

### 3. HUD 武器行装填指示器

- 主 HUD 在资源条下方新增"武器"行（单行水平布局）：
  - `导弹井 X/Y 就绪 · 齐射 N · 下一发 Y.Y 秒`
  - `炮塔 X/Y 工作 · K 个被自机遮挡`
  - 末尾灰色提示：`F=齐射 · [/]=调档 · 右键锁敌`
- 无 missile cell 时不显示 missile 部分；无 turret cell 时不显示 turret 部分
- selectedCellPanel 选中 missile / turret cell 时显示 reload 进度条：
  - 4 色区间：暗红 (0-25%) / 黄 (25-75%) / 亮绿 (75-100%) / 蓝色脉冲 (ready)
  - 显示百分比 + 剩余秒数

### 4. 视觉反馈

- **missile cell ready** → 亮蓝色脉冲发光环（reload <= 0 时显示）
- **turret cell 被 LOS 遮挡瞬间** → 橙色环 0.5 秒 alpha 线性衰减
  - 同一 cell 5 秒内不重复触发（避免频闪）
  - LOS 检查复用现有 hasLineOfSight 函数

## 工程基础

- 新增 `state.input.priorityTarget`（{ enemy, setAt, validUntil } | null）+ `state.input.aimingRightButton`
- 新增 `state.missile.salvoSize`（初始 1）
- 新增 9 个常量（PRIORITY_TARGET_LIFETIME / PRIORITY_TARGET_LOCK_RADIUS 等）
- 新增 6 个函数：selectTarget / setPriorityTarget / clearPriorityTarget / handleRightClick / adjustSalvoSize / updateWeaponsRow / renderPriorityTargetLockOverlay / renderStationCellCombatVisuals
- 修改 5 个函数：bindInput（右键独立通道 + F/[/]）/ updateTurret（接入 selectTarget + _losBlockedAt 节流）/ shieldDirection（接入 selectTarget）/ fireMissiles（防抖 + 字典序 + slice）/ updateHud（调用 updateWeaponsRow）+ selectedCellPanel（reload 进度条）

## 兼容性

- 完全保留 v0.1.x-v0.6.0 所有体验路径
- v0.7.0 是"附加功能"性质：玩家**不右键 / 不按 F / salvoSize 保持 1** 时玩法基本等价 v0.6.0（除了 #missileBtn 单击发 1 枚而非全发——按 ADR §1.3 拍板的预期行为变化）
- v0.6.0 hostile-station BOSS 战平衡完全保留
- 现有 5 种 enemy kind + 8 种 OBJECTIVE_TYPES + fragment / wreck / enemy-wreck / salvage 路径不破坏
- 现有按键（Space / Enter / WASD / 1-9 / 0 / - / = / Escape / 左键 / 拖动旋转）行为完全等价
- SAVE_KEY 未变（v1）；旧存档兼容

## 已知问题（留 v0.7.1+ 修复清单）

- **S2-1**：hostile-station 单 cell 级锁定未实现（PM 节点 B 新发现）。玩家想右键锁定 hostile-station 的具体 cell（如 core / 武器 turret），目前只能锁定整个 hostile-station 整体。v0.7.0 范围内未要求，留 v0.7.1+ 评估。
- **S3-1**：nextLevel 未显式清空 priorityTarget（跨关时可能有 1-2 帧视觉残留，selectTarget 三类失效检查会在数帧内自动清空）。
- **S3-2**：玩家所有武器 cell 被摧毁后 priorityTarget 不自动清空（无实际影响，无武器调用 selectTarget）。
- **S3-3**：missile ready 发光环 pulse 周期实际 1.57s（数值方案 §4 期望 1.0s，sin(t*4) 频率偏差）。
- **S3-4**：turretWouldLockNpc 测试 helper 保留 nearestEnemy 未同步切换 selectTarget。

## 后续优化方向

- v0.7.1：S2-1 hostile-station 单 cell 级锁定（如有需求）+ S3-1/2/3/4 修复。
- v0.8+：炮塔朝向改基于 station angle / 平面 (半球) 护盾方向性（game desc §5）/ 局外天赋树重构（game desc §8）/ 新探索系统（game desc §7）。
- v1.0+：联机 / 异步对战（game desc §9 / §10）。

## 构建与运行

1. 解压发布包到任意目录。
2. 双击 `Start-Windows.cmd` 启动本地服务器（需要 Python 3.x）。
3. 浏览器打开 http://localhost:5500。

## 致谢与流程

- 制作人方向 → PM 看板 → 主程 ADR + 数值方案（并行）→ 实施（T1+T2 / T3+T4 / T5+T6 三批）→ GPT 专项审核（与 Claude 执行方不同基底，✅ 通过）→ S2-1 修复 → PM 节点 B 完整回归（31/31 实测 + 56/56 历史 + 8/8/8.5 主观）→ 制作人最终决定 ✅ 接受 → 发布。
- v0.7.0 实现 ~530 行 game.js 代码 + ~70 行 style.css + 5 份立项 / 审核 / 回归文档 / 看板节点 B 报告（约 2000 行）。
- 完整 commit 链 9 个。
