# 리아 머리·목 연결 재보정 v3

2026-09-28. 사용자 실제 게임 사진 `dfsfadf.JPG`에서 앞얼굴 아래 피부색 목이 길게 노출되어 머리가 몸에서 떠 보이는 문제를 재확인했다. v2의 앞목 21픽셀 겹침 검사는 통과했지만 실제 합성의 미술 문제는 잡지 못했다.

- `turnaround-reference.png`는 built-in `image_gen` 편집 모드의 **시각 참고본**이다. 입력 1은 사용자 게임 캡처, 입력 2는 v2의 4방향 생성 원화. 프롬프트는 기존 리아의 얼굴·갈색 헤어·파란 옷·네 방향을 유지하면서 턱이 옷깃에 자연스럽게 닿고 긴 노출 목이 보이지 않도록 요청했다. 생성 참고본의 몸·옷·규격은 최종 게임 시트에 복사하지 않았다.
- 최종 게임 그림은 `scripts/pack-ria-head-v3.mjs`로 재현한다. 검증된 v2 원화에서 Head/Hair를 같은 96셀 스케일로 분리하되, **두 레이어를 함께 4 원본 픽셀 아래로 등록**해 고정 옷깃 (48,54)에 턱을 앉힌다. v2에서 옛 얼굴의 피부 픽셀로 덧댄 목 기둥은 복사하지 않는다.
- 결과는 `assets/player/npc-ria-v3/{walk,chop,fish}-{head,hair}.png` 여섯 장이다. 이안/리아의 공통 Body·Outfit·Grip·rig·도구·발 위치와 기존 v1/v2 원본은 불변이다. 저장 ID와 진행도도 불변이다.
- `scripts/qa-ria-neck-fit.mjs`의 실제 게임 합성 비교표에서 현재/v2 이동 후보/v3를 함께 비교했다. `scripts/qa-ria-head-v3.mjs`는 5방향·프레임 실제 합성과 저장 불변을 검사한다. 정적 앞목 겹침은 v2 21→v3 34픽셀. 이 수치는 회귀 방지 기준일 뿐, Android 시각 선호까지 증명하지 않는다.

이미지 생성 프롬프트:

```text
Pixel-art production reference edit for the existing game character Ria. Image 1 is the in-game failure screenshot: her face looks disconnected from her coat by a long exposed orange neck. Image 2 is the four-view Ria sprite reference. Make a clean four-view pixel-art turnaround of the SAME Ria (front, right profile, left profile, back), each in a neutral standing pose, on transparent background. Keep her recognizable brown hairstyle/side bun, facial identity, blue jacket, cream shirt, shorts and brown boots; do not add props, text or background. Critical correction: the chin should sit naturally just above the jacket collar, with only a very short subtle neck, not a long thin exposed skin column, while keeping overall head size appropriate for this small game sprite. Preserve matching pixel scale and foot line across views. This is a visual reference; no scene or UI.
```
