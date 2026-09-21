# World, UI & System Standard

## 1. 프로젝트 구조
핵심은 월드와 공통 시스템을 안정적으로 유지하고, 기능을 모듈처럼 추가하는 것이다.

```text
WORLD CORE
- Movement
- Camera
- Collision
- Interaction
- NPC
- Save
- UI

ACTIVITY MODULES
- Fishing
- Gathering
- Cooking
- Crafting
- Shop
- Quest
- Defense
```

기능을 추가할 때 Movement/Camera/Collision을 직접 크게 수정하지 않는다.

---

## 2. 맵 규칙
- 탑다운 픽셀 월드
- 길/물/잔디/석재 영역을 명확히 구분
- 큰 오브젝트는 잘림 여부 확인
- 반복 타일 경계가 너무 적나라하게 보이지 않게 정리

### 충돌 대상
- 물
- 집
- 나무
- 바위
- 벤치
- 일부 큰 오브젝트

### 비충돌 장식 가능
- 꽃
- 작은 풀
- 일부 관목

---

## 3. NPC 배치 규칙
NPC는 다음 위치를 피한다.
- 표지판 타일
- 집 문 바로 앞
- 벤치 위
- 물 타일
- 플레이어 주요 이동 통로

NPC 추가 후 반드시 실제 로밍으로 겹침 여부 확인.

---

## 4. UI 방향
세로형 모바일 우선.

현재 구성:
- 좌상단: 지역/시간 HUD
- 우상단: 골드/가방
- 좌하단: 조이스틱
- 우하단: 메인 액션 버튼 + 보조 버튼

### UI 스타일
- rounded
- 반투명
- 화면을 과도하게 가리지 않기
- 버튼 크기/간격 통일
- A/B 문자보다 실제 기능 중심 표현

---

## 5. 상호작용
하나의 메인 액션 버튼을 상황에 따라 바꾼다.

예:
- NPC 앞 → `대화`
- 표지판 앞 → `읽기`
- 물가 → `낚시`
- 문 앞 → `들어가기`
- 상자 → `열기`

---

## 6. 대화 규칙
- 1~2문장
- 캐릭터 역할이 드러나야 함
- 세계관 또는 기능 힌트를 줄 수 있음
- 너무 길게 쓰지 않음

---

## 7. 실행/패키징 규칙
Android Downloads에서 `index.html`을 직접 열 수 있는 상황을 고려한다.

주의:
- 상대경로 이미지는 `content://` 환경에서 실패할 수 있음
- 중요 에셋은 필요 시 HTML embed/data URL 방식 사용
- 이미지 하나 실패했다고 게임 전체가 멈추지 않도록 fallback 고려
---

## 8. Building Standard 2.0
건물은 **PNG 전체 중심이 아니라 실제 문 중심을 기준으로 월드 타일에 정렬**한다. 문은 왼쪽/가운데/오른쪽 어디든 가능하다.

### 핵심 원칙
- 건물 PNG는 독립 투명 이미지
- 충돌 footprint와 그림 크기는 분리
- `door` = 막힌 문 타일
- `approach` = 플레이어가 서는 문 앞 타일
- `artAnchor.doorCenterX` = 원본 PNG 내부의 실제 문 중심 X 픽셀
- 렌더러는 `doorCenterX`를 월드 `door` 타일 중심에 맞춘다
- PNG 전체를 footprint 중앙에 맞추는 방식은 사용하지 않는다

### 표준 데이터
```js
{
  id: 'carpenter_workshop',
  sprite: 'buildingWorkshop',
  x: 12, y: 4, w: 6, h: 4,
  drawW: 330, drawH: 318,
  artAnchor: {
    doorCenterX: 166,
    groundOffsetY: 10
  },
  entrance: {
    door: { x: 14, y: 7 },
    approach: { x: 14, y: 8 },
    side: 'left'
  }
}
```

### 문 정렬 공식
```js
scaleX = drawW / sourceImageWidth
targetDoorCenterX = (door.x + 0.5) * TILE
drawX = targetDoorCenterX - doorCenterX * scaleX
```

