const mongoose = require("mongoose");

const tutorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  courses: {
    type: [String],
    required: true,
  },
  hourlyRate: {
    type: Number,
    required: true,
  },
  availability: {
    type: String,
    default: "",
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalSessions: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TutorProfile", tutorProfileSchema);