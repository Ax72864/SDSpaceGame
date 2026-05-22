---
name: product-technical-retro
description: Guides lightweight product and technical retrospectives for the web game. Use at version boundaries, after major gameplay changes, when choosing testing tools, when considering Playwright/Puppeteer, or when evaluating lightweight web game engines such as Phaser, PixiJS, Excalibur.js, LittleJS, Three.js, Babylon.js, or Godot Web.
---

# Product Technical Retro

## Purpose

Use this skill to keep the team from only optimizing the current mechanic. The retro should connect player value, product direction, engineering cost, and future iteration risk.

Keep it short unless a major decision is being made.

## Product Lens

Check:

- Target player and first-session promise.
- Current full player path: understand, move, collect, build, defend, recover, win or fail.
- What became more fun, clearer, or more stable this version.
- What still feels bad, confusing, repetitive, invisible, or unfinished.
- Whether the next iteration should improve core feel, content, UI, retention, polish, technical foundation, or release quality.

## Technical Lens

Use a light ADR only for meaningful technical choices:

- Problem and trigger.
- Options considered.
- Chosen direction.
- Why it fits current project scale.
- Risks and rollback.
- When to revisit.

## Tooling And Engine Options

- Playwright: best default candidate for future browser regression, screenshots, keyboard/mouse flows, console errors, and first-round smoke tests.
- Puppeteer or CDP: lighter option for custom browser checks and runtime diagnostics.
- Phaser 3: strong candidate when the project needs a fuller 2D game loop, scenes, input, assets, physics, and ecosystem.
- PixiJS: good when the main need is rendering upgrade while keeping custom gameplay architecture.
- Excalibur.js: good for TypeScript-friendly lightweight 2D games with an opinionated engine structure.
- LittleJS: good for very small, fast prototypes with minimal engine weight.
- Three.js or Babylon.js: evaluate only if the product direction clearly needs 3D or advanced visual presentation.
- Godot Web export: consider as a medium-term move to a full engine, not a default next step for a lightweight HTML prototype.

## Retro Template

```markdown
产品/技术复盘：
- 本轮玩家收益：
- 仍不舒服的体验：
- 下轮重点：
- 技术阻碍：
- 候选工具或引擎：
- 当前选择与理由：
- 复盘触发点：
```
