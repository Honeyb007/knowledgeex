const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  matricNo: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  level: {
  type: String,
  enum: ["100", "200", "300", "400", "500"],
  required: true,
},
  role: {
    type: String,
    enum: ["learner", "tutor"],
    required: true,
  },
  department: {
  type: String,
  required: true,
},
  profileImage: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
  type: String,
  default: "",
},
resetTokenExpiry: {
  type: Date,
  default: null,
},
walletAddress: {
    type: String,
    default: "",
},
});


module.exports = mongoose.model("User", userSchema);