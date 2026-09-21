# Vegetation Layer V4 QA

## 문제
통과 가능한 작은 식생이 Y-depth 정렬에 포함되어 있어, 플레이어가 뒤쪽에서 앞쪽으로 통과할 때 식생 기준선을 넘는 순간 캐릭터 앞/뒤 순서가 잠깐 뒤집혔다.

## 수정
- flowers: ground-decoration layer
- grassTufts: ground-decoration layer
- bushes: ground-decoration layer로 이동
- reeds: ground-decoration layer로 이동
- 위 네 종류는 Y-depth queue에서 제거
- 나무, 건물, 바위, 표지판, 벤치, 가로등, NPC, 플레이어는 기존 depth 처리 유지

## 공식 규칙
**통과 가능(passable) 식생 = 항상 actor 아래.**
**충돌/가림(blocking or occluding) 오브젝트 = Y-depth 정렬.**

## 회귀 방지 체크
- 작은 식생 배열이 `renderables.push(...)`에 다시 들어가지 않을 것
- 작은 식생은 blocked set에 추가하지 않을 것
- 큰 나무/건물 depth 처리에는 변경을 가하지 않을 것
