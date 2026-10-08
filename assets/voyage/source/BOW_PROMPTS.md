# 선수 고정 구도 갑판 제작 기록

제작일: 2026-10-08 · **내장 ImageGen / 이미지 생성 스킬 / precise-object-edit**. CLI/API 키는 사용하지 않았다.

사용자 요청: 배의 가장 앞쪽 갑판만 화면 아래에 두고 위·좌·우로 바다가 보이게 한다. 바위·산호 등의 바다 장식은 양쪽에서 아래로 지나가며, 전체 그림을 화면 안에 맞추지 않고 자연스럽게 잘려도 된다.

## 입력 역할

1. `assets/harbor/voyage-deck-v2.png` — 편집 대상. 목재·난간 색과 도트 표현은 유지하고 상단만 완만한 선수 모양으로 바꾼다.
2. `assets/harbor/harbor-boat-v2.png` — 배 그림체 참고.
3. `assets/player/player.png` — 캐릭터 스타일 참고. 캐릭터는 변경하지 않는다.

## 최종 결과와 연결

- 내장 생성 결과: `C:/Users/leeks/.codex/generated_images/01a10855-ce37-7851-9406-7f37b1b9dec7/exec-48adc62c-8240-4524-a4d1-3589f8e993f7.png`
- 보관 원본: `assets/voyage/source/voyage-bow-v1.png`
- 게임용: `assets/voyage/voyage-bow-v1.png` (168×336, 진짜 투명 알파 유지)
- `node scripts/process-voyage-bow-assets.mjs`: 알파 경계 정리와 최근접 크기 정규화만 수행한다. 게임 렌더러는 외곽 난간/방현재 폭을 맞춰 발이 바닥에 놓이도록 3분할 투영한다.
- 공유 앞 갑판: 최대 7타일 폭, 상단 3→5→7타일로 벌어지는 43개 이동 타일. 배의 뒤쪽은 화면 아래로 이어지며 선실/선미는 표시하지 않는다.
- 기존 v2 정박선·매표소·캐릭터·암초·산호 파일은 덮어쓰지 않는다. 바다 장면의 반복 금지/시드/시간, 승선권과 저장 버전은 유지한다.
- 예전 뒤 갑판 저장 위치는 진행 중인 운항/남은 시간/코인/승선권을 보존한 채 안전한 선수 시작 위치로 이행한다.

## 최종 편집 프롬프트

```text
Use case: precise-object-edit
Asset type: transparent top-down pixel-art foredeck sprite for the existing cozy RPG
Input images: Image1 existing wooden deck is the EDIT TARGET, Image2 fishing boat and Image3 player are STYLE REFERENCES ONLY.
Primary request: reshape only the upper end of the long rectangular deck into the FOREMOST BOW of a boat pointing UP. Keep the warm broad timber planks, muted teal hull, ivory railings, life rings, simple dark pixel outline and the clean readable pixel style unchanged. Empty walkable deck, no cabin, no characters or objects on the floor.
Geometry is critical: intended logical sprite168x336. At the very top the bow rim has a short rounded FLAT leading section centered across about3/7 of the deck width. It widens to5/7 width by y24 logical pixels and reaches the full7/7 width by y48; below y48 the two sides are straight and vertical to the bottom. This is a gentle stepped bow taper, NOT a long sharp triangular tip. Wooden floor reaches close inside the rails. The sides continue to the bottom and there is NO stern or rear/end railing at the bottom: this is just the forward section, and the aft deck continues off screen below. Keep only a few side tire fenders/life rings along the perimeter.
Style: same clean hand-placed 16-bit pixel clusters and broad 2-3-tone shading as the references. No microtexture, photo-style weathering, smooth gradients or vector clipart.
Composition: directly top-down, vertically aligned, single centered complete foredeck silhouette with small transparent margin, no isometric angle.
Constraints: genuinely transparent background; no sea/water, wake, peripheral glow, cast ground shadow, cabin, text, logo, arrow, UI or watermark. Preserve the existing warm timber/ivory/teal palette and readable restrained detail.
```
