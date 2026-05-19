const express = require("express");
const router = express.Router();
const {
  createBooking,
  getLearnerBookings,
  getTutorBookings,
  acceptBooking,
  declineBooking,
  markComplete,
  confirmSession,
  fundBooking,
 cancelBooking,
 refundBooking
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");


// All booking routes are protected
router.post("/create", protect, createBooking);
router.get("/my-bookings", protect, getLearnerBookings);
router.get("/tutor-requests", protect, getTutorBookings);
router.put("/:id/accept", protect, acceptBooking);
router.put("/:id/decline", protect, declineBooking);
router.put("/:id/complete", protect, markComplete);
router.put("/:id/confirm", protect, confirmSession);
router.put("/:id/fund", protect, fundBooking);
router.delete("/:id/cancel", protect, cancelBooking);
router.put("/:id/refund", protect, refundBooking);
module.exports = router;