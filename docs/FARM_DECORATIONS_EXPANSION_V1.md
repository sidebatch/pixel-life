# 농장 소품 확장 v1

2026-10-13 사용자가 ‘교환권으로 더 많은 객체를 설치할 수 있게 몇 개 더 만들어주세요’로 요청했다. 꽃 화분·건초 더미·나무 물통·나무 벤치·작은 우물 5종을 추가해 총 8종을 로컬 구현했다. 새 5종은 아직 공개 배포 전이며 공개 게임은 기존 3종/PWA 61b8656eecda다.

## 교환과 설치

| 새 소품 | 교환권 | 고정 설치 위치 |
| --- | ---: | --- |
| 꽃 화분 | 2장 | 밭 왼쪽 아래 (13,25) |
| 건초 더미 | 4장 | 밭 오른쪽 (23,24) |
| 나무 물통 | 6장 | 농장 왼쪽 아래 (13,27) |
| 나무 벤치 | 10장 | 농장 아래 (17–18,29) |
| 작은 우물 | 12장 | 농장 오른쪽 아래 (24–25,29) |

기존 허수아비 3장·표지판 5장·꽃 울타리 8장의 가격/좌표는 유지한다. 새 5종 합계 34장, 전체 8종 합계 50장이다. 꽃 화분부터 큰 우물까지 반복 납품의 목표를 제공하며 주문 수량/보상·단계·농사 XP·부지 구매 가격은 기존 규칙을 유지한다.

엘리 상점/농장의 ‘농장 꾸미기’에서 교환하고 농장에서 설치·회수한다. 한 번 교환하면 영구 보유하며 설치/회수/재설치는 무료다. 농장 외형 소품이며 수확량·성장시간·XP 보너스는 없다. 새 위치는 기존 길/밭/물/나무·바위/소품과 겹치지 않는다.

벤치와 우물은 각각 두 칸을 차지한다. slots는 두 칸의 이동 차단/플레이어 점유 검사에 사용하고 renderSlots는 가운데에 그림 하나만 표시한다. 벤치의 위쪽 투명 여백을 표시 크기에 반영해 눌려 보이지 않도록 했다. 기존 꽃 울타리의 7구간 반복을 유지하며 나무/캐릭터와 같은 깊이 큐에서 표시한다.

## 저장과 그림

기존 pixel-life.save.v2/버전 2와 farmOrders.schemaVersion:1을 유지하고 새 소품 ID만 추가한다. 기존 주문/완료 횟수/교환권·3종 보유/설치·다른 저장을 보존한다. 교환/설치/회수 저장 실패를 원자적으로 복원하며 충돌은 저장 성공 후에만 바뀐다.

- 최종 투명 96×96 PNG: assets/farming/decorations/{flowerpot,haybale,waterbarrel,bench,well}-v1.png
- 내장 image_gen 생성 원본: assets/farming/decorations/source-expansion-v1/{flowerpot,haybale,waterbarrel,bench,well}.png
- [전체 프롬프트](../assets/farming/decorations/source-expansion-v1/prompts.json), [패킹 명세/최종 경로](../assets/farming/decorations/source-expansion-v1/manifest.json)
- 재현: scripts/pack-farm-decorations-expansion-v1.mjs. 생성 알파 유지/최근접 보간이며 기존 그림은 덮어쓰지 않았다.
- 카탈로그/좌표/가격: src/data/farm-orders-data.js, 그림 등록: src/assets.js, 여러 칸 소품의 단일 렌더링: src/farm-orders.js.
- 미리보기: output/farm-decorations-expansion-v1/decorations.png

## 검증

- scripts/qa-farm-orders.mjs: 3,500개 주문/경제/저장 사례, 기존 3종 보유/설치·주문/교환권 저장의 정확한 유지, 8종 교환/설치/실패 복원/재접속/회수, 모든 점유 칸 위 설치 거부, 길/소품 중복 없음, 벤치/우물 단일 렌더링과 전체 밭/통로/출구 접근 통과.
- 전체 검사: 51 runtime scripts/141 UI ids/450 assets/74 fish, 기존 캐릭터·검/낫/생활·저장 계약 통과.
- 배포용 로컬 빌드: 20,378,292 bytes, PWA b7849ed1e512. 새 그림 5종은 단일 HTML에 포함된다.
- 393×780/320×568 배포용 로컬 HTML: 실제 납품으로 50장 이상 획득→8종 교환→설치→재접속→8종 회수/재설치, 정확한 소비/보상·주문 단계·실패 복원/이력·44px 버튼·가로 넘침 없음 통과. 실제 사용자 저장과 분리된 컨텍스트다.
- 결과/화면: output/farm-decorations-expansion-v1/{source-check.txt,browser-built/report.json,browser-built/decorated-farm-393.png,browser-built/garden-corner-393.png,decorations.png}.
