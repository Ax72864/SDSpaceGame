---
name: debug-observability
description: Guides agents to add, use, and clean up lightweight game debugging and observability aids. Use when diagnosing bugs, unclear gameplay state, browser errors, performance symptoms, save-state issues, or when logs/debug overlays would help development feedback.
---

# Debug Observability

## Principles

Add observability to answer a concrete question. Do not add logs just to make the project look more formal.

Prefer small, removable, and player-safe instrumentation:

- Console logs with clear categories and severity.
- Runtime exception and error capture during browser checks.
- Debug overlay or HUD fields hidden behind a switch.
- State snapshots for important systems such as resources, build mode, enemies, objectives, save/load, and frame timing.
- Focused performance samples for frame time or object counts when performance is suspected.

## Workflow

1. State the debugging question: what is unknown, and what evidence would resolve it.
2. Choose the least invasive signal: console, overlay, state dump, assertion, or browser DevTools observation.
3. Keep logs readable and scoped; avoid noisy per-frame output unless gated or sampled.
4. Use the logs while reproducing the issue.
5. After the task, decide what happens to each signal:
   - Keep: useful permanent diagnostic or player-safe warning.
   - Gate: useful for development but hidden behind debug mode.
   - Downgrade: reduce severity or frequency.
   - Remove: temporary investigation output.

## Browser And Test Tooling

- Playwright is the preferred future option for repeatable browser flows with console capture and screenshots.
- Puppeteer or Chrome DevTools Protocol can be used for lighter runtime exception and DOM checks.
- Browser DevTools remains the fastest manual tool for storage, console, performance, and rendering inspection.

## Output Checklist

```markdown
可观测性处理：
- 调试问题：
- 增加或使用的信号：
- 发现：
- 任务结束处理：
- 仍缺少的证据：
```
