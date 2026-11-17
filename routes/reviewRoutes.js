import express from "express";
import {
  getApprovedReviews,
  getAllReviews,
  submitReview,
  moderateReview,
  deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/approved", getApprovedReviews);
router.get("/all", getAllReviews);
router.post("/", submitReview);
router.patch("/:id/moderate", moderateReview);
router.delete("/:id", deleteReview);

export default router;

