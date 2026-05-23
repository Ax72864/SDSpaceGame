# Star Ring Station v0.8.0 局内随机事件

**发布时间**：2026-05-23  
**Git tag**：v0.8.0-encounters  
**Git commit**：2ef0bbb  
**构建平台**：Windows / Python http.server  
**前置版本**：v0.7.0-combat-control

## 版本主题

在 v0.7.0 战斗操控之上，加入**局内随机事件系统**——玩家每关都会遭遇 1-3 个"非主线"随机事件（漂流商船 / 救援请求 / 伪装陷阱 / 沉船秘窟 / 神秘信号），每个事件提供独立选择和后果，让玩家在主任务之外有"决策深度 + 单局记忆点"。完整复用 v0.5.0 研发 / v0.6.0 hostile-station / v0.7.0 锁敌战斗等已有系统，事件作为"叠加在主任务之上"的并行层。

## 核心新增

### 1. 5 种随机事件类型

#### 漂流商船（trader）

- 友好商船 NPC（绿色）路过，30 秒内可交易
- 玩家飞近 80px 内按 **T 键** = 50 金属 → 1 等离子
- 玩家飞近 80px 内按 **Y 键** = 100 金属 → 3 科研
- spawn 距离 400-600px
- 单星系内最多 2 次

#### 救援请求（distress）

- 友方 NPC（蓝青色）被 4-6 海盗围困，红色警报
- 玩家可选 **援助**（清掉海盗）→ +120 金属 +18 科研 +5 等离子，NPC 飞走
- 玩家可选 **忽略**（45 秒过期）→ NPC 被打死，无奖励
- spawn 距离 500-800px
- 单星系内最多 1 次

#### 伪装陷阱（ambush）

- 看似 distress（绿色伪装），玩家靠近 300px 内变红 + 6-8 海盗伏击
- 玩家可选 **靠近调查** → 触发战斗 → 击退获得 +200 金属 +25 科研 + 3 enemy-wreck 残骸
- 玩家可选 **远离脱险**（700px+）→ 事件过期，无奖励
- spawn 距离 600-900px
- 单星系内最多 1 次

#### 沉船秘窟（derelict）

- 4-6 个大型 wreck 群（origin="derelict"），紫色 HUD 标记
- 关内永久存在直到全部 dock
- DERELICT_FACILITY_WEIGHTS 偏 plasma / research / power 稀有 cell
- spawn 距离 700-1100px
- 单星系内最多 1 次

#### 神秘信号（signal）

- 1 个高价值 fragment（origin="signal"，6-9 cell），金色 HUD 标记
- 关内永久存在直到 dock
- SIGNAL_FACILITY_WEIGHTS 偏 plasma / fusion / energy 高级 cell
- spawn 距离 800-1400px（最远）
- 单星系内最多 1 次

### 2. 平行 ENCOUNTER_TYPES 架构

- **不塞入 OBJECTIVE_TYPES**：事件是独立的平行系统，OBJECTIVE_TYPES 注册表 / createObjective / notifyObjective / grantObjectiveReward 完全不修改
- 新增 `ENCOUNTER_TYPES = { trader, distress, ambush, derelict, signal }` 注册表
- 新增 `state.run.encounters[]` 复数数组（允许并发，上限 3）
- 新增 `state.run.encounterCooldownThisGalaxy: Set` 单星系冷却
- 新增 `notifyEncounters(event, payload)` 平行事件总线，在 8 处现有 notifyObjective 调用之后追加
- 新增 `applyEncounterReward(encounter)` 独立奖励路径
- 新增 `seedEncountersForLevel(level)` 关卡事件滚池
- **独立 RNG 流**：`seed ^ 0xb5297a4d + level * 0xcc9e2d51`，不破坏 `__gameTest.findEscortSeed / getObjectiveType`

### 3. NPC 系统扩展

- 扩展 `npc.kind` 从 1 种到 4 种：friendly-cargo / trader / distress-pilot / pirate-ambush
- 新增 `npc.role: "objective" | "encounter"` 字段
- 新增 `npc.encounterId` 反向引用
- `tickNpc(npc, dt)` 按 kind 分支 AI
- `damageNpc(npc, dmg)` 按 role 派发分流（objective → notifyObjective / encounter → notifyEncounters）
- `buildNpcHudAlerts()` 按 role 分组聚合，事件 NPC 不污染 escort 任务 alert

### 4. HUD 系统升级

- 新增 `buildEncounterHudAlerts()`：聚合 5 种事件状态（detail + 距离 + 剩余时间 + hint）
- 新增 `showHostileStationAlert` **priority 队列**：同时只显示 1 个中央闪烁 DOM
  - assault hostile-station: 100（最高）
  - ambush: 80
  - distress: 70
  - trader: 50
  - derelict: 40
  - signal: 30
  - 高优先级抢占低优先级，避免 DOM 堆叠
  - 队列上限 5
