import express from "express";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import { ensureSettingsSeeded } from "./server/db.js";
import { addClient, removeClient } from "./server/sse.js";

// Import modular routes
import settingsRouter from "./server/routes/settings.js";
import categoriesRouter from "./server/routes/categories.js";
import productsRouter from "./server/routes/products.js";
import usersRouter from "./server/routes/users.js";
import couponsRouter from "./server/routes/coupons.js";
import transactionsRouter from "./server/routes/transactions.js";
import reviewsRouter from "./server/routes/reviews.js";
import chatRouter from "./server/routes/chat.js";
import sellerRouter from "./server/routes/seller.js";
import adminRouter from "./server/routes/admin.js";
import paymentsRouter from "./server/routes/payments.js";
import exporterRouter from "./server/routes/exporter.js";

async function startServer() {
  // Ensure default database records and settings are fully seeded
  await ensureSettingsSeeded();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads directory and serve it statically
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // --- GLOBAL FILE UPLOAD ENDPOINT ---
  app.post("/api/upload", (req, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: "Missing filename or base64Data" });
      }

      let pureBase64 = base64Data;
      if (base64Data.includes(";base64,")) {
        pureBase64 = base64Data.split(";base64,").pop();
      }

      const buffer = Buffer.from(pureBase64, "base64");
      const ext = path.extname(filename) || ".png";
      const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
      const cleanFileName = `${baseName}_${Date.now()}${ext}`;
      const filePath = path.join(uploadsDir, cleanFileName);

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${cleanFileName}`;
      res.json({ url: fileUrl });
    } catch (err: any) {
      console.error("Error saving uploaded file:", err);
      res.status(500).json({ error: err.message || "Failed to upload file" });
    }
  });

  // --- REAL-TIME SERVER SENT EVENTS (SSE) ENDPOINT ---
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    addClient(res);

    req.on("close", () => {
      removeClient(res);
    });
  });

  // --- MOUNT MODULAR API ROUTERS ---
  app.use("/api/settings", settingsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart", productsRouter); // checkout router handles POST /api/cart/checkout
  app.use("/api/users", usersRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/seller", sellerRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/php-exporter", exporterRouter);

  // --- INTEGRATE VITE FOR FE DEVELOPMENT OR PROD STATIC SERVING ---
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

  // Bind exclusively to 0.0.0.0 and Port 3000 for standard ingress routing
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting Express backend:", err);
  process.exit(1);
});
