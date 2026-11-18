import mongoose from "mongoose";
import { isMongoDBActive, getFallbackDb, saveFallbackDb } from "../db/connection.js";

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    fullAddress: { type: String, required: true },
    district: { type: String, required: true },
    upazila: { type: String, default: "" },
    deliveryZone: {
      type: String,
      enum: ["inside_dhaka", "outside_dhaka"],
      default: "outside_dhaka"
    },
    deliveryCharge: { type: Number, required: true },
    selectedPackage: {
      id: { type: String, required: true },
      title: { type: String, required: true },
      bottles: { type: Number, default: 1 },
      price: { type: Number, required: true },
      regularPrice: { type: Number },
      sku: { type: String }
    },
    quantity: { type: Number, default: 1 },
    subtotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    orderNotes: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Pending Dispatch",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned"
      ],
      default: "Pending"
    },
    paymentMethod: { type: String, default: "Cash on Delivery" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Collected", "Refunded"],
      default: "Pending"
    },
    courierInfo: {
      provider: { type: String, default: "Steadfast" }, // Steadfast, Pathao, RedX, In-House
      consignmentId: { type: String, default: "" },
      trackingCode: { type: String, default: "" },
      status: { type: String, default: "Not Dispatched" },
      dispatchedAt: { type: Date },
      deliveredAt: { type: Date },
      notes: { type: String, default: "" }
    },
    landingPageSlug: { type: String, default: "lipoma-removal-spray" },
    timeline: [
      {
        status: { type: String },
        note: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const MongooseOrder = mongoose.models.Order || mongoose.model("Order", orderSchema);

export const Order = {
  async find(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseOrder.find(query).sort({ createdAt: -1 }).lean();
    }
    const db = getFallbackDb();
    let res = [...db.orders];
    if (query.orderStatus) res = res.filter((o) => o.orderStatus === query.orderStatus);
    if (query.landingPageSlug) res = res.filter((o) => o.landingPageSlug === query.landingPageSlug);
    return res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findOne(query) {
    if (isMongoDBActive()) {
      return await MongooseOrder.findOne(query).lean();
    }
    const db = getFallbackDb();
    if (query._id) return db.orders.find((o) => o._id === query._id) || null;
    if (query.orderId) return db.orders.find((o) => o.orderId === query.orderId) || null;
    return null;
  },

  async findById(id) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseOrder.findById(id).lean();
      }
      return await MongooseOrder.findOne({ orderId: id }).lean();
    }
    const db = getFallbackDb();
    return db.orders.find((o) => o._id === id || o.id === id || o.orderId === id) || null;
  },

  async create(data) {
    if (isMongoDBActive()) {
      const payload = { ...data };
      if (payload._id && typeof payload._id === "string" && !mongoose.isValidObjectId(payload._id)) {
        delete payload._id;
      }
      const created = await MongooseOrder.create(payload);
      return created.toObject();
    }
    const doc = {
      ...data,
      _id: data._id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const db = getFallbackDb();
    db.orders.unshift(doc);
    saveFallbackDb();
    return doc;
  },

  async findByIdAndUpdate(id, update, options = { new: true }) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseOrder.findByIdAndUpdate(id, update, options).lean();
      }
      return await MongooseOrder.findOneAndUpdate({ orderId: id }, update, options).lean();
    }
    const db = getFallbackDb();
    const idx = db.orders.findIndex((o) => o._id === id || o.id === id || o.orderId === id);
    if (idx === -1) return null;
    db.orders[idx] = {
      ...db.orders[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    saveFallbackDb();
    return db.orders[idx];
  },

  async findByIdAndDelete(id) {
    if (isMongoDBActive()) {
      if (mongoose.isValidObjectId(id)) {
        return await MongooseOrder.findByIdAndDelete(id).lean();
      }
      return await MongooseOrder.findOneAndDelete({ orderId: id }).lean();
    }
    const db = getFallbackDb();
    const idx = db.orders.findIndex((o) => o._id === id || o.id === id || o.orderId === id);
    if (idx === -1) return null;
    const removed = db.orders.splice(idx, 1)[0];
    saveFallbackDb();
    return removed;
  },

  async countDocuments(query = {}) {
    if (isMongoDBActive()) {
      return await MongooseOrder.countDocuments(query);
    }
    const db = getFallbackDb();
    let res = [...db.orders];
    if (query.orderStatus) res = res.filter((o) => o.orderStatus === query.orderStatus);
    return res.length;
  }
};

export { MongooseOrder };

