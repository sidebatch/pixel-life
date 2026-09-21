# QA — Player horizontal direction

Root cause: the generated player sheet stores the side-view rows in the opposite order from the assumed NPC convention.

Correct player row mapping:
- down: 0
- right: 1
- left: 2
- up: 3

Only the player renderer mapping was changed. No movement or collision logic was modified.
