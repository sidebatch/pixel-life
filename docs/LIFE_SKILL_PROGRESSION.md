# Pixel Life — Life Skill Progression System v1.0
## 다른 세션/Work 인수인계 문서

이 문서는 Pixel Life 오픈월드 게임의 생활 스킬 성장 시스템 확정안이다.
이후 구현 및 UI 작업은 아래 원칙을 기준으로 진행한다.

---

# 1. 게임 성장 철학

이 게임은 하나의 Character Level을 올리는 RPG가 아니다.

플레이어가 실제로 무엇을 많이 했느냐에 따라 각각의 생활 스킬이 독립적으로 성장한다.

예:

Player A
- Fishing Lv.94
- Gathering Lv.12
- Logging Lv.8
- Mining Lv.5
- Cooking Lv.27
- Hunting Lv.4

Player B
- Fishing Lv.52
- Gathering Lv.49
- Logging Lv.57
- Mining Lv.51
- Cooking Lv.61
- Hunting Lv.54

A는 낚시에 깊게 특화된 플레이어이고,
B는 여러 콘텐츠를 골고루 즐긴 플레이어다.

둘 중 어느 쪽도 시스템적으로 우월하지 않아야 한다.

핵심 철학:

"플레이 방식 자체가 캐릭터의 성장 기록이 된다."

---

# 2. 사용하지 않는 시스템

다음은 기본적으로 만들지 않는다.

- Character Level
- Player Level
- Adventure Level
- Total Level
- 모든 생활 레벨을 더한 종합 숫자
- 육각형/Radar Chart를 핵심 성장 지표로 사용하는 구조

이유:

Total Level이나 Character Level이 중요해지면
전문화 플레이어보다 모든 콘텐츠를 골고루 한 플레이어가
더 잘 키운 캐릭터처럼 보일 가능성이 있다.

이 게임에서는 전문화와 다방면 플레이를 모두 인정한다.

---

# 3. 초기 Life Skills

초기 스킬:

- Fishing / 낚시
- Gathering / 채집
- Logging / 벌목
- Mining / 채광
- Cooking / 요리
- Hunting / 수렵

향후 확장 가능:

- Farming
- Crafting
- Smithing
- Alchemy
- Sailing
- Excavation

단, 초기 버전에서 스킬을 지나치게 많이 추가하지 않는다.

---

# 4. 각 Skill은 독립 성장

각 생활 스킬마다 별도의:

- Level
- XP
- XP Requirement
- Unlock
- Mastery

를 가진다.

예:

낚시 → Fishing XP
벌목 → Logging XP
광석 채굴 → Mining XP
요리 → Cooking XP

다른 스킬 XP에는 직접 영향을 주지 않는다.

---

# 5. Level 구조

기본:

Lv.1 ~ Lv.100

Lv.100은 일반 Level의 최대치다.

Lv.100 이후에는 Mastery가 열린다.

---

# 6. XP 성장 체감

초기 방향:

Lv.1–10
- 굉장히 빠른 성장
- 새로운 콘텐츠를 배우면서 자주 레벨업

Lv.11–30
- 지속적으로 성장감이 느껴짐

Lv.31–60
- 전문화가 본격적으로 나타남

Lv.61–80
- 해당 콘텐츠를 정말 좋아하는 플레이어 구간

Lv.81–99
- 장기 목표

Lv.100
- 큰 성취
- Mastery 해금

정확한 XP Formula는 콘텐츠가 구현된 이후 플레이 테스트로 조정한다.

---

# 7. XP 획득

행동 완료 직후 즉시 XP를 지급한다.

예:

Fishing
- 일반 물고기 +18 XP
- 큰 물고기 +32 XP
- 희귀 물고기 +85 XP

Logging
- 일반 나무 +10 XP
- 단단한 나무 +25 XP
- 희귀 나무 +70 XP

높은 난이도/희귀도/단계의 행동일수록 더 많은 XP를 지급한다.

가장 쉬운 행동만 무한 반복하는 것이 최적 효율이 되지 않게 설계한다.

---

