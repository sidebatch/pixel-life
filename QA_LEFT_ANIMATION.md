# Player Left Animation QA

## Root cause
The generated player sheet's left-facing row contained one wrong-facing frame: left-row frame 0 faced right. The walk cycle is `0 → 1 → 2 → 1`, so the visual bug appeared intermittently at frame 0.

## Regression found
The older player renderer already used the right-facing side animation as canonical and mirrored it for left movement. During the NPC-standard player conversion, the renderer switched to reading the generated left row directly, reintroducing the bad frame.

## Fix
- Rebuilt all three left-row cells as exact horizontal mirrors of the canonical right-row cells.
- `drawPlayer()` now ignores the left row at runtime and mirrors the canonical right row whenever `player.face === 'left'`.
- The fallback renderer follows the same rule.
- Movement, collision, camera, and NPC logic are unchanged.

## QA
- Player sheet: 288×384 px: PASS
- Cell grid: 96×96, 3×4: PASS
- Left frame 0 = mirror(right frame 0): PASS
- Left frame 1 = mirror(right frame 1): PASS
- Left frame 2 = mirror(right frame 2): PASS
- Runtime uses canonical-right + mirror-left: PASS
- JavaScript syntax: checked separately with `node --check`

With this renderer, a right-facing animation frame cannot be selected while the player is facing left.
