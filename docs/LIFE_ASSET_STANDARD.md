# 벌목·농사 이미지 규격

2026-09-24 기준. 생활 콘텐츠 PNG는 투명 배경의 독립 파일이다. 게임 타일은 48×48이며 Canvas에서 픽셀 스냅으로 그린다.

| 용도 | 게임 경로 | 크기 | 연결 위치 |
|---|---|---:|---|
| 숲의 살아 있는 나무 8종 | `assets/forestry/trees/*.png` | 120×144 | 숲의 모든 나무 |
| 벌목 후 그루터기 8종 | `assets/forestry/stumps/*.png` | 96×96 | 나무 재생 전 |
| 종류별 통나무 8종 | `assets/forestry/items/{oak,pine,birch,maple,spruce,willow,cypress,broadleaf}.png` | 96×96 | 벌목 보상·가방·상점 |
| 기존 일반 통나무 | `assets/forestry/items/log.png` | 96×96 | 이전 저장 호환 |
| 현재 작물의 씨앗 4종 | `assets/farming/seeds/*.png` | 96×96 | 구매·가방·심기 |
| 다 자란 밭 작물 4종 | `assets/farming/mature/*.png` | 96×96 | 수확 가능한 밭 |
| 수확물 4종 | `assets/farming/harvest/*.png` | 96×96 | 가방·상점 |

처음 제공된 `Trees.zip`은 살아 있는 나무 8종과 그루터기 7종을 제공했다. 빠진 삼나무 그루터기는 기존 이미지 스타일을 참고해 제작했다. 이후 사용자 제공 `나무 벌목후.zip`, `수확전.zip`, `수확 후.zip`의 PNG를 각각 종류별 통나무, 다 자란 밭 작물, 수확물로 연결했다. 무작위 원본 파일명은 이미지 내용을 확인해 종류에 맞게 매핑했다. 큰 원본은 최근접 보간으로 96×96에 맞췄으며 원본 ZIP은 변경하지 않았다.

현재 게임에 있는 작물은 당근·감자·옥수수·딸기뿐이다. 다른 작물 그림은 원본 ZIP에 있지만 해당 작물 데이터·성장 시간·가격이 없으므로 아직 추가하지 않았다. 새 그림은 `src/assets.js`에 등록되어 단일 HTML 빌드에도 포함된다. 나무 종과 고유 ID는 `src/data/region-maps.js`·`src/world.js`가 선택하고, 종류별 보상·판매·저장은 `src/life-content.js`·`src/market.js`·`src/save.js`에서 처리한다.
