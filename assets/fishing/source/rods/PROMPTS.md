# 낚싯대 7~10단계 그림·프롬프트 기록

정리일: 2026-10-09. 제작: 내장 image_gen 도구(imagegen 스킬), CLI/API 우회 없음.

기존 deepwater.png와 expert.png는 그림체/방향 참고 이미지이며 수정 대상이 아니다. 각 장비마다 별도 요청을 사용했고 모두 실제 투명 배경으로 생성했다. 원본은 source/rods에 복사해 보존했다. `scripts/pack-fishing-rod-expansion.mjs`는 새 그림만 알파 범위 자르기·최근접 96×96 정규화·들고 있는 장비의 장식 줄 클리핑을 한다. 캐릭터 본체/손잡이/기존 장비 앵커를 바꾸지 않는다.

최종 저장 파일은 각 id마다 `assets/fishing/rods/<id>.png`(상점/가방), `assets/player/rig-v1/tools/rod-<id>.png`(실제 장착), `assets/fishing/source/rods/<id>.png`(투명 생성 원본)이다.

## tidal — Tide Rod

저장: `assets/fishing/rods/tidal.png`, `assets/player/rig-v1/tools/rod-tidal.png`, `assets/fishing/source/rods/tidal.png`.

최종 생성 프롬프트:

```text
Use case: stylized-concept. Asset type: a single transparent pixel RPG inventory fishing-rod sprite. Input images 1 and 2 are STYLE AND ORIENTATION REFERENCES ONLY, not edit targets. Generate a new distinctive fishing rod. Match their cozy handcrafted 2D pixel-art item style, readable chunky clusters and dark outlines, not photorealistic or 3D. Single whole rod with reel, grip and gently curved tip; grip at bottom-left, tip at top-right, identical diagonal orientation to references. Tip must stay near top-right, dangling fishing line and tiny hook can be at far right for the inventory icon. Center it with about 8% clear padding. Keep the reel near the lower-left handle, clear slender shaft, no unrelated objects. Designed to remain readable when normalized to a 96px icon. Genuine transparent RGBA background, no black or white backdrop, no ground shadow, no text, no letters, no labels, no border, no watermark, no aura. Palette and distinguishing design: Sea-green and teal shaft, brushed copper fittings, compact bronze reel, cork-and-dark-teal handle; subtle wave-shaped inlay. Crafted practical ocean tool.
```

## tempest — Tempest Rod

저장: `assets/fishing/rods/tempest.png`, `assets/player/rig-v1/tools/rod-tempest.png`, `assets/fishing/source/rods/tempest.png`.

최종 생성 프롬프트:

```text
Use case: stylized-concept. Asset type: a single transparent pixel RPG inventory fishing-rod sprite. Input images 1 and 2 are STYLE AND ORIENTATION REFERENCES ONLY, not edit targets. Generate a new distinctive fishing rod. Match their cozy handcrafted 2D pixel-art item style, readable chunky clusters and dark outlines, not photorealistic or 3D. Single whole rod with reel, grip and gently curved tip; grip at bottom-left, tip at top-right, identical diagonal orientation to references. Tip must stay near top-right, dangling fishing line and tiny hook can be at far right for the inventory icon. Center it with about 8% clear padding. Keep the reel near the lower-left handle, clear slender shaft, no unrelated objects. Designed to remain readable when normalized to a 96px icon. Genuine transparent RGBA background, no black or white backdrop, no ground shadow, no text, no letters, no labels, no border, no watermark, no aura. Palette and distinguishing design: Graphite-charcoal shaft, bright silver bands, restrained amber accents, robust silver-and-amber reel and a dark wrapped handle. Practical storm-resistant tool, tiny engraved zigzag motif, no lightning glow.
```

## abyssal — Abyss Rod

저장: `assets/fishing/rods/abyssal.png`, `assets/player/rig-v1/tools/rod-abyssal.png`, `assets/fishing/source/rods/abyssal.png`.

최종 생성 프롬프트:

```text
Use case: stylized-concept. Asset type: a single transparent pixel RPG inventory fishing-rod sprite. Input images 1 and 2 are STYLE AND ORIENTATION REFERENCES ONLY, not edit targets. Generate a new distinctive fishing rod. Match their cozy handcrafted 2D pixel-art item style, readable chunky clusters and dark outlines, not photorealistic or 3D. Single whole rod with reel, grip and gently curved tip; grip at bottom-left, tip at top-right, identical diagonal orientation to references. Tip must stay near top-right, dangling fishing line and tiny hook can be at far right for the inventory icon. Center it with about 8% clear padding. Keep the reel near the lower-left handle, clear slender shaft, no unrelated objects. Designed to remain readable when normalized to a 96px icon. Genuine transparent RGBA background, no black or white backdrop, no ground shadow, no text, no letters, no labels, no border, no watermark, no aura. Palette and distinguishing design: Midnight indigo shaft, antique silver fittings, muted amethyst accents, a sturdy ornate silver reel with one small purple stone, dark handle; subtle deep-sea geometric inlay.
```

## aurora — Aurora Rod

저장: `assets/fishing/rods/aurora.png`, `assets/player/rig-v1/tools/rod-aurora.png`, `assets/fishing/source/rods/aurora.png`.

최종 생성 프롬프트:

```text
Use case: stylized-concept. Asset type: a single transparent pixel RPG inventory fishing-rod sprite. Input images 1 and 2 are STYLE AND ORIENTATION REFERENCES ONLY, not edit targets. Generate a new distinctive fishing rod. Match their cozy handcrafted 2D pixel-art item style, readable chunky clusters and dark outlines, not photorealistic or 3D. Single whole rod with reel, grip and gently curved tip; grip at bottom-left, tip at top-right, identical diagonal orientation to references. Tip must stay near top-right, dangling fishing line and tiny hook can be at far right for the inventory icon. Center it with about 8% clear padding. Keep the reel near the lower-left handle, clear slender shaft, no unrelated objects. Designed to remain readable when normalized to a 96px icon. Genuine transparent RGBA background, no black or white backdrop, no ground shadow, no text, no letters, no labels, no border, no watermark, no aura. Palette and distinguishing design: Pearl-white and glacier-blue shaft, polished silver fittings, teal and rose iridescent accents confined to solid surfaces, elegant silver reel with a small ice-blue gem, pale wrapped handle. No external glow or particles.
```
