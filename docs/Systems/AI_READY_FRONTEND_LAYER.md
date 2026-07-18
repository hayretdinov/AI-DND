# AI-ready Frontend Layer

## Purpose

AI-ready frontend layer задаёт единый контракт для будущих диалогов NPC, спутников и AI Dungeon Master. Игровые экраны обращаются к одному сервису и не зависят от конкретного AI-провайдера.

Game Engine по-прежнему управляет состоянием мира, боями, отношениями, инвентарём, наградами и сохранениями. AI-слой отвечает только за текст реплики.

## Current Mode

Текущий режим: `mock`.

`requestAIDialogue` не выполняет сетевых запросов. После короткой локальной задержки сервис возвращает безопасную атмосферную реплику с флагом `isMock: true`. Для Анариэль, Dungeon Master и остальных NPC предусмотрены отдельные mock-ответы на русском и английском языках.

В `EventScene` mock-сервис подключён к существующим диалоговым панелям Анариэль и NPC. Intent routing, combat, trade, social checks, sanitizer и сохранение истории продолжают выполняться существующим Game Engine.

## Why real AI is not connected yet

- Frontend опубликован на Vercel как статическое приложение.
- LM Studio на компьютере разработчика недоступен внешним тестерам.
- API-ключи нельзя хранить в frontend-коде или публичных Vite-переменных.
- Для безопасного доступа к AI требуется backend proxy.

## Files

- `client/src/services/aiClient.ts` - типы запросов/ответов и единая функция `requestAIDialogue`.
- `client/src/services/aiStatus.ts` - текущий режим соединения и отображаемый статус.
- `client/src/screens/EventScene.tsx` - интеграция mock-ответов в существующие диалоги Анариэль и NPC.
- `client/src/i18n/translations/ru.ts` и `client/src/i18n/translations/en.ts` - подписи mock mode.

## Future Backend Integration

На следующем серверном этапе реализация `requestAIDialogue` сможет отправлять запрос:

```text
POST /api/ai/dialogue
```

Контракт `AIDialogueRequest` уже содержит идентификатор и роль говорящего, локацию, текст игрока, недавние сообщения и игровой контекст. Сейчас `fetch` не используется, endpoint не вызывается и backend не создаётся.

## Security Rules

- API-ключи не хранятся во frontend.
- Production-браузер не обращается напрямую к LM Studio.
- Backend обязан защищать ключи, проверять входные данные и ограничивать запросы.
- Game Engine контролирует состояние и применяет игровые правила; AI возвращает только текст.
- AI-ответ не может напрямую выдавать предметы, золото или менять сохранение без проверки Game Engine.
