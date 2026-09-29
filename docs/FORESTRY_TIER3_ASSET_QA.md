# 3단계 나무 이미지 후보 검토 — 2026-09-29

상태: **11장 게임 연결·단풍나무 색 보정 1장·자동 QA 완료 / Android 실기기 확인 전**

기준: [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md), [`LIFE_ASSET_STANDARD.md`](LIFE_ASSET_STANDARD.md), [2단계 이미지 검토](FORESTRY_TIER2_ASSET_QA.md)

## 제작 범위

| 수종 | 선 나무 120×144 | 그루터기 96×96 | 목재 96×96 |
| --- | --- | --- | --- |
| 단풍나무 `maple` | 기존 게임 그림 유지 | 기존 게임 그림 유지 | [실제 게임 그림에 맞춘 보정 후보](../assets/forestry/candidates/tier3/items/maple-v2.png) |
| 밤나무 `chestnut` | [새 후보](../assets/forestry/candidates/tier3/trees/chestnut.png) | [새 후보](../assets/forestry/candidates/tier3/stumps/chestnut.png) | [새 후보](../assets/forestry/candidates/tier3/items/chestnut.png) |
| 호두나무 `walnut` | [새 후보](../assets/forestry/candidates/tier3/trees/walnut.png) | [새 후보](../assets/forestry/candidates/tier3/stumps/walnut.png) | [새 후보](../assets/forestry/candidates/tier3/items/walnut.png) |
| `broadleaf` | 기존 게임 그림 유지 | 기존 게임 그림 유지 | [새 후보](../assets/forestry/candidates/tier3/items/broadleaf.png) |
| 느티나무 `zelkova` | [새 후보](../assets/forestry/candidates/tier3/trees/zelkova.png) | [새 후보](../assets/forestry/candidates/tier3/stumps/zelkova.png) | [새 후보](../assets/forestry/candidates/tier3/items/zelkova.png) |

처음 생성한 원본 11장과 단풍 색 보정 원본 1장은 `assets/forestry/candidates/tier3/source/`에 보존했다. 내장 `image_gen`으로 개별 투명 PNG를 만들고 `scripts/prepare-forestry-tier3-assets.mjs`로 규격에 맞춰 최근접 축소했다. 승인 후 새 그림을 실제 게임 자산 경로에 복사하고 데이터·맵에 등록했다. **기존 PNG를 덮어쓰지 않았고 기존 나무/목재 ID와 저장 수량도 변경하지 않았다.**

## 실제 크기 비교

- [3단계 나무 5종](../assets/forestry/candidates/tier3/preview-trees-5.png): 단풍나무·`broadleaf`는 현재 게임 그림을 그대로 놓고 비교.
- [3단계 가방 3열·78px 아이콘](../assets/forestry/candidates/tier3/preview-inventory-393px.png)
- [1~3단계 목재 15종 함께 보기](../assets/forestry/candidates/tier3/preview-tier1-tier2-tier3-icons-393px.png)
- [신규 그루터기 3종](../assets/forestry/candidates/tier3/preview-stumps-3.png)

밤나무는 가시 달린 밤송이와 길쭉한 잎, 호두나무는 둥근 열매와 짙은 수피, 느티나무는 넓게 퍼지는 가지와 밝은 잎을 식별점으로 삼았다. 처음 비교판은 `maple.png` 원본(초록 수관)을 실게임 그림으로 착각했다. 게임이 실제 쓰는 `maple-v2.png`는 붉은 단풍이므로, **목재 잎만 붉은색으로 보정**하고 비교판도 게임 그림 기준으로 다시 만들었다. 기존 `broadleaf` 그림은 플라타너스 특유의 얼룩무늬 수피로 읽히지 않는다. 따라서 카탈로그의 **플라타너스 대응은 미확정**이며, 목재도 기존 그림에 맞춰 제작했다. 이름을 바꾸려면 별도 원화 판단이 필요하다.

## 생성 프롬프트 묶음

