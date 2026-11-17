import { Review } from "../models/Review.js";

export const getApprovedReviews = async (req, res) => {
  try {
    const { productId = "lipoma-removal-spray" } = req.query;
    const reviews = await Review.find({ productId, isApproved: true });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitReview = async (req, res) => {
  try {
    const { customerName, phone, rating, comment, packageBought, district } = req.body;

    if (!customerName || !comment) {
      return res.status(400).json({ success: false, message: "নাম এবং রিভিউ লেখা আবশ্যক।" });
    }

    const newReview = await Review.create({
      productId: "lipoma-removal-spray",
      customerName: customerName.trim(),
      phone: phone || "",
      district: district || "ঢাকা",
      rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
      comment: comment.trim(),
      packageBought: packageBought || "Combo 3 (3 Bottles)",
      isVerifiedBuyer: true,
      isApproved: false // Requires admin moderation
    });

    res.status(201).json({
      success: true,
      message: "আপনার রিভিউ সফলভাবে জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের পর প্রদর্শিত হবে।",
      data: newReview
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const updated = await Review.findByIdAndUpdate(id, { isApproved }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, data: updated, message: "Review status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.deleteOne({ _id: id });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

