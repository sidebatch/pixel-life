# Character baseline v2 — 승인된 일반 게임 기준

재현: 저장소 루트에서 `node scripts/pack-character-baseline-v2.mjs`.

- `walk/chop/fish-body.png`: 보존된 npc-v1 공통 몸의 앞목 중앙 x45~51, y57~59에서 피부색 픽셀만 같은 프레임 셔츠색으로 교체. 알파/실루엣 불변.
- `walk/chop/fish-head.png`: 보존된 npc-ria-v3 얼굴을 방향별 x=[+2,-2,+2,0]px 이동. y/크기/발/목 기준 불변.
- `walk/chop/fish-hair.png`: 얼굴과 같은 x 이동, 양옆 정수리의 짧은 일자 끝만 2px 상단과 좌우 끝을 다듬음. 몸통·가방·무기 픽셀은 포함하지 않음.
- 96×96 셀, 아래/오른쪽/왼쪽/위 4행, 3/2/3열. 원본 npc-v1/npc-ria-v3 파일은 덮어쓰지 않음.
- 아래 걷기 x 보정과 리아 도끼 앞뒤 순서는 PNG가 아니라 `src/character.js`의 현행 공통 렌더러에서 한 번만 처리한다. 에셋에 보정을 다시 그리지 않는다.

검증: `node scripts/qa-character-standard.mjs`, `node scripts/qa-character-master-preview.mjs`, `node scripts/qa-npc-character.mjs`. 이전/승인본의 픽셀 정확성과 192개 남녀×옷×방향×프레임 합성을 확인한다. 기준 계약은 `docs/character-standard-v2.json`.