방법: 내장 `image_gen`, `transparent_background=true`, 별도 이미지 참조 없이 11종 각각 생성. 공통 프롬프트는 `stylized-concept` / Pixel Life용 2.5D 손그림 픽셀 아트 / 또렷한 어두운 윤곽과 색 덩어리 음영 / 완전 투명 배경 / 한 개체만 / 글씨·카드·장면·그림자 원·워터마크 없음. 나무 밑동은 하단 중앙, 그루터기는 약간 위에서 내려다본 모습, 목재는 **두 개의 짧은 통나무·왼쪽 앞 절단면·나이테·작은 수종 단서**로 통일했다. 보정 1장은 기존 단풍 목재 원본을 편집 대상으로, 실사용 `maple-v2.png` 선 나무를 색 참고로 넣어 **잎만 선명한 붉은색·주황색·금색으로 바꾸고 통나무/나이테/배치/투명도는 유지**하도록 요청했다.

| 대상 | 개별 프롬프트의 핵심 |
| --- | --- |
| 밤나무 선 나무/그루터기/목재 | 넓은 짙은 초록 수관·가시 밤송이·길쭉한 톱니 잎 / 따뜻한 갈색 수피·밤송이 / 황금빛 단면·밤송이·잎 |
| 호두나무 선 나무/그루터기/목재 | 무겁고 둥근 진초록 수관·짙은 줄기·동그란 호두 / 진갈색 수피·호두 / 진한 수피·호박색 단면·호두와 겹잎 |
| 느티나무 선 나무/그루터기/목재 | 위로 갈라져 넓게 퍼지는 가지·밝은 초록 수관 / 퍼진 뿌리·회갈색 수피 / 연한 단면·잔 톱니잎 |
| 단풍나무 목재 | 최초 초록 원본은 검토용으로 보존. 실사용 붉은 단풍 수관에 맞도록 잎만 선홍·주황·금색으로 보정한 v2 채택 |
| `broadleaf` 목재 | 기존 청록 수관·중간 갈색 줄기에 맞춘 활엽수 목재, 플라타너스식 얼룩 수피는 사용하지 않음 |

## 게임 연결·검증

`node scripts/check-forestry-tier3-assets.mjs`에서 최초 11장과 단풍 보정 1장 모두 투명 PNG, 캔버스 크기, 불투명 픽셀 수, 여백·잘림 검사 통과. `scripts/render-forestry-tier3-preview.ps1`로 비교판 네 장을 만들고 실제 모바일 아이콘 크기를 눈으로 확인했다.

신규 `chestnut`/`walnut`/`zelkova`를 숲 1-2 북쪽 구역에 각 3그루씩 **새 고유 ID**로 배치했다. 기존 절차 생성 나무의 종·저장 HP는 그대로다. 새 나무는 현행 강철 도끼로 160HP/4타, 목재 1~3개, 5분 재생이다. 벌목 XP/목재 판매가는 각각 밤 58/43, 호두 62/46, 느티 68/50의 임시 밸런스다. 기존 `maple_log`와 `broadleaf_log` ID·보유 수량은 그대로 두고 그림 URL만 `maple-v3.png`와 `broadleaf-v2.png`로 등록했다.

`scripts/check.mjs`에서 새 수종 데이터·그림·강철 도끼 제한·벌목 보상·판매가·저장 복원·기존 나무 생성 규칙을 검사했다. `scripts/qa-forestry-tier3.mjs`는 393px 모바일 크기 브라우저에서 실제 숲, 가방, 준의 판매와 코인 증가, 새로고침 후 목재·코인·나무 HP 복원을 확인하고 `output/forestry-tier3-qa/`에 화면을 남긴다. 1·2단계 벌목, 가방, 장비 사용 회귀 QA도 통과했다. **실제 Android 실기기 검수는 남아 있다.**

`broadleaf`의 표시명을 플라타너스로 바꾸는 일, 기존 수종의 단계 재배치, 도끼 제조법/내구력 개편은 이 단계에 포함하지 않는다. **GitHub 배포 링크는 이번 작업으로 변경되지 않았다.**
