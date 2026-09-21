# NPC Pipeline Test — Hana + Jun

## Result
Two newly generated NPC sprite sheets were processed using the documented `NPC_CHARACTER_PIPELINE.md` rules and applied to the live game.

## Normalization
- Logical source layout: 3 columns × 4 rows
- Output sheet: 288 × 384 px
- Cell size: 96 × 96 px
- Visible character target height: 68 px
- Foot baseline: y=94
- Runtime scale: 1.00
- Runtime vector/tint accessories: none

## Characters
- 하나 (`hana`) — florist
- 준 (`jun`) — carpenter

## Android local-file fix
Player and the two new NPC sheets are embedded as data URIs in `index.html`, so opening the HTML directly from Android Downloads does not depend on relative asset paths.
