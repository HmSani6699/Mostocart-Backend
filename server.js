import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./db/connection.js";
import { runSeed } from "./seed.js";

// Routes
import productRoutes from "./routes/productRoutes.js";
import landingPageRoutes from "./routes/landingPageRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import courierRoutes from "./routes/courierRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

// Static File Serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/images", express.static(path.join(__dirname, "..", "frontend", "public", "images")));

// Serve built frontend assets if dist exists
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Mount API routes
app.use("/api/products", productRoutes);
app.use("/api/landing-pages", landingPageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courier", courierRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/upload", uploadRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Lipoma Removal Spray E-Commerce API",
    time: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// SPA wildcard fallback
app.get("*", (req, res) => {
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: "Route not found" });
  }
});

// Start Server
async function startServer() {
  await connectDB();
  await runSeed();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const fallbackPort = Number(PORT) + 1;
      console.warn(`Port ${PORT} is in use. Retrying on port ${fallbackPort}...`);
      app.listen(fallbackPort, "0.0.0.0", () => {
        console.log(`Server is running smoothly on http://localhost:${fallbackPort}`);
      });
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer();
