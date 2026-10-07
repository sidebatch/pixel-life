# Pixel Life 문서 안내

새 개발 세션에서는 먼저 [`HANDOFF.md`](HANDOFF.md)를 읽는다. 이 문서는 현재 구현 범위, 최근 검증, 남은 작업, 변경하지 말아야 할 결정을 한곳에 정리한 단일 인수인계 기준이다. 날짜가 오래된 QA·설계 기록과 내용이 다르면 `HANDOFF.md`, 실제 데이터 파일, 최신 자동 검사를 우선한다.

## 새 세션 읽는 순서

1. [`HANDOFF.md`](HANDOFF.md) — 현재 상태와 바로 다음 작업
2. [`../README.md`](../README.md) — 실행 방법과 전체 기능 범위
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) — 코드 구조와 모듈 책임
4. 작업 분야의 기준 문서 — 아래 표에서 선택
5. [`DEPLOYMENT.md`](DEPLOYMENT.md) — 검사·GitHub Pages·PWA 배포

## 분야별 기준 문서

| 분야 | 문서 | 용도 |
| --- | --- | --- |
| 벌목 현재 수치 | [`FORESTRY_BALANCE.md`](FORESTRY_BALANCE.md) | 나무 HP·XP·가격·도끼 피해의 현재 임시값과 이력 |
| 벌목 10단계 | [`FORESTRY_10_STAGE_DESIGN.md`](FORESTRY_10_STAGE_DESIGN.md) | 도끼 10종, 숲 확장, 향후 내구력·수리·소프트 난이도 |
| 나무 50종 | [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md) | 수종 ID·이름·구간·이미지 계약·적용 상태 |
| 밸런스 계산 | [`FORESTRY_10_STAGE_BALANCE_SIMULATION.md`](FORESTRY_10_STAGE_BALANCE_SIMULATION.md) | 타수·수익·수리 후보값과 자동 시뮬레이션 기준 |
| 낚시 현재 구현 | [`FISHING_PLAN.md`](FISHING_PLAN.md) | 현재 20종·6개 낚싯대·도감·보상·상점 |
| 낚시 호환 기준선 | [`FISHING_BASELINE_V1.json`](FISHING_BASELINE_V1.json) | 확장 중 보존할 기존 20종·6개 낚싯대·보상·저장·획득 계약 |
| 낚시 74종 확장 | [`FISHING_74_EXPANSION_DESIGN.md`](FISHING_74_EXPANSION_DESIGN.md) | 코드 데이터와 자동 검증으로 연결된 10개 서식지·정정 로스터, 배·저장·단계별 구현 |
| 생활 성장 | [`LIFE_SKILL_PROGRESSION.md`](LIFE_SKILL_PROGRESSION.md) | Lv.1–100과 숙련도의 공통 원칙 |
| 장기 콘텐츠 | [`LONG_TERM_CONTENT_DESIGN.md`](LONG_TERM_CONTENT_DESIGN.md) | 아직 구현하지 않은 장기 방향과 현재 구현의 경계 |
| 월드·UI | [`02_WORLD_UI_AND_SYSTEM_STANDARD.md`](02_WORLD_UI_AND_SYSTEM_STANDARD.md) | 모바일 화면, 이동, 상호작용, UI 기준 |
| 맵 | [`MAP_FOUNDATION.md`](MAP_FOUNDATION.md) | 지역·타일·충돌·출입구 기준 |
| 생활 에셋 | [`LIFE_ASSET_STANDARD.md`](LIFE_ASSET_STANDARD.md) | 나무·작물 등 픽셀 에셋 규격 |
| 캐릭터 에셋 | [`CHARACTER_ASSET_STANDARD.md`](CHARACTER_ASSET_STANDARD.md) | 캐릭터 셀·발 기준·레이어·도구 규격 |
| 검 동작 | [`SWORD_ACTION_STANDARD.md`](SWORD_ACTION_STANDARD.md) | 검 손 위치와 동작 보호 규칙 |
| 음향 자산 | [`AUDIO_ASSETS.md`](AUDIO_ASSETS.md) | 효과음 경로·용도·출처와 합성음 구분 |

## 현재 벌목 기준 한눈에 보기

- 게임 연결 완료: 도끼 10종, 나무·그루터기·목재 50종, 서로 다른 숲 12개, 도끼 레시피, 상점·가방·저장, 나무 도감, 도끼 내구력·파손·빈손·준의 수리
- 도감 화면: `전체`와 다섯 숲을 3열×2줄로 표시, 최초 발견 카드, 다음 숲 실루엣 티저, 11/20/30/40/50종 영구 칭호·테두리·빛 효과
- 숨기는 정보: 도끼 피해량, 단계 번호, 나무 HP, 출현 지역, 필요 도끼, 발견 힌트
- 임시 밸런스: 나무 HP·XP·판매가, 도끼 피해·코인·목재 수량
- 보류: 낮은 도끼의 상위 나무 도전은 넣지 않고 현행 최소 도끼 제한 유지
- 다음 작업: Android 대표 구간에서 실제 이동·선택과 마을 수리 왕복 시간을 재고 최대 내구도 주기를 조정

## 새 세션 시작 명령

```bash
git status --short
git pull --ff-only origin main
node scripts/check.mjs
node scripts/build.mjs
```

벌목 전체를 이어서 작업할 때는 `HANDOFF.md`의 추가 QA 명령을 실행한다. `dist/`는 빌드 결과이므로 직접 편집하거나 커밋하지 않고, `output/`은 로컬 QA 결과 폴더이므로 문서나 소스 커밋에 섞지 않는다.
