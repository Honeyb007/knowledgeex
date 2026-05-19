const TutorProfile = require("../models/TutorProfile");
const User = require("../models/User");

// CREATE TUTOR PROFILE
const createTutorProfile = async (req, res) => {
  try {
    // Check if user is actually a tutor
    if (req.user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can create a profile" });
    }

    // Check if profile already exists
    const existing = await TutorProfile.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Tutor profile already exists" });
    }

    const { bio, courses, hourlyRate, availability } = req.body;

    // Get department and level from the user's account
    const user = await User.findById(req.user.id);

    const profile = await TutorProfile.create({
      user: req.user.id,
      bio,
      department: user.department,
      level: user.level,
      courses,
      hourlyRate,
      availability,
    });

    res.status(201).json({ message: "Tutor profile created", profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET MY TUTOR PROFILE
const getMyProfile = async (req, res) => {
  try {
    const profile = await TutorProfile.findOne({ user: req.user.id }).populate(
      "user",
      "firstName lastName matricNo email department level walletAddress profileImage"
    );

    if (!profile) {
      const user = await User.findById(req.user.id).select(
        "firstName lastName matricNo email department level walletAddress profileImage"
      );

      return res.status(200).json({
        _id: user._id,
        user,
        bio: "",
        hourlyRate: 0,
        availability: "",
        courses: [],
        rating: 0,
        totalSessions: 0,
      });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE TUTOR PROFILE
const updateTutorProfile = async (req, res) => {
  try {
    const { bio, courses, hourlyRate, availability } = req.body;

    const user = await User.findById(req.user.id).select("department level");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await TutorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        user: req.user.id,
        bio,
        courses,
        hourlyRate,
        availability,
        department: user.department,
        level: user.level,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({ message: "Profile updated", profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL TUTORS (for marketplace)
const getAllTutors = async (req, res) => {
  try {
    const tutors = await TutorProfile.find().populate(
    "user",
    "firstName lastName department level walletAddress profileImage"
);

    res.status(200).json(tutors);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET SINGLE TUTOR BY ID
const getTutorById = async (req, res) => {
  try {
    const profile = await TutorProfile.findById(req.params.id).populate(
    "user",
    "firstName lastName department level walletAddress profileImage"
);

    if (!profile) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTutorProfile,
  getMyProfile,
  updateTutorProfile,
  getAllTutors,
  getTutorById,
};