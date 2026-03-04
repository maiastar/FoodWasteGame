# Project Memory

## Goals
- Build and polish an educational food waste simulator game.
- Improve gameplay UX in shopping, fridge organization, and meal planning flows.
- Keep the app runnable locally as a static web game.

## Current Project and Run
- Active app path: `/Users/aaronluther/Documents/foodwastesim3:3:26/FoodWasteGame`
- Local run command: `cd FoodWasteGame && python3 -m http.server 8001`
- Local URL: `http://localhost:8001`

## Key Prior Work (Recovered from Cursor)
- Thread: "Food waste simulator game planning"
  - Scope: Large gameplay/UI iteration across 30 files.
  - Notable touched files: `HydraGuide.js`, `PlanningMinigame.js`, `FridgeMinigame.js`, `CookingMinigame.js`, `hydra-dialogue.json`.
- Thread: "Previous chat context"
  - Scope: Story pipeline and repair work.
  - Notable touched files: `story.schema.json`, `README.md`, `generate_story.py`, `StoryManager.cs`, `repair_story.py`.
- Thread: "Unity 2D game development for food waste"
  - Scope: Unity-side interaction and systems iteration.
  - Notable touched files: `UNITY6_NOTES.md`, `IngredientDrag.cs`, `DropZone.cs`, `AudioManager.cs`, `GameManager.cs`.

## Repeated User Priorities
- Fix fridge drag-and-drop reliability and cursor alignment.
- Remove overlapping/floating UI artifacts in minigames.
- Improve shopping UI layout and list behavior (including autoscroll/updating).
- Fix meal planning text overlap and unclosable day prompt.
- Improve visual polish while preserving functionality.

## Known Risks
- UI regressions after iterative quick fixes (especially overlapping panels and anchors).
- Interaction bugs that pass first-run but fail on repeat runs (state reset issues).
- Multiple project variants exist (web simulator + Unity project), so context can drift between repos.

## Transfer Artifacts
- Raw Cursor recovery exports are in:
  - `/Users/aaronluther/Documents/foodwastesim3:3:26/migration/cursor-history/`
- Use these exports as source-of-truth history, and keep this file as distilled working memory.
