# 음향 자산 기록

이 문서는 런타임에서 사용하는 외부 음원 파일의 경로·용도·출처와 코드에서 생성하는 합성음을 구분한다. 정확한 재생 구조는 `src/fishing-effects.js`, 지역 BGM은 `assets/audio/music/README.md`를 함께 확인한다.

## 짧은 MP3 효과음

| 경로 | 용도 | 출처 |
| --- | --- | --- |
| `assets/fishing/audio/cast.mp3` | 낚시 투척 | 사용자 제공 음원 |
| `assets/fishing/audio/bite.mp3` | 낚시 입질 | 사용자 제공 음원 |
| `assets/fishing/audio/catch.mp3` | 낚시 획득 | 사용자 제공 음원 |
| `assets/audio/level-up.mp3` | 생활 스킬 레벨업 | 사용자 제공 음원 |
| `assets/audio/market-sale.mp3` | 상점 판매 성공 | 사용자 제공 음원 |
| `assets/audio/equip-weapon.mp3` | 도끼·검 장착 | Kenney 음향 자산, CC0 1.0 |
| `assets/audio/equip-clothes.mp3` | 옷·가방 장착 | Kenney 음향 자산, CC0 1.0 |
| `assets/fishing/audio/equip-rod.mp3` | 낚싯대 장착 | Kenney 음향 자산, CC0 1.0 |

장착음 세 파일은 2026-10-06 다른 음향 작업 세션에서 선택해 반입했으며 커밋 `b287700`에서 처음 추가됐다. 원본 Kenney 묶음명과 원본 파일명은 현재 저장소 기록에 남아 있지 않다. 출처 메타데이터를 확인하면 이 문서에 묶음명과 원본 주소를 보완한다. 라이선스는 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)이다.

## 코드 합성 효과음

다음 소리는 외부 음원 파일 없이 Web Audio로 생성한다.

- 벌목 타격과 나무 쓰러짐
- 유료 도끼 파손
- 나무 도감 최초 발견
- 희귀·영웅·전설 낚시 결과

벌목 타격 MP3는 `b287700`에서 잠시 적용했지만 `c1a4631`에서 되돌렸다. 따라서 현재 벌목 타격·쓰러짐은 기존 합성음이 기준이다.

## 빌드 방식

짧은 MP3 여덟 개는 로딩 중 Web Audio 버퍼로 미리 디코딩하고 단일 `dist/index.html`에 포함한다. Web Audio 버퍼를 사용할 수 없는 환경에서는 HTML 오디오로 재생한다. 긴 지역 BGM 세 곡은 초기 용량을 줄이기 위해 `dist/assets/audio/music/`의 외부 파일로 복사하고 스트리밍한다.
