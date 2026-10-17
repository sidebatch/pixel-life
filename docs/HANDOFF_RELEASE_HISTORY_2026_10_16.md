# 2026-10-16까지 누적된 공개 배포 이력

2026-10-17 문서 정리 때 이전 HANDOFF의 배포 머리말을 원문으로 보존했다. 아래 각 날짜/수치/검증은 당시 기록이며 현재 작업은 [HANDOFF.md](HANDOFF.md)를 따른다.

2026-10-16 폭풍·벼락 QA 보완 공개 배포 완료. 게임 변경 [bbdd431](https://github.com/sidebatch/pixel-life/commit/bbdd431b8c9c6eaa1dd0754713a1ddea86771adc), PWA `916b840676ed`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38942120347). HTML 21,383,117 bytes/공개 8파일 38,850,279 bytes가 로컬과 SHA-256까지 일치한다.

낮은 FPS에서 달력·날씨 전환까지 느려지던 문제를 수정했다. 연속 플레이 중 폭풍이 아닌 구간이 3번 연속이면 다음 구간은 폭풍으로 정해 최대 약 30분의 대기를 보장한다. 벼락은 약한 밝은 색조와 선 주변 빛으로 작은 화면에서 알아보기 쉽게 했다. 기존 모양 변화·간격과 동작 줄이기 설정은 유지한다. 폭풍의 최종 비중은 늘지만 어종 조건·가격·보상·장비 및 저장 버전 2는 유지한다. [원인·기준·검증](WEATHER_QA_V1.md).

수치 QA 1만 게임 날짜·5~60FPS 실제 프레임 루프·비활성/복귀/BFCache, 전체 검사 53 scripts/150 UI ids/481 assets/74 fish와 서버 빌드·게시 통과. 공개 320/393px 모바일·PC 1280px의 자동 폭풍·실행 중인 벼락·6개 모양·22지역·동작 줄이기·자동/수동 전환·저장/시각 효과 난수 불변을 검증했다. PWA 설치 오류 없음·새 캐시·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 확인. 결과 `output/deploy-weather-qa/`. 아래는 이전 공개/개발 기록이다.


2026-10-16 성장 현황 창·상단 작은 레벨 바 공개 배포 완료. 게임 변경 [8ca3d2c](https://github.com/sidebatch/pixel-life/commit/8ca3d2ce9b5bdb647e6843bd2f98ba31fc44b156), PWA `a77615df2249`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38939472908). HTML 21,382,180 bytes/공개 8파일 38,849,342 bytes가 로컬과 SHA-256까지 일치한다.

지역 이름 아래 작은 반투명 바에서 낚시·벌목·농사 아이콘과 현재 레벨을 확인하고, 누르면 상세 성장 현황을 연다. 여행 메뉴에서도 진입할 수 있다. 상세 창은 현재 경험치·진행률·다음 레벨까지 남은 XP·누적 XP와 Lv.100 숙련도를 표시한다. 닫힌 상태에서도 작은 바가 갱신되며 항해 시간과 알림은 겹치지 않는다. [기준·검증](GROWTH_STATUS_V1.md).

전체 검사 53 scripts/150 UI ids/481 assets/74 fish와 서버 빌드·게시 성공. 공개 320/393px 모바일·PC 1280px에서 작은 바/상세 창·실시간 레벨/XP·키보드/배경/뒤로·앞으로/재접속·저장 호출 없음/기존 데이터 유지·가방/도감 진입을 확인했다. PWA 설치 오류 없음·새 캐시·오프라인 음악 Range 206/100 bytes·강제 재로딩 없음 검증 통과. 저장 버전 2 유지. 결과 `output/deploy-growth-status-qa/`. 아래는 이전 공개/개발 기록이다.


2026-10-16 작은 상점 선택창 공개 배포 완료. 게임 변경 [69a5442](https://github.com/sidebatch/pixel-life/commit/69a5442fca2db80e1898b145710b69635b6f16b0), PWA `8a4de087e791`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38854194121). HTML 21,372,082 bytes/공개 8파일 38,839,244 bytes가 로컬과 SHA-256까지 일치한다.

모든 NPC 상점 첫 창은 중앙의 작은 창에 구매·판매·업그레이드·수리·주문·꾸미기 등 이름만 세로로 표시한다. 첫 창의 그림·부가 설명·지갑·거래 푸터를 제거하고, 선택하면 기존 품목 그림과 상세 거래 화면을 연다. 서비스 선택으로 돌아오면 작은 창으로 접힌다. 창 뒤쪽 조작 버튼 입력은 차단하며 비어 있는 메뉴 숨김·거래·저장·생활/지역 아이콘은 유지한다. [기준·검증](MARKET_SERVICES_ICONS_V1.md).

서버 전체 검사/빌드/게시 성공. 공개 320/393px와 PC 1280px에서 그림 없는 메뉴·최대 280px 중앙 창·세로 배열/44px 버튼·선택/복귀·배경 입력 차단·실제 구매/판매/수리·저장 실패 복원·빈 메뉴·기존 아이콘 검증 통과. PWA 설치 오류 없음/새 캐시/오프라인 음악 Range 206·100 bytes/강제 재로딩 없음 확인. 저장 버전 2 유지. 결과 `output/deploy-compact-market-qa/`. 아래는 이전 공개/개발 기록이다.


2026-10-16 공개 배포 완료. 게임 변경 [f59a173](https://github.com/sidebatch/pixel-life/commit/f59a173c702b9d5b4c80a0b9b28ede82cc0808f5), PWA `c18c13b2dd38`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38852791316). HTML 21,372,786 bytes/공개 8파일 38,839,948 bytes가 로컬과 SHA-256까지 일치한다.

NPC별 서비스 선택과 구매/판매/수리/업그레이드 분리·빈 메뉴 숨김·취소→전부, 지역 22곳 고유 아이콘·생활 7종 그림, 하위 도끼 단계별 위력 40/25/15/10%, PC 숫자키/숫자패드 1~5, 하루와 전체 NPC의 공통 발 등록·규격 검사를 함께 배포했다. [상점·아이콘](MARKET_SERVICES_ICONS_V1.md) · [도끼 대체 벌목](FORESTRY_LOWER_AXE_V1.md) · [캐릭터 규격/하루 원인](NPC_STANDARD_AUDIT_V1.md)

서버 전체 검사 52 scripts/144 UI IDs/481 assets/74 fish와 게시 성공. 공개 모바일 320/393px·PC 1280px 서비스 선택/실제 거래·수리/빈 메뉴/저장 실패 복원·효과음·아이콘, 10 NPC 시트/120프레임/15배치·남녀 864조합·PC 키보드, 하위 도끼 해금/파손·대체 벌목/재접속/50수종 검증 통과. PWA 설치 오류 없음·새 캐시·오프라인 재실행/음악 Range 206·100 bytes·강제 재로딩 없음 확인. 기존 저장 버전 2를 유지한다. 결과 `output/deploy-market-services-qa/`. 아래는 이전 공개/개발 기록이다.

2026-10-15 공개 배포 완료. 게임 변경 [97e11ef](https://github.com/sidebatch/pixel-life/commit/97e11efeb54c3a282ec90ecf02e6a181f65374d8), PWA `6ea80bf54583`, [배포 성공](https://github.com/sidebatch/pixel-life/actions/runs/38844744065). HTML 20,555,321 bytes/공개 8파일 38,022,483 bytes가 로컬과 SHA-256까지 일치한다.

벌목 50종 획득 수량(0개 포함)·발견/레벨업 뒤 알림, 귀환석 중앙 광장 도착, 장비/상세/하단 내구도 바, 낚싯대 10종 두께, 다양한 폭풍 번개를 반영했다. [내용·검증](GAMEPLAY_FEEDBACK_V1.md).

공개 393/320px 실제 발견·레벨업/50종·0~3개 지급/중앙 귀환·실패 복원/내구도·파손·수리/24종 번개·동작 줄이기, 낚싯대 남녀/사방향/480개 손·끝점/길이 변환, PWA 설치 조건·새 캐시·오프라인/음악 Range 206·100 bytes·강제 재로딩 없음 검증 통과. 기존 저장 버전 2를 유지한다. 결과 `output/deploy-feedback-qa/`. 아래는 직전 배포/개발 이력이다.

2026-10-15 공개 배포 완료. 게임 변경 커밋 [e5c886a](https://github.com/sidebatch/pixel-life/commit/e5c886a627e0c1f983d2be71608ba0c32ed3817a), PWA `564c82ae77ff`, [성공 배포](https://github.com/sidebatch/pixel-life/actions/runs/38828050113). HTML 20,549,977 bytes/공개 8파일 38,017,139 bytes가 로컬과 SHA-256까지 일치한다.

- [하단 도구 바](TOOL_HOTBAR_V1.md): 도끼/낚싯대/낫/검/빈손 즉시 교체, 숫자키 1~5, 선택 장비 기억·동작/파손 제한.
- [가방 농장 탭](FARM_INVENTORY_V1.md): 교환권·기존 교환 소품 그림/위치/상태, 농장에서 직접 설치/회수.
- 씨앗 심기는 보유한 종류만 표시하고 마지막 씨앗 소진/빈 목록을 처리한다. 독립 숲 7곳의 번호를 제거하고 오래된 숲 1-1~1-5는 유지한다.
- [항해 배경](VOYAGE_SCENERY_V2.md): 섬·바위·부표 간격 확보, 부표는 얕은 바다 전용의 알아보기 쉬운 형태/1~2개.
- [승선권](VOYAGE_FARES_V1.md): 얕은 2,000/중간 3,500/심해 5,000/빙하 8,000코인. 조기 귀항/미환불·10분 운항은 기존대로다.
- [구매·수리 효과음/폭포](MARKET_WATERFALL_V1.md): 장비 구매/수리와 일반 구매 코인 소리, 저장 성공 1회/실패 무음. 폭포 물줄기·물보라는 움직이고 바위는 고정한다.

전체 52 scripts/142 UI IDs/452 assets/74 fish 및 Pages build/deploy 통과. 공개 393/320px(도구 바는 430px 포함) 실제 교체/설치·8종/저장 복원, 씨앗 목록/숲 이름, 네 항로 결제/운항·배경 간격/부표, 다섯 효과음 파형/실패 무음·폭포/동작 줄이기 검증 통과. PWA 설치 조건·새 캐시/오프라인 재실행·음악 Range 206/100 bytes·강제 재로딩 없음 확인.

결과: `output/deploy-play-update-qa/`. 이전 개발 단계/배포 수치는 [10월 15일 이력](HANDOFF_RELEASE_HISTORY_2026_10_15.md)에 보존했다. 기존 저장 버전 2/승선권·장비·농장/주문·교환품을 유지하며 저장 초기화가 필요 없다.
