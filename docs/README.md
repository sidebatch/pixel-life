# Pixel Life 문서 안내

2026-10-14 현재 기준: 교환권 농장 소품 총 8종과 작고 반투명한 원형 조작부/상황별 실제 장비 그림이다. 사용자 요청으로 공개 배포를 진행 중이며 완료 기록은 [DEPLOYMENT.md](DEPLOYMENT.md)에 갱신한다. 기존 저장과 진행은 유지한다.

새 세션은 [HANDOFF.md](HANDOFF.md)부터 읽는다. 현행 상태·사용자 결정·검증을 먼저 확인하고, 이전 배포/시안은 [별도 이력](HANDOFF_RELEASE_HISTORY_2026_10_14.md)과 DEPLOYMENT.md에서 참고한다.

## 새 세션 읽는 순서

1. [`HANDOFF.md`](HANDOFF.md) — 현재 상태와 바로 다음 작업
2. [`../README.md`](../README.md) — 실행 방법과 전체 기능 범위
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) — 코드 구조와 모듈 책임
4. 작업 분야의 기준 문서 — 아래 표에서 선택
5. [`DEPLOYMENT.md`](DEPLOYMENT.md) — 검사·GitHub Pages·PWA 배포

## 분야별 기준 문서

| 분야 | 문서 | 용도 |
| --- | --- | --- |
| 농장 주문·교환권 | [FARM_ORDERS_V1.md](FARM_ORDERS_V1.md) | 랜덤 1개/납품·보상/주문 단계/저장 |
| 농장 소품 8종 | [FARM_DECORATIONS_EXPANSION_V1.md](FARM_DECORATIONS_EXPANSION_V1.md) | 가격·고정 좌표/충돌/원본·프롬프트/검증 |
| 현재 조작부 | [TOUCH_CONTROLS_V1.md](TOUCH_CONTROLS_V1.md) | 원형/반투명·상황별 실제 장비 그림·터치 검증 |
| 벌목 현재 수치 | [`FORESTRY_BALANCE.md`](FORESTRY_BALANCE.md) | 나무 HP·XP·가격·도끼 피해의 현재 임시값과 이력 |
| 벌목 10단계 | [`FORESTRY_10_STAGE_DESIGN.md`](FORESTRY_10_STAGE_DESIGN.md) | 도끼 10종·숲·내구력·수리, 도끼 제한 유지 결정과 과거 설계 구분 |
| 나무 50종 | [`FORESTRY_TREE_CATALOG.md`](FORESTRY_TREE_CATALOG.md) | 수종 ID·이름·구간·이미지 계약·적용 상태 |
| 밸런스 계산 | [`FORESTRY_10_STAGE_BALANCE_SIMULATION.md`](FORESTRY_10_STAGE_BALANCE_SIMULATION.md) | 타수·수익·수리 후보값과 자동 시뮬레이션 기준 |
| 낚시 기본 계약 | [`FISHING_PLAN.md`](FISHING_PLAN.md) | 현재 74종·10낚싯대·내구도·도감/저장 계약과 v0.1 역사 기준 |
| 낚시 호환 기준선 | [`FISHING_BASELINE_V1.json`](FISHING_BASELINE_V1.json) | 확장 중 보존할 기존 20종·6개 낚싯대·보상·저장·획득 계약 |
| 낚시 74종 확장 | [`FISHING_74_EXPANSION_DESIGN.md`](FISHING_74_EXPANSION_DESIGN.md) | 코드 데이터와 자동 검증으로 연결된 10개 서식지·정정 로스터, 배·저장·단계별 구현 |
| 낚시 경제·수리 | [`FISHING_BALANCE_SIMULATION.md`](FISHING_BALANCE_SIMULATION.md) | 수리 빈도 보정·실제 로직 표본·성장과 항로 수익·측정 전제 |
| 현재 성장 균형/저장 이행 | [`LIFE_SKILL_GROWTH_BALANCE.md`](LIFE_SKILL_GROWTH_BALANCE.md) | 승인된 벌목 XP/공통 후반 요구량/기존 진행 보존 |
| 생활 성장 | [`LIFE_SKILL_PROGRESSION.md`](LIFE_SKILL_PROGRESSION.md) | Lv.1–100과 숙련도의 공통 원칙 |
| 장기 콘텐츠 | [`LONG_TERM_CONTENT_DESIGN.md`](LONG_TERM_CONTENT_DESIGN.md) | 아직 구현하지 않은 장기 방향과 현재 구현의 경계 |
| 월드·UI | [`02_WORLD_UI_AND_SYSTEM_STANDARD.md`](02_WORLD_UI_AND_SYSTEM_STANDARD.md) | 모바일 화면, 이동, 상호작용, UI 기준 |
| 숲 현재 연결 | [`FOREST_ROUTES_V2.md`](FOREST_ROUTES_V2.md) | 남쪽 1-1~1-5/거목·일반 상위 분기·북쪽 판타지·팻말 |
| 마을 그림/배치 | [`VILLAGE_POLISH_V1.md`](VILLAGE_POLISH_V1.md) | 8건물/9주민·크기/문/깊이와 기능 연결 후보 |
| 설산·폭포·늪 | [`BIOME_SCENERY_V1.md`](BIOME_SCENERY_V1.md) | 현행 원화·기존 물리/낚시 보존·프롬프트/QA |
| 나무 다리 | [`WOOD_BRIDGES_V1.md`](WOOD_BRIDGES_V1.md) | 48칸 보존·방향/연결부/보/기둥·원화/QA |
| QA 보존 | [`QA_RETENTION.md`](QA_RETENTION.md) | 최신/직전/재현·휴지통 정리 안전 기준 |
| 용량 현황 | [`PROJECT_STORAGE.md`](PROJECT_STORAGE.md) | 개발 폴더/실제 배포/원본·Git·테스트 구분 |
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
- 실기기 확인은 남았지만 사용자가 나중에 하기로 했다. 현재 확장을 막는 필수 선행 작업으로 삼거나 실측 없이 내구도 수치를 다시 조정하지 않는다.

