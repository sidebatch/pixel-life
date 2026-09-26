# Character rig v1 — 제작 원본

2026-09-25, 내장 image_gen 도구(기본 모드)로 제작했다. 기존 캐릭터를 참고해 의상 아래 몸과 낚시 자세를 제작했고, 원본 파일은 덮어쓰지 않았다. CLI/API fallback이나 API 키는 사용하지 않았다.

| 저장 파일 | 참고 이미지 | 용도 |
| --- | --- | --- |
| walk-body.png | assets/player/player.png | 걷기·대기 몸 원화 |
| chop-body.png | assets/forestry/chop/player-v2.png | 벌목 몸 원화 |
| fish-full.png | 위 두 기존 시트 | 기존 외형의 낚시 준비/대기/당기기 |
| fish-body.png | fish-full.png | 낚시 몸 원화 |
| walk/chop/fish-reference.png | 위 원화와 기존 시트 | 패킹 스크립트가 만든 정규화 기준 그림 |

게임용 최종 파일은 assets/player/rig-v1/의 여섯 레이어 × 세 동작과 tools/의 도구 10종이다. 생성 원본은 런타임에 로드하지 않는다.

## 최종 프롬프트 세트

### walk-body.png

Use case: precise-object-edit. Asset type: transparent pixel-art game BODY TEMPLATE sprite atlas. Edit target: the attached 3-column 4-row walking sprite sheet. Preserve EXACT poses, direction ordering (down/right/left/up), grid cell locations and proportions. Remove brown hair, blue jacket, shirt, dark pants, boots and backpack. Replace with an anatomically simple BALD modest mannequin in a plain beige sleeveless undersuit and plain beige knee-length shorts, bare feet; no anatomical detail, no nudity. Reconstruct the complete round bald head, torso, arms, hands and legs underneath the removed items so outfit layers can later sit above this full body. Keep the same warm skin tone, eyes, very large head and short body proportions. Each of the 12 frames remains in the exact same cell, never merge frames, never add labels or borders. Crisply pixelated game art, flat transparent background with real alpha, no shadows behind figures, no tools. Same narrow physique as original; do NOT enlarge or redesign. Prefer output 768x1024, 3 equal columns x 4 equal rows.

### chop-body.png

Use case: precise-object-edit. Asset type: transparent pixel-art BODY TEMPLATE sprite atlas for chopping animation. Edit target: provided 2-column 4-row atlas. Preserve every pose EXACTLY, especially raised gripping hands in first column and lowered joined hands in second column. Rows down/right/left/up. Keep figure positions inside their cells, all eight same height. Remove hair, blue coat, shirt, dark trousers, boots, and backpack. Reconstruct full round bald head and underlying torso, arms and legs as a modest beige mannequin wearing plain sleeveless beige undersuit and knee-length beige shorts, bare feet. No nudity or anatomical detail. Keep same skin palette, eye shape, head/body proportion and crisp pixel style; no added tools or other objects. Transparent background with real alpha, no labels, no lines, no shadows. Preserve source 640x1280 if possible; two equal columns and four equal rows mandatory.

### fish-full.png

Use case: identity-preserve. Asset type: production transparent PIXEL GAME fishing animation sprite atlas, 3 equal columns by 4 equal rows, prefer 768x1024. References show the EXACT existing adventurer identity and style, NOT output poses. Create same brown spiky hair, same face, blue open jacket/cream shirt/dark trousers/brown boots/brown backpack. Keep same chibi large head and small slim body proportions. EXACTLY 12 isolated sprites, all same body scale and feet at same baseline in each equal cell. Row1 facing DOWN (toward viewer), row2 facing RIGHT, row3 facing LEFT, row4 facing UP (back view). Column1 CAST preparation with both empty gripping hands raised near shoulder, column2 WAIT with both empty gripping hands extended at chest/waist toward water in that row's facing direction, column3 PULL catch with empty gripping hands lifted/retracted toward chest and slight backward lean. Hands MUST be visible and joined around an imaginary rod grip; do NOT draw any rod, axe, fishing line, fish or water. Only character sprites with transparent alpha background, no grid lines/text/shadows. Strong pixel edges, restricted palette matching references. DO NOT change identity or outfit. Maintain constant head/body size across all frames.

### fish-body.png

Use case: precise-object-edit. Asset type: transparent pixel-art body template for layered game fishing sprites. Edit this EXACT 3-column 4-row sprite sheet. Preserve every empty gripping hand pose, character placement, row ordering, head proportions, direction and feet. Remove hair, blue coat, white shirt, trousers, boots and backpack; reconstruct full bald round head and complete torso, arms, legs underneath them as a modest beige mannequin in a sleeveless beige undersuit and beige knee-length shorts, bare feet, NO nudity or anatomical detail. Every pose and hand stays in same position. Especially preserve three columns raised CAST hands / extended WAIT hands / retracted PULL hands. Same restricted skin color palette and crisp pixel style. All twelve isolated equal-scale frames. Do not add fishing rod, axe or any props. Truly transparent alpha background, no grid/text/shadows, 3 columns x 4 rows mandatory.

## 정규화

생성 결과의 해상도·셀 간격이 게임 규격과 같다고 가정하지 않는다. scripts/pack-character-rig.mjs가 인접 셀의 잔여 픽셀을 제외한 주 연결 영역을 선택하고, 최근접 패킹으로 발 기준 (48,88)에 맞춘다. 왼쪽은 정규화된 오른쪽을 반전한다. 현재 옷·머리·배낭은 기준 그림에서 분리한 정확한 픽셀을 사용하고, 생성 몸은 그 아래 영역에 넣는다. 전체 기본 외형의 재합성 일치는 자동 검사 대상이다.
