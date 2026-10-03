# Deployment

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스, 원본 에셋, 개발 기록과 생성된 독립 실행형 빌드는 하나의 공개 저장소에서 관리한다. GitHub Actions가 `dist/index.html`을 Pages artifact로 만들어 배포한다.

2026-09-26부터 긴 지역 배경음악만 스트리밍 파일로 분리한다. 2026-09-30부터 배포물은 설치형 PWA이며 `dist/index.html`, `dist/manifest.webmanifest`, `dist/service-worker.js`, `dist/assets/pwa/`와 `dist/assets/audio/music/{meadow,woodland,lakeside}.mp3`를 포함한다. 기존 이미지·코드·CSS·짧은 효과음 5개는 계속 HTML에 포함한다. Actions는 dist 전체를 업로드하므로 설정 변경은 필요 없지만, 수동 복사/오프라인 테스트에서는 HTML만 옮기지 말고 dist 폴더 전체를 보존해야 한다. 음악은 첫 터치/키 입력 후 재생되며 메뉴에서 음악 켜기/끄기를 선택할 수 있다.

빌드는 HTML·매니페스트·아이콘·음악 내용에서 캐시 버전을 자동 생성해 서비스 워커에 넣는다. 새 배포를 받은 서비스 워커는 이전 `pixel-life-*` 캐시를 제거하고 열린 구버전 화면을 한 번 새로고침한다. 전체 음악을 최초 설치 캐시에 포함하므로 첫 접속에는 네트워크 사용량이 늘지만, 완료 후에는 오프라인에서도 세 지역 음악과 게임을 실행할 수 있다. 앱 아이콘을 다시 만들 때는 `npm run icons:pwa`를 사용한다.

## 배포 절차

1. 로컬에서 검사와 빌드를 실행한다.

   ```bash
   node scripts/check.mjs
   node scripts/build.mjs
   ```

2. 소스 변경을 `main`에 푸시한다.
3. GitHub Actions의 `Deploy GitHub Pages` 작업이 성공했는지 확인한다.
4. 공개 URL에서 최신 빌드가 표시되는지 확인한다.
5. Android Chrome에서 게임 메뉴의 `홈 화면에 설치`를 누르고, 설치된 아이콘으로 독립 창 실행과 비행기 모드 재실행을 확인한다.

GitHub Pages는 공개 소스 저장소의 `main` 브랜치가 변경될 때 자동으로 검사·빌드·배포된다.

모바일 브라우저가 이전 파일을 캐시하면 확인 URL 끝에 현재 커밋을 쿼리로 붙인다.

```text
https://sidebatch.github.io/pixel-life/?v=<commit>
```

PWA 서비스 워커는 HTTPS 또는 `localhost`에서만 동작한다. 같은 Wi-Fi의 PC 주소를 `http://<PC-IP>`로 여는 개발 방식은 게임 확인에는 쓸 수 있지만 설치·오프라인 검증에는 사용할 수 없다.

빌드한 `dist`를 로컬 서버로 연 상태에서는 `node scripts/qa-pwa.mjs`로 Chrome/Edge 서비스 워커 등록, 매니페스트, 사전 캐시, 오프라인 새로고침과 음악 Range 응답을 검사할 수 있다.

다음 작업 세션은 `docs/HANDOFF.md`의 체크리스트와 현재 미완료 항목을 먼저 확인한다.
