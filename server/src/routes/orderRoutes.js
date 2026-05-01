import express from "express";
import {
  createOrder,
  getAnalytics,
  getOrderById,
  getOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", asyncHandler(createOrder));
router.get("/analytics", protect, asyncHandler(getAnalytics));
router.get("/", protect, asyncHandler(getOrders));
router.get("/:id", asyncHandler(getOrderById));
router.patch("/:id/status", protect, asyncHandler(updateOrderStatus));

export default router;
