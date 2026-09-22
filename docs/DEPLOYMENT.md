# Deployment

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스, 원본 에셋, 개발 기록과 생성된 독립 실행형 빌드는 하나의 공개 저장소에서 관리한다. GitHub Actions가 `dist/index.html`을 Pages artifact로 만들어 배포한다.

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
