# Deployment

2026-10-23 [링크 공유 썸네일 v1](SOCIAL_SHARE_V1.md)을 추가했다. 배포 빌드는 원본 생성 그림을 제외하고 1200×630 공유 PNG를 포함한 9파일이다. 정적 head 메타와 공개 이미지가 함께 게시되어야 하며 필수 앱 캐시는 기존 7파일이다. 공개 검증 기록은 해당 문서와 `output/deploy-social-share-v1/`을 따른다.

2026-10-23 **제작·무기·던전 동선·계단/회피 공개 배포 완료.** 게임 변경 [6777367](https://github.com/sidebatch/pixel-life/commit/6777367618b38b93215d419acadcd0793c4e35e9), [게시 성공 #39901152537](https://github.com/sidebatch/pixel-life/actions/runs/39901152537), PWA `4bb3bb751994`. 공개 8파일 43,683,943 bytes가 독립 배포 빌드와 SHA-256까지 일치한다. [변경·검증 기록](CRAFTING_DUNGEON_DEPLOYMENT_V2.md).

휴대용 제작대·가죽 조합·브락 전투/가죽/엄니 보상·목검/브락의 검·과거 장비 저장 이전·10던전 남쪽 진입과 순서를 반영했다. 계단에서 캐릭터가 보이며 상행/하행 높이가 변하고, 공격 표시 범위 밖 이동은 피해 없이 회피한다. 사냥 중 이동으로 장비 동작을 취소하되 700ms 공격 간격 유지. 별도 숲 배치 실험은 보존하고 배포에서 제외했다.

배포용 전체 검사 60 scripts/164 UI IDs/533 assets/74 fish와 빌드, 남녀 검 16자세를 통과했다. 로컬 배포본과 공개 사이트의 320/393/1280px에서 11개 계단, 6종×4방향×4상황(각 288 전투 시나리오), 4장비의 타격 전/후 취소·공격 간격, 실제 터치/방향키, 제작/수리/보상/저장 실패 복구와 과거 장비 ID 이전, 10지역 왕복/접근을 검증했다. 공개 새 PWA 캐시 7파일·오프라인 저장 복원·3곡 Range 206/100 bytes·강제 새로고침 없음 확인. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 결과 `output/deploy-crafting-dungeons-v2/`.

## 2026-10-21 마을 음악 복구·사냥터 지형 v3

2026-10-21 마을 음악 복구·사냥터 지형 v3 공개 배포 완료. 게임 변경 [93040a7](https://github.com/sidebatch/pixel-life/commit/93040a76df855143d03f73ad822f998375283a93), [게시 성공 #39568380631](https://github.com/sidebatch/pixel-life/actions/runs/39568380631), PWA `1aa83dac4d82`. HTML 22,584,979 bytes / 공개 8파일 40,052,934 bytes가 독립 배포 빌드와 SHA-256까지 일치한다.

음악 읽기 오류 후 자동 재개·새 요청/스트리밍 경로와 오프라인 캐시를 보완하고, 새 절벽/나무 군락/거목 3종과 25개 지형 구역을 적용했다. 독립 전체 검사 56 scripts/153 UI IDs/497 assets/74 fish와 빌드, 공개 음악 요청 실패 주입 후 복구·6지역 왕복/실제 파형·지속 재생·음소거, 공개 320/393/1280px 지형/큰 군락 우회·5종/10개체 전투·60% 명중률/소리·입구 왕복/저장을 통과했다. 독립 3곡 반복·기존 22장비/480변환·낚시/수확, 새로 막힌 칸의 저장 위치 복구도 통과했다. 새 PWA 캐시·오프라인/재시도 주소의 음악 Range 206/100 bytes·강제 재로딩 없음 확인. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 별도 숲 배치 작업은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-dynamic-qa/`. [기준](HUNTING_DYNAMIC_MUSIC_V3.md).

## 2026-10-21 사냥터 굴·지형·전투 피드백 v2 공개 배포

2026-10-21 사냥터 굴·지형·전투 피드백 v2 공개 배포 완료. 게임 변경 [cdfcb43](https://github.com/sidebatch/pixel-life/commit/cdfcb43dd02836cdac58c938190e845856623207), [게시 성공 #39560772381](https://github.com/sidebatch/pixel-life/actions/runs/39560772381), PWA `17bb8ceec9a6`. HTML 22,042,299 bytes / 공개 8파일 39,509,461 bytes가 독립 배포 빌드와 SHA-256까지 일치한다.

굴 입구/접근로·능선 8곳/연결 길 203칸·휘두름/명중음·양쪽 명중률 60%를 적용했다. 독립 전체 검사 56 scripts/153 UI IDs/494 assets/74 fish와 빌드, 공개 320/393/1280px 입구 왕복·중립/개별 반격·피격/회피·귀소/처치/재등장·저장/겹침 방지, 실제 공격 각 1만 회(플레이어 60.61%/동물 59.33%), 8종 Web Audio 파형/실행·한 번의 소리/피해·능선 우회를 통과했다. 독립 배포 빌드의 기존 22장비/남녀/사방향/480변환·낚시/수확 회귀도 통과했다. 새 캐시·오프라인 실행·음악 Range 206/100 bytes·강제 재로딩 없음을 확인했다. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 기존 숲 배치 미커밋 변경은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-terrain-qa/`. [기준](HUNTING_TERRAIN_COMBAT_V2.md).

## 2026-10-20 야생동물 공격 모션 공개 배포

2026-10-20 야생동물 공격 모션 공개 배포 완료. 게임 변경 [4596ce2](https://github.com/sidebatch/pixel-life/commit/4596ce286b24c3462e08cd91e456a1aea6060ae2), [게시 성공 #39487970017](https://github.com/sidebatch/pixel-life/actions/runs/39487970017), PWA `f0910f53e09d`. HTML 21,948,018 bytes / 공개 8파일 39,415,180 bytes가 독립 배포 빌드와 SHA-256까지 일치한다.

5종/4방향의 공격 자세와 움츠림→타격→복귀를 적용했다. 전체 검사 56 scripts/153 UI IDs/493 assets/74 fish, 140개 모션 상태, 공개 320/393/1280px 각각 140개 실제 전투 프레임의 타격 시점·1회 피해·충돌 기준·메뉴 정지·빗나감·지역 이동 해제·동작 줄이기·경제 불변, 기존 사냥터 동작을 통과했다. 독립 빌드의 기존 22장비/남녀/사방향/480변환과 낚시/수확 회귀도 통과했다. 새 캐시·오프라인·음악 Range 206/100 bytes·강제 재로딩 없음을 격리 브라우저에서 확인했다. 앱 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 기존 숲 배치 미커밋 변경은 보존하고 배포에서 제외했다. 결과 `output/deploy-hunting-attack-qa/`. [모션 기준](HUNTING_ATTACK_MOTION_V1.md).

## 2026-10-20 들녘 사냥터 공개 배포

2026-10-20 들녘 사냥터 공개 배포 완료. 게임 변경 [d664356](https://github.com/sidebatch/pixel-life/commit/d664356617be67838101e947133de653db89ed44), [게시 성공 #39484662032](https://github.com/sidebatch/pixel-life/actions/runs/39484662032), PWA `7c65baf8b3ce`. HTML 21,771,452 bytes / 공개 8파일 39,238,614 bytes의 SHA-256이 사냥터만 추출한 독립 빌드와 일치한다.

마을 남동쪽 내부 입구와 야생동물 5종/10개체, 공격받은 개체만 반격하는 전투·체력/마을 복귀를 게시했다. 독립 소스 전체 검사 56 scripts/153 UI IDs/488 assets/74 fish와 빌드, 공개 320/393/1280px 왕복·선공 없음·개별 반격·회피/귀소·처치/재등장·4종 도구·체력 소진 복귀·저장/재접속·중첩 방지를 통과했다. 기존 22장비/남녀/사방향/480변환과 실제 낚시/수확 회귀도 통과했다. 격리 브라우저에서 새 캐시·오프라인 실행·음악 Range 206/100 bytes·강제 재로딩 없음을 확인했다. 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 않았다. 이전부터 작업 중이던 숲 배치 변경은 보존하고 이번 게시에서 제외했다. 결과 `output/deploy-hunting-qa/`. [사냥터 기준](HUNTING_GROUND_V1.md).

## 2026-10-19 모든 손 장비 휘두르기 공개 배포

2026-10-19 모든 손 장비 휘두르기 공개 배포 완료. 게임 변경 [eccf7d7](https://github.com/sidebatch/pixel-life/commit/eccf7d720de6ddf5e55a7c0d09accb314c0cb470), PWA `7e3bd6e5beb2`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/39355204438). HTML 21,384,628 bytes/공개 8파일 38,851,790 bytes가 배포용 독립 빌드와 SHA-256까지 일치한다.

도끼 10종·낚싯대 10종·기본 낫·기본 검을 빈 공간에서 행동 버튼 또는 Space/Z로 휘두른다. 앞모습의 남녀 손 위치·준비→앞/아래 타격 방향을 22장비/88프레임과 실제 합성 시트로 재확인했으며 추가 자세 변경은 필요하지 않았다. 나무 앞의 검/낚싯대/낫은 무피해 동작이고 물가 낚시·밭 수확은 기존대로다. 허공 동작은 내구도/XP/아이템/저장/난수를 바꾸지 않는다. [기준·검증](TOOL_SWING_V1.md).

배포할 커밋만 추출한 독립 소스에서 전체 검사 54 scripts/150 UI ids/481 assets/74 fish와 빌드를 통과했다. 공개 320/393px 모바일·PC 1280px에서 화면당 176회/352프레임, 정면 88프레임, 기존 480개 변환 일치·잠금/파손·실제 낚시/수확·저장 불변을 검증했다. PWA 격리 브라우저에서 새 캐시·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음을 확인했다. 설치 가능성은 비공개 창 제한(in-incognito)으로 확인하지 못했고, 새 영구 프로필에서는 서비스 워커 제어 대기가 끝나지 않아 설치 검증을 미완료로 남긴다. 기존 숲 배치 미커밋 변경은 보존하고 이번 배포에서 제외했다. 결과 `output/deploy-tool-swing-qa/`. 아래는 이전 공개/개발 기록이다.


## 2026-10-17 — 다음 세션 문서 기준

현재 검증 게임은 bbdd431, 직전 문서 포함 최종 게시 81bca11([성공 #38942837269](https://github.com/sidebatch/pixel-life/actions/runs/38942837269))이다. PWA 916b840676ed/공개 8파일 38,850,279 bytes는 동일하다. 이번 main 문서 푸시도 자동 CI/게시 대상이지만 게임 소스·에셋은 바꾸지 않는다. 문서 자체 최신 커밋/실행은 GitHub main과 Actions에서 확인한다. 새 세션의 다음 작업은 [HANDOFF.md](HANDOFF.md)와 [미선택 콘텐츠 회의](NEXT_CONTENT_DISCUSSION_2026_10_17.md)를 따른다.


## 2026-10-16 폭풍·벼락 QA 보완 공개 배포

2026-10-16 폭풍·벼락 QA 보완 공개 배포 완료. 게임 변경 [bbdd431](https://github.com/sidebatch/pixel-life/commit/bbdd431b8c9c6eaa1dd0754713a1ddea86771adc), PWA `916b840676ed`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38942120347). HTML 21,383,117 bytes/공개 8파일 38,850,279 bytes가 로컬과 SHA-256까지 일치한다.

낮은 FPS에서 달력·날씨 전환까지 느려지던 문제를 수정했다. 연속 플레이 중 폭풍이 아닌 구간이 3번 연속이면 다음 구간은 폭풍으로 정해 최대 약 30분의 대기를 보장한다. 벼락은 약한 밝은 색조와 선 주변 빛으로 작은 화면에서 알아보기 쉽게 했다. 기존 모양 변화·간격과 동작 줄이기 설정은 유지한다. 폭풍의 최종 비중은 늘지만 어종 조건·가격·보상·장비 및 저장 버전 2는 유지한다. [원인·기준·검증](WEATHER_QA_V1.md).

수치 QA 1만 게임 날짜·5~60FPS 실제 프레임 루프·비활성/복귀/BFCache, 전체 검사 53 scripts/150 UI ids/481 assets/74 fish와 서버 빌드·게시 통과. 공개 320/393px 모바일·PC 1280px의 자동 폭풍·실행 중인 벼락·6개 모양·22지역·동작 줄이기·자동/수동 전환·저장/시각 효과 난수 불변을 검증했다. PWA 설치 오류 없음·새 캐시·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 확인. 결과 `output/deploy-weather-qa/`. 아래는 이전 공개/개발 기록이다.


## 2026-10-16 성장 현황 창·상단 작은 레벨 바 공개 배포

2026-10-16 성장 현황 창·상단 작은 레벨 바 공개 배포 완료. 게임 변경 [8ca3d2c](https://github.com/sidebatch/pixel-life/commit/8ca3d2ce9b5bdb647e6843bd2f98ba31fc44b156), PWA `a77615df2249`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38939472908). HTML 21,382,180 bytes/공개 8파일 38,849,342 bytes가 로컬과 SHA-256까지 일치한다.

지역 이름 아래 작은 반투명 바에서 낚시·벌목·농사 아이콘과 현재 레벨을 확인하고, 누르면 상세 성장 현황을 연다. 여행 메뉴에서도 진입할 수 있다. 상세 창은 현재 경험치·진행률·다음 레벨까지 남은 XP·누적 XP와 Lv.100 숙련도를 표시한다. 닫힌 상태에서도 작은 바가 갱신되며 항해 시간과 알림은 겹치지 않는다. [기준·검증](GROWTH_STATUS_V1.md).

전체 검사 53 scripts/150 UI ids/481 assets/74 fish와 서버 빌드·게시 성공. 공개 320/393px 모바일·PC 1280px에서 작은 바/상세 창·실시간 레벨/XP·키보드/배경/뒤로·앞으로/재접속·저장 호출 없음/기존 데이터 유지·가방/도감 진입을 확인했다. PWA 설치 오류 없음·새 캐시·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 검증 통과. 저장 버전 2 유지. 결과 `output/deploy-growth-status-qa/`. 아래는 이전 공개/개발 기록이다.


## 2026-10-16 작은 상점 선택창 공개 배포

2026-10-16 작은 상점 선택창 공개 배포 완료. 게임 변경 [69a5442](https://github.com/sidebatch/pixel-life/commit/69a5442fca2db80e1898b145710b69635b6f16b0), PWA `8a4de087e791`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38854194121). HTML 21,372,082 bytes/공개 8파일 38,839,244 bytes가 로컬과 SHA-256까지 일치한다.

모든 NPC 상점 첫 창은 중앙의 작은 창에 구매·판매·업그레이드·수리·주문·꾸미기 등 이름만 세로로 표시한다. 첫 창의 그림·부가 설명·지갑·거래 푸터를 제거하고, 선택하면 기존 품목 그림과 상세 거래 화면을 연다. 서비스 선택으로 돌아오면 작은 창으로 접힌다. 창 뒤쪽 조작 버튼 입력은 차단하며 비어 있는 메뉴 숨김·거래·저장·생활/지역 아이콘은 유지한다. [기준·검증](MARKET_SERVICES_ICONS_V1.md).

서버 전체 검사/빌드/게시 성공. 공개 320/393px와 PC 1280px에서 그림 없는 메뉴·최대 280px 중앙 창·세로 배열/44px 버튼·선택/복귀·배경 입력 차단·실제 구매/판매/수리·저장 실패 복원·빈 메뉴·기존 아이콘 검증 통과. PWA 설치 오류 없음/새 캐시/오프라인 음악 Range 206·100 bytes/강제 재로딩 없음 확인. 저장 버전 2 유지. 결과 `output/deploy-compact-market-qa/`. 아래는 이전 공개/개발 기록이다.


## 2026-10-16 상점·아이콘·도끼·캐릭터 통합 공개 배포

2026-10-16 공개 배포 완료. 게임 변경 [f59a173](https://github.com/sidebatch/pixel-life/commit/f59a173c702b9d5b4c80a0b9b28ede82cc0808f5), PWA `c18c13b2dd38`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38852791316). HTML 21,372,786 bytes/공개 8파일 38,839,948 bytes가 로컬과 SHA-256까지 일치한다.

NPC별 서비스 선택과 구매/판매/수리/업그레이드 분리·빈 메뉴 숨김·취소→전부, 지역 22곳 고유 아이콘·생활 7종 그림, 하위 도끼 단계별 위력 40/25/15/10%, PC 숫자키/숫자패드 1~5, 하루와 전체 NPC의 공통 발 등록·규격 검사를 함께 배포했다. [상점·아이콘](MARKET_SERVICES_ICONS_V1.md) · [도끼 대체 벌목](FORESTRY_LOWER_AXE_V1.md) · [캐릭터 규격/하루 원인](NPC_STANDARD_AUDIT_V1.md)

서버 전체 검사 52 scripts/144 UI IDs/481 assets/74 fish와 게시 성공. 공개 모바일 320/393px·PC 1280px 서비스 선택/실제 거래·수리/빈 메뉴/저장 실패 복원·효과음·아이콘, 10 NPC 시트/120프레임/15배치·남녀 864조합·PC 키보드, 하위 도끼 해금/파손·대체 벌목/재접속/50수종 검증 통과. PWA 설치 오류 없음·새 캐시·오프라인 재실행/음악 Range 206·100 bytes·강제 재로딩 없음 확인. 기존 저장 버전 2를 유지한다. 결과 `output/deploy-market-services-qa/`. 아래는 이전 공개/개발 기록이다.


## 2026-10-15 획득 표시·귀환·내구도·낚싯대·번개 공개 배포

2026-10-15 공개 배포 완료. 게임 변경 [97e11ef](https://github.com/sidebatch/pixel-life/commit/97e11efeb54c3a282ec90ecf02e6a181f65374d8), PWA `6ea80bf54583`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38844744065). HTML 20,555,321 bytes/공개 8파일 38,022,483 bytes가 로컬과 SHA-256까지 일치한다.

벌목 50종 획득 수량(0개 포함)·발견/레벨업 뒤 알림, 귀환석 중앙 광장 도착, 장비/상세/하단 내구도 바, 낚싯대 10종 두께, 다양한 폭풍 번개를 반영했다. [내용·검증](GAMEPLAY_FEEDBACK_V1.md).

공개 393/320px 실제 발견·레벨업/50종·0~3개 지급/중앙 귀환·실패 복원/내구도·파손·수리/24종 번개·동작 줄이기, 낚싯대 남녀/사방향/480개 손·끝점/길이 변환, PWA 설치 조건·새 캐시·오프라인/음악 Range 206·100 bytes·강제 재로딩 없음 검증 통과. 기존 저장 버전 2를 유지한다. 결과 `output/deploy-feedback-qa/`. 아래는 직전 배포/개발 이력이다.

## 2026-10-15 생활 UI·농장 소품·항해·효과음·폭포 통합 공개 배포

2026-10-15 공개 배포 완료. 게임 변경 커밋 [e5c886a](https://github.com/sidebatch/pixel-life/commit/e5c886a627e0c1f983d2be71608ba0c32ed3817a), PWA `564c82ae77ff`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38828050113). HTML 20,549,977 bytes/공개 8파일 38,017,139 bytes가 로컬과 SHA-256까지 일치한다.

- [하단 도구 바](TOOL_HOTBAR_V1.md): 도끼/낚싯대/낫/검/빈손 즉시 교체, 숫자키 1~5, 선택 장비 기억·동작/파손 제한.
- [가방 농장 탭](FARM_INVENTORY_V1.md): 교환권·기존 교환 소품 그림/위치/상태, 농장에서 직접 설치/회수.
- 씨앗 심기는 보유한 종류만 표시하고 마지막 씨앗 소진/빈 목록을 처리한다. 독립 숲 7곳의 번호를 제거하고 오래된 숲 1-1~1-5는 유지한다.
- [항해 배경](VOYAGE_SCENERY_V2.md): 섬·바위·부표 간격 확보, 부표는 얕은 바다 전용의 알아보기 쉬운 형태/1~2개.
- [승선권](VOYAGE_FARES_V1.md): 얕은 2,000/중간 3,500/심해 5,000/빙하 8,000코인. 조기 귀항/미환불·10분 운항은 기존대로다.
- [구매·수리 효과음/폭포](MARKET_WATERFALL_V1.md): 장비 구매/수리와 일반 구매 코인 소리, 저장 성공 1회/실패 무음. 폭포 물줄기·물보라는 움직이고 바위는 고정한다.

전체 52 scripts/142 UI IDs/452 assets/74 fish 및 Pages build/deploy 통과. 공개 393/320px(도구 바는 430px 포함) 실제 교체/설치·8종/저장 복원, 씨앗 목록/숲 이름, 네 항로 결제/운항·배경 간격/부표, 다섯 효과음 파형/실패 무음·폭포/동작 줄이기 검증 통과. PWA 설치 조건·새 캐시/오프라인 재실행·음악 Range 206/100 bytes·강제 재로딩 없음 확인.

결과 `output/deploy-play-update-qa/`. 개발 중 로컬 단계 기록은 아래에 보존한다.

현재 배포 계약 정리: 2026-10-15.

## 2026-10-15 숲·하루 상점·수확 피드백 공개 배포 완료

- 게임 변경 커밋 [3a6d6fa](https://github.com/sidebatch/pixel-life/commit/3a6d6fa9f5d3f4bd2e6cc9087fea1cc5e443de6b), PWA `d3df644ac5ba`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38812945983).
- 전체 검사 51 scripts/141 UI IDs/452 assets/74 fish 및 Pages build/deploy 성공. HTML 20,535,809 bytes, 공개 8파일/38,002,971 bytes와 SHA-256 일치.
- 공개 393/320px 각각 숲 12곳의 광장 미출력/기존 자원 보존, 마을 상점/NPC·모든 문/농장 출구 접근·기존 농장 상점 제거, 작물 14종 이미지/빈 밭 제거, 실제 낫 수확음 1회·실패 복원/무음·실제 합성 파형 통과.
- 기존 저장/진행 주문/교환권·판매 취소·8종 꾸미기 교환/설치/회수/재접속·통로와 공개 PWA 설치 조건/캐시/오프라인 음악 Range 206·100 bytes·강제 재로딩 없음 통과.
- 기준 [FARM_WORLD_POLISH_V2.md](FARM_WORLD_POLISH_V2.md), 결과 output/deploy-farm-world-v2-qa/. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-14 농사 상점·판매 UI·도감 공개 배포 완료

- 게임 변경 커밋 [f16ebde](https://github.com/sidebatch/pixel-life/commit/f16ebdee291f6b5ffb0e5a4abf71e6fc44fed102), PWA `a5ea86ec2184`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38620542611).
- 전체 검사/빌드/Pages 성공: 51 scripts/141 UI IDs/452 assets/74 fish. HTML 20,476,579 bytes, 공개 8파일/37,943,741 bytes와 SHA-256 일치.
- 공개 393/320px 하루/NPC·농가 문/씨앗 14종·상점 분리/잘못된 상점 거래 거부·판매 전부/취소/부분 판매·가격/그림·큰 도감/미발견 보호·기존 저장/진행 주문 유지 통과.
- 공개 14종 실제 구매/심기/수확/판매·실패 복원, 주문 납품/보상/소품 8종 교환/설치/회수/재접속·통로/밭/출구·원격 꾸미기 이력 통과.
- 공개 PWA 설치 오류 없음·새 캐시/7항목·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 통과.
- 기준 [SHOP_DEX_POLISH_V1.md](SHOP_DEX_POLISH_V1.md), 결과 output/deploy-shop-dex-qa/. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-14 농장 소품 8종·상황별 장비 버튼 공개 배포 완료

사용자 ‘배포해주세요. 그리고 문서도 정리’ 요청으로 새 소품 5종과 최종 원형 조작부/실제 장비 그림을 함께 배포했다. 각진 나무 시안과 선으로 그린 낫/도끼/낚싯대·버튼 안 ‘행동’ 글자는 현행에 포함하지 않는다.

- 게임 변경 커밋 [2e3e911](https://github.com/sidebatch/pixel-life/commit/2e3e911be1e3b4e6a552fb5b35afe48430c2a1c6), PWA `8c63f7ac8b6f`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38522575702).
- Actions #38522575702 build/deploy success. 전체 검사 51 scripts/141 UI ids/450 assets/74 fish와 기존 캐릭터/검·낫/생활/저장 통과.
- HTML 20,385,982 bytes. 공개 8파일/37,853,144 bytes가 로컬과 SHA-256 일치한다.
- 공개 393/320px: 실제 납품→50장 이상 교환권→8종 교환/설치·전체 회수·재설치/재접속, 기존 저장·실패 복원, 모든 통로/밭·출구, 스크롤/이력 통과.
- 공개 393/320/430px: 기존 이동/정지·버튼 영역/원형/글자 없음·문맥 안내, 실제 수확/낚시 시작·입질·취소/대화·메뉴 터치와 낫/검·도끼/낚싯대 20종의 정확한 캐릭터 그림 일치 통과.
- 공개 PWA: 설치 조건 오류 없음·새 캐시 7항목, 오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.
- README/문서 안내/인수인계의 현재 상태·기준 링크를 정리했다. 누적된 이전 인수인계 앞부분은 HANDOFF_RELEASE_HISTORY_2026_10_14.md에 인용으로 보존한다. 소품 표는 현재 8종이다.

결과: output/deploy-controls-decorations-qa/{deployment.json,public-files.json,public-orders/report.json,public-controls/report.json,pwa-public.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-13 농장 주문·교환권·꾸미기 공개 배포 완료

사용자 ‘배포해주세요’ 요청으로 엘리 상점의 랜덤 주문 1개/재접속 유지·납품 후 다음 주문, 판매가보다 높은 코인/농장 교환권, 농사 레벨/보유 부지에 따른 1·2·3종 주문, 허수아비·표지판·꽃 울타리의 교환/지정 설치/회수·저장을 공개 배포했다.

- 게임 변경 커밋: [f1a37af](https://github.com/sidebatch/pixel-life/commit/f1a37aff4754cff12cf28b06785258efc3d658b8)
- 성공 배포: [Deploy GitHub Pages #38444649859](https://github.com/sidebatch/pixel-life/actions/runs/38444649859), build/deploy success.
- 빌드 HTML 20,290,574 bytes, 공개 전체 8파일/37,757,736 bytes 로컬·공개 SHA-256 일치, 캐시 pixel-life-61b8656eecda.
- 전체 검사 51 scripts/141 UI ids/445 assets/74 fish와 3,500개 주문 단계/경제/저장 사례·납품 20회·실패 복원 통과.
- 공개 393/320px 실제 단일 주문/납품·정확한 보상/단계 전환, 3종 교환·설치/회수/재설치, 모든 통로/밭 접근/출구, 기존 저장/재접속/뒤로가기·버튼 크기 검사 통과.
- 공개 농사 성장 회귀: 실제 수확 XP, Lv.2/6/100/숙련도·진행률, 구매/판매 무XP·기본 설명 제거/보상 설명 유지·실패 복원·저장 통과.
- 공개 PWA: 설치 조건 오류 없음·새 캐시·오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.

규칙은 [FARM_ORDERS_V1.md](FARM_ORDERS_V1.md), 결과는 output/deploy-farm-orders-v1-qa/{deployment.json,public-files.json,public-orders/report.json,public-growth/report.json,pwa-public.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 2026-10-13 작물 확장·농사 레벨 공개 배포 완료

사용자 요청으로 비트 이름(기존 turnip ID/저장 유지), 상추·오이·가지·고추를 더한 작물 14종, 씨앗값/판매가 균형, 독립 농사 Lv.1–100/숙련도·수확 XP/진행률과 레벨업 기본 ‘실력이 늘었어요!’ 문구 제거를 공개 배포 완료했다. 성장 안내의 ‘게임을 꺼도 자라요’ 문구도 제거했다.

- 게임 변경 커밋: [1c01b22](https://github.com/sidebatch/pixel-life/commit/1c01b22a60a9a652d00c27df3834eb6bd50f2c51)
- 성공 배포: [Deploy GitHub Pages #38358916193](https://github.com/sidebatch/pixel-life/actions/runs/38358916193), build/deploy success.
- 빌드 HTML: 20,235,673 bytes. 공개 전체 8파일/37,702,835 bytes가 로컬과 SHA-256 일치, 캐시 pixel-life-0ffa41864680.
- 전체 검사: 49 scripts/140 UI ids/442 assets/74 fish, 고정 캐릭터·검/도구 계약·기존 낚시/벌목/저장 통과.
- 경제 280,000회/성장 112가지 시뮬레이션과 로컬 393/320px 실제 재배/거래/진행 검사 통과.
- 공개 393/320px: 이전 저장의 농사 Lv.1/0 XP·비트 이름/수량/심은 시간 보존, 실제 수확 +XP, Lv.2/6/100/숙련도 1, 밭/상점 카드, 심기/구매/판매 무XP, 실패 복원/저장/재접속을 확인했다.
- 공통 농사/낚시/벌목 기본 레벨업 설명 문단이 없으며 실제 보상 문구가 있을 때는 유지한다. 자동으로 닫히는 5초 알림도 유지했다. 브라우저 QA는 느린 캡처 중 자동으로 닫힌 알림을 다시 클릭하지 않도록 보완했다.
- 공개 14종 실제 씨앗 구매→심기→낫 수확→판매 28회로 최소/최대 수확 지출/판매액·순이익을 검증했다. 구매/판매 저장 실패와 새 작물 저장 재접속도 통과했다.
- 공개 밭 상시 충돌/통로/부지 구매/낫/이전 위치 복원과 화면별 기존 외형/동작 720조합 통과.
- 공개 PWA: 설치 조건 오류 없음, 새 캐시/7항목, 오프라인 재실행/음악 Range 206·100 bytes, 강제 재로딩 없음.

기준은 [FARMING_CROPS_BALANCE_V1.md](FARMING_CROPS_BALANCE_V1.md)와 [FARMING_PROGRESSION_V1.md](FARMING_PROGRESSION_V1.md)다. 결과는 output/deploy-farming-v1-qa/{deployment.json,public-files.json,pwa-public.json,public-progression/report.json,public-economy/report.json,public-layout/report.json}. 설치 앱은 완전히 종료 후 다시 열고 저장을 삭제하지 않는다.

## 저장소

- 공개 소스·배포: https://github.com/sidebatch/pixel-life
- 서비스 URL: https://sidebatch.github.io/pixel-life/

소스·원본 에셋·개발 문서는 하나의 공개 저장소에서 관리하고, 빌드한 `dist/`는 Git에 커밋하지 않는다. GitHub Actions가 dist 전체를 Pages artifact로 만들어 배포한다. 로컬 QA `output/`도 전체 Git 제외이며 보존/정리는 `QA_RETENTION.md`를 따른다.

2026-09-26부터 긴 지역 배경음악만 스트리밍 파일로 분리한다. 2026-09-30부터 배포물은 설치형 PWA이며 `dist/index.html`, `dist/manifest.webmanifest`, `dist/service-worker.js`, `dist/assets/pwa/`와 `dist/assets/audio/music/{meadow,woodland,lakeside}.mp3`를 포함한다. 기존 이미지·코드·CSS·짧은 효과음 8개는 계속 HTML에 포함한다. Actions는 dist 전체를 업로드하므로 설정 변경은 필요 없지만, 수동 복사/오프라인 테스트에서는 HTML만 옮기지 말고 dist 폴더 전체를 보존해야 한다. 음악은 첫 터치/키 입력 후 재생되며 메뉴에서 음악 켜기/끄기를 선택할 수 있다.

빌드는 HTML·매니페스트·아이콘·음악 내용에서 캐시 버전을 자동 생성해 서비스 워커에 넣는다. 새 배포를 받은 서비스 워커는 이전 `pixel-life-*` 캐시를 뒤에서 교체하지만 실행 중인 게임을 강제로 새로고침하지 않는다. 따라서 시작 로딩 화면은 한 번만 표시되고, 새 오프라인 캐시는 다음 실행에도 유지된다. 전체 음악을 최초 설치 캐시에 포함하므로 첫 접속에는 네트워크 사용량이 늘지만, 완료 후에는 오프라인에서도 세 지역 음악과 게임을 실행할 수 있다. 앱 아이콘을 다시 만들 때는 `npm run icons:pwa`를 사용한다.

## 2026-10-13 농사 안내 문구·심기 창 공개 배포 완료

사용자 요청으로 밭 번호 숨김·작물의 한국어 조사 수정·심기 성공 후 창 닫기를 공개 배포 완료했다. 393/320px 실제 버튼/뒤로가기 이력/성장·수확 문구/실패 복원 검사와 빌드를 통과했다. 빌드는 20,006,295 bytes/PWA `30d79ba57428`다. Actions build/deploy와 공개 검증 모두 통과했다.

- 게임 변경 커밋: [`c3d333a`](https://github.com/sidebatch/pixel-life/commit/c3d333aad945c52e62f647dbcc12c7502e8ecb76)
- 성공한 배포: [Deploy GitHub Pages](https://github.com/sidebatch/pixel-life/actions/runs/38353183885)
- 공개 8파일/37,473,457 bytes가 로컬과 SHA-256까지 일치, 캐시 `pixel-life-30d79ba57428`.
- 공개 393/320px: 실제 씨앗 버튼/성공 후 창 닫기·이동 잠금 해제/뒤로가기 이력 복귀, 숫자 없는 제목, 작물 10종의 성장·수확 20개 문구, 저장 실패 시 선택창/씨앗/밭 보존을 확인했다.
- 기존 수확/낫/밭 상시 충돌/부지·작물·성장시간·재접속/720 외형 조합과 PWA 설치 조건·새 캐시·오프라인 재실행/음악 Range·강제 재로딩 없음 검사도 통과했다.

결과: `output/deploy-farm-ui-qa/{deployment.json,public-files.json,farming-browser/report.json,pwa-public.json}`. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다. 규칙은 [FARM_UI_POLISH_V1.md](FARM_UI_POLISH_V1.md)를 따른다.

## 2026-10-13 기본 낫 그림 v2 공개 배포 완료

사용자 요청으로 짧은 나무손잡이/길고 뾰족하게 휘어진 날의 새 기본 낫을 공개 배포 완료했다. 남녀 캐릭터의 공통 오른손·몸·모션과 장착 키/저장 ID는 유지하며 새 그림의 손잡이 축/표시 크기만 맞췄다. 상세는 [SICKLE_ART_V2.md](SICKLE_ART_V2.md)를 따른다.

로컬 실제 PNG/캐릭터·검 보호/393·320px 장착·수확·저장 검사와 남녀·4방향 24프레임 비교를 통과했다. 빌드는 20,006,014 bytes/PWA `0062d37f3da2`다. Actions build/deploy와 공개 검증 모두 통과했다.

- 게임 변경 커밋: [`6d15ab0`](https://github.com/sidebatch/pixel-life/commit/6d15ab0822dea2bb8b3e95960694c775251c0d48)
- 성공한 배포: [Deploy GitHub Pages](https://github.com/sidebatch/pixel-life/actions/runs/38350941915)
- 공개 전체 8파일/37,473,176 bytes가 로컬과 SHA-256 일치, 캐시 `pixel-life-0062d37f3da2`.
- 공개의 실제 낫 PNG가 승인된 v2 그림과 byte 단위로 일치하며, 남녀·4방향·휴대/준비/수확 24프레임 렌더링을 확인했다.
- 공개 393/320px 농장의 장착/타격 시 수확/밭 상시 충돌/부지 구매/씨앗 소비/기존 소유·작물·시간/재접속 보존 검사와 외형·동작 720조합 검사 통과.
- 공개 PWA: 설치 조건 오류 없음, 새 캐시/강제 재로딩 없음, 오프라인 재실행/음악 Range 206·100 bytes 통과.

결과: `output/deploy-sickle-v2-qa/{deployment.json,public-files.json,art/report.json,farming-browser/report.json,pwa-public.json}`. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다.

## 2026-10-13 농장 정비 v1 공개 배포 완료

사용자 요청으로 지정 부지/통로/픽셀 흙 그림/기본 낫 수확/씨앗 설명 정비를 공개 배포 완료했다. 밭은 구매 전·빈 밭·성장 중·성숙·수확 후 모두 이동을 막는다. 통로에서만 심고 수확하며 기존 소유·작물·성장시간은 보존한다. 상세는 [FARMING_LAYOUT_V1.md](FARMING_LAYOUT_V1.md)를 따른다.

로컬 전체 검사(49 scripts/139 UI ids/426 assets/74 fish), 393/320px 실제 농장 동작·저장 검사와 배포용 빌드 검사는 통과했다. 빌드는 20,001,257 bytes/PWA `568667fe105c`다. Actions build/deploy 모두 성공했고 다음 공개 검증도 통과했다.

- 게임 변경 커밋: [`12e5a7d`](https://github.com/sidebatch/pixel-life/commit/12e5a7d7af8b0dd30b2bad63477f3d87edcd7036)
- 성공한 배포: [Deploy GitHub Pages #38346705185](https://github.com/sidebatch/pixel-life/actions/runs/38346705185)
- 공개 dist 전체 8파일/37,468,419 bytes가 로컬과 SHA-256까지 일치, 캐시 `pixel-life-568667fe105c`.
- 공개 393/320px: 구매 전/빈 밭/성장 중/수확 후에도 이동 차단, 열린 통로/낫 장착·실제 수확, 부지 구매/씨앗 소비, 저장 실패 복원, 이전 밭 위 저장 위치의 안전 복구, 소유/작물/성장시간 보존과 재접속.
- 공개 PWA: 서비스 워커 제어/새 캐시/설치 조건·실행 중 강제 재로딩 없음·오프라인 재실행·음악 Range(206/100 bytes).

결과는 `output/deploy-farm-qa/{deployment.json,public-files.json,pwa-public.json,farming-browser/report.json}`에 보존한다. 설치 앱은 완전히 종료 후 다시 열며 저장을 삭제하지 않는다.

## 2026-10-12 성장 균형 v2 배포

사용자 요청으로 성장 균형 v2를 **공개 배포 완료**했다. 벌목 XP 7/8/9/10/11/12/15/16/17/18, 공통 Lv.80 이후 요구량/187,230 XP, 기존 레벨·바·숙련도 보존 이행이 적용됐다.

- 공개 게임: [https://sidebatch.github.io/pixel-life/](https://sidebatch.github.io/pixel-life/)
- 게임 변경 커밋: [`0891f6a`](https://github.com/sidebatch/pixel-life/commit/0891f6ae328e14746fc6bbe6339ca819ab9d46ae)
- 성공한 배포: [Deploy GitHub Pages #38293464202](https://github.com/sidebatch/pixel-life/actions/runs/38293464202) — build/deploy 모두 success
- 확인한 PWA 캐시: `pixel-life-6f6f3804bca1`
- 공개 dist 전체 8파일/37,462,525 bytes가 로컬과 SHA-256까지 일치한다.
- 공개 393/320px 브라우저에서 실제 +7/+18 XP, Lv.85/99 바와 Lv.100 숙련도 보존, 도구/아이템/코인 보존, 재접속 후 중복 이행 없음을 확인했다.
- 공개 PWA의 설치 조건·캐시·오프라인 실행·음악 Range(206/100 bytes)·업데이트 시 강제 재로딩 없음 검사를 통과했다.

세부 검증은 `output/deploy-growth-qa/{public-files.json,pwa-public.json,growth-browser/report.json}`과 `QA_REPORT.md`에 기록했다. 실제 Android 손 조작·설치 앱 업데이트 체감은 별도 수동 항목이다.

설치 앱은 완전히 종료 후 다시 열어 새 캐시를 사용한다. 성장 이행 때문에 저장을 삭제하거나 앱을 재설치할 필요는 없다.

## 배포 절차

1. 로컬에서 검사와 빌드를 실행한다.

   ```bash
   node scripts/check.mjs
   node scripts/build.mjs
   ```

2. 소스 변경을 `main`에 푸시한다.
3. GitHub Actions의 `Deploy GitHub Pages` 작업이 성공했는지 확인한다.
4. 공개 URL에서 최신 빌드가 표시되는지 확인한다.
5. 실제 Android 확인은 별도 수동 항목으로 기록한다. 게임 메뉴의 `홈 화면에 설치`와 설치 아이콘/비행기 모드 재실행을 확인할 수 있지만 사용자가 체감 확인은 나중에 하기로 했으므로 자동 검사 결과로 실측을 대체하지 않는다.

GitHub Pages는 공개 소스 저장소의 `main` 브랜치가 변경될 때 자동으로 검사·빌드·배포된다.

모바일 브라우저가 이전 파일을 캐시하면 확인 URL 끝에 현재 커밋을 쿼리로 붙인다.

```text
https://sidebatch.github.io/pixel-life/?v=<commit>
```

PWA 서비스 워커는 HTTPS 또는 `localhost`에서만 동작한다. 같은 Wi-Fi의 PC 주소를 `http://<PC-IP>`로 여는 개발 방식은 게임 확인에는 쓸 수 있지만 설치·오프라인 검증에는 사용할 수 없다.

빌드한 `dist`를 로컬 서버로 연 상태에서는 `node scripts/qa-pwa.mjs`로 Chrome/Edge 서비스 워커 등록, 매니페스트, 사전 캐시, 오프라인 새로고침과 음악 Range 응답을 검사할 수 있다.

다음 작업 세션은 `docs/HANDOFF.md`의 체크리스트와 현재 미완료 항목을 먼저 확인한다.

## 로컬 PWA 검사와 크기

일반 소스 서버의 `/dist/index.html`을 여는 것과 dist 루트를 서버로 여는 것은 경로/서비스 워커 범위가 다르다. PWA 검사는 다른 작업의 서버를 끄지 말고 사용 가능한 별도 포트에서 dist 전체를 루트로 제공한다. PowerShell 예시:

```powershell
# 저장소 루트에서; 포트가 사용 중이면 다른 포트를 선택
Set-Location dist
$env:PORT='4174'
node ../scripts/serve.mjs
```

별도 터미널의 저장소 루트에서 `$env:PIXEL_LIFE_QA_URL='http://127.0.0.1:4174/'`를 설정한 뒤 `node scripts/qa-pwa.mjs`를 실행한다. 검사 전용 브라우저를 사용하며 실제 사용자 게임 저장을 초기화하지 않는다. 임시 서버는 검사가 끝나면 해당 서버만 종료한다.

2026-10-12 측정 배포 크기는 약 35.73MiB(압축 전 파일 합계), HTML 약 19.07MiB다. 원화 source/QA/로컬 Git 기록/원본 WAV 전체가 사용자에게 전달되는 것은 아니다. 수치와 측정 범위는 [PROJECT_STORAGE.md](PROJECT_STORAGE.md)를 따른다.
