# AI-DND Companion System

## 1. Purpose

Companion System добавляет в AI-DND живого спутника, который путешествует вместе с игроком, реагирует на его решения, помогает понимать мир и становится эмоциональной связью между игроком и историей.

Спутник не является обычным tutorial helper, UI-подсказчиком или меню помощи. Это полноценный NPC со своими мыслями, страхами, целями, отношением к игроку и правом уйти.

Главная цель системы:

- сделать путешествие менее пустым;
- дать игроку живого собеседника;
- давать подсказки через внутриигровые реплики;
- усилить эмоциональную привязанность к миру;
- создать долгую сюжетную арку с доверием, привязанностью, конфликтами и возможной трагедией.

Companion System должен работать вместе с:

- World Map System;
- Travel Energy System;
- Camp Scene;
- Thought System;
- NPC Memory System;
- AI NPC System;
- Save and World State System.

---

## 2. First Major Companion: Anariel

Первый важный спутник игрока — Анариэль.

### Basic Information

```ts
name: "Anariel"
race: "elf"
gender: "female"
role: "companion"
status: "optional companion"
```

## Visual System of Anariel

Anariel uses a planned visual progression that follows her narrative state. The current dedicated files are stored in `assets/companions/anariel/`:

- `assets/companions/anariel/anariel_prisoner_floor_fear.png`
- `assets/companions/anariel/anariel_chained_standing_fear.png`
- `assets/companions/anariel/anariel_chained_standing_relief.png`
- `assets/companions/anariel/anariel_travel_rags.png`
- `assets/companions/anariel/anariel_travel_clothes.png`
- `assets/companions/anariel/anariel_travel_armor.png`

These images are asset-ready only. No frontend, backend, save, combat, AI, or event integration has been implemented as part of this asset intake.

## Anariel Asset Files

### Added Files

| File | State | MVP |
| --- | --- | --- |
| `assets/companions/anariel/anariel_prisoner_floor_fear.png` | First encounter - prisoner on the floor | yes |
| `assets/companions/anariel/anariel_chained_standing_fear.png` | After dialogue - standing in chains, afraid | yes |
| `assets/companions/anariel/anariel_chained_standing_relief.png` | Standing in chains, relieved / happy | yes |
| `assets/companions/anariel/anariel_travel_rags.png` | Traveling with the player in rags | yes |
| `assets/companions/anariel/anariel_travel_clothes.png` | Traveling with the player in normal clothes | later |
| `assets/companions/anariel/anariel_travel_armor.png` | Traveling with the player in armor | later |

### MVP-Ready States

- First encounter prisoner state.
- Afraid chained dialogue state.
- Relieved chained transition state.
- Early travel in rags state.

### Later States

- Normal clothes progression.
- Armor progression.

### Missing Files

- No additional Anariel companion visual files are required for the currently documented MVP states.
