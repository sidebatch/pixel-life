# Building Standard 3.0 — Depth QA

## 발견된 회귀
건물 PNG가 `drawBuildings()`를 통해 terrain/decor 단계에서 먼저 렌더되고, 플레이어/NPC는 이후 depth queue에서 렌더되고 있었다. 이 때문에 플레이어가 건물 뒤쪽 월드 타일에 있어도 지붕 위에 떠 보였다.

## 수정
- `drawBuildings()`의 background pass 제거.
- 각 building을 나무/NPC/player와 동일한 `renderables` Y-sort queue에 등록.
- 새 필드 `depthLine` 도입.
- 현재 두 건물은 `depthLine: 4`, 즉 footprint 하단을 depth 기준선으로 사용.

## 기대 동작
- 집 뒤쪽: player depth < building depth → player first, building later → player occluded.
- 문 앞: player depth > building depth → building first, player later → player in front.
- 문 anchor/entrance/collision은 V2 규격을 그대로 유지.

## 재발 방지 규칙
건물/큰 오브젝트는 배경에 고정 렌더하지 않는다. 가림 효과가 필요한 오브젝트는 반드시 world depth queue에 참여한다.
