# 임시 외형 선택 샘플

내장 image_gen 기본 모드로 디자인별 한 번씩 제작했다. CLI/API 키는 사용하지 않았다. 생성 원본은 이 폴더의 *-generated.png에 복사하고 기본 원본은 덮어쓰지 않는다.

## 디자인·배포 파일

- ember: 불꽃 탐험복 — 붉은 닫힌 재킷, 크림색 칼라·금빛 잠금 장식·검은 하네스·바지.
- meadow: 햇살 정원복 — 크림색 셔츠·노란 앞치마·초록 주머니/바지·밝은 작업화.
- ranger: 숲길 등산가방 — 초록 각진 배낭·가로 침낭·갈색 버클 끈.
- berry: 딸기 소풍가방 — 둥근 붉은 딸기·초록 잎·밝은 씨앗 무늬.

최종 경로는 assets/player/temporary-appearance/{ember,meadow,ranger,berry}-{walk,chop,fish,icon}.png. icon은 96×96, walk/fish는 288×384, chop은 192×384이다. 모든 동작 셀은 96×96이다. manifest.json에 정확한 파일 목록을 기록한다.

scripts/pack-temporary-appearance.mjs --references는 기존 부품의 주 연결 영역을 모은 8열×4행(걷기3/벌목2/낚시3, 아래/오른쪽/왼쪽/위) 참고 시트를 만든다. 생성한 의상은 같은 8×4, 가방은 2×2 방향 그림이며 후처리가 기존 부품의 방향/동작별 영역에 최근접 정렬한다. 옷은 기존 알파/손 노출과 이웃 부품 조각을 유지하고, 가방은 정면/측면 가림을 지키되 뒷면의 새 윤곽은 허용한다. 기본 몸·머리·헤어·손·무기·발 기준·모션 데이터는 수정하지 않는다. 새 디자인의 미래 판매/수용량 효과는 구현하지 않는다.

## 정확한 프롬프트 세트

### ember

Use case: precise-object-edit. Asset type: transparent pixel RPG CLOTHING-ONLY animation atlas. Image 1 is the edit target: EXACTLY EIGHT equal columns and FOUR equal rows, 32 garment-only frames. Preserve each garment's pose, location, scale, empty neck/head opening, empty gripping-hand areas, and feet baseline. Columns 1-3 walk, 4-5 axe windup/impact, 6-8 fishing cast/wait/pull. Rows down/right/left/up. Change only garment design into an EMBER EXPLORER outfit: vivid scarlet CLOSED short expedition jacket with cream collar, two bold gold toggles and dark crossed harness, charcoal trousers, dark-red rugged boots. Make the structure clearly different from the original blue open jacket and shirt, not just a color swap. Reinterpret every pose consistently. Preserve the existing exact silhouette and limb arrangement to fit layered sprites. No head, hair, skin, hands, backpack, weapon, person, labels, borders or shadows. Small crisp pixel-art clusters, limited palette matching classic cozy RPG game sprites. Truly transparent alpha outside clothes and inside neck/hand openings. Keep complete 8x4 grid even when frames are small; preferably same 1536x768 canvas. Never collapse the grid or fill blank margins.

### meadow

Use case: precise-object-edit. Asset type: transparent pixel RPG CLOTHING-ONLY animation atlas. Image 1 is the exact edit target: EIGHT equal columns, FOUR equal rows, 32 clothing-only frames. Keep all poses, sizes, positions, neck openings, exposed hand spaces and feet exactly. Columns 1-3 walk, 4-5 axe windup/impact, 6-8 fishing cast/wait/pull; rows down/right/left/up. Replace blue adventurer garments with MEADOW GARDENER work clothes: cream long-sleeved shirt, a distinctive warm GOLDEN-YELLOW full bib apron with broad chest straps and a large dark-green square pocket, moss-green trousers, ivory-and-green work boots. Back view crossed apron straps and tied bow visible around an empty back opening reserved for a separately equipped backpack. This must look like a gardener's apron uniform, totally unlike a jacket; not simply a recolor. Use chunky crisp pixel art and a restrained warm RPG palette. No skin, head, hair, hands, hats, backpack, tools, shadows, text or grid lines. Transparent alpha and exactly preserved clothing outline. Output all 32 separate frames in a regular 8x4 atlas, preferably same 1536x768, do not crop the sheet or rearrange poses.

### ranger

Use case: stylized-concept. Asset type: transparent pixel RPG backpack turnarounds, one new backpack design in FOUR equal cells of a TWO-column TWO-row sheet. Image 1 is STYLE reference only, NOT edit target. Design a FOREST RANGER hiking rucksack, deep moss green canvas, tall rolled beige sleeping mat fastened horizontally across its top, bold tan twin buckled vertical straps, sturdy rectangular bottom, one tiny brass leaf-shaped clasp. Totally different silhouette/details from the plain brown reference bag and from a round red berry bag. TOP LEFT: full decorative outside face of backpack, straight-on (seen when wearer faces away). TOP RIGHT: thin RIGHT-facing side profile, matching roll and straps. BOTTOM LEFT: mirrored LEFT-facing profile. BOTTOM RIGHT: plain wearer-facing rear panel. EXACTLY four views of the SAME pack, no people or body parts. Crisp small pixel art matching a cozy top-down RPG, strong readable clusters, no realistic painting. Same pack height and baseline in each equal cell, centered with generous margins. Genuine transparent background. No text, borders, grid, shadows, hair, clothes, weapon, logos. Prefer square 1024x1024.

### berry

Use case: stylized-concept. Asset type: transparent pixel RPG backpack turnarounds in a TWO-column TWO-row atlas, FOUR views of ONE new design. Image 1 is only a pixel-art STYLE reference, not an edit target. Make a BERRY PICNIC mini backpack: very round plump heart/strawberry-shaped scarlet body, prominent scalloped leafy GREEN cap around its top, three warm ivory seed dots and a cream scalloped bottom trim, short pale-yellow straps. Distinct round silhouette and cute botanical ornament, unmistakably different from rectangular brown leather or green hiking packs. TOP LEFT straight-on full decorative exterior (visible on the character's back); TOP RIGHT thin RIGHT-facing side profile; BOTTOM LEFT thin LEFT-facing profile; BOTTOM RIGHT plain rear panel that touches wearer. Four matching scale views, each centered at equal baseline in its exact equal cell. Crisp low-resolution pixel clusters with dark-burgundy outlines, warm classic cozy RPG palette, no soft painterly rendering. Truly transparent alpha with ample padding. No characters, hands, hair, clothes, hats, other objects, text, shadows, grid lines or logos. Prefer square 1024x1024.
