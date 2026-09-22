# Map Foundation 1.0 QA

## Expanded world

- Previous map: 34×24 tiles
- Current map: 64×48 tiles
- Tile size: 48px
- World size: 3,072×2,304px
- Original village layout preserved as the central district
- Added travel space toward the north forest, west field, south meadow and east pond approach

## Automated validation

- PASS — JavaScript syntax
- PASS — runtime asset references (34)
- PASS — map dimensions derived from world definition
- PASS — map segment coordinates and axis alignment
- PASS — unique NPC/building IDs
- PASS — building footprint overlap
- PASS — building/water overlap
- PASS — door inside footprint
- PASS — approach outside footprint and unblocked
- PASS — player spawn
- PASS — NPC spawn collision and duplication
- PASS — fishing marker on water
- PASS — ground decoration/water overlap
- PASS — standalone HTML build
- PASS — player step duration centralized at 185ms
- PASS — player movement uses constant-speed interpolation to avoid a hitch at held-movement tile boundaries
- PASS — desktop keyboard buffering and subpixel actor rendering are isolated from the mobile path

## Debug tools

- F3 toggles the world collision overlay.
- `?debug` enables the overlay on load.
- `?debug&x=10&y=10` starts the player at a valid QA tile.
- Overlay shows the tile grid, blocked tiles, building footprints, doors, approach tiles and NPC roaming ranges.

## Runtime render

- Headless Edge rendered the development build at 540×960.
- Player, NPC, building, terrain, HUD and debug overlay were visible.
- Screenshot: `QA_MAP_FOUNDATION.png`
