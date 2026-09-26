# Deployment

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스, 원본 에셋, 개발 기록과 생성된 독립 실행형 빌드는 하나의 공개 저장소에서 관리한다. GitHub Actions가 `dist/index.html`을 Pages artifact로 만들어 배포한다.

2026-09-26부터 긴 지역 배경음악만 스트리밍 파일로 분리한다. 배포물은 `dist/index.html`과 `dist/assets/audio/music/{meadow,woodland,lakeside}.mp3`다. 기존 이미지·코드·CSS·짧은 효과음 5개는 계속 HTML에 포함한다. Actions는 dist 전체를 업로드하므로 설정 변경은 필요 없지만, 수동 복사/오프라인 테스트에서는 HTML만 옮기지 말고 dist 폴더 전체를 보존해야 한다. 음악은 첫 터치/키 입력 후 재생되며 메뉴에서 음악 켜기/끄기를 선택할 수 있다.

## 배포 절차

1. 로컬에서 검사와 빌드를 실행한다.

   ```bash
   node scripts/check.mjs
   node scripts/build.mjs
   ```

2. 소스 변경을 `main`에 푸시한다.
3. GitHub Actions의 `Deploy GitHub Pages` 작업이 성공했는지 확인한다.
4. 공개 URL에서 최신 빌드가 표시되는지 확인한다.

GitHub Pages는 공개 소스 저장소의 `main` 브랜치가 변경될 때 자동으로 검사·빌드·배포된다.

모바일 브라우저가 이전 파일을 캐시하면 확인 URL 끝에 현재 커밋을 쿼리로 붙인다.

```text
https://sidebatch.github.io/pixel-life/?v=<commit>
```

다음 작업 세션은 `docs/HANDOFF.md`의 체크리스트와 현재 미완료 항목을 먼저 확인한다.
