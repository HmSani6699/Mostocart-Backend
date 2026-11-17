import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

export const getDashboardStats = async (req, res) => {
  try {
    const { slug = "lipoma-removal-spray" } = req.query;

    const allOrders = await Order.find();
    const product = await Product.findOne({ slug }) || await Product.findOne({ slug: "lipoma-removal-spray" });

    // Filter orders for product / landing page
    const productOrders = allOrders.filter(
      (o) => !slug || o.landingPageSlug === slug || o.selectedPackage?.title?.toLowerCase().includes("lipoma")
    );

    // Order status counts
    const totalOrders = productOrders.length;
    const newOrders = productOrders.filter((o) => o.orderStatus === "Pending").length;
    const confirmedOrders = productOrders.filter((o) => o.orderStatus === "Confirmed").length;
    const pendingDispatch = productOrders.filter((o) => o.orderStatus === "Pending Dispatch").length;
    const shippedOrders = productOrders.filter((o) => o.orderStatus === "Shipped").length;
    const deliveredOrders = productOrders.filter((o) => o.orderStatus === "Delivered").length;
    const cancelledOrders = productOrders.filter((o) => o.orderStatus === "Cancelled").length;
    const returnedOrders = productOrders.filter((o) => o.orderStatus === "Returned").length;

    // Financial calculations
    const deliveredSalesValue = productOrders
      .filter((o) => o.orderStatus === "Delivered")
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // COD Outstanding = orders that are Confirmed, Pending Dispatch, or Shipped (awaiting collection)
    const codOutstanding = productOrders
      .filter((o) => ["Confirmed", "Pending Dispatch", "Shipped"].includes(o.orderStatus))
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    const totalPotentialSales = productOrders
      .filter((o) => !["Cancelled", "Returned"].includes(o.orderStatus))
      .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Package-wise sales breakdown
    const packageStats = {};
    if (product && product.packages) {
      product.packages.forEach((pkg) => {
        packageStats[pkg.id] = {
          id: pkg.id,
          title: pkg.title,
          bottles: pkg.bottles,
          price: pkg.price,
          count: 0,
          revenue: 0,
          stock: pkg.stock || 0
        };
      });
    }

    productOrders.forEach((o) => {
      const pkgId = o.selectedPackage?.id;
      if (pkgId && packageStats[pkgId]) {
        packageStats[pkgId].count += o.quantity || 1;
        packageStats[pkgId].revenue += (o.selectedPackage.price || 0) * (o.quantity || 1);
      }
    });

    // Total Inventory Remaining
    const totalInventoryRemaining = product
      ? (product.packages || []).reduce((sum, p) => sum + (p.stock || 0), product.stock || 0)
      : 0;

    // Recent orders (last 6)
    const recentOrders = productOrders.slice(0, 6);

    // Daily breakdown for the last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOrders = productOrders.filter((o) => o.createdAt && o.createdAt.startsWith(dateStr));
      const dayRevenue = dayOrders
        .filter((o) => !["Cancelled", "Returned"].includes(o.orderStatus))
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

      last7Days.push({
        date: dateStr,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        orders: dayOrders.length,
        revenue: dayRevenue
      });
    }

    res.json({
      success: true,
      data: {
        product: {
          name: product?.name || "Lipoma Removal Spray",
          slug: product?.slug || "lipoma-removal-spray",
          sku: product?.sku || "LIP-001"
        },
        counts: {
          totalOrders,
          newOrders,
          confirmedOrders,
          pendingDispatch,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          returnedOrders
        },
        financials: {
          deliveredSalesValue,
          codOutstanding,
          totalPotentialSales,
          totalInventoryRemaining
        },
        packageWiseSales: Object.values(packageStats),
        recentOrders,
        last7Days
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

