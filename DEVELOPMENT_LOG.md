# Development Log — Real NPC Sprite Fix

## Root issue
Previous NPC normalization drew colored rectangles and vector accessories directly on the main world canvas, which produced obvious square/line artifacts around characters.

## Change
- Restored true independent NPC assets.
- Cleaned each sprite frame using the largest connected alpha component.
- Re-centered and normalized all 12 frames for each NPC into a strict 96x96 grid.
- Aligned every NPC to the player's visual height and foot baseline.
- Removed all runtime cosmetic overlays.


## Add two new NPCs
- Added `hana` (florist) and `jun` (carpenter).
- Created independent normalized sprite sheets in `assets/npcs/`.
- Registered both assets in `index.html` and placed them into the village NPC roster.


## NPC pipeline verification: Hana + Jun
- Generated two independent sprite sheets.
- Detected/fixed Jun source stray pixels with connected-component cleanup.
- Normalized all frames to 96×96 cells, 68 px visible height, baseline y=94.
- Moved Hana off a conflicting sign tile.
- Runtime-tested roaming, collision, dialogue, player movement; 0 runtime errors.


## Player -> NPC Standard
- Replaced legacy player rendering with a normalized 288x384 sprite sheet.
- Player now uses identical 96x96 cell structure, direction rows, frame rhythm, render size, foot anchor, and shadow size as NPCs.
- Existing movement/collision/camera logic was left unchanged.


## NPC pipeline live test
- Reprocessed newly generated Hana and Jun sheets through the documented 96×96 normalization pipeline.
- Replaced their live-game sprite data.
- Embedded player + new NPC assets in the HTML to prevent Android content:// relative-path load failures.


## Left-facing animation regression rule
- Use the right-facing side row as the canonical player side animation.
- Render left movement by horizontally mirroring the canonical right-facing frames.
- Do not trust generated left-row frames without frame-by-frame visual QA; a single wrong-facing frame can cause intermittent direction flicker.

## Building Standard 2.0
- Replaced footprint-center image placement with door-anchor placement.
- Added per-building `artAnchor.doorCenterX`.
- Home anchor: 158px; workshop anchor: 166px.
- Doors may remain left/center/right; gameplay uses explicit world door tile.
- Added optional `DEBUG_BUILDING_ANCHORS` guide for future QA.

## Vegetation Layer V4
- Fixed brief front/back flicker while walking through small passable vegetation.
- Passable vegetation now renders permanently below actors.
- Bushes and reeds removed from Y-depth sorting.
- Trees/buildings and other occluding objects keep Y-depth behavior.

## World time, weather, and fishing vertical slice
- Added a shared 30-minute world clock with dawn/day/dusk/night interpolation.
- Added clear/rain/storm weather selection and full-screen layered precipitation.
- Added developer controls for fixed time and weather through `?debug`.
- Added the first guaranteed-catch fishing loop with a bobber, bite cue, random crucian carp size and price.
- Added a mobile fishing cancel control and prevented cancel-release ghost clicks from opening bag/settings.
- Fishing data pools, progression, codex, persistence, and final fish assets remain intentionally unfinished.
