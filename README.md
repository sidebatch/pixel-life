# Pixel Life

세로형 모바일 화면을 기준으로 제작 중인 탑다운 픽셀 생활 어드벤처입니다. 현재 빌드는 라일락 연못 마을의 이동, 충돌, 카메라, NPC 로밍, 대화와 월드 렌더링을 구현한 코어 프로토타입입니다.

- 공개 게임: https://sidebatch.github.io/pixel-life-web/
- 배포 방법: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## 실행

Node.js 20 이상에서 별도 패키지 설치 없이 실행할 수 있습니다.

```bash
node scripts/serve.mjs
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 검사와 빌드

```bash
node scripts/check.mjs
node scripts/build.mjs
```

검사가 통과하면 Android 다운로드 폴더에서도 직접 열 수 있는 독립 실행형 `dist/index.html`이 생성됩니다. 이 파일에는 스타일, 코드, 이미지가 모두 포함됩니다. npm이 설치된 환경에서는 같은 작업을 `npm test`로 실행할 수 있습니다.

## 조작

- 모바일: 왼쪽 조이스틱으로 이동, 오른쪽 손 버튼으로 상호작용
- 키보드: 방향키 또는 WASD로 이동
- Space 또는 Z: 상호작용
- X 또는 Escape: 대화·메뉴 닫기

## 프로젝트 구조

```text
assets/              원본 게임 이미지
  buildings/         건물
  npcs/              NPC 스프라이트 시트
  player/            플레이어 스프라이트
  world/             월드 오브젝트
src/
  assets.js          런타임 에셋 목록
  config.js          프로젝트 설정과 에셋 로더
  world.js           맵과 엔티티 데이터
  simulation.js      이동, 충돌, 카메라, NPC 업데이트
  rendering.js       지형과 월드 렌더링
  interactions.js    대화, 메뉴, 입력
  main.js            게임 루프
styles/game.css      세로형 HUD와 조작 UI
scripts/             검사, 개발 서버, 단일 HTML 빌드
docs/                설계 표준과 개발 문서
index.html           개발용 진입점
dist/index.html      생성되는 독립 실행형 배포 파일
```

세부 설계는 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)와 [`docs/02_WORLD_UI_AND_SYSTEM_STANDARD.md`](docs/02_WORLD_UI_AND_SYSTEM_STANDARD.md)를 참고합니다.

## 현재 범위

구현됨:

- 34×24 타일 월드와 카메라
- 플레이어 이동 및 충돌
- NPC 6명의 로밍과 대화
- 건물 2채와 문 상호작용
- 모바일·키보드 입력
- Y축 기반 가림과 식생 레이어

다음 기능:

- 낚시
- 인벤토리와 저장
- 채집, 요리, 제작
- 상점과 퀘스트
- 추가 지역

## 버전 관리

리팩터링 전 단일 HTML 프로토타입은 Git 태그 `prototype-v5`로 보존되어 있습니다.
