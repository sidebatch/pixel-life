# NPC +2 Pipeline Verification

## Added NPCs
- 하나 — florist
- 준 — carpenter

## Pipeline checks
### hana
- Sheet: 288×384
- Frames: 12 (3×4)
- Target cell: 96×96
- Visible height range: 68–68 px
- Visible width range: 43–47 px
- Foot baseline: y=94 in every cell
- Stray pixels: largest connected component extraction applied
- Transparent background: yes

### jun
- Sheet: 288×384
- Frames: 12 (3×4)
- Target cell: 96×96
- Visible height range: 68–68 px
- Visible width range: 44–47 px
- Foot baseline: y=94 in every cell
- Stray pixels: largest connected component extraction applied
- Transparent background: yes

## Placement QA
- 하나 moved to (16,15); does not start on the sign tile (18,12).
- 준 starts at (6,10); no static object shares that tile in the current map definition.

## Code QA
- Both sprite keys are registered in `NPC_SHEET_URLS`.
- Both NPC records use the shared `drawNPC()` renderer.
- Both use the same `scale: 1.00` as the current normalized NPC pack.
- Both inherit roaming/collision/dialog logic from the shared NPC system.

## Result
The two new NPCs now follow the documented pipeline structurally. Runtime browser QA is run separately below.

## Runtime browser QA
- JavaScript syntax: PASS (`node --check`)
- Browser runtime exceptions: 0
- Console errors: 0
- `hana` image loaded: 288×384, complete
- `jun` image loaded: 288×384, complete
- Roaming observed for both new NPCs: PASS
- Player movement after adding NPCs: PASS
- Collision: player cannot step into Hana or Jun tile: PASS
- Dialogue interaction with Hana: PASS
- Dialogue interaction with Jun: PASS
- Existing NPC system remained active: PASS

## Important findings caught by the pipeline
1. Hana was initially placed on the sign tile `(18,12)`. She was moved to `(16,15)`.
2. Jun's generated source contained isolated stray pixels in side-walk frames, causing inconsistent normalized height. Largest-connected-component cleanup fixed this; all 12 frames are now 68 px tall with baseline y=94.

## Final verdict
**PASS.** The documented NPC pipeline is working as intended for these two additions. It caught two concrete integration problems before release.
