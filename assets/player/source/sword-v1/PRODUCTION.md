# Basic sword asset production

- Tool: built-in imagegen, generated transparent PNG; no external references.
- Original: `basic-generated.png` (1247×1261, transparent).
- Game asset: `../../sword-v1/basic.png` (96×96, transparent), packed with `scripts/pack-basic-sword.mjs` using alpha crop and nearest-neighbor scaling. The original is preserved; do not repack existing character or axe art.
- Purpose: first held sword, simple steel blade/brass crossguard/brown grip. All future sword tiers require their own art but share `docs/SWORD_ACTION_STANDARD.md`.

Generation prompt:

> Use case: stylized-concept. Asset type: transparent isolated pixel-art weapon source for a 2D top-down/three-quarter-view cozy fantasy game. Primary request: ONE humble beginner's short sword, visibly a sword rather than an axe: narrow straight pale-steel blade with a simple pointed tip, modest warm brass crossguard, short brown leather-wrapped grip, tiny round pommel. No sheath. Style/medium: crisp hand-authored retro pixel art, clean dark pixel outline, restrained shading, compact silhouette matching a charming detailed 2D RPG equipment sprite. No smooth anti-aliased edges or painterly texture. Composition/framing: single whole sword, diagonal from bottom-left grip/pommel to top-right blade tip, generous transparent padding, weapon fills roughly 70% of frame; no other object. Constraints: genuinely transparent background; blade, crossguard, grip and pommel all fully visible and connected; no character, hands, shadow, glow, text, logo, border or watermark.
