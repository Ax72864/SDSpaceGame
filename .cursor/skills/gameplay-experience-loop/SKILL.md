---
name: gameplay-experience-loop
description: Guides game agents through running the web game, collecting browser feedback, recording playtest evidence, and closing develop-test-fix-retest loops. Use when working on gameplay feel, UI readability, first-round experience, core loops, balancing, releases, or browser playtesting.
---

# Gameplay Experience Loop

## When To Use

Use this skill for changes that affect player experience: movement, combat, building, resource collection, UI feedback, onboarding, pacing, balance, release readiness, or any issue reported from `42.md`.

For tiny text, comment, or low-risk style edits, state why this loop is not needed.

## Loop

1. Define the player path to verify: start, actions, expected feedback, success and failure conditions.
2. Run the current game in a real browser when possible. The default local path is `Game/index.html`; for stable browser behavior, serve `Game/` with a local static server.
3. Collect evidence: visible result, console errors, runtime exceptions, screenshot notes if useful, and subjective feel notes.
4. If a defect appears, record reproduction steps before fixing.
5. After fixing, repeat the same path and state whether the original failure path is closed.
6. Summarize coverage as: automatic checks, browser-level checks, human feel checks, uncovered paths, residual risk.

## Tooling Suggestions

- Prefer Playwright when the team needs repeatable browser tests, screenshots, keyboard/mouse input, console capture, and first-round regression flows.
- Use Puppeteer or Chrome DevTools Protocol for lighter smoke checks, DOM assertions, runtime exception capture, or performance sampling.
- Use browser DevTools for immediate manual diagnosis: console, performance, storage, device scale, and network.
- Keep headless results separate from human playtest notes; headless can catch crashes, but not whether movement, pacing, or feedback feels good.

## Report Template

```markdown
体验回归：
- 路径：
- 验证方式：
- 结果：
- 控制台/异常：
- 手感与可读性：
- 修复后复测：
- 未覆盖与风险：
```
