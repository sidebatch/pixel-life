# Pixel Life 문서 안내

2026-10-13 사용자 요청으로 농장 정비 v1 공개 배포 완료. 게임 변경 커밋 `12e5a7d`, PWA `568667fe105c`, [배포 기록](https://github.com/sidebatch/pixel-life/actions/runs/38346705185). 공개 8파일 일치·393/320px 밭 상시 이동 차단/낫 수확/저장 보존·PWA 오프라인 실행/음악을 확인했다. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다.

2026-10-13 공개 농장 기준: [FARMING_LAYOUT_V1.md](FARMING_LAYOUT_V1.md). 지정 부지 16칸/초기 4칸, 통로로 나눈 한 줄 밭 네 줄, 밭 자체의 상시 이동 차단, 기본 무한 낫 수확, 씨앗 수확 수량 설명 제거. 기존 소유/심은 작물은 보존했다. 농장 정비 v1도 공개 배포 완료했으며 PWA 빌드는 `568667fe105c`다. 검증 결과는 DEPLOYMENT.md에 기록했다.

갱신: 2026-10-13. 성장 균형 v2는 공개 배포 완료했으며 현재 수치/저장 이행은 [LIFE_SKILL_GROWTH_BALANCE.md](LIFE_SKILL_GROWTH_BALANCE.md), 배포 검증은 [DEPLOYMENT.md](DEPLOYMENT.md)에 있다. 현재 인수인계는 간소화했으며 과거 전체 기록은 [HANDOFF_HISTORY_2026_10_12.md](HANDOFF_HISTORY_2026_10_12.md)에 보존했다.

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

## 현재 낚시와 다음 개발 후보 (2026-10-12)

- 완료: 물고기 74종·10서식지·낚싯대 10종·승선권 4항로·표시 중 10분 운항·비반복 바다 연출·도감/졸업/꾸미기·마을 부분 수리·기존 저장 호환. 기본 낚싯대는 무한이며 유료 장비의 획득 마모는 내륙·해안 1 / 바다 6·8·10·12다.
- 다음 개발 추천: 농사 독립 Farming/채집 포함을 사용자에게 확인(독립 농사는 assistant 추천이며 아직 확정되지 않음)/성장 설계 → 농사 도구·작물 도감/보상 → 요리 최소 루프. 직업 의상·주거·의뢰·전투는 별도 선택/장기 후보이며 승인 없이 구현하지 않는다.
- 농사는 작물 10종·16칸 중 초기 4칸/개별 구매·심기·오프라인 성장·수확/판매/저장이 있으며, 현행은 통로 배치·밭 상시 충돌·기본 낫까지 구현됐다. 농사 XP·상위 낫·작물 도감은 아직 없다. 이미 있는 밭 구매를 새 기능으로 착각하지 않는다.
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
