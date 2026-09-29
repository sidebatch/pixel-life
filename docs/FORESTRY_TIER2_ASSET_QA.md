# 2단계 나무 이미지 후보 검토 — 2026-09-29

상태: **11장 게임 연결·자동 QA 완료 / Android 실기기 확인 전**

기준: [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md), [`LIFE_ASSET_STANDARD.md`](LIFE_ASSET_STANDARD.md), [1단계 그림 검토](FORESTRY_TIER1_ASSET_QA.md)

## 제작 범위

| 수종 | 선 나무 120×144 | 그루터기 96×96 | 목재 96×96 |
| --- | --- | --- | --- |
| 편백나무 `cypress` | 기존 게임 그림 유지 | 기존 게임 그림 유지 | [새 후보](../assets/forestry/candidates/tier2/items/cypress.png) |
| 은행나무 `ginkgo` | [새 후보](../assets/forestry/candidates/tier2/trees/ginkgo.png) | [새 후보](../assets/forestry/candidates/tier2/stumps/ginkgo.png) | [새 후보](../assets/forestry/candidates/tier2/items/ginkgo.png) |
| 자작나무 `birch` | 기존 게임 그림 유지 | 기존 게임 그림 유지 | [새 후보](../assets/forestry/candidates/tier2/items/birch.png) |
| 낙엽송 `larch` | [새 후보](../assets/forestry/candidates/tier2/trees/larch.png) | [새 후보](../assets/forestry/candidates/tier2/stumps/larch.png) | [새 후보](../assets/forestry/candidates/tier2/items/larch.png) |
| 벚나무 `cherry` | [새 후보](../assets/forestry/candidates/tier2/trees/cherry.png) | [새 후보](../assets/forestry/candidates/tier2/stumps/cherry.png) | [새 후보](../assets/forestry/candidates/tier2/items/cherry.png) |

생성 원본 11장은 `assets/forestry/candidates/tier2/source/`에 보존한다. 내장 `image_gen`으로 개별 투명 PNG를 만든 뒤 `scripts/prepare-forestry-tier2-assets.mjs`로 게임 캔버스에 최근접 정규화했다. `scripts/render-forestry-tier2-preview.ps1`는 393px 모바일 가방 3열·아이콘 78px과 숲/그루터기 비교판만 만든다. 승인 후 실제 게임 자산 경로로 복사하고 코드에 등록했다. **기존 PNG는 덮어쓰지 않았고 GitHub 배포 링크도 아직 변경하지 않았다.**

## 실제 크기 비교

- [2단계 나무 5종 비교](../assets/forestry/candidates/tier2/preview-trees-5.png): 편백·자작나무는 현행 게임 그림을 놓고 신규 3종을 비교했다.
- [2단계 목재 가방 크기](../assets/forestry/candidates/tier2/preview-inventory-393px.png)
- [1·2단계 목재 10종 함께 보기](../assets/forestry/candidates/tier2/preview-tier1-tier2-icons-393px.png): 삼나무(`cedar`)와 편백나무(`cypress`)의 구분 포함.
- [신규 그루터기 3종](../assets/forestry/candidates/tier2/preview-stumps-3.png)

은행나무는 황금색 부채꼴 잎, 낙엽송은 비어 보이는 층진 황금 침엽, 벚나무는 연분홍 꽃과 가로 수피선을 단서로 삼았다. 목재는 1단계와 같은 **짧은 통나무 두 개·왼쪽 앞 나이테·작은 수종 단서** 문법을 썼다. 편백은 밝은 수피와 편평한 비늘잎, 삼나무는 붉은 수피와 층진 침엽으로 분리했다. 작은 78px 그림에서도 색·형태가 구별되지만 실제 Android 시각 검수는 남아 있다.

## 생성 프롬프트 묶음

사용 사례는 모두 `stylized-concept`, 용도는 Pixel Life의 2.5D 손그림 픽셀 아트다. 공통 조건: 어두운 또렷한 픽셀 윤곽과 색 덩어리 음영, 한 PNG에 개체 하나, 완전 투명 배경, 글씨·카드·그림자 원·장면·워터마크 없음. 선 나무는 밑동 하단 중앙, 그루터기는 절단면과 수피를 선 나무와 맞추고, 목재는 78px 모바일 카드에서 읽히게 했다.

| 대상 | 개별 프롬프트의 핵심 특징 |
| --- | --- |
| 은행나무 선 나무/그루터기/목재 | 넓은 불규칙 수관의 금색 부채꼴 잎 / 회갈색 뿌리와 연한 나이테 / 황금 부채잎 작은 가지가 붙은 황갈색 두 통나무 |
| 낙엽송 선 나무/그루터기/목재 | 가지 사이가 비는 위로 층진 가는 줄기, 호박색·연두색 침엽 / 적갈색 수피·호박색 절단면 / 솔방울 없는 황금 침엽 가지와 적갈색 두 통나무 |
| 벚나무 선 나무/그루터기/목재 | 연분홍 꽃의 비대칭 수관·가로 수피선 / 회갈색 수피·핑크빛 절단면·작은 꽃 / 가로 수피선과 꽃가지가 붙은 복숭아빛 두 통나무 |
| 편백나무 목재 | 밝은 적갈색의 비교적 매끈한 수피, 크림색 나이테, 편평한 짙은 초록 비늘잎 가지. 새 삼나무와 색/잎 구분 |
| 자작나무 목재 | 흰 종잇장 같은 수피와 검은 가로 얼룩, 연한 크림색 나이테, 작은 녹색 잎 |

## 게임 연결·검증

`node scripts/check-forestry-tier2-assets.mjs`에서 후보 11장의 투명 알파·캔버스 크기·여백/잘림을 통과했다. 네 비교판을 눈으로 확인했다.

신규 `ginkgo`/`larch`/`cherry`를 숲 1-2 중간 구역에 각 3그루씩 **고유 고정 ID**로 배치했다. 기존 절차 생성 나무의 종·저장 HP는 그대로다. 새 나무는 현행 철 도끼로 120HP/3타, 목재 1~3개, 5분 재생이다. 벌목 XP/목재 판매가는 각각 은행 25/25, 낙엽송 29/28, 벚나무 27/26의 임시 밸런스다. `cypress`/`birch` 목재 ID·보유 수량은 유지하면서 새 그림 URL `cypress-v2.png`/`birch-v2.png`만 사용한다.

`scripts/check.mjs`는 신규 수종 데이터·그림·도끼 제한·벌목 보상·준의 판매·저장 복원과 기존 숲 좌표별 수종 불변을 검사한다. `scripts/qa-forestry-tier2.mjs`는 모바일 크기 브라우저에서 실제 숲, 가방, 준의 판매 화면과 코인 증가를 검사하고 `output/forestry-tier2-qa/`에 스크린샷을 남긴다. 393px 화면에서 벚나무와 낙엽송이 겹치던 고정 위치를 벌려 조정했다. **실제 Android 실기기 검수는 아직 남았다.**

50종 카탈로그의 기존 수종 단계 재배치, 기존 도끼 제조법, 10단계 도끼/내구력은 적용하지 않았다. 카탈로그 2단계인 기존 `cypress`는 현행처럼 강철 도끼, 기존 `birch`는 기본 도끼가 필요하다.
