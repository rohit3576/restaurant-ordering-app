import express from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getAllMenu,
  getMenu,
  updateMenuItem
} from "../controllers/menuController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", asyncHandler(getMenu));
router.get("/admin", protect, asyncHandler(getAllMenu));
router.post("/", protect, asyncHandler(createMenuItem));
router.patch("/:id", protect, asyncHandler(updateMenuItem));
router.delete("/:id", protect, asyncHandler(deleteMenuItem));

export default router;
