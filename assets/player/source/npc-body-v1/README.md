# NPC 체형 남녀 주인공 — 사방향 검토 v1

2026-09-27. 사용자 요구: 남녀 주인공을 기존 NPC와 같은 체형으로 플레이하고 싶음.

상태: **사용자 디자인 승인 후 실제 동작 연결 완료**. 최신 게임용 부품은 assets/player/npc-v1/이며 제작/프롬프트/검증은 PRODUCTION.md를 따른다. 아래 비교 파일은 승인 당시 기록으로, 게임용 분리 시트가 아니다.

## 기준과 결과

- 이전 남자 기본은 머리 비중이 크고 몸이 짧다. 여자-v1은 전체 61px여서 NPC(68px)보다 작았다. 단순 확대만으로는 체형을 통일할 수 없다.
- NPC처럼 몸통/팔/다리가 보이는 남녀 공통 체형으로 새 사방향 원화를 생성했다. 기본 파란 여행복·갈색 가방, 남자 짧은 갈색 머리/여자 짧은 묶음 머리의 정체성은 유지했다.
- 새 남녀 그림 8개와 NPC 비교 8개: 전체 높이68px, 96×96 셀, 발(48,88), 표시100px. 같은 높이는 자동 검사했고 세부 신체 비율은 시각 검토 대상이다. 머리/몸/관절이 수치상 완전히 같다고 주장하지 않는다.
- NPC는 실제 정지 프레임1, 행0/2/1/3을 사용하며 **확대/축소 없이** 발만5px 위로 정렬했다. 게임 NPC 좌표/원본은 변경하지 않았다.
- 생성 시트의 행 간격은 정확한 균등 격자가 아니다. 전체 이미지에서 8개 연결된 완성 실루엣을 찾아 추출한다. 기계적인 4등분은 앞/옆 발을 잘라내므로 금지한다.
- 여자-v1 및 기존 남자/polish 원본, 제작 스크립트와 저장을 보존한다.

## 파일

- `turnaround-generated.png`: 수정 없는 생성 원본(왼쪽 남자/오른쪽 여자, 앞/오른쪽/왼쪽/뒤 순).
- `male-idle-review.png`, `female-idle-review.png`: 각각96×384. 아직 게임용 분리 레이어 아님.
- `elli-idle-review.png`, `jun-idle-review.png`: 기준선 정렬한 참고용 시트.
- `comparison-actual.png`, `comparison-large.png`, `comparison-guides.png`: 100px/3배/발 기준선 비교.
- `review.html`: 확대/발 기준선 버튼 및 모바일 가로 스크롤.
- `review-manifest.json`: 원본 완성 실루엣과 정규화 경계; 검증 한계 기록.
- `review-mobile.png`: Chrome393×780 모의 확인. Android 실기기 확인 아님.

재패킹: `node scripts/pack-npc-body-review.mjs`

검사: `node scripts/qa-npc-body-review.mjs` (기존 PIXEL_LIFE_PLAYWRIGHT/PIXEL_LIFE_CHROME 경로 환경 변수 필요).

## 디자인 당시 연결 계획 (현재 완료 범위는 PRODUCTION.md 참고)

1. 사용자에게 남녀/NPC 사방향 비교로 체형 확인받기. 옛61px 여자 확인보다 이 체형 기준을 우선한다.
2. 확인된 완성 그림의 두개골·목·어깨·허리·손·발 좌표를 정하고 공통 Body/Head/Hair/Outfit/Backpack/Grip 계약을 만들기. 그림을 색만으로 분리하지 않기.
3. 새 몸 비율에 맞춰 걷기3·벌목2·낚시3 프레임×4방향을 제작/보정. 기존 이동/벌목/낚시 로직과 270ms타격·700ms종료를 유지하며 사용자가 거부한8단계 동작을 다시 적용하지 않기.
4. 프레임별 오른손 그립/전후 가림·목 움직임·어깨 가방 위치 갱신. **무기 원화10개와 무기 손잡이 원점을 재사용**하되 몸쪽 부착 좌표/도구 표시 배율·각도는 실제 모션으로 재검증. 현재 모든 좌표를 그대로 재사용할 수 있다고 약속하지 않기.
5. 기본/임시 옷3종과 가방3종을 새 체형에 맞춰 호환 패킹. 임시 옷도 기존 짧은 몸 윤곽을 그대로 사용하지 않기. 실제 조합·방향·동작 전환에서 잘림/분리/비율 점프 검사.
6. 로컬 미리보기에서 기존/새 체형 비교 후 사용자 확인, 안전하게 등록·전환. 돈/레벨/아이템/보유장비/외형 저장 보존. 처음 시작할 때 성별 선택은 부품/모션 검증 후 연결; 기존 저장 자동 초기화 금지.

