# Pixel Life

세로형 모바일 화면을 기준으로 제작 중인 탑다운 픽셀 생활 어드벤처입니다. 현재 빌드는 라일락 연못 마을의 이동·NPC·월드 렌더링 기반 위에 월드 시간, 비·폭풍 날씨, 물고기 20종과 도감·저장·누적 보상이 연결된 낚시 수직 슬라이스를 구현했습니다.

- 공개 게임: https://sidebatch.github.io/pixel-life/
- 다음 세션 인수인계: [`docs/HANDOFF.md`](docs/HANDOFF.md)
- 배포 방법: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- 최신 종합 QA: [`QA_REPORT.md`](QA_REPORT.md)

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
  data/world-map.js  맵 크기, 지형, 엔티티 배치 데이터
  data/fish-data.js  물고기 20종, 출현 조건, 보상 데이터
  world-time.js      월드 공용 시간과 시간대 판정
  weather.js         맑음·비·폭풍 상태와 자동 판정
  config.js          프로젝트 설정과 에셋 로더
  save.js            버전형 로컬 저장과 복원
  world.js           맵 데이터로 런타임 월드 구성
  world-validation.js 좌표·충돌·입구 자동 검사
  simulation.js      이동, 충돌, 카메라, NPC 업데이트
  debug.js           F3 월드 디버그 오버레이
  rendering.js       지형과 월드 렌더링
  interactions.js    대화, 메뉴, 입력
  fishing.js         낚시 상태, 추첨, XP, 발견, 보상 처리
  fish-dex.js        도감 필터, 통계, 힌트, 보상 진행도
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

- 64×48 타일 확장 월드와 카메라
- 플레이어 이동 및 충돌
- NPC 6명의 로밍과 대화
- 건물 2채와 문 상호작용
- 모바일·키보드 입력
- Y축 기반 가림과 식생 레이어
- 월드 배치 자동 검사와 F3 디버그 오버레이
- 현실 30분 기준 월드 시계와 시간대별 화면·조명
- 맑음·비·폭풍 자동 날씨와 화면 전체 강수 효과
- 물고기 20종 데이터와 지역·시간·날씨별 Fish Pool
- 상대 Weight 추첨과 같은 어종 3연속 보정
- 낚시 XP·레벨, 발견·크기 통계, 로컬 저장·복원
- 전체·연못·강·바다 필터가 있는 물고기 도감
- 물고기 20종 전용 96×96 픽셀 아트
- 5·10·15·19·20종 도감 누적 보상과 단계별 힌트
- 희귀·영웅·전설 결과 카드의 등급별 파티클·등장 애니메이션·합성 효과음
- 물가 낚시 루프, 찌·입질·결과 카드·모바일 취소

다음 기능:

- 낚싯대 장비 효과와 장비 선택 UI
- 인벤토리 실제 아이템 화면, 판매와 요리
- 강·바다 실제 지역과 낚시터
- 채집, 제작, 상점과 퀘스트

## 버전 관리

리팩터링 전 단일 HTML 프로토타입은 Git 태그 `prototype-v5`로 보존되어 있습니다. 현재 저장소 자체가 공개 소스 저장소이자 GitHub Pages 배포 소스입니다.
