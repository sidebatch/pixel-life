# 1단계 나무 이미지 후보 검토 — 2026-09-29

상태: **게임 연결·자동 QA 완료 / Android 실기기 확인 전**

기준: [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md), [`FORESTRY_TIER1_ASSET_BRIEF.md`](FORESTRY_TIER1_ASSET_BRIEF.md), [`LIFE_ASSET_STANDARD.md`](LIFE_ASSET_STANDARD.md)

## 결과물

모든 경로는 프로젝트 루트 기준이다. 생성에는 기본 내장 `image_gen`을 사용했고, 그다음 기존 `scripts/lib/png.mjs`의 최근접 픽셀 정규화로 게임 캔버스에 맞췄다. 원본은 `assets/forestry/candidates/tier1/source/`에 보존했다. 승인 후 게임 자산 폴더에 복사하고 새 경로로 등록했다. **기존 PNG 파일은 덮어쓰지 않았다.**

| 수종 | 종류 | 후보 PNG | 게임 캔버스 |
| --- | --- | --- | --- |
| 소나무 `pine` | 기존 목재 아이콘 새 스타일 | [`items/pine.png`](../assets/forestry/candidates/tier1/items/pine.png) | 96×96 |
| 버드나무 `willow` | 기존 목재 아이콘 새 스타일 | [`items/willow.png`](../assets/forestry/candidates/tier1/items/willow.png) | 96×96 |
| 가문비나무 `spruce` | 기존 목재 아이콘 새 스타일 | [`items/spruce.png`](../assets/forestry/candidates/tier1/items/spruce.png) | 96×96 |
| 오동나무 `paulownia` | 신규 나무·그루터기·목재 | [`trees/paulownia.png`](../assets/forestry/candidates/tier1/trees/paulownia.png), [`stumps/paulownia.png`](../assets/forestry/candidates/tier1/stumps/paulownia.png), [`items/paulownia.png`](../assets/forestry/candidates/tier1/items/paulownia.png) | 120×144 / 96×96 / 96×96 |
| 삼나무 `cedar` | 신규 나무·그루터기·목재 | [선 나무 v2](../assets/forestry/candidates/tier1/trees/cedar-v2.png), [`stumps/cedar.png`](../assets/forestry/candidates/tier1/stumps/cedar.png), [`items/cedar.png`](../assets/forestry/candidates/tier1/items/cedar.png) | 120×144 / 96×96 / 96×96 |

삼나무의 첫 나무 후보 [`trees/cedar.png`](../assets/forestry/candidates/tier1/trees/cedar.png)는 기존 가문비/소나무와 삼각 실루엣이 비슷해 보였다. 가지 간격과 붉은 줄기 노출을 키운 **v2를 게임의 `trees/cedar.png`에 채택**했다.

## 실제 크기 미리보기

- [가방 393px·3열·아이콘 78px 비교판](../assets/forestry/candidates/tier1/preview-inventory-393px.png): 현재 CSS의 아이콘 표시 크기·3열 구조를 따른 QA 전용 이미지. 영어 이름은 QA 식별용으로만 넣었으며 실제 게임에서는 이름 노출 방식이 다르다.
- [기존 3종 + 신규 2종 선 나무 비교판](../assets/forestry/candidates/tier1/preview-trees-5.png): 120×144 원화 크기로 배치했다.

목재 아이콘은 통나무 두 개와 수종별 작은 단서를 사용했다. 오동나무는 밝은 목재/하트 잎, 버드나무는 휜 수피/늘어진 잎, 가문비는 차가운 짙은 수피/청록 침엽, 소나무는 따뜻한 수피/솔방울, 삼나무는 붉은 수피/층진 침엽으로 구분한다. 다만 소나무·가문비는 둘 다 침엽수라 **실제 Android 가방 화면에서 추가 시각 확인**이 필요하다. 비교판은 실제 앱 스크린샷이 아니며 모바일 실기기 검수를 대신하지 않는다.

## 생성 프롬프트 묶음·재현

- 공통: Pixel Life 기존 PNG는 **스타일·규모 참조만**, 2.5D 손그림 픽셀 아트, 명확한 계단식 픽셀, 어두운 윤곽, 실제 투명 배경, 한 이미지에 자산 하나, 텍스트/배경/카드/그림자/워터마크 없음.
- 목재 5종: 두 짧은 통나무의 3/4 시점, 왼쪽 앞에 절단면·나이테, 수종별 껍질색·결, 작은 잎/침엽/솔방울 한 가지로 구별. 기존 소나무 아이콘과 사용자 제공 [비교판](references/forestry-item-style-2026-09-28.png)을 시작 참조로 사용했다.
- 오동나무 선 나무: 밝은 매끈한 줄기, 큰 연두색 하트형 잎, 가벼운 둥근 수관. 삼나무 선 나무: 붉은 섬유질 줄기, 짙은 녹색의 분리된 수평 가지 층; 첫 후보의 삼각형 실루엣을 수정해 v2 생성.
- 그루터기 2종: 해당 선 나무의 수피/단면색을 이어받고, 오동나무에는 작은 하트형 잎, 삼나무에는 붉은 수피와 침엽 단서.
- 정규화: `node scripts/prepare-forestry-tier1-assets.mjs`. 비교판: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/render-forestry-tier1-preview.ps1`.

## 게임 연결·검사 결과

- 오동나무·삼나무를 숲 1-1에 각 3그루 배치했다. 새 나무는 기본 도끼로 벨 수 있으며 고유 목재, 벌목 XP, 그루터기, 재생 상태와 가방·준의 판매 목록에 연결된다.
- 기존 소나무·버드나무·가문비나무의 목재 아이콘은 `-v2.png`로 새로 등록하고 원본 PNG를 보존했다.
- `cypress_log`는 ID·보유 수량을 유지하며 **편백나무**, 신규 `cedar_log`는 **삼나무**로 표시한다. 자동 저장·복원 검사에서 두 목재와 새 나무 HP를 확인했다.
- `scripts/check.mjs`, `scripts/build.mjs`, `scripts/qa-inventory-ui.mjs`, `scripts/qa-forestry-tier1.mjs` 통과. 마지막 검사는 393px 모바일 에뮬레이션에서 실제 숲 그림·벌목·가방·준의 판매 화면을 확인하며 스크린샷을 `output/forestry-tier1-qa/`에 남긴다.
- **남은 확인:** 실제 Android 기기에서 나무/목재 아이콘이 충분히 구별되는지 시각 검토한다. 모바일 에뮬레이션은 실기기 확인을 대신하지 않는다. 50종 카탈로그 전체의 단계 재배치·도끼 10단계·내구력은 별도 후속 작업이다.
