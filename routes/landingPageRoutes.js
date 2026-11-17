import express from "express";
import {
  getLandingPage,
  getAdminLandingPage,
  updateLandingPage,
  reorderSections,
  toggleSection
} from "../controllers/landingPageController.js";

const router = express.Router();

// Public customer endpoint (only visible sections, published page)
router.get("/:slug", getLandingPage);

// Admin endpoints (drafts, full sections, toggles, reordering)
router.get("/admin/:slug", getAdminLandingPage);
router.put("/admin/:slug", updateLandingPage);
router.post("/admin/:slug/reorder", reorderSections);
router.patch("/admin/:slug/sections/:sectionId/toggle", toggleSection);

export default router;

