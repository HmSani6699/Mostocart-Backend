import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB, isMongoDBActive } from "./db/connection.js";
import { runSeed } from "./seed.js";
import { isCloudinaryConfigured } from "./utils/cloudinary.js";

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
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(morgan("dev"));

// Ensure DB connection is active before processing any API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error in middleware:", err.message);
  }
  next();
});

// Static File Serving
try {
  const uploadsDir = path.join(__dirname, "uploads");
  if (fs.existsSync(uploadsDir)) {
    app.use("/uploads", express.static(uploadsDir));
  }
  const frontendImages = path.join(__dirname, "..", "Frontend", "public", "images");
  if (fs.existsSync(frontendImages)) {
    app.use("/images", express.static(frontendImages));
  }
  const frontendDist = path.join(__dirname, "..", "Frontend", "dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
  }
} catch {
  // Ignore in serverless environment
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
    database: isMongoDBActive() ? "MongoDB (Active)" : "Local Fallback",
    cloudinary: isCloudinaryConfigured() ? "Cloudinary (Active)" : "Local Fallback",
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
  const frontendDist = path.join(__dirname, "..", "Frontend", "dist");
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: "Route not found" });
  }
});

// Start Server (only when run locally, not in Vercel serverless environment)
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

if (!process.env.VERCEL) {
  startServer();
}

export default app;
