import mongoose from "mongoose";
import { isMongoDBActive, getFallbackDb, saveFallbackDb } from "../db/connection.js";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    customerName: { type: String, required: true },
    phone: { type: String, default: "" },
    district: { type: String, default: "ঢাকা" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, required: true },
    packageBought: { type: String, default: "Combo 3 (3 Bottles)" },
    isVerifiedBuyer: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    avatar: { type: String, default: "" }
  },
  { timestamps: true }
);

const MongooseReview = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export const Review = {
  async find(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseReview.find(query).sort({ createdAt: -1 }).lean();
    }
    const db = getFallbackDb();
    let res = [...db.reviews];
    if (query.productId) res = res.filter((r) => r.productId === query.productId);
    if (query.isApproved !== undefined) res = res.filter((r) => r.isApproved === query.isApproved);
    return res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create(data) {
    if (isMongoDBActive()) {
      const payload = { ...data };
      if (payload._id && typeof payload._id === "string" && !mongoose.isValidObjectId(payload._id)) {
        delete payload._id;
      }
      const created = await MongooseReview.create(payload);
      return created.toObject();
    }
    const doc = {
      ...data,
      _id: data._id || `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getFallbackDb();
    db.reviews.unshift(doc);
    saveFallbackDb();
    return doc;
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    if (isMongoDBActive()) {
      return await MongooseReview.findByIdAndUpdate(id, update, options).lean();
    }
    const db = getFallbackDb();
    const idx = db.reviews.findIndex((r) => r._id === id || r.id === id);
    if (idx === -1) return null;
    db.reviews[idx] = {
      ...db.reviews[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    saveFallbackDb();
    return db.reviews[idx];
  },

  async deleteOne(query) {
    if (isMongoDBActive()) {
      return await MongooseReview.deleteOne(query);
    }
    const db = getFallbackDb();
    const idx = db.reviews.findIndex((r) => (query._id && r._id === query._id));
    if (idx !== -1) {
      db.reviews.splice(idx, 1);
      saveFallbackDb();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  },

  async findById(id) {
    if (isMongoDBActive()) {
      return await MongooseReview.findById(id).lean();
    }
    const db = getFallbackDb();
    return db.reviews.find((r) => r._id === id || r.id === id) || null;
  },

  async findByIdAndDelete(id) {
    if (isMongoDBActive()) {
      return await MongooseReview.findByIdAndDelete(id).lean();
    }
    const db = getFallbackDb();
    const idx = db.reviews.findIndex((r) => r._id === id || r.id === id);
    if (idx === -1) return null;
    const removed = db.reviews.splice(idx, 1)[0];
    saveFallbackDb();
    return removed;
  },

  async countDocuments(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseReview.countDocuments(query);
    }
    const db = getFallbackDb();
    return db.reviews.length;
  }
};

export { MongooseReview };

