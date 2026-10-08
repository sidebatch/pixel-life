# 항구·어선 v2 스타일 수정 기록

제작일: 2026-10-08 · **내장 ImageGen / 이미지 생성 스킬 / style-transfer 편집**. API 키·CLI는 사용하지 않았다.

사용자가 Android 화면에서 v1이 사진을 축소한 듯 세밀하고 캐릭터와 다른 그림체라고 지적해, 5종을 기존 캐릭터의 단순한 픽셀 덩어리·명암·윤곽을 참고해 다시 그렸다. 각각 Image 1은 v1 편집 대상, Image 2는 `assets/player/player.png` 스타일 참고다. 캐릭터 자체를 생성/변경하지 않는다. 색만 조정하거나 기존 그림을 모자이크 처리한 것이 아니라 표현을 다시 그린다.

원본과 v1은 보존한다. 게임용 투명 PNG는 `node scripts/process-harbor-assets.mjs v2`로 알파 경계 정리·최근접 크기 정규화만 한다. 배치·충돌·낚시·운항·확률·경제·음향·저장은 변경하지 않는다. 프롬프트의 색 수는 스타일 지침이지 최종 PNG의 실제 색 수 보장은 아니다.

## harbor-boat-v2

- 편집 대상: `assets/harbor/harbor-boat-v1.png`
- 스타일 참고: `assets/player/player.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-c160dec7-ba52-4d96-96b4-57bf690aa1b4.png`
- 보관 원본: `assets/harbor/source/harbor-boat-v2.png`
- 게임용 최종: `assets/harbor/harbor-boat-v2.png` (192×168)

최종 프롬프트:

```text
Use case: style-transfer
Asset type: transparent top-down life-sim game environment sprite, replacement v2
Input images: Image 1 is the edit target; Image 2 is the actual game PLAYER SPRITE SHEET used ONLY as the pixel language/style reference. Do not include or modify a character in the output.
Primary request: Redraw Image 1 with the much simpler, expressive hand-placed pixel language of Image 2. Preserve the target's subject, orientation, usable footprint and centered isolated composition, NOT its excessive surface detail.
Style: genuine clean 16-bit cozy RPG pixel sprite. Visibly deliberate square pixel clusters, sturdy dark brown outlines, broad readable flat color regions, only a base, shade and highlight per material. About 24-32 colors total. Make it feel drawn for the character's world, NOT a realistic painted object filtered into pixels. Eliminate tiny stippled highlights, realistic wear, micro-grain, bolts, busy cables and noisy texture. Larger simple features, warm gentle proportions. At intended small game size each feature must be readable.
Palette: keep warm honey/chestnut timber, ivory, muted teal, restrained blue windows, matching the character's soft earthy palette.
Constraints: only one requested isolated object, genuine transparent background. No characters, floor scene, water, cast ground shadow, text, logos, watermark, gradients, photorealism, anti-aliased vector illustration, glossy 3D, or simulated photographic texture. Keep generous transparent margin; no cropped silhouette.
Subject constraints: a modest working fishing boat, stern LEFT, rounded bow RIGHT, long axis horizontal, high front/top-down RPG view. Preserve the ivory/teal hull, open warm timber deck, left-middle compact cabin with teal roof and blue windows, and rubber fenders. Simplify the fishing equipment to one sturdy mast and one clean hoist boom, one rope coil and a couple of broad box shapes. Remove the fine net/cable clutter. No sails. Clear chunky silhouette. Logical sprite resolution 192x168, hull body wider than tall as the target.
```

## harbor-ticket-booth-v2

- 편집 대상: `assets/harbor/harbor-ticket-booth-v1.png`
- 스타일 참고: `assets/player/player.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-7eec5aa9-28b0-428a-884f-e7f378ab2c3d.png`
- 보관 원본: `assets/harbor/source/harbor-ticket-booth-v2.png`
- 게임용 최종: `assets/harbor/harbor-ticket-booth-v2.png` (96×88)

최종 프롬프트:

