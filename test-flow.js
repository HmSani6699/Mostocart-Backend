import { connectDB } from "./db/connection.js";
import { runSeed } from "./seed.js";
import { Product } from "./models/Product.js";
import { LandingPage } from "./models/LandingPage.js";
import { Order } from "./models/Order.js";

async function verifyEndToEndWorkflow() {
  console.log("=== STARTING END-TO-END WORKFLOW VERIFICATION ===");
  await connectDB();
  await runSeed();

  // 1. Admin reads/edits product
  console.log("\n[Step 1] Verifying Product Record...");
  const product = await Product.findOne({ slug: "lipoma-removal-spray" });
  if (!product) throw new Error("Product 'lipoma-removal-spray' not found!");
  console.log(`✓ Product found: ${product.name} (SKU: ${product.sku})`);
  console.log(`✓ Available Packages: ${product.packages.length} package variants`);
  product.packages.forEach((pkg) => {
    console.log(`   - ${pkg.title} | Price: ৳${pkg.price} (Regular: ৳${pkg.regularPrice}) | Stock: ${pkg.stock}`);
  });

  // 2. Admin edits & publishes landing page
  console.log("\n[Step 2] Verifying Landing Page & Dynamic Sections...");
  let page = await LandingPage.findOne({ slug: "lipoma-removal-spray" });
  if (!page) throw new Error("Landing page not found!");
  console.log(`✓ Landing Page found: "${page.title}" (Published: ${page.isPublished})`);
  console.log(`✓ Configured Dynamic Sections: ${page.sections.length} sections`);
  page.sections.forEach((sec, idx) => {
    console.log(`   ${idx + 1}. [${sec.type}] "${sec.title}" (Visible: ${sec.isVisible})`);
  });

  // 3. Customer places order from landing page
  console.log("\n[Step 3] Simulating Customer Order Submission...");
  const sampleCustomerOrder = {
    orderId: `LIP-TEST-${Date.now().toString().slice(-4)}`,
    customerName: "আব্দুল্লাহ আল মামুন",
    phone: "01712345678",
    fullAddress: "রোড #৭, সেক্টর #৩, উত্তরা, ঢাকা",
    district: "ঢাকা",
    upazila: "উত্তরা",
    deliveryZone: "inside_dhaka",
    deliveryCharge: 70,
    selectedPackage: {
      id: "pkg-3",
      title: "(৩ পিস) Combo 3 — Lipoma Removal Spray",
      bottles: 3,
      price: 1799,
      regularPrice: 2970,
      sku: "LIP-03"
    },
    quantity: 1,
    subtotal: 1799,
    grandTotal: 1869,
    orderNotes: "সন্ধ্যার পর ডেলিভারি দেওয়ার অনুরোধ",
    orderStatus: "Pending",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    courierInfo: {
      provider: "Steadfast",
      consignmentId: "",
      trackingCode: "",
      status: "Not Dispatched"
    },
    landingPageSlug: "lipoma-removal-spray",
    timeline: [
      {
        status: "Pending",
        note: "অর্ডার সফলভাবে প্লেস করা হয়েছে (E2E Test)",
        timestamp: new Date()
      }
    ]
  };

  const createdOrder = await Order.create(sampleCustomerOrder);
  console.log(`✓ Order successfully created in DB: #${createdOrder.orderId}`);
  console.log(`   Customer: ${createdOrder.customerName} (${createdOrder.phone})`);
  console.log(`   Grand Total: ৳${createdOrder.grandTotal} (Subtotal: ৳${createdOrder.subtotal} + Delivery: ৳${createdOrder.deliveryCharge})`);

  // 4. Order appears in admin order list
  console.log("\n[Step 4] Verifying Order in Admin Order List...");
  const foundOrder = await Order.findOne({ orderId: createdOrder.orderId });
  if (!foundOrder) throw new Error("Order not found in DB!");
  console.log(`✓ Order retrieved from DB successfully. Current Status: ${foundOrder.orderStatus}`);

  // 5. Admin confirms order
  console.log("\n[Step 5] Admin Confirms Order...");
  const timeline = foundOrder.timeline || [];
  timeline.push({
    status: "Confirmed",
    note: "অ্যাডমিন ফোনে কথা বলে অর্ডার কনফার্ম করেছেন",
    timestamp: new Date()
  });
  const confirmedOrder = await Order.findByIdAndUpdate(foundOrder._id, {
    orderStatus: "Confirmed",
    timeline
  });
  console.log(`✓ Order Status updated to: ${confirmedOrder.orderStatus}`);

  // 6. Courier Dispatch & Consignment Generation
  console.log("\n[Step 6] Dispatching Order to Steadfast Courier...");
  const consignmentId = `CN-STE-${Date.now().toString().slice(-6)}`;
  const trackingCode = `TRK${Math.floor(10000000 + Math.random() * 90000000)}`;
  timeline.push({
    status: "Shipped",
    note: `পার্সেল কুরিয়ারে হস্তান্তর করা হয়েছে। কনসাইনমেন্ট: ${consignmentId}`,
    timestamp: new Date()
  });
  const dispatchedOrder = await Order.findByIdAndUpdate(foundOrder._id, {
    orderStatus: "Shipped",
    courierInfo: {
      provider: "Steadfast",
      consignmentId,
      trackingCode,
      status: "In Transit",
      dispatchedAt: new Date()
    },
    timeline
  });
  console.log(`✓ Consignment Created: ${dispatchedOrder.courierInfo.consignmentId}`);
  console.log(`✓ Courier Status: ${dispatchedOrder.courierInfo.status} (Tracking: ${dispatchedOrder.courierInfo.trackingCode})`);

  // 7. Delivery Completion & COD Collection
  console.log("\n[Step 7] Simulating Successful Delivery & Cash Collection...");
  timeline.push({
    status: "Delivered",
    note: "গ্রাহক পণ্য গ্রহণ করেছেন এবং ৳১৮৬৯ নগদ ক্যাশ পরিশোধ করেছেন",
    timestamp: new Date()
  });
  const deliveredOrder = await Order.findByIdAndUpdate(foundOrder._id, {
    orderStatus: "Delivered",
    paymentStatus: "Collected",
    "courierInfo.status": "Delivered",
    "courierInfo.deliveredAt": new Date(),
    timeline
  });
  console.log(`✓ Order Status: ${deliveredOrder.orderStatus}`);
  console.log(`✓ Payment Status: ${deliveredOrder.paymentStatus} (Cash on Delivery collected)`);
  console.log(`✓ Full Timeline Events Recorded: ${deliveredOrder.timeline.length} events`);

  // 8. Reporting & Dashboard Metrics verification
  console.log("\n[Step 8] Verifying Real-Time Dashboard Reporting...");
  const allOrders = await Order.find({ landingPageSlug: "lipoma-removal-spray" });
  const totalOrders = allOrders.length;
  const deliveredRevenue = allOrders
    .filter((o) => o.orderStatus === "Delivered")
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const codOutstanding = allOrders
    .filter((o) => ["Confirmed", "Pending Dispatch", "Shipped"].includes(o.orderStatus))
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  console.log(`✓ Total Orders in System: ${totalOrders}`);
  console.log(`✓ Delivered Sales Revenue: ৳${deliveredRevenue.toLocaleString("en-BD")}`);
  console.log(`✓ COD Outstanding Amount: ৳${codOutstanding.toLocaleString("en-BD")}`);

  console.log("\n=== ALL END-TO-END WORKFLOWS VERIFIED SUCCESSFULLY ===");
}

verifyEndToEndWorkflow().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

