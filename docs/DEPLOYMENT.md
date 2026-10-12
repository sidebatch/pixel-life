# Deployment

현재 배포 계약 정리: 2026-10-12.

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스·원본 에셋·개발 문서는 하나의 공개 저장소에서 관리하고, 빌드한 `dist/`는 Git에 커밋하지 않는다. GitHub Actions가 dist 전체를 Pages artifact로 만들어 배포한다. 로컬 QA `output/`도 전체 Git 제외이며 보존/정리는 `QA_RETENTION.md`를 따른다.

2026-09-26부터 긴 지역 배경음악만 스트리밍 파일로 분리한다. 2026-09-30부터 배포물은 설치형 PWA이며 `dist/index.html`, `dist/manifest.webmanifest`, `dist/service-worker.js`, `dist/assets/pwa/`와 `dist/assets/audio/music/{meadow,woodland,lakeside}.mp3`를 포함한다. 기존 이미지·코드·CSS·짧은 효과음 8개는 계속 HTML에 포함한다. Actions는 dist 전체를 업로드하므로 설정 변경은 필요 없지만, 수동 복사/오프라인 테스트에서는 HTML만 옮기지 말고 dist 폴더 전체를 보존해야 한다. 음악은 첫 터치/키 입력 후 재생되며 메뉴에서 음악 켜기/끄기를 선택할 수 있다.

빌드는 HTML·매니페스트·아이콘·음악 내용에서 캐시 버전을 자동 생성해 서비스 워커에 넣는다. 새 배포를 받은 서비스 워커는 이전 `pixel-life-*` 캐시를 뒤에서 교체하지만 실행 중인 게임을 강제로 새로고침하지 않는다. 따라서 시작 로딩 화면은 한 번만 표시되고, 새 오프라인 캐시는 다음 실행에도 유지된다. 전체 음악을 최초 설치 캐시에 포함하므로 첫 접속에는 네트워크 사용량이 늘지만, 완료 후에는 오프라인에서도 세 지역 음악과 게임을 실행할 수 있다. 앱 아이콘을 다시 만들 때는 `npm run icons:pwa`를 사용한다.

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
