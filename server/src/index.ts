import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { aiDialogueRouter } from "./routes/aiDialogue.js";

dotenv.config();

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://ai-dnd-blue.vercel.app",
]);

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "ai-dnd-server" });
});

app.use(aiDialogueRouter);

const configuredPort = Number(process.env.PORT);
const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3001;

app.listen(port, () => {
  console.log(`AI-DND server listening on http://localhost:${port}`);
});
