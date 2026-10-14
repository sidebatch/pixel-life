# Deployment

현재 배포 계약 정리: 2026-10-14.

## 2026-10-14 농사 상점·판매 UI·도감 공개 배포 완료

- 게임 변경 커밋 [f16ebde](https://github.com/sidebatch/pixel-life/commit/f16ebdee291f6b5ffb0e5a4abf71e6fc44fed102), PWA `a5ea86ec2184`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38620542611).
- 전체 검사/빌드/Pages 성공: 51 scripts/141 UI IDs/452 assets/74 fish. HTML 20,476,579 bytes, 공개 8파일/37,943,741 bytes와 SHA-256 일치.
- 공개 393/320px 하루/NPC·농가 문/씨앗 14종·상점 분리/잘못된 상점 거래 거부·판매 전부/취소/부분 판매·가격/그림·큰 도감/미발견 보호·기존 저장/진행 주문 유지 통과.
- 공개 14종 실제 구매/심기/수확/판매·실패 복원, 주문 납품/보상/소품 8종 교환/설치/회수/재접속·통로/밭/출구·원격 꾸미기 이력 통과.
- 공개 PWA 설치 오류 없음·새 캐시/7항목·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 통과.
- 기준 [SHOP_DEX_POLISH_V1.md](SHOP_DEX_POLISH_V1.md), 결과 output/deploy-shop-dex-qa/. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-14 농장 소품 8종·상황별 장비 버튼 공개 배포 완료

사용자 ‘배포해주세요. 그리고 문서도 정리’ 요청으로 새 소품 5종과 최종 원형 조작부/실제 장비 그림을 함께 배포했다. 각진 나무 시안과 선으로 그린 낫/도끼/낚싯대·버튼 안 ‘행동’ 글자는 현행에 포함하지 않는다.

- 게임 변경 커밋 [2e3e911](https://github.com/sidebatch/pixel-life/commit/2e3e911be1e3b4e6a552fb5b35afe48430c2a1c6), PWA `8c63f7ac8b6f`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38522575702).
- Actions #38522575702 build/deploy success. 전체 검사 51 scripts/141 UI ids/450 assets/74 fish와 기존 캐릭터/검·낫/생활/저장 통과.
- HTML 20,385,982 bytes. 공개 8파일/37,853,144 bytes가 로컬과 SHA-256 일치한다.
- 공개 393/320px: 실제 납품→50장 이상 교환권→8종 교환/설치·전체 회수·재설치/재접속, 기존 저장·실패 복원, 모든 통로/밭·출구, 스크롤/이력 통과.
- 공개 393/320/430px: 기존 이동/정지·버튼 영역/원형/글자 없음·문맥 안내, 실제 수확/낚시 시작·입질·취소/대화·메뉴 터치와 낫/검·도끼/낚싯대 20종의 정확한 캐릭터 그림 일치 통과.
- 공개 PWA: 설치 조건 오류 없음·새 캐시 7항목, 오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.
- README/문서 안내/인수인계의 현재 상태·기준 링크를 정리했다. 누적된 이전 인수인계 앞부분은 HANDOFF_RELEASE_HISTORY_2026_10_14.md에 인용으로 보존한다. 소품 표는 현재 8종이다.

결과: output/deploy-controls-decorations-qa/{deployment.json,public-files.json,public-orders/report.json,public-controls/report.json,pwa-public.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-13 농장 주문·교환권·꾸미기 공개 배포 완료

사용자 ‘배포해주세요’ 요청으로 엘리 상점의 랜덤 주문 1개/재접속 유지·납품 후 다음 주문, 판매가보다 높은 코인/농장 교환권, 농사 레벨/보유 부지에 따른 1·2·3종 주문, 허수아비·표지판·꽃 울타리의 교환/지정 설치/회수·저장을 공개 배포했다.

- 게임 변경 커밋: [f1a37af](https://github.com/sidebatch/pixel-life/commit/f1a37aff4754cff12cf28b06785258efc3d658b8)
- 성공 배포: [Deploy GitHub Pages #38444649859](https://github.com/sidebatch/pixel-life/actions/runs/38444649859), build/deploy success.
- 빌드 HTML 20,290,574 bytes, 공개 전체 8파일/37,757,736 bytes 로컬·공개 SHA-256 일치, 캐시 pixel-life-61b8656eecda.
- 전체 검사 51 scripts/141 UI ids/445 assets/74 fish와 3,500개 주문 단계/경제/저장 사례·납품 20회·실패 복원 통과.
- 공개 393/320px 실제 단일 주문/납품·정확한 보상/단계 전환, 3종 교환·설치/회수/재설치, 모든 통로/밭 접근/출구, 기존 저장/재접속/뒤로가기·버튼 크기 검사 통과.
- 공개 농사 성장 회귀: 실제 수확 XP, Lv.2/6/100/숙련도·진행률, 구매/판매 무XP·기본 설명 제거/보상 설명 유지·실패 복원·저장 통과.
- 공개 PWA: 설치 조건 오류 없음·새 캐시·오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.

규칙은 [FARM_ORDERS_V1.md](FARM_ORDERS_V1.md), 결과는 output/deploy-farm-orders-v1-qa/{deployment.json,public-files.json,public-orders/report.json,public-growth/report.json,pwa-public.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-13 작물 확장·농사 레벨 공개 배포 완료

사용자 요청으로 비트 이름(기존 turnip ID/저장 유지), 상추·오이·가지·고추를 더한 작물 14종, 씨앗값/판매가 균형, 독립 농사 Lv.1–100/숙련도·수확 XP/진행률과 레벨업 기본 ‘실력이 늘었어요!’ 문구 제거를 공개 배포 완료했다. 성장 안내의 ‘게임을 꺼도 자라요’ 문구도 제거했다.

- 게임 변경 커밋: [1c01b22](https://github.com/sidebatch/pixel-life/commit/1c01b22a60a9a652d00c27df3834eb6bd50f2c51)
- 성공 배포: [Deploy GitHub Pages #38358916193](https://github.com/sidebatch/pixel-life/actions/runs/38358916193), build/deploy success.
- 빌드 HTML: 20,235,673 bytes. 공개 전체 8파일/37,702,835 bytes가 로컬과 SHA-256 일치, 캐시 pixel-life-0ffa41864680.
- 전체 검사: 49 scripts/140 UI ids/442 assets/74 fish, 고정 캐릭터·검/도구 계약·기존 낚시/벌목/저장 통과.
- 경제 280,000회/성장 112가지 시뮬레이션과 로컬 393/320px 실제 재배/거래/진행 검사 통과.
- 공개 393/320px: 이전 저장의 농사 Lv.1/0 XP·비트 이름/수량/심은 시간 보존, 실제 수확 +XP, Lv.2/6/100/숙련도 1, 밭/상점 카드, 심기/구매/판매 무XP, 실패 복원/저장/재접속을 확인했다.
- 공통 농사/낚시/벌목 기본 레벨업 설명 문단이 없으며 실제 보상 문구가 있을 때는 유지한다. 자동으로 닫히는 5초 알림도 유지했다. 브라우저 QA는 느린 캡처 중 자동으로 닫힌 알림을 다시 클릭하지 않도록 보완했다.
- 공개 14종 실제 씨앗 구매→심기→낫 수확→판매 28회로 최소/최대 수확 지출/판매액·순이익을 검증했다. 구매/판매 저장 실패와 새 작물 저장 재접속도 통과했다.
- 공개 밭 상시 충돌/통로/부지 구매/낫/이전 위치 복원과 화면별 기존 외형/동작 720조합 통과.
- 공개 PWA: 설치 조건 오류 없음, 새 캐시/7항목, 오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.

기준은 [FARMING_CROPS_BALANCE_V1.md](FARMING_CROPS_BALANCE_V1.md)와 [FARMING_PROGRESSION_V1.md](FARMING_PROGRESSION_V1.md)다. 결과는 output/deploy-farming-v1-qa/{deployment.json,public-files.json,pwa-public.json,public-progression/report.json,public-economy/report.json,public-layout/report.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스·원본 에셋·개발 문서는 하나의 공개 저장소에서 관리하고, 빌드한 `dist/`는 Git에 커밋하지 않는다. GitHub Actions가 dist 전체를 Pages artifact로 만들어 배포한다. 로컬 QA `output/`도 전체 Git 제외이며 보존/정리는 `QA_RETENTION.md`를 따른다.

2026-09-26부터 긴 지역 배경음악만 스트리밍 파일로 분리한다. 2026-09-30부터 배포물은 설치형 PWA이며 `dist/index.html`, `dist/manifest.webmanifest`, `dist/service-worker.js`, `dist/assets/pwa/`와 `dist/assets/audio/music/{meadow,woodland,lakeside}.mp3`를 포함한다. 기존 이미지·코드·CSS·짧은 효과음 8개는 계속 HTML에 포함한다. Actions는 dist 전체를 업로드하므로 설정 변경은 필요 없지만, 수동 복사/오프라인 테스트에서는 HTML만 옮기지 말고 dist 폴더 전체를 보존해야 한다. 음악은 첫 터치/키 입력 후 재생되며 메뉴에서 음악 켜기/끄기를 선택할 수 있다.

빌드는 HTML·매니페스트·아이콘·음악 내용에서 캐시 버전을 자동 생성해 서비스 워커에 넣는다. 새 배포를 받은 서비스 워커는 이전 `pixel-life-*` 캐시를 뒤에서 교체하지만 실행 중인 게임을 강제로 새로고침하지 않는다. 따라서 시작 로딩 화면은 한 번만 표시되고, 새 오프라인 캐시는 다음 실행에도 유지된다. 전체 음악을 최초 설치 캐시에 포함하므로 첫 접속에는 네트워크 사용량이 늘지만, 완료 후에는 오프라인에서도 세 지역 음악과 게임을 실행할 수 있다. 앱 아이콘을 다시 만들 때는 `npm run icons:pwa`를 사용한다.

## 2026-10-13 농사 안내 문구·심기 창 공개 배포 완료

사용자 요청으로 밭 번호 숨김·작물의 한국어 조사 수정·심기 성공 후 창 닫기를 공개 배포 완료했다. 393/320px 실제 버튼/뒤로가기 이력/성장·수확 문구/실패 복원 검사와 빌드를 통과했다. 빌드는 20,006,295 bytes/PWA `30d79ba57428`다. Actions build/deploy와 공개 검증 모두 통과했다.

- 게임 변경 커밋: [`c3d333a`](https://github.com/sidebatch/pixel-life/commit/c3d333aad945c52e62f647dbcc12c7502e8ecb76)
- 성공한 배포: [Deploy GitHub Pages](https://github.com/sidebatch/pixel-life/actions/runs/38353183885)
- 공개 8파일/37,473,457 bytes가 로컬과 SHA-256까지 일치, 캐시 `pixel-life-30d79ba57428`.
- 공개 393/320px: 실제 씨앗 버튼/성공 후 창 닫기·이동 잠금 해제/뒤로가기 이력 복귀, 숫자 없는 제목, 작물 10종의 성장·수확 20개 문구, 저장 실패 시 선택창/씨앗/밭 보존을 확인했다.
- 기존 수확/낫/밭 상시 충돌/부지·작물·성장시간·재접속/720 외형 조합과 PWA 설치 조건·새 캐시·오프라인 재실행/음악 Range·강제 재로딩 없음 검사도 통과했다.

결과: `output/deploy-farm-ui-qa/{deployment.json,public-files.json,farming-browser/report.json,pwa-public.json}`. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다. 규칙은 [FARM_UI_POLISH_V1.md](FARM_UI_POLISH_V1.md)를 따른다.

## 2026-10-13 기본 낫 그림 v2 공개 배포 완료

사용자 요청으로 짧은 나무손잡이/길고 뾰족하게 휘어진 날의 새 기본 낫을 공개 배포 완료했다. 남녀 캐릭터의 공통 오른손·몸·모션과 장착 키/저장 ID는 유지하며 새 그림의 손잡이 축/표시 크기만 맞췄다. 상세는 [SICKLE_ART_V2.md](SICKLE_ART_V2.md)를 따른다.

로컬 실제 PNG/캐릭터·검 보호/393·320px 장착·수확·저장 검사와 남녀·4방향 24프레임 비교를 통과했다. 빌드는 20,006,014 bytes/PWA `0062d37f3da2`다. Actions build/deploy와 공개 검증 모두 통과했다.

- 게임 변경 커밋: [`6d15ab0`](https://github.com/sidebatch/pixel-life/commit/6d15ab0822dea2bb8b3e95960694c775251c0d48)
- 성공한 배포: [Deploy GitHub Pages](https://github.com/sidebatch/pixel-life/actions/runs/38350941915)
- 공개 전체 8파일/37,473,176 bytes가 로컬과 SHA-256 일치, 캐시 `pixel-life-0062d37f3da2`.
- 공개의 실제 낫 PNG가 승인된 v2 그림과 byte 단위로 일치하며, 남녀·4방향·휴대/준비/수확 24프레임 렌더링을 확인했다.
- 공개 393/320px 농장의 장착/타격 시 수확/밭 상시 충돌/부지 구매/씨앗 소비/기존 소유·작물·시간/재접속 보존 검사와 외형·동작 720조합 검사 통과.
- 공개 PWA: 설치 조건 오류 없음, 새 캐시/강제 재로딩 없음, 오프라인 재실행/음악 Range 206·100 bytes 통과.

결과: `output/deploy-sickle-v2-qa/{deployment.json,public-files.json,art/report.json,farming-browser/report.json,pwa-public.json}`. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다.

## 2026-10-13 농장 정비 v1 공개 배포 완료

사용자 요청으로 지정 부지/통로/픽셀 흙 그림/기본 낫 수확/씨앗 설명 정비를 공개 배포 완료했다. 밭은 구매 전·빈 밭·성장 중·성숙·수확 후 모두 이동을 막는다. 통로에서만 심고 수확하며 기존 소유·작물·성장시간은 보존한다. 상세는 [FARMING_LAYOUT_V1.md](FARMING_LAYOUT_V1.md)를 따른다.

로컬 전체 검사(49 scripts/139 UI ids/426 assets/74 fish), 393/320px 실제 농장 동작·저장 검사와 배포용 빌드 검사는 통과했다. 빌드는 20,001,257 bytes/PWA `568667fe105c`다. Actions build/deploy 모두 성공했고 다음 공개 검증도 통과했다.

- 게임 변경 커밋: [`12e5a7d`](https://github.com/sidebatch/pixel-life/commit/12e5a7d7af8b0dd30b2bad63477f3d87edcd7036)
- 성공한 배포: [Deploy GitHub Pages #38346705185](https://github.com/sidebatch/pixel-life/actions/runs/38346705185)
- 공개 dist 전체 8파일/37,468,419 bytes가 로컬과 SHA-256까지 일치, 캐시 `pixel-life-568667fe105c`.
- 공개 393/320px: 구매 전/빈 밭/성장 중/수확 후에도 이동 차단, 열린 통로/낫 장착·실제 수확, 부지 구매/씨앗 소비, 저장 실패 복원, 이전 밭 위 저장 위치의 안전 복구, 소유/작물/성장시간 보존과 재접속.
- 공개 PWA: 서비스 워커 제어/새 캐시/설치 조건·실행 중 강제 재로딩 없음·오프라인 재실행·음악 Range(206/100 bytes).

결과는 `output/deploy-farm-qa/{deployment.json,public-files.json,pwa-public.json,farming-browser/report.json}`에 보존한다. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다.

## 2026-10-12 성장 균형 v2 배포

사용자 요청으로 성장 균형 v2를 **공개 배포 완료**했다. 벌목 XP 7/8/9/10/11/12/15/16/17/18, 공통 Lv.80 이후 요구량/187,230 XP, 기존 레벨·바·숙련도 보존 이행이 적용됐다.

- 공개 게임: [https://sidebatch.github.io/pixel-life/](https://sidebatch.github.io/pixel-life/)
- 게임 변경 커밋: [`0891f6a`](https://github.com/sidebatch/pixel-life/commit/0891f6ae328e14746fc6bbe6339ca819ab9d46ae)
- 성공한 배포: [Deploy GitHub Pages #38293464202](https://github.com/sidebatch/pixel-life/actions/runs/38293464202) — build/deploy 모두 success
- 확인한 PWA 캐시: `pixel-life-6f6f3804bca1`
- 공개 dist 전체 8파일/37,462,525 bytes가 로컬과 SHA-256까지 일치한다.
- 공개 393/320px 브라우저에서 실제 +7/+18 XP, Lv.85/99 바와 Lv.100 숙련도 보존, 도구/아이템/코인 보존, 재접속 후 중복 이행 없음을 확인했다.
- 공개 PWA의 설치 조건·캐시·오프라인 실행·음악 Range(206/100 bytes)·업데이트 시 강제 재로딩 없음 검사를 통과했다.

세부 검증은 `output/deploy-growth-qa/{public-files.json,pwa-public.json,growth-browser/report.json}`과 `QA_REPORT.md`에 기록했다. 실제 Android 손 조작·설치 앱 업데이트 체감은 별도 수동 항목이다.

설치 앱은 완전히 종료 후 다시 열어 새 캐시를 사용한다. 성장 이행 때문에 저장을 삭제하거나 앱을 재설치할 필요는 없다.

## 배포 절차

1. 로컬에서 검사와 빌드를 실행한다.

   ```bash
   node scripts/check.mjs
   node scripts/build.mjs
   ```

2. 소스 변경을 `main`에 푸시한다.
3. GitHub Actions의 `Deploy GitHub Pages` 작업이 성공했는지 확인한다.
4. 공개 URL에서 최신 빌드가 표시되는지 확인한다.
5. 실제 Android 확인은 별도 수동 항목으로 기록한다. 게임 메뉴의 `홈 화면에 설치`와 설치 아이콘/비행기 모드 재실행을 확인할 수 있지만 사용자가 체감 확인은 나중에 하기로 했으므로 자동 검사 결과로 실측을 대체하지 않는다.

GitHub Pages는 공개 소스 저장소의 `main` 브랜치가 변경될 때 자동으로 검사·빌드·배포된다.

모바일 브라우저가 이전 파일을 캐시하면 확인 URL 끝에 현재 커밋을 쿼리로 붙인다.

```text
https://sidebatch.github.io/pixel-life/?v=<commit>
```

PWA 서비스 워커는 HTTPS 또는 `localhost`에서만 동작한다. 같은 Wi-Fi의 PC 주소를 `http://<PC-IP>`로 여는 개발 방식은 게임 확인에는 쓸 수 있지만 설치·오프라인 검증에는 사용할 수 없다.

빌드한 `dist`를 로컬 서버로 연 상태에서는 `node scripts/qa-pwa.mjs`로 Chrome/Edge 서비스 워커 등록, 매니페스트, 사전 캐시, 오프라인 새로고침과 음악 Range 응답을 검사할 수 있다.

다음 작업 세션은 `docs/HANDOFF.md`의 체크리스트와 현재 미완료 항목을 먼저 확인한다.

## 로컬 PWA 검사와 크기

일반 소스 서버의 `/dist/index.html`을 여는 것과 dist 루트를 서버로 여는 것은 경로/서비스 워커 범위가 다르다. PWA 검사는 다른 작업의 서버를 끄지 말고 사용 가능한 별도 포트에서 dist 전체를 루트로 제공한다. PowerShell 예시:

```powershell
# 저장소 루트에서; 포트가 사용 중이면 다른 포트를 선택
Set-Location dist
$env:PORT='4174'
node ../scripts/serve.mjs
```

별도 터미널의 저장소 루트에서 `$env:PIXEL_LIFE_QA_URL='http://127.0.0.1:4174/'`를 설정한 뒤 `node scripts/qa-pwa.mjs`를 실행한다. 검사 전용 브라우저를 사용하며 실제 사용자 게임 저장을 초기화하지 않는다. 임시 서버는 검사가 끝나면 해당 서버만 종료한다.

2026-10-12 측정 배포 크기는 약 35.73MiB(압축 전 파일 합계), HTML 약 19.07MiB다. 원화 source/QA/로컬 Git 기록/원본 WAV 전체가 사용자에게 전달되는 것은 아니다. 수치와 측정 범위는 [PROJECT_STORAGE.md](PROJECT_STORAGE.md)를 따른다.
