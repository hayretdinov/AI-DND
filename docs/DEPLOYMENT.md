# AI-DND Deployment Guide

## Backend Deployment Status

- Frontend опубликован на Vercel: https://ai-dnd-blue.vercel.app
- Локальная заготовка backend AI proxy находится в `server/`.
- Backend пока не опубликован и недоступен через публичный frontend.
- Публичный frontend по умолчанию продолжает использовать безопасный mock AI mode.
- Для настоящего backend AI потребуется отдельный hosting и защищённая серверная конфигурация.

## Backend Hosting Plan

- Frontend уже размещён на Vercel.
- Backend из `server/` должен быть размещён как отдельный web service.
- Для первого backend-теста рекомендуется Render; Railway остаётся альтернативой.
- Опубликованный backend должен предоставлять публичный HTTPS URL для `/health` и `/api/ai/dialogue`.
- Frontend должен оставаться в `mock` mode, пока backend URL и CORS не будут проверены.
- Подробная инструкция находится в `docs/Systems/BACKEND_HOSTING.md`.

## Production URL

Primary test URL:

https://ai-dnd-blue.vercel.app

Preview/deployment URL:

https://ai-dnd-git-main-hayretdinov1.vercel.app

Это ранняя тестовая frontend-only сборка. В ней нет публичного backend, AI, аккаунтов и серверных сохранений.

## 1. Current Deployment Target

На текущем этапе публикуется только frontend игры. Это статическая сборка React/Vite из папки `client`.

Backend, AI, база данных, учётные записи и серверные сохранения пока не публикуются. Файлы `server`, `shared`, `data` и `prototype` не являются частью работающего публичного сервиса.

## 2. What Works In This Deployment

В статической frontend-версии работают:

- главное меню;
- создание персонажа;
- локальные frontend-экраны и игровые сцены;
- локализация RU/EN;
- подключённые к frontend изображения, видео и другие ассеты;
- сохранения в `localStorage` браузера на устройстве игрока.

## 3. What Does Not Work Yet

Пока не работают как публичные онлайн-функции:

- настоящий AI-диалог NPC;
- LM Studio для внешних игроков;
- общий онлайн-мир;
- учётные записи игроков;
- серверные и облачные сохранения;
- multiplayer/MMORPG;
- backend API.

Если frontend обращается к `127.0.0.1` или `localhost`, браузер тестера ищет сервис на компьютере самого тестера. Это не компьютер разработчика, поэтому локальный LM Studio или backend разработчика по публичной ссылке недоступен.

## 4. Vercel Deployment

1. Зарегистрироваться или войти в Vercel.
2. Создать GitHub-репозиторий для проекта и отправить в него текущую ветку.
3. В Vercel выбрать **Add New Project**.
4. Подключить GitHub-репозиторий.
5. Оставить **Root Directory** равным корню репозитория. Корневой `vercel.json` задаст:

   ```text
   Framework Preset: Vite
   Install Command: cd client && npm install
   Build Command: cd client && npm run build
   Output Directory: client/dist
   ```

6. Нажать **Deploy**.
7. После сборки Vercel выдаст ссылку вида `https://project-name.vercel.app`.

Альтернативный вариант: выбрать в Vercel **Root Directory = client** и вручную указать:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

В этом варианте корневой `vercel.json` может не применяться, поэтому SPA rewrite нужно отдельно сохранить в настройках проекта или перенести конфигурацию в выбранный root. Рекомендуемый для этого репозитория вариант - оставить root репозитория.

После публикации проверить:

- главная страница открывается;
- **New Game** работает;
- создание персонажа работает;
- ассеты загружаются без ошибок;
- обновление страницы и прямое открытие SPA-маршрута не приводят к 404.

## 5. Netlify Deployment

1. Зарегистрироваться или войти в Netlify.
2. Выбрать **Add new site** и **Import from Git**.
3. Подключить GitHub-репозиторий.
4. Оставить корень репозитория без изменения. Корневой `netlify.toml` задаст:

   ```text
   Base directory: client
   Build command: npm run build
   Publish directory: dist
   ```

5. Нажать **Deploy**.
6. После сборки Netlify выдаст ссылку вида `https://project-name.netlify.app`.

Если настройки вводятся вручную через UI, использовать те же значения. Правило `/* -> /index.html` со статусом `200` уже находится в `netlify.toml` и обеспечивает SPA fallback.

После публикации проверить:

- главная страница открывается;
- **New Game** работает;
- создание персонажа работает;
- ассеты загружаются без ошибок;
- обновление страницы и прямое открытие SPA-маршрута не приводят к 404.

## 6. Local Production Preview

Для локальной проверки production-сборки:

```powershell
cd client
npm install
npm run build
npm run preview
```

`npm run dev` запускает режим разработки. `npm run preview` обслуживает уже собранную production-версию из `client/dist` и используется для финальной локальной проверки перед публикацией.

## 7. Early Access Limitations

- В ранней тестовой сборке отображается AI mock mode с временными атмосферными ответами.
- Настоящий AI NPC dialogue потребует будущий backend proxy и не вызывается из production-браузера напрямую.
- Сохранение хранится в `localStorage` браузера игрока.
- На другое устройство или в другой браузер сохранение автоматически не переносится.
- После очистки данных браузера сохранение может исчезнуть.
- AI пока не работает для внешних тестеров.
- LM Studio на компьютере разработчика недоступен игрокам по публичной ссылке.
- Личных аккаунтов пока нет.
- Серверного мира и серверных сохранений пока нет.
- Это frontend-only тест раннего доступа.

## 8. Future Online Architecture

Планируемый порядок развития:

**Phase 1 - Static frontend deployment**

- Vercel/Netlify;
- только frontend.

**Phase 2 - Backend API**

- реализация в `server`;
- REST/WebSocket;
- proxy endpoint для AI.

**Phase 3 - AI Integration**

- frontend отправляет текст игрока в backend;
- backend обращается к AI-провайдеру или серверу локальной модели;
- backend возвращает ответ NPC;
- API-ключи никогда не хранятся во frontend.

**Phase 4 - Accounts and Server Saves**

- учётные записи игроков;
- серверные и облачные сохранения.

**Phase 5 - Private Early Access**

- доступ по приглашениям;
- сбор отзывов тестеров;
- telemetry/logging при необходимости и после отдельного решения по приватности.

## 9. Security Notes

- Нельзя хранить AI API keys во frontend-коде или публичных Vite-переменных.
- Нельзя публиковать `.env` и `.env.local`.
- Production-браузер не должен обращаться напрямую к LM Studio.
- В будущей онлайн-архитектуре frontend обращается к backend, а backend - к AI.
- `.env` и `.env.local` уже добавлены в `.gitignore`.
- Секреты провайдеров следует задавать в защищённых настройках Vercel/Netlify, а не в репозитории.

## 10. Deployment Checklist

Перед публикацией проверить:

- [ ] `npm run build` проходит;
- [ ] `client/dist` существует;
- [ ] `vercel.json` существует;
- [ ] `netlify.toml` существует;
- [ ] `docs/DEPLOYMENT.md` существует;
- [ ] в репозитории нет секретов;
- [ ] изменения закоммичены в Git;
- [ ] репозиторий отправлен на GitHub;
- [ ] Vercel или Netlify подключён к GitHub;
- [ ] опубликованный сайт вручную проверен на desktop и mobile;
- [ ] обновление страницы и прямые SPA-маршруты не возвращают 404.