따라서 건물 폭, 처마, 창문, 창고 장식이 비대칭이어도 문은 항상 자신의 타일 중앙에 온다.

### 새 건물 제작 절차
1. PNG 제작
2. 실제 문 중심 X 픽셀 측정
3. `doorCenterX` 기록
4. 월드에서 원하는 `door` 타일 지정
5. 그 바로 앞 걸을 수 있는 타일을 `approach`로 지정
6. DEBUG anchor QA로 문 중심과 approach 중심 확인
7. 충돌/로밍/상호작용 QA 후 배포

### 금지
- "이미지 가운데가 문일 것"이라고 가정하지 않기
- 문 위치를 left/center/right 문자열만으로 계산하지 않기
- 장식 때문에 넓어진 PNG를 footprint 중심으로 강제 정렬하지 않기

### 현재 기준
- 기본 집: `doorCenterX = 158`
- 준의 작업실: `doorCenterX = 166`
- 타일 크기: `48px`


## Building Standard 3.0 — Depth / Occlusion

건물은 배경 레이어에 고정해서 그리지 않는다. 나무, NPC, 플레이어와 같은 Y-depth 정렬 큐에 들어간다.

### 필수 데이터
```js
{
  x: 12,
  y: 4,
  w: 6,
  h: 4,
  depthLine: 4
}
```

`depthLine`은 건물의 `y`를 기준으로 한 로컬 타일 오프셋이다. 기본값은 `h`이며 일반적인 건물에서는 충돌 footprint의 맨 아래 선을 사용한다.

```js
buildingDepthY = (building.y + building.depthLine) * TILE;
```

### 렌더 규칙
- 캐릭터의 depth가 건물 depth보다 작음 → 캐릭터를 먼저 그림 → 건물이 캐릭터를 가림 → 건물 뒤에 있는 것처럼 보임.
- 캐릭터의 depth가 건물 depth보다 큼 → 건물을 먼저 그림 → 캐릭터가 건물을 가림 → 건물 앞에 있는 것처럼 보임.
- 문 위치(left/center/right), PNG 폭, 지붕 높이는 depth와 무관하다.
- 건물 PNG를 `drawTerrain()` 단계나 일반 배경 단계에서 직접 그리는 방식은 금지한다.

### QA
- 건물 뒤쪽 한 타일에서 플레이어가 지붕 뒤로 가려지는지 확인.
- 문 앞 approach tile에서는 플레이어가 집보다 앞에 보이는지 확인.
- 건물 좌우 측면에서 지붕 오버행과 겹칠 때 Y-depth가 자연스러운지 확인.


## Vegetation Layer Standard 4.0

식생은 **충돌 여부**로 렌더 레이어를 결정한다.

- 플레이어/NPC가 밟고 지나갈 수 있는 식생(꽃, 작은 풀, 낮은 수풀, 갈대 등): 항상 캐릭터보다 아래에 렌더한다. Y-depth 정렬 큐에 넣지 않는다.
- 플레이어 이동을 막거나 실제로 캐릭터를 가려야 하는 큰 식생(나무 등): Y-depth 정렬을 사용한다.
- 통과 가능한 식생을 Y-depth에 넣으면 캐릭터가 식생의 기준선을 넘는 순간 앞/뒤가 잠깐 뒤집힐 수 있으므로 금지한다.
- 신규 식생 추가 시 `passable=true`라면 ground-decoration layer, `blocking/occluding=true`라면 depth-sorted layer를 사용한다.


## Path Standard 1.0
- Gameplay path data remains tile-based (`pathSet`), but the visual road must NOT fill the entire 48x48 tile.
- Default visible dirt width: inner 36px, soft/darker rim 42px.
- N/S/E/W neighbors automatically extend road arms; endpoints are rounded.
- Corners, T-junctions and cross intersections must render as one continuous surface.
- Dirt grains/pebbles are deterministic decoration and must not affect collision.
- Small grass intrusion along path edges is ground decoration only.
- Full square beige rectangles are prohibited for normal village footpaths.
- Path visual changes must never modify player movement/collision data unless explicitly requested.
