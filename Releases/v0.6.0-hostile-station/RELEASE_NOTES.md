# Star Ring Station v0.6.0 敌方空间站

**发布时间**：2026-05-23  
**Git tag**：v0.6.0-hostile-station  
**Git commit**：8273292  
**构建平台**：Windows / Python http.server  
**前置版本**：v0.5.0-research-and-upgrade

## 版本主题

引入 BOSS 级敌方空间站（hostile-station），填补 v0.5.0 终局 guardian 之前的中期决战体验空白。
玩家在 level 3-5 中段遭遇 cells 化的敌方空间站，可通过战术决策（先打武器 / 直击核心 / 拆 power 削弱）多种路径取胜，
击毁后大量战利品 wreck 与 v0.3.0 拾荒系统强协同，形成"升级 build → 决战 → 拾荒 → 进入下个星系"的完整爽快闭环。

## 核心新增

### 1. hostile-station 实体（cells 化敌方空间站）

- 复用 v0.3.0 fragment.cells 数据结构：7 cells（1 core + 1 power + 2 turret + 1 shield + 1 armor + 1 frame）
- HP 总池按 level 3/4/5 = 1500 / 2200 / 3000
- cells 命中粒度（玩家弹命中具体 cell 而非整体 HP）
- core cell HP=0 即死（击杀判定）
- cell.owner="enemy" 字段阻断玩家研发系统加成

### 2. AI 与战斗

- 静态悬停 AI（accel 4 / drag 0.5 / 缓慢自转 angularVel 0.15-0.20 rad/s）
- 多武器槽独立 reload + fire（玩家可拆除单个武器 cell 让其停火）
- shield cell 反向拦截玩家弹（shield 死后失去保护）
- 召唤 pirate minion（间隔 10/8.5/7s × cap 3/4/5）
- power cell 死后所有武器 reload +50%

### 3. 击毁奖励

- 死亡相机震屏 + 大量爆炸粒子
- 6 / 9 / 12 个 wreck fragment 爆出（按 level）
- wreck.origin = "enemy-wreck"（与 player / wreck 区分）
- 设施分布 turret 50% / shield 25% / armor 15% / repair 10%（偏战斗设施作为决战奖励）
- 散布半径 80-150 像素
- 不应用 WRECK_FRAGMENT_MAX_COUNT cap（决战奖励语义）

### 4. assault 任务（第 8 种任务类型）

- 在 level 3-5 出现（权重 0.20 / 0.30 / 0.35）
- 单星系冷却（hostileStationSpawnedThisGalaxy）避免连续刷
- 奖励：metal 35-45 + research 9-10 + multiplier 1.4-1.6
- 软限时 8/7/6 分钟（超时阻止跃迁，与 escort 一致）
- spawn 距离 1000-1300 像素，延迟 2.5s（玩家警报反应时间）

### 5. HUD 反馈

- spawn 时红色警报"⚠ 敌方空间站接近"3 秒
- HUD 持续显示"敌方空间站 HP X% | 距离 Xm"
- 击毁后绿色庆祝"✓ 主目标已摧毁"2 秒
- 敌方残骸独立汇总统计（"敌方残骸 ×N · 最近敌方残骸..."）

## 兼容性

- 完全保留 v0.1.x-v0.5.0 所有体验路径
- v0.5.0 研发系统加成对玩家武器自动生效，对敌方 cells 无效（getCellStat owner 隔离）
- v0.4.0 既有 7 种任务全部保留，assault 是第 8 种
- v0.3.0 fragment 桥接 / 拾荒合并路径对 enemy-wreck 兼容
- SAVE_KEY 未变（v1）：旧存档兼容

## 已知问题（留 v0.6.1+ 修复清单）

- **S1-1**：L5 OBJECTIVE_LEVEL_WEIGHTS 总和 0.90，归一化后 assault 实际概率 38.9%（期望 35%，落在 PM ±20% 范围内）。
- **S2-2**：spawnHostileStationNearStation 不检查行星 / 现有 enemy 距离冲突（罕见种子下可能视觉重叠）。
- **S2-3**：showHostileStationAlert 用 setTimeout 计时，游戏暂停时按真实时间消失。
- **S3-1**：angularVel 使用 Math.random() 而非传入 RNG（同 seed 不同 run 转向不可重现）。
- **S3-2**：shield 拦截无方向匹配（敌方 shield 全向拦截）。
- **S3-3**：cells 死后保留在 enemy.cells（hp=0 守卫）而非 enemy.cells.delete（实际是渲染破损残骸视觉的优点）。

## 后续优化方向

- v0.6.1：S1-1 微调 + S2-2 spawn 冲突检查 + S2-3 警报游戏内 tick 计时 + 文案优化。
- v0.7+：移动型敌方空间站、敌方 NPC 阵营、enemy/npc 共用 ship 抽象、新武器机制（近防 / 激光 / AOE）、敌方空间站 cells 升级 / 改造系统。

## 构建与运行

1. 解压发布包到任意目录。
2. 双击 `Start-Windows.cmd` 启动本地服务器（需要 Python 3.x）。
3. 浏览器打开 http://localhost:5500。

## 致谢与流程

- 制作人方向 → PM 看板 → 主程 ADR → 数值方案 → 实施（T1-T6）→ 专项审核（GPT 系列，与 Claude 执行方不同基底）→ S2-1 修复 → PM 节点 C 完整回归 → S2-1-C 补完 → 制作人最终决定 ✅ 接受 → 发布。
- v0.6.0 实现 ~830 行代码 + 4 份立项文档 + 1 份审核报告 + PM 看板节点 C 报告。
- 完整 commit 链 11 个（含立项 4 + 实施 4 + 修复 + 审核 + 回归）。
