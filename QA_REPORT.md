# Pixel Life — Deep QA Report (QA Fix 2)

## Reported defect
Player could not move after the NPC redesign/update.

## Confirmed root cause
`drawNPC()` called `roundRect(...)`, but `roundRect` was never defined. The first animation frame threw a `ReferenceError`, stopping the shared `requestAnimationFrame` loop. Because movement, camera, NPC updates, and rendering all share that loop, the player appeared completely frozen even when input state changed.

## Secondary issues found
1. The portrait build still had a landscape orientation overlay capable of covering the entire control layer and intercepting input in some viewers.
2. NPC roaming allowed an NPC to step immediately next to the player and potentially block a preferred direction.
3. Joystick reset did not handle every pointer-capture/page lifecycle case.

## Fixes applied
- Replaced the missing `roundRect` call with a defined, cross-browser `roundedRectPath()` helper.
- Disabled the hard-blocking landscape overlay.
- Kept Pointer Events as the primary joystick input path and added a Touch Events fallback for environments without Pointer Events.
- Added reset handling for `lostpointercapture`, `blur`, and `pagehide`.
- NPC roaming now avoids both the player's tile and immediately adjacent tiles.
- Added runtime error/unhandled-promise logging.

## Automated browser QA
Tested in headless Chromium with a mobile portrait viewport (390 × 844) and touch emulation.

### Verified
- JavaScript syntax: PASS
- First-frame runtime exceptions: PASS (0 exceptions)
- Joystick hit target: PASS
- Sustained touch joystick input: PASS
- Player movement: PASS — simulated upward touch moved the player from grid Y=16 to Y=12
- Movement input reset after touch release: PASS
- Initial movement collision sanity: PASS — up/down/left/right all available at spawn after anti-crowding adjustment
- NPC roaming: PASS — multiple NPC positions changed during a 3.2-second runtime test
- Runtime exceptions during movement/roaming: PASS (0 exceptions)

## Current scope note
This build is portrait-first. Landscape is no longer hard-blocked, but the control layout is not yet optimized for landscape and may overlap. Portrait remains the supported target for this phase.
