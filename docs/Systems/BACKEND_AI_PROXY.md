# Backend AI Proxy

## Purpose

Backend proxy нужен для того, чтобы frontend игры не обращался к AI-провайдеру напрямую. Браузер отправляет единый запрос на сервер AI-DND, а сервер в будущем безопасно вызовет выбранного AI-провайдера.

## Current State

Сейчас endpoint `POST /api/ai/dialogue` работает локально и возвращает безопасный backend mock response. Настоящий AI-провайдер не подключён.

Frontend поддерживает будущий режим `backend`, но по умолчанию сохраняет режим `mock`. В режиме `mock` сетевой запрос не выполняется. Если режим `backend` будет включён, но сервер окажется недоступен, frontend вернётся к локальному mock response.

## Why This Is Needed

- API keys нельзя хранить во frontend.
- LM Studio на компьютере разработчика недоступен внешним тестерам.
- Backend будет контролировать и проверять AI requests.
- Game Engine должен контролировать правила, состояние мира, награды и сохранения.

## Endpoint

`POST /api/ai/dialogue`

Request example:

```json
{
  "actorId": "anariel",
  "actorName": "Анариэль",
  "actorRole": "companion",
  "playerText": "Что нам делать дальше?"
}
```

Response example:

```json
{
  "actorId": "anariel",
  "actorName": "Анариэль",
  "text": "...",
  "isMock": true,
  "source": "backend-mock"
}
```

Невалидный запрос получает HTTP `400`:

```json
{
  "error": "Invalid AI dialogue request"
}
```

## Local Development

Backend:

```powershell
cd server
npm install
npm run dev
```

Frontend:

```powershell
cd client
npm run dev
```

Локальный backend использует порт `3001`, если переменная `PORT` не задана.

## Future Real AI Integration

Позже backend сможет отправлять запрос к OpenAI API или к размещённому на сервере LM Studio, Ollama либо vLLM. Выбор провайдера и его настройка не входят в текущий этап.

## Security Rules

- No AI keys in frontend.
- No `.env` in git.
- Backend validates requests.
- AI returns text only.
- Game Engine controls rules and state.

## Deployment Notes

Сейчас backend не опубликован. Для frontend-only deployment на Vercel endpoint недоступен, пока содержимое `server/` не будет размещено отдельно. Публичный frontend продолжает использовать локальный mock AI mode.
