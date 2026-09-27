# NPC 체형 게임 연결 — 2026-09-27

사용자가 승인한 NPC 체형 남녀 디자인을 실제 레이어로 연결했다. 최신 게임용 부품은 assets/player/npc-v1/이다. 원본 rig-v1 / polish-v1 / temporary-appearance와 기존 ID·저장 버전·진행도를 보존했다.

## 실제 규격

- 셀96×96, 발(48,88), 표시100px. 걷기3·벌목2·낚시3×4방향=32자세. 남녀는 공통 Body/Outfit/Grip과 장비 좌표를 공유하고 얼굴/헤어만 별도다.
- 승인된 머리를 같은 좌표에서 Head/Hair로 분리하며 모든 동작에서 같은 픽셀 크기를 유지한다. 기존 작은 벌목 머리 이동/회전은 새 목(48,54)에 적용한다. 옛 목(48,63)을 재사용하지 않는다.
- headless 몸/옷/손 동작 원화3개를 생성했다. 전체 연결 실루엣을 추출하고 목~발37px로 정렬한다. 올린 손까지 전체 높이로 축소해 몸이 작아지는 방식은 금지한다. 준비 자세 원본의 목 오프셋·배율·부착 위치는 manifest.json에 기록한다.
- 측면 몸/옷/그립은 오른쪽에서 일관되게 반전한다. 생성된 왼쪽 원화는 기록으로 보존한다. 왼쪽 걷기 오른손은 몸 뒤이므로 x-8/y-3·뒤쪽도구·빈 Grip 레이어를 사용한다. 두손 행동은 공통 반전 그립이다.
- 무기10종 원화와 손잡이/끝 원점·길이·각도·정면도끼날0.55폭은 재사용한다. 몸쪽 손 좌표는 실제 새 손에 맞춰 갱신한다. 앞쪽 손이 몸 뒤에 숨는 후면은 gripOccluded이며 실제 어깨/몸 뒤 그립을 사용한다.
- 전체 가방3종을 새 어깨에 고정 크기로 부착하고 측면은 몸/옷 뒤에 표시한다. 타격 때 가방이 머리에만 닿고 몸에서 뜨는 위치는 금지한다. 각 가방이 실제 몸과4px 이상 겹치는지 검사한다.
- 기본/불꽃/정원 옷3종은 공통 새 몸 윤곽과 손 노출을 공유한다. 기존 임시 의상 디자인·색·디테일을 새 동작 윤곽에 맞춰 패킹했다. 아이콘/보유/선택 ID는 유지한다.
- 이동/벌목/낚시 게임 로직,270ms타격·700ms종료와 사용자가 원복한 기존2자세 벌목 흐름은 유지한다. 거부한8단계 동작을 다시 적용하지 않는다.

## 등록과 확인

기존 body.starter/hair.brown/옷/가방/도구 ID 유지. body.female와 hair.female.brown은 공통 몸·그립 위에 여성 얼굴/헤어를 선택하며 저장 복원도 가능하다.

일반 링크는 새 남자 체형(저장된 여성 ID가 있으면 해당 외형)을 표시한다. ?character-preview 또는 ?character-preview&character=female에서 실제 게임화면 남자/여자 버튼으로 비교할 수 있다. 시험 성별 선택은 렌더링에만 적용해 저장하지 않는다. 실제 플레이·옷/장비 장착은 평소처럼 저장한다. 일반 링크에는 비교 버튼이 없다.

처음 시작 시 성별 선택 UI와 헤어 상점은 아직 구현하지 않았다. 다음 별도 단계이며 비교 버튼을 영구 성별 선택이라고 설명하지 않는다.

## 검증과 한계

