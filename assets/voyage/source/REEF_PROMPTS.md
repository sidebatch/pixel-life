# 암초·산호 도트 그림 제작 기록

제작일: 2026-10-08 · **Codex 내장 ImageGen / 이미지 생성 스킬**. 새 그림 생성에는 `stylized-concept`, 암초 외곽 정리에는 `background-extraction` 편집을 사용했다. CLI/API 키는 사용하지 않았다.

사용자가 `8147.jpg`의 암초·십자 산호가 배와 다른 임시 도형처럼 보인다고 확인해, 그 두 장식만 실제 투명 도트 PNG로 교체했다. 다른 섬·암벽·빙하·선박·물결과 항구 v2 자산은 그대로다. 새 그림은 한 번 장면 캐시에 합성하며 충돌·낚시·승선권·시간·해금·경제·저장은 변경하지 않는다.

## 참고 이미지 역할

1. `assets/harbor/harbor-boat-v2.png` — 현재 배의 픽셀 윤곽·명암 스타일.
2. `assets/player/player.png` — 실제 캐릭터의 도트 표현. 캐릭터 자체를 생성/변경하지 않는다.
3. 사용자 첨부 `8147.jpg` — 바꿀 암초·산호의 종류와 게임 화면 참고이며 UI/비/바다/휴대폰을 결과에 복제하지 않는다.

`node scripts/process-voyage-reef-assets.mjs`는 저장소 기존 PNG 도구로 알파 경계 정리와 최근접 크기 정규화만 한다. 색칠·필터·강제 배경 제거는 하지 않는다. 빛 번짐 정리는 내장 이미지 편집으로 수행했고, 실제 게임의 맑음/비/밤 화면에서 투명 경계를 확인한다.

## voyage-reef-v1

- 최종 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-b9f77e46-b1ec-4ff9-8fa1-ad4d2c97f50c.png`
- 보관 원본: `assets/voyage/source/voyage-reef-v1.png`
- 게임용 최종: `assets/voyage/voyage-reef-v1.png` (128×88)
- 장면 합성 크기: 120×82, opacity .92 (기존 반해상도 장면 레이어, 실제 게임에서는 2배 투영)

생성 프롬프트:

```text
Use case: stylized-concept
Asset type: isolated transparent pixel-art sprite for a cozy top-down life simulation
Input images: Image 1 (fishing boat) and Image 2 (actual player sprite sheet) are STYLE REFERENCES ONLY. Image 3 is a gameplay screenshot showing the WRONG placeholder reef/cross-shaped coral, for SUBJECT AND INTEGRATION CONTEXT ONLY. Do not reproduce the boat, character, screenshot, water background, rain, UI or phone.
Primary request: Draw a new authentic hand-placed pixel-art marine decoration matching the boat and character's warm readable RPG sprite language. This replaces the primitive green polygon rocks and cross-shaped coral seen in Image 3.
Style/medium: clean 16-bit cozy RPG sprite, deliberate crisp square pixel clusters, clear restrained dark outline, readable natural form, three broad tones per material, modest detail. It must be DRAWN pixel art, not photographs reduced to pixels, not flat polygon clipart, not a geometric diagram. At small game size it should still show natural rock planes and branching coral. No noisy microtextures, realistic speckled grain, smooth gradients, shiny 3D or overly busy objects.
Palette: muted slate gray/olive stone with deep desaturated blue-brown outlines and soft pale gray highlights; muted salmon-peach coral, restrained sage/teal seaweed. Gentle top-left daylight consistent with the referenced game sprites.
Composition: high front/top-down RPG view, centered full silhouette, no isometric diamond base, complete object with transparent margin.
Constraints: genuinely transparent background. No surrounding water, foam/wake halo, seabed floor, sand pedestal, large geometric base patch, cast ground shadow, people, animals, text, logos, border, watermark or UI. No plus-sign/cross-shaped coral; coral must branch organically. Exactly one requested asset, not a sheet of variations.
Subject: One compact, irregular horizontal reef cluster of five varied LOW coastal rocks with rounded worn silhouettes, visible fractured planes and a few calm crack marks. Gaps between some rocks must remain transparent. Two small naturally branching antler/fan coral colonies tucked BETWEEN the stones and a couple of short seaweed tufts, all part of one cohesive reef sprite. Rocks occupy most of the silhouette, no enormous coral fan and no tall cliff or land island. About 3:2 wide-to-high cluster, intended logical sprite128x88, displayed about240x160 game pixels. Do not pack every gap with details; emphasize readable shapes like the boat.
```

초안은 `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-d80a6358-8e15-4e49-8364-62b2970560b8.png`이며 최종 PNG에는 사용하지 않는다. 위 최종본을 만든 외곽 정리 프롬프트:

```text
Use case: background-extraction
Input image: the provided reef sprite is the EDIT TARGET.
Primary request: remove ONLY the soft peripheral glow, haze and dark cast shadow surrounding this reef. Make every pixel outside the crisp physical rock/coral/seaweed silhouettes fully transparent. The blurred cyan/orange/gray aura around the reef must be completely gone, and transparent gaps must be genuinely transparent.
Preserve invariants: keep the current rock positions, rock planes/cracks, coral branch shapes, seaweed, color palette, strong dark pixel outlines, clean pixel style and complete composition unchanged. Keep the exact physical foreground design. Do not add water, foam, new objects, background, pedestal or ground.
Constraints: genuinely transparent background, no peripheral glow/haze/drop shadow at all, no matte edge/halo, no text or watermark. This is cleanup, not a redesign.
```

## voyage-coral-v1

- 최종 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-73c66eff-4aaa-4b07-bab8-b3fb951b5168.png`
- 보관 원본: `assets/voyage/source/voyage-coral-v1.png`
- 게임용 최종: `assets/voyage/voyage-coral-v1.png` (48×48)
- 장면 합성 크기: 38×38, opacity .82 (기존 반해상도 장면 레이어, 실제 게임에서는 2배 투영)

