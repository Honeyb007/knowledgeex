const Feedback = require("../models/Feedback");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");

// LEAVE FEEDBACK (Learner reviews tutor after completed session)
const leaveFeedback = async (req, res) => {
  try {
    if (req.user.role !== "learner") {
      return res.status(403).json({ message: "Only learners can leave feedback" });
    }

    const { bookingId, rating, comment } = req.body;

    // Check booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Can only review completed sessions" });
    }

    if (booking.learner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if feedback already exists for this booking
    const existing = await Feedback.findOne({ booking: bookingId });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this session" });
    }

    // Create feedback
    const feedback = await Feedback.create({
      booking: bookingId,
      learner: req.user.id,
      tutor: booking.tutor,
      rating,
      comment,
    });

    // Update booking with feedback reference
    await Booking.findByIdAndUpdate(bookingId, { feedback: feedback._id });

    // Update tutor's average rating
    const allFeedback = await Feedback.find({ tutor: booking.tutor });
    const avgRating =
      allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;

    await TutorProfile.findOneAndUpdate(
      { user: booking.tutor },
      { rating: Math.round(avgRating * 10) / 10 }
    );

    res.status(201).json({ message: "Feedback submitted", feedback });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET TUTOR FEEDBACK (Anyone can view a tutor's reviews)
const getTutorFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ tutor: req.params.tutorId })
      .populate("learner", "firstName lastName department level")
      .sort({ createdAt: -1 });

    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { leaveFeedback, getTutorFeedback };