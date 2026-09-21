# QA Report — Player NPC Standard

## Goal
Replace the legacy player sprite with a new player that follows the exact same sprite specification as NPCs.

## Asset checks
- Player sheet: 288×384 px
- Cell size: 96×96 px
- 3 frames × 4 directions
- Direction rows: down / left / right / up
- Visible player height: 68 px in every frame
- Foot baseline: y=94 in every frame
- Runtime render cell size: 100 px, same as NPCs
- Runtime anchor formula: same as NPCs

## Code checks
- Movement/collision/camera code unchanged
- Player draw routine now reads the normalized sheet directly
- Player and NPC shadow size/position use the same values
- Legacy player frames retained only as a load-failure fallback
- JavaScript syntax check: PASS

## Visual scale check
`PLAYER_NPC_SCALE_QA.png` composites the actual player/NPC assets at the runtime scale and baseline. Player now matches the NPC body standard instead of using the former smaller custom render path.

## Note
Headless Chromium navigation is blocked in this container environment, so the final tactile/mobile input check should still be done on the phone build. Static asset, anchor, sizing, and JS syntax checks pass.
