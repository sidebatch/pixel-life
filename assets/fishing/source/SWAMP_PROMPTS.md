# 늪지 7종 제작 기록

제작일: 2026-10-07 · Codex 내장 ImageGen · 각 어종별 투명 원본 1장.

원본과 게임용 96×96 결과의 저장 경로:

| 어종 ID | 원본 | 게임용 결과 |
| --- | --- | --- |
| swamp_eel | `assets/fishing/source/swamp_eel.png` | `assets/fishing/swamp_eel.png` |
| swamp_catfish | `assets/fishing/source/swamp_catfish.png` | `assets/fishing/swamp_catfish.png` |
| piranha | `assets/fishing/source/piranha.png` | `assets/fishing/piranha.png` |
| black_ghost | `assets/fishing/source/black_ghost.png` | `assets/fishing/black_ghost.png` |
| electric_eel | `assets/fishing/source/electric_eel.png` | `assets/fishing/electric_eel.png` |
| arowana | `assets/fishing/source/arowana.png` | `assets/fishing/arowana.png` |
| swamp_king_eel | `assets/fishing/source/swamp_king_eel.png` | `assets/fishing/swamp_king_eel.png` |

## swamp_eel

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one Asian swamp eel (드렁허리): very slender long smooth olive-brown eel with faint dark mottling, a pale cream underside, small rounded head and tapered rounded tail, no prominent paired fins; body gently curved to fit a wide icon, head to the right
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## swamp_catfish

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one swamp catfish (늪메기): broad flat-headed dark olive-brown freshwater catfish, six fine whisker-like barbels, robust smooth body, pale underside and sturdy dark fins, rounded tail
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## piranha

피라냐 원본의 주변 그림자·안개 효과를 정리하기 위해 아래 투명 추출 프롬프트를 한 번 더 적용했다. 최종 게임용 변환에서는 기존 알파 경계 정규화 기준도 함께 적용한다.

```text
Use case: background-extraction
Asset type: transparent 2D game fish sprite source
Input images: Image 1: edit target piranha sprite
Primary request: Remove every shadow, haze, glow, smoke and background pixel outside the fish silhouette. Preserve the piranha itself exactly: its pose, proportions, silver scales, red belly, fins, tail, eye, teeth, crisp black silhouette outline and pixel-art detail.
Constraints: change only the area outside the fish; genuinely transparent background with alpha zero everywhere outside the clean fish silhouette; no cast shadow; no surrounding glow; no scene; no text; no watermark; keep full fins and tail with transparent padding
```

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one red-bellied piranha (피라냐): deep compressed silver-gray body, vivid orange-red lower belly and pectoral region, small strong jaw with a few sharp teeth, dark spotted back and short robust tail
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## black_ghost

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one black ghost knifefish (블랙고스트): long tapered velvety charcoal-black knife-shaped body, narrow white forehead stripe, two white bands near the thin tail, continuous elegant rippling anal fin beneath the body; subtle silver-gray edge highlights keep the dark silhouette readable
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## electric_eel

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one electric eel (전기뱀장어): long thick cigar-shaped brown charcoal body, broad rounded head, muted yellow-cream underside, continuous low anal fin, tapered rounded tail and no tall dorsal fin; a gently curved body fitting a wide icon, no lightning effects
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## arowana

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one silver arowana (아로와나): long elegant silver freshwater fish with large overlapping pearlescent plate-like scales, an upward-facing mouth with two small barbels, long fins toward the rear and a rounded fan-shaped tail, subtle steel-blue back
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```

## swamp_king_eel

```text
Use case: stylized-concept
Asset type: 2D game fish collection sprite source
Primary request: one fantasy swamp king eel (늪왕장어): imposing long thick eel with dark moss-green and muted violet scales, pale bronze underside, broad solemn head, restrained amber-gold eye, a low flowing dorsal fin and tapered tail; gently curved body fitting a wide icon, all mysterious shimmer stays inside the fish silhouette, no crown or accessories
Style/medium: polished hand-rendered pixel art with fine natural scale and fin detail, grounded colors, matching a cozy life-simulation fishing collection
Composition/framing: strict full side profile, facing right, fish centered, entire fins and tail visible, generous transparent padding
Lighting/mood: soft neutral game-sprite lighting
Constraints: exactly one fish; genuinely transparent background; crisp clean silhouette; no cast shadow; no water; no rocks; no plants; no bubbles; no frame; no text; no logo; no watermark
Avoid: cartoon face, oversized eyes, chibi proportions, photorealistic background, multiple fish
```
