# 벌목·농사 이미지 규격

2026-09-24 기준. 생활 콘텐츠 PNG는 투명 배경의 독립 파일이다. 게임 타일은 48×48이며 Canvas에서 픽셀 스냅으로 그린다.

| 용도 | 게임 경로 | 크기 | 연결 위치 |
|---|---|---:|---|
| 숲의 살아 있는 나무 8종 | `assets/forestry/trees/*.png` | 120×144 | 숲의 모든 나무 |
| 벌목 후 그루터기 8종 | `assets/forestry/stumps/*.png` | 96×96 | 나무 재생 전 |
| 종류별 통나무 8종 | `assets/forestry/items/{oak,pine,birch,maple,spruce,willow,cypress,broadleaf}.png` | 96×96 | 벌목 보상·가방·상점 |
| 기존 일반 통나무 | `assets/forestry/items/log.png` | 96×96 | 이전 저장 호환 |
| 작물 씨앗 10종 | `assets/farming/seeds/*.png` | 96×96 | 구매·가방·심기 |
| 작물별 어린 잎 10종 | `assets/farming/young/*.png` | 96×96 | 성장 중간 단계 |
| 다 자란 밭 작물 10종 | `assets/farming/mature/*.png` | 96×96 | 수확 가능한 밭 |
| 수확물 10종 | `assets/farming/harvest/*.png` | 96×96 | 가방·상점 |

처음 제공된 `Trees.zip`은 살아 있는 나무 8종과 그루터기 7종을 제공했다. 빠진 삼나무 그루터기는 기존 이미지 스타일을 참고해 제작했다. 이후 사용자 제공 `나무 벌목후.zip`, `수확전.zip`, `수확 후.zip`의 PNG를 각각 종류별 통나무, 다 자란 밭 작물, 수확물로 연결했다. 무작위 원본 파일명은 이미지 내용을 확인해 종류에 맞게 매핑했다. 큰 원본은 최근접 보간으로 96×96에 맞췄으며 원본 ZIP은 변경하지 않았다.

게임 작물은 당근·순무·감자·양파·양배추·밀·옥수수·토마토·딸기·호박 10종이다. 기존 4종 외 6종은 사용자 제공 `Seeds.zip`, `수확전.zip`, `수확 후.zip`에서 씨앗·다 자란 작물·수확물 그림을 매핑했다. 새 그림은 `src/assets.js`에 등록되어 단일 HTML 빌드에도 포함된다. 추가 6종의 성장 시간·가격은 정해진 설계값이 없어 `src/data/life-content-data.js`에 임시 밸런스로 기록했다. 나무 종과 고유 ID는 `src/data/region-maps.js`·`src/world.js`가 선택하고, 종류별 보상·판매·저장은 `src/life-content.js`·`src/market.js`·`src/save.js`에서 처리한다.

중간 성장 그림 10종은 게임의 완성 작물 그림을 스타일 참고로 새로 제작했다. 각 작물의 어린 잎만 보이며 수확물은 드러나지 않는다. 심은 직후의 덮인 흙과 첫 새싹은 공용 Canvas 픽셀 도형이라 별도 이미지 파일이 없다. 기존 완성 작물 그림을 축소해 성장 단계에 재사용하지 않는다.
