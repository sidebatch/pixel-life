# Pixel Life — Player Direction Fix

Fixes the new player sprite sheet's horizontal direction mapping.

- left input -> row 3 (index 2), character faces left
- right input -> row 2 (index 1), character faces right
- up/down unchanged
- NPC rendering, movement, collision, map, and interaction logic unchanged


## Building Redesign V1
- 기존 코드 드로잉 집을 독립 PNG 건물로 교체
- 기본 주택 + 준의 작업실 추가
- Building Standard 1.0 적용: footprint / door / approach 분리
- 문 위치는 left / center / right 모두 허용하며 실제 상호작용은 좌표 기반
- 중요 건물 이미지는 standalone HTML 안에 embed
