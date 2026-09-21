# Building Standard 2.0 QA

## Fixed regression
V1 positioned the whole PNG around the collision-footprint center. This only works when the artwork door happens to be exactly at that center. A left/right/asymmetric building therefore produced a visible offset between player/approach tile and the painted door.

## V2 rule
`artAnchor.doorCenterX` is measured on the source PNG. The renderer aligns that pixel to the exact center of `entrance.door` in world coordinates.

## Current assets
- home_cottage.png: source 300x293, doorCenterX 158
- carpenter_workshop.png: source 330x318, doorCenterX 166
- TILE = 48

## Calculated alignment
- Home target local door center: 120 px. Art shifts so source x=158 lands at 120.
- Workshop target local door center: 120 px. Art shifts so source x=166 lands at 120.
- Expected horizontal door alignment error after scaling: 0 px (before final integer rounding; max visual rounding < 1 px).

## Regression checks
- entrance interaction logic unchanged
- collision footprint unchanged
- NPC no-roam approach tiles unchanged
- player/NPC sprites unchanged
- production debug overlay disabled
