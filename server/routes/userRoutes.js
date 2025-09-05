const express = require("express");
const {
  getProfile,
  updateProfile,
  getUserStats,
  getUnreadMessages,
  changePassword,
  requestPasswordOtp,
  resetPasswordWithOtp,
  searchUsers,
  getUserById,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// User stats & profile
router.get("/me/stats", protect, getUserStats);
router.get("/messages/unread", protect, getUnreadMessages);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Admin-only: fetch another user by ID
router.get("/search", protect, searchUsers); // 🔐 should be protected
router.get("/:id", protect, adminOnly, getUserById);

// Password routes
router.post("/password/change", protect, changePassword);
router.post("/password/request-otp", protect, requestPasswordOtp); // ❌ don’t need protect here
router.post("/password/reset-otp", protect, resetPasswordWithOtp); // ❌ don’t need protect here

// Search users

module.exports = router;
