# 리아 머리·목 연결 재제작 v2

2026-09-27 사용자 요청: 리아의 머리가 몸과 따로 노는 인상을 줄이고, 이안·리아 공통 몸/옷/장비 규격은 유지한다.

## 제작·등록

- 원화: `turnaround-generated.png` (built-in `image_gen` 편집 모드). 입력 1은 기존 4방향 `female-idle-review.png` 편집 대상, 입력 2는 사용자 게임 사진의 시각 참고다. 투명 배경으로 생성했다. API/CLI는 사용하지 않았다.
- `normalized-source-turnaround.png`는 원화의 네 캐릭터를 96×96 셀, 발 (48,88)에 등록한 **가공 중간본**이다. 게임이 쓰는 머리/헤어와 동일한 최종 크기라고 혼동하지 않는다.
- `scripts/pack-ria-head-v2.mjs`는 생성 원화에서 Head/Hair를 분리하고 둘에 동일한 축소 변환을 적용한다. 첫 추출본은 머리카락 높이가 41px로 몸통 36px보다 커서 부적합했다. 최종 앞방향 Head는 25×20px, Hair는 36×36px로 줄였다.
- 축소만 하면 새 얼굴이 공통 몸의 목과 0픽셀 겹쳤다. 그래서 보호된 옛 리아 머리에서 **목깃 중앙과 겹치는 피부 픽셀만** 복사해 앞 21·좌우 11픽셀의 연결을 유지했다. 얼굴·머리카락의 다른 부분, 공통 Body/Outfit/Grip, rig, 장비는 바꾸지 않았다.
- 최종 게임 시트는 `assets/player/npc-ria-v2/{walk,chop,fish}-{head,hair}.png` 6개다. 원본 `npc-v1/*female*`은 보존했다. 기존 `body.female` / `hair.female.brown` 저장 ID가 새 시트를 가리키므로 사용자 선택과 진행도는 그대로다.
- 머리/헤어 중립 원화는 모든 동작 프레임에 같은 크기·좌표로 반복한다. 새 헤어/얼굴도 이 공통 목 연결 검사를 통과해야 한다.

## 원화 생성 프롬프트

```text
Use case: precise-object-edit
Asset type: pixel-art character head reference for an existing layered top-down RPG.
Input image 1: edit target, the current four-direction Ria turnaround (front, right, left, back) on a transparent canvas. Input image 2: reference screenshot of the current game where Ria's head seems visually detached from her narrow jacket collar.
Primary request: Keep Ria recognizably the same warm-brown-haired female character, with the same face expression and hairstyle silhouette, but improve ONLY the head/neck-to-collar visual connection and slightly reduce the apparent head-heavy proportion, especially when facing the camera. Make the lower jaw/neck emerge naturally into the existing central collar. Keep all four views consistent with one another.
Style: crisp hand-clustered pixel art at native game-sprite sensibility, no anti-aliasing or painterly shading. Transparent background.
Constraints: keep body, blue jacket, cream shirt, trousers, boots, backpack, poses, number and direction order of views unchanged. No added clothing, hats, weapons, props, shadows, background, text, grid, or duplicate sprites. No change to the second image (reference only). Produce an editable source candidate; exact 96px game sheets will be assembled and validated separately.
```

## 검증과 한계

`scripts/check-character-standard.mjs`는 같은 96셀/3시트/32자세, 공통 Body·Grip·rig 불변과 앞/옆 목깃 겹침을 검사한다. `qa-ria-head-v2.mjs`는 실제 렌더러의 이전/신규 그림 비교를 기록한다. `qa-npc-character.mjs`는 이안·리아×옷3×가방3×32=576 자세 및 저장을 확인한다. 픽셀 연결은 시각적 선호까지 증명하지 않으므로 Android 실기기 확인이 필요하다.
