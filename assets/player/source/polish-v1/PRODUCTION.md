# 승인된 기본 캐릭터 — 게임용 부품 제작 기록

사용자 승인: 방향별 디자인을 보고 ‘좋아요. 맘에들어요’라고 확인했다. 갈색 머리·파란 여행복·갈색 가방의 개선안을 기존 모션 규격으로 제작·연결했다.

## 도구·입력·최종 저장 경로

내장 image_gen 기본 모드, 투명 배경, 디자인별 별도 호출. CLI/API 키 미사용. 승인 원화는 turnaround-generated.png이며 각 입력은 view_image로 확인했다. head-hair-reference.png는 기존 기본 머리 부품 위치를 정렬한 4열2행 제작 참고다. 옷의 위치/자세 참고는 ../temporary-appearance/outfit-reference.png, 스타일 참고는 승인 원화다.

- head-hair-generated.png: 새 얼굴과 헤어 4방향×2부품 원화. 생성 원본 exec-7b28e3cf-179a-495d-8f08-972c2abda75c.png.
- outfit-generated.png: 옷 8열4행32자세 원화. 생성 원본 exec-b2c46f2b-12f3-47e3-8da0-0e35b95b33c2.png.
- backpack-generated.png: 기본 가방 2열2행 원화. 생성 원본 exec-2e04eb6d-43f4-4601-8f6d-e1a025ae8d68.png.
- 위 생성 원본 위치: C:/Users/leeks/.codex/generated_images/01a0c9a8-dfb3-78e2-9430-89502a903928/. 이 폴더에 원본을 복사·보존했다.
- 게임용: assets/player/polish-v1/{walk,chop,fish}-{head,hair,outfit,backpack}.png(12개), outfit-icon.png / backpack-icon.png(2개). 정확한 목록은 같은 폴더 manifest.json. 걷기/낚시288×384, 벌목192×384, 아이콘96×96.

## 규격과 분리 원칙

scripts/pack-character-polish.mjs를 실행하면 재현한다. 96px 셀·발(48,88)·표시100px를 유지한다. 몸과 그립 손은 기존 rig-v1 PNG, 무기와 좌표/각도/동작 타이밍은 기존 src/character.js 및 character-rig-data.js 그대로다. 생성 원화를 기존 옷의 외곽선 전체에 강제로 잘라 넣지 않는다. 옷의 주 영역에 정렬하고 노출 피부/그립 위치만 보존하며, 옛 분리기의 머리 잔여 픽셀(y54 위)을 새 옷에 남기지 않는다.

머리/헤어는 방향별 공통 크기를 사용하고 프레임마다 크기를 바꾸지 않는다. 기존 원화의 위치 차이만 따르며 벌목에서는 기존 walk0 머리/헤어+neck headMotion 경로를 계속 쓴다. 생성기가 헤어 부품에 포함한 밝은 귀 피부 픽셀은 Head로 옮겨 헤어 시험 염색의 대상에서 제외했다. 가방은 앞/옆의 기존 가림과 그립 영역을 지키고 측면 타격의 윗부분을 Backpack으로 유지한다. 머리/얼굴은 실제 body/hair 부품 경로, 기본 옷/가방은 기존 outfit.traveler / pack.traveler ID로 교체한다. 임시 옷/가방은 그대로 유지하고 별도로 함께 착용할 수 있다. 돈·레벨·인벤토리·소유/착용·저장 키/버전 변경 없음.

원본 assets/player/rig-v1/ 및 그 원화, 도구 PNG, 모션 코드/데이터는 덮어쓰지 않았다. 원래 pack-character-rig.mjs를 실행해도 polish-v1은 덮어쓰지 않는다. 신규 남녀 체형·긴 머리·치마·상점은 이번 범위가 아니다.

## 검증 범위

