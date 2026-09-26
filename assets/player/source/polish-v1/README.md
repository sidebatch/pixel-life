# 기본 캐릭터 미술 개선 — 방향별 디자인 검토 v1

상태: 사용자 디자인 승인 후 게임용 부품·32자세 연결 완료. 실제 제작/검증/원본·최종 파일/전체 후속 프롬프트는 [PRODUCTION.md](PRODUCTION.md)를 참고한다. 아래는 최초 디자인 검토 단계의 기록이며 review.html은 당시 디자인 비교 화면이다.

사용자는 기존 모션을 유지하면서 NPC 수준의 미술 퀄리티를 올리는 방향에 동의했다. 먼저 기존 갈색 머리·파란 여행복·갈색 가방의 정체성을 유지한 앞/오른쪽/왼쪽/뒤 대기 디자인을 제작했다. 이 모습에 대한 피드백을 받은 다음 동작별 부품으로 확장한다. 지금 4개의 그림은 모션 제작 완료품이 아니며 기존 손 위치에 맞는다고 검증한 것도 아니다.

## 저장 파일과 도구

- 내장 image_gen 기본 모드. 플레이어 원본과 엘리/준을 참고한 style-transfer, 실제 투명 배경 요청. CLI/API 키 미사용.
- 생성 원본: turnaround-generated.png. 원본 생성 경로: C:/Users/leeks/.codex/generated_images/01a0c9a8-dfb3-78e2-9430-89502a903928/exec-68de3e29-710b-44e3-a4b0-0e3079755fda.png.
- polished-idle-review.png: 개선안 96×384(4방향); original-idle-review.png: 기존 실제 레이어 재합성; elli-idle-review.png / jun-idle-review.png: NPC 방향 비교. 모두 이 폴더 안에 있다.
- review.html: 외부 의존성/저장 접근 없는 자체 포함 비교 화면. 100px 게임 표시와 3배 확대 버튼. review-manifest.json은 실제 알파 범위/검증 단계 기록.
- 재현: node scripts/pack-character-polish-review.mjs. 기존 원본/런타임 등록/리그/저장 파일은 수정하지 않는다. 크롭·최근접 정규화만 하고 기본 디자인 윤곽에 강제로 잘라 넣지 않는다. 생성 원본은 그대로 보존한다.

## 확인한 것

- 네 방향 각각 96px 셀, 높이68px, 발 기준(48,88), 투명 배경. 새 그림의 실제 폭39~40px.
- PC와 393×780 Chrome 모의에서 자체 포함 비교 화면, 게임 표시/확대 전환, 브라우저 오류0. 기존 게임 자동 검사 통과.
- 아직 안 한 것: 제작된 디자인의 부품 분리·손 좌표·걸음/벌목/낚시 동작·임시 옷/가방 조합·저장 회귀·Android 실기기·게임 배포.

## 디자인 확정 후 순서

1. 머리/얼굴/몸/기본 옷/가방/그립을 명시적으로 분리 제작. 색상만으로 부품 경계를 추정하지 않는다.
2. 기존96px 셀·발/목/오른손 기준·프레임 수·손잡이 위치·도끼 각도·headMotion·행동 타이밍을 유지해 걷기3/벌목2/낚시3×4방향 부품을 만든다.
3. 피부 노출·가방 윗부분·좌우 휘두름·낚싯줄·새 옷/가방 조합을 실제 렌더러로 확인한다. 폼 변화가 필요해도 체형/손 기준을 임의 변경하지 않는다.
4. 검증 후 기존 ID를 보존하는 에셋 연결로 돈/레벨/소유/착용을 초기화하지 않고 적용한다. 여자 캐릭터/헤어집/의상 상점은 별도 요청 범위다.

## 정확한 최종 프롬프트

+Use case: style-transfer.
Asset type: production-oriented pixel RPG player turnaround, DESIGN REVIEW before animation integration.
Input images: Image 1 is the existing male player identity reference (brown messy short hair, blue jacket, cream undershirt, dark trousers, brown boots, brown travel backpack); Images 2 and 3 are the exact in-game NPC art style references ONLY (Elli and Jun). Do not copy their genders, hats, dress or colors. Use their cohesive detailed sprite quality.
Primary request: redraw the existing young male adventurer as a beautifully polished cozy pixel RPG sprite, bringing his hair, face, clothes, and backpack to the refined quality of the NPC references. Preserve his recognizable brown hair and blue traveler clothes, male identity and chibi head-to-body proportion, not a different taller person. Hair should have intentional layered rounded locks, readable warm highlights, clean bangs and soft dark separation rather than a jagged noisy spiky ball. Clothing has a tailored short muted blue jacket, cream linen shirt with subtle collar/placket, readable cuffs, small dark seams, modest brown waist belt, dark navy trousers and well-shaped brown boots. Brown rounded travel backpack with carefully defined flap, brass clasp and straps, no extra ornaments, hats or tools. No hat, no sword, no axe, no fishing rod.
Composition: EXACTLY FOUR full-body views of ONE consistent character in a regular 2-column x 2-row sheet. Top-left faces DOWN/front toward viewer; top-right faces RIGHT/profile; bottom-left faces LEFT/profile; bottom-right faces UP/back away from viewer. All neutral idle poses with empty relaxed hands. Top-down RPG slightly elevated view, NOT realistic perspective or isometric. Each logical cell is 96x96 pixels; body including hair approx 68 pixels high with feet at logical (48,88), matching original proportions and framing. Use chunky confident crisp pixel clusters, colored outline and limited harmonious palette, no smooth painted illustrations. Display the logical pixel art enlarged by integer scaling for review; generous transparent space surrounding each figure. All four views at exactly same head/body/feet scale and consistent outfit details. Profile backpack sits on the BACK of torso (left side for right-facing, right side for left-facing) and is attached, not floating. Back view backpack is clearly visible beneath hair. Front face stays friendly and readable with eyes and restrained skin highlights. Improve quality through pixel shapes/shading, not increasing body height.
Background: genuine transparent alpha. NO labels, captions, grids, borders, floor, shadow, terrain, extra characters, watermarks, equipment. This is design artwork, not a complete walking or swing animation. Render exactly four separate idle sprites in that 2x2 ordering, with room to crop each independently.
