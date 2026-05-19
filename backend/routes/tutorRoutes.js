const express = require("express");
const router = express.Router();
const {
  createTutorProfile,
  getMyProfile,
  updateTutorProfile,
  getAllTutors,
  getTutorById,
} = require("../controllers/tutorController");
const { protect } = require("../middleware/authMiddleware");

// Protected routes (login required)
router.post("/create", protect, createTutorProfile);
router.get("/me/profile", protect, getMyProfile);
router.put("/me/update", protect, updateTutorProfile);

// Public routes (no login required)
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

module.exports = router;