# 지역 배경음악 (2026-09-26)

사용자가 로컬 작업 폴더에 제공한 세 WAV를 변환한 파일이다. 원본(각 63,504,044바이트)은 프로젝트 상위 폴더에 그대로 보존했고, 큰 WAV는 저장소에 추가하지 않았다.

| 게임용 파일 | 제공 원본 | 재생 지역 |
| --- | --- | --- |
| meadow.mp3 | Meadow-Reverie-mixdown-00-00_06-00-1x.wav | 라일락 연못 마을 |
| woodland.mp3 | Woodland-Wander-mixdown-00-00_06-00-1x.wav | 오래된 숲 1-1·1-2 |
| lakeside.mp3 | Lakeside-Reverie-mixdown-00-00_06-00-1x.wav | 햇살 농장 |

각 곡은 360초, 44.1kHz 스테레오 MP3 128kbps(약5.76MB)다. FFmpeg loudnorm I=-18/TP=-2/LRA=11로 음량을 맞추고 재생 음량은 0.3으로 효과음보다 낮게 두었다. 시작/끝을 임의로 자르지 않았으며 HTMLAudioElement의 loop로 반복한다. 무한 반복과 음악적으로 무음 없는 완벽한 연결은 다른 개념이며, 곡 자체의 시작/끝 구성은 원본을 따른다.

재현: FFmpeg를 설치한 후 `PIXEL_LIFE_FFMPEG`에 실행 파일 경로를 지정하고 `node scripts/prepare-region-music.mjs <WAV가 있는 폴더>`를 실행한다. 기존 결과 파일을 덮어쓰지 않는 `-n` 옵션을 사용한다. 변경 버전 제작 시 기존 파일을 먼저 보존할 것.

배포 시 MP3 세 개는 dist/assets/audio/music/로 복사한다. 긴 곡을 HTML에 base64로 넣거나 Web Audio PCM 버퍼로 미리 풀지 않는다. 첫 터치/키 입력부터 현재 지역 한 곡만 재생하며, 숲 1-1/1-2 전환은 같은 재생 위치를 유지한다. 메뉴의 음악 끄기/켜기 설정은 게임 진행도와 별도 저장한다.
