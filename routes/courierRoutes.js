import express from "express";
import {
  getCourierProviders,
  createConsignment,
  updateTrackingStatus
} from "../controllers/courierController.js";

const router = express.Router();

router.get("/providers", getCourierProviders);
router.post("/consignment", createConsignment);
router.post("/track/update", updateTrackingStatus);

export default router;

