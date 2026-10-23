# Pixel Life 문서 안내

2026-10-22 [던전 계단 가림·이동 회피 수정 v1](DUNGEON_STAIRS_MELEE_FIX_V1.md) 로컬 적용 / 공개 미배포. 계단 위 캐릭터 노출·상행/하행 높이, 공격 예고와 피해 범위 일치, 이동으로 장비 휘두르기 취소와 공격 간격 유지 기준이다.

2026-10-22 [목검·브락의 검 / 던전 남쪽 진입 v2](WEAPONS_DUNGEON_ROUTE_V2.md) 로컬 적용 / 공개 미배포. 재료에 맞는 무기 그림·이름·저장 이전, 남쪽 진입, 입구 바로 앞 첫 사냥터, 10지역 순서와 귀환 계단을 정리했다. 최신 무기·이동 기준은 이 문서다.

2026-10-22 [휴대용 제작대·브락 전투·사냥 보상 v1](PORTABLE_CRAFTING_BRAK_V1.md) 로컬 구현 / 공개 미배포. 준의 목재 20개 제작대 → 가방 사용 → 가죽 가공 → 철검 제작과 내구도·수리·사냥 보상·처치 대기 저장을 연결했다. 최신 실제 구현은 이 문서를 따른다.

2026-10-22 던전 외형·우두머리 공개 배포 완료. 게임 변경 [4b12adb](https://github.com/sidebatch/pixel-life/commit/4b12adbb27d164c87c5e592d50d0dd8eeac45f46), [게시 성공 #39875309357](https://github.com/sidebatch/pixel-life/actions/runs/39875309357), PWA `58ae0846bafc`. 공개 8파일 43,425,512 bytes가 독립 배포 빌드와 SHA-256까지 일치한다. 10지역·60종·110마리와 왜가리/아르마딜로 교체·브락/보른 재제작·우두머리 후광/왕관을 공개 반영했다. [배포·검증 기록](DUNGEON_DEPLOYMENT_V1.md).

2026-10-22 [던전 외형 수정·우두머리 표시 v2](DUNGEON_ART_ROYAL_V2.md) 로컬 적용. 리치→왜가리, 샌드웜→아르마딜로로 바꾸고 브락·보른의 체형과 색을 다시 그렸다. 우두머리 10종에 지역색 후광·빛고리·왕관을 추가했다. [생성 프롬프트·원본 기록](art/dungeon-prompts-v2.json). 구성안은 개정 6이며 새 전투·보상은 계속 후속 작업이다.

2026-10-22 [던전 외형·탐방 v1](DUNGEON_VISUAL_PREVIEW_V1.md) 로컬 구현. 마을 굴→갈림길→10개 지역으로 출입하며 60종/110마리를 둘러볼 수 있다. 기존 동물 5종 외에 55종과 지역별 굴 입구를 새로 제작했다. [생성 프롬프트·원본 위치](art/dungeon-prompts-v1.json)를 기록했다. 새 몬스터 전투·드롭·조합은 후속 작업이며 공개 배포 완료.

2026-10-22 [들녘 숲 전투·조합·보상 표 개정 2](HUNTING_MEADOW_BALANCE_V1.md)를 작성했다. 최신 사용자 수정은 일반 가죽 30→튼튼한 가죽 1, 철검은 튼튼한 가죽 3+브락 엄니 1이다. 단단한 가죽은 철검에 필요하지 않다. 추가 코인 비용 제거·판매가 3/90/900·드롭량·철검 수리비 100코인 조정안을 정리했다. 일반 25마리+브락 1마리의 재료 계산과 가정 시간 예시이며 실제 전투 시뮬레이션·게임 적용·배포 전이다.

2026-10-22 사냥 지역 확장 **기획 문서 개정 5**를 작성했다. [지역 10곳·몬스터 구성안](DUNGEON_REGIONS_MONSTERS_V1.md)에 사용자 지정 이름 바위거북·케이브뱃·크록·스카랍·북극토끼·북극여우·아이스뱃·발록을 반영하고 외부 참고 자료를 삭제했다. 지역 10곳·일반 50+보스 10, 영어 이름, 접근·직접 공격·이동 회피와 마법 제외 방향은 유지한다. 이후 외형·탐방은 상단 문서처럼 로컬 구현했고, 새 몬스터의 전투는 후속 작업이다.

2026-10-21 마을 음악 복구·사냥터 지형 v3 공개 배포 완료. 게임 변경 [93040a7](https://github.com/sidebatch/pixel-life/commit/93040a76df855143d03f73ad822f998375283a93), [게시 성공 #39568380631](https://github.com/sidebatch/pixel-life/actions/runs/39568380631), PWA `1aa83dac4d82`. HTML 22,584,979 bytes / 공개 8파일 40,052,934 bytes가 독립 배포 빌드와 SHA-256까지 일치한다. [변경·그림·검증](HUNTING_DYNAMIC_MUSIC_V3.md).

음악 읽기 오류 후 자동 재개·새 요청/스트리밍 경로와 오프라인 캐시를 보완하고, 새 절벽/나무 군락/거목 3종과 25개 지형 구역을 적용했다. 독립 전체 검사 56 scripts/153 UI IDs/497 assets/74 fish와 빌드, 공개 음악 요청 실패 주입 후 복구·6지역 왕복/실제 파형·지속 재생·음소거, 공개 320/393/1280px 지형/큰 군락 우회·5종/10개체 전투·60% 명중률/소리·입구 왕복/저장을 통과했다. 독립 3곡 반복·기존 22장비/480변환·낚시/수확, 새로 막힌 칸의 저장 위치 복구도 통과했다. 새 PWA 캐시·오프라인/재시도 주소의 음악 Range 206/100 bytes·강제 재로딩 없음 확인. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 별도 숲 배치 작업은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-dynamic-qa/`.

2026-10-21 사냥터 굴·지형·전투 피드백 v2 공개 배포 완료. 게임 변경 [cdfcb43](https://github.com/sidebatch/pixel-life/commit/cdfcb43dd02836cdac58c938190e845856623207), [게시 성공 #39560772381](https://github.com/sidebatch/pixel-life/actions/runs/39560772381), PWA `17bb8ceec9a6`. HTML 22,042,299 bytes / 공개 8파일 39,509,461 bytes가 독립 배포 빌드와 SHA-256까지 일치한다. [변경·이미지·검증](HUNTING_TERRAIN_COMBAT_V2.md).

굴 입구/접근로·능선 8곳/연결 길 203칸·휘두름/명중음·양쪽 명중률 60%를 적용했다. 독립 전체 검사 56 scripts/153 UI IDs/494 assets/74 fish와 빌드, 공개 320/393/1280px 입구 왕복·중립/개별 반격·피격/회피·귀소/처치/재등장·저장/겹침 방지, 실제 공격 각 1만 회(플레이어 60.61%/동물 59.33%), 8종 Web Audio 파형/실행·한 번의 소리/피해·능선 우회를 통과했다. 독립 배포 빌드의 기존 22장비/남녀/사방향/480변환·낚시/수확 회귀도 통과했다. 새 캐시·오프라인 실행·음악 Range 206/100 bytes·강제 재로딩 없음을 확인했다. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 기존 숲 배치 미커밋 변경은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-terrain-qa/`.

2026-10-20 야생동물 공격 모션 공개 배포 완료. 게임 변경 [4596ce2](https://github.com/sidebatch/pixel-life/commit/4596ce286b24c3462e08cd91e456a1aea6060ae2), [게시 성공 #39487970017](https://github.com/sidebatch/pixel-life/actions/runs/39487970017), PWA `f0910f53e09d`. HTML 21,948,018 bytes / 공개 8파일 39,415,180 bytes가 독립 배포 빌드와 SHA-256까지 일치한다. [공격 모션 기준](HUNTING_ATTACK_MOTION_V1.md).

5종/4방향의 공격 자세와 움츠림→타격→복귀를 적용했다. 전체 검사 56 scripts/153 UI IDs/493 assets/74 fish, 140개 모션 상태, 공개 320/393/1280px 각각 140개 실제 전투 프레임의 타격 시점·1회 피해·충돌 기준·메뉴 정지·빗나감·지역 이동 해제·동작 줄이기·경제 불변, 기존 사냥터 동작을 통과했다. 독립 빌드의 기존 22장비/남녀/사방향/480변환과 낚시/수확 회귀도 통과했다. 새 캐시·오프라인·음악 Range 206/100 bytes·강제 재로딩 없음을 격리 브라우저에서 확인했다. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 기존 숲 배치 미커밋 변경은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-attack-qa/`.

2026-10-20 들녘 사냥터 공개 배포 완료. 게임 변경 [d664356](https://github.com/sidebatch/pixel-life/commit/d664356617be67838101e947133de653db89ed44), [게시 성공 #39484662032](https://github.com/sidebatch/pixel-life/actions/runs/39484662032), PWA `7c65baf8b3ce`. HTML 21,771,452 bytes / 공개 8파일 39,238,614 bytes의 SHA-256이 사냥터만 추출한 독립 빌드와 일치한다. [사냥터 기준](HUNTING_GROUND_V1.md).

마을 남동쪽 내부 입구와 야생동물 5종/10개체, 공격받은 개체만 반격하는 전투·체력/마을 복귀를 게시했다. 독립 소스 전체 검사 56 scripts/153 UI IDs/488 assets/74 fish와 빌드, 공개 320/393/1280px 왕복·선공 없음·개별 반격·회피/귀소·처치/재등장·4종 도구·체력 소진 복귀·저장/재접속·중첩 방지를 통과했다. 기존 22장비/남녀/사방향/480변환과 실제 낚시/수확 회귀도 통과했다. 격리 브라우저에서 새 캐시·오프라인 실행·음악 Range 206/100 bytes·강제 재로딩 없음을 확인했다. 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 이전부터 작업 중이던 숲 배치 변경은 보존하고 이번 게시에서 제외했다. 결과 `output/deploy-hunting-qa/`.

2026-10-22 기준. 새 세션은 [HANDOFF.md](HANDOFF.md)와 [사냥 지역 10곳 기획](DUNGEON_REGIONS_MONSTERS_V1.md)부터 읽는다. 첫 사냥터는 공개되어 있고, 다음 확장은 지역·몬스터 구성 검토 단계다. [10월 17일 콘텐츠 회의](NEXT_CONTENT_DISCUSSION_2026_10_17.md)는 사냥터 선택 전 기록이며, 아래 문서의 구현/제안/과거 기록을 구별한다.

현재 게임 변경 93040a7/PWA 1aa83dac4d82, 56 runtime scripts/153 UI IDs/497 assets/74 fish. 최근 공개/이전 내역은 [DEPLOYMENT.md](DEPLOYMENT.md)와 [10월 16일 누적 이력](HANDOFF_RELEASE_HISTORY_2026_10_16.md)에 있다.

## 새 세션 읽는 순서

1. [`HANDOFF.md`](HANDOFF.md) — 현재 상태와 바로 다음 작업
2. [`../README.md`](../README.md) — 실행 방법과 전체 기능 범위
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) — 코드 구조와 모듈 책임
4. 작업 분야의 기준 문서 — 아래 표에서 선택
5. [`DEPLOYMENT.md`](DEPLOYMENT.md) — 검사·GitHub Pages·PWA 배포

## 분야별 기준 문서

| 분야 | 문서 | 용도 |
| --- | --- | --- |
| 첫 사냥터·조합 초안 | [HUNTING_MEADOW_BALANCE_V1.md](HUNTING_MEADOW_BALANCE_V1.md) | 개정 2·가죽 30→1·철검 튼튼 3+엄니 1·드롭/가격/수리·수량/가정 시간 계산 |
| 사냥 지역 10곳 기획 | [DUNGEON_REGIONS_MONSTERS_V1.md](DUNGEON_REGIONS_MONSTERS_V1.md) | 개정 5·사용자 지정 이름 8종·일반 50+보스 10·직접 공격/이동 회피·구현 전 |
| 음악 복구·사냥터 지형 v3 | [HUNTING_DYNAMIC_MUSIC_V3.md](HUNTING_DYNAMIC_MUSIC_V3.md) | 실제 음악 오류/위치 복구·오프라인·절벽/숲/거목·검증 |
| 굴·지형·전투 피드백 | [HUNTING_TERRAIN_COMBAT_V2.md](HUNTING_TERRAIN_COMBAT_V2.md) | 굴/능선·연결 길·명중률 60%·공격/피격음·검증 |
| 첫 사냥터 | [HUNTING_GROUND_V1.md](HUNTING_GROUND_V1.md) | 마을 안쪽 입구·5종/10개체·개별 반격·체력/복귀·세션/검증 |
| 모든 손 장비 휘두르기 | [TOOL_SWING_V1.md](TOOL_SWING_V1.md) | 2026-10-19 공개 완료·22장비·rodSwing/낫 허공 동작·기존 변환 보호 |
| 다음 콘텐츠 회의 이력 | [NEXT_CONTENT_DISCUSSION_2026_10_17.md](NEXT_CONTENT_DISCUSSION_2026_10_17.md) | 광산·보물·동물·제작/요리 후보를 논의한 사냥터 선택 전 기록 |
| 성장 현황/작은 HUD | [GROWTH_STATUS_V1.md](GROWTH_STATUS_V1.md) | 실제 3스킬·XP·숙련도/28px 바·저장 불변 |
| 폭풍·벼락/달력 | [WEATHER_QA_V1.md](WEATHER_QA_V1.md) | 5~60FPS 시간·폭풍 보정·벼락/동작 줄이기·QA |
| NPC 서비스/아이콘 | [MARKET_SERVICES_ICONS_V1.md](MARKET_SERVICES_ICONS_V1.md) | 작은 세로 선택창·실제 거래 분리·취소→전부·22지역/7스킬 그림 |
| 캐릭터·하루 규격 | [NPC_STANDARD_AUDIT_V1.md](NPC_STANDARD_AUDIT_V1.md) | 하루 v3·이전 비율 오류 원인·전체 NPC/플레이어 검사 |
| 하위 도끼 대체 벌목 | [FORESTRY_LOWER_AXE_V1.md](FORESTRY_LOWER_AXE_V1.md) | 상위 도끼 획득 후 해금·위력 40/25/15/10% |
| 내구도/귀환/획득 | [GAMEPLAY_FEEDBACK_V1.md](GAMEPLAY_FEEDBACK_V1.md) | 수량 0개 포함·중앙 귀환·장비/하단 바 내구도·낚싯대 두께 |
| 농사 레벨/14작물 | [FARMING_PROGRESSION_V1.md](FARMING_PROGRESSION_V1.md), [FARMING_CROPS_BALANCE_V1.md](FARMING_CROPS_BALANCE_V1.md) | 실제 Farming XP·성장 v2·가격/성장시간 |
| 농장 배치/기본 낫 | [FARMING_LAYOUT_V1.md](FARMING_LAYOUT_V1.md), [SICKLE_ART_V2.md](SICKLE_ART_V2.md) | 지정 16칸·상시 충돌·통로·기본 낫/남녀 동작 |
| 가방 농장 탭 | [FARM_INVENTORY_V1.md](FARM_INVENTORY_V1.md) | 교환권·소품 보유/설치/회수 |
| 어선 배경/운임 | [VOYAGE_SCENERY_V2.md](VOYAGE_SCENERY_V2.md), [VOYAGE_FARES_V1.md](VOYAGE_FARES_V1.md) | 겹침/얕은 바다 부표·4항로 가격 |
| 구매/수리음·폭포 | [MARKET_WATERFALL_V1.md](MARKET_WATERFALL_V1.md) | 저장 성공 효과음·실패 무음·폭포 움직임 |
| 하단 도구 바 | [TOOL_HOTBAR_V1.md](TOOL_HOTBAR_V1.md) | 5칸 즉시 교체/단축키·저장/파손·행동 잠금/터치 배치 |
| 숲·농사 후속 정리 | [FARM_WORLD_POLISH_V2.md](FARM_WORLD_POLISH_V2.md) | 숲 사각형 제거·하루 v2/마을 이전·수확음·작물 그림 |
| 농사 상점·판매·도감 | [SHOP_DEX_POLISH_V1.md](SHOP_DEX_POLISH_V1.md) | 하루 농가/NPC·엘리 역할 분리·선택 초기화·큰 그림·원화/검증 |
| 농장 주문·교환권 | [FARM_ORDERS_V1.md](FARM_ORDERS_V1.md) | 랜덤 1개/납품·보상/주문 단계/저장 |
| 농장 소품 8종 | [FARM_DECORATIONS_EXPANSION_V1.md](FARM_DECORATIONS_EXPANSION_V1.md) | 가격·고정 좌표/충돌/원본·프롬프트/검증 |
| 현재 조작부 | [TOUCH_CONTROLS_V1.md](TOUCH_CONTROLS_V1.md) | 원형/반투명·상황별 실제 장비 그림·터치 검증 |
| 벌목 현재 수치 | [`FORESTRY_BALANCE.md`](FORESTRY_BALANCE.md) | 나무 HP·XP·가격·도끼 피해의 현재 임시값과 이력 |
| 벌목 10단계 | [`FORESTRY_10_STAGE_DESIGN.md`](FORESTRY_10_STAGE_DESIGN.md) | 도끼 10종·숲·내구력·수리/후속 하위 도끼 해금과 과거 설계 구분 |
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
| 마을 그림/배치 | [`VILLAGE_POLISH_V1.md`](VILLAGE_POLISH_V1.md) | 현재 9건물/10주민·과거 v1 배치와 하루 후속/규격 구분 |
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
- 현재: 상위 도끼를 실제 획득한 뒤에는 해당 단계까지 하위 도끼 대체 벌목 가능. 단계 차이별 위력은 40/25/15/10%, 해금 전 단계 제한 유지
- 실기기 확인은 남았지만 사용자가 나중에 하기로 했다. 현재 확장을 막는 필수 선행 작업으로 삼거나 실측 없이 내구도 수치를 다시 조정하지 않는다.

## 현재 낚시와 다음 콘텐츠 회의 (2026-10-17)

- 완료: 물고기 74종·10서식지·낚싯대 10종·승선권 4항로·표시 중 10분 운항·비반복 바다 연출·도감/졸업/꾸미기·마을 부분 수리·기존 저장 호환. 기본 낚싯대는 무한이며 유료 장비의 획득 마모는 내륙·해안 1 / 바다 6·8·10·12다.
- 다음 콘텐츠는 아직 미선택이다. 광산·보물 탐사·동물 키우기·제작/요리를 논의했다. 농사 레벨·랜덤 1건 주문·납품·교환권·소품 8종은 완료됐고, 작물 도감을 핵심 목표로 먼저 만드는 안은 보류다. [회의 기록](NEXT_CONTENT_DISCUSSION_2026_10_17.md)을 따른다.
- 농사는 공개 작물 14종·독립 Lv.1–100/숙련도·16칸 중 초기 4칸/개별 구매·심기·오프라인 성장·수확 XP/판매/저장이 있다. 통로 배치·밭 상시 충돌·기본 낫을 유지한다. 상위 낫·작물 도감은 아직 없다.
- Android 체감과 설치 앱 비행기 모드 확인은 사용자 결정에 따라 나중에 한다. 상세 우선순위와 승인 경계는 [`HANDOFF.md`](HANDOFF.md)의 최신 다음 작업 항목를 따른다.

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
