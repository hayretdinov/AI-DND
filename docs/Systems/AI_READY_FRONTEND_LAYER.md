# AI-ready Frontend Layer

## Purpose

AI-ready frontend layer задаёт единый контракт для будущих диалогов NPC, спутников и AI Dungeon Master. Игровые экраны обращаются к одному сервису и не зависят от конкретного AI-провайдера.

Game Engine по-прежнему управляет состоянием мира, боями, отношениями, инвентарём, наградами и сохранениями. AI-слой отвечает только за текст реплики.

## Current Mode

Текущий режим: `backend`.

`requestAIDialogue` отправляет диалог на публичный Render backend. Backend пока возвращает безопасную mock-реплику с флагом `isMock: true` и источником `backend-mock`. Если backend недоступен, frontend возвращает локальный атмосферный ответ с источником `fallback-mock`.

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

## Backend Mode Enabled

- Frontend теперь использует `backend` mode.
- Backend URL: https://ai-dnd-5l93.onrender.com/api/ai/dialogue
- Backend всё ещё возвращает только mock responses.
- Настоящий AI не подключён.
- При ошибке сети, CORS или недоступности Render остаётся локальный fallback mock.

Frontend отправляет запрос:

```text
POST https://ai-dnd-5l93.onrender.com/api/ai/dialogue
```

Контракт `AIDialogueRequest` содержит идентификатор и роль говорящего, локацию, текст игрока, недавние сообщения и игровой контекст. URL можно переопределить будущей публичной переменной `VITE_AI_BACKEND_URL`; секреты во frontend для этого не нужны.

## Security Rules

- API-ключи не хранятся во frontend.
- Production-браузер не обращается напрямую к LM Studio.
- Backend обязан защищать ключи, проверять входные данные и ограничивать запросы.
- Game Engine контролирует состояние и применяет игровые правила; AI возвращает только текст.
- AI-ответ не может напрямую выдавать предметы, золото или менять сохранение без проверки Game Engine.
