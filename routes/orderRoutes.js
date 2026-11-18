import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  dispatchOrder,
  updateOrderDetails,
  deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrderDetails);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/dispatch", dispatchOrder);
router.delete("/:id", deleteOrder);

export default router;

