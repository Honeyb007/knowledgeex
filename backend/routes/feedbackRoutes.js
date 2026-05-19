const express = require("express");
const router = express.Router();
const {
  leaveFeedback,
  getTutorFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

// Protected route (login required)
router.post("/leave", protect, leaveFeedback);

// Public route (no login required)
router.get("/tutor/:tutorId", getTutorFeedback);

module.exports = router;