# 여자 기본 캐릭터 — 디자인 검토 v1

제작일: 2026-09-27. 상태: **이전 61px 초안 기록**. 이후 사용자 요청으로 NPC체형68px 남녀 공통안이 승인·게임 연결되었으며 최신 기준은 ../npc-body-v1/PRODUCTION.md다. 아래 초안의 대기/미검증 표시는 제작 당시 범위다.

## 이번 범위

- 여자 기본 캐릭터의 앞/오른쪽/왼쪽/뒤 원화만 제작했다.
- 갈색 짧은 묶음 머리, 파란 여행복, 남색 바지, 갈색 신발/가방으로 현재 기본 장비 계열과 어울리게 제안했다.
- 공통 셀 96×96, 발 (48,88), 표시 100px. 여자 전체 실루엣 높이는 61px로 등비 축소했다. 머리와 몸을 별도 배율로 변형하지 않았다.
- 남자 비교 그림은 **현재 polish-v1 기본 부품**과 rig-v1 그립의 대기 프레임으로 합성했다. 측면 가방은 몸/옷 뒤에 둔다. NPC 비교는 실제 렌더러의 정지 프레임 1, 방향 행 0/2/1/3을 사용한다.
- 게임 코드/에셋 등록/저장/레벨/돈/외형 선택은 변경하지 않았다. 현재 게임 링크는 그대로다.

## 검토 파일

- `turnaround-generated.png`: 투명 배경 생성 원본. 수정 없이 보존.
- `female-idle-review.png`: 검토용 96×384 사방향 시트. **런타임용 부품 시트 아님**.
- `comparison-actual.png` / `comparison-large.png`: 같은 표시 배율의 현재 남자·여자안·엘리·준 비교.
- `review.html`: 게임 표시 크기/3배 확대 전환, 모바일 가로 스크롤 지원. 외부 라이브러리 불필요.
- `review-manifest.json`: 방향별 원본/정규화 알파 경계 및 검증 범위.
- `review-mobile.png`: Chrome 393×780 화면 확인 기록. 실제 Android 기기 테스트는 아니다.

## 재생성·검사

`node scripts/pack-female-character-review.mjs`

`node scripts/qa-female-character-review.mjs` (Playwright/Chrome 경로는 기존 QA 환경 변수 사용)

검사 통과: 4개 96×384 투명 비교 시트, 생성 원본 투명도, 여자 네 방향 발 기준/셀 경계, 100px/3배 버튼, 393px 페이지 폭/가로 스크롤, 페이지 JS 오류 없음.

아직 미검증: Head/Hair/Body/Outfit/Backpack/Grip 분리, 공통 손/목/어깨 좌표에 실제 부착, 걷기·벌목·낚시, 옷/가방 교체, 오른손 무기, 시작 성별 선택 및 저장 호환. 같은 셀 크기만으로 호환 완료를 주장하지 않는다. 승인 후 공통 관절에 등록하고 전체 모션/조합을 검사해야 한다.

## 생성 기록

내장 이미지 생성 도구 사용. 새 캐릭터 생성, 기존 비교 이미지는 스타일/크기 참고이며 편집 대상 아님. 별도 API/CLI 사용하지 않음.

원본 보관: `C:/Users/leeks/.codex/generated_images/01a0c9a8-dfb3-78e2-9430-89502a903928/exec-41e762a9-337f-4eb4-b047-f61654183f6d.png`.

최종 생성 프롬프트:

```text
Use case: stylized-concept
Asset type: review-only four-direction idle character turnaround for Pixel Life, a cozy top-down 2D pixel RPG.
Input image 1 is STYLE AND SCALE REFERENCE ONLY: left column is the approved CURRENT male player, middle is Ellie NPC, right is Jun NPC. Do not reproduce the labels, green background, male character or NPCs.
Primary request: design ONE new female basic player character, shown in exactly FOUR neutral standing full-body views in an equal 2x2 layout: upper-left FRONT facing camera/down, upper-right strict RIGHT profile facing right, lower-left strict LEFT profile facing left, lower-right BACK facing away/up. All four are the exact same person, outfit, height and proportions.
Subject: friendly young adult female traveler, warm brown medium-length hair in a short low ponytail with soft side bangs, clear simple expressive face. Practical basic outfit shared with current player: short blue travel jacket over cream shirt, dark navy trousers, small brown boots, compact brown backpack with tan straps. Hands relaxed naturally beside body, empty hands.
Style/medium: clean readable pixel art, hand-crafted clustered pixels, warm dark outlines, restrained detailed shading, same elevated top-down view and charming NPC quality as reference. Moderate head size matching the CURRENT male player, not a giant face or oversized chibi head. Body and boots must remain clearly visible. Head/hair about 50-55 percent of total sprite height, not more; total native silhouette about 61 pixels tall when normalized into a 96x96 cell.
Composition: each full sprite centered in its quadrant with comfortable transparent margins, complete hair/backpack/feet visible; consistent foot baseline within each quadrant, no overlaps between quadrants.
Lighting: consistent soft upper-left light in all views.
Constraints: GENUINELY TRANSPARENT BACKGROUND, no floor shadow, no scenery, no props or weapons, no hat, no jewelry, no text, no labels, no grid, no watermark. Front shows backpack straps only, profile shows compact backpack BEHIND torso, back shows intact backpack without clipping or disconnected pieces. Right and left views are strict side views, not three-quarter views. Keep anatomy and outfit consistent across all views. This is a new character design, not a replacement edit of the reference.
```