```text
Use case: style-transfer
Asset type: transparent top-down life-sim game environment sprite, replacement v2
Input images: Image 1 is the edit target; Image 2 is the actual game PLAYER SPRITE SHEET used ONLY as the pixel language/style reference. Do not include or modify a character in the output.
Primary request: Redraw Image 1 with the much simpler, expressive hand-placed pixel language of Image 2. Preserve the target's subject, orientation, usable footprint and centered isolated composition, NOT its excessive surface detail.
Style: genuine clean 16-bit cozy RPG pixel sprite. Visibly deliberate square pixel clusters, sturdy dark brown outlines, broad readable flat color regions, only a base, shade and highlight per material. About 24-32 colors total. Make it feel drawn for the character's world, NOT a realistic painted object filtered into pixels. Eliminate tiny stippled highlights, realistic wear, micro-grain, bolts, busy cables and noisy texture. Larger simple features, warm gentle proportions. At intended small game size each feature must be readable.
Palette: keep warm honey/chestnut timber, ivory, muted teal, restrained blue windows, matching the character's soft earthy palette.
Constraints: only one requested isolated object, genuine transparent background. No characters, floor scene, water, cast ground shadow, text, logos, watermark, gradients, photorealism, anti-aliased vector illustration, glossy 3D, or simulated photographic texture. Keep generous transparent margin; no cropped silhouette.
Subject constraints: one small cozy wooden harbor ticket kiosk, teal gabled roof, ivory wall, large simple dark service window, timber counter, small front steps. Preserve centered anchor SYMBOL above the window (no letters), roof alignment and entrance facing DOWN toward viewer. Remove ornate roof granules, tiny lamps, plants, chimney smoke and stone microtextures. Simple large roof bands rather than dozens of individual shiny tiles. Logical sprite resolution 96x88. Match the simple chunky shading of the player, not a miniature architectural rendering.
```

## voyage-deck-v2

- 편집 대상: `assets/harbor/voyage-deck-v1.png`
- 스타일 참고: `assets/player/player.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-d870337d-8941-472c-8550-0edaa3adba44.png`
- 보관 원본: `assets/harbor/source/voyage-deck-v2.png`
- 게임용 최종: `assets/harbor/voyage-deck-v2.png` (216×336)

최종 프롬프트:

```text
Use case: style-transfer
Asset type: transparent top-down life-sim game environment sprite, replacement v2
Input images: Image 1 is the edit target; Image 2 is the actual game PLAYER SPRITE SHEET used ONLY as the pixel language/style reference. Do not include or modify a character in the output.
Primary request: Redraw Image 1 with the much simpler, expressive hand-placed pixel language of Image 2. Preserve the target's subject, orientation, usable footprint and centered isolated composition, NOT its excessive surface detail.
Style: genuine clean 16-bit cozy RPG pixel sprite. Visibly deliberate square pixel clusters, sturdy dark brown outlines, broad readable flat color regions, only a base, shade and highlight per material. About 24-32 colors total. Make it feel drawn for the character's world, NOT a realistic painted object filtered into pixels. Eliminate tiny stippled highlights, realistic wear, micro-grain, bolts, busy cables and noisy texture. Larger simple features, warm gentle proportions. At intended small game size each feature must be readable.
Palette: keep warm honey/chestnut timber, ivory, muted teal, restrained blue windows, matching the character's soft earthy palette.
Constraints: only one requested isolated object, genuine transparent background. No characters, floor scene, water, cast ground shadow, text, logos, watermark, gradients, photorealism, anti-aliased vector illustration, glossy 3D, or simulated photographic texture. Keep generous transparent margin; no cropped silhouette.
Subject constraints: an EMPTY continuous rectangular boat deck viewed straight top-down, long axis vertical. Preserve the target rectangle and external teal hull / ivory railing with narrow rim. All usable floor EMPTY; no cabin, people, crates, masts, benches or obstacles. Honey brown wooden floor drawn in broad simple planks with just short clean joint marks, not wood grain or texture. Simple flat railing and only a few chunky side tire fenders / two small red-white life rings, all confined to the OUTSIDE narrow perimeter. Keep the wooden floor reaching near the edges so the character can stand on the outermost tiles. Target logical resolution 216x336, ratio9:14. Source must have a 14% width rim at most; no arrows or water.
```

## voyage-cabin-v2

- 편집 대상: `assets/harbor/voyage-cabin-v1.png`
- 스타일 참고: `assets/player/player.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-d488fc2d-ef26-43df-9e8d-484c50bb226f.png`
- 보관 원본: `assets/harbor/source/voyage-cabin-v2.png`
- 게임용 최종: `assets/harbor/voyage-cabin-v2.png` (144×132)

