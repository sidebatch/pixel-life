# NPC 체형 의상 재제작 v2

2026-09-27. Built-in image_gen 편집 모드 사용. CLI/API 키 사용 없음.

후속 연결 기록(2026-09-27): 사용자 의상 수정 요청으로 이 재제작본을 일반 게임에도 연결했다. 가방 카드/상세/NPC 미리보기는 실제 장착 그림과 같은 선택기를 사용한다. 시험 original에서만 옛 옷을 비교한다. 이번 연결에서 원화·최종 PNG·공통 모션/몸/무기는 수정하지 않았다. 아래 시험 한정 설명은 제작 당시 범위다.

## 범위와 보존

- 불꽃 탐험복(outfit.ember), 햇살 정원복(outfit.meadow)을 현재 NPC 체형의 원화에 다시 제작했다. 파란 기본 여행복은 새 체형 제작본을 기준으로 그대로 유지한다.
- 기존 작은 체형 텍스처를 늘리지 않는다. 새 원화의 몸별 색/디테일을 패킹하고 기존 NPC 의상 alpha를 정확히 유지한다. 등록에 필요한 국소 빈 픽셀은 새 원화의 가장 가까운 옷색으로 메우며 원화/패킹 품질을 실제 렌더에서 별도 검토한다.
- 생성 피부는 옷색이 아닌 등록 참고다. 실제 머리/피부/손/몸/가방/무기와 rig는 기존 원본을 사용한다. 왼쪽은 기존 오른쪽 몸의 반전 규약을 따른다.
- 96셀/발48,88/32자세/손잡이/프레임 타이밍/성별/옷 선택 ID/저장을 유지한다. 걷기 정렬과 도끼 방향 보정은 앞서 승인한 시험 동작을 그대로 사용한다.
- 최종 PNG: assets/player/npc-wardrobe-v2/{walk,chop,fish}-{ember,meadow}.png. 원화 6개는 이 폴더에 보존한다. 재현: node scripts/pack-npc-wardrobe-v2.mjs.
- 시험 링크의 보정 동작에서만 새 옷을 사용하고 기존 동작/일반 게임에는 기존 옷을 유지한다. 기존 옷은 덮어쓰거나 삭제하지 않는다.
- 기계 검사는 실루엣/연결/부착/저장에 대한 것으로 미술 선호의 보장이 아니다. Android 실기기 자연스러움은 사용자 확인 필요.

## 최종 프롬프트

### ember/walk

