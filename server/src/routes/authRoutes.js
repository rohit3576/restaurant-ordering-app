import express from "express";
import { loginAdmin } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.post("/login", asyncHandler(loginAdmin));

export default router;