- 정적 check30게임스크립트/80UI ID/185런타임 에셋,빌드,공백검사. 과거 원본 합성/10무기 손잡이/오른손·가림·목 검사 유지, 최신 실제 목 피벗으로 비교한다.
- qa-npc-character:32자세,남녀머리 등록 불변,옷알파 공유,전체가방의 몸겹침/셀 경계,실제 손/숨은 어깨 그립. 남녀2×옷3×가방3×32=576실제 렌더 연결(작은 분리픽셀3% 이하).
- 시험선택 저장 불변,남녀 body/hair ID·4321코인·옷/가방/도구 저장 복원,393px버튼/일반링크숨김 통과.
- qa-character 기본 및 PIXEL_LIFE_QA_BODY=female:각32자세10무기·393×780 실제 낚시 획득/XP·벌목20피해/270ms·허공Space/Z/터치·700ms 종료 통과.
- qa-temporary-wardrobe:모바일9조합 장착/상세/저장재접속 및288자세. qa-character-attachments:9조합4방향9시점=324연결 및269→270/699→700→701전환,느린재생검토.
- 산출물 output/character-qa/npc-v1/{full,male-final,female-final,wardrobe-final,attachments-final}。Chrome 모의 모바일과 확대 시각검토이며 Android 실기기 품질/선호/성능 확인을 대신하지 않는다.
- 미래 헤어/옷/가방도 새 목·관절·전환별 가림을 검증해야 한다. 단순히 셀 크기만 맞춰 호환 완료라고 하지 않는다.

재생성: node scripts/pack-npc-character.mjs. 현재 src/data/character-rig-data.js는 이 스크립트가 생성한다. 옛 pack-character-rig/polish는 이전 버전 재현용이며 최신 런타임을 덮어쓰는 데 사용하지 않는다.

## 생성 기록

내장 이미지 생성 도구 사용. 승인된 체형은 디자인 참고, 옛 행동 시트는 동작 참고이며 기존 큰 머리/짧은 몸 비율은 사용하지 않았다. CLI/API 별도 사용 없음.

프로젝트 원본 복사본: motion/walk-generated.png, motion/chop-generated.png, motion/fish-generated.png.
원본 보관 디렉터리: C:/Users/leeks/.codex/generated_images/01a0c9a8-dfb3-78e2-9430-89502a903928/
walk: exec-24c57479-4da8-40e3-a1a5-0ec543066340.png
chop: exec-9f54c32f-27a0-4f5f-ae20-cd8bdaa5f7e6.png
fish: exec-bbe82ff8-64c1-4c8b-af1d-8a1fb4162a9f.png

## walk 최종 프롬프트

```text
Use case: stylized-concept
Asset type: layered pixel RPG animation BODY+CLOTHES component atlas, NOT a complete headed character.
Reference 1 is the APPROVED NPC-proportion male/female player design. Reference 2 is POSE REFERENCE ONLY, not its old short body, not its hair, not its face, not its backpack.
Draw ONLY headless clothed adult bodies with a short skin neck stump, connected shoulders, arms and hands, torso, legs, complete boots. NO HEAD, NO FACE, NO HAIR, NO BACKPACK, NO STRAPS, NO WEAPON, NO HAT. The missing head/hair/backpack are separate runtime layers. Neck stump reaches above the collar, do not leave a neck gap. This is intentional component art, not a decapitated scene, no injury.
The SAME unisex practical short blue jacket, cream shirt, navy trousers and brown boots as Reference 1. SAME shared NPC body shape, arm lengths, shoulder width and leg proportions in every frame. Body from collar to boot about 36-38 native pixels; neck-to-foot about 40px. NO body enlarging between poses. Top-down RPG camera and crisp clustered pixel art matching the NPCs. Soft upper-left lighting.
TRUE TRANSPARENT background, no text, no grid lines, no ground, no shadow, no accessories, no effects, no labels. Each separate body centered in its cell with comfortable empty margins and no overlap with any other cell. Keep foot ground line consistent. Hands must be visibly gripping an imaginary thin handle during actions, with the handle intentionally absent.
Animation specification: EXACTLY THREE COLUMNS x FOUR ROWS (12 bodies). Row order front/down, right-facing STRICT profile, left-facing STRICT profile, back/up. Column 1 neutral standing idle with arms down; column 2 walking first step with leg and arm alternate; column 3 opposite walking step. Clearly actual stride in columns2/3, not copies of idle. Right hand always the equipment hand: front anatomical right hand on screen-left, back on screen-right; side right faces show near right hand, left faces show far right hand. Keep right and left side anatomy symmetric but handedness consistent.
```

## chop 최종 프롬프트

