import express from "express";
import { createPaymentOrder } from "../controllers/paymentController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.post("/razorpay-order", asyncHandler(createPaymentOrder));

export default router;
