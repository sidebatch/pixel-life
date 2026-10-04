# 외부 Chat 파일 반입 안내 — 도끼 10단계·나무 50종

상태: **제작 완료 후 보존한 과거 반입 안내 — 새 작업 기준으로 사용하지 않음** · 작성: 2026-09-28 · 완료: 2026-10-04

> 이 문서로 요청했던 도끼 10종·나무 50종 그림과 게임 연결은 완료됐다. 새 세션은 [`HANDOFF.md`](HANDOFF.md)와 [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md)를 우선하고, 이 문서의 `게임 적용 전`, `기존 8종·도끼 4종`, `아직 게임이 읽지 않는 폴더` 같은 문장은 당시 제작 절차의 기록으로만 읽는다.

이 문서는 사용자가 **별도의 Chat 대화에서 파일을 받을 때만** 사용하는 반입 경로 안내다. 현재 50종 제작 명단은 이미 [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md)에 들어왔고, 이미지는 이 게임 작업 대화에서 제작할 수 있다. 다른 Codex Work 작업이나 별도의 Git 작업을 만들 필요가 없다. 그림을 만들었다는 사실만으로 게임에 새 나무·도끼·규칙이 적용된 것은 아니다.

## 0. Chat으로 가져갈 파일과 되가져올 위치

프로젝트 실제 폴더(아래의 모든 상대 경로는 이 폴더 기준):

```text
C:\Users\leeks\Desktop\바이브코딩\4. open world\pixel-life-path-redesign-v5\pixel-life-path-redesign-v5
```

**새 Chat 대화에 첨부할 것 — 나무 제작 시작용:**

1. `docs/FORESTRY_TREE_CATALOG.md` — **이미 정해진 50종 이름·ID·단계**. 새 목록을 다시 만들 필요가 없다.
2. 이 문서와 `docs/FORESTRY_TIER1_ASSET_BRIEF.md` — 반입 경로와 첫 제작 묶음. 도끼·내구력 맥락이 필요할 때만 `docs/FORESTRY_10_STAGE_DESIGN.md`를 추가한다.
3. **참고 그림 원본 PNG 5장:** `assets/forestry/trees/oak.png`, `assets/forestry/trees/maple-v2.png`, `assets/forestry/trees/spruce-v2.png`, `assets/forestry/stumps/oak.png`, `assets/forestry/items/oak.png`. 스크린샷 대신 투명 원본 파일로 첨부한다.
4. 필요할 때 `docs/LIFE_ASSET_STANDARD.md` — 나무·그루터기·목재 아이콘의 프로젝트 규격 상세.

**도끼 그림까지 별도로 부탁할 때 추가 첨부:** `docs/CHARACTER_ASSET_STANDARD.md`, `docs/character-standard-v4.json`, `assets/forestry/axes/master.png`(상점용 큰 그림), `assets/player/rig-v1/tools/axe-master.png`(캐릭터 손에 쥐는 96×96 PNG). 두 도끼 파일의 용도가 다르므로 섞지 않는다. 전체 프로젝트 폴더·개인 저장 데이터·Git 인증 정보는 Chat에 올릴 필요가 없다.

**Chat 결과물은 내려받아 여기로 복사한다 — 아직 게임이 읽는 폴더가 아닌 안전한 임시 접수함:**

```text
C:\Users\leeks\Desktop\바이브코딩\4. open world\pixel-life-path-redesign-v5\pixel-life-path-redesign-v5\incoming\forestry-chat\
```