최종 프롬프트:

```text
Use case: style-transfer
Asset type: transparent top-down life-sim game environment sprite, replacement v2
Input images: Image 1 is the edit target; Image 2 is the actual game PLAYER SPRITE SHEET used ONLY as the pixel language/style reference. Do not include or modify a character in the output.
Primary request: Redraw Image 1 with the much simpler, expressive hand-placed pixel language of Image 2. Preserve the target's subject, orientation, usable footprint and centered isolated composition, NOT its excessive surface detail.
Style: genuine clean 16-bit cozy RPG pixel sprite. Visibly deliberate square pixel clusters, sturdy dark brown outlines, broad readable flat color regions, only a base, shade and highlight per material. About 24-32 colors total. Make it feel drawn for the character's world, NOT a realistic painted object filtered into pixels. Eliminate tiny stippled highlights, realistic wear, micro-grain, bolts, busy cables and noisy texture. Larger simple features, warm gentle proportions. At intended small game size each feature must be readable.
Palette: keep warm honey/chestnut timber, ivory, muted teal, restrained blue windows, matching the character's soft earthy palette.
Constraints: only one requested isolated object, genuine transparent background. No characters, floor scene, water, cast ground shadow, text, logos, watermark, gradients, photorealism, anti-aliased vector illustration, glossy 3D, or simulated photographic texture. Keep generous transparent margin; no cropped silhouette.
Subject constraints: compact fishing boat wheelhouse viewed from high front/top-down RPG angle. Preserve wide ivory wall, shallow muted teal roof, three broad blue bridge windows, centered dark teal front door facing DOWN, and one small roof antenna. Replace realistic paneled wall/weathering/window glare with clean broad 2-3-tone blocks and restrained dark outline. Remove miniature rivets, ropes, lamps and cabling. No deck or hull, no flag (game adds an earned flag). Closed door bottom aligned with cabin base. Target logical sprite resolution144x132.
```

## harbor-crate-v2

- 편집 대상: `assets/harbor/harbor-crate-v1.png`
- 스타일 참고: `assets/player/player.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-5096c675-4eae-44ce-afeb-7edbfb5dbd66.png`
- 보관 원본: `assets/harbor/source/harbor-crate-v2.png`
- 게임용 최종: `assets/harbor/harbor-crate-v2.png` (32×32)

최종 프롬프트:

```text
Use case: style-transfer
Asset type: transparent top-down life-sim game environment sprite, replacement v2
Input images: Image 1 is the edit target; Image 2 is the actual game PLAYER SPRITE SHEET used ONLY as the pixel language/style reference. Do not include or modify a character in the output.
Primary request: Redraw Image 1 with the much simpler, expressive hand-placed pixel language of Image 2. Preserve the target's subject, orientation, usable footprint and centered isolated composition, NOT its excessive surface detail.
Style: genuine clean 16-bit cozy RPG pixel sprite. Visibly deliberate square pixel clusters, sturdy dark brown outlines, broad readable flat color regions, only a base, shade and highlight per material. About 24-32 colors total. Make it feel drawn for the character's world, NOT a realistic painted object filtered into pixels. Eliminate tiny stippled highlights, realistic wear, micro-grain, bolts, busy cables and noisy texture. Larger simple features, warm gentle proportions. At intended small game size each feature must be readable.
Palette: keep warm honey/chestnut timber, ivory, muted teal, restrained blue windows, matching the character's soft earthy palette.
Constraints: only one requested isolated object, genuine transparent background. No characters, floor scene, water, cast ground shadow, text, logos, watermark, gradients, photorealism, anti-aliased vector illustration, glossy 3D, or simulated photographic texture. Keep generous transparent margin; no cropped silhouette.
Subject constraints: one simple square timber cargo crate seen front-on from high top-down RPG angle. Three warm wood boards on the front, clear diagonal wooden brace, top visible, two simple dark corner brackets. Remove coiled rope, salt/wear texture and fine metal highlights. Target logical sprite resolution32x32; chunky broad 2-3 tone wood regions, simple 1logicalpixel dark outline. No floor or ground shadow.
```
