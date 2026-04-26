import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const SUPABASE_BASE_URL = 'https://nuqpcxgonlqlxtujxmhx.supabase.co/functions/v1/storage';

  // API Proxy Route
  app.all("/api/storage*", async (req, res) => {
    const apiPath = req.path.replace("/api/storage", "");
    const url = `${SUPABASE_BASE_URL}${apiPath}${req.url.includes("?") ? `?${req.url.split("?")[1]}` : ""}`;
    const apiKey = process.env.VITE_SUPABASE_API_KEY;

    if (!apiKey || apiKey === "YOUR_SUPABASE_ANON_KEY") {
      return res.status(401).json({ error: "Supabase API key not configured on server." });
    }

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: {
          "apikey": apiKey,
          "Content-Type": "application/json",
        },
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.text();
      
      res.status(response.status);
      try {
        res.json(JSON.parse(data));
      } catch {
        res.send(data);
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from Supabase" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
