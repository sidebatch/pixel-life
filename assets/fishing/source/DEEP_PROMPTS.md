# 심해 신규 7종 제작 기록

제작일: 2026-10-08 · Codex 내장 ImageGen. 어종별 투명 원본을 생성하고, 심해뱀장어에 잘못 붙은 초롱만 편집으로 제거했다. 기존 정규화 도구의 `--only`로 새 7종만 96×96에 통합했다. 기존 60종(실러캔스 포함)의 원본과 게임용 픽셀은 변경하지 않았다. CLI/API 키 방식은 사용하지 않았다.

## blobfish

- 최종 원본: `assets/fishing/source/blobfish.png`
- 게임용: `assets/fishing/blobfish.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-d24cd4d9-1195-4e54-805e-c1f608f5b2de.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a pale rose-gray blobfish with a naturally rounded blunt head, small dark eye, broad pectoral fins, softly tapered short tail and gelatinous skin; dignified fish silhouette, not a human face or internet meme.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

## anglerfish

- 최종 원본: `assets/fishing/source/anglerfish.png`
- 게임용: `assets/fishing/anglerfish.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-c5130edd-735f-424b-acb5-e1f4c09f1b8a.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a dark brown deep-sea anglerfish, short rounded body, large jaw with slender teeth, small fins and a curved stalk above the head ending in one small pale luminous lure.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

## deep_eel

- 최종 원본: `assets/fishing/source/deep_eel.png`
- 게임용: `assets/fishing/deep_eel.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-1dbb136e-c505-462b-b0f9-0f33069497f2.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a charcoal-violet deep-sea eel with a long slender curved body, large tapered jaw, tiny pectoral fins, low continuous dorsal fin and whip-like tail.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

최종 편집 프롬프트(원본: `exec-44f3288d-0907-41cc-ad7d-b00681dccf9d.png`):

```text
Use case: precise-object-edit
Input image: existing deep-sea eel game sprite.
Primary request: remove only the luminous lure and the thin curved stalk growing above the eel's head. This species must not have an anglerfish lure. Keep the long charcoal-violet eel, jaw, eye, skin, fins, curled tail, right-facing side profile and pixel-art rendering unchanged. Preserve transparency. Do not add anything. Keep all of the animal within the square with transparent padding.
```

## vampire_squid

- 최종 원본: `assets/fishing/source/vampire_squid.png`
- 게임용: `assets/fishing/vampire_squid.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-2b0af26e-a52e-4cd5-8271-d521d8bcbc31.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a burgundy vampire squid with small oval mantle, two small lateral fins and eight gently spreading webbed arms forming a cloak, dark red skin and restrained amber eye; clearly distinct from a long squid.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

## deep_shark

- 최종 원본: `assets/fishing/source/deep_shark.png`
- 게임용: `assets/fishing/deep_shark.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-c006c5de-c5d8-40b0-84a7-260289644ad8.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a slate charcoal deep-water shark with elongated torpedo body, short pointed snout, small dark eye, gill slits, two low dorsal fins and a long asymmetrical tail.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

## ghost_shark

- 최종 원본: `assets/fishing/source/ghost_shark.png`
- 게임용: `assets/fishing/ghost_shark.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-1f837fea-283d-47d5-a19b-204be2e120f1.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a silver blue-gray chimaera ghost shark with a rounded head, large natural dark eye, broad wing-shaped pectoral fins, tall triangular dorsal fin and a long tapering thin tail; distinct from a conventional shark.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```

## giant_squid

- 최종 원본: `assets/fishing/source/giant_squid.png`
- 게임용: `assets/fishing/giant_squid.png`
- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-15e3c9dd-017b-4b99-b52d-f5399f678bce.png`

최초 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: exactly one a crimson rust giant squid with long tapered mantle, two small triangular tail fins, eight shorter arms and two very long feeding tentacles gently curved within the square, subtle suckers and natural amber eye; whole tentacles visible.
Style/medium: polished hand-rendered pixel art with fine natural skin and fin detail, grounded colors, matching a cozy life-simulation fishing collection.
Composition/framing: strict full side profile, facing right, centered, whole animal and all fins, tail, lure and arms visible, generous transparent padding. Square canvas intended to normalize to a 96x96 game sprite.
Lighting/mood: soft neutral lighting, readable at small size.
Constraints: exactly one animal; genuinely transparent background; clean silhouette; no shadow, water, rocks, plants, bubbles, frame, text, logo or watermark.
Avoid: cartoon human faces, oversized eyes, chibi proportions, photoreal background, multiple animals.
```
