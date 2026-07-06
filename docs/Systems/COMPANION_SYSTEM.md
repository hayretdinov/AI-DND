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