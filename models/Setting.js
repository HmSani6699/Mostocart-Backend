import mongoose from "mongoose";
import { isMongoDBActive, getFallbackDb, saveFallbackDb } from "../db/connection.js";

const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "Nobonir Online Shop" },
    tagline: { type: String, default: "Trusted Health & Wellness Products in Bangladesh" },
    hotline: { type: String, default: "01905-761214" },
    whatsappNumber: { type: String, default: "01905761214" },
    email: { type: String, default: "contact@nobonir.com" },
    address: { type: String, default: "House 24, Road 5, Dhanmondi, Dhaka 1205" },
    deliveryInsideDhaka: { type: Number, default: 70 },
    deliveryOutsideDhaka: { type: Number, default: 120 },
    courierApiKey: { type: String, default: "demo_api_key" },
    courierSecretKey: { type: String, default: "demo_secret_key" },
    defaultCourier: { type: String, default: "Steadfast" }
  },
  { timestamps: true }
);

const MongooseSetting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

export const Setting = {
  async getSettings() {
    if (isMongoDBActive()) {
      let doc = await MongooseSetting.findOne().lean();
      if (!doc) {
        doc = await MongooseSetting.create({});
        return doc.toObject ? doc.toObject() : doc;
      }
      return doc;
    }
    const db = getFallbackDb();
    if (!db.settings || Object.keys(db.settings).length === 0) {
      db.settings = {
        storeName: "Nobonir Online Shop",
        tagline: "Trusted Health & Wellness Products in Bangladesh",
        hotline: "01905-761214",
        whatsappNumber: "01905761214",
        email: "contact@nobonir.com",
        address: "House 24, Road 5, Dhanmondi, Dhaka 1205",
        deliveryInsideDhaka: 70,
        deliveryOutsideDhaka: 120,
        defaultCourier: "Steadfast"
      };
      saveFallbackDb();
    }
    return db.settings;
  },

  async updateSettings(update) {
    if (isMongoDBActive()) {
      let doc = await MongooseSetting.findOneAndUpdate({}, update, { new: true, upsert: true }).lean();
      return doc;
    }
    const db = getFallbackDb();
    db.settings = { ...db.settings, ...update };
    saveFallbackDb();
    return db.settings;
  }
};

