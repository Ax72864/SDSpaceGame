# v0.4.0-mission-diversity

## Build

- Version: v0.4.0-mission-diversity
- Commit: b953aed
- Tag: v0.4.0-mission-diversity
- Build time: 2026-05-22T23:11:27+08:00
- Platform: Windows / Static HTML5 WebGL

## Major Changes

- Task type registry refactor: 5 existing tasks (mine / explore / battle / survive / guardian) migrated from hardcoded switches to OBJECTIVE_TYPES registry with event-driven progress tracking via notifyObjective(); extension points for new task types are now one-line registry additions.
- Seed-based task selection: each level's task type is derived from state.run.seed using mulberry32 PRNG and per-level weight tables; same seed + same level reproduces same task (deterministic), different seeds produce varied task sequences (replay value).
- Salvage mission (new): each star system pre-generates 3-4 floating "ancient wreckage" fragments (origin = "wreck") with low velocity, mixed facilities (turret 60% / shield 20% / armor 15% / repair 5%) at 65-90% HP; players bridge X wrecks (2-3 by level) to complete; wrecks use independent WRECK_FRAGMENT_MAX_COUNT=6 cap separate from player fragment cap; reward multiplier 1.5x.
- Escort mission (new): each star system spawns 1 friendly cargo NPC (kind = "friendly-cargo") moving from one end to the warp exit; players defend the NPC from enemy projectiles and collisions; HP 200-300 by level, speed 35-45 px/s, arrival radius 80 px; HP < 30% red blinking HUD + HP < 10% one-shot warning toast; NPC death fails the mission but allows free-play in the current level; reward multiplier 1.6x.
- Friendly NPC abstraction: new state.npcs array independent from state.enemies, ensuring player turrets and projectiles never target friendly NPCs; AI features straight-line movement with simple planet/star avoidance.
- Mission failure mechanism: new isObjectiveFailed() guard blocks warp when escort NPC is destroyed; consistent with existing free-play mechanic.
- totalObjectiveRewardBase fix: reward base accumulation now uses base = 2 + level (not multiplied by type multiplier), preventing endgame +50% bonus from double-stacking with salvage 1.5x / escort 1.6x multipliers.
- Timeout fallbacks: salvage 8min / escort 6min auto-fail to prevent stuck runs.
- HUD enhancements: wreck fragments distinguished from player-detached fragments via color and HUD text; NPC HUD shows direction, distance, and HP percentage with three-tier alerting.
- Fix for cross-level mission spawning: nextLevel() now clears state.fragments / state.npcs before createObjective(), ensuring salvage wrecks and escort NPCs spawned during mission creation are not immediately cleared.

## How To Run

- Double-click Start-Windows.cmd on Windows.
- Alternatively open Game/index.html in a modern browser with WebGL support.

## Known Issues

- Cooldown = 1 level (no same-type tasks in consecutive levels) is parameter-reserved in numerics doc but not activated by default; may be enabled in v0.4.1 if extended playtesting confirms repetitive patterns.
- NPC death uses immediate removal without 1-second visual lingering effect; particle flash provides feedback but no dedicated death animation; may add lingering in v0.4.1.
- Salvage facility composition is fixed weighted random (turret 60% / shield 20% / armor 15% / repair 5%); per-level variation deferred to v0.4.1.
- Multi-fragment + NPC stress test peaks at ~6.3ms per frame (well under 16ms budget); long-form profiling deferred.
- v0.3.1 polish items (4-tier fragment HUD, 60s decompression window, bridge error debounce, anchor projection semantics, bbox pre-cull) remain deferred; v0.4.0 did not regress them.
- 5-30 minute long-form human playtesting still pending; PM headless regression covered 62/65 critical paths (3 originally-failing paths fixed by S0 patch) but cannot fully replace human feel testing.

## Next Steps

- v0.4.1 polish candidates: cooldown=1 activation (if playtesting confirms need), NPC death lingering effect, per-level salvage facility variation, long-form profiling, real human playtesting follow-up.
- v0.5.x candidates: continued task type expansion (defense / scavenge / relic-recovery / convoy), tech / research upgrade system, faction reputation, enemy AI diversification, fragment-based combat tactics.
- v0.3.1 polish queue still open; v0.4.0 successfully proved the task system can be extended without breaking v0.3.0 fragment or v0.2.x galactic rhythm paths.
- Continue collecting player feedback via 42.md.
