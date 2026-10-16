# World / Skill Icon Prompts v1

Built-in imagegen was used, with actual transparent backgrounds. Each location was a separate generation call. Reference images: `assets/forestry/trees/oak.png` and `assets/farming/decorations/well-v1.png` (style reference only). Originals are kept here; 128px runtime PNGs are mechanically cropped, centered and reduced with nearest-neighbor sampling by `scripts/prepare-world-skill-icons.mjs`.

## Shared prompt

Use case: stylized-concept. Asset type: one tiny HUD location icon for the existing Pixel Life game. Match the reference oak tree and stone well: detailed but readable hand-placed pixel art, dark brown outline, clustered pixel highlights, warm natural colors, slight top-down RPG view. One compact silhouette centered with 10 percent transparent margin, square canvas. Must remain immediately readable at 40 by 40 pixels. Actual transparent background. No text, numbers, letters, badges, border, UI panel, blur, glow, photorealism, vector gradients, or emoji style. Subject: 

## Separate subject prompts

### lilac-village

a small turquoise pond with two lilac purple flowering bushes on its grassy bank. The water is the main visual mass.

### sunny-farm

a compact rich brown farm plot with three planted rows, green vegetable leaves and golden wheat, a little wooden fence at the back.

### mountain-lake

a deep blue alpine lake in front of two gray mountain peaks, tiny grassy banks.

### waterfall-valley

a white and turquoise waterfall descending over a stepped gray rock ledge into a small pool, small mossy edges.

### reed-swamp

a dark teal wetland puddle surrounded by tall olive reeds and two brown cattails.

### coast-harbor

a short wooden harbor pier with a mooring post beside sandy shoreline and turquoise waves.

### shallow-sea

a bright turquoise ocean wave with a small sandy coral reef visible under clear shallow water.

### middle-sea

three rolling cobalt blue sea waves with white foam, deeper and wider feeling than shallow water.

### deep-sea

a dark indigo ocean whirlpool curling downward into a dark central hollow, a few pale blue wave edges.

### glacier-sea

a jagged pale blue iceberg with snow cap floating in dark blue cold water.

## Existing artwork

The twelve forest icons and seven skill icons reuse existing approved game sprites. `../../world-skills-v1/sources.json` records every original; no original game artwork is overwritten.

