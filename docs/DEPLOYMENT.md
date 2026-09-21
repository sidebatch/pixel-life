# Deployment

## 저장소

- 비공개 소스: https://github.com/sidebatch/pixel-life
- 공개 배포: https://github.com/sidebatch/pixel-life-web
- 서비스 URL: https://sidebatch.github.io/pixel-life-web/

소스와 개발 기록은 비공개 저장소에 유지한다. 공개 저장소에는 생성된 독립 실행형 `index.html`만 배포한다.

## 배포 절차

1. 소스 저장소에서 검사와 빌드를 실행한다.

   ```bash
   node scripts/check.mjs
   node scripts/build.mjs
   ```

2. 생성된 `dist/index.html`을 로컬 `pixel-life-web/index.html`로 복사한다.
3. 공개 배포 저장소에서 변경을 커밋하고 `main`에 푸시한다.
4. GitHub Actions의 `Deploy GitHub Pages` 작업이 성공했는지 확인한다.
5. 공개 URL에서 최신 빌드가 표시되는지 확인한다.

GitHub Pages는 공개 배포 저장소의 `main` 브랜치가 변경될 때 자동으로 실행된다.