이번 QA는 16정지뷰 높이/기준선/투명도, 원본 실루엣 높이, 미리보기 버튼과 모바일393px 폭만 검사했다. 모션/부품/옷/장비/세이브 호환이 완료됐다는 뜻이 아니다.

## 생성 기록

내장 이미지 생성 도구 사용, 새 남녀 공통 체형 검토 시트 생성. 입력은 정체성과 NPC스타일 참고용; CLI/API 별도 사용 없음.

생성 원본 보관: `C:/Users/leeks/.codex/generated_images/01a0c9a8-dfb3-78e2-9430-89502a903928/exec-f759a126-2514-4d47-a854-1a530b65e4a2.png`.

최종 프롬프트:

```text
Use case: stylized-concept
Asset type: Pixel Life common-body male/female PLAYER TURNAROUND review sheet, matching existing NPC anatomy.
Input images: Image 1 comparison sheet: LEFT column is current male player identity ONLY, SECOND column is approved female concept identity ONLY, third/fourth are NPC style references. Do NOT retain the old male's short stocky body or oversized head. Image 2 is female identity/outfit reference. Image 3 Ellie and Image 4 Jun are the PRIMARY ANATOMY, PROPORTION, pixel-art and elevated top-down camera references. These are references, not images to modify.
Primary request: redraw BOTH basic players using the SAME NPC-like common body template. Match NPC head-to-body ratio, shoulder level, arm length, visible torso and booted legs. Male and female must look equal in physical size and body proportions, like the NPCs belong to their world. NOT merely resize an old sprite. Keep adult cozy RPG stylization, not realistic humans or giant-headed chibis.
Sheet: EXACTLY EIGHT complete sprites in an equal TWO-COLUMN FOUR-ROW grid on true transparency. Left column ALWAYS male; right column ALWAYS female. Row 1 front/down, row 2 strict right profile facing right, row 3 strict left profile facing left, row 4 back/up. Both sprites in each row have identical top-of-head and foot baselines, shoulder and waist levels, arm reach, boot size and total height. Full body centered in each cell with generous transparent margins, no crossing cell edges.
Identity: male tousled short warm-brown hair, friendly face; female soft brown bangs and short low ponytail, friendly face. Both wear the SAME practical short blue jacket, cream shirt, navy trousers, brown boots, compact brown backpack with tan straps. Femininity is conveyed by face/hair, NOT a tiny body, dress, heels or excessive eyelashes. No beard, jewelry, hats, weapon, tools or extra accessories.
Proportion target: normalized full silhouette 68 native pixels tall in a 96x96 game cell. Head including hair about 30-32 native pixels (roughly 45 percent of total height), clearly readable torso/legs occupying remaining ~36-38px. Shoulders about 31px below top of hair, waist about 46px below hair top. Male/female common shoulder width and limb thickness. Hair can change outline width slightly but must not change underlying skull size. Rear ponytail must not erase backpack. Normal-sized eyes like NPCs. Clearly connected neck, no floating heads or disconnected arms. Hands relaxed by sides.
Style: precisely the warm clean clustered-pixel 2D NPC sprites, restrained crisp dark contours, tidy shading and highlights, elevated RPG camera matching Ellie/Jun. Not high-resolution painted art, no blur, no photorealism. Consistent soft top-left light.
Constraints: truly transparent background (no checkerboard painted into pixels); no labels/text, no grid lines, no floor, no cast shadows, no watermark. No idle/action size variations. Visible intact backpack profiles behind torso; only straps in front; back pack intact. Both bodies must follow the same proportions in ALL FOUR directions.
```
