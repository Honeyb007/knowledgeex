const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tutorProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TutorProfile",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    default: 1,
    min: 1,
    max: 6,
},
  status: {
    type: String,
    enum: ["pending", "scheduled", "awaiting_confirmation", "completed", "declined", "refunded"],
    default: "pending",
  },
  txHash: {
    type: String,
    default: "",
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Feedback",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);