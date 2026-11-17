import { Order } from "../models/Order.js";

const COURIER_PROVIDERS = [
  { id: "Steadfast", name: "Steadfast Courier", logo: "📦", apiEnabled: true },
  { id: "Pathao", name: "Pathao Courier", logo: "🛵", apiEnabled: true },
  { id: "RedX", name: "RedX Logistics", logo: "🚚", apiEnabled: true },
  { id: "In-House", name: "In-House Delivery Fleet", logo: "🚲", apiEnabled: true }
];

export const getCourierProviders = (req, res) => {
  res.json({ success: true, data: COURIER_PROVIDERS });
};

export const createConsignment = async (req, res) => {
  try {
    const { orderId, provider = "Steadfast", instructions = "" } = req.body;
    const order = await Order.findOne({ orderId }) || await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const consignmentId = `CID-${provider.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const trackingCode = `TRK${Math.floor(10000000 + Math.random() * 90000000)}`;

    const timeline = order.timeline || [];
    timeline.push({
      status: "Shipped",
      note: `কনসাইনমেন্ট সফলভাবে তৈরি হয়েছে (${provider})। ট্র্যাকিং কোড: ${trackingCode}`,
      timestamp: new Date()
    });

    const update = {
      orderStatus: "Shipped",
      courierInfo: {
        provider,
        consignmentId,
        trackingCode,
        status: "In Transit",
        dispatchedAt: new Date(),
        notes: instructions
      },
      timeline
    };

    const updated = await Order.findByIdAndUpdate(order._id, update, { new: true });
    res.json({
      success: true,
      data: updated,
      message: `Consignment created successfully via ${provider}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrackingStatus = async (req, res) => {
  try {
    const { consignmentId, status, location = "Dhaka Hub" } = req.body;

    const allOrders = await Order.find();
    const order = allOrders.find((o) => o.courierInfo?.consignmentId === consignmentId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Consignment not found" });
    }

    const timeline = order.timeline || [];
    timeline.push({
      status: status === "Delivered" ? "Delivered" : "In Transit",
      note: `কুরিয়ার আপডেট (${order.courierInfo?.provider}): ${status} [${location}]`,
      timestamp: new Date()
    });

    const update = {
      "courierInfo.status": status,
      timeline
    };

    if (status === "Delivered") {
      update.orderStatus = "Delivered";
      update.paymentStatus = "Collected";
      update["courierInfo.deliveredAt"] = new Date();
    } else if (status === "Returned") {
      update.orderStatus = "Returned";
      update.paymentStatus = "Refunded";
    }

    const updated = await Order.findByIdAndUpdate(order._id, update, { new: true });
    res.json({ success: true, data: updated, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

