import mongoose from "mongoose";
import { isMongoDBActive, getFallbackDb, saveFallbackDb } from "../db/connection.js";

const packageVariantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  bottles: { type: Number, default: 1 },
  regularPrice: { type: Number, required: true },
  price: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  sku: { type: String, default: "" },
  stock: { type: Number, default: 50 },
  badge: { type: String, default: "" },
  image: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, default: "South Moon" },
    description: { type: String, default: "" },
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    sku: { type: String, default: "LIP-001" },
    stock: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    mainImage: { type: String, required: true },
    galleryImages: [{ type: String }],
    packages: [packageVariantSchema],
    specifications: [
      {
        label: { type: String },
        value: { type: String }
      }
    ],
    ingredients: { type: String, default: "" },
    usageInstructions: { type: String, default: "" },
    warnings: { type: String, default: "" },
    medicalDisclaimer: { type: String, default: "" }
  },
  { timestamps: true }
);

const MongooseProduct = mongoose.models.Product || mongoose.model("Product", productSchema);

export const Product = {
  async find(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseProduct.find(query).lean();
    }
    const db = getFallbackDb();
    let res = [...db.products];
    if (query.slug) res = res.filter((p) => p.slug === query.slug);
    if (query.isActive !== undefined) res = res.filter((p) => p.isActive === query.isActive);
    return res;
  },

  async findOne(query) {
    if (isMongoDBActive()) {
      return await MongooseProduct.findOne(query).lean();
    }
    const db = getFallbackDb();
    if (query._id) return db.products.find((p) => p._id === query._id) || null;
    if (query.slug) return db.products.find((p) => p.slug === query.slug) || null;
    return db.products[0] || null;
  },

  async findById(id) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseProduct.findById(id).lean();
      }
      return await MongooseProduct.findOne({ slug: id }).lean();
    }
    const db = getFallbackDb();
    return db.products.find((p) => p._id === id || p.id === id || p.slug === id) || null;
  },

  async create(data) {
    if (isMongoDBActive()) {
      const payload = { ...data };
      if (payload._id && typeof payload._id === "string" && !mongoose.isValidObjectId(payload._id)) {
        delete payload._id;
      }
      const created = await MongooseProduct.create(payload);
      return created.toObject();
    }
    const doc = {
      ...data,
      _id: data._id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getFallbackDb();
    db.products.push(doc);
    saveFallbackDb();
    return doc;
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseProduct.findByIdAndUpdate(id, update, options).lean();
      }
      return await MongooseProduct.findOneAndUpdate({ slug: id }, update, options).lean();
    }
    const db = getFallbackDb();
    const idx = db.products.findIndex((p) => p._id === id || p.id === id || p.slug === id);
    if (idx === -1) return null;
    db.products[idx] = {
      ...db.products[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    saveFallbackDb();
    return db.products[idx];
  },

  async findOneAndUpdate(query, update, options = { new: true, upsert: false }) {
    if (isMongoDBActive()) {
      return await MongooseProduct.findOneAndUpdate(query, update, options).lean();
    }
    const db = getFallbackDb();
    const idx = db.products.findIndex((p) => {
      if (query._id) return p._id === query._id;
      if (query.slug) return p.slug === query.slug;
      return false;
    });
    if (idx !== -1) {
      db.products[idx] = { ...db.products[idx], ...update, updatedAt: new Date().toISOString() };
      saveFallbackDb();
      return db.products[idx];
    }
    if (options.upsert) {
      return await this.create({ ...query, ...update });
    }
    return null;
  },

  async deleteOne(query) {
    if (isMongoDBActive()) {
      return await MongooseProduct.deleteOne(query);
    }
    const db = getFallbackDb();
    const idx = db.products.findIndex((p) => (query._id && p._id === query._id) || (query.slug && p.slug === query.slug));
    if (idx !== -1) {
      db.products.splice(idx, 1);
      saveFallbackDb();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
};