## 현재 낚시와 다음 개발 후보 (2026-10-14)

- 완료: 물고기 74종·10서식지·낚싯대 10종·승선권 4항로·표시 중 10분 운항·비반복 바다 연출·도감/졸업/꾸미기·마을 부분 수리·기존 저장 호환. 기본 낚싯대는 무한이며 유료 장비의 획득 마모는 내륙·해안 1 / 바다 6·8·10·12다.
- 다음 개발 후보: 농사 도구·작물 도감/보상 → 요리 최소 루프. 독립 Farming과 수확 XP는 사용자 요청으로 구현했다. 직업 의상·주거·의뢰·전투는 별도 선택/장기 후보다.
- 농사는 공개 작물 14종·독립 Lv.1–100/숙련도·16칸 중 초기 4칸/개별 구매·심기·오프라인 성장·수확 XP/판매/저장이 있다. 통로 배치·밭 상시 충돌·기본 낫을 유지한다. 상위 낫·작물 도감은 아직 없다.
- Android 체감과 설치 앱 비행기 모드 확인은 사용자 결정에 따라 나중에 한다. 상세 우선순위와 승인 경계는 [`HANDOFF.md`](HANDOFF.md)의 최신 `다음 작업 안내`를 따른다.

## 새 세션 시작 명령

```bash
git status --short
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
node scripts/check.mjs
node scripts/build.mjs
```

로컬 변경/원격 차이를 확인하고 깨끗한 상태에서만 필요한 fast-forward를 한다. 강제 덮어쓰기를 하지 않는다.

벌목 전체를 이어서 작업할 때는 `HANDOFF.md`의 추가 QA 명령을 실행한다. `dist/`는 빌드 결과이므로 직접 편집하거나 커밋하지 않고, `output/` 전체는 Git 제외다. [`QA_RETENTION.md`](QA_RETENTION.md)의 최신/직전/고정 보존 기준을 적용하고 새/정체불명 결과나 사용자 원화를 일괄 삭제하지 않는다.
