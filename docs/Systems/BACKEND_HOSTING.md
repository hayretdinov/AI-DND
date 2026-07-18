# Backend Hosting Plan

## 1. Current State

- Frontend опубликован на Vercel.
- Backend существует локально в `server/`.
- Backend возвращает только mock AI responses.
- Настоящий AI не подключён.

## 2. Recommended First Backend Host

Для первого тестового размещения рекомендуется Render. Node/Express web service можно подключить напрямую из GitHub, указать каталог `server` и использовать уже подготовленные команды сборки и запуска.

Корневой `render.yaml` содержит Blueprint для этого сервиса. Реальный deploy в рамках текущего этапа не выполняется.

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

После deploy нужно получить публичный HTTPS URL, например:

```text
https://ai-dnd-server.onrender.com
```

Этот URL понадобится frontend на следующем этапе. До проверки endpoint использовать его в production frontend нельзя.

## 6. Do Not Switch Frontend Yet

Frontend должен оставаться в `mock` mode. Не переключать `AI_CONNECTION_MODE` на `backend` до успешной проверки публичных `/health`, `POST /api/ai/dialogue` и CORS.

## 7. Future Step

После успешного backend deploy:

- добавить `VITE_AI_BACKEND_URL` во frontend;
- переключить `AI_CONNECTION_MODE` на `backend`;
- проверить CORS с production frontend;
- повторно опубликовать frontend.