```text
Use case: stylized-concept
Asset type: layered pixel RPG animation BODY+CLOTHES component atlas, NOT a complete headed character.
Reference 1 is the APPROVED NPC-proportion male/female player design. Reference 2 is POSE REFERENCE ONLY, not its old short body, not its hair, not its face, not its backpack.
Draw ONLY headless clothed adult bodies with a short skin neck stump, connected shoulders, arms and hands, torso, legs, complete boots. NO HEAD, NO FACE, NO HAIR, NO BACKPACK, NO STRAPS, NO WEAPON, NO HAT. The missing head/hair/backpack are separate runtime layers. Neck stump reaches above the collar, do not leave a neck gap. This is intentional component art, not a decapitated scene, no injury.
The SAME unisex practical short blue jacket, cream shirt, navy trousers and brown boots as Reference 1. SAME shared NPC body shape, arm lengths, shoulder width and leg proportions in every frame. Body from collar to boot about 36-38 native pixels; neck-to-foot about 40px. NO body enlarging between poses. Top-down RPG camera and crisp clustered pixel art matching the NPCs. Soft upper-left lighting.
TRUE TRANSPARENT background, no text, no grid lines, no ground, no shadow, no accessories, no effects, no labels. Each separate body centered in its cell with comfortable empty margins and no overlap with any other cell. Keep foot ground line consistent. Hands must be visibly gripping an imaginary thin handle during actions, with the handle intentionally absent.
Animation specification: EXACTLY TWO COLUMNS x FOUR ROWS (8 bodies). Rows front/down, right-facing STRICT profile, left-facing STRICT profile, back/up. Column1 axe swing READY: bent right arm raised near shoulder/head level, left supporting hand, stable standing legs. Column2 IMPACT: torso leans subtly toward facing direction, right arm extends forward/down to strike at waist level, left supporting hand follows. Match reference action logic but make torso and legs NPC-proportioned. Front impact hands extend toward screen-bottom, back impact hands extend toward screen-top. Body and head orientation MUST NOT change between frames. Legs stay natural, not huge lunges. Right/left profiles are symmetric swings. No actual axe or handle.
```

## fish 최종 프롬프트

```text
Use case: stylized-concept
Asset type: layered pixel RPG animation BODY+CLOTHES component atlas, NOT a complete headed character.
Reference 1 is the APPROVED NPC-proportion male/female player design. Reference 2 is POSE REFERENCE ONLY, not its old short body, not its hair, not its face, not its backpack.
Draw ONLY headless clothed adult bodies with a short skin neck stump, connected shoulders, arms and hands, torso, legs, complete boots. NO HEAD, NO FACE, NO HAIR, NO BACKPACK, NO STRAPS, NO WEAPON, NO HAT. The missing head/hair/backpack are separate runtime layers. Neck stump reaches above the collar, do not leave a neck gap. This is intentional component art, not a decapitated scene, no injury.
The SAME unisex practical short blue jacket, cream shirt, navy trousers and brown boots as Reference 1. SAME shared NPC body shape, arm lengths, shoulder width and leg proportions in every frame. Body from collar to boot about 36-38 native pixels; neck-to-foot about 40px. NO body enlarging between poses. Top-down RPG camera and crisp clustered pixel art matching the NPCs. Soft upper-left lighting.
TRUE TRANSPARENT background, no text, no grid lines, no ground, no shadow, no accessories, no effects, no labels. Each separate body centered in its cell with comfortable empty margins and no overlap with any other cell. Keep foot ground line consistent. Hands must be visibly gripping an imaginary thin handle during actions, with the handle intentionally absent.
Animation specification: EXACTLY THREE COLUMNS x FOUR ROWS (12 bodies). Rows front/down, right-facing STRICT profile, left-facing STRICT profile, back/up. Column1 CAST preparation: right hand raised near shoulder, supporting left hand; column2 WAIT: hands extended toward facing direction holding an imaginary rod at waist/chest level; column3 PULL catch: arms bent drawing the imaginary handle toward chest. Both hands connected to arms, right-hand handle grip readable. Front hands toward screen-bottom, back hands toward screen-top. Keep total body size constant across all columns and directions; no actual rod or handle.
```