# 8. 핵심 Skills UI

메인 진행도 UI는 원형 게이지보다:

"큰 스킬 아이콘 + 스킬명 + Level + 긴 가로 EXP Bar + %"

구조를 사용한다.

예:

🎣 Fishing                         Lv.27
████████████████░░░░       82%
1,642 / 2,000 XP

🌿 Gathering                       Lv.14
███████░░░░░░░░░░░░       36%

🪓 Logging                         Lv.31
███████████████████░       96%

핵심 목적:

"다음 Level까지 얼마나 남았는지를 즉시 알 수 있어야 한다."

특히 90% 이상이면 사용자가 자연스럽게:

"조금만 더 하면 레벨업인데."

라고 느낄 수 있어야 한다.

---

# 9. Skill Card Component

공통 Skill Card를 만든다.

SkillCard
- Icon
- Skill Name
- Current Level
- Horizontal XP Bar
- Progress %
- Current XP / Required XP
- Next Major Unlock

각 스킬마다 UI를 따로 구현하지 않는다.

데이터만 교체하여 같은 Component를 재사용한다.

---

# 10. 실제 플레이 HUD

플레이 중에는 모든 Skill Bar를 계속 보여주지 않는다.

평상시 HUD는 최대한 깨끗하게 유지한다.

해당 생활 행동을 했을 때만 현재 Skill이 잠시 나타난다.

예:

🎣 Fishing Lv.27
████████████████░░░ 84%
+36 XP

약 2~4초 후 사라진다.

같은 종류의 XP를 연속 획득하면
팝업을 새로 만드는 대신 기존 HUD를 갱신한다.

---

# 11. XP Feedback

XP가 숫자로만 변경되어서는 안 된다.

행동
↓
+XP 표시
↓
EXP Bar가 실제로 움직임
↓
다음 Level에 가까워짐

예:

81% → 84%

Bar가 오른쪽으로 부드럽게 증가해야 한다.

행동과 성장의 관계를 즉각적으로 체감시키는 것이 핵심이다.

---

# 12. Near-Level-Up Feedback

0–79%
- 일반 상태

80–89%
- 약간 강조

90–97%
- EXP Bar 강조

98–99%
- Level Up이 매우 가까움을 명확하게 표시

예:

🪓 Logging Lv.31
███████████████████▊ 98%

42 XP remaining

강제적인 팝업이나 FOMO 문구는 사용하지 않는다.

진행도 자체가 사용자의 다음 행동을 유도하게 한다.

---

# 13. Level Up 연출

Level Up은 절대 조용히 지나가지 않는다.

예:

🪓

LOGGING

Lv.32

LEVEL UP!

연출:

- EXP Bar가 100%까지 채워짐
- Skill Icon 확대
- Level 숫자 변경
- 짧은 빛/Particle
- 짧은 Level Up Sound
- 약 1~2초

플레이를 지나치게 방해하지 않으면서도
확실히 성취감을 줘야 한다.

---

# 14. Level Up 직후 UX

현재 성취와 다음 목표를 동시에 보여준다.

예:

Fishing Lv.28!

NEW
Silver Trout 발견 가능

NEXT
Lv.30
Advanced Fishing Rod

핵심:

현재 보상
+
다음 가까운 목표

Level Up 후 사용자가

"끝났다."

가 아니라

"Lv.30까지만 더 해볼까?"

라고 느끼도록 한다.

---

# 15. Unlock System

모든 Level에 큰 보상을 줄 필요는 없다.

예:

Lv.28
- 소규모 변화

Lv.30
- 새로운 낚싯대

Lv.32
- 새로운 물고기

Lv.35
- 새로운 낚시 지역

Lv.40
- 칭호

Lv.50
- 전용 Cosmetic

중요 Milestone은 Level Up 화면에서 미리 보여준다.

---

# 16. 보상 원칙

각 Skill의 보상은 해당 분야 중심이다.

Fishing Level:
- 새 물고기
- 새 Fishing Area
- Fishing Rod
- Bait
- 새로운 Fishing Mechanic
- Collection
- Cosmetic
- Title
- Decoration
- Convenience

