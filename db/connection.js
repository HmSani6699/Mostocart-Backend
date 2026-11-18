import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let isMongoConnected = false;

// Ensure local data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
    console.error("Error writing fallback db.json:", err.message);
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

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lipoma_store";
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB at:", uri);

    // Sync any existing file data to MongoDB if MongoDB collections are brand new
    await syncFallbackToMongoDB();
  } catch (error) {
    isMongoConnected = false;
    console.warn(
      `⚠️ Local MongoDB not reachable at ${uri} (${error.message}).\n` +
      `   Using resilient fallback local persistence.\n` +
      `   To use MongoDB: Ensure MongoDB Community Server is started on localhost:27017`
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
