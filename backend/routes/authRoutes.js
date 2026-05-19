const express = require("express");
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, uploadProfilePicture, saveWalletAddress } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/upload-avatar", protect, upload.single("profileImage"), uploadProfilePicture);
router.post("/save-wallet", protect, saveWalletAddress);

module.exports = router;