Fishing Level이 높다고
Mining이나 다른 unrelated Skill이 자동으로 강해지는 방식은 피한다.

---

# 17. 전문화 vs 다방면

전문화 플레이어:

Fishing 94
Gathering 12
Logging 8
Mining 5
Cooking 27
Hunting 4

→ Fishing의 깊은 콘텐츠를 즐길 수 있음.

다방면 플레이어:

Fishing 52
Gathering 49
Logging 57
Mining 51
Cooking 61
Hunting 54

→ 여러 종류의 콘텐츠/제작 연결을 폭넓게 즐길 수 있음.

두 플레이 스타일 모두 가치가 있어야 한다.

"모든 Skill Lv.50 이상이어야 핵심 콘텐츠 해금"
같은 구조는 되도록 피한다.

---

# 18. Player Profile

다른 플레이어의 생활 스킬 분포를 볼 수 있게 한다.

예:

KYEONGSOO

🎣 Fishing      Lv.94
████████████████░░ 83%

🍳 Cooking      Lv.37
██████████░░░░░░░ 52%

🌿 Gathering    Lv.14
████░░░░░░░░░░░░░ 21%

🪓 Logging       Lv.8
███░░░░░░░░░░░░░░ 17%

이 화면만 봐도:

"이 사람은 낚시를 정말 많이 했구나."

를 알 수 있어야 한다.

Total Level은 표시하지 않는다.

---

# 19. 대표 Skill / Title

플레이어가 대표 Skill 또는 Title을 선택할 수 있게 할 수 있다.

예:

Kyeongsoo
🎣 Fishing Lv.94

또는:

Kyeongsoo
Master Angler

가장 높은 Skill을 자동 강제하기보다는
사용자가 자신의 정체성을 선택할 수 있게 하는 방향을 우선 고려한다.

---

# 20. Lv.100 이후 Mastery

Lv.100 이후 XP를 버리지 않는다.

예:

Fishing Lv.100

Mastery 7
████████████░░░░░ 68%

Bar를 다시 채우면:

Mastery 7 → Mastery 8

Mastery는 강한 능력치 증가보다
장기 플레이 기록과 Prestige 역할을 한다.

---

# 21. Mastery 보상

주로:

- Cosmetic
- Title
- Profile Decoration
- Tool Skin
- House Decoration
- Collection
- Special Effect
- Achievement

등을 사용한다.

Mastery를 통해 능력치를 무한 증가시키지 않는다.

예:

Fishing Lv.100
Mastery 47

이 숫자만으로도
"이 사람은 낚시를 정말 오래 했다."
라는 의미가 생긴다.

---

# 22. Core Progression Loop

콘텐츠 발견
↓
행동
↓
즉시 +XP
↓
EXP Bar 증가
↓
다음 Level에 가까워짐
↓
LEVEL UP
↓
새 Unlock
↓
다음 Unlock Preview
↓
새 콘텐츠 경험
↓
다시 XP 획득

이 Loop가 게임의 핵심 성장 시스템이다.

---

# 23. 목표 감정

짧은 시간:

"조금만 더 하면 Level Up인데."

Level Up 후:

"조금만 더 하면 다음 Unlock인데."

장기 플레이 후:

"내 캐릭터는 이런 삶을 살아왔구나."

이 세 가지 감정을 만드는 것이 목표다.

---

# 24. 피해야 할 것

- Character Level 중심 설계
- Total Level 경쟁
- 모든 Skill을 강제로 골고루 올리게 하는 구조
- 전문화 플레이어에게 불이익
- XP 획득 Feedback이 없는 구조
- Level Up이 조용히 지나가는 구조
- Lv.100 이후 XP가 무의미해지는 구조
- 모든 Level이 단순 능력치 +1뿐인 구조
- 모든 Skill EXP Bar 상시 HUD 노출
- 너무 많은 Pop-up
- 성장 UI 때문에 World View가 가려지는 것

---

# 25. 권장 데이터 구조