ZIP 한 개로 받았다면 압축을 풀지 않고 위 폴더에 그대로 놓아도 된다. 낱장으로 받았다면 `trees\`, `stumps\`, `items\`, `catalog\`, `previews\`, 필요하면 `axes\held\`, `axes\icons\` 하위 폴더에 넣는다. 파일 이름은 아래 표의 `{id}.png` 방식으로 정리하고, 기존 파일을 덮어쓰지 않는다. 이 `incoming` 폴더는 Git/배포 대상에서 제외된다. 파일을 넣은 다음 이 작업 대화에서 **“incoming/forestry-chat에 넣었어요. 확인하고 게임에 연결해주세요”**라고 알려주면 된다. Chat에서 만든 파일을 이 대화에 직접 첨부해도 된다.

Chat이 정확한 크기나 투명 배경의 PNG를 제공하지 못했다면 화면 캡처를 규격 완료품으로 간주하지 말고, 가능한 한 원본 파일을 가져와 `규격 확인 필요`라고 알려준다. 여기서 실제 파일을 검사해 변환 가능 여부를 판단한다.

### 새 Chat에 바로 붙여넣을 요청문

> Pixel Life 게임의 나무 픽셀 아트를 만들고 싶습니다. 첨부한 `FORESTRY_TREE_CATALOG.md`의 **기존 50종 이름·ID·단계**를 그대로 사용하고 새 수종 목록이나 경도표는 만들지 마세요. 우선 `FORESTRY_TIER1_ASSET_BRIEF.md`의 1단계부터 제작합니다. 신규 수종은 살아 있는 나무 120×144, 그루터기 96×96, 목재 아이콘 96×96의 **각각 별도 투명 PNG 파일**로 주세요. 기존 3종의 목재 아이콘도 참고 비교판 스타일의 교체 후보로 만들되 기존 원본 파일은 덮어쓰지 마세요. 완료한 파일과 미완료 파일을 분명히 구분해 주세요. 소스 코드 수정이나 게임 배포는 하지 않습니다.

## 목표와 작업 경계

- 도끼 10단계에 맞춰 나무를 단계당 기본 5종, **총 50종**으로 설계한다. 최소 4종·필요 시 6종은 장기 확장 범위이지만, 이번 납품 목록은 5종씩 50종으로 작성한다.
- 이미 반입한 카탈로그는 1–7단계(35종)를 세계 각지의 **실제 수종**, 8–10단계(15종)를 **창작 판타지 수종**으로 배치한다. 실제 수종의 경도는 초기 선정 참고일 뿐 이번 이미지 제작 필수 데이터가 아니다.
- 게임에는 이미 나무 8종과 도끼 4종이 있다. 기존 나무 ID `oak`, `pine`, `birch`, `maple`, `spruce`, `willow`, `cypress`, `broadleaf` 및 기존 도끼 ID `axe.basic`, `axe.iron`, `axe.steel`, `axe.master`는 **삭제·재사용·이름 변경하지 않는다**. 기존 나무의 단계 재배치는 별도의 저장·레시피 이행 작업이다.
- 50종 기준 **새 수종 42종**이 필요하다. 신규 3장씩 **126장**, 기존 8종의 목재 아이콘 새 스타일 후보 **8장**, 총 제작·검토 대상은 **134장**이다. 기존 원화의 단순 확대·색 교체만으로 새 종을 채우지 않는다.
- 외부 Chat을 쓴다면 납품은 **기존 카탈로그 ID에 맞는 이미지 파일 + 매핑표 + 미완료 목록**이다. 이 문서만을 근거로 게임 소스·저장·맵·밸런스·상점·배포를 수정하지 않는다. 특히 기존 게임 링크를 바꾸거나 배포하지 않는다. 통합 구현은 결과물을 가져온 뒤 이 게임 작업 대화에서 검토한다.

기준 설계는 [`FORESTRY_10_STAGE_DESIGN.md`](FORESTRY_10_STAGE_DESIGN.md), 이미지 규격은 [`LIFE_ASSET_STANDARD.md`](LIFE_ASSET_STANDARD.md)다. 도끼를 제작한다면 반드시 [`CHARACTER_ASSET_STANDARD.md`](CHARACTER_ASSET_STANDARD.md)와 `docs/character-standard-v4.json`도 같이 참고한다. 새 Chat에는 위의 기준 문서와 참고 PNG를 실제 파일로 첨부한다. **로컬 경로만 적으면 Chat이 파일 내용을 볼 수 있다고 가정하지 않는다.**

## 이미 반입한 50종 목록과 이름 매핑

수종 목록의 단일 기준은 [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md)다. 이미지 제작용 목록은 이미 **10단계×5종=50종, 기존 8종·신규 42종, 중복 ID 없음**으로 들어왔다. 새 Chat에서 50종 목록을 다시 작성하거나 경도값·출처 필드를 필수로 추가하지 않는다. HP·도끼 피해·수리비는 이미지 제작이 아니라 별도 게임 밸런스 작업이다.

| ID | 현재 게임 표시 | 제작 목록 표시 | 유지/추가할 목재 ID |
| --- | --- | --- | --- |
| `cypress` | 삼나무 | **편백나무** | 기존 `cypress_log` 유지 |
| `cedar` | 없음 | **삼나무** | 신규 `cedar_log` 추가 |

기존 `cypress`의 보유품을 `cedar`로 변환하지 않는다. 두 이름은 실제 게임에 연결할 때 함께 변경한다. `broadleaf`의 플라타너스 재해석도 기존 내부 ID와 저장을 보존한다. 도끼 단계 이름과 내구력 방향은 [`FORESTRY_10_STAGE_DESIGN.md`](FORESTRY_10_STAGE_DESIGN.md)의 **게임 미적용 설계안**이다.

## 나무 이미지 제작 규격

| 대상 | 납품 경로 형식 | 투명 PNG 캔버스 |
| --- | --- | ---: |
| 살아 있는 나무 | 접수: `incoming/forestry-chat/trees/{id}.png` → 검수 후 게임: `assets/forestry/trees/{id}.png` | **120×144 px** |
| 벌목 뒤 그루터기 | 접수: `incoming/forestry-chat/stumps/{id}.png` → 검수 후 게임: `assets/forestry/stumps/{id}.png` | **96×96 px** |
| 해당 종의 목재 가방·상점 아이콘 | 접수: `incoming/forestry-chat/items/{id}.png` → 검수 후 게임: `assets/forestry/items/{id}.png` | **96×96 px** |

모든 이미지는 픽셀 아트, 투명 배경, 독립 PNG, 글씨·워터마크·배경 타일 없음. 48×48 게임 타일과 기존 원화의 시점·윤곽선·채도·명암에 맞춘다. 나무 밑동은 현재 나무처럼 이미지 하단 중앙에 두고 캔버스 경계에서 잘리지 않게 한다. 그루터기는 해당 나무의 껍질/단면과 연결돼 보여야 한다. 목재 아이콘은 그루터기나 선 나무의 축소본이 아니라 **그 종에서 나온 목재로 인식되는 별도 아이템 그림**이어야 한다. 가방 3열 카드와 Android 실제 표시 크기에서 같은 단계의 5종을 구별할 수 있어야 한다. 각 종의 실제 잎 모양·수형·껍질 특징을 가능한 범위에서 반영하고, 판타지 나무는 실루엣·색·장식으로 서로 구별한다. 96×96 캔버스는 게임의 자산 규격이지 원화의 모든 픽셀을 빈틈없이 채우라는 뜻이 아니다.

스타일 참조용 현행 파일: `assets/forestry/trees/oak.png`, `assets/forestry/trees/maple-v2.png`, `assets/forestry/trees/spruce-v2.png`, `assets/forestry/stumps/oak.png`, `assets/forestry/items/oak.png`. 단풍·가문비는 게임에서 `-v2`가 살아 있는 나무 이미지로 쓰인다. [새 목재 아이콘 참고 비교판](references/forestry-item-style-2026-09-28.png)은 **개별 PNG가 아니며** 배경·글씨를 게임에 넣지 않는다. 기존 8종의 나무/그루터기는 우선 유지하고 목재 아이콘은 같은 스타일의 후보를 만든다. 기존 파일과 사용자 원본 ZIP은 검수 전 덮어쓰지 않는다. 다른 게임의 이미지나 저작권 있는 스프라이트를 복사하지 않는다.

## 신규 도끼 그림을 함께 만든다면

이 부분은 나무 50종 작업과 **분리된 두 번째 납품 묶음**이다. 기존 1–4단계 도끼는 유지하고 5–10단계의 외형 후보를 만든다. 상점/가방용 아이콘과 캐릭터 손에 쥐는 그림은 **서로 다른 파일**이다. 휴대·휘두름용 도끼는 접수함의 `incoming/forestry-chat/axes/held/axe-{id}.png`에, 큰 상점용 그림은 `incoming/forestry-chat/axes/icons/{id}.png`에 둔다. 검수 후 최종 연결 후보 경로는 각각 `assets/player/rig-v1/tools/axe-{id}.png`, `assets/forestry/axes/{id}.png`다. 휴대·휘두름용 그림은 **96×96 투명 PNG**이며 도끼만 그린다. 큰 상점용 그림은 기존 `master.png`가 **1254×1254 px**인 점을 참고하되 Chat이 다른 크기로 내보냈다면 원본을 보존하고 접수 때 기록한다. 각 휴대 PNG의 실제 손잡이 쥐는 점 `grip(x,y)`과 날 쪽 끝점 `tip(x,y)`을 픽셀 좌표로 매핑표에 적는다. 기존 오른손 위치·4방향·2프레임·가림·앞/뒤 날 투영·캐릭터 배율은 바꾸지 않는다. 현재 도끼 아이콘 `assets/forestry/axes/{basic,iron,steel,master}.png`를 시각 참조로 삼되 새 아이콘의 표시 크기/투명 여백은 기존 UI에서 실제 확인한다. 금속·보석에서 숲의 판타지로 상승하는 단계 차이를 96px 화면에서도 읽을 수 있게 한다. 새 무기 때문에 몸·손·기존 무기 그림·공통 리그를 수정해야 한다면 그 이미지는 호환 완료가 아니다.

## 묶음 납품 방식과 검수

50종 목록은 이미 준비됐다. 그림은 **1단계 9장 후보 → 2–3단계 → 4–7단계 → 8–10단계**로 나눈다. 각 묶음은 완성 수종만 포함한다. 작업 시간이 부족하면 복제 그림으로 숫자를 채우지 말고 완료·미완료를 정확히 분리한다. 외부 Chat을 이용했다면 완성 ZIP/PNG를 내려받아 위 `incoming/forestry-chat/`으로 복사한다.

납품물에는 다음을 포함한다.

1. 기존 `FORESTRY_TREE_CATALOG.md`의 어떤 ID를 완성했는지 적은 목록. 같은 50종 명단을 다시 만들 필요가 없다.
2. 완성된 종별 PNG 3장씩. 신규 ID의 파일명과 목록 ID는 정확히 일치시킨다.
3. `README.md` 또는 `manifest.json`: 실제 완료 종 수, 각 PNG 경로·크기, 기존 목재 아이콘의 교체 후보, 아직 만들지 않은 그림 목록.
4. 단계별 미리보기 모음 이미지: 선 나무·그루터기·목재 아이콘을 한 줄에 놓고 이름과 단계를 표기한다. 미리보기의 글씨는 원본 PNG에 넣지 않는다.
5. 도끼까지 제작했다면 별도 `axes` 묶음, 아이콘과 휴대 PNG, 각 PNG의 `grip`/`tip` 좌표 및 4방향/남녀 캐릭터 합성 미리보기.

납품 전에는 PNG의 실제 치수·알파 채널·잘림 여부, 기존 파일명과 중복 여부, 동일 단계 5종의 구별성, 나무와 그루터기/목재의 일치, 작은 모바일 화면 가독성을 확인한다. 완료 보고에는 **완료 수량과 남은 수량을 구체적으로** 쓴다.

## 이 작업 세션으로 돌아온 뒤 할 일 — 제작 세션의 범위 아님

납품물 검수 후 기존 ID/저장과 수종 대응을 확정하고, 이미지 등록·맵 배치·보상/상점/가방·단일 HTML 빌드에 연결한다. 벌목의 현재 절대 도끼 제한을 단계별 속도 차이로 바꾸고, 도끼 내구력·수리·0에서 빈손·고장음은 별도의 게임 로직 작업으로 구현한다. HP·도끼 피해·XP·가격을 실제 플레이 시간과 수익으로 조정하고, 기존 저장 및 Android에서 나무/장비/사운드 회귀 검사를 통과한 뒤 배포 여부를 결정한다. **이번 이미지 제작 납품이 이 구현과 QA를 대신하지 않는다.**
