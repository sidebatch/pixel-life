# Development Log

## 2026-10-04 — 벌목 10단계·나무 도감 완성

- 도끼를 10종으로 확장하고 기존 `axe.master` ID는 저장 호환을 위해 유지했다. 화면 표시명은 `청금 도끼`, 최종 장비는 `태초의 도끼`다.
- 나무·그루터기·목재 50종을 숲 12개에 연결했다. 숲은 서로 다른 지형을 사용하며 5~10단계 도끼는 바로 이전 구간의 목재와 코인으로 제작한다.
- 도끼 상점에서 내부 피해량을 숨겼다. 이름·외형·가격·이전 도끼 보유 조건·실제 재료만 표시하고, 구매 뒤 가방에서 직접 장착한다.
- 나무 도감은 `전체`와 다섯 숲 탭을 3열×2줄로 표시한다. 플레이어 화면에는 단계 번호, 나무 HP, 출현 지역, 필요 도끼, 발견 힌트를 노출하지 않는다.
- 최초 발견은 수종별 한 번만 카드 뒤집기와 밝은 3음 차임을 재생하고 `확인` 버튼으로 닫는다. 다음 숲은 실루엣 3개로 미리 보여 준다.
- 393×780과 320×568에서 도끼 구매, 50종 벌목·드롭·저장, 12개 숲 이동, 도감 탭·최초 발견·상세·티저를 자동 검사했다.
- 다음 우선순위는 전체 진행 밸런스 조정이다. 나무 HP·XP·판매가·도끼 제작 수량과 코인은 임시값이며, 도감 마일스톤 보상과 내구력·수리·소프트 난이도는 미구현이다.

과거 항목은 당시 구현 상태를 기록한 이력이다. 현재 상태와 충돌하면 [`docs/HANDOFF.md`](docs/HANDOFF.md), 실제 데이터, 최신 자동 검사를 우선한다.

# Development Log — Real NPC Sprite Fix

## Root issue
Previous NPC normalization drew colored rectangles and vector accessories directly on the main world canvas, which produced obvious square/line artifacts around characters.

## Change
- Restored true independent NPC assets.
- Cleaned each sprite frame using the largest connected alpha component.
- Re-centered and normalized all 12 frames for each NPC into a strict 96x96 grid.
- Aligned every NPC to the player's visual height and foot baseline.
- Removed all runtime cosmetic overlays.


## Add two new NPCs
- Added `hana` (florist) and `jun` (carpenter).
- Created independent normalized sprite sheets in `assets/npcs/`.
- Registered both assets in `index.html` and placed them into the village NPC roster.


## NPC pipeline verification: Hana + Jun
- Generated two independent sprite sheets.
- Detected/fixed Jun source stray pixels with connected-component cleanup.
- Normalized all frames to 96×96 cells, 68 px visible height, baseline y=94.
- Moved Hana off a conflicting sign tile.
- Runtime-tested roaming, collision, dialogue, player movement; 0 runtime errors.


## Player -> NPC Standard
- Replaced legacy player rendering with a normalized 288x384 sprite sheet.
- Player now uses identical 96x96 cell structure, direction rows, frame rhythm, render size, foot anchor, and shadow size as NPCs.
- Existing movement/collision/camera logic was left unchanged.


## NPC pipeline live test
- Reprocessed newly generated Hana and Jun sheets through the documented 96×96 normalization pipeline.
- Replaced their live-game sprite data.
- Embedded player + new NPC assets in the HTML to prevent Android content:// relative-path load failures.


## Left-facing animation regression rule
- Use the right-facing side row as the canonical player side animation.
- Render left movement by horizontally mirroring the canonical right-facing frames.
- Do not trust generated left-row frames without frame-by-frame visual QA; a single wrong-facing frame can cause intermittent direction flicker.

## Building Standard 2.0
- Replaced footprint-center image placement with door-anchor placement.
- Added per-building `artAnchor.doorCenterX`.
- Home anchor: 158px; workshop anchor: 166px.
- Doors may remain left/center/right; gameplay uses explicit world door tile.
- Added optional `DEBUG_BUILDING_ANCHORS` guide for future QA.

## Vegetation Layer V4
- Fixed brief front/back flicker while walking through small passable vegetation.
- Passable vegetation now renders permanently below actors.
- Bushes and reeds removed from Y-depth sorting.
- Trees/buildings and other occluding objects keep Y-depth behavior.

## World time, weather, and fishing vertical slice
- Added a shared 30-minute world clock with dawn/day/dusk/night interpolation.
- Added clear/rain/storm weather selection and full-screen layered precipitation.
- Added developer controls for fixed time and weather through `?debug`.
- Added the first guaranteed-catch fishing loop with a bobber, bite cue, random crucian carp size and price.
- Added a mobile fishing cancel control and prevented cancel-release ghost clicks from opening bag/settings.
- Fishing data pools, progression, codex, persistence, and final fish assets remain intentionally unfinished.
