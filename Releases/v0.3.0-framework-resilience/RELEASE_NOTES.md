# v0.3.0-framework-resilience

## Build

- Version: v0.3.0-framework-resilience
- Commit: 37cf933
- Tag: v0.3.0-framework-resilience
- Build time: 2026-05-22T21:23:41+08:00
- Platform: Windows / Static HTML5 WebGL

## Major Changes

- Independent fragment system: when station cells lose connection to the core, they detach into independent floating Fragment objects with their own position, velocity, angular velocity, drift physics, and visually distinct rendering (transparent + dashed outline).
- Bridging mechanic: players can reconnect detached fragments by constructing a frame near them (distance <= 36px, angle alignment <= 25 deg); facility, HP, frameHp, enabled and priority state are fully preserved on reconnect; reload and fire are reset.
- Bridge preview UI: real-time green / amber ring indicators on candidate frame positions show "ready to bridge" and "near, approach to bridge" tiers, with build hint text guiding players (does not interfere with normal build errors).
- Nearest fragment HUD: persistent on-screen display of direction (8-way arrow), rounded distance, and facility count for the closest fragment; switches to amber warning style when >= 4 fragments are floating.
- Fragment combat: enemy projectiles damage fragment cells with a 14.4px hit radius; destroyed cells are removed from the fragment, and emptied fragments are dispatched with a toast. Player projectiles do not damage fragments.
- All-or-nothing bridging on conflict: if fragment projection conflicts with existing station cells, the frame construction is fully rolled back (no cell, no metal consumed), keeping the build semantic clean.
- Code cleanup: removed three dead-code paths (shouldFire phantom branch, updateDetachedCells empty shell, reconnectDetached no-op wrapper).
- Performance budget: fragments capped at 8, cells per fragment capped at 32; updateFragments is pure vector integration with no per-frame BFS or station / asteroid / enemy collision; 30s+ multi-fragment combat sampled at avg 0.0083ms / max 0.9ms per frame in headless regression.

## How To Run

- Double-click Start-Windows.cmd on Windows.
- Alternatively open Game/index.html in a modern browser with WebGL support.

## Known Issues

- Bridge angle misalignment retains "frame built + bridge failed" semantics (not all-or-nothing); intentional per numerics section 4.3, but may surprise some players.
- Bridge angle-error toast not yet debounced (1.0s); rapid clicks may show repeated errors; deferred to v0.3.1.
- Multi-fragment HUD tiering (numerics section 7.2 specifies 4 tiers: 1 / 2-4 / 5-8 / near cap) currently uses a single >= 4 threshold; HUD tiering refinement deferred to v0.3.1.
- 60-second sliding decompression window for "many cells lost quickly" (numerics section 7.1) not implemented; will be evaluated in v0.3.1 after long-form playtesting.
- mergeFragmentToStation anchor projection can occasionally cover the just-built frame's facility with an anchor cell; semantic refinement deferred to v0.3.1.
- Fragment bbox pre-cull for projectile hit detection deferred to v0.3.1; current per-cell iteration is acceptable at 8 fragments x 32 cells.
- 5-30 minute long-form human playtesting still pending; PM headless regression covered 43 / 43 critical paths but cannot fully replace human feel testing.

## Next Steps

- v0.3.1 polish: HUD tiering (4 levels), 60-second decompression window, bridge error debounce, anchor projection semantics, fragment bbox pre-cull, bridge preview hover tutorial.
- v0.4.x candidates: enemy AI behavioral diversification, facility transformation system, talent tree restructuring (proper node graph), escort / scavenge mission types leveraging the new fragment loop.
- Continue collecting player feedback via 42.md.