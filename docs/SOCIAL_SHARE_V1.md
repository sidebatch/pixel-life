# 링크 공유 썸네일 v1

2026-10-23. 카카오톡 등에서 게임 주소를 공유할 때 사용할 표지와 정적 공유 정보를 추가했다. 공개 배포 검증은 아래 기준으로 진행한다.

## 그림과 문구

- 제목: **Pixel Life**
- 소개: 낚시와 농사, 숲과 던전 탐험을 즐기는 픽셀 생활 모험. Pixel Life에서 나만의 하루를 만들어 보세요.
- 표지: [1200×630 PNG](../assets/social/pixel-life-share-v1.png), 2,360,416 bytes. 남녀 모험가·연못 낚시·마을·텃밭·숲속 굴을 기존 게임 그림에 맞춰 제작했다. 제목과 주인공은 가운데에 두어 작은 카드와 중앙 정사각형 자르기에서도 보이도록 구성했다.
- 원본: [생성 PNG](../assets/social/source/share-v1.png). 내장 `image_gen`으로 생성하고 기존 PNG 도구로 크기만 정규화했다. [전체 프롬프트·참고 이미지·SHA-256](art/social-share-prompts-v1.json), 재현 `node scripts/pack-social-share.mjs`.
- 실제 게임 화면과 마을 건물, 남녀 캐릭터를 스타일 참고로 사용했다. 공유 표지는 게임 화면 캡처가 아닌 소개용 그림이다.

## 연결과 배포

`index.html`의 정적 head에 description·canonical·Open Graph·Twitter 큰 이미지 카드 정보를 넣었다. JavaScript를 실행하지 않는 수집기도 읽을 수 있고 이미지 주소는 절대 HTTPS 주소다. 게임 주소의 버전/출처 쿼리는 canonical에 넣지 않는다.

- 게임: https://sidebatch.github.io/pixel-life/
- 표지: https://sidebatch.github.io/pixel-life/assets/social/pixel-life-share-v1.png
- 이미지 MIME `image/png`, 실제 크기와 메타 크기 1200×630, 불투명 배경, 5MB 미만.
- `scripts/build.mjs`는 표지를 `dist/assets/social/`에 복사하고 빌드 식별값에도 반영한다. 게시물은 기존 8개에 표지를 더한 **9파일**이다. 생성 원본은 배포하지 않는다.
- 표지는 게임 진입에 사용하지 않으며 서비스 워커의 필수 앱 캐시는 기존 7파일이다.
- 배포 빌드가 메타 누락/중복·잘못된 공유 주소·이미지 누락·파일 형식/크기 불일치를 검사한다. 전용 검사는 `node scripts/qa-social-share.mjs` 또는 `node scripts/qa-social-share.mjs dist`.

## 검증과 운영

공개 검사는 `PIXEL_LIFE_SHARE_URL`을 공개 게임 주소로 지정하고 전용 검사를 실행한다. 봇 형식 요청의 원본 HTML, 이미지 HTTP 200/MIME, 실제 PNG 크기와 검토한 이미지의 SHA-256 일치를 검사한다. 이는 실제 카카오톡 앱에서 미리보기를 보았다는 의미는 아니다.

작은 가로 카드와 정사각형 중앙 자르기는 격리 브라우저에서 확인한다. 공개 배포 후 9파일/홈페이지 동일성과 게임 로딩·기존 PWA 오프라인 실행을 확인한다. 결과는 `output/deploy-social-share-v1/`에 기록한다. 별도 숲 배치 작업은 보존하고 이 배포에서 제외한다. 전체 소스 복사본은 만들지 않는다.

카카오톡에서 이전 미리보기가 남으면 새 공유 주소로 확인하거나 [카카오 OG 캐시 초기화 도구](https://developers.kakao.com/tool/debugger/sharing)를 사용한다. 실제 카카오톡 캐시 초기화/메시지 발송은 이번 작업에서 수행하지 않는다.

근거: [카카오 스크랩 메시지와 이미지 조건](https://developers.kakao.com/docs/ko/message-template/common#scrap-message), [미리보기 캐시 FAQ](https://developers.kakao.com/docs/ko/message-template/faq), [Open Graph 프로토콜](https://ogp.me/). 문서 확인일 2026-10-23.
