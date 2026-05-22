# v0.1.0-first-playability

## Build

- Version: v0.1.0-first-playability
- Commit: 4642b9714a1049e8be2ae15019ad87456160e18d
- Tag: v0.1.0-first-playability
- Build time: 2026-05-22 13:56:50 +08:00
- Platform: Windows / Static HTML5 WebGL

## Major Changes

- Improved first-run control: WASD/direct movement, dual movement modes, mouse-facing direction, and decoupled build mode.
- Improved resource readability: colored resource rings, mining range visualization, mining status HUD, and clearer failure reasons.
- Improved early combat feel: reduced early collision pressure, less suicide-like pirate behavior, lower early asteroid pressure, better movement response.

## How To Run

- Double-click Start-Windows.cmd on Windows.
- Alternatively open Game/index.html in a modern browser with WebGL support.

## Known Issues

- Headless/browser-level regression passed, but real 3-5 minute human feel testing is still needed.
- Small-screen HUD density and resource ring readability should be observed on real displays.
- Local browser security policies may vary when opening files directly; if needed, serve the Game/ folder with a local static server.

## Next Steps

- Continue tuning first-run enemy pressure and movement feel after human playtesting.
- Improve UI density and small-screen layout if visual clutter appears.
- Prepare a more formal build flow if the project moves beyond static web release.