- qa-character-polish: 원본 몸/손/리그/무기/렌더러 불변, 새14에셋·32자세·머리 크기 고정·손 노출·기본 가방 정면 가림·좌우 타격 cap86픽셀.
- qa-character: 기본/두 임시 세트/시험 색상 세트별32자세·10무기 및 실제 낚시 획득/XP·벌목20피해·허공 Space/Z/터치.
- qa-temporary-wardrobe:9조합288자세·무기 변환 불변·기존4321코인/80XP 저장/낚싯대 장착 유지·모바일 카드/i/재접속.
- qa-appearance: 시험 외형256자세·알파 일치·저장 안전. qa-held-tool: 무기1개/물가 도끼/낚싯대 전용 낚시. qa-inventory-ui:393×780/320×568/PC·외형/i/포커스/뒤로·앞으로/저장 실패 복원.
- 실제 Android 기기 확인은 별도다. Chrome 모의 결과를 Android 실기기 통과라고 표현하지 않는다.

## 정확한 프롬프트 세트

### Head / Hair

Use case: precise-object-edit. Asset type: pixel RPG modular HEAD and HAIR layer sheet. Image1 is the EXACT edit target layout, 4 equal columns and 2 equal rows. Columns DOWN/front, RIGHT/profile, LEFT/profile, UP/back. Top row is bald head/face ONLY; bottom row is HAIR ONLY on transparent alpha, with face and skin cut out so it overlays the top row. Image2 is the USER APPROVED character identity/style: preserve its brown rounded layered locks, warm highlights, clean swept bangs, friendly large dark eyes and cream skin. Upgrade image1 parts to match image2, NOT original spiky noisy haircut. Keep exact head sizes, locations, eye/neck alignment per column and geometry anchors from image1. No body, hands, clothing, backpack, weapons, shadows, text, extra faces, hats or duplicated rows. Head faces have same hairless skull outline as target with improved eyes and restrained skin shading; hair follows approved image's rounded articulated brown silhouette and big readable highlight clusters. Keep front and profiles' face openings transparent on bottom hair row, back hair covers skull. Both layers must assemble into SAME approved head, with identical registration within each corresponding grid cell. Truly transparent background. Crisp limited palette pixel art rendered enlarged, preferably same1536x768 4x2 atlas. Exactly8 parts, NOT8 whole heads.

### Outfit

Use case: precise-object-edit. Asset type: transparent CLOTHING-ONLY pixel RPG animation atlas. Image1 is exact 8-column4-row pose/layout edit target. Image2 is approved character/style reference ONLY. Columns walk idle/stepA/stepB, axe windup/impact, fishing raised hands/wait/pull. Rows DOWN, RIGHT, LEFT, UP. Preserve ALL32 exact limb poses, anchor positions, size, feet baseline and empty exposed-hand/neck openings from image1. Render approved blue travel outfit as garment-only parts: tailored muted blue short jacket with cream turned-back cuffs and small dark seams, cream linen shirt collar/placket, modest brown belt with square brass buckle, dark navy trousers, shaped brown leather boots with strap and highlights. Make nuanced readable shading and tailored edges like approved image; retain three-dimensional fold/seam logic per pose, not random texture. No head/hair/face/skin/hands/backpack/shoulder straps/weapons/hat/background/shadow/text. Some sleeves raised overhead in windup/casting, hands absent as target. Keep complete32frames in regular8x4 grid, approximately1536x768, silhouette may get refined by a few logical pixels but hands, body and feet geometry cannot move. Truly transparent alpha. Pixel-art, no smooth vector, don't collapse pose sheet.

### Backpack

Use case: precise-object-edit. Asset type: transparent backpack-only pixel RPG four-view turnaround. Image1 is approved character reference. Extract/recreate ONLY its compact rounded BROWN travel BACKPACK with defined leather flap, square brass clasp, softly shaped top and seams, restrained warm highlights. No character, skin, head, hair, arm, clothes, legs, shadow, weapon or text. EXACT2x2 regular grid: top-left decorative FRONT of backpack (seen on wearer's BACK/up-facing); top-right bag on wearer's LEFT back edge (wearer facesRIGHT); bottom-left matching opposite profile (wearer facesLEFT); bottom-right plain REAR of bag facing wearer's torso, NOT another decorative front. Keep same backpack design, scale and pixel density across four views. Bag views centered within cells with generous truly transparent padding. This is a part replacement for a96pixel-cell cozy RPG character, readable chunky pixel clusters matching reference, no fine photoreal details, no large hiking pack or new decorations. Do not include hanging straps spreading far out; straps compact against bag outline. Shape must remain attached to body when later aligned.