생성 프롬프트:

```text
Use case: stylized-concept
Asset type: isolated transparent pixel-art sprite for a cozy top-down life simulation
Input images: Image 1 (fishing boat) and Image 2 (actual player sprite sheet) are STYLE REFERENCES ONLY. Image 3 is a gameplay screenshot showing the WRONG placeholder reef/cross-shaped coral, for SUBJECT AND INTEGRATION CONTEXT ONLY. Do not reproduce the boat, character, screenshot, water background, rain, UI or phone.
Primary request: Draw a new authentic hand-placed pixel-art marine decoration matching the boat and character's warm readable RPG sprite language. This replaces the primitive green polygon rocks and cross-shaped coral seen in Image 3.
Style/medium: clean 16-bit cozy RPG sprite, deliberate crisp square pixel clusters, clear restrained dark outline, readable natural form, three broad tones per material, modest detail. It must be DRAWN pixel art, not photographs reduced to pixels, not flat polygon clipart, not a geometric diagram. At small game size it should still show natural rock planes and branching coral. No noisy microtextures, realistic speckled grain, smooth gradients, shiny 3D or overly busy objects.
Palette: muted slate gray/olive stone with deep desaturated blue-brown outlines and soft pale gray highlights; muted salmon-peach coral, restrained sage/teal seaweed. Gentle top-left daylight consistent with the referenced game sprites.
Composition: high front/top-down RPG view, centered full silhouette, no isometric diamond base, complete object with transparent margin.
Constraints: genuinely transparent background. No surrounding water, foam/wake halo, seabed floor, sand pedestal, large geometric base patch, cast ground shadow, people, animals, text, logos, border, watermark or UI. No plus-sign/cross-shaped coral; coral must branch organically. Exactly one requested asset, not a sheet of variations.
Subject: One SMALL coral outcrop: two organically branching salmon-peach coral sprigs with uneven forked antler/fan branches, attached to one low slate-gray rock, with one tiny sage seaweed tuft. Clear upright branching silhouette but viewed at the same high RPG angle as the boat. Compact, about square, intended logical sprite48x48, displayed about64x64 game pixels. It must not resemble a plus-sign, tree trunk, medical cross, giant aquarium sculpture or detailed coral photograph.
```
