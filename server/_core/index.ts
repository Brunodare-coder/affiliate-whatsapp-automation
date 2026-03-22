import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { whatsappManager } from "../whatsapp";
import { getDb } from "../db";
import { whatsappInstances } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { registerMercadoPagoWebhook } from "../webhooks/mercadopago";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Mercado Pago webhook for automatic PIX payment confirmation
  registerMercadoPagoWebhook(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  // Restore connected WhatsApp instances after server starts
  server.on("listening", async () => {
    try {
      const db = await getDb();
      if (!db) return;
      const instances = await db
        .select()
        .from(whatsappInstances)
        .where(eq(whatsappInstances.status, "connected"));
      for (const instance of instances) {
        console.log(`[WhatsApp] Restoring instance ${instance.id} (${instance.name})...`);
        whatsappManager.connectInstance(instance.id, instance.userId).catch((err) => {
          console.error(`[WhatsApp] Failed to restore instance ${instance.id}:`, err);
        });
      }
    } catch (err) {
      console.error("[WhatsApp] Failed to restore instances:", err);
    }
  });
}

startServer().catch(console.error);
