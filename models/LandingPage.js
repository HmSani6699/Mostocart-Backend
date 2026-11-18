import mongoose from "mongoose";
import { isMongoDBActive, getFallbackDb, saveFallbackDb } from "../db/connection.js";

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // announcement, hero, countdown, video, gallery, benefits, trustBadges, reviews, orderForm, faq, medicalNotice, footer
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  styles: {
    backgroundColor: { type: String, default: "" },
    textColor: { type: String, default: "" },
    paddingY: { type: String, default: "py-12" }
  },
  content: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const landingPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    isPublished: { type: Boolean, default: true },
    theme: {
      primaryColor: { type: String, default: "#F45100" },
      darkTextColor: { type: String, default: "#26394B" },
      backgroundColor: { type: String, default: "#F8F9FB" },
      whiteColor: { type: String, default: "#FFFFFF" }
    },
    sections: [sectionSchema],
    draftSections: [sectionSchema]
  },
  { timestamps: true }
);

const MongooseLandingPage = mongoose.models.LandingPage || mongoose.model("LandingPage", landingPageSchema);

export const LandingPage = {
  async find(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseLandingPage.find(query).lean();
    }
    const db = getFallbackDb();
    let res = [...db.landingPages];
    if (query.slug) res = res.filter((lp) => lp.slug === query.slug);
    if (query.isPublished !== undefined) res = res.filter((lp) => lp.isPublished === query.isPublished);
    return res;
  },

  async findOne(query) {
    if (isMongoDBActive()) {
      return await MongooseLandingPage.findOne(query).lean();
    }
    const db = getFallbackDb();
    if (query._id) return db.landingPages.find((lp) => lp._id === query._id) || null;
    if (query.slug) return db.landingPages.find((lp) => lp.slug === query.slug) || null;
    if (query.productId) return db.landingPages.find((lp) => lp.productId === query.productId) || null;
    return db.landingPages[0] || null;
  },

  async findById(id) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseLandingPage.findById(id).lean();
      }
      return await MongooseLandingPage.findOne({ slug: id }).lean();
    }
    const db = getFallbackDb();
    return db.landingPages.find((lp) => lp._id === id || lp.id === id || lp.slug === id) || null;
  },

  async create(data) {
    if (isMongoDBActive()) {
      const payload = { ...data };
      if (payload._id && typeof payload._id === "string" && !mongoose.isValidObjectId(payload._id)) {
        delete payload._id;
      }
      const created = await MongooseLandingPage.create(payload);
      return created.toObject();
    }
    const doc = {
      ...data,
      _id: data._id || `lp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getFallbackDb();
    db.landingPages.push(doc);
    saveFallbackDb();
    return doc;
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseLandingPage.findByIdAndUpdate(id, update, options).lean();
      }
      return await MongooseLandingPage.findOneAndUpdate({ slug: id }, update, options).lean();
    }
    const db = getFallbackDb();
    const idx = db.landingPages.findIndex((lp) => lp._id === id || lp.id === id || lp.slug === id);
    if (idx === -1) return null;
    db.landingPages[idx] = {
      ...db.landingPages[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    saveFallbackDb();
    return db.landingPages[idx];
  },

  async findOneAndUpdate(query, update, options = { new: true, upsert: false }) {
    if (isMongoDBActive()) {
      const updated = await MongooseLandingPage.findOneAndUpdate(query, update, options).lean();
      try {
        const db = getFallbackDb();
        const idx = db.landingPages.findIndex((lp) => (query._id && lp._id === query._id) || (query.slug && lp.slug === query.slug));
        if (idx !== -1) {
          db.landingPages[idx] = { ...db.landingPages[idx], ...update, updatedAt: new Date().toISOString() };
          saveFallbackDb();
        }
      } catch (e) {}
      return updated;
    }
    const db = getFallbackDb();
    const idx = db.landingPages.findIndex((lp) => {
      if (query._id) return lp._id === query._id;
      if (query.slug) return lp.slug === query.slug;
      return false;
    });
    if (idx !== -1) {
      db.landingPages[idx] = {
        ...db.landingPages[idx],
        ...update,
        updatedAt: new Date().toISOString()
      };
      saveFallbackDb();
      return db.landingPages[idx];
    }
    if (options.upsert) {
      return await this.create({ ...query, ...update });
    }
    return null;
  },

  async deleteOne(query) {
    if (isMongoDBActive()) {
      return await MongooseLandingPage.deleteOne(query);
    }
    const db = getFallbackDb();
    const idx = db.landingPages.findIndex((lp) => (query._id && lp._id === query._id) || (query.slug && lp.slug === query.slug));
    if (idx !== -1) {
      db.landingPages.splice(idx, 1);
      saveFallbackDb();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },

  async findByIdAndDelete(id) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseLandingPage.findByIdAndDelete(id).lean();
      }
      return await MongooseLandingPage.findOneAndDelete({ slug: id }).lean();
    }
    const db = getFallbackDb();
    const idx = db.landingPages.findIndex((lp) => lp._id === id || lp.id === id || lp.slug === id);
    if (idx === -1) return null;
    const removed = db.landingPages.splice(idx, 1)[0];
    saveFallbackDb();
    return removed;
  },

  async countDocuments(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseLandingPage.countDocuments(query);
    }
    const db = getFallbackDb();
    return db.landingPages.length;
  }
};

export { MongooseLandingPage };

