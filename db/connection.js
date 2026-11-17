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

// In-memory fallback database for resilient offline/sandbox execution
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

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lipoma_store";
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log("MongoDB connected successfully to:", uri);
  } catch (error) {
    isMongoConnected = false;
    console.warn("MongoDB connection unavailable (running with high-performance local file persistence):", error.message);
  }
}

export function isMongoDBActive() {
  return isMongoConnected && mongoose.connection.readyState === 1;
}