skills: {
  fishing: {
    level: 27,
    xp: 1642,
    xpToNext: 2000,
    mastery: 0
  },

  gathering: {
    level: 14,
    xp: 720,
    xpToNext: 2000,
    mastery: 0
  },

  logging: {
    level: 31,
    xp: 1923,
    xpToNext: 2000,
    mastery: 0
  },

  mining: {
    level: 18,
    xp: 840,
    xpToNext: 1650,
    mastery: 0
  },

  cooking: {
    level: 42,
    xp: 2310,
    xpToNext: 3200,
    mastery: 0
  },

  hunting: {
    level: 6,
    xp: 180,
    xpToNext: 1050,
    mastery: 0
  }
}

XP Table은 별도 데이터 파일에서 관리한다.

---

# 26. Unlock 데이터

Unlock도 Logic과 분리한다.

예:

fishingUnlocks: [
  { level: 5, type: "item", id: "basic_bait" },
  { level: 10, type: "area", id: "river" },
  { level: 20, type: "fish", id: "silver_trout" },
  { level: 30, type: "tool", id: "advanced_fishing_rod" }
]

콘텐츠 추가 시 핵심 코드를 수정하지 않고
Data만 추가할 수 있도록 한다.

---

# 27. 공통 UI Components

필수 공통 Component:

1. SkillCard
- Icon
- Name
- Level
- XP Bar
- %
- XP Text
- Next Unlock

2. SkillXPToast
- 현재 Skill
- +XP
- Bar Animation

3. SkillLevelUpOverlay
- Icon
- Skill Name
- New Level
- Current Unlock
- Next Major Unlock

스킬별로 중복 구현하지 않는다.

---

# 28. 구현 순서

PHASE 1 — Core
- Skill Data Structure
- XP 지급
- Level 계산
- XP Bar
- Save/Load

PHASE 2 — Feedback
- +XP HUD
- EXP Bar Animation
- Level Up Detection
- Level Up Animation

PHASE 3 — Progression
- Unlock System
- Next Unlock
- XP Balance

PHASE 4 — Skills Screen
- 모든 Skill Card
- Level
- XP
- %
- Unlock Preview

PHASE 5 — Long-term
- Lv.100
- Mastery
- Titles
- Cosmetics
- Player Profile

---

# 29. MVP 구현 전략

처음부터 6개 Skill을 모두 만들지 않는다.

Fishing 하나로 전체 시스템을 먼저 완성한다.

반드시 테스트할 Flow:

물고기 잡기
↓
Fishing XP 획득
↓
+XP HUD
↓
EXP Bar Animation
↓
Level Up
↓
Level Up Animation
↓
Unlock
↓
Next Unlock 표시
↓
Skills Screen 반영
↓
Save
↓
Reload 후 유지

Fishing으로 이 구조가 완성되면
같은 시스템을:

Gathering
Logging
Mining
Cooking
Hunting

에 확장한다.

---

# 30. 최종 확정 문장

전체 Character Level과 Total Level은 사용하지 않는다.

Fishing, Gathering, Logging, Mining, Cooking, Hunting 등
각 생활 Skill마다 독립적인 Lv.1–100과 XP를 가진다.

핵심 UI는:

"큰 Skill Icon + Skill Name + Level + 긴 Horizontal EXP Bar + %"

구조다.

행동할 때 즉시 +XP와 Bar 증가를 보여주고,
Level Up은 강하게 연출하며,
현재 Unlock과 다음 목표를 동시에 보여준다.

전문화 플레이와 다방면 플레이를 모두 인정한다.

Lv.100 이후에는 Mastery를 통해
플레이어가 좋아하는 콘텐츠를 계속 즐길 이유를 제공한다.

이 시스템의 핵심 목표는:

"한 번만 더."
"조금만 더 하면 Level Up."
"다음 Unlock까지만."

이라는 자연스러운 성장 동기를 만들면서,

장기적으로는:

"이 캐릭터는 내가 어떤 방식으로 이 세계를 살아왔는지를 보여준다."

라는 정체성을 만드는 것이다.
