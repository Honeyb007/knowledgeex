const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first'); // Forces IPv4 lookup
dns.setServers(['1.1.1.1', '8.8.8.8']); // Forces Cloudflare and Google DNS
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const tutorRoutes = require("./routes/tutorRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tutors", tutorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/feedback", feedbackRoutes);





// Test route
app.get("/", (req, res) => {
  res.send("Peer Tutor API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});