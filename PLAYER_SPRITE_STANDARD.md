# Player Sprite Standard

The player now uses the same sprite convention as NPCs.

- Sheet: 288 x 384 px
- Cell: 96 x 96 px
- Columns: 3 animation frames
- Rows: down, left, right, up
- Visible body height: ~68 px
- Foot baseline: y=94 inside each cell
- Runtime render cell: 100 px
- Runtime foot anchor: same formula as NPCs (`wy - size + 26`)

This removes the former player-vs-NPC scale mismatch and means future player skins can use the same normalization pipeline as NPCs.


## Left-facing animation regression rule
- Use the right-facing side row as the canonical player side animation.
- Render left movement by horizontally mirroring the canonical right-facing frames.
- Do not trust generated left-row frames without frame-by-frame visual QA; a single wrong-facing frame can cause intermittent direction flicker.
