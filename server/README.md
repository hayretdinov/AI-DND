# AI-DND Server

Minimal Express and TypeScript backend scaffold for the protected AI proxy.

The current `POST /api/ai/dialogue` endpoint returns mock text only. No AI provider, API key, database, authentication, or server-side save system is connected.

```powershell
npm install
npm run dev
```

The local server listens on `http://localhost:3001` by default. Use `GET /health` for a basic readiness check.
