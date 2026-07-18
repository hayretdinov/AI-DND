# Backend Hosting Plan

## 1. Current State

- Frontend опубликован на Vercel.
- Backend опубликован на Render и также доступен локально из `server/`.
- Backend возвращает только mock AI responses.
- Настоящий AI не подключён.

## Render Deployment Completed

- Backend успешно опубликован на Render.
- Public backend URL: https://ai-dnd-5l93.onrender.com
- Health check URL: https://ai-dnd-5l93.onrender.com/health
- Dialogue endpoint: `POST https://ai-dnd-5l93.onrender.com/api/ai/dialogue`
- Backend сейчас работает только с mock AI responses.
- Настоящий AI не подключён.

PowerShell health check:

```powershell
Invoke-RestMethod https://ai-dnd-5l93.onrender.com/health
```

PowerShell dialogue check:

```powershell
curl.exe -X POST https://ai-dnd-5l93.onrender.com/api/ai/dialogue -H "Content-Type: application/json" -d "{\"actorId\":\"anariel\",\"actorName\":\"Анариэль\",\"actorRole\":\"companion\",\"playerText\":\"Что нам делать дальше?\"}"
```

## 2. Recommended First Backend Host

Для первого тестового размещения рекомендуется Render. Node/Express web service можно подключить напрямую из GitHub, указать каталог `server` и использовать уже подготовленные команды сборки и запуска.

Корневой `render.yaml` содержит Blueprint для этого сервиса. Backend уже опубликован на Render; инструкция ниже остаётся справочной для повторного deploy или восстановления сервиса.

## 3. Render Deployment

1. Зайти в Render.
2. Выбрать **New Web Service** или создать Blueprint из `render.yaml`.
3. Подключить GitHub repository.
4. Выбрать репозиторий AI-DND.
5. Указать **Root Directory**: `server`.
6. Указать **Build Command**: `npm install && npm run build`.
7. Указать **Start Command**: `npm run start`.
8. Добавить environment variables: `NODE_ENV=production` и `FRONTEND_ORIGIN=https://ai-dnd-blue.vercel.app`.
9. Запустить deploy.
10. Проверить `https://your-render-url/health`.
11. Проверить `POST https://your-render-url/api/ai/dialogue` с валидным JSON-телом.

В Blueprint используются актуальные поля Render: `runtime: node`, `rootDir`, `buildCommand`, `startCommand` и `envVars`. Wildcard CORS не используется.

## 4. Railway Deployment

1. Зайти в Railway.
2. Создать **New Project**.
3. Выбрать **Deploy from GitHub repo**.
4. Выбрать репозиторий AI-DND.
5. Указать root или service directory: `server`.
6. Указать build command: `npm install && npm run build`.
7. Указать start command: `npm run start`.
8. Добавить environment variables: `NODE_ENV=production` и `FRONTEND_ORIGIN=https://ai-dnd-blue.vercel.app`.
9. Запустить deploy и создать публичный HTTPS domain для сервиса.

## 5. Backend URL

После deploy получен публичный HTTPS URL:

```text
https://ai-dnd-5l93.onrender.com
```

Этот URL понадобится frontend на следующем этапе. До проверки endpoint использовать его в production frontend нельзя.

## 6. Do Not Switch Frontend Yet

Frontend должен оставаться в `mock` mode. Не переключать `AI_CONNECTION_MODE` на `backend` до успешной проверки публичных `/health`, `POST /api/ai/dialogue` и CORS.

## 7. Future Step

После проверки публичного backend URL:

- добавить `VITE_AI_BACKEND_URL` во frontend;
- переключить `AI_CONNECTION_MODE` на `backend`;
- проверить CORS с production frontend;
- повторно опубликовать frontend.
