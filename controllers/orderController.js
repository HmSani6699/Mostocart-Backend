import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Setting } from "../models/Setting.js";

// Validate Bangladesh phone numbers (11 digits starting with 013-019)
function isValidBDPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  // Matches 01XXXXXXXXX or 8801XXXXXXXXX
  const regex = /^(?:\+?880|880|0)?1[3-9]\d{8}$/;
  return regex.test(cleaned);
}

function normalizeBDPhone(phone) {
  let cleaned = phone.replace(/[\s\-\+]/g, "");
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.substring(2);
  } else if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

export const createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      fullAddress,
      district,
      upazila,
      deliveryZone,
      packageId,
      quantity = 1,
      orderNotes,
      landingPageSlug = "lipoma-removal-spray"
    } = req.body;

    // 1. Validation
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: "অনুগ্রহ করে আপনার নাম প্রদান করুন।" });
    }

    if (!isValidBDPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।"
      });
    }

    if (!fullAddress || !fullAddress.trim()) {
      return res.status(400).json({ success: false, message: "অনুগ্রহ করে বিস্তারিত ঠিকানা প্রদান করুন।" });
    }

    if (!district || !district.trim()) {
      return res.status(400).json({ success: false, message: "অনুগ্রহ করে জেলা নির্বাচন করুন।" });
    }

    // 2. Fetch Product & Validate Package
    const product = await Product.findOne({ slug: landingPageSlug }) || await Product.findOne({ slug: "lipoma-removal-spray" });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let selectedPkg = product.packages.find((p) => p.id === packageId);
    if (!selectedPkg) {
      // Default to featured or first package
      selectedPkg = product.packages.find((p) => p.isFeatured) || product.packages[0];
    }

    // 3. Determine Delivery Fee & Calculate Backend Total
    const settings = await Setting.getSettings();
    const isInsideDhaka = deliveryZone === "inside_dhaka" || district.toLowerCase().includes("dhaka") || district === "ঢাকা";
    const deliveryCharge = isInsideDhaka
      ? (settings.deliveryInsideDhaka || 70)
      : (settings.deliveryOutsideDhaka || 120);

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const subtotal = selectedPkg.price * qty;
    const grandTotal = subtotal + deliveryCharge;

    // 4. Generate Unique Order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const orderId = `LIP-${datePrefix}-${randomSuffix}`;

    // 5. Create Order Document
    const orderDoc = {
      orderId,
      customerName: customerName.trim(),
      phone: normalizeBDPhone(phone),
      fullAddress: fullAddress.trim(),
      district: district.trim(),
      upazila: (upazila || "").trim(),
      deliveryZone: isInsideDhaka ? "inside_dhaka" : "outside_dhaka",
      deliveryCharge,
      selectedPackage: {
        id: selectedPkg.id,
        title: selectedPkg.title,
        bottles: selectedPkg.bottles,
        price: selectedPkg.price,
        regularPrice: selectedPkg.regularPrice,
        sku: selectedPkg.sku
      },
      quantity: qty,
      subtotal,
      grandTotal,
      orderNotes: (orderNotes || "").trim(),
      orderStatus: "Pending",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      courierInfo: {
        provider: settings.defaultCourier || "Steadfast",
        consignmentId: "",
        trackingCode: "",
        status: "Not Dispatched",
        notes: ""
      },
      landingPageSlug,
      timeline: [
        {
          status: "Pending",
          note: "কাস্টমার কর্তৃক অর্ডার সফলভাবে প্লেস করা হয়েছে।",
          timestamp: new Date()
        }
      ]
    };

    const newOrder = await Order.create(orderDoc);

    // 6. Deduct product/package inventory
    try {
      const updatedPackages = product.packages.map((pkg) => {
        if (pkg.id === selectedPkg.id) {
          return { ...pkg, stock: Math.max(0, (pkg.stock || 50) - qty) };
        }
        return pkg;
      });
      await Product.findByIdAndUpdate(product._id, {
        packages: updatedPackages,
        stock: Math.max(0, (product.stock || 100) - qty)
      });
    } catch (invErr) {
      console.warn("Inventory update warning:", invErr.message);
    }

    res.status(201).json({
      success: true,
      message: "আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে!",
      data: newOrder
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, search, limit = 100 } = req.query;
    let orders = await Order.find();

    if (status && status !== "All") {
      orders = orders.filter((o) => o.orderStatus === status);
    }

    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: orders.slice(0, parseInt(limit, 10)),
      total: orders.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id }) || await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "অর্ডারটি পাওয়া যায়নি।" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, paymentStatus } = req.body;

    const order = await Order.findOne({ orderId: id }) || await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const timeline = order.timeline || [];
    if (status && status !== order.orderStatus) {
      timeline.push({
        status,
        note: note || `অর্ডার স্ট্যাটাস পরিবর্তিত হয়েছে: ${status}`,
        timestamp: new Date()
      });
    }

    const update = {
      orderStatus: status || order.orderStatus,
      timeline
    };

    if (paymentStatus) {
      update.paymentStatus = paymentStatus;
    }

    if (status === "Delivered") {
      update.paymentStatus = "Collected";
      update["courierInfo.status"] = "Delivered";
      update["courierInfo.deliveredAt"] = new Date();
    }

    const updated = await Order.findByIdAndUpdate(order._id, update, { new: true });
    res.json({ success: true, data: updated, message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const dispatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierProvider = "Steadfast", trackingCode, note } = req.body;

    const order = await Order.findOne({ orderId: id }) || await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const generatedConsignmentId = `CN-${courierProvider.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const finalTracking = trackingCode || `TRK${Math.floor(10000000 + Math.random() * 90000000)}`;

    const timeline = order.timeline || [];
    timeline.push({
      status: "Shipped",
      note: note || `অর্ডারটি কুরিয়ারে হস্তান্তর করা হয়েছে (${courierProvider})। কনসাইনমেন্ট: ${generatedConsignmentId}`,
      timestamp: new Date()
    });

    const update = {
      orderStatus: "Shipped",
      courierInfo: {
        provider: courierProvider,
        consignmentId: generatedConsignmentId,
        trackingCode: finalTracking,
        status: "In Transit",
        dispatchedAt: new Date(),
        notes: note || ""
      },
      timeline
    };

    const updated = await Order.findByIdAndUpdate(order._id, update, { new: true });
    res.json({ success: true, data: updated, message: "Order successfully dispatched to courier" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