- Image 1 edit target: ../npc-body-v1/motion/walk-generated.png
- Image 2 design reference: ../temporary-appearance/ember-generated.png
- Local output: ember-walk-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Flame Explorer outfit: rich brick/crimson red fitted short jacket, cream V collar/under-shirt, exactly two small brass fastenings on front; charcoal trousers and dark oxblood/brown boots, subtle gold trim. Plain red fabric back with no fake backpack straps. Clear RED sleeves, no blue residue. Do not add ornaments, armor, hats, belts or props. Preserve this existing red outfit identity.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. THREE columns: neutral stance, first stepping pose, opposite stepping pose (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 12 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```

### ember/chop

- Image 1 edit target: ../npc-body-v1/motion/chop-generated.png
- Image 2 design reference: ../temporary-appearance/ember-generated.png
- Local output: ember-chop-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Flame Explorer outfit: rich brick/crimson red fitted short jacket, cream V collar/under-shirt, exactly two small brass fastenings on front; charcoal trousers and dark oxblood/brown boots, subtle gold trim. Plain red fabric back with no fake backpack straps. Clear RED sleeves, no blue residue. Do not add ornaments, armor, hats, belts or props. Preserve this existing red outfit identity.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. TWO columns: raised-hands preparation and forward downward strike (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 8 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```

### ember/fish

- Image 1 edit target: ../npc-body-v1/motion/fish-generated.png
- Image 2 design reference: ../temporary-appearance/ember-generated.png
- Local output: ember-fish-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Flame Explorer outfit: rich brick/crimson red fitted short jacket, cream V collar/under-shirt, exactly two small brass fastenings on front; charcoal trousers and dark oxblood/brown boots, subtle gold trim. Plain red fabric back with no fake backpack straps. Clear RED sleeves, no blue residue. Do not add ornaments, armor, hats, belts or props. Preserve this existing red outfit identity.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. THREE columns: casting preparation, waiting hold and catch/pull (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 12 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```

### meadow/walk

- Image 1 edit target: ../npc-body-v1/motion/walk-generated.png
- Image 2 design reference: ../temporary-appearance/meadow-generated.png
- Local output: meadow-walk-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Sunny Garden outfit: cream long-sleeved shirt under ochre/golden yellow work apron/overalls, one small forest-green rectangular bib pocket on the front, forest-green trousers, brown work boots with cream cuffs. Back has sensible ochre crossed apron straps and a small tied bow at waist, no green bib pocket on the back. Clear cream sleeves, no blue residue. Preserve this existing gardening outfit identity, not a new costume.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. THREE columns: neutral stance, first stepping pose, opposite stepping pose (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 12 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```

### meadow/chop

- Image 1 edit target: ../npc-body-v1/motion/chop-generated.png
- Image 2 design reference: ../temporary-appearance/meadow-generated.png
- Local output: meadow-chop-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Sunny Garden outfit: cream long-sleeved shirt under ochre/golden yellow work apron/overalls, one small forest-green rectangular bib pocket on the front, forest-green trousers, brown work boots with cream cuffs. Back has sensible ochre crossed apron straps and a small tied bow at waist, no green bib pocket on the back. Clear cream sleeves, no blue residue. Preserve this existing gardening outfit identity, not a new costume.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. TWO columns: raised-hands preparation and forward downward strike (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 8 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```

### meadow/fish

- Image 1 edit target: ../npc-body-v1/motion/fish-generated.png
- Image 2 design reference: ../temporary-appearance/meadow-generated.png
- Local output: meadow-fish-generated.png

```text
Use case: precise-object-edit
Asset type: production transparent layered pixel RPG clothing/body pose atlas.
Input images: Image 1 is the EDIT TARGET and exact pose/anatomy/layout contract, with NPC-proportion headless bodies. Image 2 is CLOTHING DESIGN REFERENCE ONLY: its old short body, grid and poses must NOT be copied.
Primary request: replace ONLY the blue clothing on every body in Image 1 with this existing wardrobe design, redrawn naturally for these longer NPC-proportion bodies. Existing Sunny Garden outfit: cream long-sleeved shirt under ochre/golden yellow work apron/overalls, one small forest-green rectangular bib pocket on the front, forest-green trousers, brown work boots with cream cuffs. Back has sensible ochre crossed apron straps and a small tied bow at waist, no green bib pocket on the back. Clear cream sleeves, no blue residue. Preserve this existing gardening outfit identity, not a new costume.
Constraints/invariants: KEEP Image 1 image dimensions, FOUR ROWS, all body positions, neck landmarks, shoulders, elbows, wrists, exposed skin hands, hips, knees, boots' ground line, silhouette and overall scale unchanged. THREE columns: casting preparation, waiting hold and catch/pull (matching Image 1 EXACTLY). Rows strictly front/down, right profile, left profile, rear/up. EXACTLY 12 separate headless clothed bodies. Every pose in Image 1 must remain at the same location and direction. NO HEAD, FACE, HAIR, BACKPACK, WEAPON OR EFFECTS. Skin at neck and hands should remain identical and exposed, with wrists connected to sleeves. The skin is only registration reference, not wardrobe paint.
Style/medium: match the crisp clustered pixel RPG art and lighting of Image 1, dark coherent outlines, restrained readable shading. Fit the collar around the same neck stump, place cuffs exactly at the same wrists, seams and waist at anatomical landmarks. Avoid stretched fabric, mislocated pockets, shapeless blobs and melted textures. Designs must remain consistent in all rows and poses; the pocket should naturally follow torso rotation and arm occlusion. Same unisex body fit for male/female character heads later.
Scene/backdrop: genuinely TRANSPARENT background with no checkerboard, no text, no labels, no grid, no shadow, no scenery, no extra objects. Keep ample transparent spacing between bodies. DO NOT change any motion, anatomy, proportions or limb length to fit the clothes. No remnants of blue jacket. Only garment design/material detail changes.
```
