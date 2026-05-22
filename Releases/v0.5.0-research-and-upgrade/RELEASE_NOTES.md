# v0.5.0 研发与升级（Research & Upgrade）

发布日期：2026-05-23
基础版本：v0.4.0 任务多样化（commit `4a2ac6e`）
最终 commit：`ed96fd5`
Git tag：`v0.5.0-research-and-upgrade`

## 版本目标

让玩家在每局 15-30 分钟内有"研发路线 build"决策，使每局有渐进感和路线分歧；玩家完成任务后可以主动选择升级 / 改造 / 激活全局加成，让 13 种设施有真正的差异化深度。

## 主要变更

### 工程基础

- 新增 `getCellStat(cell, key)` 集中读取层，6 步 fallback 链（base → tier → mod → techLevel → globalMod → clamp）。
- 13 种设施 `TYPES.<facility>.baseStats` 字段填充：damage / reload / range / repairRate / produceRate / mineRate / thrust 等。
- cell 新增 `cell.tier / cell.mod / cell.upgradePath / cell.baseMaxHp / baseMaxFrameHp / baseMaxShield` 字段。

### 研发点积累

- `OBJECTIVE_TYPES.researchReward` 字段加入 7 种任务（mine 3 / explore 4 / battle 5 / survive 6 / guardian 12 / salvage 5 / escort 7）。
- 任务完成时 `state.resources.research += floor(base × (1 + level × 0.1))`。
- HUD 显示 research 数字 + 30 秒滑动平均增长率 (+N/s)。

### 设施升级

- 12 种可升级设施（除 core）。
- turret / missile / shield 各 3 路径选 1（伤害 / 射速 / 射程类）。
- 其他 9 种设施单路径（power +25%/50%/75% produceRate 等）。
- tier 0→1=5、1→2=10、2→3=20 research 成本（累积 35 升满）。
- 路径锁定：tier 0→1 选定后不可再切换。

### 设施改造

- 4 个核心设施可改造（turret / missile / shield / thruster）。
- 每个设施 2 个 mutually exclusive A/B 改造选项。
- 改造一次性 30 research，**不可逆**（v0.5.0 范围内）。
- 示例：turret "高速点射"（reload speed +50% / damage -25%）vs "重型炮"（reload -30% / damage +60%）。

### 全局加成研发树

- 新增独立研发树 DOM 面板（"研发树"按钮打开）。
- 2 个全局加成节点：
  - **hullMod 船体强化**：50 research 解锁，所有 cell maxHp ×1.05（含 fragments 中的 cells）。
  - **weaponMod 武器强化**：50 research 解锁，所有 turret + missile damage ×1.05。
- 跨关保留（本局有效到 run 结束），resetRun 重置。

### techLevel 兼容与 clamp

- v0.1.x-v0.4.x 的 techLevel 自动难度曲线保留。
- 与玩家研发乘法叠加：`final = base × (1 + tier_bonus + mod_bonus) × techFactor × globalFactor`。
- 单 stat clamp 上限 = `2.5 × base`（damage / reload / range / maxShield / maxHp / regen / thrust 适用）。

### 体验目标达成（PM 节点 C 主观评估）

- 可感知 build 决策：8/10
- 可演化 build 路线：7/10
- 可平衡难度曲线：7/10

## 关键修复

- **S1 HP 类升级广播式同步**（commit `8c82f04`）：armor / frame / shield maxShield 升级 + hullMod 解锁后 cell.maxHp / maxFrameHp / maxShield 立即同步；新增 `syncCellStorableStatsAfterUpgrade` 函数。
- `TYPES.shield.baseStats.maxShield` 从 0 补为 100（v0.4.0 既有问题）。

## 已知问题（v0.5.1 修复清单）

1. **shield regen base=0**：升级 regen 路径与 omni 改造的 regen 维度暂无效（S2，v0.4.0 既有问题）。
2. **thruster 改造的 mass / angularDamping 未实现**：仅 thrust 部分生效（S3，v0.5.0 范围已说明，留 v0.5.1）。
3. **数值微调空间**：turret / missile / shield 三路径倍率可在 PM ±20% 范围内调整（节点 C 反馈）。
4. **升级 UI hover 提示**：部分按钮 tooltip 可补充更详细的"升级前后对比"。

## 不回潮验证

- v0.1.x：6/6 采样通过（建造、SAVE_KEY、局外天赋等）。
- v0.2.0：6/6 采样通过（核心 5 cell、建造资源、敌人难度）。
- v0.2.1：4/4 采样通过（三引擎手感）。
- v0.3.0：6/6 采样通过（fragment 桥接、damageCell、wreck）。
- v0.4.0：9/9 采样通过（7 种任务、奖励倍率、跨关 fragment/NPC）。
- v0.5.0：27/27 新增点通过。

## 构建与运行

### 启动

- Windows：双击 `Start-Windows.cmd` 或在 `Game/` 目录运行 `python -m http.server 5500`。
- 浏览器访问 `http://localhost:5500/`。

### 系统要求

- 现代浏览器（Chrome / Edge / Firefox，建议 Chrome）。
- Windows 10 / 11 + Python 3 用于启动脚本。

## 提交链

- 立项：`bc21ff3` 制作人方向 + 命名附录、`a0ce1e1` PM 看板、`5a6f0f2` 数值方案、`6a2b9d1` 主程 ADR。
- 实施：`a41bf36` T1 工程基础、`2bdc4f7` T2+T3 研发点 + 升级面板、`d910e58` T4+T5+T6 改造 + 全局加成 + 调参 + 死代码清理。
- 修复：`8c82f04` S1 HP 类升级广播式同步。
- 审核 / 回归：`92587bd` 专项审核报告、`ed96fd5` PM 节点 C 报告。
- 制作人决定 + 发布：制作人已接受 v0.5.0 发布，本目录为 IT 工程师发布归档。
