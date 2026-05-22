# v0.2.0-galactic-rhythm

## Build

- Version: v0.2.0-galactic-rhythm
- Commit: eb5ad3b
- Tag: v0.2.0-galactic-rhythm
- Build time: 2026-05-22T16:12:14.7152671+08:00
- Platform: Windows / Static HTML5 WebGL

## Major Changes

- Procedural galaxy generation: each jump regenerates body layout, count, radius and resource distribution; introduces 5 galaxy types (rich-ore / gas-nebula / plasma-storm / balanced / endgame) with distinct palettes.
- Level-based difficulty ramp: spawnTimer, wave count, enemy ratios, HP and damage scale with level (level 0-2 stay at v0.1.x relaxed baseline; level 3-4 ramp up; level 5 visibly tense).
- Endgame run rhythm: at level 6, players enter the endgame galaxy and must defeat a "Run Guardian" (HP-buffed station with reinforcement waves and special visual cues).
- Run settlement panel: completing the guardian shows total levels cleared, accumulated reward base, +50% endgame bonus and total points.
- Free play mode: after defeating the guardian, players can choose "Restart Run" or "Stay in endgame galaxy"; spawnWave is paused, remaining enemies stay, kills/mining still grant points.
- HUD upgrade: danger level pill (Safe/Alert/High/Deadly/Endgame) and run progress (level X / 7) display; quick-restart entry in More Status panel.

## How To Run

- Double-click Start-Windows.cmd on Windows.
- Alternatively open Game/index.html in a modern browser with WebGL support.

## Known Issues

- Level 0 first-60-second spawnWave count occasionally hits 2 (numerics target ≤1); does not break early relaxation feel; will be retuned in v0.2.x.
- Level 0 body count may be 6 or 7 due to procedural asteroid range 3-4 (numerics noted as fixed 6); cosmetic difference, not gameplay-blocking.
- Station collision damage fallback path was identified during review; not triggered in regression but kept as known edge case.
- 5-30 minute long-form human playtesting still pending; PM headless regression covered all critical paths but cannot fully replace human feel testing.

## Next Steps

- v0.2.x patches: tune level 0 spawn count, normalize asteroid floor, polish station collision fallback.
- v0.3.x candidates: enemy AI behavioral diversification, facility transformation system, talent tree restructuring (proper node graph), escort mission type.
- Continue collecting player feedback via 42.md.
