import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let isMongoConnected = false;

// Ensure local data directory exists (safely handle read-only environments like Vercel)
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Read-only serverless filesystem, ignore
}

// In-memory fallback database for offline/fallback execution
let memoryDb = {
  products: [],
  landingPages: [],
  orders: [],
  reviews: [],
  settings: {}
};

// Load saved data if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    memoryDb = JSON.parse(raw);
  } catch (err) {
    console.error("Error reading fallback db.json:", err.message);
  }
}

export function saveFallbackDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
  } catch (err) {
    // Read-only filesystem on Vercel, keep data in memory
  }
}

export function getFallbackDb() {
  return memoryDb;
}

// Set up connection event listeners
mongoose.connection.on("connected", () => {
  isMongoConnected = true;
  console.log("✅ MongoDB connection established successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("⚠️ MongoDB disconnected.");
});

// Cache connection promise for serverless functions
let cachedPromise = null;
let hasSynced = false;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return;
  }

  if (cachedPromise) {
    try {
      await cachedPromise;
      isMongoConnected = mongoose.connection.readyState === 1;
      return;
    } catch {
      cachedPromise = null;
    }
  }

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lipoma_store";

  // In Vercel serverless, skip localhost connection if MONGODB_URI is not set to prevent timeouts
  if (process.env.VERCEL && !process.env.MONGODB_URI) {
    console.warn(
      "⚠️ MONGODB_URI is not set in Vercel Environment Variables!\n" +
      "   Please add MONGODB_URI in your Vercel Project Settings."
    );
    isMongoConnected = false;
    return;
  }

  try {
    mongoose.set("strictQuery", false);
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5s timeout to avoid Vercel 10s invocation kill
      bufferCommands: false
    });
    await cachedPromise;
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB");

    // Sync any existing file data to MongoDB if MongoDB collections are brand new (only once)
    if (!hasSynced) {
      hasSynced = true;
      syncFallbackToMongoDB().catch((err) => console.error("Sync error:", err.message));
    }
  } catch (error) {
    cachedPromise = null;
    isMongoConnected = false;
    console.warn(
      `⚠️ MongoDB connection error: ${error.message}\n` +
      `   Using resilient fallback local persistence.`
    );
  }
}

export function isMongoDBActive() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

/**
 * Automatically migrate db.json data into MongoDB if MongoDB collections are currently empty
 */
async function syncFallbackToMongoDB() {
  try {
    const { MongooseProduct } = await import("../models/Product.js");
    const { MongooseLandingPage } = await import("../models/LandingPage.js");
    const { MongooseOrder } = await import("../models/Order.js");
    const { MongooseReview } = await import("../models/Review.js");
    const { MongooseSetting } = await import("../models/Setting.js");

    const productCount = await MongooseProduct.countDocuments();
    if (productCount === 0 && memoryDb.products?.length > 0) {
      console.log(`📦 Syncing ${memoryDb.products.length} products to MongoDB...`);
      for (const p of memoryDb.products) {
        const doc = { ...p };
        if (doc._id && !mongoose.isValidObjectId(doc._id)) delete doc._id;
        await MongooseProduct.create(doc);
      }
    }

    const landingCount = await MongooseLandingPage.countDocuments();
    if (landingCount === 0 && memoryDb.landingPages?.length > 0) {
      console.log(`📄 Syncing ${memoryDb.landingPages.length} landing pages to MongoDB...`);
      for (const lp of memoryDb.landingPages) {
        const doc = { ...lp };
        if (doc._id && !mongoose.isValidObjectId(doc._id)) delete doc._id;
        await MongooseLandingPage.create(doc);
      }
    }

    const orderCount = await MongooseOrder.countDocuments();
    if (orderCount === 0 && memoryDb.orders?.length > 0) {
      console.log(`🛍️ Syncing ${memoryDb.orders.length} orders to MongoDB...`);
      for (const ord of memoryDb.orders) {
        const doc = { ...ord };
        if (doc._id && !mongoose.isValidObjectId(doc._id)) delete doc._id;
        await MongooseOrder.create(doc);
      }
    }

    const reviewCount = await MongooseReview.countDocuments();
    if (reviewCount === 0 && memoryDb.reviews?.length > 0) {
      console.log(`⭐ Syncing ${memoryDb.reviews.length} reviews to MongoDB...`);
      for (const rev of memoryDb.reviews) {
        const doc = { ...rev };
        if (doc._id && !mongoose.isValidObjectId(doc._id)) delete doc._id;
        await MongooseReview.create(doc);
      }
    }

    const settingDoc = await MongooseSetting.findOne();
    if (!settingDoc && memoryDb.settings && Object.keys(memoryDb.settings).length > 0) {
      console.log("⚙️ Syncing store settings to MongoDB...");
      const doc = { ...memoryDb.settings };
      if (doc._id && !mongoose.isValidObjectId(doc._id)) delete doc._id;
      await MongooseSetting.create(doc);
    }
  } catch (err) {
    console.error("Note during MongoDB data sync:", err.message);
  }
}

export { mongoose };
