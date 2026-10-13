# 기본 낫 그림 v2

2026-10-13 사용자 피드백: 공개 게임의 기본 낫 모양이 어색함. v1의 긴 손잡이/작은 둥근 날을 짧은 나무손잡이와 길고 뾰족하게 휘어진 철제 날로 교체했다. 사용자 요청으로 공개 배포·검증을 진행 중이다.

## 제작·등록

- 생성 방식: built-in `image_gen`, precise-object-edit, 투명 배경. 첫 입력은 교체할 v1 낫, 두 번째는 농장 화면의 스타일 참고다. 최종 프롬프트는 `assets/player/sickle-v2/prompt.txt`에 보존한다.
- 생성 원본: `assets/player/sickle-v2/source.png`, 1254×1254 RGBA. 생성 도구의 원본은 `.codex/generated_images`에도 보존했다.
- 실제 장착/가방 그림: `assets/player/sickle-v2/basic.png`, 96×96 투명 PNG. `scripts/pack-sickle-v2.mjs`로 실제 alpha bounds를 일정 비율로 잘라 nearest 방식으로 패킹한다. 기존 v1 원화와 재현 스크립트는 유지한다.
- 장착 키/소유/저장 ID는 `sickle.basic` 그대로다. 캐릭터 공통 손·몸·모션과 도끼/낚싯대/검은 변경하지 않는다.
- 새 그림의 실제 grip=(19,62), 손잡이 축을 따른 날의 기준 끝점 tip=(43,21), 뾰족한 날 끝 bladeTip=(86,55). 오른손 연결을 유지하고 nativeAngle/Length를 새 그림에서 계산한다. 표시 길이는 휴대22/수확30이다.
- 날 끝을 손잡이 축으로 오인하면 옆모습에서 칼날이 얼굴 쪽으로 돌아간다. 최종 등록은 손잡이 방향의 기준점과 실제 날 끝을 분리한다.

## 검증·미리보기

- `node scripts/qa-farming-layout.mjs`: 현재 등록된 실제 PNG/손잡이/기준 끝점과 농장·수확 검사 통과. v1 파일 고정 경로 대신 등록된 그림을 검사하도록 수정했다.
- `node scripts/check-character-standard.mjs`, `node scripts/check-sword-standard.mjs`: 고정 공통 규격/기존 그림·도구/검 보호 통과.
- `scripts/qa-sickle-art-browser.mjs`: 격리된 저장에서 실제 그림을 합성해 남녀·4방향·휴대/준비/수확 24프레임을 렌더링했다. `output/sickle-art-qa/{before,after}/contact-sheet.png`와 report.json을 확인한다.
- `scripts/qa-farming-layout-browser.mjs`: 393/320px에서 장착/수확/저장/충돌·720 외형/동작 조합을 검사한다. 결과는 `output/sickle-art-qa/gameplay/`다.
- 최종 빌드: 20,006,014 bytes, PWA `0062d37f3da2`. 공개 배포는 농장 v1 `568667fe105c`까지이며 본 낫 교체는 사용자 요청으로 공개 배포·검증 중이다.