- 新增 fragment.origin 扩展：derelict（紫色 `#bb88ff`）/ signal（金色 `#ffcc44`）HUD 显示
- 新增 7 个 CSS 类：`.alert-encounter-*` × 5 + `.alert-fragment-derelict/signal` × 2 + ambush 急促闪烁 keyframe

### 5. 单局记忆点机制

- 每关随机 1-3 个事件（level 0 仅 trader / level 6 终末关无事件）
- 60-180 秒延迟触发，事件之间错开
- 5 种事件覆盖"友好交易 / 战斗援助 / 真伪判断 / 自由拾荒 / 高风险高回报"5 种决策模式
- 玩家可"完全不参与"事件继续游戏（玩法等价 v0.7.0）

### 6. 调试钩子

- `__gameTest.getEncounters()` 查看 encounter 状态
- `__gameTest.forceActivateEncounters()` 强制激活所有 pending encounter
- `__gameTest.advanceEncounters(seconds)` 推进 encounter tick
- `__gameTest.tradeEncounter(encounterId, optionIndex)` 模拟 trader 交易

## 兼容性

- 完全保留 v0.1.x-v0.7.0 所有体验路径
- v0.8.0 是"附加层"性质：玩家**不靠近 trader / 不援助 distress / 远离 ambush / 不去 derelict 和 signal** 时玩法基本等价 v0.7.0
- v0.7.0 锁敌（priorityTarget + selectTarget + F 键齐射）完全保留
- v0.6.0 hostile-station BOSS 战平衡完全保留
- v0.5.0 研发系统 / v0.4.0 OBJECTIVE_TYPES（8 种）/ v0.3.0 fragment 桥接 / v0.2.0 核心 5 cell 完全等价
- 现有 8 处 notifyObjective 调用完全保留（仅追加 notifyEncounters）
- 现有 grantObjectiveReward 不修改（事件走独立 applyEncounterReward）
- 现有 escort 任务完全等价（npc.role="objective" + tickFriendlyCargoLikeNpc）
- SAVE_KEY 未变（v1）；旧存档兼容
- `__gameTest.findEscortSeed / getObjectiveType / resetRun` 完全等价

## 已知问题（留 v0.8.1+ 修复清单）

### S2 体验下降

- **S2-2**：触发延迟按抽样顺序而非事件类型（spec 60/90/120/150/180s 按类型，实际按 base+i×stagger）。
- **S2-3**：ambush 玩家远离 > 700px 直接 expired，无法"飞近又退回观察再决定"。

### S3 后续优化

- **S3-1**：HUD_PRIORITY_* 常量未命名（裸数字 100/80/70/50/40/30 散布代码）。
- **S3-2/3**：distress / ambush 海盗数量 uniform 4-6 / 6-8 而非 level 曲线。
- **S3-4**：ambush 海盗 HP ×1.1 未实现（与 distress 等价 HP）。
- **S3-5**：derelict wreck 数量 level 2/4 偏 +1。
- **S3-6**：ambush 完成后 NPC 残留（state="complete" 不触发 expireEncounter，NPC 留到 nextLevel 清空）。
- **S3-7**：pickEncounterSpawnPos 缺与现有实体的 minDist 避让（极端 RNG 下 encounter 可能与 hostile-station / escort NPC 重叠）。
- **S3-8**：encounterCooldownThisGalaxy Set 字段功能冗余。
- **S3-9**：trader 资源不足按 T/Y 无显式 toast 反馈。
- **S3-10**：节点 B/C 自检文档化缺失。

## 后续优化方向

- **v0.8.1**：S2-2 / S2-3 修复 + S3-1~S3-10 polish。
- **v0.9 大版本候选**：
  - **炮塔朝向改基于 station angle**（game desc §5 的 v0.7.0 第 4 步未做）
  - **平面 / 半球护盾方向性**（game desc §5 的 v0.7.0 第 5 步未做）
  - **多敌方阵营 / 派系系统**（game desc §11，引入新 enemy kind 和 faction 关系）
  - **跨关持续事件 / 长链遭遇**（如"贸易商队 N 关后归来"+ 长线任务）
  - **局外天赋树重构**（game desc §8）
  - **新探索 / 地图层级系统**（game desc §7）

## 构建与运行

1. 解压发布包到任意目录。
2. 双击 `Start-Windows.cmd` 启动本地服务器（需要 Python 3.x）。
3. 浏览器打开 <http://localhost:5500>。

## 致谢与流程

- 制作人方向 → PM 看板 → 主程 ADR + 数值方案（并行）→ 实施（T1+T2 / T3 / T4+T5 三批）→ GPT 专项审核（与 Claude 执行方不同基底，⚠️ 有条件通过）→ S2-1 修复（trader 时间窗 1200→2400px）→ PM 节点 D 完整回归（v0.8.0 实测 16/16 + 历史采样 v0.1.x-v0.7.0 68/68 + 主观 8/7/8）→ 制作人最终决定 ✅ 接受 → 发布。
- v0.8.0 实现 ~1144 行 game.js 代码 + ~62 行 style.css + 5 份立项 / 审核 / 回归文档（约 4000 行）。
- 完整 commit 链 9 个。
