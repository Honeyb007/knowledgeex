const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, matricNo, email, password, level, role, department } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingMatric = await User.findOne({ matricNo });
    if (existingMatric) {
      return res.status(400).json({ message: "Matric number already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      matricNo,
      email,
      password: hashedPassword,
      level,
      role,
      department,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      status: "ok",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        matricNo: user.matricNo,
        email: user.email,
        level: user.level,
        role: user.role,
        department: user.department,
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: "error", error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: "error", error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      status: "ok",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        matricNo: user.matricNo,
        email: user.email,
        level: user.level,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: error.message });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account with that email found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 30 * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"KnowledgeEx" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #2563eb;">KnowledgeEx Password Reset</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested a password reset. Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetLink}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#2563eb; color:white; border-radius:8px; text-decoration:none; font-weight:600;">Reset Password</a>
          <p style="margin-top:24px; color:#475569; font-size:13px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetToken = "";
    user.resetTokenExpiry = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// UPLOAD PROFILE PICTURE
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload buffer directly to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "knowledgeex/avatars",
          transformation: [{ width: 300, height: 300, crop: "fill" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Save image URL to user
    await User.findByIdAndUpdate(req.user.id, { profileImage: result.secure_url });

    res.status(200).json({
      message: "Profile picture updated",
      profileImage: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// SAVE WALLET ADDRESS
const saveWalletAddress = async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        await User.findByIdAndUpdate(req.user.id, { walletAddress });

        res.status(200).json({ message: "Wallet address saved", walletAddress });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports = { registerUser, loginUser, forgotPassword, resetPassword, uploadProfilePicture, saveWalletAddress };